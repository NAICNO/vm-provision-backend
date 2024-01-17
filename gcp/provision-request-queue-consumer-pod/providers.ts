import {V1EnvVar, V1VolumeMount} from '@kubernetes/client-node'

export const getEnvironmentVariables = (vmId: string, action: string, provider: string): V1EnvVar[] => {
  const commonEnv = [
    {
      name: 'VM_ID',
      value: vmId
    },
    {
      name: 'ACTION',
      value: action
    },
    {
      name: 'RABBITMQ_USER',
      valueFrom: {
        secretKeyRef: {
          name: 'rabbitmq-secret',
          key: 'username'
        }
      }
    },
    {
      name: 'RABBITMQ_PASSWORD',
      valueFrom: {
        secretKeyRef: {
          name: 'rabbitmq-secret',
          key: 'password'
        }
      }
    },
  ]

  switch (provider) {
  case 'nrec':
    return [
      ...commonEnv,
      {
        name: 'OS_USERNAME',
        valueFrom: {
          secretKeyRef: {
            name: 'nrec-secret',
            key: 'username'
          }
        }
      },
      {
        name: 'OS_PASSWORD',
        valueFrom: {
          secretKeyRef: {
            name: 'nrec-secret',
            key: 'password'
          }
        }
      },
      {
        name: 'OS_PROJECT_NAME',
        valueFrom: {
          secretKeyRef: {
            name: 'nrec-secret',
            key: 'projectname'
          }
        }
      },
    ]
  case 'google-cloud':
    return [
      ...commonEnv,
      {
        name: 'GOOGLE_APPLICATION_CREDENTIALS',
        value: '/secrets/google-cloud/google-cloud-service-account.json'
      },
    ]
  }

  return [
    ...commonEnv,

  ]
}

export const getVolumeMounts = (vmId: string, provider: string): V1VolumeMount[] => {
  const commonVolumeMounts = [
    {
      name: 'terraform-wd',
      mountPath: `/terraform/${vmId}`,
      subPath: `terraform/${vmId}`
    }
  ]

  switch (provider) {
  case 'nrec':
    return commonVolumeMounts
  case 'google-cloud':
    return [
      ...commonVolumeMounts,
      {
        name: 'service-account-volume',
        mountPath: '/secrets/google-cloud',
        readOnly: true
      }
    ]
  default:
    return commonVolumeMounts
  }
}

export const getVolumes = (provider: string) => {

  const commonVolumes = [
    {
      name: 'terraform-wd',
      persistentVolumeClaim: {
        claimName: 'terraform-wd-pvc'
      }
    }
  ]

  switch (provider) {
  case 'nrec':
    return commonVolumes
  case 'google-cloud':
    return [
      ...commonVolumes,
      {
        name: 'service-account-volume',
        secret: {
          secretName: 'google-cloud-secret'
        }
      }
    ]
  default:
    return commonVolumes
  }
}
