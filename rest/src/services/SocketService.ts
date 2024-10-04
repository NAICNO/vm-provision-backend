import * as UserService from './userService'
import { getIoInstance, getSocketIdByUsername } from '../sockets'
import { WebSocketEventType } from '../utils/webSocketEventType'

export const sendMessageToSpecificUser = async (userId: string, message: any) => {
  const user = await UserService.findUserProfileById(userId)

  if (user) {
    const io = getIoInstance()
    const socketID = getSocketIdByUsername(user.username)
    const namespace = process.env.SOCKET_NAMESPACE_VM || '/vm'
    if (socketID) {
      io.of(namespace).to(socketID).emit(WebSocketEventType.PROVISIONING_UPDATE, message)
    }

  }
}
