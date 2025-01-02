const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    email: {
        type: String,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d'
    }
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;