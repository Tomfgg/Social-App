const User = require('../models/users')
const Comment = require('../models/comments')
const Post = require('../models/posts')
const Like = require('../models/likes')
const Reply = require('../models/replies')
const AppError = require('../utils/AppError')
const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')

const addFriend = async (req,res,next) => {
    try {
    const {id} = req.params
    if (id == String(req.user._id)) throw new AppError('invalid id', 400)
    if (!ObjectId.isValid(id)) throw new AppError('invalid id', 400)
    if (req.user.friends.includes(id) || req.user.sent.includes(id) || req.user.received.includes(id)) throw new AppError('user already exists', 400)
    const user = await User.findById(id)
    if (!user) throw new AppError('user not found', 404)
    const me = req.user
    user.received.push(me._id)
    me.sent.push(user._id)
    await me.save()
    await user.save()
    res.json('friend request sent successfully')
    }
    catch (err) {next(err)}
}

const removeFriend = async (req, res, next) => {
    try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
    const user = await User.findById(id)
    if (!user) throw new AppError('user not found', 404)
    const me = req.user
    if (!user.friends.includes(me._id)) throw new AppError('friend not found', 404)
    user.friends.pull(me._id)
    me.friends.pull(user._id)
    await me.save()
    await user.save()
    res.json('friend successfully removed')
    }
    catch (err) { next(err) }
}

const acceptFriend = async (req,res,next) => {
    try {
    const {id} = req.params
    if (!id) throw new AppError('id not found', 404)
    if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
    const user = await User.findById(id)
    if (!user) throw new AppError('user not found', 404)
    const me = req.user 
    if (!me.received.includes(user._id)) throw new AppError('user not found', 404)
    user.sent.pull(me._id)
    me.received.pull(user._id)
    me.friends.push(user._id)
    user.friends.push(me._id)
    await me.save()
    await user.save()
    res.json('friend added successfully')
    }
    catch (err) { next(err) }
}

const rejectFriend = async (req,res,next) => {
    try {
    const {id} = req.params
    if (!id) throw new AppError('id not found', 404)
    if (!ObjectId.isValid(id)) throw new AppError('invalid post id', 400)
    const user = await User.findById(id)
    if (!user) throw new AppError('user not found', 404)
    const me = req.user
    user.sent.pull(me._id)
    me.received.pull(user._id)
    await me.save()
    await user.save()
    res.json('friend request rejected')
    }
    catch (err) { next(err) }
}

const getFriends = async (req,res,next) => {
    const user = await User.findById(req.user._id).populate('friends')
    res.json(user.friends)
}

const getSentRequests = async (req,res,next) => {
    const users = await User.findById(req.user._id).populate('sent')
    res.json(users.sent)
}

const getReceivedRequests = async (req,res,next) => {
    const users = await User.findById(req.user._id).populate('received')
    res.json(users.received)
}


module.exports = { addFriend, removeFriend, acceptFriend, rejectFriend, getFriends, getSentRequests, getReceivedRequests }
