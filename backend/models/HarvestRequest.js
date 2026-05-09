const mongoose = require('mongoose');

const HarvestRequestSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: String,
  farmerPhone: String,
  location: String,
  district: {
    type: String,
    required: true
  },
  photo: String, // Base64 or URL
  area: String, // e.g. "2 Acre"
  variety: String, // e.g. "86032"
  status: {
    type: String,
    enum: ['pending', 'accepted', 'finalized', 'rejected'],
    default: 'pending'
  },
  requestedFactories: [{
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    acceptedAt: Date
  }],
  finalFactoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HarvestRequest', HarvestRequestSchema);