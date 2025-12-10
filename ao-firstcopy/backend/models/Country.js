const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Country = sequelize.define('Country', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Country name (e.g., United States, United Kingdom)'
    },
    code: {
      type: DataTypes.STRING(2),
      allowNull: false,
      unique: true,
      comment: 'ISO country code (e.g., US, UK, CA)'
    },
    region: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Geographic region (e.g., North America, Europe)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this country is available for selection'
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
    tableName: 'countries',
    timestamps: true,
    indexes: [
      // Only index isActive since name and code already have unique constraints (which create indexes)
      { fields: ['isActive'] }
    ]
  });

  return Country;
};
