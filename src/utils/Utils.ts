// Get first name and last name from name
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
