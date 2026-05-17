const express = require('express')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const { protect } = require('../middleware/auth')
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/mailService')
const { sendSMS } = require('../utils/smsHelper')
const nodemailer = require('nodemailer')

const router = express.Router()

// 🔐 Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  })
}

const axios = require('axios')

// ✅ GOOGLE LOGIN
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: 'Google Client ID missing in backend .env!' })
  }

  try {
    let payload;

    // Attempt to verify as ID Token
    try {
      const client = new OAuth2Client(GOOGLE_CLIENT_ID)
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID
      })
      payload = ticket.getPayload()
    } catch (error) {
      // If ID Token verification fails, assume it's an Access Token and fetch user info
      console.log('ID Token verification failed, trying as Access Token...')
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${idToken}` }
      })
      payload = response.data
    }

    const { name, email, sub: googleId, picture } = payload

    if (!email) {
      return res.status(400).json({ message: 'Google account madhun email sapdla nahi!' })
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      if (!user.googleId) user.googleId = googleId
      if (picture && !user.image) user.image = picture
      await user.save()
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        image: picture,
        role: ''
      })
    }

    if (user.isBlacklisted) {
      return res.status(403).json({ message: 'तुमच्यावर गैरव्यवहारासाठी बंदी (Ban) घालण्यात आली आहे. अधिक माहितीसाठी संपर्क साधा.' })
    }

    res.json({
      ...user._doc,
      token: generateToken(user._id)
    })
  } catch (error) {
    const errorDetail = error.response?.data?.error_description || error.response?.data?.message || error.message
    console.error('Google Auth Error Details:', errorDetail)
    res.status(401).json({ message: `Google Auth Error: ${errorDetail}` })
  }
})

// ✅ SEND OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body
  try {
    if (!email) return res.status(400).json({ message: 'Email required!' })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({ email, name: email.split('@')[0], role: '' })
    }

    user.otp = otp
    user.otpExpires = otpExpires
    await user.save()

    console.log(`[REAL OTP SENT TO ${email}]: ${otp}`)

    // 1️⃣ Method: OTP via Email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendOTPEmail(email, otp);
      } catch (smtpErr) {
        console.error('Email OTP Error:', smtpErr.message)
      }
    }

    // 2️⃣ Method: OTP via SMS
    if (user.phone) {
      try {
        await sendSMS(user.phone, `Tumcha KrishiShare OTP aahe: ${otp}. Konashihi share karu naka.`);
      } catch (smsErr) {
        console.error('SMS OTP Error:', smsErr.message)
      }
    }

    res.json({ message: 'OTP pathavla aahe! Email ani SMS check kara.', otp })
  } catch (error) {
    console.error('Send OTP Error:', error)
    res.status(500).json({ message: error.message })
  }
})

// ✅ VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body
  try {
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ message: 'OTP chukla aahe ya expire zala aahe!' })

    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    if (user.isBlacklisted) {
      return res.status(403).json({ message: 'तुमच्यावर गैरव्यवहारासाठी बंदी (Ban) घालण्यात आली आहे. अधिक माहितीसाठी संपर्क साधा.' })
    }

    res.json({
      ...user._doc,
      token: generateToken(user._id)
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ✅ REGISTER
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, phone, role, location, businessName, factoryName, hasDeliveryService } = req.body

    // 🛡️ Security: Prevent unauthorized admin registration
    if (role === 'admin') {
      role = 'farmer';
    }

    if (!name || !email || !password) return res.status(400).json({ message: 'Mandatory fields bhara!' })

    if (role === 'mart_owner' && hasDeliveryService === false) {
      return res.status(400).json({ message: 'Mart Owners sathi delivery service mandatory aahe!' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      if (existingUser.isBlacklisted) {
        return res.status(403).json({ message: 'या ईमेलवर आधीच बंदी (Ban) घालण्यात आली आहे. नवीन खात्यासाठी हा ईमेल वापरता येणार नाही.' })
      }
      return res.status(400).json({ message: 'Email registered aahe!' })
    }

    const user = await User.create({ name, email, password, phone, role, location, businessName, factoryName, hasDeliveryService })

    // 📧 Trigger Welcome Email
    sendWelcomeEmail(user.email, user.name, user.role).catch(err => console.error('Welcome Email Error:', err.message));

    res.status(201).json({ ...user._doc, token: generateToken(user._id) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Email/Password chukla!' })

    if (user.isBlacklisted) {
      return res.status(403).json({ message: 'तुमच्यावर गैरव्यवहारासाठी बंदी (Ban) घालण्यात आली आहे. लॉगिन नाकारले.' })
    }

    res.json({ ...user._doc, token: generateToken(user._id) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/me', protect, async (req, res) => res.json(req.user))

router.get('/all-users', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this!' });
    }
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/update-role/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can change roles!' });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/role/:role', protect, async (req, res) => {
  try {
    const role = req.params.role
    let users = await User.find({ role }).select('name businessName factoryName location')

    // Seed check removed to keep DB clean as requested
    /*
    if (users.length === 0) {
       ...
    }
    */

    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ✅ UPDATE PROFILE
router.put('/profile', protect, async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.user._id);
    if (!userToUpdate) return res.status(404).json({ message: 'User sapdla nahi!' });

    if (req.body.role) userToUpdate.role = req.body.role;
    if (req.body.name) userToUpdate.name = req.body.name;
    if (req.body.phone) userToUpdate.phone = req.body.phone;
    if (req.body.location) userToUpdate.location = req.body.location;
    if (req.body.businessName) userToUpdate.businessName = req.body.businessName;

    if (req.body.hasDeliveryService !== undefined) {
      if ((req.body.role === 'mart_owner' || userToUpdate.role === 'mart_owner') && req.body.hasDeliveryService === false) {
        return res.status(400).json({ message: 'Mart Owners sathi delivery service band karta yenar nahi!' });
      }
      userToUpdate.hasDeliveryService = req.body.hasDeliveryService;
    }

    if (req.body.password) {
      userToUpdate.password = req.body.password;
    }

    const savedUser = await userToUpdate.save();
    sendWelcomeEmail(savedUser.email, savedUser.name, savedUser.role).catch(err => console.error('Email error:', err));

    res.json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// ✅ RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body
  try {
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ message: 'OTP chukla aahe ya expire zala aahe!' })

    user.password = newPassword
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()

    res.json({ message: 'पासवर्ड यशस्वीरित्या बदलला आहे! आता नवीन पासवर्डने लॉगिन करा.' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router