import { Cron } from 'croner'
import * as VmService from '../../services/VmService'

export const setupCronJobs = () => {
  Cron('*/10 * * * * *', async () => {
    const expiredVms = await VmService.getExpiredVms()

    if (expiredVms.length !== 0) {
      console.log('Number of expired Vms', expiredVms.length)
    }

    for (const vm of expiredVms) {
      await VmService.startVmDestroy(vm)
      console.log(`Destroying VM: ${vm.vmId}`)
    }
    // console.log('running a task every 10 seconds')
  })
}
