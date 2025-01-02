const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    established: {
        type: Number,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

schoolSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

schoolSchema.index({ name: 1, address: 1 }, { unique: true });

const School = mongoose.model('School', schoolSchema);

module.exports = School;