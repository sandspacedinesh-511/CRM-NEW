const sequelize = require('../config/database');
const { Student, ApplicationCountry, StudentUniversityApplication, University } = require('../models');

async function migrateExistingData() {
  try {
    console.log('🔄 Starting migration of existing data to country profiles...');
    
    // Get all students
    const students = await Student.findAll({
      include: [
        {
          model: StudentUniversityApplication,
          as: 'applications',
          include: [{
            model: University,
            as: 'university',
            attributes: ['id', 'name', 'country']
          }]
        }
      ]
    });
    
    console.log(`Found ${students.length} students to process`);
    
    let migratedCount = 0;
    let createdProfiles = 0;
    
    for (const student of students) {
      try {
        // Get unique countries from applications
        const countriesFromApplications = new Set();
        if (student.applications && student.applications.length > 0) {
          student.applications.forEach(app => {
            if (app.university?.country) {
              countriesFromApplications.add(app.university.country);
            }
          });
        }
        
        // Get countries from targetCountries field
        const countriesFromTarget = new Set();
        if (student.targetCountries) {
          student.targetCountries.split(',').forEach(c => {
            const trimmed = c.trim();
            if (trimmed) {
              // Normalize country names
              const normalized = normalizeCountryName(trimmed);
              if (normalized) {
                countriesFromTarget.add(normalized);
              }
            }
          });
        }
        
        // Combine both sources
        const allCountries = new Set([...countriesFromApplications, ...countriesFromTarget]);
        
        if (allCountries.size === 0) {
          continue; // Skip students with no country data
        }
        
        // Get existing country profiles
        const existingProfiles = await ApplicationCountry.findAll({
          where: { studentId: student.id }
        });
        const existingCountries = new Set(existingProfiles.map(p => p.country));
        
        // Create missing country profiles
        for (const country of allCountries) {
          if (!existingCountries.has(country)) {
            // Determine current phase from student's global phase or applications
            let currentPhase = 'DOCUMENT_COLLECTION';
            if (student.currentPhase) {
              currentPhase = student.currentPhase;
            }
            
            // Check if student has applications for this country
            const countryApplications = student.applications?.filter(app => 
              app.university?.country === country
            ) || [];
            
            // If has applications, might be further along
            if (countryApplications.length > 0) {
              // Check application statuses to determine phase
              const hasAccepted = countryApplications.some(app => 
                ['ACCEPTED', 'CONDITIONAL_OFFER'].includes(app.applicationStatus)
              );
              const hasSubmitted = countryApplications.some(app => 
                ['SUBMITTED', 'UNDER_REVIEW'].includes(app.applicationStatus)
              );
              
              if (hasAccepted) {
                currentPhase = 'OFFER_RECEIVED';
              } else if (hasSubmitted) {
                currentPhase = 'APPLICATION_SUBMISSION';
              } else {
                currentPhase = 'UNIVERSITY_SHORTLISTING';
              }
            }
            
            // Migrate university shortlist from student notes if available
            let notes = `Country profile migrated from existing data for ${country}.`;
            if (student.notes) {
              try {
                const studentNotes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                
                // Check if shortlist has universities for this country
                if (studentNotes?.universityShortlist) {
                  const countryShortlist = studentNotes.universityShortlist.universities?.filter(u => 
                    normalizeCountryName(u.country) === country
                  );
                  
                  if (countryShortlist && countryShortlist.length > 0) {
                    const countryNotesData = {
                      universityShortlist: {
                        universities: countryShortlist,
                        selectedAt: studentNotes.universityShortlist.selectedAt || new Date().toISOString()
                      }
                    };
                    
                    // Also migrate offers and payment data if for this country
                    if (studentNotes?.universitiesWithOffers) {
                      const countryOffers = studentNotes.universitiesWithOffers.universities?.filter(u =>
                        normalizeCountryName(u.country) === country
                      );
                      if (countryOffers && countryOffers.length > 0) {
                        countryNotesData.universitiesWithOffers = {
                          universities: countryOffers,
                          receivedAt: studentNotes.universitiesWithOffers.receivedAt || new Date().toISOString()
                        };
                      }
                    }
                    
                    if (studentNotes?.initialPaymentUniversity) {
                      const paymentUni = studentNotes.initialPaymentUniversity.university;
                      if (paymentUni && normalizeCountryName(paymentUni.country) === country) {
                        countryNotesData.initialPaymentUniversity = studentNotes.initialPaymentUniversity;
                      }
                    }
                    
                    notes = JSON.stringify(countryNotesData);
                  }
                }
              } catch (e) {
                console.error(`Error parsing notes for student ${student.id}:`, e.message);
              }
            }
            
            await ApplicationCountry.create({
              studentId: student.id,
              country: country,
              currentPhase: currentPhase,
              totalApplications: countryApplications.length,
              primaryApplications: countryApplications.filter(app => app.isPrimaryChoice).length,
              backupApplications: countryApplications.filter(app => app.isBackupChoice).length,
              acceptedApplications: countryApplications.filter(app => 
                ['ACCEPTED', 'CONDITIONAL_OFFER'].includes(app.applicationStatus)
              ).length,
              rejectedApplications: countryApplications.filter(app => 
                app.applicationStatus === 'REJECTED'
              ).length,
              pendingApplications: countryApplications.filter(app => 
                ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'].includes(app.applicationStatus)
              ).length,
              totalApplicationFees: countryApplications.reduce((sum, app) => 
                sum + (parseFloat(app.applicationFee) || 0), 0
              ),
              totalScholarshipAmount: countryApplications.reduce((sum, app) => 
                sum + (parseFloat(app.scholarshipAmount) || 0), 0
              ),
              visaRequired: true,
              visaStatus: 'NOT_STARTED',
              preferredCountry: countriesFromTarget.has(country),
              notes: notes,
              lastUpdated: new Date()
            });
            
            createdProfiles++;
            console.log(`  ✅ Created profile for ${country} (Student ID: ${student.id})`);
          }
        }
        
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating student ${student.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   - Processed ${migratedCount} students`);
    console.log(`   - Created ${createdProfiles} new country profiles`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Normalize country names to handle variations
function normalizeCountryName(country) {
  if (!country) return null;
  
  const normalized = country.trim();
  const countryMap = {
    'UK': 'United Kingdom',
    'U.K.': 'United Kingdom',
    'U.K': 'United Kingdom',
    'United Kingdom': 'United Kingdom',
    'USA': 'United States',
    'U.S.A.': 'United States',
    'U.S.A': 'United States',
    'US': 'United States',
    'U.S.': 'United States',
    'United States': 'United States',
    'United States of America': 'United States',
    'CANADA': 'Canada',
    'Canada': 'Canada',
    'AUSTRALIA': 'Australia',
    'Australia': 'Australia',
    'NEW ZEALAND': 'New Zealand',
    'New Zealand': 'New Zealand'
  };
  
  return countryMap[normalized] || normalized;
}

// Run the migration
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return migrateExistingData();
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });
