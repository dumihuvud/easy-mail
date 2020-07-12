const bodyParser = require('body-parser')
const express = require('express')
const passport = require('passport')
const cors = require('cors')
const cookieSession = require('cookie-session')

const keys = require('../config/keys')
const stripe = require('stripe')(keys.STRIPE_SECRET_KEY)

const AuthController = require('../controllers/AuthController')
const CreditsController = require('../controllers/CreditsController')
const SurveyController = require('../controllers/SurveyController')
const WebhookContoller = require('../controllers/WebhookContoller')
const TelegramController = require('../controllers/TelegramController')



// Controllers import

const createRoutes = (app, io, bot) => {
    // CONTROLLERS
    AuthC = new AuthController(io)
    CreditsC = new CreditsController(io)
    SurveyC = new SurveyController(io, bot)
    WebhookC = new WebhookContoller(io)
    TelegramC = new TelegramController(bot)

    // MIDDLEWARE
    app.use(cors())
    app.use(bodyParser.json())
    app.use(
        cookieSession({
            maxAge: 1000 * 60 * 60 * 24 * 30,
            keys: [keys.COOKIE_KEY],
        }),
    )
    app.use(passport.initialize())
    app.use(passport.session())
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'))
        const path = require('path')
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
        })
    }

    // USER ROUTES
    app.get('/api/current_user', (req, res) => { res.send(req.user) })
    app.post('/api/stripe', AuthC.isLogedIn, async (req, res) => {
        const charge = await stripe.charges.create({
            amount: 500,
            currency: 'usd',
            description: '5$ for 5 credits',
            source: req.body.id,
        })

        req.user.credits += 5
        const user = await req.user.save() // saves to DB

        res.send(user)
    })

    // TG
    app.get('/telegram', (req, res) => {
        console.log(req.user)
        // console.log(res)
        res.redirect('https://t.me/easy_mail_bot')
    })


    // PASSPORT ROUTES
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email'],
    }))
    app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
        res.redirect('/surveys')
    })
    app.get('/auth/google/logout', (req, res) => {
        req.logout()
        res.send(req.user)
    })

    // SURVEY ROUTES
    app.get('/api/surveys', AuthC.isLogedIn, SurveyC.getSurvey)
    app.post('/api/surveys', AuthC.isLogedIn, CreditsC.isEnoughCredits, SurveyC.newSurvey);
    app.post('/api/surveys/webhook', WebhookC.getChoice);
    app.get('/api/surveys/:id/:choice', (req, res) => { res.send("Thanks for voting!") })


    // TELEGRAM ROUTE AND MIDDLEWARE
    app.post(`/secret-path`, (req, res) => {
        console.log('LUL')
        return bot.handleUpdate(req.body, res)
    })

    app.use(bot.webhookCallback('/secret-path'))
}

module.exports = createRoutes