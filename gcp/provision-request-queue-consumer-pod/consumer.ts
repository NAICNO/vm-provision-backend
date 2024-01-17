import {Channel, connect, Message} from 'amqplib'
import fs, {writeFileSync, ensureDirSync} from 'fs-extra'
import VmProvisioningRequestPayload from './VmProvisioningRequestPayload'
import * as k8s from '@kubernetes/client-node'
import {getEnvironmentVariables, getVolumeMounts, getVolumes} from './providers'

const VM_PROVISIONING_REQUESTS_QUEUE = 'vm_provisioning_requests'
const VM_PROVISIONING_PROGRESS_QUEUE = 'vm_provisioning_progress'

const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_HOST = 'rabbitmq' // Assuming the RabbitMQ service is named 'rabbitmq'
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:5672`

async function generateTfVarFile(vmId: string, payload: VmProvisioningRequestPayload) {
  const folderPath = `/data/terraform/${vmId}`
  console.log('Generated Folder Path', folderPath)
  console.log('Slected Provider', payload.provider)
  // Create folder
  ensureDirSync(folderPath)


  const terraformFilesFolder = payload.provider
  const cloudInitFolder = 'cloud-init'

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

    console.log(' [*] Waiting for messages in %s.', VM_PROVISIONING_REQUESTS_QUEUE)

    await channel.consume(VM_PROVISIONING_REQUESTS_QUEUE, async (msg) => {
      if (msg !== null) {
        console.log(' [x] Received %s', msg.content.toString())

        const payload = JSON.parse(msg.content.toString()) as VmProvisioningRequestPayload
        vmId = payload.vm_id

        switch (payload.action) {
        case 'CREATE':
          await handleCreateAction(channel, msg, payload)
          break
        case 'DESTROY':
          await handleDestroyAction(channel, msg, payload)
          break
        }
      }
    })
  } catch (error) {
    console.error(`Error in consumer vmId: ${vmId} - `, error)
  }
}

async function handleCreateAction(channel: Channel, msg: Message, payload: VmProvisioningRequestPayload) {
  await generateTfVarFile(payload.vm_id, payload)
  console.log(`${payload.vm_id} - File created`)
  await ackAndPublish(channel, msg, payload.vm_id, payload.action, payload.provider, 'PROVISIONING_QUEUED', createTerraformVmCreateJob)
}

async function handleDestroyAction(channel: Channel, msg: Message, payload: VmProvisioningRequestPayload) {
  await ackAndPublish(channel, msg, payload.vm_id, payload.action, payload.provider, 'DESTROY_QUEUED', createTerraformVmDestroyJob)
}

async function ackAndPublish(channel: Channel, msg: Message, vmId: string, action: string, provider: string, statusMessage: string, jobFunction: Function) {
  channel.ack(msg)
  console.log(`${vmId} - Message acked`)

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
    console.log(`${vmId} - Status published`)
    await jobFunction(vmId, provider)
  } else {
    console.log(`${vmId} - Status not published`)
  }
}

async function createTerraformJob(vmId: string, action: string, provider: string) {

  const imageName = 'europe-north1-docker.pkg.dev/vm-provisioning/vm-provisioning-docker/terraform-runner:latest'

  const jobType = action === 'CREATE' ? 'create' : 'destroy'
  const jobName = `tf-${jobType}-job-${vmId}`
  const terraformCommand = action === 'CREATE' ?
    'terraform init && terraform apply -auto-approve -json | python3 /send_to_rabbitmq.py' :
    'terraform init && terraform destroy -auto-approve -json | python3 /send_to_rabbitmq.py'

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
      template: {
        metadata: {
          labels: {
            app: 'terraform'
          }
        },
        spec: {
          containers: [{
            name: 'terraform',
            image: imageName,
            volumeMounts: getVolumeMounts(vmId, provider),
            env: getEnvironmentVariables(vmId, action, provider),
            workingDir: `/terraform/${vmId}`,
            command: ['sh', '-c'],
            args: [terraformCommand],
          }],
          restartPolicy: 'Never',
          volumes: getVolumes(provider)
        }
      },
      backoffLimit: 3
    }
  }

  try {
    const response = await k8sApi.createNamespacedJob('default', jobManifest)
    console.log('Job created', response.body)
  } catch (err) {
    console.error('Error creating job:', err)
  }
}

async function createTerraformVmCreateJob(vmId: string, provider: string) {
  await createTerraformJob(vmId, 'CREATE', provider)
}

async function createTerraformVmDestroyJob(vmId: string, provider: string) {
  await createTerraformJob(vmId, 'DESTROY', provider)
}

startConsumer()
