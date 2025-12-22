const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemLog = sequelize.define('SystemLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    level: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'error, warn, info, debug'
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'system',
        comment: 'system, performance, realtime, error'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    meta: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stores flexible data like query duration, user ID, ip, stack trace'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'system_logs',
    timestamps: true, // Adds createdAt and updatedAt, though timestamp field is also explicit
    indexes: [
        {
            fields: ['level']
        },
        {
            fields: ['type']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = SystemLog;
