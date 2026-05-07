const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, required: true },
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  factoryName: { type: String, required: true },
  driverName: { type: String }, // New field for equipment/mart complaints
  category: { type: String, default: 'general' }, // factory, equipment, mart, general
  subject: { type: String, required: true }, 
  message: { type: String, required: true },
  toliNumber: { type: String }, 
  status: { type: String, enum: ['pending', 'resolving', 'resolved'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true })

module.exports = mongoose.model('Complaint', complaintSchema)
