const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farmerName: String,
  farmerPhone: String,
  equipmentId: String,
  equipmentName: String,
  category: String,
  owner: String,
  ownerPhone: String,
  location: String,
  landmark: { type: String, default: '' },
  date: Date,
  quantity: Number, // hours or acres
  unit: { type: String, enum: ['hour', 'acre'], default: 'hour' },
  timeSlot: String,
  price: Number,
  amount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'confirmed', 'arrived', 'in_progress', 'pending_final_payment', 'completed', 'rejected', 'cancelled'], 
    default: 'pending' 
  },
  note: String,
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  isDisputed: { type: Boolean, default: false },
  advanceAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  currentLocation: {
    lat: Number,
    lng: Number
  }
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)
