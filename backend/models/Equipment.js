const mongoose = require('mongoose')

const equipmentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, default: 'Krishi Share Owner' },
  ownerPhone: { type: String, default: 'N/A' },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['tractor', 'harvester', 'rotavator', 'thresher', 'drone', 'other'],
    required: true 
  },
  icon: { type: String, default: '🚜' },
  location: { type: String, required: true },
  district: { type: String },
  taluka: { type: String },
  pincode: { type: String },
  price: { type: Number, required: true },
  priceUnit: { type: String, enum: ['hour', 'acre'], default: 'hour' },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  experience: { type: String },
  tag: { type: String },
  features: [{ type: String }],
  description: { type: String }
}, { timestamps: true, collection: 'equipment' })

module.exports = mongoose.model('Equipment', equipmentSchema)
