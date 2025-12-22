// Sync Reminder model to database
const { sequelize, Reminder } = require('./models');

async function syncReminderModel() {
    try {
        console.log('  Syncing Reminder model to database...');

        // Sync only the Reminder model
        await Reminder.sync({ alter: true });

        console.log('  Reminder table created/updated successfully!');
        console.log('  Table structure:');
        console.log('   - id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('   - counselorId (INTEGER, FOREIGN KEY)');
        console.log('   - studentId (INTEGER, FOREIGN KEY)');
        console.log('   - title (STRING, OPTIONAL)');
        console.log('   - message (TEXT, REQUIRED)');
        console.log('   - reminderDatetime (DATE, REQUIRED)');
        console.log('   - status (ENUM: pending, triggered, cancelled)');
        console.log('   - createdAt (DATE)');
        console.log('   - updatedAt (DATE)');

        process.exit(0);
    } catch (error) {
        console.error('  Error syncing Reminder model:', error);
        process.exit(1);
    }
}

syncReminderModel();
