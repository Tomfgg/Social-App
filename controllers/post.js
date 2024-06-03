const User = require('../models/users')
const Post = require('../models/posts')
const Comment = require('../models/comments')
const Like = require('../models/likes')
const Reply = require('../models/replies')
const AppError = require('../utils/AppError')
const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')

const addPost = async (req, res, next) => {
    try {
        const { describtion } = req.body
        const files = []
        req.files.forEach((file) => files.push(file.filename))
        if (!describtion && !files) throw new AppError('post data missing', 400)
        const user = req.user
        // const dirPath = path.join(__dirname, '../uploads/posts')
        // const images = []
        // Object.values(req.files).forEach(file => {
        //     const fileName = file.originalname + '_' + Date.now()
        //     // console.log(file.buffer);
        //     const destinationPath = path.join(dirPath, fileName)
        //     fs.writeFileSync(destinationPath, file.buffer)
        //     images.push(fileName)
        //     // res.setHeader('Content-Type', 'image/jpeg').send(fs.readFileSync(destinationPath))
        // });
        await Post.create({ images: files, 'user_id': user._id, describtion })
        res.json('post created successfully')

    }
    catch (err) { next(err) }
}


const updatePost = async (req, res, next) => {
    try {
        const { id } = req.params
        if (!ObjectId.isValid(id)) throw new AppError('Invalid post ID', 400);
        const post = await Post.findById(id)
        if (!post) throw new AppError('post not found', 404);
        if (String(post.user_id) != String(req.user._id)) throw new AppError('Unauthorized', 401);
        const { describtion, toDelete } = req.body
        const files = req.files
        if (!describtion && !files && toDelete == post.images) throw new AppError('post data not found', 404);
        if (toDelete) {
            for (const file of toDelete) {
                post.images.pull(file)
                fs.unlinkSync(path.join(__dirname, '../uploads/posts', file))
            }
        }
        if (files) {
            for (const file of files) {
                const dotIndex = file.originalname.lastIndexOf('.')
                if (dotIndex == -1) throw new AppError('error reading files', 400);
                const extension = file.originalname.slice(dotIndex + 1)
                if (!['jpg', 'png'].includes(extension)) throw new AppError('error reading files', 400);
                const newName = file.originalname + '_' + Date.now()
                post.images.push(newName)
                fs.writeFileSync(path.join(__dirname, '../uploads/posts', newName), file.buffer)
            }
        }
        if (describtion) post.describtion = describtion
        await post.save()
        res.json('post updated successully')
    }
    catch (err) { next(err) }
}

