import { Cron } from 'croner'
import { VmStatus } from '@prisma/client'

import { prisma } from '../models/prismaClient'
import * as MessageQueueService from '../services/messageQueueService'
import logger from '../utils/logger'
import { VM_PROVISIONING_REQUESTS_QUEUE } from '../utils/constants'
import { getFolderNameForProvider } from '../utils/utils'

/**
 * Cron job that triggers IP capture for VMs that have completed provisioning
 * but don't have an IP address yet. This handles cases where the IP wasn't immediately
 * available when Terraform completed.
 *
 * Strategy: Spawns a Terraform job that runs `terraform refresh && terraform output`
 * which will capture the latest IP from cloud provider and send it through the
 * existing log processing pipeline.
 *
 * Runs every 30 seconds to check for VMs that need IP capture.
 */
const captureVmIpJob = new Cron('*/30 * * * * *', async () => {
  logger.debug('[Cron] Running captureVmIpJob every 30 seconds')

  try {
    // Find VMs that are in PROVISIONING_COMPLETED or INITIALIZING or RUNNING status
    // but don't have an IP address yet
    const vmsWithoutIp = await prisma.virtualMachine.findMany({
      where: {
        status: {
          in: [VmStatus.PROVISIONING_COMPLETED, VmStatus.INITIALIZING, VmStatus.RUNNING],
        },
        ipv4Address: null,
        // Only check VMs created in the last 30 minutes to avoid unnecessary checks
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      include: {
        vmTemplate: {
          include: {
            provider: true,
          },
        },
      },
    })

    if (vmsWithoutIp.length > 0) {
      logger.info(
        `[Cron] Found ${vmsWithoutIp.length} VMs without IP addresses, triggering IP capture jobs`
      )
    }

    for (const vm of vmsWithoutIp) {
      try {
        logger.info(`[Cron] Triggering IP capture job for VM: ${vm.vmId}`)

        // Trigger a Terraform refresh job that will output the IP
        // Provider is needed for cloud credentials even though files already exist
        await triggerTerraformRefreshJob(vm.vmId, vm.userId, vm.vmTemplate.provider.providerName)

        logger.info(`[Cron] IP capture job queued for VM: ${vm.vmId}`)
      } catch (error) {
        logger.error({
          message: `[Cron] Error triggering IP capture job for VM: ${vm.vmId}`,
          error,
        })
      }
    }
  } catch (error) {
    logger.error({
      message: '[Cron] Error in captureVmIpJob',
      error,
    })
  }
})

/**
 * Triggers a Terraform refresh job to capture the latest IP address
 * The job will run `terraform refresh && terraform output` which outputs
 * the vm_ip to the log stream, which gets processed by the log consumer
 * and updates the database via the existing pipeline.
 *
 * Note: While Terraform files already exist from CREATE, we still need
 * the provider name to inject the correct cloud credentials (environment variables)
 * for terraform refresh to query the cloud provider API.
 */
async function triggerTerraformRefreshJob(vmId: string, userId: string, providerName: string) {
  // Get folder name for the provider
  const folderName = getFolderNameForProvider(providerName)

  // Create a message to trigger IP capture via Terraform refresh
  const message = {
    vm_id: vmId,
    provider: folderName,
    action: 'REFRESH',
  }

  const messageString = JSON.stringify(message)

  // Add message to outbox queue for publishing to RabbitMQ
  await MessageQueueService.addToMessageQueue(
    prisma,
    VM_PROVISIONING_REQUESTS_QUEUE,
    messageString,
    userId,
    vmId,
    null
  )

  logger.debug({
    message: '[Cron] Terraform refresh job queued',
    vmId,
    provider: folderName,
  })
}

export default captureVmIpJob
