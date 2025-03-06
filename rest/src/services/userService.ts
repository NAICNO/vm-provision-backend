import { prisma } from '../models/prismaClient'
import { UserProfile, UserActivityType, UserProfileStatus, UserType } from '@prisma/client'

export const createUserProfileWithOidcUser = async (oidcUser: any, isAdmin: boolean) => {
  const {email, preferred_username, given_name, family_name} = oidcUser

  const newUserProfile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
    email: email,
    username: preferred_username,
    password: '',
    firstName: given_name || '',
    lastName: family_name || '',
    userType: isAdmin ? UserType.ADMIN : UserType.USER,
    status: UserProfileStatus.ACTIVE,
  }
  return await createUserProfile(newUserProfile)
}

export const updateUserProfileWithOidcUser = async (userProfile: UserProfile, oidcUser: any) => {

  const {email, preferred_username, given_name, family_name} = oidcUser

  const updatedUserProfile: Omit<UserProfile, 'userId' | 'createdAt' | 'userType'> = {
    email: email,
    username: preferred_username,
    password: '',
    firstName: given_name,
    lastName: family_name,
    status: userProfile.status, // keep the status
    updatedAt: new Date(),
  }

  /// Check if any fields are different
  const hasChanges =
    userProfile.email !== updatedUserProfile.email ||
    userProfile.username !== updatedUserProfile.username ||
    userProfile.firstName !== updatedUserProfile.firstName ||
    userProfile.lastName !== updatedUserProfile.lastName

  // If no changes are detected, return the existing profile
  if (!hasChanges) {
    return userProfile
  }

  if (!hasChanges) {
    return userProfile
  }

  // Update the profile if there are changes
  return prisma.userProfile.update({
    where: {
      userId: userProfile.userId,
    },
    data: updatedUserProfile,
  })
}

export const getAllUserProfiles = async () => {
  return prisma.userProfile.findMany()
}

export const findUserProfileByUsername = async (username: string) => {
  return prisma.userProfile.findUnique({
    where: {
      username: username,
    },
  })
}

export const findUserProfileByEmail = async (email: string) => {
  return prisma.userProfile.findUnique({
    where: {
      email: email,
    },
  })
}

export const findUserProfileById = async (id: string) => {
  return prisma.userProfile.findUnique({
    where: {
      userId: id,
    },
  })
}

export const findUsersByStatus = async (status: UserProfileStatus) => {
  return prisma.userProfile.findMany({
    where: {
      status: status,
    },
  })
}

const createUserProfile = async (user: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => {
  const userProfile = await prisma.userProfile.create({
    data: user,
  })
  logUserActivity(userProfile.userId, UserActivityType.USER_CREATED)
  return userProfile
}

export const markUserProfileForDeletion = async (userId: string) => {
  const userProfile = prisma.userProfile.update({
    where: {
      userId: userId,
    },
    data: {
      status: UserProfileStatus.PENDING_DELETION,
    },
  })
  logUserActivity(userId, UserActivityType.USER_DELETION_REQUESTED)
  return userProfile
}

export const deleteUserProfile = async (userId: string) => {
  await prisma.$transaction(
    async (prisma) => {
      await prisma.userProfile.delete({
        where: {
          userId: userId,
        }
      })
    }
  )
  logUserActivity(userId, UserActivityType.USER_DELETED)
}

export const logUserActivity = async (userId: string, activityType: UserActivityType, description?: string, metadata?: any) => {
  await prisma.userActivity.create({
    data: {
      userId,
      activityType,
      description,
      metadata,
    },
  })
}



