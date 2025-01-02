const User = require('../entities/user/User.mongoModel');
const School = require('../entities/school/School.mongoModel');
const Classroom = require('../entities/classroom/Classroom.mongoModel');
const Student = require('../entities/student/Student.mongoModel');
const Session = require('../entities/session/Session.mongoModel');
const bcrypt = require('bcrypt');
const jwt        = require('jsonwebtoken');
const TokenManager = require('../token/Token.manager');

class UserManager {
    constructor({config, managers, validators}={}){
        this.validators          = validators;
        this.tokenManager        = managers.token;
        this.managers            = managers;
        this.usersCollection     = "users";
        this.config              = config;
        this.httpExposed = ['post=createUser', 'post=login'];
    }

    async login({ username, email, password }) {
        try {
            const user = await User.findOne({ username, email });
            if (!user) {
                return { error: 'Invalid username or email' };
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return { error: 'Invalid password' };
            }

            const existingSession = await Session.findOne({ email: user.email });
            if (existingSession) {
                const decoded = this.tokenManager._verifyToken({ token: existingSession.token, secret: this.config.dotEnv.LONG_TOKEN_SECRET });
                if (decoded) {
                    return {
                        message: 'Login successful',
                        longToken: existingSession.token
                    };
                }
            }

            let longToken = this.tokenManager.genLongTokenWithRole({
                userId: user.username,
                userKey: user.email,
                role: user.role
            });

            let session = new Session({ email: user.email, token: longToken });
            await session.save();

            return {
                message: 'Login successful',
                longToken
            };
        } catch (error) {
            return { error: 'Error logging in due to: ' + error.message };
        }
    }

    async createUser({ username, email, password, role, purviewSchoolId }) {
        try {
  
            if (!purviewSchoolId && role === 'schooladministrator') {
                return { error: 'SchoolId is required for School Administrator role' };
            }
    
            const schoolId = purviewSchoolId;
            const userInfo = { username, email, password, role };
            let result = await this.validators.user.createUser(userInfo);
            if (result) return { errors: result[0].message };
    
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return { error: 'User already exists with the provided email' };
            }
    
            const hashedPassword = await bcrypt.hash(userInfo.password, 10);
    
            if (role === 'schooladministrator') {
                const existingSchool = await School.findById(schoolId);
                if (!existingSchool) {
                    return { error: 'School not found' };
                }
            }
    
            let createdUser = { username, email, password: hashedPassword, role };
            if (role === 'schooladministrator') {
                createdUser.purviewSchoolId = schoolId;
            }
    
            let user = new User(createdUser);
            await user.save();
    
            return {
                message: 'User has been created successfully'
            };
        } catch (error) {
            return { error: 'Error creating user due to: ' + error.message };
        }
    }

    async checkUserPermissions(decoded, req, res, next) {
        try {
            const user = await User.findOne({ email: decoded.userKey });
            if (!user) {
                return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 404, errors: 'User Not Found' });
            }

            if (user.role === 'schooladministrator') {
                const schoolId = user.purviewSchoolId.toString();

                const requestSchoolId = req.body.schoolId || req.query.schoolId || req.params.schoolId;

                if (requestSchoolId) {
                    if (requestSchoolId !== schoolId) {
                        return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 403, errors: 'Access Denied: You can only manage your assigned school' });
                    }
                }

                const classroomId = req.body.classroomId || req.query.classroomId || req.params.classroomId;
                if (classroomId) {
                    const classroom = await Classroom.findById(classroomId);
                    if (!classroom || classroom.schoolId.toString() !== schoolId) {
                        return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 403, errors: 'Access Denied: You can only manage classrooms for your assigned school' });
                    }
                }

                const studentId = req.body.studentId || req.query.studentId || req.params.studentId;
                if (studentId) {
                    const student = await Student.findById(studentId);
                    if (!student || student.schoolId.toString() !== schoolId) {
                        return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 403, errors: 'Access Denied: You can only manage students for your assigned school' });
                    }

                    if (student.classroomId) {
                        const classroom = await Classroom.findById(student.classroomId);
                        if (!classroom || classroom.schoolId.toString() !== schoolId) {
                            return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 403, errors: 'Access Denied: The student\'s classroom does not belong to your assigned school' });
                        }
                    }
                }
            }
            next(req);
        } catch (error) {
            return this.managers.responseDispatcher.dispatch(res, { ok: false, code: 500, errors: 'Internal Server Error' });
        }
    }
}

module.exports = UserManager;