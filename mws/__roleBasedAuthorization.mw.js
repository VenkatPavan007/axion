module.exports = ({ meta, config, managers }) => {
    return ({req, res, next}) => {
        const token = req.headers.token;

        if (!token) {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 401, errors: 'Access Denied: No Token Provided!' });
        }

        try {
            const decoded = managers.token._verifyToken({ token, secret: config.dotEnv.LONG_TOKEN_SECRET });
            if (!decoded) {
                return managers.responseDispatcher.dispatch(res, { ok: false, code: 400, errors: 'Invalid Token' });
            }

            const url = req.url.split('/');
            const path = url[url.length - 2];
            const fnName = url[url.length - 1];
            const functionName = fnName.includes('?') ? fnName.split('?')[0] : fnName;
            const roles = managers[path].rolesByUrl[functionName];
            const allowedRoles = roles.map(role => role.toLowerCase());
            const userRole = decoded.role.toLowerCase();

            if (!allowedRoles.includes(userRole)) {
                return managers.responseDispatcher.dispatch(res, { ok: false, code: 403, errors: 'Access Denied: You do not have the required permissions!' });
            }
            managers.user.checkUserPermissions(decoded, req, res, next);
        } catch (error) {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 500, errors: 'Internal Server Error' });
        }
    };
};