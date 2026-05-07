const express = require('express')
const Product = require('../models/Product')
const { protect, ownerOnly } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products for the shop
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/products/owner
// @desc    Get products belonging to the logged in owner
router.get('/owner', protect, ownerOnly, async (req, res) => {
  try {
    const products = await Product.find({ ownerId: req.user._id }).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   POST /api/products
// @desc    Create a new product
router.post('/', protect, ownerOnly, async (req, res) => {
  try {
    const { name, category, price, mrp, unit, icon, desc, tag, stock, weight } = req.body
    const product = await Product.create({
      ownerId: req.user._id,
      name, category, price, mrp, unit, icon, desc, tag, weight,
      stock: Number(stock) || 0
    })

    if (req.io) req.io.emit('product_added', product)

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      req.body,
      { new: true }
    )
    if (!product) return res.status(404).json({ message: 'Product sapdala nahi!' })
    
    if (req.io) req.io.emit('product_updated', product)

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id })
    if (!product) return res.status(404).json({ message: 'Product sapdala nahi!' })
    
    if (req.io) req.io.emit('product_deleted', req.params.id)

    res.json({ message: 'Product kadhun takla!' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
