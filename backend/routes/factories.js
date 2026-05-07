const express  = require('express')
const Factory  = require('../models/Factory')
const FactoryMember = require('../models/FactoryMember')
const { protect, ownerOnly } = require('../middleware/auth')

const router = express.Router()

// Seed data removed for clean DB
/*
const seedFactories = [ ... ]
const seedIfNeeded = async () => { ... }
*/

router.get('/', async (req, res) => {
  try {
    const { district } = req.query
    const query = { isOpen: true }
    if (district) query.district = district

    // 1. Get dedicated factory records
    const factories = await Factory.find(query).sort({ frpRate: -1 })
    
    // 2. Also get users who are registered as 'factory_owner' 
    const User = require('../models/User')
    const ownerQuery = { role: 'factory_owner' }
    if (district) ownerQuery.district = district

    const factoryOwners = await User.find(ownerQuery)
    
    // Map users to a format compatible with the factory list
    const userFactories = factoryOwners.map(u => ({
      _id: u._id,
      name: u.businessName || u.factoryName || u.name,
      district: u.district,
      fullAddress: u.location,
      coordinates: u.coordinates || { lat: 18.5204, lng: 73.8567 }, // Pune default
      isOpen: true,
      frpRate: u.frpRate || 0,
      ownerId: u._id
    }))

    // Combine and remove duplicates by name 
    const combined = [...factories]
    userFactories.forEach(uf => {
      if (!combined.some(f => f.name === uf.name)) {
        combined.push(uf)
      }
    })

    res.json(combined)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/all', protect, async (req, res) => {
  try {
    // await seedIfNeeded() // Seeding disabled
    const factories = await Factory.find().sort({ frpRate: -1 })
    res.json(factories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/', protect, ownerOnly, async (req, res) => {
  try {
    const factory = await Factory.create({ ...req.body, ownerId: req.user._id })
    res.status(201).json(factory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const factory = await Factory.findOneAndUpdate({ _id: req.params.id, ownerId: req.user._id }, req.body, { new: true })
    if (!factory) return res.status(404).json({ message: 'Factory sapdali nahi!' })
    res.json(factory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ─── Membership Routes ─────────────────────────────────────

// Apply for membership/shares
router.post('/:id/apply-membership', protect, async (req, res) => {
  try {
    const application = await FactoryMember.create({
      ...req.body,
      factoryId: req.params.id,
      farmerId: req.user._id,
      status: 'pending'
    })
    res.status(201).json(application)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get my memberships
router.get('/my-memberships', protect, async (req, res) => {
  try {
    const list = await FactoryMember.find({ farmerId: req.user._id }).populate('factoryId', 'name')
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get all membership requests for a factory (Owner only)
router.get('/:id/applications', protect, ownerOnly, async (req, res) => {
  try {
    const list = await FactoryMember.find({ factoryId: req.params.id }).populate('farmerId', 'name phone location')
    res.json(list)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router