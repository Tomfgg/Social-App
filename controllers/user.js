const User = require('../models/users')
const Post = require('../models/posts')
const Comment = require('../models/comments')
const Reply = require('../models/replies')
const Like = require('../models/likes')
const bcrypt = require('bcrypt')
const AppError = require('../utils/AppError')
const { ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const Friend = require('../models/friends')
const path = require('path')
const fs = require('fs')
require('dotenv').config()
const secret = process.env.SECRET

const getUser = async (req, res, next) => {
    req.user.friends = (await Friend.find({ $and: [{ status: 'accepted' }, { $or: [{ user: req.user._id }, { friend: req.user._id }] }] })).length
    if(req.user.image) req.user.image = `https://social-app-f6f0.onrender.com/profileImage/${req.user.image}`
    return res.json(req.user)   
}

const getData = async (req, res, next) => {
    const { id } = req.params
    if (id == req.user._id.toString()) return getUser(req, res, next)
    let relation
    if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
    const user = await User.findById(id)
    if (!user) throw new AppError('user not found', 404)
    user.friends = (await Friend.find({$and: [{ status: 'accepted' },{$or: [{user:id},{friend:id}]}]})).length
    relation = await Friend.findOne({ $and: [{ status: 'accepted' }, 
        {$or: [{ $and: [{ user: id }, { friend: req.user._id }] }, { $and: [{ user: req.user._id }, { friend: id  }] }] }]})
    if (relation) {
        user.relation = 'friend'
       return res.json(user)    
    }
    relation = await Friend.findOne({ $and: [{ status: 'pending' }, { $and: [{ user: id }, { friend: req.user._id }] }] }) 
    if (relation) {
        user.relation = 'ireceived'
        return res.json(user)
    }
    relation = await Friend.findOne({ $and: [{ status: 'pending' }, { $and: [{ user: req.user._id }, { friend:id }] }] }) 
    if (relation) {
        user.relation = 'isent'
        return res.json(user)
    }
    user.relation = 'none'
    // if (user.image) user.image = `https://social-app-f6f0.onrender.com/profileImage/${user.image}`
    res.json(user)  
}

const login = async (req, res, next) => {   
    try {
        const { email, password } = req.body
        if (!email || !password) throw new AppError('missing credentials', 400)
        const user = await User.findOne({ email }).select('password')
        if (!user) throw new AppError('invalid credientials', 404)
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) throw new AppError('invalid credientials', 404)
        const token = jwt.sign({ id: user._id }, secret)
        res.status(200).json({ token })
    }
    catch (err) {
        next(err)
    }
}
const addUser = async (req, res, next) => {
    try {
        const { email, password,confirmPassword, name } = req.body
        if (password !== confirmPassword) throw new AppError('Passwords did not match', 400)
        if (!email || !password || !name) throw new AppError('missing credentials', 400)
        if (password.length < 5) throw new AppError('Password should have at least 5 characters',400)
        if (name.length < 3) throw new AppError('Username should have at least 3 characters',400)
        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {  
            throw new AppError('Name should only contain English characters.',400);
        }
        const user = await User.findOne({ email })
        if (user) throw new AppError('Email already exists', 409)
        const hashedPassword = await bcrypt.hash(password, 10)
        const userCreated = await User.create({ email, 'password': hashedPassword, name })
        userCreated.password = undefined
        res.status(201).send(userCreated)
    }
    catch (err) {
        next(err)
    }
}
const updateUser = async function (req, res, next) {
    try {
        const user = req.user
        const { name, oldImage } = req.body // password
        if (!name) throw new AppError('missing credentials', 400) // !password
        // const hashedPassword = await bcrypt.hash(password, 10)
        // user.password = hashedPassword
        user.name = name
        const newImage = req.file
        if (!oldImage && user.image) {
            const filePath = path.join(__dirname, '../uploads/profileImage', user.image);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                user.image = null
            }
        }
        if (newImage) user.image = newImage.filename
        await user.save()
        if (newImage) user.image = `https://social-app-f6f0.onrender.com/profileImage/${user.image}`
        if (oldImage) user.image = oldImage 
        res.status(200).json(user)
    }
    catch (err) {
        next(err)
    }
}

const getUsers = async (req, res, next) => {
    try {
    let likes
    let users
    const { id, media } = req.params
    if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
    const myMedia = ['Post', 'Comment', 'Reply']
    if (!myMedia.includes(media)) throw new AppError('media should be one of Post or Comment or Reply', 400)
    if (media == 'Post') {
        const post = await Post.findById(id)
        if (!post) throw new AppError('post not found', 404)
         likes = await Like.find({ post_id: id }).populate({
            path: 'user_id',
            select: 'name image' // Only include `name` field, exclude `_id`
        })  
    }
    else if (media == 'Comment') {
        const comment = await Comment.findById(id)
        if (!comment) throw new AppError('comment not found', 404)
        likes = await Like.find({ comment_id: comment._id }).populate({
            path: 'user_id',
            select: 'name image' // Only include `name` field, exclude `_id`
        })
    }
    else {
        const reply = await Reply.findById(id)
        if (!reply) throw new AppError('reply not found', 404)
        likes = await Like.find({ reply_id: reply._id }).populate({
            path: 'user_id',
            select: 'name image' // Only include `name` field, exclude `_id`
        })
    }
        users = likes.map(like => like.user_id)
    res.json(users)
}
catch(error) {
    next(error)
}
}

const deleteUser = async (req,res,next) => {
    try {
    const { id } = req.user._id
    // delete all friend records related to the user
    await Friend.deleteMany({$or: [{user:id},{friend:id}]})
    // delete all likes the user has made
    await Like.deleteMany({user_id:id})
    // get all posts the user has made
    const posts = await Post.find({user_id:id})
    // loop through the posts to delete it and its related documents
    for(const post of posts) {
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
    }
        // get all comments the user has made
        const comments = await Comment.find({ user_id: id });   
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
                // delete the reply file if exists
                if (reply.file) fs.unlinkSync(path.join(__dirname, '../uploads/replies', reply.file))
            }
            // Delete the comment document
            await Comment.findByIdAndDelete(comment._id);
            // delete the comment file if exists
            if (comment.file) fs.unlinkSync(path.join(__dirname, '../uploads/comments', comment.file))
        }
        // get all replies the user has made
        const replies = await Reply.find({ user_id: id });  
        // loop through the replies to delete it and its related documents
        for (const reply of replies) {
            // Delete all likes associated with the reply
            await Like.deleteMany({ reply_id: reply._id });

            // Delete the reply document
            await Reply.findByIdAndDelete(reply._id);
            // delete the reply file if exists
            if (reply.file) fs.unlinkSync(path.join(__dirname, '../uploads/replies', reply.file))
        }
    res.json('user deleted successfully')
    }
    catch (error) {
        next(error)
    }
}

const usersSearch = async (req,res,next) => {
    const {q} = req.query   
    const users = await User.find({ name: { $regex: '^' + q, $options: 'i' }, _id: { $ne: req.user._id } })
    // users.forEach(user=>{
    //     const isFriends = Friend.findOne({$or:[{$and:[{user:req.user._id},{friend:user._id},{status:accepted}]},{}]})
    // })
    res.json(users)
}


module.exports = { getUser, addUser, login, updateUser, deleteUser, getUsers, getData, usersSearch }