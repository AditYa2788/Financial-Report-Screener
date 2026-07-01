const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  cik: { type: String, required: true, unique: true, index: true },
  ticker: { type: String, index: true },
  name: { type: String, required: true },
  sic: String,
  sector: String,
  exchange: String,
  lastFiled: Date,
  filingCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
