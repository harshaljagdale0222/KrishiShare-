const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  title: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    mr: { type: String, required: true }
  },
  category: {
    en: { type: String, required: true }, // e.g. Subsidy, Loan, Insurance
    mr: { type: String, required: true }
  },
  benefit: {
    en: { type: String },
    mr: { type: String }
  },
  eligibility: {
    en: { type: String },
    mr: { type: String }
  },
  applyUrl: { type: String },
  image: { type: String },
  postedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);
