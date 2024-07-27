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
    friends: Number,
    relation: {
        type: String,
        enum: ['friend', 'isent', 'ireceived', 'none'] // Allowed values for the 'role' field
    },
    image: String,
    createdAt: { type: Date, default: Date.now }
})

const userModel = mongoose.model('users', userSchema)
module.exports = userModel