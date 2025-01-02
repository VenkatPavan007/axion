const School = require('../entities/school/School.mongoModel');
const jwt    = require('jsonwebtoken');

module.exports = class SchoolManager {
    
    constructor({config, managers, validators}={}){
        this.validators = validators;
        this.config = config;
        this.managers = managers;
        this.httpExposed = [
            'post=createSchool',
            'get=getSchools',
            'get=getSchoolById',
            'put=updateSchool',
            'delete=deleteSchool'
        ];
        this.rolesByUrl = {
            'createSchool': ['superadmin'],
            'getSchools': ['superadmin'],
            'getSchoolById': ['superadmin'],
            'updateSchool': ['superadmin'],
            'deleteSchool': ['superadmin']
        };
    }

    async createSchool({ __longToken, __roleBasedAuthorization }) {
        try {
            const req = __roleBasedAuthorization;
            const { name, address, established } = req.body;
            const userId = __longToken.userKey;
    
            const existingSchool = await School.findOne({ name, address });
            if (existingSchool) {
                return { error: 'School already exists with the provided name and address' };
            }
    
            const schoolInfo = { name, address, established, createdBy: userId };
            let result = await this.validators.school.createSchool(schoolInfo);
            if (result) return {errors: result[0].message};
    
            const school = new School(schoolInfo);
            await school.save();
    
            return {
                message: 'School has been created successfully',
                school
            };
        } catch (error) {
            return { error: 'Error creating school due to: ' + error.message };
        }
    }

    async getSchools({ __longToken, __roleBasedAuthorization }) {
        try {
            const schools = await School.find();
            return schools;
        } catch (error) {
            return { error: 'Error fetching schools due to: ' + error.message };
        }
    }

    async getSchoolById({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { id } = __query;
            const school = await School.findById(id);
            if (!school) {
                return { error: 'School not found' };
            }
            return school;         
        } catch (error) {
            return { error: 'Error fetching school due to: ' + error.message };
        }
    }

    async updateSchool({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { id } = __query;
            const { name, address, established } = req.body;
            const schoolInfo = { name, address, established };
            let result = await this.validators.school.updateSchool(schoolInfo);
            if (result) return {errors: result[0].message};
    
            const school = await School.findByIdAndUpdate(id, schoolInfo, { new: true, runValidators: true });
            if (!school) {
                return { error: 'School not found' };
            }
    
            return {
                message: 'School has been updated successfully',
                school
            };
        } catch (error) {
            return { error: 'Error updating school due to: ' + error.message };
        }
    }

    async deleteSchool({ __longToken, __roleBasedAuthorization, __query}) {
        try {
            const { id } = __query;
            const school = await School.findByIdAndDelete(id);
            if (!school) {
                return { error: 'School not found' };
            }    
            return {
                message: 'School has been deleted successfully'
            };
        } catch (error) {
            return { error: 'Error deleting school due to: ' + error.message };
        }
    }
};