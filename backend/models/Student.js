const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  nationality: {
    type: DataTypes.STRING
  },
  passportNumber: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  currentPhase: {
    type: DataTypes.ENUM(
      'DOCUMENT_COLLECTION',
      'UNIVERSITY_SHORTLISTING',
      'APPLICATION_SUBMISSION',
      'OFFER_RECEIVED',
      'INITIAL_PAYMENT',
      'INTERVIEW',
      'FINANCIAL_TB_TEST',
      'CAS_VISA',
      'VISA_APPLICATION',
      'ENROLLMENT'
    ),
    defaultValue: 'DOCUMENT_COLLECTION'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'DEFERRED', 'REJECTED', 'COMPLETED'),
    defaultValue: 'ACTIVE'
  },
  deferralReason: {
    type: DataTypes.TEXT
  },
  rejectionReason: {
    type: DataTypes.TEXT
  },
  nextIntakeDate: {
    type: DataTypes.DATEONLY
  },
  applicationDeadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preferredUniversity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredCourse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  yearOfStudy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  completionYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  targetCountries: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentsAnnualIncome: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  counselorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Owner of the lead from the marketing side (separate from counselor ownership)
  marketingOwnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isPaused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pauseReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pausedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pausedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Students'
});

module.exports = Student; 