import { Cron } from 'croner'

import * as VmService from '../services/vmService'
import * as UserService from '../services/userService'
import { UserProfileStatus, VmStatus } from '@prisma/client'
import logger from '../utils/logger'

//* */5 * * * * // every 5 minutes
const deleteUserProfileJob = new Cron('*/30 * * * * *', async () => {

  logger.debug({message: '[Cron] Running deleteUserProfileJob'})
  // Find all the users who have PENDING_DELETION status
  const users = await UserService.findUsersByStatus(UserProfileStatus.PENDING_DELETION)

  // Loop through all the users
  for (let i = 0; i < users.length; i++) {
    const user = users[i]

    // Find all the VMs for the user
    const allVms = await VmService.getAllVmsOfUser(user.userId)

    const allRunningVms = allVms.filter(vm => vm.status === VmStatus.RUNNING)

    if (allRunningVms.length !== 0) {  // If the user has running VMs then destroy them first
      for (let j = 0; j < allRunningVms.length; j++) {
        // Destroy the VM
        await VmService.startVmDestroy(allRunningVms[j])
      }
      // When the VMs are started to destroy, then we have to wait for the VMs to be destroyed
      // before we can delete the user profile. So we will continue to the next user
      continue
    }

    // We check if all the VMs are destroyed
    const allDestroyedVms = allVms.filter(vm => vm.status === VmStatus.DESTROYED)

    // If all the VMs are destroyed then we can start deleting the user profile
    if (allDestroyedVms.length === allVms.length) {
      // If all the VMs are destroyed then we can delete the user profile
      await UserService.deleteUserProfile(user.userId)
    }

  }
})

export default deleteUserProfileJob
