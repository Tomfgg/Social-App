const express = require('express')
const router = express.Router()
const { addReply, getReplies, deleteReply, updateReply } = require('../controllers/reply')
const userVerification = require('../utils/userVerification')
const { replyUpload } = require('../utils/multerUpload')


router.use(userVerification)

router.post('/:id', replyUpload.single('file'), addReply)
router.get('/:id', getReplies)
router.delete('/:id', deleteReply)
router.put('/:id', updateReply)











module.exports = router