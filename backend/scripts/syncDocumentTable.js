const sequelize = require('../config/database');
const { Document } = require('../models');

async function syncDocumentTable() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        console.log('🔄 Syncing Document model...');
        await Document.sync({ alter: true });
        console.log('✅ Document table created/updated successfully');

        // Check if we need to manually update the ENUM type
        try {
            const [results] = await sequelize.query(`
                SELECT COLUMN_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'Documents' 
                AND COLUMN_NAME = 'type'
            `);
            
            if (results && results.length > 0) {
                const currentEnum = results[0].COLUMN_TYPE;
                console.log('\n📋 Current ENUM values:', currentEnum);
                
                // Check if new values are missing
                if (!currentEnum.includes('ID_CARD') || !currentEnum.includes('ENROLLMENT_LETTER')) {
                    console.log('\n⚠️  New ENUM values (ID_CARD, ENROLLMENT_LETTER) may need to be added manually.');
                    console.log('   If documents are not saving, run this SQL command:');
                    console.log(`
ALTER TABLE Documents 
MODIFY COLUMN type ENUM(
    'PASSPORT',
    'ACADEMIC_TRANSCRIPT',
    'RECOMMENDATION_LETTER',
    'STATEMENT_OF_PURPOSE',
    'ENGLISH_TEST_SCORE',
    'CV_RESUME',
    'FINANCIAL_STATEMENT',
    'BIRTH_CERTIFICATE',
    'MEDICAL_CERTIFICATE',
    'POLICE_CLEARANCE',
    'BANK_STATEMENT',
    'SPONSOR_LETTER',
    'ID_CARD',
    'ENROLLMENT_LETTER',
    'OTHER'
) NOT NULL;
                    `);
                } else {
                    console.log('✅ ENUM values include ID_CARD and ENROLLMENT_LETTER');
                }
            }
        } catch (enumError) {
            console.log('⚠️  Could not check ENUM values:', enumError.message);
        }

        console.log('\n📊 Document Table Structure:');
        console.log('- id (INTEGER, PRIMARY KEY, AUTO_INCREMENT)');
        console.log('- studentId (INTEGER, FOREIGN KEY -> Students.id)');
        console.log('- type (ENUM: includes ID_CARD, ENROLLMENT_LETTER, OTHER)');
        console.log('- name (STRING)');
        console.log('- path (STRING)');
        console.log('- url (STRING, NULLABLE)');
        console.log('- description (TEXT)');
        console.log('- status (ENUM: PENDING, APPROVED, REJECTED, etc.)');
        console.log('- uploadedBy (INTEGER, FOREIGN KEY -> Users.id)');
        console.log('- mimeType (STRING)');
        console.log('- size (INTEGER)');
        console.log('- createdAt (TIMESTAMP)');
        console.log('- updatedAt (TIMESTAMP)');

        console.log('\n✅ Database sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

syncDocumentTable();

