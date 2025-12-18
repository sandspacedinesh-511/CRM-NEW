const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentUniversityApplication = sequelize.define('StudentUniversityApplication', {
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
  universityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Universities',
      key: 'id'
    }
  },
  courseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courseLevel: {
    type: DataTypes.ENUM('UNDERGRADUATE', 'POSTGRADUATE', 'PHD', 'DIPLOMA', 'CERTIFICATE'),
    allowNull: false
  },
  intakeTerm: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicationDeadline: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  applicationStatus: {
    type: DataTypes.ENUM(
      'PENDING',
      'SUBMITTED',
      'UNDER_REVIEW',
      'ACCEPTED',
      'REJECTED',
      'DEFERRED',
      'WAITLISTED',
      'CONDITIONAL_OFFER'
    ),
    defaultValue: 'PENDING'
  },
  applicationFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  applicationFeePaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  applicationFeePaidDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Priority order for this application (1 = highest priority)'
  },
  isPrimaryChoice: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is the student\'s primary choice'
  },
  isBackupChoice: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this is a backup choice'
  },
  applicationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  decisionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  offerLetterReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  offerLetterDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  scholarshipOffered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scholarshipAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  scholarshipType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  visaRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  visaStatus: {
    type: DataTypes.ENUM('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED'),
    defaultValue: 'NOT_STARTED'
  },
  notes: {
    type: DataTypes.TEXT
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deferralReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Conditions for conditional offers'
  },
  documentsSubmitted: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of documents submitted for this application'
  },
  documentsRequired: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of documents required for this application'
  },
  applicationTrackingNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'University\'s application tracking number'
  },
  counselorNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Internal notes for counselors'
  },
  studentNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes visible to students'
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['universityId']
    },
    {
      fields: ['applicationStatus']
    },
    {
      fields: ['applicationDeadline']
    },
    {
      fields: ['intakeTerm']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['isPrimaryChoice']
    },
    {
      fields: ['visaStatus']
    },
    {
      fields: ['studentId', 'applicationStatus']
    },
    {
      fields: ['studentId', 'isPrimaryChoice']
    }
  ]
});

module.exports = StudentUniversityApplication; 