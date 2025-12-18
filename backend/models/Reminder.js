const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reminder = sequelize.define('Reminder', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    counselorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Students',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Optional reminder title'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Reminder message/notes'
    },
    reminderDatetime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Scheduled date and time for the reminder'
    },
    status: {
        type: DataTypes.ENUM('pending', 'triggered', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Status of the reminder'
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
    tableName: 'Reminders',
    timestamps: true,
    indexes: [
        {
            fields: ['counselorId']
        },
        {
            fields: ['studentId']
        },
        {
            fields: ['status', 'reminderDatetime']
        }
    ]
});

module.exports = Reminder;
