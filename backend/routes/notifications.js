const express = require('express')
const router = express.Router()
const Notification = require('../models/Notification')

const { protect } = require('../middleware/auth')

// @route   GET /api/notifications
// @desc    Get all notifications for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(notifications)
  } catch (error) {
    console.error('Fetch Notifications Error:', error)
    res.status(500).json({ message: 'Server Error in fetching notifications' })
  }
})

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, 
      { isRead: true }, 
      { new: true }
    )
    if(!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json(notification)
  } catch (error) {
    console.error('Mark Notification Read Error:', error)
    res.status(500).json({ message: 'Server Error in marking notification read' })
  }
})

// @route   PUT /api/notifications/readall
// @desc    Mark all notifications as read for current user
router.put('/readall', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true })
    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark All Notifications Read Error:', error)
    res.status(500).json({ message: 'Server Error in marking all notifications read' })
  }
})

module.exports = router
