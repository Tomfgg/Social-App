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
            return !this.file
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
    },
    liked: Boolean,
    toWhoID: {
        type: String,
        required: true
    },
    toWhoName: {
        type: String,
        required: true
    },
    createdAt: { type: Date, default: Date.now }
})

const replyModel = mongoose.model('replies', replySchema)

module.exports = replyModel