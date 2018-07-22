require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const register = require('./controllers/register');
// const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');
// const auth = require('./controllers/authenticate');

let authToken;
// Generating random security key
crypto.randomBytes(48, (err, buffer) => {
    authToken = buffer.toString('hex');
    // TODO think about it
    // Use the session middleware
    // app.use(session({ secret: authToken, cookie: { maxAge: 60000 }}));
});

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: '',
        database: 'smart-brain'
    }
});
let currentUser;

const authenticate = function (req, res, next, authToken) {
    try {
        const sessionId = req.headers.sessionid;
        const isAuthorized = sessionId && jwt.verify(sessionId, authToken);
        // If session is valid we can allow the user to continue
        if (isAuthorized) {
            next();
        } else {
            res.status(401).send();
        }
    } catch (e) {
        // In the case of invalid token
        res.status(401).send();
    }
};

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send(database.users);
});

// app.post('/signin', signin.handleSignin(db, authToken));
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json('incorrect form submission');
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', email)
        .then(data => {
            const isValid = bcrypt.compareSync(password, data[0].hash);
            if (isValid) {
                return db.select('*').from('users')
                    .where('email', '=', email)
                    .then(user => {
                        currentUser = user[0];
                        // TODO add expiration time for the token
                        console.log('authToken:', authToken);
                        console.log('currentUser:', currentUser);
                        const sessionId = jwt.sign(currentUser.email, authToken);
                        console.log('sessionId:', sessionId);
                        // res.json(user[0]);
                        res.send({
                            user: currentUser,
                            sessionId
                        });
                    })
                    .catch(() => res.status(400).json('unable to get user'));
            } else {
                // res.status(400).json('wrong credentials');
                res.status(401).send();
            }
        })
        .catch(() => res.status(401).send());
    // if (currentUser) {
    //     // TODO add expiration time for the token
    //     const sessionId = jwt.sign(currentUser, authToken);
    //
    //     res.send({
    //         user: currentUser,
    //         sessionId
    //     });
    // } else {
    //     res.status(401).send();
    // }
});

app.get('/is-authorized', authenticate, (req, res) => {
    res.send({ user: currentUser });
});

app.get('/logout', authenticate, (req, res) => {
    // After that previous check will be invalid before the user log in again
    crypto.randomBytes(48, (err, buffer) => {
        authToken = buffer.toString('hex');
        currentUser = null;

        res.send();
    });
});

app.post('/register', authenticate, (req, res) => {
    register.handleRegister(req, res, db, bcrypt);
});

app.get('/profile/:id', authenticate, (req, res) => {
    profile.handleProfileGet(req, res, db);
});

app.put('/image', authenticate, (req, res) => {
    image.handleImage(req, res, db);
});

app.post('/imageurl', authenticate, (req, res) => {
    image.handleApiCall(req, res);
});

app.listen(3001, () => {
    console.log('app is running on port 3001');
});
