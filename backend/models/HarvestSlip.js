const mongoose = require('mongoose')

const harvestSlipSchema = new mongoose.Schema({
  requestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'HarvestRequest', required: true },
  farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  factoryId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slipNumber:  { type: String, unique: true },
  vehicleNo:   { type: String, required: true },
  grossWeight: { type: Number, required: true },
  tareWeight:  { type: Number, required: true },
  netWeight:   { type: Number, required: true },
  cropType:    { type: String, default: 'Sugarcane' },
  date:        { type: Date, default: Date.now },
  status:      { type: String, enum: ['generated', 'paid'], default: 'generated' }
}, { timestamps: true })

module.exports = mongoose.model('HarvestSlip', harvestSlipSchema)
