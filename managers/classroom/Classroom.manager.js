const Classroom = require('../entities/classroom/Classroom.mongoModel');
const School = require('../entities/school/School.mongoModel');
const jwt = require('jsonwebtoken');

module.exports = class ClassroomManager {
    constructor({config, managers, validators}={}){
        this.validators = validators;
        this.config = config;
        this.managers = managers;
        this.httpExposed = [
            'post=createClassroom',
            'get=getClassroomsByClassroomId',
            'get=getClassroomsBySchoolId',
            'put=updateClassroom',
            'delete=deleteClassroom'
        ];
        this.rolesByUrl = {
            'createClassroom': ['schooladministrator', 'superadmin'],
            'getClassroomsByClassroomId': ['schooladministrator', 'superadmin'],
            'getClassroomsBySchoolId': ['schooladministrator', 'superadmin'],
            'updateClassroom': ['schooladministrator', 'superadmin'],
            'deleteClassroom': ['schooladministrator', 'superadmin']
        };
    }

    async createClassroom({ __longToken, __roleBasedAuthorization, name, schoolId, capacity, resources }) {
        try {            
            const userId = __longToken.userKey;
            const school = await School.findById(schoolId);
            if (!school) {
                return { error: 'School not found' };
            }
    
            const existingClassroom = await Classroom.findOne({ name, schoolId });
            if (existingClassroom) {
                return { error: 'Classroom already exists with the provided name in this school' };
            }
    
            const classroomInfo = { name, schoolId, capacity, resources, createdBy: userId };
            let result = await this.validators.classroom.createClassroom(classroomInfo);
            if (result) return { errors: result[0].message };
    
            const classroom = new Classroom(classroomInfo);
            await classroom.save();
    
            return {
                message: 'Classroom has been created successfully',
                classroom
            };
        } catch (error) {
            return { error: 'Error creating classroom due to: ' + error.message };
        }
    }

    async getClassroomsBySchoolId({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { schoolId } = __query;
            const classrooms = await Classroom.findBySchoolId(schoolId);
            if (!classrooms || classrooms.length === 0) {
                return { error: 'Classrooms not found for the SchoolId' };
            }
            return classrooms;
        } catch (error) {
            return { error: 'Error fetching classrooms due to: ' + error.message };
        }
    }

    async getClassroomsByClassroomId({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { classroomId } = __query;
            const classroom = await Classroom.findById(classroomId);
            if (!classroom) {
                return { error: 'Classroom not found' };
            }
            return classroom;
        } catch (error) {
            return { error: 'Error fetching classroom due to: ' + error.message };
        }
    }

    async updateClassroom({ __longToken, __roleBasedAuthorization, classroomId, name, capacity, resources }) {
        try {
            const classroomInfo = {};
            if (name !== undefined) classroomInfo.name = name;
            if (capacity !== undefined) classroomInfo.capacity = capacity;
            if (resources !== undefined) classroomInfo.resources = resources;
    
            let result = await this.validators.classroom.updateClassroom(classroomInfo);
            if (result) return {errors: result[0].message};
    
            const classroom = await Classroom.findByIdAndUpdate(classroomId, { $set: classroomInfo }, { new: true, runValidators: true });
            if (!classroom) {
                return { error: 'Classroom not found' };
            }
    
            return {
                message: 'Classroom has been updated successfully',
                classroom
            };
        } catch (error) {
            return { error: 'Error updating classroom due to: ' + error.message };
        }
    }

    async deleteClassroom({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { classroomId } = __query;
            const classroom = await Classroom.findByIdAndDelete(classroomId);
            if (!classroom) {
                return { error: 'Classroom not found' };
            }

            return {
                message: 'Classroom has been deleted successfully'
            };
        } catch (error) {
            return { error: 'Error deleting classroom due to: ' + error.message };
        }
    }
};