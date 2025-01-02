const Student = require('../entities/student/Student.mongoModel');
const School = require('../entities/school/School.mongoModel');
const Classroom = require('../entities/classroom/Classroom.mongoModel');
const jwt = require('jsonwebtoken');

module.exports = class StudentManager {
    constructor({ config, managers, validators } = {}) {
        this.validators = validators;
        this.config = config;
        this.managers = managers;
        this.httpExposed = [
            'post=createStudent',           
            'get=getStudentByClassroomId',
            'put=updateStudent',
            'put=transferStudent',
            'delete=deleteStudent'
        ];
        this.rolesByUrl = {
            'createStudent': ['schooladministrator', 'superadmin'],
            'getStudentByClassroomId': ['schooladministrator', 'superadmin'],
            'updateStudent': ['schooladministrator', 'superadmin'],
            'transferStudent': ['schooladministrator', 'superadmin'],
            'deleteStudent': ['schooladministrator', 'superadmin']
        };
    }

    async createStudent({ __longToken, __roleBasedAuthorization, firstName, lastName, email, schoolId, classroomId }) {
        try {
            const userId = __longToken.userKey;
    
            const school = await School.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }
    
            const existingStudent = await Student.findOne({ firstName, lastName, email });
            if (existingStudent) {
                return { error: 'Student already exists with the provided firstName, lastName, and email' };
            }

            if (classroomId) {
                const classroom = await Classroom.findOne({ _id: classroomId, schoolId });
                if (!classroom) {
                    return { error: 'Classroom not found or does not belong to the specified school' };
                }
            }
    
            const studentInfo = { firstName, lastName, email, schoolId, classroomId, createdBy: userId };
            let result = await this.validators.student.createStudent(studentInfo);
            if (result) return result;
    
            const student = new Student(studentInfo);
            await student.save();
    
            return {
                message: 'Student has been created successfully',
                student
            };
        } catch (error) {
            return { error: 'Error creating student due to: ' + error.message };
        }
    }


    async getStudentByClassroomId({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { classroomId } = __query;
            const student = await Student.findByClassroomId(classroomId);
            if (!student || student.length === 0) {
                return { error: 'Student not found' };
            }
            return student;
        } catch (error) {
            return { error: 'Error fetching student due to: ' + error.message };
        }
    }

    async updateStudent({ __longToken, __roleBasedAuthorization, studentId, firstName, lastName, email, classroomId }) {
        try {
            const student = await Student.findById(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }
    
            const studentInfo = {};
            if (firstName !== undefined) studentInfo.firstName = firstName;
            if (lastName !== undefined) studentInfo.lastName = lastName;
            if (email !== undefined) studentInfo.email = email;
            if (classroomId !== undefined) studentInfo.classroomId = classroomId;
    
            // Check if the classroom belongs to the specified school
            if (classroomId) {
                const classroom = await Classroom.findOne({ _id: classroomId, schoolId: student.schoolId });
                if (!classroom) {
                    return { error: 'Classroom not found or does not belong to the specified school' };
                }
            }
    
            let result = await this.validators.student.updateStudent(studentInfo);
            if (result) return result;
    
            const updatedStudent = await Student.findByIdAndUpdate(studentId, { $set: studentInfo }, { new: true, runValidators: true });
            if (!updatedStudent) {
                return { error: 'Student not found' };
            }
    
            return {
                message: 'Student has been updated successfully',
                student: updatedStudent
            };
        } catch (error) {
            return { error: 'Error updating student due to: ' + error.message };
        }
    }

    async transferStudent({ __longToken, __roleBasedAuthorization, studentId, newSchoolId, newClassroomId }) {
        try {
            const school = await School.findById(newSchoolId);
            if (!school) {
                return { error: 'New school not found' };
            }
    
            const classroom = await Classroom.findOne({ _id: newClassroomId, schoolId: newSchoolId });
            if (!classroom) {
                return { error: 'New classroom not found or does not belong to the specified school' };
            }
    
            const studentInfo = { schoolId: newSchoolId, classroomId: newClassroomId };
    
            let result = await this.validators.student.transferStudent(studentInfo);
            if (result) return result;
    
            const student = await Student.findByIdAndUpdate(studentId, { $set: studentInfo }, { new: true, runValidators: true });
            if (!student) {
                return { error: 'Student not found' };
            }
    
            return {
                message: 'Student has been transferred successfully',
                student
            };
        } catch (error) {
            return { error: 'Error transferring student due to: ' + error.message };
        }
    }

    async deleteStudent({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { studentId } = __query;
            const student = await Student.findByIdAndDelete(studentId);
            if (!student) {
                return { error: 'Student not found' };
            }

            return {
                message: 'Student has been deleted successfully'
            };
        } catch (error) {
            return { error: 'Error deleting student due to: ' + error.message };
        }
    }
};