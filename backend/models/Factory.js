const mongoose = require('mongoose');

const factorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  taluka: { type: String },
  fullAddress: { type: String },
  contact: { type: String, required: true },
  isOpen: { type: Boolean, default: true },
  frpRate: { type: Number },
  capacity: { type: String },
  rating: { type: Number },
  established: { type: Number },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Factory', factorySchema);