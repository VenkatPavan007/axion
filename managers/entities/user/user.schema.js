const commonSchema = require('../../_common/schema.models');

module.exports = {
    createUser: [
        commonSchema.username,
        commonSchema.email,
        commonSchema.password
    ]
}


