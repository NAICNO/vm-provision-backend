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
  case 'ibm-cloud':
    return [
      ...commonEnv,
      {
        name: 'IC_API_KEY',
        valueFrom: {
          secretKeyRef: {
            name: 'ibm-cloud-secret',
            key: 'apikey'
          }
        },
      },
      {
        name: 'TF_VAR_cloud_instance_id',
        valueFrom: {
          secretKeyRef: {
            name: 'ibm-cloud-secret',
            key: 'cloudinstanceid'
          }
        },
      }
    ]
  case 'nscale':
    return [
      ...commonEnv,
      {
        name: 'TF_VAR_nscale_service_token',
        valueFrom: {
          secretKeyRef: {
            name: 'nscale-secret',
            key: 'servicetoken'
          }
        },
      },
      {
        name: 'TF_VAR_nscale_organization_id',
        valueFrom: {
          secretKeyRef: {
            name: 'nscale-secret',
            key: 'organizationid'
          }
        },
      },
      {
        name: 'TF_VAR_nscale_project_id',
        valueFrom: {
          secretKeyRef: {
            name: 'nscale-secret',
            key: 'projectid'
          }
        },
      },
      {
        name: 'TF_VAR_region_id',
        valueFrom: {
          secretKeyRef: {
            name: 'nscale-secret',
            key: 'regionid'
          }
        },
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
  case 'nrec-uio':
  case 'nrec-uib':
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
  case 'ibm-cloud':
    return commonVolumeMounts
  case 'nscale':
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
  case 'nrec-uio':
  case 'nrec-uib':
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
  case 'ibm-cloud':
    return commonVolumes
  case 'nscale':
    return commonVolumes
  default:
    return commonVolumes
  }
}
