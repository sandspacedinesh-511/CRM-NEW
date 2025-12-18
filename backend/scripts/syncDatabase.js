const sequelize = require('../config/database');
const { Notification } = require('../models');

async function syncDatabase() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Syncing Notification model...');
        await Notification.sync({ alter: true });
        console.log('Notification model synced.');

        process.exit(0);
    } catch (error) {
        console.error('Failed to sync database:', error);
        process.exit(1);
    }
}

syncDatabase();
