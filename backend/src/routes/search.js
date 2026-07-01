const express = require('express');
const router = express.Router();
const Filing = require('../models/Filing');
const tfidf = require('../processors/tfidf');
const { searchParagraphs } = require('../processors/cosineSimilarity');
const { processText } = require('../processors/textProcessor');

// GET /api/search?q=supply+chain&company=AAPL&dateFrom=2023-01-01&limit=20
router.get('/', async (req, res) => {
  try {
    const { q, company, dateFrom, dateTo, limit = 20, type } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ error: 'q is required' });

    const filter = { processingStatus: 'completed' };
    if (company) filter.ticker = company.toUpperCase();
    if (type) filter.filingType = type;
    if (dateFrom || dateTo) {
      filter.filedAt = {};
      if (dateFrom) filter.filedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.filedAt.$lte = new Date(dateTo);
    }

    const filings = await Filing.find(filter)
      .sort({ filedAt: -1 })
      .limit(50)
      .select('accessionNumber cik companyName ticker filingType filedAt paragraphs topKeywords');

    if (!filings.length) return res.json({ results: [], query: q, total: 0, filingsSearched: 0 });

    // Warm up the IDF state by building a mini-corpus from all stored vectors
    // We use the union of all terms across fetched filings as a proxy
    const allTermSets = [];
    filings.forEach(f => {
      f.paragraphs.forEach(p => {
        if (p.tfidfVector) allTermSets.push(Object.keys(p.tfidfVector));
      });
    });
    // Build IDF with total doc count = number of paragraphs seen
    if (allTermSets.length) {
      tfidf.totalDocuments = allTermSets.length;
      const df = {};
      allTermSets.forEach(terms => {
        new Set(terms).forEach(t => { df[t] = (df[t] || 0) + 1; });
      });
      tfidf.documentFrequency = df;
    }

    const all = [];
    for (const filing of filings) {
      const paras = filing.paragraphs.map(p => ({
        index: p.index,
        text: p.text,
        tfidfVector: p.tfidfVector || {},
        wordCount: p.wordCount
      }));
      if (!paras.length) continue;

      const hits = searchParagraphs(q, paras, 3);
      hits.forEach(h => {
        all.push({
          filingId: filing._id,
          accessionNumber: filing.accessionNumber,
          companyName: filing.companyName,
          ticker: filing.ticker,
          filingType: filing.filingType,
          filedAt: filing.filedAt,
          paragraphIndex: h.index,
          text: h.text,
          similarity: parseFloat(h.similarity.toFixed(4)),
          wordCount: h.wordCount
        });
      });
    }

    all.sort((a, b) => b.similarity - a.similarity);
    const results = all.slice(0, +limit);

    res.json({ results, query: q, total: results.length, filingsSearched: filings.length });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search/filing/:accessionNumber?q=margin+growth
router.get('/filing/:accessionNumber', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });

    const filing = await Filing.findOne({ accessionNumber: req.params.accessionNumber });
    if (!filing) return res.status(404).json({ error: 'Filing not found' });

    // Rebuild IDF from this filing's paragraphs
    const allTermSets = filing.paragraphs.map(p => Object.keys(p.tfidfVector || {}));
    tfidf.totalDocuments = allTermSets.length;
    const df = {};
    allTermSets.forEach(terms => {
      new Set(terms).forEach(t => { df[t] = (df[t] || 0) + 1; });
    });
    tfidf.documentFrequency = df;

    const paras = filing.paragraphs.map(p => ({
      index: p.index,
      text: p.text,
      tfidfVector: p.tfidfVector || {},
      wordCount: p.wordCount
    }));

    const results = searchParagraphs(q, paras, 10);
    res.json({
      filing: {
        accessionNumber: filing.accessionNumber,
        companyName: filing.companyName,
        ticker: filing.ticker,
        filedAt: filing.filedAt,
        filingType: filing.filingType
      },
      results: results.map(r => ({ ...r, similarity: parseFloat(r.similarity.toFixed(4)) })),
      query: q
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
