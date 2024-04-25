const User = require('../models/users')
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
        // const myMedia = ['Post', 'Comment']
        const { describtion } = req.body
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
        
        const post = await Post.findById(id)
        if (!post) throw new AppError('post not found', 404)
        function fileHandling(arr) {
            if (arr.length > 1) return next(new AppError('only one file can be uploaded', 400))
            else if (arr.length == 1) {
                const file = arr[0]
                const fileName = file.originalname + '_' + Date.now()
                const destinationPath = path.join(__dirname, '../uploads/posts', fileName)
                fs.writeFileSync(destinationPath, file.buffer)
                return fileName
            }
            else if (!describtion) return next(new AppError('comment data missing', 400))
        }
        const fileName = fileHandling(req.files)
        // const arr = [id]
        await Comment.create({ 'file': fileName, 'user_id': req.user._id, describtion, 'post_id': id })

        res.json('Comment created successfully')
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
        const { describtion } = req.body
        if (!describtion && !comment.file) throw new AppError('comment data not found', 404);
        comment.describtion = describtion
        await comment.save()
        res.json('comment updated successully')
    }
    catch (err) { next(err) }
}


const getComments = async (req, res, next) => {
    try {
        
        const skip = parseInt(req.query.skip)
        if (!skip && skip != 0) throw new AppError('skip value needed', 400)
        const limit = 3
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
       
        const objectId = new ObjectId(id);
        const comments = await Comment.aggregate([
            {
                $match: { 'post_id': objectId }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { comment_id: "$_id", user_id: req.user?._id },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$comment_id", "$$comment_id"] },
                                        { $eq: ["$user_id", "$$user_id"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "liked"
                }
            },
            {
                $lookup: {
                    from: 'likes', // The name of the Likes collection
                    localField: '_id', // Field from the Posts collection
                    foreignField: 'comment_id', // Field from the Likes collection
                    as: 'likes' // Output array field name
                }
            },
            {
                $lookup: {
                    from: 'users', // The name of the Likes collection
                    localField: 'user_id', // Field from the Posts collection
                    foreignField: '_id', // Field from the Likes collection
                    as: 'user' // Output array field name
                }
            },
            { $unwind: '$user' },

            
            {
                $addFields: {
                    totalLikes: { $size: '$likes' }, replies: { $size: '$replies' }, username: '$user.name', username: '$user.name', liked: {
                        $cond: {
                            if: { $eq: [{ $size: '$liked' }, 1] },
                            then: true,
                            else: false 
                        }
                    }  }
            },
           
            {
                $project: {
                    likes: 0, // Exclude the 'likes' array from the output
                    user: 0,
                    user_id: 0,
                    post_id: 0
                }
            },

            {
                $sort: { createdAt: -1 }
            },
            { $skip: skip }, // Skip the first 10 documents

            // Limit the number of documents returned
            { $limit: limit } // 
        ])
        // await Comment.populate(comments, [{ path: 'users' }])

        // Iterate over each post
        comments.forEach(comment => {
            if (comment.file) comment.file = `${req.protocol}://${req.get('host')}/image/${comment.file}`;
        });
        // const hah = await Comment.find().populate('user_id')
        res.send(comments);
    }
    catch (err) { next(err) }
}

const deleteComment = async (req,res,next) => {
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

        // Delete all likes associated with the post
        await Like.deleteMany({ comment_id: id });

        const replies = await Reply.find({ comment_id: id });

        for (const reply of replies) {
            // Delete all likes associated with the reply
            await Like.deleteMany({ reply_id: reply._id });

            // Delete the reply
            await Reply.findByIdAndDelete(reply._id);
            fs.unlinkSync(path.join(__dirname, '../uploads/posts', reply.file))
        }

        // Finally, delete the post itself
        await Comment.findByIdAndDelete(id);
        fs.unlinkSync(path.join(__dirname, '../uploads/posts', comment.file))
        res.json('Comment and associated data successfully deleted');
}
catch(err) {next(err)}
}

module.exports = { addComment, getComments, deleteComment, updateComment }