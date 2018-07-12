var express = require('express')
var passport = require('passport')
var Strategy = require('passport-facebook').Strategy
require('dotenv').config()

passport.use(new Strategy({
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: 'http://localhost:5200/login/facebook/return'
},
function (accessToken, refreshToken, profile, cb) {
  return cb(null, profile)
}))

passport.serializeUser(function (user, cb) {
  console.log('serializeUser', user)
  cb(null, user)
})

passport.deserializeUser(function (obj, cb) {
  console.log('deserializeUser', obj)
  cb(null, obj)
})

var app = express()
app.use(express.static('public'))
var exphbs = require('express-handlebars')
app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')
app.use(require('morgan')('combined'))
app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({ secret: 'election-police-jdh63dp9', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

var contract = require('./blockchain/contract')
var candidates = require('./candidates.json')

async function loadConfig () {
  await contract.ensureContractIsDeployedAndPollingBoothIsAdded(candidates)
}
loadConfig()

app.get('/',
  function (req, res) {
    res.render('home', { user: req.user })
  })

app.get('/login',
  passport.authenticate('facebook', {
    scope: 'email',
    authType: 'reauthorize',
    authNonce: 'nonce' + Math.random().toString(36).substring(7)
  }))

app.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/home' }),
  function (req, res) {
    res.redirect('/vote')
  })

app.get('/logout', function (req, res) {
  // TODO - Need to logout from facebook as part of passport logout
  req.logout()
  res.redirect('/close')
})

app.get('/close',
  function (req, res) {
    res.render('home', { title: 'Close' })
  })
app.get('/vote',
  require('connect-ensure-login').ensureLoggedIn(),
  async function (req, res) {
    console.log('vote req.user', req.user)
    var voter = await contract.getVoter(req.user.id)
    candidates.forEach(function (candidate) {
      if (candidate.name === voter.candidate) {
        candidate.voted = true
      }
    })
    res.render('vote', { user: req.user, candidates: candidates, voter: voter })
  })
app.post('/vote',
  require('connect-ensure-login').ensureLoggedIn(),
  async function (req, res) {
    var candidate = req.body.candidate
    console.log('req.user voted', req.user, candidate)
    await contract.vote(req.user.id, req.user.displayName, candidate)
    res.redirect('/vote')
  })

app.get('/results',
  async function (req, res) {
    console.log('vote req.user', req.user)
    candidates.forEach(async function (candidate) {
      var votes = await contract.getVoteCount(candidate.name)
      candidate.votes = votes
    })
    res.render('results', {user: req.user, candidates: candidates})
  })

app.listen(5200)
