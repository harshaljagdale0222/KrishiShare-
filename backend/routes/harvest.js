const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const HarvestRequest = require('../models/HarvestRequest');
const Notification = require('../models/Notification');

// @route   POST /api/harvest
// @desc    Farmer sends a harvest request to a specific factory
router.post('/', protect, async (req, res) => {
  try {
    const { factoryId, factoryName, ownerId, cropType, acres, date, village, location, notes, photo } = req.body;
    
    const request = await HarvestRequest.create({
      farmerId: req.user._id,
      farmerName: req.user.name,
      farmerPhone: req.user.phone,
      location: location || village || req.user.location || 'Maharashtra',
      district: req.user.district || 'Unknown',
      photo: photo || '',
      area: acres ? `${acres} Acres` : '',
      variety: cropType || '',
      requestedFactories: [{ factoryId: ownerId || factoryId }],
      status: 'pending'
    });

    const targetUserId = ownerId || factoryId;
    if (targetUserId) {
      await Notification.create({
        user: targetUserId,
        title: 'नवीन तोडणी विनंती!',
        message: `${req.user.name} कडून तोडणीसाठी विनंती आली आहे.`,
        type: 'harvest',
        link: '/factory-dashboard'
      });
      if (req.io) {
        req.io.to(targetUserId.toString()).emit('notification', { title: 'नवीन तोडणी विनंती!', message: 'एक नवीन तोडणी विनंती प्राप्त झाली आहे.' });
      }
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/harvest/request
// @desc    Farmer sends harvesting request to multiple factories
router.post('/request', protect, async (req, res) => {
  try {
    const { district, photo, area, variety, factoryIds } = req.body;
    
    const request = await HarvestRequest.create({
      farmerId: req.user._id,
      farmerName: req.user.name,
      farmerPhone: req.user.phone,
      location: req.user.location || 'Maharashtra',
      district,
      photo,
      area,
      variety,
      requestedFactories: factoryIds.map(id => ({ factoryId: id }))
    });

    // Notify each factory
    for (const factoryId of factoryIds) {
      await Notification.create({
        user: factoryId,
        title: 'नवीन तोडणी विनंती!',
        message: `${req.user.name} कडून ${area} ऊस तोडणीसाठी विनंती आली आहे.`,
        type: 'harvest',
        link: '/factory-dashboard'
      });
      if (req.io) {
        req.io.to(factoryId.toString()).emit('notification', { title: 'नवीन तोडणी विनंती!', message: 'एक नवीन तोडणी विनंती प्राप्त झाली आहे.' });
      }
    }

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/harvest/factory
// @desc    Get requests targeted to this factory
router.get('/factory', protect, async (req, res) => {
  try {
    const requests = await HarvestRequest.find({
      'requestedFactories.factoryId': req.user._id
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/harvest/accept/:id
// @desc    Factory accepts a request
router.put('/accept/:id', protect, async (req, res) => {
  try {
    const request = await HarvestRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const factoryIndex = request.requestedFactories.findIndex(
      rf => rf.factoryId.toString() === req.user._id.toString()
    );

    if (factoryIndex === -1) return res.status(403).json({ message: 'Not authorized' });

    request.requestedFactories[factoryIndex].status = 'accepted';
    request.requestedFactories[factoryIndex].acceptedAt = new Date();
    request.status = 'accepted';

    await request.save();

    // Notify farmer
    await Notification.create({
      user: request.farmerId,
      title: 'कारखान्याने विनंती स्वीकारली!',
      message: `${req.user.name} कारखान्याने तुमची तोडणी विनंती स्वीकारली आहे.`,
      type: 'harvest',
      link: '/my-harvest-requests'
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/harvest/finalize/:id
// @desc    Farmer selects the final factory
router.put('/finalize/:id', protect, async (req, res) => {
  try {
    const { factoryId } = req.body;
    const request = await HarvestRequest.findById(req.params.id);
    
    if (request.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.finalFactoryId = factoryId;
    request.status = 'finalized';
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/harvest/farmer
// @desc    Get farmer's own requests
router.get('/farmer', protect, async (req, res) => {
  try {
    const requests = await HarvestRequest.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;