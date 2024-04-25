const User = require('../models/users')
const AppError = require('../utils/AppError')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.secret

const userVerification = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(new AppError('please provide a token', 401))
    jwt.verify(token, secret, async (err, decode) => {
        try {
            if (err) {
                if (err.name == 'TokenExpiredError') throw new AppError('token expired', 401)
                else if (err.name == 'JsonWebTokenError') throw new AppError('invalid token', 401)
                else throw new AppError('unexpected error', 401)
            }
            const { id } = decode
            const user = await User.findById(id)
            if (!user) { return res.json("user not found") }
            req.user = user
            next()
        }
        catch (err) {
            next(err)
        }
    })
}

module.exports = userVerification