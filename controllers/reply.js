const User = require('../models/users')
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
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid comment id', 400)
        const comment = await Comment.findById(id)
        if (!comment) throw new AppError('comment not found', 404)
        if (req.files.length > 1) throw new AppError('only one file can be uploaded', 400)
        else if (req.files.length == 1) {
            const file = req.files[0]
            var fileName = file.originalname + '_' + Date.now()
            const dirPath = path.join(__dirname, '../uploads/posts')
            const destinationPath = path.join(dirPath, fileName)
            fs.writeFileSync(destinationPath, file.buffer)
        }
        else if (!describtion) throw new AppError('Reply data missing', 400)
        const reply = await Reply.create({ 'file': fileName, 'user_id': req.user._id, describtion, 'comment_id': id, 'post_id': comment.post_id })
        comment.replies.push(reply._id)
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
        // const myMedia = ['Post', 'Comment']
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
        
        const objectId = new ObjectId(id);
        const replies = await Reply.aggregate([
            {
                $match: { 'comment_id': objectId }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { reply_id: "$_id", user_id: req.user?._id },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$reply_id", "$$reply_id"] },
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
                    foreignField: 'reply_id', // Field from the Likes collection
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
                    totalLikes: { $size: '$likes' }, username: '$user.name', liked: {
                        $cond: {
                            if: { $eq: [{ $size: '$liked' }, 1] },
                            then: true,
                            else: false
                        }
                    } }
            },
            
            {
                $project: {
                    likes: 0, // Exclude the 'likes' array from the output
                    user: 0,
                    user_id:0,
                    post_id:0,
                    comment_id:0

                }
            },
            {
                $sort: { createdAt: -1 }
            },
            { $skip: skip }, // Skip the first 10 documents

            // Limit the number of documents returned
            { $limit: limit } // 
        ])

        // Iterate over each post
        replies.forEach(reply => {
            if (reply.file) reply.file = `${req.protocol}://${req.get('host')}/image/${reply.file}`;
        });

        res.send(replies);
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

        // Delete all likes associated with the post
        await Like.deleteMany({ reply_id: id });

        await Reply.findByIdAndDelete(id);
        fs.unlinkSync(path.join(__dirname, '../uploads/posts', reply.file))
        res.json('Reply and associated data successfully deleted');
    }
    catch (err) { next(err) }
}

module.exports = { addReply, getReplies, deleteReply, updateReply }