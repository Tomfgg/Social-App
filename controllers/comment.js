const Comment = require('../models/comments')
const Post = require('../models/posts')
const Like = require('../models/likes')
const Reply = require('../models/replies')
const AppError = require('../utils/AppError')
const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')


const addComment = async (req, res, next) => {
    try {
        const { describtion } = req.body
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)

        const post = await Post.findById(id)
        if (!post) throw new AppError('post not found', 404)
        const comment = await Comment.create({ 'file': req.file?.filename, 'user_id': req.user._id, describtion, 'post_id': id })
        await Post.findByIdAndUpdate(id, { $inc: { comments: 1 } })
        if (comment.file) comment.file = 'http://127.0.0.1:5000/commentfile/' + comment.file

        res.json(comment)
    }
    catch (err) { next(err) }
}

const updateComment = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('Invalid comment ID', 400);
        const comment = await Comment.findById(id)
        if (!comment) throw new AppError('comment not found', 404);
        if (String(comment.user_id) != String(req.user._id)) throw new AppError('Unauthorized', 401);
        const { describtion, oldFile } = req.body
        if (!describtion && !comment.file) throw new AppError('comment data not found', 404);
        comment.describtion = describtion
        const file = req.file
        if (!oldFile && comment.file) {
            const filePath = path.join(__dirname, '../uploads/comments', comment.file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                comment.file = null
            }
        }
        if (file) comment.file = file.filename
        await comment.save()
        if (file) comment.file = `http://127.0.0.1:5000/commentfile/${comment.file}`
        if (oldFile) comment.file = `http://127.0.0.1:5000/commentfile/${comment.file}`
        res.json(comment)
    }
    catch (err) { next(err) }
}


const getComments = async (req, res, next) => {
    try {

        const skip = parseInt(req.query.skip)
        if (!skip && skip != 0) throw new AppError('skip value needed', 400)
        const limit = 5
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)

        const objectId = new ObjectId(id);
        const comments = await Comment.find({ post_id: id }, { post_id: false }).populate({
            path: 'user_id',
            select: 'name image' // Include only `name` and `email` fields from `User`
        }).sort({createdAt:-1}).skip(skip).limit(limit)
        const commentPromises = comments.map(async comment => {
            if (comment.file) comment.file = `${req.protocol}://${req.get('host')}/commentfile/${comment.file}`;
            // if (comment.user_id.image) comment.user_id.image = `${req.protocol}://${req.get('host')}/profileImage/${comment.user_id.image}`;
            const isLiked = await Like.findOne({ comment_id: comment._id, user_id: req.user._id });
            if (isLiked != null) {
                comment.liked = true;
            }
            console.log(comment.user_id.image)
        });
        
        await Promise.all(commentPromises);
        res.json(comments)

    }
    catch (err) { next(err) }
}

const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError('Comment ID is required', 400);
        }

        if (!ObjectId.isValid(id)) {
            throw new AppError('Invalid Comment ID', 400);
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            throw new AppError('comment not found', 404);
        }

        // Check if the authenticated user is authorized to delete the post
        if (String(comment.user_id) !== String(req.user._id)) {
            throw new AppError('Unauthorized', 401);
        }

        // Delete all likes associated with the comment
        await Like.deleteMany({ comment_id: comment._id });
        // get all replies related to the comment
        const replies = await Reply.find({ comment_id: comment._id });
        // loop through the replies to delete it and its related documents
        for (const reply of replies) {
            // Delete all likes associated with the reply
            await Like.deleteMany({ reply_id: reply._id });

            // Delete the reply
            await Reply.findByIdAndDelete(reply._id);
            // delete the reply file if exists
            if (reply.file) fs.unlinkSync(path.join(__dirname, '../uploads/replies', reply.file))
            // decrease the count of total comments of the post
            await Post.findByIdAndUpdate(comment.post_id, { $inc: { comments: -1 } })
        }
        // Delete the comment document
        await Comment.findByIdAndDelete(comment._id);
        // delete the comment file
        if (comment.file) fs.unlinkSync(path.join(__dirname, '../uploads/comments', comment.file))
        // decrease the count of total comments of the post
        let post = await Post.findByIdAndUpdate(comment.post_id, { $inc: { comments: -1 } },{new:true})
        res.json({count:post.comments});
    }
    catch (err) { next(err) }
}

module.exports = { addComment, getComments, deleteComment, updateComment }