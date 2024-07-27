const User = require('../models/users')
const Friend = require('../models/friends');
const AppError = require('../utils/AppError')
const { ObjectId } = require('mongodb')

const addFriend = async (req, res, next) => {
    try {
        const myid = req.user._id
        const friendid = req.params.id
        if (friendid == String(req.user._id)) throw new AppError('invalid id', 400)
        if (!ObjectId.isValid(friendid)) throw new AppError('invalid id', 400)
        const friend = await User.findById(friendid)
        if (!friend) throw new AppError('user not found', 404)
        const exists = await Friend.findOne({
            $or: [{
                $and: [{ friend: myid },
                { user: friendid }]
            }, { $and: [{ user: myid }, { friend: friendid }] }]
        })
        if (exists) throw new AppError('friend already exists', 400)
        await Friend.create({ user: myid, friend: friendid })
        res.json('friend request sent successfully')
    }
    catch (error) {
        next(error)
    }
}

const removeFriend = async (req, res, next) => {
    try {
        const myid = req.user._id
        const friendid = req.params.id
        if (friendid == String(req.user._id)) throw new AppError('invalid id', 400)
        if (!ObjectId.isValid(friendid)) throw new AppError('invalid id', 400)
        const friend = await User.findById(friendid)
        if (!friend) throw new AppError('user not found', 404)
        const relation = await Friend.findOne({
            $and: [{ status: 'accepted' },
            {
                $or: [{
                    $and: [{ friend: myid },
                    { user: friendid }]
                }, { $and: [{ user: myid }, { friend: friendid }] }]
            }
            ]
        })
        if (!relation) throw new AppError('friend relation does not exist', 400)
        await relation.deleteOne()
        res.json('friend relation removed')
    }
    catch (error) {
        next(error)
    }
}

const acceptFriend = async (req, res, next) => {
    try {
        const myid = req.user._id
        const friendid = req.params.id
        if (friendid == String(req.user._id)) throw new AppError('invalid id', 400)
        if (!ObjectId.isValid(friendid)) throw new AppError('invalid id', 400)
        const friend = await User.findById(friendid)
        if (!friend) throw new AppError('user not found', 404)
        const request = await Friend.findOne({ $and: [{ status: 'pending' }, { $and: [{ user: friendid }, { friend: myid }] }] })
        if (!request) throw new AppError('friend request not found', 404)
        request.status = 'accepted'
        await request.save()
        res.json('friend request accepted')
    }
    catch (error) {
        next(error)
    }
}

const rejectFriend = async (req, res, next) => {
    try {
        const myid = req.user._id
        const friendid = req.params.id
        if (friendid == String(req.user._id)) throw new AppError('invalid id', 400)
        if (!ObjectId.isValid(friendid)) throw new AppError('invalid id', 400)
        const friend = await User.findById(friendid)
        if (!friend) throw new AppError('user not found', 404)
        const request = await Friend.findOne({
            $and: [{ status: 'pending' },
            {
                $or: [{
                    $and: [{ friend: myid },
                    { user: friendid }]
                }, { $and: [{ user: myid }, { friend: friendid }] }]
            }
            ]
        })
        if (!request) throw new AppError('friend request not found', 404)
        await request.deleteOne()
        res.json('friend request removed')
    }
    catch (error) {
        next(error)
    }
}

const getFriends = async (req, res, next) => {
    const id = req.user._id
    const friendsMeUser = await Friend.find({ $and: [{ user: id }, { status: 'accepted' }] }).populate({
        path: 'friend',
        select: 'name image'
    })
    const friendsMeFriend = await Friend.find({ $and: [{ friend: id }, { status: 'accepted' }] }).populate({
        path: 'user',
        select: 'name image'
    })
    const part1 = friendsMeUser.map(friend => friend.friend)
    const part2 = friendsMeFriend.map(friend => friend.user)
    res.json(part1.concat(part2))
}

const getSentRequests = async (req, res, next) => {
    const id = req.user._id
    const sentRequests = await Friend.find({ $and: [{ user: id }, { status: 'pending' }] }).populate({
        path: 'friend',
        select: 'name image'
    })
    const sent = sentRequests.map(friend => friend.friend)
    res.json(sent)
}

const getReceivedRequests = async (req, res, next) => {
    const id = req.user._id
    const receivedRequests = await Friend.find({ $and: [{ friend: id }, { status: 'pending' }] }).populate({
        path: 'user',
        select: 'name image'
    })
    const received = receivedRequests.map(friend => friend.user)
    res.json(received)
}

const withdrawRequest = async (req,res,next)=>{
    try {
        const myid = req.user._id
        const friendid = req.params.id
        if (friendid == String(req.user._id)) throw new AppError('invalid id', 400)
        if (!ObjectId.isValid(friendid)) throw new AppError('invalid id', 400)
        const friend = await User.findById(friendid)
        if (!friend) throw new AppError('user not found', 404)
        const request = await Friend.findOne({
            $and: [{ status: 'pending' },
            {$and: [{ friend: friendid },{ user: myid }]}]
        })
        if (!request) throw new AppError('friend request not found', 404)
        await request.deleteOne()
        res.json('friend request removed')
    }
    catch (error) {
        next(error)
    }
}

module.exports = { addFriend, removeFriend, acceptFriend, rejectFriend, getFriends, getSentRequests, getReceivedRequests, withdrawRequest }