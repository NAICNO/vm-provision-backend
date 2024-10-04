import { prisma } from '../models/PrismaClient'
import { UserProfile, UserActivityType, UserProfileStatus } from '@prisma/client'
import { getFirstName, getLastName } from '../utils/Utils'

export const createUserProfileWithOidcUser = async (oidcUser: any) => {
  const {email, user, name} = oidcUser

  const newUserProfile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
    email: email,
    username: user,
    password: '',
    firstName: getFirstName(name),
    lastName: getLastName(name),
    userType: 'user',
    status: UserProfileStatus.ACTIVE,
  }
  return await createUserProfile(newUserProfile)
}

export const sanitizeUserProfile = (userProfile: UserProfile) => {
  // remove password, status, createdAt, updatedAt
  return {
    userId: userProfile.userId,
    email: userProfile.email,
    username: userProfile.username,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    userType: userProfile.userType,
  }
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



