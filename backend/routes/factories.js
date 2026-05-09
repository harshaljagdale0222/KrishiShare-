const express = require('express');
const router = express.Router();
const Factory = require('../models/Factory');
const { protect, admin } = require('../middleware/auth');

// Get all factories
router.get('/', async (req, res) => {
  try {
    const factories = await Factory.find();
    res.json(factories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new factory (Admin only)
router.post('/', protect, admin, async (req, res) => {
  const factory = new Factory(req.body);
  try {
    const newFactory = await factory.save();
    res.status(201).json(newFactory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete factory (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Factory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Factory deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;