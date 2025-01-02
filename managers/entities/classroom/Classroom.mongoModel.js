const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    // seperate it out in a seperate schema?
    resources: [{    
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
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

classroomSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

classroomSchema.statics.findBySchoolId = function(schoolId) {
    return this.find({ schoolId });
};

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;