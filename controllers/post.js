const Post = require('../models/posts')
const Comment = require('../models/comments')
const Friend = require('../models/friends');
const Like = require('../models/likes')
const Reply = require('../models/replies')
const AppError = require('../utils/AppError')
const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')

const addPost = async (req, res, next) => {
    try {
        const { describtion } = req.body
        const files = []
        req.files.forEach((file) => files.push(file.filename))
        if (!describtion && !files) throw new AppError('post data missing', 400)
        const user = req.user
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
        if (toDelete ) {
            // console.log(toDelete.length)
            // if (typeof toDelete === 'string') toDelete= [toDelete]
            if (toDelete instanceof Array)
            {for (const file of toDelete) {
                post.images.pull(file)
                fs.unlinkSync(path.join(__dirname, '../uploads/posts', file))
            }}
            
            else {
                post.images.pull(toDelete)
                fs.unlinkSync(path.join(__dirname, '../uploads/posts', toDelete))
            }
        }
        if (files) {
            for (const file of files) {
        //         const dotIndex = file.originalname.lastIndexOf('.')
        //         if (dotIndex == -1) throw new AppError('error reading files', 400);
        //         const extension = file.originalname.slice(dotIndex + 1)
        //         if (!['jpg', 'png'].includes(extension)) throw new AppError('error reading files', 400);
        //         const newName = file.originalname + '_' + Date.now()
                post.images.push(file.filename)
        //         fs.writeFileSync(path.join(__dirname, '../uploads/posts', newName), file.buffer)
            }
        }
        if (describtion) post.describtion = describtion
        await post.save()
        res.json('post updated successully')
    }
    catch (err) { next(err) }
}

const getMyPosts = async (req, res, next) => {
    const limit = 5
    const skip = parseInt(req.query.skip)
    const posts = await Post.find({ user_id: req.user._id }, { user_id: false }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    const postPromises = posts.map(async post => {
        const isLiked = await Like.findOne({ post_id: post._id, user_id: req.user._id });
        if (isLiked != null) {
            post.liked = true;
        }
        if (post.images) {
            post.images = post.images.map(image => `${req.protocol}://${req.get('host')}/postfile/${image}`);
        }
    });
    await Promise.all(postPromises);
    res.json(posts);
}
const getUserPosts = async (req, res, next) => {
    const {id} = req.params
    const limit = 5
    const skip = parseInt(req.query.skip)
    const posts = await Post.find({ user_id: id }).populate({
        path: 'user_id',
        select: 'name image'
    }).sort({ createdAt: -1 }).skip(skip).limit(limit)
    const postPromises = posts.map(async post => {
        const isLiked = await Like.findOne({ post_id: post._id, user_id: req.user._id });
        if (isLiked != null) {
            post.liked = true;
        }
        if (post.images) {
            post.images = post.images.map(image => `${req.protocol}://${req.get('host')}/postfile/${image}`);
        }
    });
    await Promise.all(postPromises);
    res.json(posts);
}

const getPosts = async (req, res, next) => {
    const id = req.user._id
    const limit = 5
    const skip = parseInt(req.query.skip)
    const friends1 = await Friend.find({ user: id,status:'accepted' })
    const friendsids1 = friends1.map(friend => friend.friend.toString())
    const friends2 = await Friend.find({ friend: id,status:'accepted' })
    const friendsids2 = friends2.map(friend => friend.user.toString())
    const posts = await Post.find({ user_id: { $in: friendsids1.concat(friendsids2) } }).populate({
        path: 'user_id',
        select: 'name image'
    }).sort({createdAt:-1}).skip(skip).limit(limit)
    const postPromises = posts.map(async post => {
        // Check if the user liked the post
        const isLiked = await Like.findOne({ post_id: post._id, user_id: req.user._id });
        if (isLiked != null) {
            post.liked = true;
        }
        // if (post.user_id.image) post.user_id.image = `${req.protocol}://${req.get('host')}/profileImage/${post.user_id.image}`;

        // Update image URLs
        if (post.images) {
            post.images = post.images.map(image => `${req.protocol}://${req.get('host')}/postfile/${image}`);
        }
    });

    // Wait for all promises to resolve
    await Promise.all(postPromises);

    // Send the response
    res.json(posts);
}

const getPost = async (req, res, next) => {
    const { id } = req.params       
    if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)           
    const post = await Post.findById(id).populate({
        path: 'user_id',
        select: 'name'  
    })
    if (!post) throw new AppError('post not found', 404)
    const isLiked = await Like.findOne({ post_id: post._id, user_id: req.user._id });
    if (isLiked != null) {
        post.liked = true;
    }
    if (post.images) {
        post.images = post.images.map(image => `${req.protocol}://${req.get('host')}/postfile/${image}`);
    }
    res.json(post);
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

        // first delete the likes of the post
        await Like.deleteMany({ post_id: post._id });
        // get all comments related to the post 
        const comments = await Comment.find({ post_id: post._id });
        // loop through the comments to delete it and its related documents
        for (const comment of comments) {
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
                if (reply.file) fs.unlinkSync(path.join(__dirname, '../uploads/replies', reply.file))
            }
            // Delete the comment document
            await Comment.findByIdAndDelete(comment._id);
            // delete the comment file
            if (comment.file) fs.unlinkSync(path.join(__dirname, '../uploads/comments', comment.file))
        }
        // delete the post
        await Post.findByIdAndDelete(post._id);
        // loop through post files to delete it
        post.images.forEach((image) => {
            // delete all files of the post
            fs.unlinkSync(path.join(__dirname, '../uploads/posts', image))
        });
        res.json('Post successfully deleted');
    }
    catch (err) {
        next(err);
    }
};



module.exports = { addPost, getMyPosts, getPosts, getPost, deletePost, updatePost, getUserPosts }