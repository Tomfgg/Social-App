const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    friend: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' }
});

const Friend = mongoose.model('friends', friendSchema);

module.exports = Friend;