const commonSchema = require('../../_common/schema.models');

module.exports = {
    createSchool: [        
        commonSchema.name
    ],
    updateSchool: [
        {
            ...commonSchema.name,
            required: false 
        },
        {
            ...commonSchema.address,
            required: false
        },
        {
            ...commonSchema.established,
            required: false
        }
    ]
};