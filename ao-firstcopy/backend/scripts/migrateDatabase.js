const sequelize = require('../config/database');
const { User, Counselor, Student, University, Application, Document } = require('../models');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Sync all models
    // force: false ensures we don't drop existing tables
    // alter: true updates tables to match models if they exist
    await sequelize.sync({ alter: true });
    
    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
