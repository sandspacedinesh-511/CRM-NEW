const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['DOCUMENT_COLLECTION', 'APPLICATION_DEADLINE', 'INTERVIEW_PREPARATION', 'VISA_PROCESS', 'GENERAL', 'DOCUMENT', 'APPLICATION', 'INTERVIEW', 'FOLLOW_UP', 'OTHER']]
    }
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  callOutcome: {
    type: DataTypes.ENUM('Connected', 'Left Voicemail', 'No Answer', 'Callback Requested', 'Wrong Number', 'Other'),
    allowNull: true
  },
  callNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MEDIUM',
    validate: {
      isIn: [['HIGH', 'MEDIUM', 'LOW', 'URGENT']]
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  reminder: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  callOutcome: {
    type: DataTypes.STRING,
    allowNull: true
  },
  callNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  lastAttemptAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for general tasks
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  counselorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'Tasks',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['counselorId']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['completed']
    },
    {
      fields: ['lastAttemptAt']
    },
    {
      fields: ['studentId']
    }
  ]
});

module.exports = Task; 