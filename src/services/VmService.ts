import { prisma } from '../models/PrismaClient'
import { myMachines } from '../../data'
import { ErrorMessages } from '../utils/ErrorMessages'

export const getAllUserVms = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error(ErrorMessages.UserNotAuthorized)
  }
  const vms = await prisma.virtualMachine.findMany({
    where: {
      userId: userId
    },
    include: {
      vmTemplate : true
    }
  })

  console.log('vms', vms)

  return vms
}
export const getAllVmTemplates = () => {
  return myMachines
}
