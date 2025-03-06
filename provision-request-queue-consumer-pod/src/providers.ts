import { V1EnvVar, V1VolumeMount } from '@kubernetes/client-node'

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
  case 'nrec-uio':
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
            key: 'projectname-uio'
          }
        }
      },
    ]
  case 'nrec-uib':
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
            key: 'projectname-uib'
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
  case 'azure':
    return [
      ...commonEnv,
      {
        name: 'ARM_CLIENT_ID',
        valueFrom: {
          secretKeyRef: {
            name: 'azure-secret',
            key: 'clientid'
          }
        },
      },
      {
        name: 'ARM_CLIENT_SECRET',
        valueFrom: {
          secretKeyRef: {
            name: 'azure-secret',
            key: 'clientsecret'
          }
        },
      },
      {
        name: 'ARM_TENANT_ID',
        valueFrom: {
          secretKeyRef: {
            name: 'azure-secret',
            key: 'tenantid'
          }
        },
      },
      {
        name: 'ARM_SUBSCRIPTION_ID',
        valueFrom: {
          secretKeyRef: {
            name: 'azure-secret',
            key: 'subscriptionid'
          }
        }
      }
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
  case 'azure':
    return commonVolumeMounts
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
  case 'azure':
    return commonVolumes
  default:
    return commonVolumes
  }
}
