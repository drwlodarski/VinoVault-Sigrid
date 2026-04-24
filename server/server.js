require('dotenv').config({ path: 'server/.env' })
const mongoose = require('mongoose')
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const { registerChatSocket } = require('./modules/social/chat/chat.socket')

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI
console.log('MONGODB_URI:', process.env.MONGODB_URI)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

registerChatSocket(io)

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected')

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }
}

startServer()
