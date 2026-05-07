const express        = require('express')
const HarvestRequest = require('../models/HarvestRequest')
const Notification   = require('../models/Notification')
const { protect, ownerOnly } = require('../middleware/auth')

const router = express.Router()

router.post('/', protect, async (req, res) => {
  try {
    const { factoryId, ownerId, factoryName, cropType, acres, date, village, location, notes, photo } = req.body
    const request = await HarvestRequest.create({ 
      farmerId: req.user._id, 
      ownerId: ownerId || null,
      farmerName: req.user.name, 
      farmerPhone: req.user.phone, 
      factoryId, 
      factoryName, 
      cropType, 
      acres, 
      date, 
      village, 
      location: location || '', 
      notes: notes || '', 
      photo: photo || '' 
    })
    
    // Notify farmer
    const dbNotif = await Notification.create({
      user: req.user._id,
      title: 'Harvest Request Pathavli',
      message: `${factoryName} factory kade request geli aahe.`,
      type: 'harvest',
      link: '/my-bookings'
    })

    // Notify Specific Factory Owner
    if (ownerId) {
      await Notification.create({
        user: ownerId,
        title: 'Navin Harvest Request!',
        message: `${req.user.name} kadvun (Acres: ${acres}) chi request aali aahe.`,
        type: 'harvest',
        link: '/store-dashboard'
      })
    }

    if (req.io) {
      req.io.emit('order_status_update', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'harvest' })
    }

    res.status(201).json(request)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/my', protect, async (req, res) => {
  try {
    const requests = await HarvestRequest.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/factory', protect, ownerOnly, async (req, res) => {
  try {
    // Return requests belonging to THIS owner
    const requests = await HarvestRequest.find({ ownerId: req.user._id }).sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const { status, factoryNote, toliName, scheduledDate, estimatedTons, actualTons } = req.body
    
    const updateData = { status }
    if (factoryNote !== undefined) updateData.factoryNote = factoryNote
    if (toliName !== undefined)    updateData.toliName = toliName
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate
    if (estimatedTons !== undefined) updateData.estimatedTons = estimatedTons
    if (actualTons !== undefined)    updateData.actualTons = actualTons

    const request = await HarvestRequest.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id }, 
      updateData, 
      { new: true }
    )
    
    if (!request) return res.status(404).json({ message: 'Request sapdali nahi!' })

    // Real API Notification for Farmer
    const statusMsg = {
      scheduled: 'scheduled kelay. Toli: ' + (toliName || 'Lavkarach kalvu'),
      harvesting: 'suru zali aahe! 🚜',
      completed: 'sampali aahe. Slip lavkarach milel.',
      accepted: 'svikarly geli aahe.',
      rejected: 'naakarly geli aahe.'
    }

    const dbNotif = await Notification.create({
      user: request.farmerId,
      title: 'Harvest Update: ' + (status.toUpperCase()),
      message: `Tuzy usatoli chi request la ${statusMsg[status] || status}.`,
      type: 'harvest',
      link: '/my-bookings'
    })
    
    if (req.io) {
      req.io.to(request.farmerId.toString()).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'harvest' })
    }

    res.json(request)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GENERATE HARVEST SLIP
const HarvestSlip = require('../models/HarvestSlip')
router.post('/:id/slip', protect, ownerOnly, async (req, res) => {
  try {
    const { vehicleNo, grossWeight, tareWeight } = req.body
    const request = await HarvestRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request sapdali nahi!' })

    const netWeight = grossWeight - tareWeight
    const slipNumber = 'HS' + Date.now().toString().slice(-8)

    const slip = await HarvestSlip.create({
      requestId: request._id,
      farmerId: request.farmerId,
      factoryId: req.user._id,
      slipNumber,
      vehicleNo,
      grossWeight,
      tareWeight,
      netWeight,
      cropType: request.cropType
    })

    // Update request status to completed
    request.status = 'completed'
    request.actualTons = netWeight
    await request.save()

    // Notify Farmer
    const dbNotif = await Notification.create({
      user: request.farmerId,
      title: 'Digital Slip Aali! 📄',
      message: `Tumchy usachi pavti (Slip No: ${slipNumber}) tayaar aahe. Net Weight: ${netWeight} Tons.`,
      type: 'payment',
      link: '/my-bookings'
    })

    if (req.io) {
      req.io.to(request.farmerId.toString()).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'payment' })
    }

    res.status(201).json(slip)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/slips/my', protect, async (req, res) => {
  try {
    const slips = await HarvestSlip.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json(slips)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await HarvestRequest.findOne({ _id: req.params.id, farmerId: req.user._id })
    if (!request) return res.status(404).json({ message: 'Request sapdali nahi!' })
    if (request.status !== 'pending') return res.status(400).json({ message: 'Fakt pending request cancel karta yete!' })
    request.status = 'cancelled'
    await request.save()

    // Real API Notification
    const dbNotif = await Notification.create({
      user: request.farmerId,
      title: 'Tractor Request Cancelled',
      message: `Tu hi request svatahun cancel kelis.`,
      type: 'harvest',
      link: '/my-bookings'
    })

    res.json({ message: 'Request cancel keli!' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router