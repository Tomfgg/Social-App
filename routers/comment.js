const express = require('express')
const router = express.Router()
const { addComment, getComments, deleteComment, updateComment } = require('../controllers/comment')
const userVerification = require('../utils/userVerification')
const path = require('path')
const multer = require('multer')


router.use(userVerification)

router.post('/:id', addComment)
router.get('/:id', getComments)
router.delete('/:id', deleteComment)
router.put('/:id', updateComment)











module.exports = router