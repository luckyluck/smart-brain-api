const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');

const handleSignin = (db, authToken) => (req, res) => {
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
                        // TODO add expiration time for the token
                        const sessionId = jwt.sign(user[0], authToken);
                        // res.json(user[0]);
                        res.send({
                            user: user[0],
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
};

module.exports = {
    handleSignin: handleSignin
};