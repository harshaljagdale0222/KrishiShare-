const express = require('express')
const Complaint = require('../models/Complaint')
const Notification = require('../models/Notification')
const { protect } = require('../middleware/auth')
const mongoose = require('mongoose')

const router = express.Router()

// @route   POST /api/complaints
// @desc    File a new complaint
router.post('/', protect, async (req, res) => {
  try {
    const { factoryId, factoryName, subject, message, toliNumber, priority, driverName, category } = req.body

    // Validate targetId (factoryId) - if it's "manual" or invalid, don't send to DB as ID
    const validTargetId = mongoose.Types.ObjectId.isValid(factoryId) ? factoryId : null

    const complaint = await Complaint.create({
      farmerId: req.user._id,
      farmerName: req.user.name || req.user.email || req.user.phone || 'शेतकरी (Farmer)',
      factoryId: validTargetId,
      factoryName,
      driverName,
      category,
      subject,
      message,
      toliNumber,
      priority
    })

    // Notify Target Owner (Factory/Equipment/Mart) only if we have a valid ID
    if (validTargetId) {
      const dbNotif = await Notification.create({
        user: validTargetId,
        title: 'नवीन तक्रार प्राप्त!',
        message: `${req.user.name || 'शेतकरी'} कडून '${subject}' संदर्भात तक्रार आली आहे.`,
        type: category === 'factory' ? 'harvest' : category === 'equipment' ? 'booking' : 'order',
        link: '/store-dashboard'
      })
      if (req.io) {
        req.io.to(validTargetId).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: dbNotif.type })
      }
    }

    res.status(201).json(complaint)
  } catch (error) {
    console.error('Complaint Error:', error)
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/complaints/my
// @desc    Get farmer's own complaints
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json(complaints)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/complaints/factory
// @desc    Get complaints for the current business owner
router.get('/factory', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      factoryId: req.user._id
    }).sort({ createdAt: -1 })

    res.json(complaints)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/complaints/:id
// @desc    Get single complaint detail
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Complaint ID' })
    }
    const complaint = await Complaint.findById(req.params.id)
    if (!complaint) return res.status(404).json({ message: 'तक्रार सापडली नाही!' })
    res.json(complaint)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/complaints/:id
// @desc    Update complaint status
router.put('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Complaint ID' })
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true })

    if (!complaint) return res.status(404).json({ message: 'तक्रार सापडली नाही!' })

    // Safe Notification Delivery
    if (complaint.farmerId) {
      try {
        const dbNotif = await Notification.create({
          user: complaint.farmerId,
          title: 'तक्रार निवारण अपडेट',
          message: `तुमच्या तक्रारीची स्थिती आता '${status}' आहे.`,
          type: 'harvest',
          link: '/farmer-dashboard'
        })
        if (req.io) {
          req.io.to(complaint.farmerId.toString()).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'harvest' })
        }
      } catch (notifErr) {
        console.error('Notification Error (ignored):', notifErr)
      }
    }

    res.json(complaint)
  } catch (error) {
    console.error('Complaint Update Error:', error)
    res.status(500).json({ message: error.message || 'Internal Server Error' })
  }
})

module.exports = router
