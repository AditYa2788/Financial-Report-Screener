const mongoose = require('mongoose');

const filingSchema = new mongoose.Schema({
  accessionNumber: { type: String, required: true, unique: true },
  cik:             { type: String, required: true, index: true },
  companyName:     String,
  ticker:          { type: String, index: true },
  filingType:      { type: String, default: '10-K', index: true },
  filedAt:         { type: Date,   index: true },
  reportPeriod:    Date,
  paragraphCount:  Number,
  wordCount:       Number,
  processedAt:     Date,
  processingStatus: {
    type:    String,
    enum:    ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index:   true
  }
}, { timestamps: true });

filingSchema.index({ ticker: 1, filedAt: -1 });
filingSchema.index({ filingType: 1, filedAt: -1 });

module.exports = mongoose.model('Filing', filingSchema);
