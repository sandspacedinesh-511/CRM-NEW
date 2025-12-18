const sequelize = require('../config/database');
const { ApplicationCountry, PhaseMetadata } = require('../models');

/**
 * Migration script to initialize phase metadata for existing country profiles
 * This script creates PhaseMetadata records for all existing phases in ApplicationCountry records
 */
async function initializePhaseMetadata() {
  try {
    console.log('🔄 Starting phase metadata initialization...');
    
    // Get all country profiles
    const countryProfiles = await ApplicationCountry.findAll({
      attributes: ['id', 'studentId', 'country', 'currentPhase']
    });
    
    console.log(`Found ${countryProfiles.length} country profiles to process`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    // Default phases list (used when country process is not available)
    const defaultPhases = [
      'DOCUMENT_COLLECTION',
      'UNIVERSITY_SHORTLISTING',
      'APPLICATION_SUBMISSION',
      'OFFER_RECEIVED',
      'INITIAL_PAYMENT',
      'INTERVIEW',
      'FINANCIAL_TB_TEST',
      'CAS_VISA',
      'VISA_APPLICATION',
      'ENROLLMENT'
    ];
    
    for (const profile of countryProfiles) {
      try {
        // Get phases for this country (try to get from CountryApplicationProcess)
        let phases = [];
        try {
          const { CountryApplicationProcess } = require('../models');
          const countryProcess = await CountryApplicationProcess.findOne({
            where: { country: profile.country, isActive: true }
          });
          
          if (countryProcess && countryProcess.applicationProcess && countryProcess.applicationProcess.steps) {
            phases = countryProcess.applicationProcess.steps.map(p => p.key || p);
          }
        } catch (err) {
          console.warn(`Could not fetch country process for ${profile.country}, using defaults`);
        }
        
        // Use default phases if none found
        if (phases.length === 0) {
          phases = defaultPhases;
        }
        
        // Determine current phase index
        const currentPhaseIndex = phases.findIndex(p => {
          const phaseKey = typeof p === 'string' ? p : p.key;
          return phaseKey === profile.currentPhase;
        });
        
        // Create metadata for each phase
        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];
          const phaseName = typeof phase === 'string' ? phase : phase.key;
          
          if (!phaseName) continue;
          
          // Determine status based on position relative to current phase
          let status = 'Pending';
          if (i < currentPhaseIndex) {
            status = 'Completed';
          } else if (i === currentPhaseIndex) {
            status = 'Current';
          }
          
          // Check if metadata already exists
          const existing = await PhaseMetadata.findOne({
            where: {
              studentId: profile.studentId,
              country: profile.country,
              phaseName
            }
          });
          
          if (existing) {
            skipped++;
            continue;
          }
          
          // Create new metadata
          await PhaseMetadata.create({
            studentId: profile.studentId,
            country: profile.country,
            phaseName,
            status,
            reopenCount: 0,
            maxReopenAllowed: 2,
            finalEditAllowed: true
          });
          
          created++;
        }
      } catch (error) {
        console.error(`Error processing country profile ${profile.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n✅ Phase metadata initialization completed!');
    console.log(`   Created: ${created} records`);
    console.log(`   Skipped: ${skipped} records (already exist)`);
    console.log(`   Errors: ${errors} records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing phase metadata:', error);
    process.exit(1);
  }
}

// Run the migration
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return initializePhaseMetadata();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

