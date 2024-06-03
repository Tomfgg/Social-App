const express = require('express')
const router = express.Router()
const { getUser, addUser, login, updateUser, deleteUser, getUsers, getData } = require('../controllers/user')
const userVerification = require('../utils/userVerification')


router.post('/', addUser)
router.post('/login', login)
router.get('/:media/:id', getUsers)

router.use(userVerification)

router.get('/', getUser)
router.get('/:id', getData)
router.put('/', updateUser) 
router.delete('/', deleteUser)










module.exports = router