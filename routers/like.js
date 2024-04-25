const express = require('express')
const router = express.Router()
const { processLike } = require('../controllers/like')
const userVerification = require('../utils/userVerification')

router.use(userVerification)

router.post('/:media/:id', processLike)


module.exports = router