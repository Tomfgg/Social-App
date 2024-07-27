const express = require('express')
const router = express.Router()
const userVerification = require('../utils/userVerification')
const { addFriend, removeFriend, acceptFriend, rejectFriend, getFriends, getSentRequests, getReceivedRequests, withdrawRequest } = require('../controllers/friend')

router.use(userVerification)

router.get('/', getFriends)
router.get('/Sent', getSentRequests)
router.get('/Received', getReceivedRequests)
router.post('/withdraw/:id', withdrawRequest)
router.post('/:id', addFriend)
router.post('/accept/:id', acceptFriend)
router.post('/reject/:id', rejectFriend)
router.delete('/:id', removeFriend)

module.exports = router