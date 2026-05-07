const mongoose = require('mongoose')

const factorySchema = new mongoose.Schema({
  name:        { type: String, required: true },
  district:    { type: String, required: true },
  taluka:      { type: String, required: true },
  fullAddress: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  frpRate:     { type: Number, required: true },
  prevFrpRate: { type: Number, default: 0 },
  rating:      { type: Number, default: 4.0 },
  reviews:     { type: Number, default: 0 },
  capacity:    { type: String, default: '' },
  payment:     { type: String, default: '14 days' },
  contact:     { type: String, default: '' },
  isOpen:      { type: Boolean, default: true },
  toliSize:    { type: Number, default: 10 },
  machinery:   { type: String, default: 'Manual' },
  variety:     [String],
  established: { type: String, default: '' },
  photo:       { type: String, default: '' },
  description: { type: String, default: '' },
  tags:        [String],
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:      { 
    type: String, 
    enum: ['unclaimed', 'pending_verification', 'verified'], 
    default: 'unclaimed' 
  },
  verificationDocs: [String] // URLs to uploaded licenses/ID
}, { timestamps: true })

module.exports = mongoose.model('Factory', factorySchema)