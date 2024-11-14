import { prisma } from '../models/prismaClient'
import { UserProfile, UserActivityType, UserProfileStatus, UserType } from '@prisma/client'
import { getFirstName, getLastName } from '../utils/utils'
import { ErrorMessages } from '../utils/errorMessages'

export const createUserProfileWithOidcUser = async (oidcUser: any, isAdmin: boolean) => {
  const {email, user, name} = oidcUser

  const newUserProfile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
    email: email,
    username: user,
    password: '',
    firstName: getFirstName(name),
    lastName: getLastName(name),
    userType: isAdmin ? UserType.ADMIN : UserType.USER,
    status: UserProfileStatus.ACTIVE,
  }
  return await createUserProfile(newUserProfile)
}

export const updateUserProfileWithOidcUser = async (userProfile: UserProfile, oidcUser: any, isAdmin: boolean) => {

  const {email, user, name} = oidcUser

  const userType = userProfile.userType === UserType.SUPER_ADMIN
    ? UserType.SUPER_ADMIN // Preserve SUPER_ADMIN if already set
    : isAdmin
      ? UserType.ADMIN
      : UserType.USER

  const updatedUserProfile: Omit<UserProfile, 'userId' | 'createdAt'> = {
    email: email,
    username: user,
    password: '',
    firstName: getFirstName(name),
    lastName: getLastName(name),
    userType: userType,
    status: userProfile.status, // keep the status
    updatedAt: new Date(),
  }

  /// Check if any fields are different
  const hasChanges =
    userProfile.email !== updatedUserProfile.email ||
    userProfile.username !== updatedUserProfile.username ||
    userProfile.firstName !== updatedUserProfile.firstName ||
    userProfile.lastName !== updatedUserProfile.lastName ||
    userProfile.userType !== updatedUserProfile.userType

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

export const validateUserProjectMembership = (projects: string[]): boolean => {
  const naicProjectId = process.env.NAIC_EDUCLOUD_PROJECT_ID
  if (!naicProjectId) {
    throw new Error(ErrorMessages.InternalServerError)
  }
  return projects.includes(naicProjectId)
}

export const validateUserProjectAdmin = (groups: string[]): boolean => {
  const naicProjectId = process.env.NAIC_EDUCLOUD_PROJECT_ID
  if (!naicProjectId) {
    throw new Error(ErrorMessages.InternalServerError)
  }
  return groups.includes(`${naicProjectId}-admin-group`)
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



