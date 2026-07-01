const mongoose = require('mongoose');

const trendingKeywordSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  term: { type: String, required: true },
  score: Number,
  filingCount: Number,
  companies: [String]
}, { timestamps: true });

trendingKeywordSchema.index({ date: -1, score: -1 });
trendingKeywordSchema.index({ date: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('TrendingKeyword', trendingKeywordSchema);
