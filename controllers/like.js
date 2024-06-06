const Like = require('../models/likes')
const Post = require('../models/posts')
const Comment = require('../models/comments')
const Reply = require('../models/replies')
const AppError = require('../utils/AppError')
const { ObjectId } = require('mongodb')

const processLike = async (req, res, next) => {
    try {
        const myMedia = ['Post', 'Comment', 'Reply']
        const { media, id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
        if (!myMedia.includes(media)) throw new AppError('media should be one of Post or Comment', 400)
        if (media == 'Post') {
            const post = await Post.findById(id)
            if (!post) throw new AppError('post not found', 404)
            const like = await Like.findOne({ 'user_id': req.user.id, 'post_id': id })
            if (like) {
                await Like.findByIdAndDelete(like._id)
                await Post.findByIdAndUpdate(id, { $inc: { likes: -1 } })
            }
            else {
                await Like.create({ 'user_id': req.user._id, 'post_id': id })
                await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } })
            }
        }
        else if (media == 'Comment') {
            const comment = await Comment.findById(id)
            if (!comment) throw new AppError('comment not found', 404)
            const post = await Post.findById(comment.post_id)
            if (!post) throw new AppError('post not found', 404)
            const like = await Like.findOne({ 'user_id': req.user.id, 'comment_id': id })
            if (like) {
                await Like.findByIdAndDelete(like._id)
                const comment = await Comment.findByIdAndUpdate(id, { $inc: { likes: -1 } })
                await Post.findByIdAndUpdate(comment.post_id, { $inc: { likes: -1 } })
            }
            else {
                await Like.create({ 'user_id': req.user._id, 'comment_id': id })
                const comment = await Comment.findByIdAndUpdate(id, { $inc: { likes: 1 } })
                await Post.findByIdAndUpdate(comment._id, { $inc: { likes: 1 } })
            }
        }
        else {
            const reply = await Reply.findById(id)
            if (!reply) throw new AppError('reply not found', 404)
            const like = await Like.findOne({ 'user_id': req.user.id, 'reply_id': id })
            if (like) {
                await Like.findByIdAndDelete(like._id)
                const reply = await Reply.findByIdAndUpdate(id, { $inc: { likes: -1 } })
                const comment = await Comment.findByIdAndUpdate(reply.comment_id, { $inc: { likes: -1 } })
                await Post.findByIdAndUpdate(comment.post_id, { $inc: { likes: -1 } })
            }
            else {
                await Like.create({ 'user_id': req.user._id, 'reply_id': id })
                const reply = await Reply.findByIdAndUpdate(id, { $inc: { likes: 1 } })
                const comment = await Comment.findByIdAndUpdate(reply.comment_id, { $inc: { likes: 1 } })
                await Post.findByIdAndUpdate(comment.post_id, { $inc: { likes: 1 } })
            }
        }
        res.json('like processed')
    }
    catch (err) {
        next(err)
    }
}

module.exports = { processLike }