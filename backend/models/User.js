// 

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: '' },
  location: String,
  businessName: String,
  factoryName: String,
  hasDeliveryService: { type: Boolean, default: false },
  googleId: { type: String, unique: true, sparse: true },
  image: String,
  bio: String,
  otp: String,
  otpExpires: Date,
  strikes: { type: Number, default: 0 },
  isBlacklisted: { type: Boolean, default: false }
}, { timestamps: true })

// 🔐 password hash
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// 🔑 password match
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)