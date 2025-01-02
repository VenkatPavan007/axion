const commonSchema = require('../../_common/schema.models');

module.exports = {
    createStudent: [
        commonSchema.firstName,
        commonSchema.lastName,
        commonSchema.email,
        commonSchema.schoolId,
        commonSchema.classroomId
    ],
    updateStudent: [
        {
            ...commonSchema.firstName,
            required: false
        },
        {
            ...commonSchema.lastName,
            required: false
        },
        {
            ...commonSchema.email,
            required: false
        },
        {
            ...commonSchema.classroomId,
            required: false
        }
    ],
    transferStudent: [
        commonSchema.schoolId,
        commonSchema.classroomId
    ]
};