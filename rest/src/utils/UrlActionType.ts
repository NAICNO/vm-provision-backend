export const UrlActionType = {
  NOTIFY_VM_INITIALIZE_START: 'NOTIFY_VM_INITIALIZE_START',
  NOTIFY_VM_INITIALIZE_COMPLETE: 'NOTIFY_VM_INITIALIZE_COMPLETE',
  NOTIFY_VM_DESTROY_START: 'NOTIFY_VM_DESTROY_START',
}

export const CREATE_ACTIONS = [
  UrlActionType.NOTIFY_VM_INITIALIZE_START,
  UrlActionType.NOTIFY_VM_INITIALIZE_COMPLETE,
  // Add more 'CREATE' UrlActionTypes here
]

export const DESTROY_ACTIONS = [
  UrlActionType.NOTIFY_VM_DESTROY_START
]

export type UrlActionType = typeof UrlActionType[keyof typeof UrlActionType]
