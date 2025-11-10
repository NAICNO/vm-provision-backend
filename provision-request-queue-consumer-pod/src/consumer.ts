import { Channel, connect, Message } from 'amqplib'
import fs, { writeFileSync, ensureDirSync } from 'fs-extra'
import * as k8s from '@kubernetes/client-node'

import VmProvisioningRequestPayload from './VmProvisioningRequestPayload'
import { getEnvironmentVariables, getVolumeMounts, getVolumes } from './providers'
import {
  POD_CPU_LIMIT,
  POD_CPU_REQUEST,
  POD_MEMORY_LIMIT,
  POD_MEMORY_REQUEST,
  TERRAFORM_RUNNER_IMAGE
} from './constants'
import logger from './logger'

const VM_PROVISIONING_REQUESTS_QUEUE = 'vm_provisioning_requests'
const VM_PROVISIONING_PROGRESS_QUEUE = 'vm_provisioning_progress'

const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_HOST = 'rabbitmq' // Assuming the RabbitMQ service is named 'rabbitmq'
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:5672`

async function generateTfVarFile(vmId: string, payload: VmProvisioningRequestPayload) {
  const folderPath = `/data/terraform/${vmId}`
  logger.info(`Generated Folder Path ${folderPath}`)
  logger.info(`Selected Provider ${payload.provider}`)
  // Create folder
  ensureDirSync(folderPath)


  const terraformFilesFolder = `hcl/${payload.provider}`
  const cloudInitFolder = 'hcl/cloud-init'

  // Copying terraform files
  await fs.copy(terraformFilesFolder, folderPath)
  // Copy Cloud-init file
  await fs.copy(cloudInitFolder, folderPath)

  const tfVars = payload.tf_vars
  const tfVarsFilePath = `${folderPath}/terraform.tfvars.json`

  // Create file with the message content
  writeFileSync(tfVarsFilePath, JSON.stringify(tfVars))
}

async function startConsumer() {
  let vmId = ''
  try {
    const conn = await connect(RABBITMQ_URL)
    const channel = await conn.createConfirmChannel()
    await channel.assertQueue(VM_PROVISIONING_REQUESTS_QUEUE, {durable: true})

    logger.info(`[*] Waiting for messages in ${VM_PROVISIONING_REQUESTS_QUEUE}`)

    await channel.consume(VM_PROVISIONING_REQUESTS_QUEUE, async (msg) => {
      if (msg !== null) {
        const payload = JSON.parse(msg.content.toString()) as VmProvisioningRequestPayload

        logger.info(`Request received ${payload?.vm_id} : ${payload?.action}`)

        vmId = payload.vm_id

        switch (payload.action) {
        case 'CREATE':
          await handleCreateAction(channel, msg, payload)
          break
        case 'DESTROY':
          await handleDestroyAction(channel, msg, payload)
          break
        case 'REFRESH':
          await handleRefreshAction(channel, msg, payload)
          break
        }
      }
    })
  } catch (error) {
    logger.error({message: `Error in consumer ${vmId}`, vmId, error})
  }
}

async function handleCreateAction(channel: Channel, msg: Message, payload: VmProvisioningRequestPayload) {
  await generateTfVarFile(payload.vm_id, payload)
  logger.info(`Terraform variables file created: ${payload.vm_id}`)
  await ackAndPublish(channel, msg, payload.vm_id, payload.action, payload.provider, 'PROVISIONING_QUEUED', createTerraformVmCreateJob)
}

async function handleDestroyAction(channel: Channel, msg: Message, payload: VmProvisioningRequestPayload) {
  logger.info(`Handling DESTROY action for VM: ${payload.vm_id}`)
  await ackAndPublish(channel, msg, payload.vm_id, payload.action, payload.provider, 'DESTROY_QUEUED', createTerraformVmDestroyJob)
}

async function handleRefreshAction(channel: Channel, msg: Message, payload: VmProvisioningRequestPayload) {
  logger.info(`Handling REFRESH action for VM: ${payload.vm_id}`)
  await ackAndPublish(channel, msg, payload.vm_id, payload.action, payload.provider, 'IP_CAPTURE_QUEUED', createTerraformVmRefreshJob)
}

async function ackAndPublish(channel: Channel, msg: Message, vmId: string, action: string, provider: string, statusMessage: string, jobFunction: Function) {
  channel.ack(msg)
  logger.info(`Message acked vmId: ${vmId}`)

  const message = {
    vm_id: vmId,
    action: action,
    message: {
      '@level': 'info',
      '@message': statusMessage,
      '@module': 'rabbitmq_consumer',
      '@timestamp': new Date().toISOString(),
      type: 'consumer_generated',
      metadata: {},
    }
  }

  await channel.assertQueue(VM_PROVISIONING_PROGRESS_QUEUE, {durable: true})
  const sent = channel.sendToQueue(VM_PROVISIONING_PROGRESS_QUEUE, Buffer.from(JSON.stringify(message)), {persistent: true})

  if (sent) {
    logger.info(`Status published vmId: ${vmId}`)
    await jobFunction(vmId, provider)
  } else {
    logger.error(`Status not published vmId: ${vmId}`)
  }
}

async function createTerraformJob(vmId: string, action: string, provider: string) {

  const jobType = action === 'CREATE' ? 'create' : action === 'DESTROY' ? 'destroy' : 'refresh'
  const jobName = `tf-${jobType}-job-${vmId}`

  let terraformCommand: string
  if (action === 'CREATE') {
    terraformCommand = 'terraform init && terraform apply -auto-approve -json | python3 /send_to_rabbitmq.py'
  } else if (action === 'DESTROY') {
    terraformCommand = 'terraform init && terraform destroy -auto-approve -json | python3 /send_to_rabbitmq.py'
  } else {
    // REFRESH: run terraform refresh to update state, then terraform output to emit the IP
    terraformCommand = 'terraform init && terraform refresh -json | python3 /send_to_rabbitmq.py'
  }

  const kc = new k8s.KubeConfig()
  kc.loadFromDefault()

  const k8sApi = kc.makeApiClient(k8s.BatchV1Api)

  const jobManifest: k8s.V1Job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
    },
    spec: {
      ttlSecondsAfterFinished: 3600, // Clean up jobs 1 hour after completion
      template: {
        metadata: {
          labels: {
            app: 'terraform'
          }
        },
        spec: {
          containers: [{
            name: 'terraform',
            image: TERRAFORM_RUNNER_IMAGE,
            volumeMounts: getVolumeMounts(vmId, provider),
            env: getEnvironmentVariables(vmId, action, provider),
            workingDir: `/terraform/${vmId}`,
            command: ['sh', '-c'],
            args: [terraformCommand],
            resources: {
              requests: {
                cpu: POD_CPU_REQUEST,
                memory: POD_MEMORY_REQUEST,
              },
              limits: {
                cpu: POD_CPU_LIMIT,
                memory: POD_MEMORY_LIMIT,
              }
            }
          }],
          restartPolicy: 'Never',
          volumes: getVolumes(provider)
        }
      },
      backoffLimit: 3
    }
  }

  try {
    // Check if job already exists
    try {
      const existingJob = await k8sApi.readNamespacedJob(jobName, 'default')
      const jobStatus = existingJob.body.status

      // Check if job is still active (running)
      if (jobStatus?.active && jobStatus.active > 0) {
        logger.warn({
          message: `Job ${jobName} is still running. Skipping new job creation.`,
          vmId,
          action,
          activeJobs: jobStatus.active
        })
        return // Don't create a new job if one is already running
      }

      // Job exists but is completed or failed - delete it
      logger.info({
        message: `Job ${jobName} exists in completed/failed state. Deleting before creating new one.`,
        vmId,
        action,
        succeeded: jobStatus?.succeeded,
        failed: jobStatus?.failed
      })

      await k8sApi.deleteNamespacedJob(jobName, 'default', undefined, undefined, undefined, undefined, undefined, {
        propagationPolicy: 'Background'
      })

      // Wait a moment for deletion to propagate
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (readErr: any) {
      // 404 means job doesn't exist - that's fine, we'll create it
      if (readErr?.response?.statusCode !== 404) {
        logger.warn({message: `Could not read existing job ${jobName}`, error: readErr})
      }
    }

    await k8sApi.createNamespacedJob('default', jobManifest)
    logger.info(`Job created vmId: ${vmId} action: ${action}`)
  } catch (err) {
    logger.error({message: `Error creating job vmId: ${vmId} action: ${action}`, err})
  }
}

async function createTerraformVmCreateJob(vmId: string, provider: string) {
  await createTerraformJob(vmId, 'CREATE', provider)
}

async function createTerraformVmDestroyJob(vmId: string, provider: string) {
  await createTerraformJob(vmId, 'DESTROY', provider)
}

async function createTerraformVmRefreshJob(vmId: string, provider: string) {
  await createTerraformJob(vmId, 'REFRESH', provider)
}

startConsumer()
