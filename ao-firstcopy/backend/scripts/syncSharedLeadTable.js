const sequelize = require('../config/database');
const { SharedLead } = require('../models');

async function syncSharedLeadTable() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        console.log('🔄 Syncing SharedLead model...');
        await SharedLead.sync({ alter: true });
        console.log('✅ SharedLead table created/updated successfully');

        console.log('\n📊 SharedLead Table Structure:');
        console.log('- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- sender_id (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- receiver_id (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- student_id (INTEGER, FOREIGN KEY -> Students.id)');
        console.log('- status (ENUM: pending, accepted, rejected)');
        console.log('- created_at (TIMESTAMP)');
        console.log('- updated_at (TIMESTAMP)');

        console.log('\n✅ Database sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncSharedLeadTable();
