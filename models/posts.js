const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
    images: {
        type: [String],
        required: function () {
            return !this.describtion
        }
    },
    describtion: {
        type: String,
        required: function () {
            return !this.images
        }
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    createdAt: { type: Date, default: Date.now },
})

const postModel = mongoose.model('posts', postSchema)
module.exports = postModel