/** @format */

import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import cors from 'cors'
import BankRequest from './interfaces/BankRequest'
import BankDocument from './interfaces/BankDocument'
import Request from './interfaces/Request'
import {
  BankRequestModel,
  BankDocumentModel,
  RequestModel,
  GroupModel,
} from './libs/mongoose'
import { groupByRequest } from './libs/utils'
import Group from './interfaces/Group'
import { request } from 'http'

// Create a new express app instance
const TOKEN =
  'NgLSJb3mHApOLzG1fhoG-WMKKKrGbdnLNQfK5QPWe-eRExPKDuQx2DvaI426fb-Vat0mqnd8cI78BlXeN5J'
const TOKEN2 =
  '"NgLSJb3mHApOLzG1fhoG-WMKKKrGbdnLNQfK5QPWe-eRExPKDuQx2DvaI426fb-Vat0mqnd8cI78BlXeN5J"'
const app: express.Application = express()
app.use(cors())

//   app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }))

app.use(express.static(path.join(__dirname, 'public'))) // запуск статического файлового сервера, который смотрит на папку public/ (в нашем случае отдает index.html)

//Получение токена
app.post('/api/login', function (req, res) {
  const username = req.body.username
  const password = req.body.password
  if (username === '1' && password === '1') {
    res.send(JSON.stringify({ token: TOKEN }))
  } else {
    res.send(JSON.stringify({ error: 'Непривильные учётные данные' }))
  }
})

app.use(function (req, res, next) {
  const token = req.body.token

  if (token === TOKEN || token === TOKEN2) next()
  else {
    res.send({ error: true, message: 'Authorization requried.' })
  }
})

app.post('/api', function (req, res) {
  res.send('API is running')
})

//Получаем все заявки
app.post('/api/bank', function (req, res) {
  BankRequestModel.find({}, (error: any, requests: BankRequest[]) => {
    res.send(Object.entries(groupByRequest(requests)))
  }).sort('client')
})

//Получение заявок по группам
app.post('/api/requests_by_group', function (req, res) {
  const group = req.body.group
  if (group) {
    BankRequestModel.find(
      { request: { $regex: group, $options: 'i' } },
      (error: any, requests: BankRequest[]) => {
        res.send(Object.entries(groupByRequest(requests)))
      }
    ).sort('client')
  } else {
    res.send({})
  }
})

//Получение уникальных групп
app.post('/api/groups', function (req, res) {
  GroupModel.find({}, (error: any, groups: Group[]) => {
    res.send(JSON.stringify(groups))
  }).sort('group')
})

//Получение уникальных значений
app.post('/api/unique', async function (req, res) {
  const requests = await BankRequestModel.find({})
  const requestsNums = requests.map((request) => request.request)
  const uniqueRequests = requestsNums
    .filter((value, index, self) => {
      return self.indexOf(value) === index && value != null
    })
    .sort()

  const documents = await BankDocumentModel.find({})
  const organizations = documents.map((document) => document.organization)
  const uniqueOrganizations = organizations
    .filter((value, index, self) => {
      return self.indexOf(value) === index && value != null
    })
    .sort()

  const clients = documents.map((document) => document.client)
  const uniqueClients = clients
    .filter((value, index, self) => {
      return self.indexOf(value) === index && value != null
    })
    .sort()

  const uniqueGroups = await GroupModel.find({})

  res.send(
    JSON.stringify({
      uniqueRequests,
      uniqueOrganizations,
      uniqueClients,
      uniqueGroups,
    })
  )
})

//Добавление заявки пользователем
app.post('/api/request', function (req, res) {
  const bankRequest: BankRequest = req.body
  bankRequest.bankId = 'manual'
  BankRequestModel.create(bankRequest)
    .then((bankRequest: BankRequest) => res.send(bankRequest))
    .catch((error) => res.send(error))
})

//Изменение операции по заявке
app.patch('/api/request', async function (req, res) {
  const request: BankRequest = req.body
  await BankRequestModel.updateOne({ _id: request._id }, request)
  res.send({ request })
})

//Изменение статуса заявки
app.patch('/api/request_status', async function (req, res) {
  const { requests } = req.body
  await RequestModel.updateOne(
    { request: requests[0].request },
    { status: requests[0].status }
  )
  requests.map(async (request: any) => {
    await BankRequestModel.updateMany(
      { request: request },
      { status: request.status }
    )
  })
  res.send({ requests })
})

//Удаление заявки пользователем
app.delete('/api/request', function (req, res) {
  const requestID = req.body.id
  BankRequestModel.find({ _id: requestID })
    .remove()
    .then((bankRequest: BankRequest) => res.send(bankRequest))
    .catch((error) => res.send(error))
})

//Добавление всех записей из excel в БД
app.post(
  '/api/upload_bank',
  function (req, res, next) {
    const data = req.body.documents
    if (data && Array.isArray(data)) next()
    else
      res.send({
        error: true,
        message: 'Documents is requried. And must be an array.',
      })
  },

  async function (req, res) {
    const data = req.body.documents
    let report: any[] = []
    const result = await Promise.all(
      data.map((bankDocument: BankDocument) => {
        return BankDocumentModel.create(bankDocument)
          .then((bankDoc: BankDocument) => {
            const bankRequestResult = BankRequestModel.insertMany(
              bankDoc.requests
            )
              .then((req) => req)
              .catch((error) => error)
            bankDoc.requests.forEach((request) => {
              RequestModel.create({
                request: request.request,
                status: '',
                _id: request.request,
              })
                .then((req: any) => req)
                .catch((error: any) => error)
              GroupModel.create({
                group: request.request.substring(0, 3),
                _id: request.request.substring(0, 3),
              })
                .then((req: any) => req)
                .catch((error: any) => error)
            })

            return {
              status: 'OK',
              bankDocument: bankDoc,
              error: null,
              req: bankRequestResult,
            }
          })
          .catch((error) => {
            return { status: 'ERROR', bankDocument: bankDocument, error: error }
          })
      })
    )
    res.send({ status: 'OK', message: result })
  }
)

app.post('/api/bank/:id', function (req, res) {
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

const PORT = process.env.PORT || 8000
app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT}!`)
})
