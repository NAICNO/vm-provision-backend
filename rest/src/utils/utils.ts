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
  if (providerName.toLowerCase() === 'nrec') {
    return 'nrec'
  } else if (providerName.toLowerCase() === 'google cloud') {
    return 'google-cloud'
  } else if (providerName.toLowerCase() === 'aws') {
    return 'aws'
  } else if (providerName.toLowerCase() === 'azure') {
    return 'azure'
  }
  return 'nrec'
}
