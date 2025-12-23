const sequelize = require('../config/database');
const { User, Counselor, Student, University, Application, Document } = require('../models');

async function fixTableIndexes(tableName, columnsToCheck) {
  try {
    // Get all indexes on the table
    const [indexes] = await sequelize.query(`
      SHOW INDEXES FROM ${tableName}
    `).catch(() => [[], []]); // If table doesn't exist, return empty array

    if (indexes.length === 0) {
      return; // Table doesn't exist yet, skip
    }

    // Check each column for duplicate indexes
    for (const column of columnsToCheck) {
      const columnIndexes = indexes.filter(idx => idx.Column_name === column);

      if (columnIndexes.length > 1) {
        // Keep only the unique index (if exists) or the first one
        const uniqueIndex = columnIndexes.find(idx => idx.Non_unique === 0);
        const duplicateIndexes = columnIndexes.filter(idx =>
          idx.Key_name !== uniqueIndex?.Key_name && idx.Key_name !== 'PRIMARY'
        );

        for (const idx of duplicateIndexes) {
          try {
            await sequelize.query(`DROP INDEX \`${idx.Key_name}\` ON ${tableName}`);
            console.log(`     Dropped duplicate index: ${idx.Key_name} on ${tableName}.${column}`);
          } catch (err) {
            // Ignore errors for indexes that don't exist
          }
        }
      }
    }
  } catch (error) {
    // If table doesn't exist, that's fine - it will be created
    if (!error.message.includes("doesn't exist")) {
      console.log(`   Warning: Could not fix indexes on ${tableName}:`, error.message);
    }
  }
}

async function fixIndexes() {
  // Fix CountryApplicationProcess table
  await fixTableIndexes('CountryApplicationProcess', ['country', 'countryCode']);

  // Fix countries table
  await fixTableIndexes('countries', ['name', 'code']);

  // Fix Students table (common source of duplicate email indexes)
  await fixTableIndexes('Students', ['email']);

  // Fix Universities table (avoid too many duplicate indexes on "name")
  await fixTableIndexes('Universities', ['name']);

  // Fix Tasks table (duplicate studentId indexes)
  await fixTableIndexes('Tasks', ['studentId']);
}

async function migrate() {
  try {
    console.log('Starting database migration...');

    // First, try to fix any duplicate indexes on CountryApplicationProcess
    console.log('Checking for duplicate indexes...');
    await fixIndexes();

    // Sync all models
    // force: false ensures we don't drop existing tables
    // alter: true updates tables to match models if they exist
    await sequelize.sync({ alter: true });

    console.log('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);

    // If it's the "too many keys" error, provide helpful message
    if (error.message && error.message.includes('Too many keys')) {
      console.error('\n   ERROR: Too many indexes on a table (MySQL limit is 64 indexes per table).');
      console.error('   The error occurred on:', error.sql?.match(/`(\w+)`/)?.[1] || 'unknown table');
      console.error('   Please run one of these scripts:');
      console.error('   - node backend/scripts/fixCountryApplicationProcessIndexes.js');
      console.error('   - node backend/scripts/fixCountriesTableIndexes.js');
      console.error('   Or manually remove redundant indexes from the table using MySQL.');
    }

    process.exit(1);
  }
}

migrate();
