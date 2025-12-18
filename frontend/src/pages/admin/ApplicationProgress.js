import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalanceWallet as WalletIcon,
  Flight as FlightIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  CloudUpload as CloudUploadIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

// Phase definitions matching the image
const PHASE_CONFIG = {
  DOCUMENT_COLLECTION: {
    label: 'Document Collection',
    icon: <DescriptionIcon />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  UNIVERSITY_SHORTLISTING: {
    label: 'University Shortlisting',
    icon: <SchoolIcon />,
    color: '#ff9800',
    bgColor: '#fff3e0',
    borderColor: '#ff9800'
  },
  APPLICATION_SUBMISSION: {
    label: 'Application Submission',
    icon: <AssignmentIcon />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    borderColor: '#9c27b0'
  },
  OFFER_LETTER_AUSTRALIA: {
    label: 'Offer Letter',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  OSHC_TUITION_DEPOSIT: {
    label: 'OSHC + Tuition Deposit',
    icon: <WalletIcon />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    borderColor: '#9c27b0'
  },
  ECOE_ISSUED: {
    label: 'eCOE Issued',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  VISA_APPLICATION_AUSTRALIA: {
    label: 'Visa Application (Subclass 500)',
    icon: <FlightIcon />,
    color: '#ffc107',
    bgColor: '#fffde7',
    borderColor: '#ffc107'
  },
  VISA_DECISION: {
    label: 'Visa Decision',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    bgColor: '#e8f5e9',
    borderColor: '#4caf50'
  },
  PRE_DEPARTURE: {
    label: 'Pre-Departure',
    icon: <FlightIcon />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    borderColor: '#9c27b0'
  },
  ENROLLMENT: {
    label: 'Enrollment',
    icon: <SchoolIcon />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    borderColor: '#9c27b0'
  }
};

// Australia-specific phase order (matching the image and system)
const AUSTRALIA_PHASES = [
  'DOCUMENT_COLLECTION',
  'UNIVERSITY_SHORTLISTING',
  'APPLICATION_SUBMISSION',
  'OFFER_LETTER_AUSTRALIA',
  'OSHC_TUITION_DEPOSIT',
  'ECOE_ISSUED',
  'VISA_APPLICATION_AUSTRALIA',
  'VISA_DECISION',
  'PRE_DEPARTURE',
  'ENROLLMENT'
];

// Document requirements for Document Collection phase
const DOCUMENT_COLLECTION_REQUIRED = [
  'PASSPORT',
  'ACADEMIC_TRANSCRIPT',
  'RECOMMENDATION_LETTER',
  'STATEMENT_OF_PURPOSE',
  'CV_RESUME'
];

function ApplicationProgress() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('Australia');
  const [countryProfiles, setCountryProfiles] = useState([]);
  const [currentPhase, setCurrentPhase] = useState('DOCUMENT_COLLECTION');

  useEffect(() => {
    fetchStudentProgress();
  }, [studentId]);

  // Update current phase when country changes
  useEffect(() => {
    if (countryProfiles.length > 0 && selectedCountry) {
      const profile = countryProfiles.find(p => p.country === selectedCountry);
      if (profile) {
        setCurrentPhase(profile.currentPhase || 'DOCUMENT_COLLECTION');
      }
    }
  }, [selectedCountry, countryProfiles]);

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student details with documents and country profiles
      const response = await axiosInstance.get(`/admin/students/${studentId}`);
      
      if (response.data.success) {
        const studentData = response.data.data;
        setStudent(studentData);
        setDocuments(studentData.documents || []);
        setApplications(studentData.applications || []);
        setCountryProfiles(studentData.countryProfiles || []);


        // Find Australia profile or use first profile
        const australiaProfile = studentData.countryProfiles?.find(
          p => p.country === 'Australia'
        ) || studentData.countryProfiles?.[0];

        if (australiaProfile) {
          setSelectedCountry(australiaProfile.country);
          setCurrentPhase(australiaProfile.currentPhase || 'DOCUMENT_COLLECTION');
        } else {
          setCurrentPhase(studentData.currentPhase || 'DOCUMENT_COLLECTION');
        }
      } else {
        setError('Failed to load student progress');
      }
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setError('Failed to load student progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePhaseProgress = (phaseKey) => {
    if (phaseKey === 'DOCUMENT_COLLECTION') {
      const requiredDocs = DOCUMENT_COLLECTION_REQUIRED;
      // Filter latest documents only and approved/pending status
      const latestDocs = documents.filter(doc => 
        doc.isLatest !== false // Include if isLatest is true or undefined
      );
      const uploadedDocs = latestDocs.filter(doc => 
        requiredDocs.includes(doc.type) && 
        (doc.status === 'APPROVED' || doc.status === 'PENDING')
      );
      // Get unique document types (in case of duplicates)
      const uniqueDocTypes = [...new Set(uploadedDocs.map(doc => doc.type))];
      return Math.round((uniqueDocTypes.length / requiredDocs.length) * 100);
    }
    
    // For ENROLLMENT phase, check if actually enrolled
    if (phaseKey === 'ENROLLMENT') {
      if (isEnrolled()) {
        return 100; // Fully enrolled
      }
      // If current phase is ENROLLMENT but not enrolled yet, show 0%
      if (currentPhase === 'ENROLLMENT') {
        return 0;
      }
    }
    
    // For other phases, check if current phase is reached
    const currentPhaseIndex = AUSTRALIA_PHASES.indexOf(currentPhase);
    const phaseIndex = AUSTRALIA_PHASES.indexOf(phaseKey);
    
    if (phaseIndex < currentPhaseIndex) {
      return 100; // Completed
    } else if (phaseIndex === currentPhaseIndex) {
      // For current phase, calculate based on phase type
      if (phaseKey === 'DOCUMENT_COLLECTION') {
        return calculatePhaseProgress('DOCUMENT_COLLECTION');
      }
      // For ENROLLMENT, check enrollment status
      if (phaseKey === 'ENROLLMENT') {
        return isEnrolled() ? 100 : 0;
      }
      // For other current phases, show 0% if just started, or calculate based on completion
      return 0;
    } else {
      return 0; // Pending
    }
  };

  const getPhaseStatus = (phaseKey) => {
    const currentPhaseIndex = AUSTRALIA_PHASES.indexOf(currentPhase);
    const phaseIndex = AUSTRALIA_PHASES.indexOf(phaseKey);

    // Special handling for ENROLLMENT phase
    if (phaseKey === 'ENROLLMENT') {
      if (isEnrolled()) {
        return { status: 'completed', label: 'Completed', color: 'success' };
      }
      if (phaseIndex === currentPhaseIndex) {
        return { status: 'current', label: 'Current', color: 'error' };
      }
    }

    if (phaseIndex < currentPhaseIndex) {
      return { status: 'completed', label: 'Completed', color: 'success' };
    } else if (phaseIndex === currentPhaseIndex) {
      return { status: 'current', label: 'Current', color: 'error' };
    } else {
      return { status: 'pending', label: 'Pending', color: 'warning' };
    }
  };

  const getMissingDocuments = (phaseKey) => {
    if (phaseKey === 'DOCUMENT_COLLECTION') {
      const requiredDocs = DOCUMENT_COLLECTION_REQUIRED;
      // Filter latest documents only
      const latestDocs = documents.filter(doc => 
        doc.isLatest !== false
      );
      const uploadedDocTypes = latestDocs
        .filter(doc => doc.status === 'APPROVED' || doc.status === 'PENDING')
        .map(doc => doc.type);
      // Get unique document types
      const uniqueDocTypes = [...new Set(uploadedDocTypes)];
      return requiredDocs.filter(docType => !uniqueDocTypes.includes(docType));
    }
    return [];
  };

  const calculateOverallProgress = () => {
    const totalPhases = AUSTRALIA_PHASES.length;
    const currentPhaseIndex = AUSTRALIA_PHASES.indexOf(currentPhase);
    
    if (currentPhaseIndex === -1) {
      // Phase not found in list, return 0
      return 0;
    }
    
    // Base progress from completed phases (phases before current)
    let progress = (currentPhaseIndex / totalPhases) * 100;
    
    // Add progress for current phase
    const currentPhaseProgress = calculatePhaseProgress(currentPhase);
    progress += (currentPhaseProgress / totalPhases);
    
    return Math.min(Math.round(progress), 100); // Cap at 100%
  };

  const getPhaseIcon = (phaseKey) => {
    const config = PHASE_CONFIG[phaseKey];
    if (!config) return <DescriptionIcon />;
    return config.icon;
  };

  const getPhaseWarning = (phaseKey) => {
    if (phaseKey === 'DOCUMENT_COLLECTION') {
      const missingDocs = getMissingDocuments(phaseKey);
      if (missingDocs.length > 0) {
        return { hasWarning: true, type: 'error' };
      }
    }
    const status = getPhaseStatus(phaseKey);
    if (status.status === 'pending') {
      return { hasWarning: true, type: 'warning' };
    }
    return { hasWarning: false };
  };

  // Normalize country names for better matching
  const normalizeCountryName = (country) => {
    if (!country) return '';
    const normalized = country.trim().toUpperCase();
    
    // Map variations to standard names
    const countryMap = {
      'UK': 'UNITED KINGDOM', 'U.K.': 'UNITED KINGDOM', 'U.K': 'UNITED KINGDOM', 'UNITED KINGDOM': 'UNITED KINGDOM',
      'USA': 'UNITED STATES', 'U.S.A.': 'UNITED STATES', 'U.S.A': 'UNITED STATES',
      'US': 'UNITED STATES', 'U.S.': 'UNITED STATES', 'U.S': 'UNITED STATES',
      'UNITED STATES': 'UNITED STATES', 'UNITED STATES OF AMERICA': 'UNITED STATES',
      'CANADA': 'CANADA', 'CA': 'CANADA',
      'AUSTRALIA': 'AUSTRALIA', 'AU': 'AUSTRALIA',
      'IRELAND': 'IRELAND',
      'GERMANY': 'GERMANY', 'DE': 'GERMANY',
      'FRANCE': 'FRANCE', 'FR': 'FRANCE',
      'ITALY': 'ITALY',
      'SPAIN': 'SPAIN',
      'SINGAPORE': 'SINGAPORE',
      'UAE': 'UAE', 'UNITED ARAB EMIRATES': 'UAE'
    };
    
    return countryMap[normalized] || normalized;
  };

  // Helper to parse notes safely
  const safeParseNotes = (notes) => {
    if (!notes) return {};
    try {
      return typeof notes === 'string' ? JSON.parse(notes) : notes;
    } catch (e) {
      return {};
    }
  };

  // Get universities for a specific phase
  const getUniversitiesForPhase = (phaseKey) => {
    const currentProfile = countryProfiles.find(p => {
      const normalize = (str) => str?.toLowerCase().trim();
      return normalize(p.country) === normalize(selectedCountry);
    });
    
    // Filter applications by selected country (more flexible matching)
    const countryApplications = applications.filter(app => {
      const appCountry = app.university?.country;
      if (!appCountry) {
        // If no country, include it (might be valid data)
        return true;
      }
      // Normalize both country names for comparison
      const normalizedAppCountry = normalizeCountryName(appCountry);
      const normalizedSelected = normalizeCountryName(selectedCountry);
      return normalizedAppCountry === normalizedSelected;
    });

    // If no country-specific applications, use all applications as fallback
    // This ensures universities are shown even if country doesn't match exactly
    const allApplications = countryApplications.length > 0 ? countryApplications : applications;

    switch (phaseKey) {
      case 'UNIVERSITY_SHORTLISTING':
        // First, try to get shortlisted universities from country profile notes
        let shortlistedFromNotes = [];
        if (currentProfile?.notes) {
          const notes = safeParseNotes(currentProfile.notes);
          const shortlist = notes?.universityShortlist;
          if (shortlist?.universities && Array.isArray(shortlist.universities)) {
            shortlistedFromNotes = shortlist.universities.filter(u => {
              if (!u || !u.name) return false;
              // Filter by country if specified
              if (u.country) {
                const normalizedUniCountry = normalizeCountryName(u.country);
                const normalizedSelected = normalizeCountryName(selectedCountry);
                return normalizedUniCountry === normalizedSelected;
              }
              return true;
            });
          }
        }
        
        // Also get universities from applications
        const shortlistUnisFromApps = allApplications
          .map(app => app.university)
          .filter(uni => uni && uni.name);
        
        // Combine both sources
        const allShortlistUnis = [...shortlistedFromNotes, ...shortlistUnisFromApps];
        
        // Remove duplicates by id, or by name if id doesn't exist
        const uniqueShortlist = allShortlistUnis.filter((uni, index, self) => {
          if (uni.id) {
            return index === self.findIndex(u => u?.id === uni.id);
          }
          // If no id, deduplicate by name
          return index === self.findIndex(u => u?.name === uni.name);
        });
        return uniqueShortlist;
      
      case 'APPLICATION_SUBMISSION':
        // First check country profile notes for submitted universities
        let submittedFromNotes = [];
        if (currentProfile?.notes) {
          const notes = safeParseNotes(currentProfile.notes);
          const submitted = notes?.universitiesWithApplications;
          if (submitted?.universities && Array.isArray(submitted.universities)) {
            submittedFromNotes = submitted.universities.filter(u => u && u.name);
          }
        }
        
        // Also get from applications
        const submittedUnisFromApps = allApplications
          .filter(app => ['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'ACCEPTED'].includes(app.applicationStatus))
          .map(app => app.university)
          .filter(uni => uni && uni.name);
        
        // Combine both sources
        const allSubmittedUnis = [...submittedFromNotes, ...submittedUnisFromApps];
        const uniqueSubmitted = allSubmittedUnis.filter((uni, index, self) => {
          if (uni.id) {
            return index === self.findIndex(u => u?.id === uni.id);
          }
          return index === self.findIndex(u => u?.name === uni.name);
        });
        return uniqueSubmitted;
      
      case 'OFFER_LETTER_AUSTRALIA':
        // First check country profile notes for offers
        let offersFromNotes = [];
        if (currentProfile?.notes) {
          const notes = safeParseNotes(currentProfile.notes);
          const offers = notes?.universitiesWithOffers;
          if (offers?.universities && Array.isArray(offers.universities)) {
            offersFromNotes = offers.universities.filter(u => u && u.name);
          }
        }
        
        // Also get from applications with accepted status
        const acceptedUnisFromApps = allApplications
          .filter(app => app.applicationStatus === 'ACCEPTED')
          .map(app => app.university)
          .filter(uni => uni && uni.name);
        
        // Combine both sources
        const allAcceptedUnis = [...offersFromNotes, ...acceptedUnisFromApps];
        const uniqueAccepted = allAcceptedUnis.filter((uni, index, self) => {
          if (uni.id) {
            return index === self.findIndex(u => u?.id === uni.id);
          }
          return index === self.findIndex(u => u?.name === uni.name);
        });
        return uniqueAccepted;
      
      case 'ENROLLMENT':
        // Return enrolled universities (check country profile notes for enrollmentUniversity)
        let enrolledFromNotes = [];
        if (currentProfile?.notes) {
          try {
            const notes = safeParseNotes(currentProfile.notes);
            
            // Check for enrollmentUniversity (new format)
            const enrollmentUni = notes?.enrollmentUniversity;
            if (enrollmentUni?.university) {
              enrolledFromNotes.push(enrollmentUni.university);
            }
            
            // Fallback to initialPaymentUniversity for backward compatibility
            if (enrolledFromNotes.length === 0) {
              const paymentUni = notes?.initialPaymentUniversity;
              if (paymentUni?.university) {
                enrolledFromNotes.push(paymentUni.university);
              }
            }
            
            // Also try to find by name if it's stored as a string (legacy format)
            if (enrolledFromNotes.length === 0 && typeof notes.enrollmentUniversity === 'string') {
              const enrolledName = notes.enrollmentUniversity.toLowerCase().trim();
              const foundUni = allApplications
                .map(app => app.university)
                .find(uni => {
                  if (!uni || !uni.name) return false;
                  const uniName = uni.name.toLowerCase().trim();
                  return uniName === enrolledName || uniName.includes(enrolledName) || enrolledName.includes(uniName);
                });
              if (foundUni) {
                enrolledFromNotes.push(foundUni);
              }
            }
          } catch (e) {
            console.error('Error parsing enrollment notes:', e);
          }
        }
        
        // If we found enrolled university from notes, return it
        if (enrolledFromNotes.length > 0) {
          return enrolledFromNotes.filter(uni => uni && uni.name);
        }
        
        // Fallback: if phase is ENROLLMENT, return accepted universities
        if (currentPhase === 'ENROLLMENT' || currentProfile?.currentPhase === 'ENROLLMENT') {
          const enrolledUnis = allApplications
            .filter(app => app.applicationStatus === 'ACCEPTED')
            .map(app => app.university)
            .filter(uni => uni && uni.name);
          return enrolledUnis.filter((uni, index, self) => 
            index === self.findIndex(u => u?.id === uni?.id)
          );
        }
        return [];
      
      default:
        return [];
    }
  };

  // Check if student is enrolled
  const isEnrolled = () => {
    const currentProfile = countryProfiles.find(p => p.country === selectedCountry);
    if (!currentProfile) return false;
    
    // Check if current phase is ENROLLMENT
    if (currentProfile.currentPhase === 'ENROLLMENT') return true;
    
    // Check notes for enrollmentUniversity
    if (currentProfile.notes) {
      try {
        const notes = typeof currentProfile.notes === 'string' 
          ? JSON.parse(currentProfile.notes) 
          : currentProfile.notes;
        if (notes.enrollmentUniversity) return true;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return false;
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !student) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error || 'Student not found'}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  const overallProgress = calculateOverallProgress();
  const documentCollectionMissing = getMissingDocuments('DOCUMENT_COLLECTION');

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/admin/counselor-monitoring');
              }}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
              Counselor Monitoring
            </Link>
            <Typography color="text.primary">
              Application Progress
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ color: 'primary.main' }} />
                Application Progress
              </Typography>
              <Chip
                label={selectedCountry}
                color="primary"
                size="small"
                sx={{ height: 28 }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Select Country</InputLabel>
                <Select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  label="Select Country"
                >
                  {countryProfiles.map((profile) => (
                    <MenuItem key={profile.id} value={profile.country}>
                      {profile.country}
                    </MenuItem>
                  ))}
                  {countryProfiles.length === 0 && (
                    <MenuItem value="Australia">Australia</MenuItem>
                  )}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {overallProgress}% Complete
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Progress Cards */}
        <Grid container spacing={3}>
          {AUSTRALIA_PHASES.map((phaseKey, index) => {
            const config = PHASE_CONFIG[phaseKey];
            if (!config) return null;

            const progress = calculatePhaseProgress(phaseKey);
            const status = getPhaseStatus(phaseKey);
            const warning = getPhaseWarning(phaseKey);
            const isCurrent = status.status === 'current';
            const missingDocs = phaseKey === 'DOCUMENT_COLLECTION' ? getMissingDocuments(phaseKey) : [];

            return (
              <Grid item xs={12} sm={6} md={4} key={phaseKey}>
                <Card
                  sx={{
                    height: '100%',
                    border: `2px solid ${isCurrent ? config.borderColor : '#e0e0e0'}`,
                    backgroundColor: isCurrent ? config.bgColor : 'white',
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {warning.hasWarning && (
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: warning.type === 'error' ? 'error.main' : 'warning.main'
                      }}
                    >
                      <WarningIcon fontSize="small" />
                    </IconButton>
                  )}
                  {!warning.hasWarning && status.status === 'pending' && (
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'text.secondary'
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}

                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(config.color, 0.1),
                          color: config.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getPhaseIcon(phaseKey)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {config.label}
                        </Typography>
                        {isCurrent && (
                          <Typography variant="body2" color="text.secondary">
                            {selectedCountry}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {progress}%
                      </Typography>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        sx={{ height: 24 }}
                      />
                    </Box>

                    {phaseKey === 'DOCUMENT_COLLECTION' && (() => {
                      const latestDocs = documents.filter(d => d.isLatest !== false);
                      const uploadedDocs = latestDocs.filter(d => 
                        DOCUMENT_COLLECTION_REQUIRED.includes(d.type) &&
                        (d.status === 'APPROVED' || d.status === 'PENDING')
                      );
                      const uniqueDocTypes = [...new Set(uploadedDocs.map(d => d.type))];
                      return (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Documents: {uniqueDocTypes.length}/{DOCUMENT_COLLECTION_REQUIRED.length}
                          </Typography>
                        {missingDocs.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="error" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              Missing:
                            </Typography>
                            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                              {missingDocs.join(', ')}
                            </Typography>
                          </Box>
                        )}
                        {isCurrent && missingDocs.length > 0 && (
                          <Button
                            variant="contained"
                            startIcon={<CloudUploadIcon />}
                            fullWidth
                            sx={{ mt: 1 }}
                            onClick={() => {
                              // Navigate to student details for document upload
                              navigate(`/admin/students/${studentId}`);
                            }}
                          >
                            Upload Documents ({missingDocs.length} missing)
                          </Button>
                        )}
                        </>
                      );
                    })()}
                    
                    {/* Display universities for relevant phases */}
                    {['UNIVERSITY_SHORTLISTING', 'APPLICATION_SUBMISSION', 'OFFER_LETTER_AUSTRALIA', 'ENROLLMENT'].includes(phaseKey) && (() => {
                      const universities = getUniversitiesForPhase(phaseKey);
                      
                      if (universities && universities.length > 0) {
                        return (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              {phaseKey === 'ENROLLMENT' ? 'Enrolled:' : 'Universities:'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {universities.slice(0, 3).map((uni, idx) => (
                                <Chip
                                  key={uni?.id || idx}
                                  label={uni?.name || 'Unknown University'}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                    backgroundColor: alpha(config.color, 0.1),
                                    color: config.color,
                                    border: `1px solid ${alpha(config.color, 0.3)}`,
                                    fontWeight: 500
                                  }}
                                />
                              ))}
                              {universities.length > 3 && (
                                <Chip
                                  label={`+${universities.length - 3} more`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                    backgroundColor: alpha(config.color, 0.1),
                                    color: config.color
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        );
                      }
                      // Don't show "No universities recorded" - just return null to keep cards clean
                      return null;
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
}

export default ApplicationProgress;

