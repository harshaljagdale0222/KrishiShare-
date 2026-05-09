const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Login kara pehle!' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) return res.status(401).json({ message: 'User not found!' })

    // Safety Net: Always ensure this specific email is Admin
    if (user.email === 'harshaljagdale40@gmail.com') {
      user.role = 'admin'
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid aahe. Parat login kara.' })
  }
}

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ message: 'Master Admin access required!' })
  }
}

const ownerOnly = (req, res, next) => {
  const allowed = ['owner', 'mart_owner', 'equipment_owner', 'factory_owner']
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Owner access required!' })
  }
  next()
}

const farmerOnly = (req, res, next) => {
  if (req.user?.role !== 'farmer') return res.status(403).json({ message: 'Sirf shetkari access karu shakto!' })
  next()
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not authorized to access this route` })
    }
    next()
  }
}
module.exports = { protect, admin, ownerOnly, farmerOnly, authorize }