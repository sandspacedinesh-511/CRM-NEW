require('dotenv').config();
const sequelize = require('../config/database');

async function cleanCountryData() {
  try {
    console.log('🔄 Starting country data cleanup...\n');

    // 1) Remove duplicates that would collide AFTER cleaning
    console.log('🧹 Removing potential duplicate ApplicationCountry rows before cleaning...');
    await sequelize.query(`
      DELETE ac1
      FROM ApplicationCountry ac1
      JOIN ApplicationCountry ac2
        ON ac1.studentId = ac2.studentId
       AND TRIM(REPLACE(REPLACE(REPLACE(ac1.country, '[', ''), ']', ''), '"', '')) =
           TRIM(REPLACE(REPLACE(REPLACE(ac2.country, '[', ''), ']', ''), '"', ''))
       AND ac1.id > ac2.id;
    `);
    console.log('   ✓ Pre-clean duplicates removed (if any).\n');

    // 2) Clean dirty country strings in ApplicationCountry
    console.log('🧹 Cleaning dirty country names in ApplicationCountry...');
    await sequelize.query(`
      UPDATE ApplicationCountry
      SET country = TRIM(
                BOTH ' ' FROM
                REPLACE(
                  REPLACE(
                    REPLACE(country, '[', ''),
                  ']', ''),
                '"', '')
            )
      WHERE country LIKE '%"%' OR country LIKE '%[%' OR country LIKE '%]%';
    `);
    console.log('   ✓ ApplicationCountry country values cleaned.\n');

    // 3) As a safety net, remove any remaining exact duplicates (same studentId + country)
    console.log('🧹 Removing any remaining exact duplicate ApplicationCountry rows...');
    await sequelize.query(`
      DELETE ac1
      FROM ApplicationCountry ac1
      JOIN ApplicationCountry ac2
        ON ac1.studentId = ac2.studentId
       AND ac1.country   = ac2.country
       AND ac1.id        > ac2.id;
    `);
    console.log('   ✓ Post-clean duplicates removed (if any).\n');

    // 4) Normalize Students.targetCountries so future parsing is clean
    console.log('🧹 Normalizing Students.targetCountries...');
    await sequelize.query(`
      UPDATE Students
      SET targetCountries = TRIM(
                BOTH ' ' FROM
                REPLACE(
                  REPLACE(
                    REPLACE(targetCountries, '[', ''),
                  ']', ''),
                '"', '')
            )
      WHERE targetCountries LIKE '%"%' OR targetCountries LIKE '%[%' OR targetCountries LIKE '%]%';
    `);
    console.log('   ✓ Students.targetCountries normalized.\n');

    console.log('✅ Country data cleanup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Country data cleanup failed:', error);
    process.exit(1);
  }
}

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return cleanCountryData();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });


