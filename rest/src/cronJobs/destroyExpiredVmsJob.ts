import { Cron } from 'croner'

import * as VmService from '../services/vmService'
import logger from '../utils/logger'

const destroyExpiredVmsJob = new Cron('*/30 * * * * *', async () => {

  logger.debug({message: '[Cron] Running destroyExpiredVmsJob'})
  const expiredVms = await VmService.getExpiredVms()

  if (expiredVms.length !== 0) {
    logger.info({message: '[Cron] Found expired VMs', count: expiredVms.length})
  }

  for (const vm of expiredVms) {
    await VmService.startVmDestroy(vm)
    logger.info({message: '[Cron] Destroying VM', vmId: vm.vmId})
  }
})

export default destroyExpiredVmsJob
