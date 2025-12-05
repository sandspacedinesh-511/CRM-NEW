const User = require('./User');
const Student = require('./Student');
const University = require('./University');
const StudentUniversityApplication = require('./StudentUniversityApplication');
const Document = require('./Document');
const Note = require('./Note');
const Activity = require('./Activity');
const CounselorActivity = require('./CounselorActivity');
const Task = require('./Task');
const ApplicationCountry = require('./ApplicationCountry');
const CountryApplicationProcess = require('./CountryApplicationProcess');
const Country = require('./Country');
const TelecallerImportedTask = require('./TelecallerImportedTask');
const Notification = require('./Notification');
const SharedLead = require('./SharedLead');
const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Define the junction table for Student-University many-to-many relationship
const StudentUniversity = sequelize.define('StudentUniversity', {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  universityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Universities',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'universityId']
    }
  ]
});

// User associations
User.hasMany(Student, { foreignKey: 'counselorId', as: 'students' });
Student.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// Counselor Activity associations
User.hasMany(CounselorActivity, { foreignKey: 'counselorId', as: 'activities' });
CounselorActivity.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

// Student associations
Student.hasMany(StudentUniversityApplication, { foreignKey: 'studentId', as: 'applications' });
StudentUniversityApplication.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Document, { foreignKey: 'studentId', as: 'documents' });
Document.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Note, { foreignKey: 'studentId', as: 'studentNotes' });
Note.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Activity, { foreignKey: 'studentId', as: 'activities' });
Activity.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// University associations
University.hasMany(StudentUniversityApplication, { foreignKey: 'universityId', as: 'applications' });
StudentUniversityApplication.belongsTo(University, { foreignKey: 'universityId', as: 'university' });

// Student - University associations through StudentUniversityApplication
Student.belongsToMany(University, {
  through: StudentUniversityApplication,
  foreignKey: 'studentId',
  as: 'universities'
});
University.belongsToMany(Student, {
  through: StudentUniversityApplication,
  foreignKey: 'universityId',
  as: 'students'
});

// User associations for notes and activities
User.hasMany(Note, { foreignKey: 'counselorId', as: 'counselorNotes' });
Note.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

User.hasMany(Activity, { foreignKey: 'userId', as: 'userActivities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Task associations
User.hasMany(Task, { foreignKey: 'counselorId', as: 'counselorTasks' });
Task.belongsTo(User, { foreignKey: 'counselorId', as: 'counselor' });

Student.hasMany(Task, { foreignKey: 'studentId', as: 'studentTasks' });
Task.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Telecaller imported task associations
User.hasMany(TelecallerImportedTask, { foreignKey: 'telecallerId', as: 'telecallerImportedTasks' });
TelecallerImportedTask.belongsTo(User, { foreignKey: 'telecallerId', as: 'telecaller' });

// Notification associations
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// SharedLead associations
User.hasMany(SharedLead, { foreignKey: 'senderId', as: 'sentSharedLeads' });
User.hasMany(SharedLead, { foreignKey: 'receiverId', as: 'receivedSharedLeads' });
SharedLead.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
SharedLead.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
SharedLead.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(SharedLead, { foreignKey: 'studentId', as: 'sharedLeads' });

// Initialize Country model
const CountryModel = Country(sequelize);

module.exports = {
  User,
  Student,
  University,
  Document,
  Note,
  Activity,
  CounselorActivity,
  StudentUniversityApplication,
  ApplicationCountry,
  CountryApplicationProcess,
  Task,
  Country: CountryModel,
  TelecallerImportedTask,
  Notification,
  SharedLead
};