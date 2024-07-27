const mongoose = require('mongoose');
const AppError = require('../utils/AppError')

const likeSchema = new mongoose.Schema({
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    reply_id: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users',
        index: true
    },
    createdAt: { type: Date, default: Date.now }
});

likeSchema.pre('save', function (next) {
    if (this.comment_id && this.reply_id || this.post_id && this.reply_id || this.comment_id && this.post_id) {
        return next(new AppError('the like is only owned by a comment or reply or post', 400));
    }
    if (!this.comment_id && !this.reply_id && !this.post_id) {
        return next(new AppError('One of post_id, comment_id, or reply_id must be set.', 400));
    }
    next();
});


const LikeModel = mongoose.model('likes', likeSchema);

module.exports = LikeModel;
