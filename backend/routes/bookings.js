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
    if (equipmentId && date && timeSlot && !isNaN(new Date(date).getTime())) {
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
      try {
        const msg = `Navin Booking Referral: ${booking.farmerName} ne ${booking.equipmentName} sathi request पाठवली आहे. - KrishiShare`;
        await sendSMS(booking.ownerPhone, msg);
      } catch (smsErr) {
        console.error('SMS Notification Failed:', smsErr.message);
      }
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
      // Equipment Owner: Get only their bookings (Using $or for extra safety with ID formats)
      bookings = await Booking.find({ 
        $or: [
          { ownerId: req.user._id },
          { ownerId: req.user._id.toString() }
        ]
      }).sort({ createdAt: -1 });
    }
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE STATUS
router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking sapdali nahi!' })

    // Permission Check: Owner can update anything, Farmer can only update to 'completed' or 'cancelled'
    const isOwner = booking.ownerId?.toString() === req.user._id.toString()
    const isFarmer = booking.farmerId.toString() === req.user._id.toString()

    if (!isOwner && !isFarmer) {
      return res.status(403).json({ message: 'Tu mazi booking update nahi karu shakt!' })
    }

    if (isFarmer && !['pending_final_payment', 'cancelled'].includes(status)) {
      return res.status(403).json({ message: 'Shetkari fkt kam purn mhanun mark karu shakto!' })
    }

    booking.status = status
    await booking.save()

    // Custom Notifications based on Status
    let notifTitle = 'Booking Update 🚜'
    let notifMsg = `तुमच्या ${booking.equipmentName} बुकिंगचे स्टेटस ${status} झाले आहे.`

    if (status === 'accepted') {
      notifTitle = 'बुकिंग स्वीकारली! ✅'
      notifMsg = `तुमची ${booking.equipmentName} बुकिंग स्वीकारली आहे. कृपया अ‍ॅडव्हान्स भरून बुकिंग कन्फर्म करा.`
    } else if (status === 'arrived') {
      notifTitle = 'यंत्र पोहोचले! 🚜'
      notifMsg = `तुमचे ${booking.equipmentName} शेतात पोहोचले आहे. काम सुरू करण्यास सज्ज!`
    } else if (status === 'in_progress') {
      notifTitle = 'काम सुरू झाले! 🌱'
      notifMsg = `${booking.equipmentName} द्वारे काम सुरू झाले आहे.`
    } else if (status === 'pending_final_payment') {
      notifTitle = 'काम पूर्ण झाले! ✅'
      notifMsg = `तुमच्या ${booking.equipmentName} चे काम पूर्ण झाले आहे. कृपया उरलेले पेमेंट पूर्ण करा जेणेकरून व्यवहार पूर्ण होईल.`
    } else if (status === 'completed') {
      notifTitle = 'व्यवहार पूर्ण! 💰'
      notifMsg = `धन्यवाद! तुमचे पूर्ण पेमेंट मिळाले असून ${booking.equipmentName} चे काम यशस्वीरित्या पूर्ण झाले आहे.`
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
      req.io.to(req.user._id.toString()).emit('notification', {
        title: 'Status Updated', message: `Booking for ${booking.equipmentName} is now ${status}.`, type: 'order'
      })
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
    const isFinalPayment = booking.status === 'pending_final_payment' || booking.status === 'completed'

    booking.status = isFinalPayment ? 'completed' : 'confirmed' 
    booking.paymentStatus = isFinalPayment ? 'paid' : 'partial'
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
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking sapdali nahi!' })

    booking.paymentStatus = status
    
    // If work is done and payment is successful, auto-complete
    if (status === 'paid' && (booking.status === 'pending_final_payment' || booking.status === 'in_progress')) {
      booking.status = 'completed'
    }

    await booking.save()
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
    const bookings = await Booking.find({ 
      equipmentId: req.params.equipmentId, 
      status: { $in: ['pending', 'accepted', 'confirmed', 'arrived', 'in_progress', 'pending_final_payment'] } 
    })
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
