import { prisma } from '../models/PrismaClient'
import { UserProfile, UserActivityType } from '@prisma/client'
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
  }
  return await createUserProfile(newUserProfile)
}

export const sanitizeUserProfile = (userProfile: UserProfile) => {
  // remove password, createdAt, updatedAt
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

const createUserProfile = async (user: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => {
  const userProfile = await prisma.userProfile.create({
    data: user,
  })
  logUserActivity(userProfile.userId, UserActivityType.USER_CREATED, null)
  return userProfile
}

export const logUserActivity = async (userId: string, activityType: UserActivityType, data: any) => {
  const description = data ? JSON.stringify(data) : ''
  await prisma.userActivity.create({
    data: {
      userId: userId,
      vmId: data?.vmId,
      activityType: activityType,
      description: description,
    },
  })
}



