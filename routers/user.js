const express = require('express')
const router = express.Router()
const { getUser, addUser, login, updateUser, deleteUser, getUsers, getData, usersSearch } = require('../controllers/user')
const userVerification = require('../utils/userVerification')
const { ProfileImageUpload } = require('../utils/multerUpload')


router.post('/', addUser)
router.post('/login', login)
router.get('/:media/:id', getUsers)

router.use(userVerification)

router.get('/', getUser)
router.get('/search', usersSearch)
router.get('/:id', getData)
router.put('/', ProfileImageUpload.single('newImage'), updateUser)
router.delete('/', deleteUser)










module.exports = router