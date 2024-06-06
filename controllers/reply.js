const Comment = require('../models/comments')
const Reply = require('../models/replies')
const Like = require('../models/likes')
const Post = require('../models/posts')
const AppError = require('../utils/AppError')
const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')

const addReply = async (req, res, next) => {
    try {
        const { describtion } = req.body
        if (!describtion && !req.file) throw new AppError('data not found', 404)
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid comment id', 400)
        const comment = await Comment.findById(id)
        if (!comment) throw new AppError('comment not found', 404)
        await Reply.create({ 'file': req.file.filename, 'user_id': req.user._id, describtion, 'comment_id': id })
        comment.replies++
        await comment.save()
        res.json('Reply created successfully')

    }
    catch (err) { next(err) }
}

const updateReply = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('Invalid reply ID', 400);
        const reply = await Reply.findById(id)
        if (!reply) throw new AppError('reply not found', 404);
        if (String(reply.user_id) != String(req.user._id)) throw new AppError('Unauthorized', 401);
        const { describtion } = req.body
        if (!describtion && !reply.file) throw new AppError('reply data not found', 404);
        reply.describtion = describtion
        await reply.save()
        res.json('reply updated successully')
    }
    catch (err) { next(err) }
}

const getReplies = async (req, res, next) => {
    try {
        const skip = parseInt(req.query.skip)
        if (!skip && skip != 0) throw new AppError('skip value needed', 400)
        const limit = 3
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)

        const objectId = new ObjectId(id);

        const replies = await Reply.find({ comment_id: id }).populate({
            path: 'user_id',
            select: 'name' // Include only `name` and `email` fields from `User`
        })
        replies.forEach(reply => {
            if (reply.file) reply.file = `${req.protocol}://${req.get('host')}/replyfile/${reply.file}`;
        });
        res.json(replies)
    }
    catch (err) { next(err) }
}

const deleteReply = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError('Reply ID is required', 400);
        }

        if (!ObjectId.isValid(id)) {
            throw new AppError('Invalid Reply ID', 400);
        }

        const reply = await Reply.findById(id);

        if (!reply) {
            throw new AppError('Reply not found', 404);
        }

        // Check if the authenticated user is authorized to delete the post
        if (String(reply.user_id) !== String(req.user._id)) {
            throw new AppError('Unauthorized', 401);
        }

        // Delete all likes associated with the reply
        await Like.deleteMany({ reply_id: reply._id });

        // Delete the reply document
        await Reply.findByIdAndDelete(reply._id);
        // delete the reply file if exists
        if (reply.file) fs.unlinkSync(path.join(__dirname, '../uploads/replies', reply.file))
        // decrease the count of total replies in the comment
        const comment = await Comment.findByIdAndUpdate(reply.comment_id, { $inc: { replies: -1 } })
        // decrease the count of total comments in the post
        await Post.findByIdAndUpdate(comment.post_id, { $inc: { comments: -1 } })
        res.json('Reply successfully deleted');
    }
    catch (err) { next(err) }
}

module.exports = { addReply, getReplies, deleteReply, updateReply }