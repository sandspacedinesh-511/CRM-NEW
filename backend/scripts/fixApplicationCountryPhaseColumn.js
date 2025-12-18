const sequelize = require('../config/database');

async function fixApplicationCountryPhaseColumn() {
  try {
    console.log('🔍 Checking ApplicationCountries table currentPhase column...');
    
    // Check if table exists (table name is lowercase 'applicationcountry')
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applicationcountry'
    `);
    
    if (tables.length === 0) {
      console.log('ℹ️  Table applicationcountry does not exist yet. This is normal for a fresh database.');
      process.exit(0);
    }
    
    // Check current column type
    const [columns] = await sequelize.query(`
      SELECT COLUMN_TYPE, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'applicationcountry' 
      AND COLUMN_NAME = 'currentPhase'
    `);
    
    if (columns.length === 0) {
      console.log('ℹ️  Column currentPhase does not exist yet.');
      process.exit(0);
    }
    
    const columnType = columns[0].COLUMN_TYPE;
    const dataType = columns[0].DATA_TYPE;
    
    console.log(`Current column type: ${columnType}`);
    console.log(`Current data type: ${dataType}`);
    
    // If it's already VARCHAR/STRING, no need to change
    if (dataType === 'varchar' || dataType === 'text' || dataType === 'char') {
      console.log('✅ Column is already VARCHAR/STRING type. No changes needed.');
      process.exit(0);
    }
    
    // If it's ENUM, convert to VARCHAR
    if (dataType === 'enum') {
      console.log('\n🔄 Converting currentPhase from ENUM to VARCHAR(255)...');
      
      try {
        await sequelize.query(`
          ALTER TABLE applicationcountry 
          MODIFY COLUMN currentPhase VARCHAR(255) 
          DEFAULT 'DOCUMENT_COLLECTION'
        `);
        
        console.log('✅ Successfully converted currentPhase from ENUM to VARCHAR(255)');
        console.log('   This allows country-specific phases like OFFER_LETTER_AUSTRALIA to be stored.');
      } catch (error) {
        console.error('❌ Error converting column:', error.message);
        
        // If the error is about data truncation or invalid values, try a different approach
        if (error.message.includes('Data truncated') || error.message.includes('Invalid default value')) {
          console.log('\n⚠️  Attempting alternative approach: Setting default to NULL first...');
          try {
            await sequelize.query(`
              ALTER TABLE applicationcountry 
              MODIFY COLUMN currentPhase VARCHAR(255) 
              DEFAULT NULL
            `);
            
            // Then set default back
            await sequelize.query(`
              ALTER TABLE applicationcountry 
              ALTER COLUMN currentPhase SET DEFAULT 'DOCUMENT_COLLECTION'
            `);
            
            console.log('✅ Successfully converted using alternative approach');
          } catch (altError) {
            console.error('❌ Alternative approach also failed:', altError.message);
            throw altError;
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`ℹ️  Column is of type ${dataType}. No conversion needed.`);
    }
    
    console.log('\n✅ Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing ApplicationCountry phase column:', error);
    process.exit(1);
  }
}

// Run the fix
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return fixApplicationCountryPhaseColumn();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

