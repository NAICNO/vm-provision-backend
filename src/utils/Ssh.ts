import { generateKeyPair, generateKeyPairSync } from 'crypto'

export function generateSshKeyPair() {
  generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  }, (err, publicKey, privateKey) => {
    // Handle errors and use the generated key pair.
    console.log('err', err)
    console.log('publicKey', publicKey)
    console.log('privateKey', privateKey)
  })
}
