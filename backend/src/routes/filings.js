const express = require('express');
const router = express.Router();
const Filing = require('../models/Filing');
const Company = require('../models/Company');
const { fetchCompanyFilings, fetchFilingDocument } = require('../scrapers/edgarScraper');
const { splitIntoParagraphs } = require('../processors/textProcessor');
const tfidf = require('../processors/tfidf');

// GET /api/filings?page=1&limit=20&company=AAPL&type=10-K
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, company, type } = req.query;
    const filter = { processingStatus: 'completed' };
    if (company) filter.ticker = company.toUpperCase();
    if (type) filter.filingType = type;

    const [filings, total] = await Promise.all([
      Filing.find(filter)
        .sort({ filedAt: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .select('-paragraphs'),
      Filing.countDocuments(filter)
    ]);

    res.json({ filings, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filings/stats/overview
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalFilings, companies, recentFilings] = await Promise.all([
      Filing.countDocuments({ processingStatus: 'completed' }),
      Filing.distinct('ticker', { processingStatus: 'completed' }),
      Filing.find({ processingStatus: 'completed' })
        .sort({ filedAt: -1 })
        .limit(5)
        .select('companyName ticker filedAt filingType topKeywords paragraphCount wordCount')
    ]);
    res.json({ totalFilings, totalCompanies: companies.length, recentFilings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filings/:accessionNumber
router.get('/:accessionNumber', async (req, res) => {
  try {
    const filing = await Filing.findOne({ accessionNumber: req.params.accessionNumber })
      .select('-paragraphs');
    if (!filing) return res.status(404).json({ error: 'Filing not found' });
    res.json(filing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/filings/:accessionNumber/paragraphs?page=1&limit=50
router.get('/:accessionNumber/paragraphs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const filing = await Filing.findOne({ accessionNumber: req.params.accessionNumber })
      .select('paragraphs companyName ticker filedAt accessionNumber');
    if (!filing) return res.status(404).json({ error: 'Filing not found' });

    const start = (+page - 1) * +limit;
    const paras = filing.paragraphs.slice(start, start + +limit).map(p => ({
      index: p.index,
      text: p.text,
      wordCount: p.wordCount
    }));

    res.json({
      accessionNumber: filing.accessionNumber,
      companyName: filing.companyName,
      ticker: filing.ticker,
      paragraphs: paras,
      total: filing.paragraphs.length,
      page: +page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/filings/ingest  { cik, ticker, companyName, formType }
router.post('/ingest', async (req, res) => {
  const { cik, ticker, companyName, formType = '10-K' } = req.body;
  if (!cik) return res.status(400).json({ error: 'cik is required' });
  res.json({ message: 'Ingestion queued', cik, ticker });
  ingestCompany({ cik, ticker, name: companyName }, formType).catch(console.error);
});

async function ingestCompany(company, formType = '10-K') {
  const filingsMeta = await fetchCompanyFilings(company.cik, formType, 3);
  for (const meta of filingsMeta) {
    try {
      const exists = await Filing.findOne({ accessionNumber: meta.accessionNumber });
      if (exists?.processingStatus === 'completed') continue;

      const doc = exists || await Filing.create({
        accessionNumber: meta.accessionNumber,
        cik: company.cik,
        companyName: company.name || meta.companyName,
        ticker: company.ticker || meta.ticker,
        filingType: formType,
        filedAt: new Date(meta.filingDate),
        reportPeriod: meta.reportDate ? new Date(meta.reportDate) : null,
        processingStatus: 'processing'
      });

      const rawText = await fetchFilingDocument(company.cik, meta.accessionNumber, meta.primaryDocument);
      if (!rawText || rawText.length < 500) {
        await Filing.findByIdAndUpdate(doc._id, { processingStatus: 'failed' });
        continue;
      }

      const paras = splitIntoParagraphs(rawText);
      const processed = tfidf.processFilingParagraphs(paras);
      const keywords = tfidf.extractFilingKeywords(processed, 50);

      await Filing.findByIdAndUpdate(doc._id, {
        paragraphs: processed,
        topKeywords: keywords,
        paragraphCount: processed.length,
        wordCount: processed.reduce((s, p) => s + (p.wordCount || 0), 0),
        processedAt: new Date(),
        processingStatus: 'completed'
      });

      await Company.findOneAndUpdate(
        { cik: company.cik },
        { $set: { cik: company.cik, ticker: company.ticker, name: company.name, lastFiled: new Date(meta.filingDate) }, $inc: { filingCount: 1 } },
        { upsert: true }
      );

      console.log(`Ingested: ${meta.accessionNumber} (${company.ticker})`);
    } catch (err) {
      console.error(`Ingest error ${meta.accessionNumber}: ${err.message}`);
    }
  }
}

module.exports = router;
module.exports.ingestCompany = ingestCompany;
