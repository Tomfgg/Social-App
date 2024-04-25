const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
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
        ref: 'users',
        index:true
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    }
})

const commentModel = mongoose.model('comments', commentSchema)

module.exports = commentModel