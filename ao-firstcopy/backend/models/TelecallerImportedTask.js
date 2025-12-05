const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TelecallerImportedTask = sequelize.define(
  'TelecallerImportedTask',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telecallerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'telecaller_id'
    },
    sNo: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 's_no'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contact_number'
    },
    emailId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_id'
    },
    assigned: {
      type: DataTypes.STRING,
      allowNull: true
    },
    callStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'call_status'
    },
    leadStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lead_status'
    },
    interestedCountry: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'interested_country'
    },
    services: {
      type: DataTypes.STRING,
      allowNull: true
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isLead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_lead'
    }
  },
  {
    tableName: 'TelecallerImportedTasks',
    timestamps: true,
    indexes: [
      {
        fields: ['telecaller_id']
      }
    ]
  }
);

module.exports = TelecallerImportedTask;


