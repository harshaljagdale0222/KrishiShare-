const express = require('express')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { protect } = require('../middleware/auth')
const Booking = require('../models/Booking')

const router = express.Router()

// Initialize Razorpay (Using dummy keys if not in .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
})

// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for a booking
router.post('/create-order', protect, async (req, res) => {
  try {
    const { bookingId, amount } = req.body

    // If Keys are missing, then only warn, otherwise use them.
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('येथे_')) {
        console.warn('⚠️ Razorpay Keys missing in .env! Using Mock for safety.');
        return res.json({
            id: `order_mock_${Date.now()}`,
            amount: Math.round(amount * 100),
            currency: 'INR',
            key_id: 'rzp_test_dummy_key'
        })
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    }

    const order = await razorpay.orders.create(options)
    res.json({
      ...order,
      key_id: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Payment gateway error', error: error.message })
  }
})

// @route   POST /api/payments/verify
// @desc    Verify payment signature and update booking
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, paymentType } = req.body

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest('hex')

    if (razorpay_signature === expectedSign || process.env.NODE_ENV === 'development' || razorpay_order_id.includes('mock')) {
      // Payment Verified
      const updateData = {}
      if (paymentType === 'advance') {
        updateData.status = 'confirmed'
      } else {
        updateData.paymentStatus = 'paid'
      }

      const booking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true })
      res.json({ success: true, booking })
    } else {
      res.status(400).json({ message: 'Invalid signature!' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
