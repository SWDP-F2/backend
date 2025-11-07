const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const e = require('express');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tel: {
        type: String,
        required: true,
        unique: true
    },
    email: {    
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

userSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

module.exports = mongoose.model('User', userSchema);