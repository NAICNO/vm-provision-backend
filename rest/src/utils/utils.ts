import * as crypto from 'crypto'

export const getFirstName = (name: string) => {
  const nameArray = name.split(' ')
  return nameArray[0] || ''
}
export const getLastName = (name: string) => {
  const nameArray = name.split(' ')
  return nameArray[nameArray.length - 1] || ''
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const getFolderNameForProvider = (providerName: string) => {
  const providerMap: { [key: string]: string } = {
    'nrec': 'nrec',
    'nrec uio': 'nrec-uio',
    'nrec uib': 'nrec-uib',
    'google cloud': 'google-cloud',
    'aws': 'aws',
    'azure': 'azure'
  }

  return providerMap[providerName.toLowerCase()] || 'nrec'
}

export const generateToken = (size: number = 48): string => {
  return crypto.randomBytes(size).toString('base64url')
}
