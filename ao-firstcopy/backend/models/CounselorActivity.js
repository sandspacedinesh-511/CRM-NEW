const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CounselorActivity = sequelize.define('CounselorActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  counselorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.ENUM('LOGIN', 'LOGOUT', 'DOCUMENT_UPLOAD', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_PREVIEW', 'STUDENT_VIEW', 'STUDENT_EDIT', 'APPLICATION_CREATE', 'APPLICATION_EDIT', 'APPLICATION_DELETE', 'NOTE_ADD', 'PHASE_CHANGE', 'EXPORT_DATA', 'SEARCH', 'FILTER', 'OTHER'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  loginTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sessionDuration: {
    type: DataTypes.INTEGER, // Duration in seconds
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ERROR'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: 'counselor_activities',
  timestamps: true,
  indexes: [
    {
      fields: ['counselorId']
    },
    {
      fields: ['activityType']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['sessionId']
    }
  ]
});

module.exports = CounselorActivity;
