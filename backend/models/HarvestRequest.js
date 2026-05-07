const mongoose = require('mongoose')

const harvestRequestSchema = new mongoose.Schema({
  farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName:  { type: String, required: true },
  farmerPhone: { type: String, required: true },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  factoryId:   { type: String, required: true },
  factoryName: { type: String, required: true },
  cropType:    { type: String, required: true },
  acres:       { type: Number, required: true },
  date:        { type: Date,   required: true },
  village:     { type: String, required: true },
  location:    { type: String, default: '' },
  notes:       { type: String, default: '' },
  photo:       { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'scheduled', 'harvesting', 'completed', 'rejected', 'cancelled'], default: 'pending' },
  estimatedTons: { type: Number, default: 0 },
  actualTons:    { type: Number, default: 0 },
  toliName:      { type: String, default: '' },
  scheduledDate: { type: Date },
  factoryNote:   { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('HarvestRequest', harvestRequestSchema)