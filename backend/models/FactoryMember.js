const mongoose = require('mongoose')

const factoryMemberSchema = new mongoose.Schema({
  factoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Factory', required: true },
  farmerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharesRequested: { type: Number, default: 1 },
  amountPaid:      { type: Number, required: true },
  status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  documents:       [String], // URLs of Aadhar, 7/12 etc.
  applicationDate: { type: Date, default: Date.now },
  membershipId:    { type: String, default: '' }, // Assigned after approval
}, { timestamps: true })

module.exports = mongoose.model('FactoryMember', factoryMemberSchema)
