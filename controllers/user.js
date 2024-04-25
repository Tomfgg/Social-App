const User = require('../models/users')
const Post = require('../models/posts')
const Comment = require('../models/comments')
const Reply = require('../models/replies')
const Like = require('../models/likes')
const bcrypt = require('bcrypt')
const AppError = require('../utils/AppError')
const { ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const secret = process.env.SECRET

const getUser = async (req, res, next) => {
    res.json(req.user)
}

const getData = async (req, res, next) => {
    let isFriend
    const { id } = req.params
    if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
    const user = await User.findById(id).select('+friends +sent +received')
    if (user.friends.includes(req.user._id)) isFriend = 'friend'
    else if (user.sent.includes(req.user._id)) isFriend = 'sent'
    else if (user.received.includes(req.user._id)) isFriend = 'received'
    else isFriend = 'none'
    user.isFriend = isFriend
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
        const { email, password, name } = req.body
        if (!email || !password || !name) throw new AppError('missing credentials', 400)
        const user = await User.findOne({ email })
        if (user) throw new AppError('user already exists', 409)
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
        const { password, name } = req.body
        if (!password || !name) throw new AppError('missing credentials', 400)
        const hashedPassword = await bcrypt.hash(password, 10)
        user.password = hashedPassword
        user.name = name
        user.save()
        res.status(200).json('updated successfully')
    }
    catch (err) {
        next(err)
    }
}

const getUsers = async (req, res, next) => {
    let likes
    const { id, media } = req.params
    if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
    const myMedia = ['Post', 'Comment', 'Reply']
    if (!myMedia.includes(media)) throw new AppError('media should be one of Post or Comment or Reply', 400)
    if (media == 'Post') {
        const post = await Post.findById(id)
        if (!post) throw new AppError('post not found', 404)
        likes = await Like.find({ post_id: post._id }).populate('user_id')
        console.log(likes)
    }
    else if (media == 'Comment') {
        const comment = await Comment.findById(id)
        if (!comment) throw new AppError('comment not found', 404)
        likes = await Like.find({ comment_id: comment._id }).populate('user_id')
    }
    else {
        const reply = await Reply.findById(id)
        if (!reply) throw new AppError('reply not found', 404)
        likes = await Like.find({ reply_id: reply._id }).populate('user_id')
    }
    const modifiedLikes = likes.map(like => {
        const name = like.user_id.name;
        const email = like.user_id.email;
        return { name, email };
    });

    res.json(modifiedLikes);

}

const deleteUser = async (req, res, next) => {
    const { id } = req.user._id

    const friends = await User.find({ friends: id })
    for (const friend of friends) {
        friend.friends.pull(id)
    }
    await friends.save()

    const sentRequests = await User.find({ received: id })
    for (const sentRequest of sentRequests) {
        sentRequest.received.pull(id)
    }
    await sentRequests.save()

    const receivedRequests = await User.find({ sent: id })
    for (const receivedRequest of receivedRequests) {
        receivedRequest.sent.pull(id)
    }
    await receivedRequests.save()

    await Like.deleteMany({ user_id: id })
    await Comment.deleteMany({ user_id: id })
    await Reply.deleteMany({ user_id: id })

    const posts = await Post.find({ user_id: id })

    for (const post of posts) {
        await Like.deleteMany({ post_id: post._id })
        await Comment.deleteMany({ post_id: post._id })
        await Reply.deleteMany({ post_id: post._id })
        await Post.findByIdAndDelete(post._id)
    }

    await User.findByIdAndDelete(id)

    res.json('user deleted successfully')
}


module.exports = { getUser, addUser, login, updateUser, deleteUser, getUsers, getData }