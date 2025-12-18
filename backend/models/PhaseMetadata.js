const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhaseMetadata = sequelize.define('PhaseMetadata', {
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
    },
    comment: 'Student ID this phase metadata belongs to'
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Country this phase belongs to'
  },
  phaseName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of the phase (e.g., DOCUMENT_COLLECTION, UNIVERSITY_SHORTLISTING)'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Current', 'Completed', 'Locked'),
    defaultValue: 'Pending',
    comment: 'Current status of the phase'
  },
  reopenCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of times this phase has been reopened'
  },
  maxReopenAllowed: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    comment: 'Maximum number of times this phase can be reopened'
  },
  finalEditAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether final edit is allowed (becomes false after 3rd update)'
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
      fields: ['phaseName']
    },
    {
      fields: ['studentId', 'country', 'phaseName'],
      unique: true,
      name: 'unique_student_country_phase'
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = PhaseMetadata;

