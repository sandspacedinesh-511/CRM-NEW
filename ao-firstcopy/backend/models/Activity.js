const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['DOCUMENT_UPLOAD', 'APPLICATION_UPDATE', 'NOTE_ADDED', 'PHASE_CHANGE', 'TASK_COMPLETED', 'EMAIL_SENT', 'DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED', 'LEAD_CREATED']]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'Activities',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Activity; 