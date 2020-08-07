/** @format */

import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import cors from 'cors'
import BankRequest from './interfaces/BankRequest'
import BankDocument from './interfaces/BankDocument'
import { BankRequestModel, BankDocumentModel } from './libs/mongoose'
import { request } from 'http'

const groupBy = (key: any) => (array: any) =>
array.reduce(
  (objectsByKeyValue: any, obj:any) => ({
    ...objectsByKeyValue,
    [obj[key]]: (objectsByKeyValue[obj[key]] || []).concat(obj),
  }),
  {}
)
const groupByRequest = groupBy('request')

// Create a new express app instance
const app: express.Application = express()
app.use(cors())

//   app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }))

app.use(express.static(path.join(__dirname, 'public'))) // запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)

app.get('/api', function (req, res) {
  res.send('API is run2ning')
})

app.get('/api/bank', function (req, res) {
  BankRequestModel.find({}, (error: any, requests: BankRequest[]) => {
    res.send(Object.entries(groupByRequest(requests)))
  }).sort('-value')
})

//Добавление всех записей из excel в БД
app.post('/api/bank', async function (req, res) {
  const data = req.body
  let report: any[] = []


  const result = await Promise.all(
   data.map( (bankDocument: BankDocument) => {
      return BankDocumentModel.create(bankDocument)
        .then((bankDoc: BankDocument) => {
          const reqResult = BankRequestModel.insertMany(bankDoc.requests)
              .then((req) => req)
              .catch((error) => error)
              //dasd

          return { status: 'OK', bankDocument: bankDoc, error: null, req: reqResult }
        })
        .catch((error) => {
          return { status: 'ERROR', bankDocument: bankDocument, error: error }
        })
    })
  )

  res.send({ status: 'OK', message: result })
})

app.get('/api/bank/:id', function (req, res) {
  res.send('This is not implemented now')
})

app.use(function (req, res, next) {
  res.status(404)
  res.send({ error: 'Not found' })
  return
})
app.use(function (
  err: { status: any; message: any },
  req: any,
  res: { status: (arg0: any) => void; send: (arg0: { error: any }) => void },
  next: any
) {
  res.status(err.status || 500)
  res.send({ error: err.message })
  return
})

app.listen(8000, function () {
  console.log('App is listening on port 8000!')
})
