const mongoose = require('mongoose');
const AppError = require('../utils/AppError')

const likeSchema = new mongoose.Schema({
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    comment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return !this.reply_id },
        index: true
    },
    reply_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return !this.comment_id },
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users',
        index: true
    }
});

likeSchema.pre('save', function (next) {
    if (this.comment_id && this.reply_id) {
        return next(new AppError('the like is only owned by a comment or reply', 400));
    }
    next();
});


const LikeModel = mongoose.model('likes', likeSchema);

module.exports = LikeModel;
