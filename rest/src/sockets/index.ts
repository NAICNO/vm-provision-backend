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
      logger.debug({message: 'User connected to socket', userId, socketId: socket.id})
    } else {
      logger.error({message: 'userId not provided for socket connection', socketId: socket.id})
    }

    socket.on('disconnect', () => {
      userSocketMap.forEach((socketId, odUserId) => {
        if (socketId === socket.id) {
          userSocketMap.delete(odUserId)
          logger.debug({message: 'User disconnected from socket', userId: odUserId, socketId: socket.id})
        }
      })
    })

    socket.on('message', (message) => {
      logger.debug({message: 'WS emitting message', payload: message})
      vmNamespace.emit('message', socket.id)
    })
  })

  return io
}

export const getIoInstance = (): SocketIoServer => {
  if (!io) {
    logger.error({message: 'Socket.IO instance not initialized'})
    throw new Error('Socket.IO instance not initialized')
  }
  return io
}

export const getSocketIdByUsername = (userName: string): string | undefined => {
  return userSocketMap.get(userName)
}
