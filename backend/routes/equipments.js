const express = require('express')
const Equipment = require('../models/Equipment')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/equipments
// @desc    Get all equipments (with search/filter)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query
    let query = {}
    
    if (category && category !== 'all') query.category = category
    if (search) query.name = { $regex: search, $options: 'i' }
    
    const equipments = await Equipment.find(query).populate('owner', 'name').sort({ rating: -1 })
    const sanitized = equipments.map(e => {
      const obj = e.toObject()
      // If shopName is default or missing, use the old ownerName which had the business name
      const oldName = obj.ownerName
      obj.ownerName = obj.owner?.name || oldName
      obj.shopName = (obj.shopName && obj.shopName !== 'Krishi Mart') ? obj.shopName : oldName
      obj.price = obj.price || obj.pricePerHour || obj.rate || 0
      return obj
    })
    res.json(sanitized)
  } catch (err) {
    console.error('Fetch Equipments Error:', err)
    res.status(500).json({ message: err.message })
  }
})

// @route   GET /api/equipments/my
// @desc    Get owner's own equipments
router.get('/my', protect, async (req, res) => {
  try {
    const equipments = await Equipment.find({ owner: req.user._id }).populate('owner', 'name')
    const sanitized = equipments.map(e => {
      const obj = e.toObject()
      const oldName = obj.ownerName
      obj.ownerName = obj.owner?.name || oldName
      obj.shopName = (obj.shopName && obj.shopName !== 'Krishi Mart') ? obj.shopName : oldName
      obj.price = obj.price || obj.pricePerHour || obj.rate || 0
      return obj
    })
    res.json(sanitized)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// @route   POST /api/equipments
// @desc    Register new equipment
router.post('/', protect, authorize('equipment_owner'), async (req, res) => {
  try {
    const { name, category, location, price, experience, features, description, district, taluka, icon, pincode } = req.body
    
    const equipment = await Equipment.create({
      owner: req.user._id,
      ownerName: req.user.name || 'Verified Owner',
      shopName: req.user.shopName || req.user.name || 'Krishi Mart',
      ownerPhone: req.user.phone || 'Contact via App',
      name,
      category,
      location,
      district,
      taluka,
      pincode,
      price,
      experience,
      features,
      description,
      icon: icon || '🚜'
    })
    
    res.status(201).json(equipment)
  } catch (err) {
    console.error('Equipment Registration Error:', err)
    res.status(400).json({ message: err.message })
  }
})

// @route   PUT /api/equipments/:id
// @desc    Update equipment details
router.put('/:id', protect, async (req, res) => {
  try {
    let equipment = await Equipment.findById(req.params.id)
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' })
    
    if (equipment.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    
    res.json(equipment)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// @route   DELETE /api/equipments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' })
    
    if (equipment.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    
    await equipment.deleteOne()
    res.json({ message: 'Removed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
