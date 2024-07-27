const express = require('express')
const router = express.Router()
const { addPost, getMyPosts, getPosts, getPost, deletePost, updatePost, getUserPosts } = require('../controllers/post')
const userVerification = require('../utils/userVerification')
const { postupload } = require('../utils/multerUpload')








router.use(userVerification)
router.get('/:id', getPost)
router.get('/user/:id', getUserPosts)
router.get('/', getPosts)
router.post('/', postupload.array('file', 5), addPost)
router.put('/:id', postupload.array('file', 5), updatePost)
router.delete('/:id', deletePost)   
router.get('/my/get', getMyPosts)











module.exports = router