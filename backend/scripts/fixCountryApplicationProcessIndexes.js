const sequelize = require('../config/database');

async function fixIndexes() {
  try {
    console.log('🔍 Checking indexes on CountryApplicationProcess table...');
    
    // Get all indexes on the table
    const [indexes] = await sequelize.query(`
      SHOW INDEXES FROM CountryApplicationProcess
    `);
    
    console.log(`Found ${indexes.length} indexes on CountryApplicationProcess table:`);
    indexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} on ${idx.Column_name} (${idx.Non_unique === 0 ? 'UNIQUE' : 'NON-UNIQUE'})`);
    });
    
    if (indexes.length > 10) {
      console.log('\n   Warning: Table has many indexes. This might cause issues.');
      console.log('   Consider removing redundant indexes manually.');
    }
    
    // Check for duplicate indexes on country and countryCode
    const countryIndexes = indexes.filter(idx => idx.Column_name === 'country');
    const countryCodeIndexes = indexes.filter(idx => idx.Column_name === 'countryCode');
    
    if (countryIndexes.length > 1) {
      console.log('\n   Found multiple indexes on "country" column. Removing duplicates...');
      // Keep only the unique index
      const uniqueIndex = countryIndexes.find(idx => idx.Non_unique === 0);
      const duplicateIndexes = countryIndexes.filter(idx => idx.Key_name !== uniqueIndex?.Key_name);
      
      for (const idx of duplicateIndexes) {
        try {
          await sequelize.query(`DROP INDEX \`${idx.Key_name}\` ON CountryApplicationProcess`);
          console.log(`     Dropped duplicate index: ${idx.Key_name}`);
        } catch (err) {
          console.log(`      Could not drop index ${idx.Key_name}: ${err.message}`);
        }
      }
    }
    
    if (countryCodeIndexes.length > 1) {
      console.log('\n   Found multiple indexes on "countryCode" column. Removing duplicates...');
      // Keep only the unique index
      const uniqueIndex = countryCodeIndexes.find(idx => idx.Non_unique === 0);
      const duplicateIndexes = countryCodeIndexes.filter(idx => idx.Key_name !== uniqueIndex?.Key_name);
      
      for (const idx of duplicateIndexes) {
        try {
          await sequelize.query(`DROP INDEX \`${idx.Key_name}\` ON CountryApplicationProcess`);
          console.log(`     Dropped duplicate index: ${idx.Key_name}`);
        } catch (err) {
          console.log(`      Could not drop index ${idx.Key_name}: ${err.message}`);
        }
      }
    }
    
    console.log('\n  Index cleanup completed.');
    process.exit(0);
  } catch (error) {
    if (error.message.includes("doesn't exist")) {
      console.log('   Table CountryApplicationProcess does not exist yet. This is normal for a fresh database.');
      process.exit(0);
    } else {
      console.error('  Error fixing indexes:', error);
      process.exit(1);
    }
  }
}

// Run the fix
sequelize.authenticate()
  .then(() => {
    console.log('  Database connection established');
    return fixIndexes();
  })
  .catch(error => {
    console.error('  Database connection failed:', error);
    process.exit(1);
  });
