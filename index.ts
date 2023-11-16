import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import { myMachines } from './data'
import cors from 'cors'
import { generateKeyPair } from 'crypto'
import { authenticateToken } from './src/api/middlewares/AuthMiddleware'

import authRoutes from './src/api/routes/AuthRoutes'
import { handleError } from './src/api/middlewares/ErrorHandler'


dotenv.config()

const app: Express = express()
app.use(cors())
app.use(express.json())

const port = process.env.PORT || 3000

app.use('/api/auth', authRoutes)


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World')
})

app.get('/api/machines', authenticateToken , (req: Request, res: Response) => {
  res.json(myMachines)
})

app.get('/api/ssh/:name', (req: Request, res: Response) => {
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
    res.json({
      publicKey: publicKey,
      privateKey: privateKey
    })
  })
})

app.use(handleError)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})


