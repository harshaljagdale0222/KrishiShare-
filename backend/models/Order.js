const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name:      String,
  icon:      String,
  price:     Number,
  qty:       Number,
})

const orderSchema = new mongoose.Schema({
  farmerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  farmerName:    String,
  farmerPhone:   String,
  address:       String,
  landmark:      { type: String, default: '' },
  items:         [orderItemSchema],
  totalAmount:   Number,
  deliveryCharge:{ type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  finalAmount:   Number,
  payment:       { type: String, enum: ['cod', 'upi', 'card'], default: 'cod' },
  currentLocation: {
    lat: { type: Number, default: 18.5204 }, // Default Pune coordinates
    lng: { type: Number, default: 73.8567 }
  },
  origin: {
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 }
  },
  destination: {
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 }
  },
  status:        { type: String, enum: ['pending', 'accepted', 'packing', 'out_for_delivery', 'delivered', 'rejected'], default: 'pending' },
  advancePaid:   { type: Boolean, default: false },
  advanceAmount: { type: Number, default: 0 },
  billGenerated: { type: Boolean, default: false },
  note:          { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)