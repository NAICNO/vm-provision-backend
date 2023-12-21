import { prisma } from '../models/PrismaClient'
import { UserProfile } from '@prisma/client'
import { getFirstName, getLastName } from '../utils/Utils'
import { UserActivityType } from '../utils/UserActivityType'

export const createUserProfileWithIdToken = async (idToken: any) => {
  const {email, user, name} = idToken

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

export const findUserProfileByUsername = async (username: string) => {
  return prisma.userProfile.findUnique({
    where: {
      username: username,
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

export const createUserProfile = async (user: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>) => {
  const userProfile = await prisma.userProfile.create({
    data: user,
  })
  logUserActivity(userProfile.userId, UserActivityType.USER_CREATED, null)
  return userProfile
}

export const logUserActivity = (userId: string, activityType: UserActivityType, data: any) => {
  const description = data ? JSON.stringify(data) : ''
  prisma.userActivity.create({
    data: {
      userId: userId,
      vmId: data?.vmId,
      activityType: activityType.toString(),
      description: description,
    },
  })
}



