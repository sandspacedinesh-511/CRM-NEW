const sequelize = require('../config/database');

async function fixIndexes() {
  try {
    console.log('🔍 Checking indexes on countries table...');
    
    // Get all indexes on the table
    const [indexes] = await sequelize.query(`
      SHOW INDEXES FROM countries
    `);
    
    console.log(`Found ${indexes.length} indexes on countries table:`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name} (${idx.Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE'})`);
    });
    
    if (indexes.length > 10) {
      console.log('\n⚠️  Warning: Table has many indexes. This might cause issues.');
      console.log('   Consider removing redundant indexes manually.');
    }
    
    // Check for duplicate indexes on name and code
    const nameIndexes = indexes.filter(idx => idx.Column_name === 'name');
    const codeIndexes = indexes.filter(idx => idx.Column_name === 'code');
    
    if (nameIndexes.length > 1) {
      console.log('\n⚠️  Found multiple indexes on "name" column. Removing duplicates...');
      // Keep only the unique index
      const uniqueIndex = nameIndexes.find(idx => idx.Non_unique === 0);
      const duplicateIndexes = nameIndexes.filter(idx => idx.Key_name !== uniqueIndex?.Key_name && idx.Key_name !== 'PRIMARY');
      
      for (const idx of duplicateIndexes) {
        try {
          await sequelize.query(`DROP INDEX \`${idx.Key_name}\` ON countries`);
          console.log(`   ✅ Dropped duplicate index: ${idx.Key_name}`);
        } catch (err) {
          console.log(`   ⚠️  Could not drop index ${idx.Key_name}: ${err.message}`);
        }
      }
    }
    
    if (codeIndexes.length > 1) {
      console.log('\n⚠️  Found multiple indexes on "code" column. Removing duplicates...');
      // Keep only the unique index
      const uniqueIndex = codeIndexes.find(idx => idx.Non_unique === 0);
      const duplicateIndexes = codeIndexes.filter(idx => idx.Key_name !== uniqueIndex?.Key_name && idx.Key_name !== 'PRIMARY');
      
      for (const idx of duplicateIndexes) {
        try {
          await sequelize.query(`DROP INDEX \`${idx.Key_name}\` ON countries`);
          console.log(`   ✅ Dropped duplicate index: ${idx.Key_name}`);
        } catch (err) {
          console.log(`   ⚠️  Could not drop index ${idx.Key_name}: ${err.message}`);
        }
      }
    }
    
    console.log('\n✅ Index cleanup completed.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes("doesn't exist")) {
      console.log('ℹ️  Table countries does not exist yet. This is normal for a fresh database.');
      process.exit(0);
    } else {
      console.error('❌ Error fixing indexes:', error);
      process.exit(1);
    }
  }
}

// Run the fix
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return fixIndexes();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
