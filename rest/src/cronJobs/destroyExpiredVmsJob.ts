import { Cron } from 'croner'

import * as VmService from '../services/vmService'
import logger from '../utils/logger'

const destroyExpiredVmsJob = new Cron('*/30 * * * * *', async () => {

  logger.debug('[Cron] Running destroyExpiredVmsJob every 30 seconds')
  const expiredVms = await VmService.getExpiredVms()

  if (expiredVms.length !== 0) {
    logger.info(`Number of expired Vms: ${expiredVms.length}`)
  }

  for (const vm of expiredVms) {
    await VmService.startVmDestroy(vm)
    logger.info(`Destroying VM: ${vm.vmId}`)
  }
})

export default destroyExpiredVmsJob
