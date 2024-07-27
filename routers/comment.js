const express = require('express')
const router = express.Router()
const { addComment, getComments, deleteComment, updateComment } = require('../controllers/comment')
const userVerification = require('../utils/userVerification')
const { commentUpload } = require('../utils/multerUpload')




router.use(userVerification)

router.post('/:id', commentUpload.single('file'), addComment)
router.get('/:id', getComments)
router.delete('/:id', deleteComment)
router.put('/:id', commentUpload.single('file'), updateComment)











module.exports = router