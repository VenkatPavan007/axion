const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        ok: false,
        code: 429,  
        errors: 'Too many requests, please try again later.'
    }
});

module.exports = apiLimiter;