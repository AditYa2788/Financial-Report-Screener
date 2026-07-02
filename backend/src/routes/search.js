const express = require('express');
const router = express.Router();
const Paragraph = require('../models/Paragraph');
const { cacheGet, cacheSet } = require('../config/redis');

// GET /api/search?q=supply+chain&company=AAPL&type=10-K&dateFrom=2023-01-01&limit=20
router.get('/', async (req, res) => {
  try {
    const { q, company, dateFrom, dateTo, limit = 20, type } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ error: 'q is required' });

    const cacheKey = `search:${q.trim().toLowerCase()}:${company||''}:${type||''}:${dateFrom||''}:${dateTo||''}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    // Atlas Search full-text stage (Lucene english analyzer handles stemming + stop words)
    const pipeline = [
      {
        $search: {
          index: 'paragraph_text',
          text: { query: q.trim(), path: 'text', fuzzy: { maxEdits: 1 } }
        }
      },
      { $addFields: { score: { $meta: 'searchScore' } } }
    ];

    // Post-search filters
    const matchFilter = {};
    if (company)  matchFilter.ticker     = company.toUpperCase();
    if (type)     matchFilter.filingType = type;
    if (dateFrom || dateTo) {
      matchFilter.filedAt = {};
      if (dateFrom) matchFilter.filedAt.$gte = new Date(dateFrom);
      if (dateTo)   matchFilter.filedAt.$lte = new Date(dateTo);
    }
    if (Object.keys(matchFilter).length) pipeline.push({ $match: matchFilter });

    pipeline.push({ $limit: +limit });
    pipeline.push({
      $project: {
        text: 1, ticker: 1, companyName: 1, filingType: 1,
        filedAt: 1, accessionNumber: 1, index: 1, score: 1, wordCount: 1
      }
    });

    const results = await Paragraph.aggregate(pipeline);
    const payload = { results, query: q, total: results.length };
    await cacheSet(cacheKey, payload);
    res.json(payload);
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

    const results = await Paragraph.aggregate([
      {
        $search: {
          index: 'paragraph_text',
          text: { query: q.trim(), path: 'text', fuzzy: { maxEdits: 1 } }
        }
      },
      { $addFields: { score: { $meta: 'searchScore' } } },
      { $match: { accessionNumber: req.params.accessionNumber } },
      { $limit: 10 },
      { $project: { text: 1, index: 1, score: 1, wordCount: 1 } }
    ]);

    res.json({ accessionNumber: req.params.accessionNumber, results, query: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
