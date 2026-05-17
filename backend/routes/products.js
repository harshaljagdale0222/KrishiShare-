const express = require('express')
const Product = require('../models/Product')
const { protect, ownerOnly } = require('../middleware/auth')

const router = express.Router()

// @route   GET /api/products
// @desc    Get all products for the shop
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .populate('ownerId', 'name businessName')
      .sort({ createdAt: -1 })
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
    const { name, category, price, mrp, unit, icon, desc, tag, stock, weight, brand } = req.body
    const product = await Product.create({
      ownerId: req.user._id,
      name, category, price, mrp, unit, icon, desc, tag, weight, brand,
      stock: Number(stock) || 0
    })

    if (req.io) req.io.emit('product_added', product)

    const populatedProduct = await Product.findById(product._id).populate('ownerId', 'name businessName')
    res.status(201).json(populatedProduct)
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

    const populatedProduct = await Product.findById(product._id).populate('ownerId', 'name businessName')
    res.json(populatedProduct)
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

// @route   POST /api/products/:id/rate
// @desc    Rate a product
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { star, comment } = req.body
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product sapdala nahi!' })

    // Add new rating
    product.ratings.push({
      userId: req.user._id,
      userName: req.user.name,
      star: Number(star),
      comment
    })

    // Calculate new average rating
    const totalStars = product.ratings.reduce((sum, r) => sum + r.star, 0)
    product.rating = (totalStars / product.ratings.length).toFixed(1)
    product.reviews = product.ratings.length

    await product.save()
    
    if (req.io) req.io.emit('product_updated', product)

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
