const express = require('express')
const Booking = require('../models/Booking')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { protect, ownerOnly } = require('../middleware/auth')
const { sendSMS } = require('../utils/smsHelper')

const router = express.Router()

// CREATE NEW BOOKING (Simplified back to Original Logic)
router.post('/', protect, async (req, res) => {
  try {
    const { equipmentId, date, timeSlot } = req.body
    
    // 🛡️ Prevent Double-Booking (Check for overlap)
    if (equipmentId && date && timeSlot) {
      const existing = await Booking.findOne({ 
        equipmentId, 
        date: new Date(date), 
        timeSlot,
        status: { $in: ['pending', 'accepted', 'confirmed'] } 
      })
      
      if (existing) {
        return res.status(400).json({ message: 'Shama krave, ha slot adhich book zala aahe! Krupaya dusra vel nivada.' })
      }
    }

    const bookingData = {
      ...req.body,
      landmark: req.body.landmark || '',
      farmerId: req.user._id,
      farmerName: req.user.name,
      farmerPhone: req.user.phone
    }

    const booking = await Booking.create(bookingData)

    // Notify Owner if info is present
    if (booking.ownerPhone) {
      const msg = `Navin Booking Referral: ${booking.farmerName} ne ${booking.equipmentName} sathi request पाठवली आहे. - KrishiShare`;
      await sendSMS(booking.ownerPhone, msg);
    }

    // Standard Notifications
    const dbNotif = await Notification.create({
      user: req.user._id,
      title: 'Booking Request Sent',
      message: `${booking.equipmentName} sathi tumchi request pathavli geli aahe.`,
      type: 'order',
      link: '/my-bookings'
    })

    if (req.io) {
      req.io.to(req.user._id.toString()).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'order' })
      if (booking.ownerId) {
        // Create DB notification for owner
        const ownerNotif = await Notification.create({
          user: booking.ownerId,
          title: 'Navin Booking Aali! 🚜',
          message: `${req.user.name} ने तुमच्या ${booking.equipmentName} साठी विनंती पाठवली आहे.`,
          type: 'order',
          link: '/store-dashboard'
        })
        
        req.io.to(booking.ownerId.toString()).emit('notification', { 
          id: ownerNotif._id,
          title: 'Navin Booking Aali! 🚜', 
          message: `${req.user.name} ne booking keli aahe.`, 
          type: 'order' 
        })
        req.io.to(booking.ownerId.toString()).emit('new_booking', { message: `Navin booking request: ${booking.equipmentName}`, booking })
      }
    }

    res.status(201).json(booking)
  } catch (error) {
    console.error('Booking Create Error:', error)
    res.status(500).json({ message: error.message })
  }
})

