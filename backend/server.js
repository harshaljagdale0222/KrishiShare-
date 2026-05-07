const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')
const connectDB = require('./config/db')

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/ping', (req, res) => res.send('pong'))

// 🛡️ Fix Google OAuth Popup Block (COOP/COEP)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none')
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none')
  next()
})

// Socket logic for real-time notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined room`)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Attach io to request for use in routes
app.use((req, res, next) => {
  req.io = io
  next()
})

app.use('/api/auth', require('./routes/auth'))
app.use('/api/harvest', require('./routes/harvest'))
app.use('/api/orders', require('./routes/orders'))
app.use('/api/factories', require('./routes/factories'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/products', require('./routes/products'))
app.use('/api/bookings', require('./routes/bookings'))
app.use('/api/complaints', require('./routes/complaints'))
app.use('/api/equipments', require('./routes/equipments'))
app.use('/api/payments', require('./routes/payments'))
app.use('/api/schemes', require('./routes/schemeRoutes'))


app.get('/', (req, res) => {
  console.log('--- 🛣️ REGISTERED ROUTES ---');
  console.log('Auth:', '/api/auth');
  console.log('Notifications:', '/api/notifications');
  console.log('Orders:', '/api/orders');
  res.json({ message: '🌾 KrishiShare API chalu aahe!', status: 'ok' })
})

app.use((req, res) => {
  res.status(404).json({ message: 'Route sapdali nahi' })
})

// Start server after DB connection
const startServer = async () => {
  await connectDB()
  const PORT = process.env.PORT || 5000
  server.listen(PORT, () => {
    console.log(`🚀 Server chalu aahe: http://localhost:${PORT}`)
  })
}

startServer()
