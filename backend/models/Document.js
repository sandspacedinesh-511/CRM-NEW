const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
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
  type: {
    type: DataTypes.ENUM(
      'PASSPORT',
      'ACADEMIC_TRANSCRIPT',
      'RECOMMENDATION_LETTER',
      'STATEMENT_OF_PURPOSE',
      'ENGLISH_TEST_SCORE',
      'CV_RESUME',
      'FINANCIAL_STATEMENT',
      'BIRTH_CERTIFICATE',
      'MEDICAL_CERTIFICATE',
      'POLICE_CLEARANCE',
      'BANK_STATEMENT',
      'SPONSOR_LETTER',
      'ID_CARD',
      'ENROLLMENT_LETTER',
      'OFFER_LETTER',
      // Country-specific document types
      'I_20_FORM',
      'SEVIS_FEE_RECEIPT',
      'DS_160_CONFIRMATION',
      'VISA_APPOINTMENT_CONFIRMATION',
      'BANK_STATEMENTS',
      'SPONSOR_AFFIDAVIT',
      'INCOME_PROOF',
      'TB_TEST_CERTIFICATE',
      'TUITION_FEE_RECEIPT',
      'BLOCKED_ACCOUNT_PROOF',
      'HEALTH_INSURANCE',
      'APS_CERTIFICATE',
      'VISA_APPLICATION',
      'BIOMETRICS',
      'LOA',
      'GIC_CERTIFICATE',
      'MEDICAL_EXAM',
      'OSHC',
      'ECOE',
      'FINANCIAL_PROOF',
      'MEDICAL_INSURANCE',
      'CAMPUS_FRANCE_REGISTRATION',
      'INTERVIEW_ACKNOWLEDGEMENT',
      'OFII_FORM',
      'UNIVERSITALY_RECEIPT',
      'ACCOMMODATION_PROOF',
      'IPA_LETTER',
      'MEDICAL_REPORT',
      'STUDENT_VISA_APPROVAL',
      'MEDICAL_TEST',
      'EMIRATES_ID_APPLICATION',
      'OTHER'
    ),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW'),
    defaultValue: 'PENDING'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  mimeType: {
    type: DataTypes.STRING
  },
  size: {
    type: DataTypes.INTEGER
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isLatest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  issuingAuthority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  countryOfIssue: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    defaultValue: 'MEDIUM'
  }
}, {
  tableName: 'Documents',
  timestamps: true,
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['uploadedBy']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isLatest']
    },
    {
      fields: ['expiryDate']
    }
  ]
});

module.exports = Document;