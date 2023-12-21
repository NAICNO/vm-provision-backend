export const WebSocketEventType = {
  PROVISIONING_UPDATE: 'PROVISIONING_UPDATE',
}

export type WebSocketEventType = typeof WebSocketEventType[keyof typeof WebSocketEventType]
