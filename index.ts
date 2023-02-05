require('dotenv').config()
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import simpleAccountRouter from './routes/simpleAccount'
import utilRouter from './routes/util'

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(bodyParser.json())
app.use('/simpleAccount', simpleAccountRouter)
app.use('/util', utilRouter)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
