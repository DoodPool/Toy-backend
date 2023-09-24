import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'

import { loggerService } from './services/logger.service.js'
import { userService } from './services/user.service.js'
import { toyService } from './services/toy-service.js'

const app = express()

// App Configuration
app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json()) // for req.body

// חשוב לבדוק איך משתמשים
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
} else {
  const corsOptions = {
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true
  };
  app.use(cors(corsOptions));
}


// List
app.get('/api/toy', (req, res) => {
  // const { name, inStock, pageIdx, labels, type, desc } = req.query
  // const filterBy = { name, inStock, labels, pageIdx }
  // const sortBy = { type, desc }

  // toyService.query(filterBy, sortBy).then((data) => {
  //   res.send(data)
  // })

  const { filterBy = {}, sortBy = {} } = req.query.params
  // console.log("req.query.params:", req.query.params)

  // toyService.query()
  toyService.query(filterBy, sortBy)
    .then((data) => {
      res.send(data)
    })
    .catch(err => {
      console.log('Had issues getting toys', err);
      // res.status(400).send({ msg: 'Had issues getting toys' })
    })
})

// Add
app.post('/api/toy', (req, res) => {
  const { name, price, inStock, createdAt, labels, owner } = req.body
  console.log('req.body', req.body);
  const loggedinUser = { owner }
  const toy = {
    name,
    price: +price,
    inStock,
    createdAt,
    labels,
  }
  toyService
    .save(toy, loggedinUser)
    .then((savedToy) => res.send(savedToy))
    .catch((err) => console.log(err))
})

// Edit
app.put('/api/toy/:toyId', (req, res) => {
  const { _id, name, price, inStock, labels, owner } = req.body
  const loggedinUser = { owner }
  console.log('owner', owner);
  console.log('req.body', req.body);
  const toy = {
    _id,
    name,
    price: +price,
    inStock,
    labels,
  }
  toyService
    .save(toy, loggedinUser)
    .then((savedToy) => res.send(savedToy))
    .catch((err) => console.log(err))
})

// Read - getById
app.get('/api/toy/:toyId', (req, res) => {
  const { toyId } = req.params
  toyService
    .get(toyId)
    .then((toy) => {
      let visitedToysIds = req.cookies.visitedToysIds || []
      const toyExist = visitedToysIds.find((id) => id === toyId)
      if (!toyExist) {
        if (visitedToysIds.length < 3) {
          visitedToysIds.push(toyId)
        } else return res.status(401).send('Wait for a bit')
      }
      res.cookie('visitedToysIds', visitedToysIds, { maxAge: 1000 * 7 })
      res.send(toy)
    })
    .catch((err) => res.status(403).send(err))
})

// Remove
app.delete('/api/toy/:toyId', (req, res) => {
  // const loggedinUser = userService.validateToken(req.cookies.loginToken)
  // if (!loggedinUser) return res.status(401).send('Cannot delete toy')

  const { toyId } = req.params

  // toyService.remove(toyId, loggedinUser).then((msg) => {
  toyService.remove(toyId)
    .then((msg) => {
      res.end('Done!')
      // res.send({ msg, toyId })
    })
    .catch((err) => {
      loggerService.error('Cannot remove toy', err)
      res.status(400).send('Cannot remove toy')
    })

})

// Get Users (READ)
app.get('/api/user', (req, res) => {

  userService.query()
    .then(users => {
      res.send(users)
    })
    .catch(err => {
      loggerService.error('Cannot get users', err)
      res.status(400).send('Cannot get users')
    })
})

// Get Users (READ)
app.get('/api/user/:userId', (req, res) => {

  const { userId } = req.params

  userService.getById(userId)
    .then(user => {
      res.send(user)
    })
    .catch(err => {
      loggerService.error('Cannot get user', err)
      res.status(400).send('Cannot get user')
    })
})

app.post('/api/auth/login', (req, res) => {
  const credentials = req.body
  userService.checkLogin(credentials)
    .then(user => {
      if (user) {
        const loginToken = userService.getLoginToken(user)
        res.cookie('loginToken', loginToken)
        res.send(user)
      } else {
        res.status(401).send('Invalid Credentials')
      }
    })
})

app.post('/api/auth/signup', (req, res) => {
  const credentials = req.body
  userService.add(credentials)
    .then(user => {
      const loginToken = userService.getLoginToken(user)
      res.cookie('loginToken', loginToken)
      res.send(user)
    })
    .catch(err => {
      loggerService.error('Cannot signup', err)
      res.status(400).send('Cannot signup')
    })
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('loginToken')
  res.send('Loggedout..')
})

app.get('/**', (req, res) => {
  res.sendFile(path.resolve('public/index.html'))
})

const port = process.env.PORT || 3030
app.listen(port, () => {
  loggerService.info(`Server listening on port http://127.0.0.1:${port}/`)
})