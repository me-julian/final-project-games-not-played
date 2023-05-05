import express, { Express } from 'express'
import createError from 'http-errors'
import path from 'path'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
// import csrf from 'tiny-csrf'
import passport from 'passport'
import logger from 'morgan'

// Session management and db
import session from 'express-session'
declare module 'express-session' {
    export interface SessionData {
        messages: Array<string>
    }
}
import SequelizeSession from 'connect-session-sequelize'
const SequelizeStore = SequelizeSession(session.Store)
import db from './db/db'

import type { ErrorRequestHandler } from 'express'

import config from './config'
const app: Express = express()

var indexRouter = require('./routes/index')
var authRouter = require('./routes/auth')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

const sessionStore = new SequelizeStore({ db: db.sequelize })
app.use(
    session({
        secret: 'keyboard cat',
        resave: false, // don't save session if unmodified
        saveUninitialized: false, // don't create session until something stored
        store: sessionStore,
    })
)
// Create sessions table if it doesn't already exist.
sessionStore.sync()

app.use(csrf())
// app.use(
//     csrf(
//         '123456789iamasecret987654321look' // secret -- must be 32 bits or chars in length
//     )
// )
app.use(passport.authenticate('session'))
app.use(function (req, res, next) {
    var msgs = req.session.messages || []
    res.locals.messages = msgs
    res.locals.hasMessages = !!msgs.length
    req.session.messages = []
    next()
})
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/', indexRouter)
app.use('/', authRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
} as ErrorRequestHandler)

app.listen(config.server.port, () => {
    console.log(
        `⚡️[server]: Server is running at http://localhost:${config.server.port}`
    )
})

module.exports = app