const getMyPosts = async (req, res, next) => {
    // const posts = await Post.find({ 'user_id': req.user._id }).sort({ createdAt: -1 });
    const posts = await Post.aggregate([
        {
            $match: { 'user_id': req.user._id }
        },
        {
            $lookup: {
                from: 'likes', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'likes' // Output array field name
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { post_id: "$_id", user_id: req.user?._id },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$post_id", "$$post_id"] },
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
                from: 'comments', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'comments' // Output array field name
            }
        },
        {
            $lookup: {
                from: 'replies', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'replies' // Output array field name
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
                totalLikes: { $size: '$likes' }, liked: {
                    $cond: {
                        if: { $eq: [{ $size: '$liked' }, 1] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                totalComments: {
                    $sum: [
                        { $size: "$comments" }, // Calculate the size of the "comments" array
                        { $size: "$replies" }   // Calculate the size of the "replies" array
                    ]
                },
                username: '$user.name'
            }
        },
        {
            $project: {
                likes: 0,
                comments: 0,// Exclude the 'likes' array from the output
                replies: 0,// Exclude the 'likes' array from the output
                user: 0,
                user_id: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    // Iterate over each post
    posts.forEach(post => {
        // Iterate over each image in the post
        post.images.forEach((image, index) => {
            // Modify the URL of each image to include protocol and host
            post.images[index] = `${req.protocol}://${req.get('host')}/postfile/${image}`;
        });
    });

    // Send the modified posts array as the response
    res.send(posts);
}

const getPosts = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        jwt.verify(token, 'hamada', async (err, decode) => {
            if (err) return
            const { id } = decode
            const user = await User.findById(id)
            if (!user) return
            req.user = user
        })
    }
    const posts = await Post.aggregate([
        {
            $match: { user_id: { $in: req.user.friends } }
        },
        {
            $lookup: {
                from: 'likes', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'likes' // Output array field name
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { post_id: "$_id", user_id: req.user?._id },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$post_id", "$$post_id"] },
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
                from: 'comments', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'comments' // Output array field name
            }
        },
        {
            $lookup: {
                from: 'replies', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'replies' // Output array field name
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
                totalLikes: { $size: '$likes' }, liked: {
                    $cond: {
                        if: { $eq: [{ $size: '$liked' }, 1] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $addFields: {
                totalComments: {
                    $sum: [
                        { $size: "$comments" }, // Calculate the size of the "comments" array
                        { $size: "$replies" }   // Calculate the size of the "replies" array
                    ]
                },
                username: '$user.name'
            }
        },
        {
            $project: {
                likes: 0,
                comments: 0,// Exclude the 'likes' array from the output
                replies: 0,// Exclude the 'likes' array from the output
                user: 0,
                user_id: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    // Iterate over each post
    posts.forEach(post => {
        // Iterate over each image in the post
        post.images.forEach((image, index) => {
            // Modify the URL of each image to include protocol and host
            post.images[index] = `${req.protocol}://${req.get('host')}/image/${image}`;
        });
    });

    // Send the modified posts array as the response
    res.send(posts);
}

const getPost = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        jwt.verify(token, 'hamada', async (err, decode) => {
            if (err) return
            const { id } = decode
            const user = await User.findById(id)
            if (!user) return
            req.user = user
        })
    }
    const { id } = req.params
    if (!id) throw new AppError('missing credentials', 400)
    if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
    let post = await Post.findById(id)
    if (!post) throw new AppError('post not found', 404)
    const limit = 10
    const objectId = new ObjectId(id);
    post = await Post.aggregate([
        {
            $match: {
                _id: objectId
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { post_id: "$_id", user_id: req.user?._id },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$post_id", "$$post_id"] },
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
                foreignField: 'post_id', // Field from the Likes collection
                as: 'likes' // Output array field name
            }
        },
        {
            $lookup: {
                from: 'comments', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'comments' // Output array field name
            }
        },
        {
            $lookup: {
                from: 'replies', // The name of the Likes collection
                localField: '_id', // Field from the Posts collection
                foreignField: 'post_id', // Field from the Likes collection
                as: 'replies' // Output array field name
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
                totalLikes: { $size: '$likes' },
                liked: {
                    $cond: {
                        if: { $eq: [{ $size: '$liked' }, 1] },
                        then: true,
                        else: false
                    }
                }
            }
        },

        {
            $addFields: {
                totalComments: {
                    $sum: [
                        { $size: "$comments" }, // Calculate the size of the "comments" array
                        { $size: "$replies" }   // Calculate the size of the "replies" array
                    ]
                },
                username: '$user.name'
            }
        },
        {
            $project: {
                likes: 0,
                comments: 0,// Exclude the 'likes' array from the output
                replies: 0,// Exclude the 'likes' array from the output
                user: 0,
                user_id: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    // Iterate over each post
    post = post[0]
    // Iterate over each image in the post
    post.images.forEach((image, index) => {
        // Modify the URL of each image to include protocol and host
        post.images[index] = `${req.protocol}://${req.get('host')}/postfiles/${image}`;
    });


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
                totalLikes: { $size: '$likes' }, replies: { $size: '$replies' }, username: '$user.name', liked: {
                    $cond: {
                        if: { $eq: [{ $size: '$liked' }, 1] },
                        then: true,
                        else: false
                    }
                }
            }
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
        { $limit: limit } // 
    ])
    comments.forEach(comment => {
        if (comment.file) comment.file = `${req.protocol}://${req.get('host')}/image/${comment.file}`;
    });
    post.comments = comments
    res.send(post);
}

const deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new AppError('Post ID is required', 400);
        }

        if (!ObjectId.isValid(id)) {
            throw new AppError('Invalid post ID', 400);
        }

        const post = await Post.findById(id);

        if (!post) {
            throw new AppError('Post not found', 404);
        }

        // Check if the authenticated user is authorized to delete the post
        if (String(post.user_id) !== String(req.user._id)) {
            throw new AppError('Unauthorized', 401);
        }

        // Delete all likes associated with the post
        await Like.deleteMany({ post_id: id });

        // Delete all comments associated with the post
        const comments = await Comment.find({ post_id: id });

        for (const comment of comments) {
            // Delete all likes associated with the comment
            await Like.deleteMany({ comment_id: comment._id });

            // Delete the comment
            await Comment.findByIdAndDelete(comment._id);
            fs.unlinkSync(path.join(__dirname, '../uploads/posts', comment.file))
        }

        // Delete all replies associated with the post
        const replies = await Reply.find({ post_id: id });

        for (const reply of replies) {
            // Delete all likes associated with the reply
            await Like.deleteMany({ reply_id: reply._id });

            // Delete the reply
            await Reply.findByIdAndDelete(reply._id);
            fs.unlinkSync(path.join(__dirname, '../uploads/posts', reply.file))
        }

        // Finally, delete the post itself
        await Post.findByIdAndDelete(id);

        post.images.forEach((image) => {
            // Modify the URL of each image to include protocol and host
            fs.unlinkSync(path.join(__dirname, '../uploads/posts', image))
        });

        res.json('Post and associated data successfully deleted');
    } catch (err) {
        next(err);
    }
};



module.exports = { addPost, getMyPosts, getPosts, getPost, deletePost, updatePost }