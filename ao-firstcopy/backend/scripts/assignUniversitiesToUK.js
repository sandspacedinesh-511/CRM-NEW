/**
 * Migration script to assign all existing universities to United Kingdom
 * This script updates all universities that don't have a country set to "United Kingdom"
 */

const sequelize = require('../config/database');
const { Op } = require('sequelize');
const University = require('../models/University');

async function assignUniversitiesToUK() {
  try {
    console.log('Starting migration: Assigning universities to UK...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Find all universities that don't have a country or have null/empty country
    const universities = await University.findAll({
      where: {
        [Op.or]: [
          { country: null },
          { country: '' },
          { country: { [Op.ne]: 'United Kingdom' } }
        ]
      }
    });

    console.log(`Found ${universities.length} universities to update.`);

    if (universities.length === 0) {
      console.log('No universities need to be updated. All universities already have a country assigned.');
      await sequelize.close();
      return;
    }

    // Update all universities to United Kingdom
    const [updatedCount] = await University.update(
      { country: 'United Kingdom' },
      {
        where: {
          [Op.or]: [
            { country: null },
            { country: '' },
            { country: { [Op.ne]: 'United Kingdom' } }
          ]
        }
      }
    );

    console.log(`Successfully updated ${updatedCount} universities to United Kingdom.`);

    // Verify the update
    const ukUniversities = await University.count({
      where: { country: 'United Kingdom' }
    });

    console.log(`Total universities with country "United Kingdom": ${ukUniversities}`);

    await sequelize.close();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the migration
assignUniversitiesToUK();

