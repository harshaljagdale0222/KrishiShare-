const express = require('express')
const Order   = require('../models/Order')
const Notification = require('../models/Notification')
const User = require('../models/User')
const { protect, ownerOnly } = require('../middleware/auth')

const router = express.Router()

router.post('/', protect, async (req, res) => {
  try {
    const { items, totalAmount, ownerId, deliveryCharge, discount, finalAmount, payment, distance, address, landmark, note } = req.body
    
    const order = await Order.create({ 
      farmerId: req.user._id, 
      ownerId: ownerId || null,
      farmerName: req.user.name, 
      farmerPhone: req.user.phone, 
      address: address || req.user.location, 
      landmark: landmark || '',
      items, 
      totalAmount, 
      deliveryCharge: deliveryCharge || 0, 
      discount: discount || 0, 
      finalAmount, 
      payment: payment || 'cod', 
      advanceAmount: Math.round(finalAmount * 0.1), // 10% advance
      advancePaid: false,
      distance: distance || 0, 
      note: note || '' 
    })
    
    // Notify farmer
    const dbNotif = await Notification.create({
      user: req.user._id,
      title: 'Order Placed!',
      message: `Tumchi order (₹${finalAmount}) record zali aahe!`,
      type: 'order',
      link: '/mart/orders'
    })

    // Notify specific Owner
    if (ownerId) {
      await Notification.create({
        user: ownerId,
        title: 'Navin Order Aali!',
        message: `${req.user.name} kadvun (₹${finalAmount}) chi order aali aahe.`,
        type: 'order',
        link: '/store-dashboard'
      })
    }

    if (req.io) {
      // Notify Farmer in personal room
      req.io.to(req.user._id).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'order' })
      // Notify Owner in personal room
      if (ownerId) {
        req.io.to(ownerId.toString()).emit('notification', { id: dbNotif._id, title: 'Navin Order Aali!', message: `${req.user.name} kadvun (₹${finalAmount}) chi order aali aahe.`, type: 'order' })
        req.io.to(ownerId.toString()).emit('new_order', { message: `Farmer ${req.user.name} ne order keli aahe!`, order })
      }
    }
    
    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/all', protect, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      // System Admin: Get EVERYTHING
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      // Mart Owner: Get only their store orders
      orders = await Order.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const Product = require('../models/Product')

router.put('/:id', protect, ownerOnly, async (req, res) => {
  try {
    const { status } = req.body
    
    // Fetch current order to check previous status
    const existingOrder = await Order.findById(req.params.id)
    if (!existingOrder) return res.status(404).json({ message: 'Order sapdala nahi!' })

    // Business Logic: Packing starts ONLY if advance is paid
    if (status === 'packing' && !existingOrder.advancePaid) {
      return res.status(400).json({ message: 'Aadhi shetkaryakadun 10% advance bharun ghya!' })
    }
    
    const prevStatus = existingOrder.status
    
    // Update the order
    const updateData = { status }
    if (status === 'delivered') updateData.billGenerated = true
    
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
    
    // ─── STOCK REDUCTION LOGIC (ON DELIVERY) ───
    if (status === 'delivered' && prevStatus !== 'delivered') {
      for (const item of order.items) {
        if (item.productId) {
          const updatedProduct = await Product.findByIdAndUpdate(item.productId, { 
            $inc: { stock: -Math.abs(item.qty) } 
          }, { new: true })

          if (req.io && updatedProduct) {
            req.io.emit('product_updated', updatedProduct)
          }

          // LOW STOCK ALERT: If stock is less than 5, notify owner
          if (updatedProduct && updatedProduct.stock < 5) {
            const stockNotif = await Notification.create({
              user: order.ownerId.toString(),
              title: 'Low Stock Alert! ⚠️',
              message: `Tumcha ${updatedProduct.name} cha satha (stock) fakt ${updatedProduct.stock} shillak aahe. Karupya bharun ghya!`,
              type: 'system',
              link: '/store-dashboard'
            })
            if (req.io) {
              req.io.to(order.ownerId.toString()).emit('notification', {
                id: stockNotif._id,
                title: stockNotif.title,
                message: stockNotif.message,
                type: 'system'
              })
            }
          }
        }
      }
    }

    // ─── LOCALIZED NOTIFICATIONS ───
    let notifTitle = 'Order Update'
    let notifMsg   = `Tumchi order status badalli aahe: ${status}`

    if (status === 'accepted') {
      notifTitle = 'ऑर्डर स्वीकारली! ✅'
      notifMsg   = `तुमची ऑर्डर मार्ट मालकाने स्वीकारली आहे. लवकरच तयारी सुरू होईल.`
    } else if (status === 'packing') {
      notifTitle = 'पॅकिंग सुरू! 📦'
      notifMsg   = `तुमच्या ऑर्डरचे पॅकिंग सुरू झाले आहे.`
    } else if (status === 'out_for_delivery') {
      notifTitle = 'ऑर्डर बाहेर पडली! 🚚'
      notifMsg   = `तुमची ऑर्डर घरपोच देण्यासाठी रवाना झाली आहे.`
    } else if (status === 'delivered') {
      notifTitle = 'ऑर्डर पोहचली! 🎉'
      notifMsg   = `तुमची ऑर्डर यशस्वीरित्या घरपोच मिळाली आहे. धन्यवाद!`
    } else if (status === 'rejected') {
      notifTitle = 'ऑर्डर रद्द ❌'
      notifMsg   = `क्षमस्व, तुमची ऑर्डर काही कारणास्तव रद्द करण्यात आली आहे.`
    }

    const dbNotif = await Notification.create({
      user: order.farmerId,
      title: notifTitle,
      message: notifMsg,
      type: 'order',
      link: '/mart/orders'
    })

    if (req.io) {
      // Notify Farmer
      req.io.to(order.farmerId.toString()).emit('notification', {
        id: dbNotif._id,
        title: dbNotif.title,
        message: dbNotif.message,
        type: 'order'
      })
      req.io.to(order.farmerId.toString()).emit('order_status_updated', order)

      // Notify Owner
      req.io.to(order.ownerId.toString()).emit('order_status_updated', order)
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/orders/:id/location
router.put('/:id/location', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { currentLocation: { lat, lng } }, 
      { new: true }
    )
    if (!order) return res.status(404).json({ message: 'Order sapdala nahi!' })

    // Emit live location update to all connected clients
    if (req.io) {
      req.io.emit('order_location_update', {
        orderId: order._id,
        lat,
        lng
      })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PATCH /api/orders/:id/pay-advance
router.patch('/:id/pay-advance', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order sapdala nahi!' })
    
    order.advancePaid = true
    await order.save()

    // Notify Owner
    const dbNotif = await Notification.create({
      user: order.ownerId,
      title: 'Advance Received! 💰',
      message: `${order.farmerName} ne ₹${order.advanceAmount} advance bharla aahe. Packing suru kara!`,
      type: 'order',
      link: '/store-dashboard'
    })

    if (req.io) {
      req.io.to(order.ownerId.toString()).emit('notification', { id: dbNotif._id, title: dbNotif.title, message: dbNotif.message, type: 'order' })
      req.io.to(order.ownerId.toString()).emit('order_status_updated', order)
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order sapdala nahi!' })

    // Check if it's the farmer's own order OR the user is an Admin
    if (order.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Tu mazi order cancel nahi karu shakt!' })
    }

    // Rules for farmers: Cannot cancel if already out for delivery or delivered
    // But Admin can cancel ANYTIME
    if (req.user.role !== 'admin') {
      const restricted = ['out_for_delivery', 'delivered']
      if (restricted.includes(order.status)) {
        return res.status(400).json({ message: 'Order ghara baher padli aahe. Aata cancel nahi karta yenar!' })
      }
    }

    order.status = 'rejected' // Using rejected as 'Cancelled'
    await order.save()

    // Notify Owner
    const dbNotif = await Notification.create({
      user: order.ownerId,
      title: 'Order Cancelled! ❌',
      message: `${order.farmerName} ne tyanchi order रद्द (cancel) keli aahe.`,
      type: 'order',
      link: '/store-dashboard'
    })

    if (req.io) {
      req.io.to(order.ownerId.toString()).emit('notification', { id: dbNotif._id, title: 'Order Cancelled!', message: `${order.farmerName} ne order cancel keli.`, type: 'order' })
      req.io.to(order.ownerId.toString()).emit('order_status_updated', order)
      req.io.to(order.farmerId.toString()).emit('order_status_updated', order)
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PATCH /api/orders/:id/bill-generated
// @desc    Mark bill as generated
router.patch('/:id/bill-generated', protect, ownerOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order sapdali nahi' })

    order.billGenerated = true
    await order.save()

    // Notify farmer
    req.io.to(order.farmerId.toString()).emit('order_status_updated', order)
    req.io.to(order.farmerId.toString()).emit('notification', { 
       message: `Tumche bill tayar aahe! Download kara.`, 
       type: 'order', 
       orderId: order._id 
    })

    res.json(order)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router