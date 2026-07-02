const mongoose = require('mongoose');

const paragraphSchema = new mongoose.Schema({
  filingId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Filing', index: true },
  accessionNumber: { type: String, index: true },
  cik:             String,
  ticker:          { type: String, index: true },
  companyName:     String,
  filingType:      { type: String, index: true },
  filedAt:         { type: Date,   index: true },
  index:           Number,
  text:            String,
  wordCount:       Number
}, { timestamps: true });

module.exports = mongoose.model('Paragraph', paragraphSchema);
