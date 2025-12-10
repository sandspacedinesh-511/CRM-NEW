const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApplicationCountry = sequelize.define('ApplicationCountry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total number of applications in this country'
  },
  primaryApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of primary choice applications in this country'
  },
  backupApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of backup choice applications in this country'
  },
  acceptedApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of accepted applications in this country'
  },
  rejectedApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of rejected applications in this country'
  },
  pendingApplications: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of pending applications in this country'
  },
  totalApplicationFees: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total application fees paid for this country'
  },
  totalScholarshipAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total scholarship amount offered for this country'
  },
  visaRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  visaStatus: {
    type: DataTypes.ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'),
    defaultValue: 'NOT_STARTED'
  },
  preferredCountry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the student\'s preferred country'
  },
  countryRanking: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Student\'s preference ranking for this country (1 = highest)'
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
    defaultValue: 'DOCUMENT_COLLECTION',
    comment: 'Current application phase for this country'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Country-specific notes'
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['country']
    },
    {
      fields: ['studentId', 'country'],
      unique: true
    },
    {
      fields: ['preferredCountry']
    },
    {
      fields: ['visaStatus']
    },
    {
      fields: ['totalApplications']
    }
  ]
});

module.exports = ApplicationCountry;
