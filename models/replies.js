const mongoose = require('mongoose');
const replySchema = new mongoose.Schema({
    file: {
        type: String,
        required: function () {
            return !this.describtion
        }
    },
    describtion: {
        type: String,
        required: function () {
            return !this.files
        }
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: 'users'
    },
    comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    likes: {
        type: Number,
        default: 0
    }
})

const replyModel = mongoose.model('replies', replySchema)

module.exports = replyModel