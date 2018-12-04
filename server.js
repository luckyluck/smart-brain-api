require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');

// const register = require('./controllers/register');
// const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

let authToken;
// Generating random security key
bcrypt.genSalt(48, (error, result) => {
    authToken = result;
    console.log('authToken:', authToken);
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

app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());

app.get('/', (req, res) => {
    // res.send(db.users);
    res.send('Its working');
});

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
                        const sessionId = jwt.sign(currentUser.email, authToken);

                        res.send({
                            user: currentUser,
                            sessionId
                        });
                    })
                    .catch(() => res.status(400).json('unable to get user'));
            } else {
                res.status(401).send();
            }
        })
        .catch(() => res.status(401).send());
});

app.get('/is-authorized', authenticate, (req, res) => {
    res.send({ user: currentUser });
});

app.get('/logout', authenticate, (req, res) => {
    // After that previous check will be invalid before the user log in again
    bcrypt.genSalt(48, (error, result) => {
        authToken = result;
        currentUser = null;

        res.send();
    });
});

app.post('/register', authenticate, (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission');
    }
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                        joined: new Date()
                    })
                    .then(user => {
                        currentUser = user[0];
                        // TODO add expiration time for the token
                        const sessionId = jwt.sign(currentUser.email, authToken);
                        // res.json(user[0]);
                        res.send({
                            user: currentUser,
                            sessionId
                        });
                    });
            })
            .then(trx.commit)
            .catch(trx.rollback);
    })
        .catch(() => res.status(401).json('unable to register'));
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

app.listen(3000, () => {
    console.log('app is running on port 3000');
});
