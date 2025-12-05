const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CountryApplicationProcess = sequelize.define('CountryApplicationProcess', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  countryCode: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true
  },
  applicationProcess: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Country-specific application process steps and requirements'
  },
  requiredDocuments: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Required documents for this country'
  },
  applicationTimeline: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Typical application timeline and deadlines'
  },
  visaRequirements: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Visa requirements and process'
  },
  languageRequirements: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Language test requirements'
  },
  financialRequirements: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Financial proof requirements'
  },
  applicationFees: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Typical application fees structure'
  },
  intakeTerms: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Available intake terms for this country'
  },
  processingTime: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Typical processing times for applications'
  },
  specialNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Country-specific notes and considerations'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['country']
    },
    {
      fields: ['countryCode']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = CountryApplicationProcess;
