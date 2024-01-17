export const UserActivityType = {
  USER_CREATED: 'UserCreated',
  USER_LOGIN_SUCCESS: 'UserLoginSuccess',
  USER_LOGIN_FAILED: 'UserLoginFailed',
  USER_LOGGED_OUT: 'UserLoggedOut',
  USER_DELETED: 'UserDeleted',
  USER_UPDATED: 'UserUpdated',
  USER_TOKEN_REFRESHED: 'UserTokenRefreshed',
  USER_TOKEN_REFRESH_FAILED: 'UserTokenRefreshFailed',
  VM_CREATION_REQUESTED: 'VmCreationRequested',
  VM_DESTROY_REQUESTED: 'VmDestroyRequested',
}

export type UserActivityType = typeof UserActivityType[keyof typeof UserActivityType]
