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
        index: true,
        ref: 'users'
    },
    createdAt: { type: Date, default: Date.now },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    liked: Boolean
})

postSchema.virtual('reacts', {
    ref: 'Like',           // The model to use
    localField: '_id',     // Find posts where `localField`
    foreignField: 'post_id',// is equal to `foreignField`
    justOne: false,        // Set to false for an array of results
});

const postModel = mongoose.model('posts', postSchema)
module.exports = postModel