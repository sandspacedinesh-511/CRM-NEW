const sequelize = require('../config/database');

async function addPauseColumns() {
  try {
    console.log('  Connecting to database...');
    await sequelize.authenticate();
    console.log('  Database connection established');

    console.log('  Adding pause columns to Students table...');
    
    // Check if columns already exist
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Students' 
      AND COLUMN_NAME IN ('isPaused', 'pauseReason', 'pausedAt', 'pausedBy')
    `);

    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME);
    console.log('Existing pause columns:', existingColumnNames);

    // Add isPaused column if it doesn't exist
    if (!existingColumnNames.includes('isPaused')) {
      await sequelize.query(`
        ALTER TABLE Students 
        ADD COLUMN isPaused BOOLEAN DEFAULT FALSE
      `);
      console.log('  Added isPaused column');
    } else {
      console.log('   isPaused column already exists');
    }

    // Add pauseReason column if it doesn't exist
    if (!existingColumnNames.includes('pauseReason')) {
      await sequelize.query(`
        ALTER TABLE Students 
        ADD COLUMN pauseReason TEXT NULL
      `);
      console.log('  Added pauseReason column');
    } else {
      console.log('   pauseReason column already exists');
    }

    // Add pausedAt column if it doesn't exist
    if (!existingColumnNames.includes('pausedAt')) {
      await sequelize.query(`
        ALTER TABLE Students 
        ADD COLUMN pausedAt DATETIME NULL
      `);
      console.log('  Added pausedAt column');
    } else {
      console.log('   pausedAt column already exists');
    }

    // Add pausedBy column if it doesn't exist
    if (!existingColumnNames.includes('pausedBy')) {
      await sequelize.query(`
        ALTER TABLE Students 
        ADD COLUMN pausedBy INT NULL,
        ADD CONSTRAINT fk_students_paused_by 
        FOREIGN KEY (pausedBy) REFERENCES Users(id) 
        ON DELETE SET NULL
      `);
      console.log('  Added pausedBy column with foreign key');
    } else {
      console.log('   pausedBy column already exists');
    }

    console.log('\n  All pause columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('  Error adding pause columns:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

addPauseColumns();

