const sequelize = require('../config/database');
const { Message } = require('../models');

async function syncMessageTable() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        console.log('🔄 Syncing Message model...');
        await Message.sync({ alter: true });
        console.log('✅ Message table created/updated successfully');

        console.log('\n📊 Message Table Structure:');
        console.log('- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- studentId (INTEGER, FOREIGN KEY -> Students.id)');
        console.log('- senderId (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- receiverId (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- message (TEXT)');
        console.log('- isRead (BOOLEAN, DEFAULT: false)');
        console.log('- readAt (DATE, NULLABLE)');
        console.log('- messageType (ENUM: text, system, notification, DEFAULT: text)');
        console.log('- createdAt (TIMESTAMP)');
        console.log('- updatedAt (TIMESTAMP)');

        console.log('\n✅ Database sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncMessageTable();

