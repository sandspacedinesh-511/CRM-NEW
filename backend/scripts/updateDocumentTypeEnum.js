const sequelize = require('../config/database');

async function updateDocumentTypeEnum() {
  try {
    console.log('  Updating Document type ENUM...');
    
    // Get the database name from config
    const dbName = sequelize.config.database;
    
    // New ENUM values including all country-specific document types
    const newEnumValues = [
      'PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE',
      'ENGLISH_TEST_SCORE', 'CV_RESUME', 'FINANCIAL_STATEMENT', 'BIRTH_CERTIFICATE',
      'MEDICAL_CERTIFICATE', 'POLICE_CLEARANCE', 'BANK_STATEMENT', 'SPONSOR_LETTER',
      'ID_CARD', 'ENROLLMENT_LETTER', 'OFFER_LETTER',
      // Country-specific types
      'I_20_FORM', 'SEVIS_FEE_RECEIPT', 'DS_160_CONFIRMATION', 'VISA_APPOINTMENT_CONFIRMATION',
      'BANK_STATEMENTS', 'SPONSOR_AFFIDAVIT', 'INCOME_PROOF', 'TB_TEST_CERTIFICATE',
      'TUITION_FEE_RECEIPT', 'BLOCKED_ACCOUNT_PROOF', 'HEALTH_INSURANCE', 'APS_CERTIFICATE',
      'VISA_APPLICATION', 'BIOMETRICS', 'LOA', 'GIC_CERTIFICATE', 'MEDICAL_EXAM',
      'OSHC', 'ECOE', 'FINANCIAL_PROOF', 'MEDICAL_INSURANCE', 'CAMPUS_FRANCE_REGISTRATION',
      'INTERVIEW_ACKNOWLEDGEMENT', 'OFII_FORM', 'UNIVERSITALY_RECEIPT', 'ACCOMMODATION_PROOF',
      'IPA_LETTER', 'MEDICAL_REPORT', 'STUDENT_VISA_APPROVAL', 'MEDICAL_TEST',
      'EMIRATES_ID_APPLICATION', 'OTHER'
    ];
    
    // For MySQL/MariaDB, we need to alter the column type
    const query = `
      ALTER TABLE Documents 
      MODIFY COLUMN type ENUM(${newEnumValues.map(v => `'${v}'`).join(', ')})
      NOT NULL;
    `;
    
    await sequelize.query(query);
    
    console.log('  Document type ENUM updated successfully!');
    console.log(`   Added ${newEnumValues.length} document types`);
    
    process.exit(0);
  } catch (error) {
    console.error('  Error updating Document type ENUM:', error);
    console.error('   Error details:', error.message);
    process.exit(1);
  }
}

// Run the migration
updateDocumentTypeEnum();