// GET MY BOOKINGS
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET ALL BOOKINGS (For owner)
router.get('/all', protect, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      // System Admin: Get EVERYTHING
      bookings = await Booking.find().sort({ createdAt: -1 });
    } else {
      // Equipment Owner: Get only their bookings
      bookings = await Booking.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE STATUS (Owner only)
router.put('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!booking) return res.status(404).json({ message: 'Booking sapdali nahi!' })

    // Custom Notifications based on Status
    let notifTitle = 'Booking Update 🚜'
    let notifMsg = `Tuzya ${booking.equipmentName} booking la ${status} kelay.`

    if (status === 'completed') {
      notifTitle = 'काम पूर्ण झाले! ✅'
      notifMsg = `तुमच्या ${booking.equipmentName} चे काम पूर्ण झाले आहे. कृपया उरलेले पेमेंट पूर्ण करा.`
    }

    const dbNotif = await Notification.create({
      user: booking.farmerId,
      title: notifTitle,
      message: notifMsg,
      type: 'order',
      link: '/my-bookings'
    })

    if (req.io) {
      // Notify Farmer
      req.io.to(booking.farmerId.toString()).emit('notification', {
        id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'order'
      })
      req.io.to(booking.farmerId.toString()).emit('booking_status_updated', booking)
      
      // Notify Owner (Self-confirmation)
      req.io.to(booking.ownerId.toString()).emit('notification', {
        title: 'Status Updated', message: `Work for ${booking.equipmentName} marked as ${status}.`, type: 'order'
      })
      req.io.to(booking.ownerId.toString()).emit('booking_status_updated', booking)
    }

    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ... basic functionality maintained ...
// CONFIRM ADVANCE (Dummy Payment Handler)
router.patch('/:id/confirm-advance', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking sapdali nahi!' })

    // Check if it's the final payment or advance
    const isFinalPayment = booking.status === 'completed'

    booking.status = isFinalPayment ? 'completed' : 'confirmed' 
    booking.paymentStatus = 'paid'
    await booking.save()

    // Notify Farmer about payment receipt
    const farmerNotif = await Notification.create({
      user: booking.farmerId,
      title: isFinalPayment ? 'पूर्ण पेमेंट मिळाले! 💰' : 'ॲडव्हान्स मिळाला! ✅',
      message: isFinalPayment 
        ? `तुमचे पूर्ण पेमेंट मिळाले आहे. ${booking.equipmentName} चे काम यशस्वीरित्या पूर्ण झाले!`
        : `तुमचा ॲडव्हान्स मिळाला आहे. बुकिंग कन्फर्म झाली!`,
      type: 'payment',
      link: '/my-bookings'
    })

    // Notify Owner
    if (booking.ownerId) {
       const ownerNotif = await Notification.create({
         user: booking.ownerId,
         title: isFinalPayment ? 'Full Payment Done! 💰' : 'Booking Confirmed! ✅',
         message: `${booking.farmerName} ने ${isFinalPayment ? 'पूर्ण' : 'ॲडव्हान्स'} पेमेंट केले आहे.`,
         type: 'order',
         link: '/store-dashboard'
       })
       if (req.io) {
         req.io.to(booking.ownerId.toString()).emit('notification', { 
           id: ownerNotif._id,
           title: isFinalPayment ? 'Payment Received!' : 'Booking Confirmed!', 
           message: `${booking.farmerName} ne payment kele aahe.`, 
           type: 'order' 
         })
       }
    }

    if (req.io) {
      req.io.to(booking.farmerId.toString()).emit('notification', { 
        id: farmerNotif._id, title: farmerNotif.title, message: farmerNotif.message, type: 'payment' 
      })
    }

    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// RATE BOOKING
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking sapdali nahi!' })

    booking.rating = rating
    booking.comment = comment
    booking.status = 'completed'
    await booking.save()

    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// UPDATE PAYMENT STATUS
router.patch('/:id/payment', protect, async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { paymentStatus: status }, { new: true })
    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// CANCEL BOOKING
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking sapdala nahi!' })

    // Check permissions
    if (booking.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Tu mazi booking cancel nahi karu shakt!' })
    }

    booking.status = 'cancelled'
    await booking.save()
    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// REPORT FARMER/OWNER (Dummy handlers)
router.post('/:id/report', protect, async (req, res) => {
  res.json({ success: true, message: 'Farmer reported.' })
})
router.post('/:id/report-owner', protect, async (req, res) => {
  res.json({ success: true, message: 'Owner reported.' })
})

router.get('/availability/:equipmentId', async (req, res) => {
  try {
    const bookings = await Booking.find({ equipmentId: req.params.equipmentId, status: { $in: ['pending', 'accepted', 'confirmed'] } })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/bookings/:id/location
router.put('/:id/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { currentLocation: { lat, lng } }, 
      { new: true }
    )
    if (!booking) return res.status(404).json({ message: 'Booking sapdala nahi!' })

    if (req.io) {
      req.io.emit('booking_location_update', {
        bookingId: booking._id,
        lat,
        lng
      })
    }

    res.json(booking)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
