const commonSchema = require('../../_common/schema.models');

module.exports = {
    createClassroom: [
        commonSchema.name,
        commonSchema.schoolId,
        commonSchema.capacity,
        commonSchema.resources
    ],
    updateClassroom: [
        {
            ...commonSchema.name,
            required: false
        },
        {
            ...commonSchema.capacity,
            required: false
        },
        {
            ...commonSchema.resources,
            required: false
        }
    ]
};