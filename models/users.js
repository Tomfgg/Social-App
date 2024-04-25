const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`,
        },
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    name: {
        type: String,
        min: 3,
        max: 10,
        required: true
    },
    sent: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'users',
        index:true
        // select: false
    },
    received: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'users',
        index: true
        // select: false
    },
    friends: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        ref: 'users',
        index: true
        // select: false
    },
})

const userModel = mongoose.model('users',userSchema)
module.exports = userModel