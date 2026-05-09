const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  contact: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Maintenance', 'Closed'], default: 'Active' },
  capacity: { type: String },
  manager: { type: String },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Factory', factorySchema);