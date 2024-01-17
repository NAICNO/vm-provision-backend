import socketio, { Server as SocketIoServer } from 'socket.io'
import http from 'http'
// import socketAuthMiddleware from './middleware'

let io: SocketIoServer
const userSocketMap = new Map<string, string>()

export const initializeSocketIO = (server: http.Server) => {
  io = new socketio.Server(server, {
    cors: {
      origin: '*',
    },
  })

  // Global middleware
  // io.use(socketAuthMiddleware)

  // Setting up namespaces
  const vmNamespace = io.of('/vm')

  // Bind event handlers to namespaces
  vmNamespace.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId as string
    if (userId) {
      userSocketMap.set(userId, socket.id)
      console.log(`User ${userId} registered connected with socket ${socket.id}`)
    } else {
      console.log('userId not provided for socket id', socket.id)
    }

    socket.on('disconnect', () => {
      userSocketMap.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userSocketMap.delete(userId)
          console.log(`User ${userId} disconnected`)
        }
      })
    })

    socket.on('message', (message) => {
      console.log('message', message, socket.id)
      vmNamespace.emit('message', socket.id)
      console.log('userSocketMap', userSocketMap)
    })
  })

  return io
}

export const getIoInstance = (): SocketIoServer => {
  if (!io) {
    console.log('Socket.IO instance not initialized')
    throw new Error('Socket.IO instance not initialized')
  }
  return io
}

export const getSocketIdByUsername = (userName: string): string | undefined => {
  return userSocketMap.get(userName)
}
