const jwt = require('jsonwebtoken');

const handleProfileGet = (req, res, db, authToken) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id })
        .then(user => {
            if (user.length) {
                // TODO add expiration time for the token
                const sessionId = jwt.sign(user[0], authToken);
                // res.json(user[0]);
                res.send({
                    user: user[0],
                    sessionId
                });
            } else {
                res.status(401).json('Not found');
            }
        })
        .catch(() => res.status(401).json('error getting user'));
};

module.exports = {
    handleProfileGet
};