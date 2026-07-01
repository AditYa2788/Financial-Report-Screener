const express = require('express');
const router = express.Router();
const TrendingKeyword = require('../models/TrendingKeyword');
const Filing = require('../models/Filing');

// GET /api/keywords/trending?date=YYYY-MM-DD&limit=30
router.get('/trending', async (req, res) => {
  try {
    const { date, limit = 30 } = req.query;
    let keywords;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      keywords = await TrendingKeyword.find({ date: { $gte: start, $lt: end } })
        .sort({ score: -1 })
        .limit(parseInt(limit));
    } else {
      const latest = await TrendingKeyword.findOne().sort({ date: -1 });
      if (!latest) return res.json({ keywords: [], date: null });

      const start = new Date(latest.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      keywords = await TrendingKeyword.find({ date: { $gte: start, $lt: end } })
        .sort({ score: -1 })
        .limit(parseInt(limit));
    }

    res.json({ keywords, date: keywords[0]?.date || null, count: keywords.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/keywords/history?term=revenue&days=30
router.get('/history', async (req, res) => {
  try {
    const { term, days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    if (term) {
      const data = await TrendingKeyword.find({
        term: term.toLowerCase(),
        date: { $gte: since }
      }).sort({ date: 1 });
      return res.json({ term, data });
    }

    const data = await TrendingKeyword.aggregate([
      { $match: { date: { $gte: since } } },
      { $sort: { date: -1, score: -1 } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        topTerms: { $push: { term: '$term', score: '$score', filingCount: '$filingCount' } }
      }},
      { $project: { date: '$_id', topTerms: { $slice: ['$topTerms', 10] }, _id: 0 } },
      { $sort: { date: -1 } },
      { $limit: parseInt(days) }
    ]);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/keywords/compute  (also called by cron)
router.post('/compute', async (req, res) => {
  try {
    await computeTrendingKeywords();
    res.json({ message: 'Trending keywords computed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function computeTrendingKeywords() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = new Date(today);
  since.setDate(since.getDate() - 7);

  const filings = await Filing.find({
    filedAt: { $gte: since },
    processingStatus: 'completed'
  }).select('topKeywords ticker filedAt');

  if (!filings.length) return;

  const map = {};
  filings.forEach(f => {
    f.topKeywords.forEach(({ term, score }) => {
      if (!map[term]) map[term] = { total: 0, count: 0, companies: [] };
      map[term].total += score;
      map[term].count++;
      if (f.ticker && !map[term].companies.includes(f.ticker))
        map[term].companies.push(f.ticker);
    });
  });

  const ops = Object.entries(map).map(([term, d]) => ({
    updateOne: {
      filter: { date: today, term },
      update: { $set: { date: today, term, score: d.total / d.count, filingCount: d.count, companies: d.companies } },
      upsert: true
    }
  }));

  if (ops.length) await TrendingKeyword.bulkWrite(ops);
  console.log(`Computed ${ops.length} trending keywords`);
}

module.exports = router;
module.exports.computeTrendingKeywords = computeTrendingKeywords;
