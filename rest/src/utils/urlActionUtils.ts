import { UrlAction } from '@prisma/client'

export const CREATE_ACTIONS: UrlAction[] = [
  UrlAction.NOTIFY_VM_INITIALIZE_START,
  UrlAction.NOTIFY_VM_INITIALIZE_COMPLETE,
  // Add more 'CREATE' UrlActionTypes here
]

export const DESTROY_ACTIONS: UrlAction[] = [
  UrlAction.NOTIFY_VM_DESTROY_START
]
