import socketio, { Server as SocketIoServer } from 'socket.io'
import http from 'http'
import logger from '../utils/logger'
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
      logger.debug(`User ${userId} registered CONNECTED with socket ${socket.id}`)
    } else {
      logger.error('userId not provided for socket id', socket.id)
    }

    socket.on('disconnect', () => {
      userSocketMap.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userSocketMap.delete(userId)
          logger.debug(`User ${userId} DISCONNECTED from socket ${socket.id}`)
        }
      })
    })

    socket.on('message', (message) => {
      logger.debug('WS Emitting message', message)
      vmNamespace.emit('message', socket.id)
    })
  })

  return io
}

export const getIoInstance = (): SocketIoServer => {
  if (!io) {
    logger.error('Socket.IO instance not initialized')
    throw new Error('Socket.IO instance not initialized')
  }
  return io
}

export const getSocketIdByUsername = (userName: string): string | undefined => {
  return userSocketMap.get(userName)
}
