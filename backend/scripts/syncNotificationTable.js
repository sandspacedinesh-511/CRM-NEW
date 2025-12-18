const sequelize = require('../config/database');
const { Notification } = require('../models');

async function syncNotificationTable() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        console.log('🔄 Syncing Notification model...');
        await Notification.sync({ alter: true });
        console.log('✅ Notification table created/updated successfully');

        console.log('\n📊 Notification Table Structure:');
        console.log('- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- userId (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- type (STRING)');
        console.log('- title (STRING)');
        console.log('- message (TEXT)');
        console.log('- isRead (BOOLEAN, DEFAULT: false)');
        console.log('- priority (ENUM: low, medium, high)');
        console.log('- leadId (INTEGER, NULLABLE)');
        console.log('- sharedByCounselorId (INTEGER, NULLABLE)');
        console.log('- metadata (JSON, NULLABLE)');
        console.log('- scheduledTime (DATE, NULLABLE) - NEW: For reminder notifications');
        console.log('- reminderText (TEXT, NULLABLE) - NEW: Reminder message text');
        console.log('- createdAt (TIMESTAMP)');
        console.log('- updatedAt (TIMESTAMP)');

        console.log('\n✅ Database sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncNotificationTable();

