const express = require('express')
const router = express.Router()
const { addPost, getMyPosts, getPosts, getPost, deletePost, updatePost } = require('../controllers/post')
const userVerification = require('../utils/userVerification')
const { postupload } = require('../utils/multerUpload')






router.get('/:id', getPost)

router.use(userVerification)
router.get('/', getPosts)
router.post('/', postupload.array('file', 5), addPost)
router.put('/:id', updatePost)
router.delete('/:id', deletePost)
router.get('/my/get', getMyPosts)











module.exports = router