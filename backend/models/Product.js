const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  unit: { type: String, required: true },
  weight: { type: Number, default: 0 },
  icon: { type: String, default: '📦' },
  desc: { type: String },
  stock: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  tag: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
