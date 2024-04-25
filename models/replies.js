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
        index: true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    }
})

const replyModel = mongoose.model('replies', replySchema)

module.exports = replyModel