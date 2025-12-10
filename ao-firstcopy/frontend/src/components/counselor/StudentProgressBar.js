import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Fade,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Description as DocumentIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Flight as FlightIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const PHASES = [
  {
    key: 'DOCUMENT_COLLECTION',
    label: 'Document Collection',
    icon: <DocumentIcon />,
    color: '#2196f3',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']
  },
  {
    key: 'UNIVERSITY_SHORTLISTING',
    label: 'University Shortlisting',
    icon: <SchoolIcon />,
    color: '#ff9800',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT']
  },
  {
    key: 'APPLICATION_SUBMISSION',
    label: 'Application Submission',
    icon: <AssignmentIcon />,
    color: '#9c27b0',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']
  },
  {
    key: 'OFFER_RECEIVED',
    label: 'Offer Received',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']
  },
  {
    key: 'INITIAL_PAYMENT',
    label: 'Initial Payment',
    icon: <PaymentIcon />,
    color: '#795548',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']
  },
  {
    key: 'INTERVIEW',
    label: 'Interview',
    icon: <PersonIcon />,
    color: '#607d8b',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']
  },
  {
    key: 'FINANCIAL_TB_TEST',
    label: 'Financial & TB Test',
    icon: <EventIcon />,
    color: '#ff5722',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'CAS_VISA',
    label: 'CAS Process',
    icon: <TrendingUpIcon />,
    color: '#8bc34a',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'VISA_APPLICATION',
    label: 'Visa Process',
    icon: <FlightIcon />,
    color: '#ffc107',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  },
  {
    key: 'ENROLLMENT',
    label: 'Enrollment',
    icon: <SchoolIcon />,
    color: '#03a9f4',
    requiredDocs: ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
  }
];

const StudentProgressBar = ({ 
  student, 
  documents = [], 
  applications = [], 
  countryProfiles = [],
  selectedCountry: propSelectedCountry = null,
  universities = [],
  onPhaseClick, 
  onUploadDocuments, 
  onInterviewRetry, 
  onInterviewStop, 
  onCasVisaRetry, 
  onCasVisaStop,
  onVisaRetry,
  onVisaStop,
  onCountryChange
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(propSelectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null));

  // Sync internal state with prop when prop changes
  useEffect(() => {
    if (propSelectedCountry !== selectedCountry) {
      setSelectedCountry(propSelectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null));
    }
  }, [propSelectedCountry]);

  // Check if student was created by telecaller/marketing/b2b_marketing
  const isMarketingLead = !!student?.marketingOwnerId;

  // Get current country profile
  const currentCountryProfile = countryProfiles.find(p => p.country === selectedCountry);
  
  // Get country-specific phase (use country profile phase if available, otherwise use student phase)
  const effectiveCurrentPhase = currentCountryProfile?.currentPhase || student?.currentPhase;

  // Helper function to filter universities by selected country
  // Handles country name variations (e.g., "UK" vs "United Kingdom")
  const filterUniversitiesByCountry = (universities) => {
    if (!selectedCountry || !Array.isArray(universities)) {
      return universities || [];
    }
    
    // Normalize country names for comparison - more comprehensive matching
    const normalizeCountry = (country) => {
      if (!country) return '';
      const normalized = country.trim().toUpperCase();
      // Handle common variations
      if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
        return 'UNITED KINGDOM';
      }
      if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
        return 'UNITED STATES';
      }
      // Remove common words and normalize spaces
      return normalized.replace(/\s+/g, ' ').trim();
    };
    
    const normalizedSelected = normalizeCountry(selectedCountry);
    
    // If no universities have country info, return all (don't filter out everything)
    const universitiesWithCountry = universities.filter(u => u && u.country);
    if (universitiesWithCountry.length === 0) {
      // No country info available, show all universities
      return universities;
    }
    
    const filtered = universities.filter(u => {
      if (!u) return false;
      // If university has no country, include it (might be from before country was added)
      if (!u.country) return true;
      const normalizedUniCountry = normalizeCountry(u.country);
      return normalizedUniCountry === normalizedSelected;
    });
    
    // If filtering removed all universities but we have universities with country info,
    // it might be a country name mismatch - show all as fallback with warning
    if (filtered.length === 0 && universities.length > 0) {
      console.warn(`No universities matched country "${selectedCountry}". Showing all universities. Available countries:`, 
        [...new Set(universities.map(u => u?.country).filter(Boolean))]);
      return universities; // Show all as fallback
    }
    
    return filtered;
  };

  // Helper function to get country-specific notes (prioritizes country profile notes)
  const getCountrySpecificNotes = () => {
    if (selectedCountry && currentCountryProfile?.notes) {
      try {
        const notes = currentCountryProfile.notes;
        
        // If it's already an object, return it
        if (typeof notes === 'object' && notes !== null) {
          return notes;
        }
        
        // If it's a string, try to parse as JSON
        if (typeof notes === 'string') {
          // Check if it looks like JSON (starts with { or [)
          const trimmed = notes.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(notes);
          } else {
            // It's a plain string, return null or an empty object
            // This means the notes field contains plain text, not structured data
            return null;
          }
        }
      } catch (e) {
        console.error('Error parsing country profile notes:', e);
        // If parsing fails, return null to fall back to student notes
        return null;
      }
    }
    
    // Fallback to student notes
    if (student?.notes) {
      try {
        const notes = student.notes;
        
        // If it's already an object, return it
        if (typeof notes === 'object' && notes !== null) {
          return notes;
        }
        
        // If it's a string, try to parse as JSON
        if (typeof notes === 'string') {
          // Check if it looks like JSON (starts with { or [)
          const trimmed = notes.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return JSON.parse(notes);
          } else {
            // It's a plain string, return null
            return null;
          }
        }
      } catch (e) {
        console.error('Error parsing student notes:', e);
        return null;
      }
    }
    
    return null;
  };

  useEffect(() => {
    calculateProgress();
  }, [student, documents, applications, selectedCountry, currentCountryProfile]);

  const calculateProgress = () => {
    let currentPhaseIndex = PHASES.findIndex(phase => phase.key === effectiveCurrentPhase);
    
    // Check if Document Collection is actually complete (all documents uploaded)
    let documentCollectionComplete = false;
    if (effectiveCurrentPhase === 'DOCUMENT_COLLECTION' || currentPhaseIndex === 0) {
      const requiredDocs = ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'];
      const relevantDocs = isMarketingLead
        ? documents.filter(doc => doc.uploader?.role === 'counselor' && ['PENDING', 'APPROVED'].includes(doc.status))
        : documents.filter(doc => ['PENDING', 'APPROVED'].includes(doc.status));
      const uploadedDocTypes = relevantDocs.filter(doc => requiredDocs.includes(doc.type)).map(doc => doc.type);
      const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
      documentCollectionComplete = missingDocs.length === 0;
    }
    
    const progress = PHASES.map((phase, index) => {
      const isCompleted = index < currentPhaseIndex;
      const isCurrent = index === currentPhaseIndex;
      const isPending = index > currentPhaseIndex;
      const isNextPhase = index === currentPhaseIndex + 1; // Only check next immediate phase
      
      // Special case: If Document Collection is current but all docs are uploaded, allow next phase
      // Also, if we're on Document Collection and it's complete, the next phase (University Shortlisting) should be clickable
      let canProceedToNext = false;
      if (phase.key === 'DOCUMENT_COLLECTION' && isCurrent && documentCollectionComplete) {
        // Document Collection is complete, can proceed
        canProceedToNext = true;
      } else if (phase.key === 'UNIVERSITY_SHORTLISTING' && isNextPhase && documentCollectionComplete && currentPhaseIndex === 0) {
        // University Shortlisting is next phase and Document Collection is complete
        canProceedToNext = true;
      }
      
      // Special case: If University Shortlisting is completed (has selected universities), enable Application Submission
      if (phase.key === 'APPLICATION_SUBMISSION' && isNextPhase && effectiveCurrentPhase === 'UNIVERSITY_SHORTLISTING') {
        // Check if University Shortlisting has selected universities
        try {
          const notes = getCountrySpecificNotes();
          const shortlist = notes?.universityShortlist;
          const hasShortlistedUniversities = shortlist?.universities && Array.isArray(shortlist.universities) && shortlist.universities.length > 0;
          
          // If country is selected, filter by country
          if (hasShortlistedUniversities && selectedCountry) {
            const normalizeCountry = (country) => {
              if (!country) return '';
              const normalized = country.trim().toUpperCase();
              if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
                return 'UNITED KINGDOM';
              }
              if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
                return 'UNITED STATES';
              }
              return normalized.replace(/\s+/g, ' ').trim();
            };
            
            const normalizedSelected = normalizeCountry(selectedCountry);
            const countryShortlist = shortlist.universities.filter(u => {
              if (!u || !u.country) return false;
              return normalizeCountry(u.country) === normalizedSelected;
            });
            
            if (countryShortlist.length > 0) {
              canProceedToNext = true;
            }
          } else if (hasShortlistedUniversities) {
            // No country selected, but has shortlisted universities
            canProceedToNext = true;
          }
        } catch (e) {
          console.error('Error checking University Shortlisting completion:', e);
        }
      }
      
      // Only check document completion for current phase and next immediate phase
      let requiredDocs = [];
      let uploadedDocs = [];
      let docCompletion = 100;
      let isReady = true;
      let missingDocs = [];
      
      // Special handling for Document Collection phase
      if (phase.key === 'DOCUMENT_COLLECTION' && isCurrent) {
        requiredDocs = phase.requiredDocs;
        
        // For marketing leads, only count documents uploaded by counselor
        // For other leads, count all documents
        const relevantDocs = isMarketingLead
          ? documents.filter(doc => doc.uploader?.role === 'counselor' && ['PENDING', 'APPROVED'].includes(doc.status))
          : documents.filter(doc => ['PENDING', 'APPROVED'].includes(doc.status));
        
        uploadedDocs = relevantDocs.filter(doc => requiredDocs.includes(doc.type));
        
        // Check if all required document types are present
        const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
        missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
        
        // Document Collection is only complete when ALL required documents are uploaded
        isReady = missingDocs.length === 0;
        docCompletion = requiredDocs.length > 0 ? 
          ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100 : 0;
      } else if (isCurrent || isNextPhase) {
        requiredDocs = phase.requiredDocs;
        uploadedDocs = documents.filter(doc => 
          requiredDocs.includes(doc.type) && ['PENDING', 'APPROVED'].includes(doc.status)
        );
        
        // Check if all required document types are present (not just count)
        const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
        missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
        
        // Phase is ready if no documents are required OR all required document types are present
        isReady = requiredDocs.length === 0 || missingDocs.length === 0;
        
        // Calculate completion percentage based on required document types present
        docCompletion = requiredDocs.length > 0 ? 
          ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100 : 100;
      }
      
      // Calculate overall phase completion
      let phaseCompletion = 0;
      if (isCompleted) {
        phaseCompletion = 100;
      } else if (isCurrent) {
        phaseCompletion = docCompletion;
      } else if (isPending) {
        phaseCompletion = 0;
      }

      return {
        ...phase,
        isCompleted,
        isCurrent,
        isPending,
        isNextPhase: isNextPhase || canProceedToNext,
        canProceedToNext,
        isReady,
        docCompletion,
        phaseCompletion,
        uploadedDocs,
        missingDocs
      };
    });

    setProgressData(progress);
  };

  const getOverallProgress = () => {
    const completedPhases = progressData.filter(phase => phase.isCompleted).length;
    const currentPhaseProgress = progressData.find(phase => phase.isCurrent)?.phaseCompletion || 0;
    return ((completedPhases + (currentPhaseProgress / 100)) / PHASES.length) * 100;
  };

  const getStatusIcon = (phase) => {
    if (phase.isCompleted) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (phase.isCurrent) {
      if (phase.isReady) {
        return <CheckCircleIcon sx={{ color: 'warning.main' }} />;
      } else {
        return <WarningIcon sx={{ color: 'error.main' }} />;
      }
    } else if (phase.isNextPhase) {
      // For next phase, only show warning if it's not ready
      if (!phase.isReady) {
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      } else {
        return <PendingIcon sx={{ color: 'text.disabled' }} />;
      }
    } else {
      return <PendingIcon sx={{ color: 'text.disabled' }} />;
    }
  };

  const getStatusColor = (phase) => {
    if (phase.isCompleted) {
      return 'success';
    } else if (phase.isCurrent) {
      return phase.isReady ? 'warning' : 'error';
    } else if (phase.isNextPhase) {
      return phase.isReady ? 'default' : 'warning';
    } else {
      return 'default';
    }
  };

  const handlePhaseClick = (phase) => {
    if (onPhaseClick) {
      onPhaseClick(phase);
    }
  };

  return (
    <Fade in={true} timeout={800}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Application Progress
              </Typography>
              {countryProfiles.length > 0 && (
                <Chip 
                  label={selectedCountry || 'All Countries'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {countryProfiles.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Select Country</InputLabel>
                  <Select
                    value={selectedCountry || ''}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      setSelectedCountry(newCountry);
                      // Notify parent component of country change
                      if (onCountryChange) {
                        onCountryChange(newCountry);
                      }
                    }}
                    label="Select Country"
                  >
                    <MenuItem value={null}>All Countries</MenuItem>
                    {countryProfiles.map((profile) => (
                      <MenuItem key={profile.country} value={profile.country}>
                        {profile.country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Typography variant="body2" color="text.secondary">
                {Math.round(getOverallProgress())}% Complete
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setExpanded(!expanded)}
                sx={{ color: 'text.secondary' }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Overall Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={getOverallProgress()}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }}
            />
          </Box>

          {/* Phase Progress */}
          <Grid container spacing={2}>
            {progressData.map((phase, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={phase.key}>
                <Card
                  sx={{
                    cursor: (phase.isNextPhase || phase.canProceedToNext) ? 'pointer' : 'default',
                    transition: 'all 0.2s ease-in-out',
                    border: phase.isCurrent ? `2px solid ${phase.color}` : '1px solid',
                    borderColor: phase.isCurrent ? phase.color : theme.palette.divider,
                    backgroundColor: phase.isCurrent ? `${phase.color}10` : 'transparent',
                    opacity: (phase.isNextPhase || phase.canProceedToNext) ? 1 : 0.7,
                    '&:hover': {
                      transform: (phase.isNextPhase || phase.canProceedToNext) ? 'translateY(-2px)' : 'none',
                      boxShadow: (phase.isNextPhase || phase.canProceedToNext) ? theme.shadows[4] : 'none',
                      borderColor: (phase.isNextPhase || phase.canProceedToNext) ? phase.color : theme.palette.divider
                    }
                  }}
                  onClick={() => (phase.isNextPhase || phase.canProceedToNext) ? handlePhaseClick(phase) : null}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Box sx={{ color: phase.color }}>
                          {phase.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {phase.label}
                        </Typography>
                          {selectedCountry && (phase.isCurrent || phase.isCompleted) && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                              {selectedCountry}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {getStatusIcon(phase)}
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={phase.phaseCompletion}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: `${phase.color}20`,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: phase.color,
                          borderRadius: 2
                        }
                      }}
                    />

                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(phase.phaseCompletion)}%
                      </Typography>
                      <Chip
                        label={phase.isCompleted ? 'Completed' : phase.isCurrent ? 'Current' : 'Pending'}
                        size="small"
                        color={getStatusColor(phase)}
                        variant={phase.isCurrent ? 'filled' : 'outlined'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Document Status - Only show for current and next phase */}
                    {(phase.isCurrent || phase.isNextPhase) && phase.requiredDocs.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Documents: {phase.requiredDocs.length - phase.missingDocs.length}/{phase.requiredDocs.length}
                        </Typography>
                        {phase.missingDocs.length > 0 && (
                          <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                            Missing: {phase.missingDocs.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Selected Universities - Show for University Shortlisting phase (current or completed) */}
                    {phase.key === 'UNIVERSITY_SHORTLISTING' && (phase.isCurrent || phase.isCompleted) && (() => {
                      try {
                        // Get ONLY shortlisted/selected universities from notes (not all available universities)
                        let shortlistedUniversities = [];
                        let shortlist = null;
                        
                        // First, get shortlisted universities from country-specific notes
                        const notes = getCountrySpecificNotes();
                        shortlist = notes?.universityShortlist;
                        
                        // If no shortlist found, try alternative data structures
                        if (!shortlist || !shortlist.universities) {
                          // Try direct universities array in notes
                          if (notes?.universities && Array.isArray(notes.universities)) {
                            shortlist = { universities: notes.universities };
                          }
                          // Try selectedUniversities
                          else if (notes?.selectedUniversities && Array.isArray(notes.selectedUniversities)) {
                            shortlist = { universities: notes.selectedUniversities };
                          }
                        }
                        
                        // Get shortlisted universities
                        if (shortlist && shortlist.universities && Array.isArray(shortlist.universities)) {
                          shortlistedUniversities = shortlist.universities;
                        }
                        
                        // Filter shortlisted universities by selected country (if country is selected)
                        let universitiesToDisplay = [];
                        if (selectedCountry && shortlistedUniversities.length > 0) {
                          // Filter by selected country using strict matching
                          const normalizeCountry = (country) => {
                            if (!country) return '';
                            const normalized = country.trim().toUpperCase();
                            if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
                              return 'UNITED KINGDOM';
                            }
                            if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
                              return 'UNITED STATES';
                            }
                            return normalized.replace(/\s+/g, ' ').trim();
                          };
                          
                          const normalizedSelected = normalizeCountry(selectedCountry);
                          universitiesToDisplay = shortlistedUniversities.filter(u => {
                            if (!u || !u.country) return false;
                            return normalizeCountry(u.country) === normalizedSelected;
                          });
                        } else if (shortlistedUniversities.length > 0) {
                          // No country selected, show all shortlisted universities
                          universitiesToDisplay = shortlistedUniversities;
                        }
                          
                        // Display universities if we have any
                        if (universitiesToDisplay.length > 0) {
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}08`, borderRadius: 1, border: `1px solid ${phase.color}30` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <SchoolIcon sx={{ fontSize: 14, color: phase.color }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: phase.color, fontSize: '0.7rem' }}>
                                  Available Universities ({universitiesToDisplay.length})
                                </Typography>
                                {selectedCountry && (
                                  <Chip 
                                    label={selectedCountry} 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.6rem',
                                      backgroundColor: `${phase.color}20`,
                                      color: phase.color
                                    }} 
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {universitiesToDisplay.map((uni, idx) => (
                                  <Chip
                                    key={uni.id || idx}
                                    label={uni.name || `University ${idx + 1}`}
                                    size="small"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: 24,
                                      backgroundColor: `${phase.color}25`,
                                      color: phase.color,
                                      border: `1px solid ${phase.color}50`,
                                      fontWeight: 500,
                                      '&:hover': {
                                        backgroundColor: `${phase.color}35`
                                      }
                                    }}
                                    icon={<SchoolIcon sx={{ fontSize: 14, color: phase.color }} />}
                                  />
                                ))}
                              </Box>
                              {selectedCountry && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                                  All universities are from {selectedCountry}
                                </Typography>
                              )}
                            </Box>
                          );
                        } else if (selectedCountry) {
                          // Show message when country is selected but no universities shortlisted for that country
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities shortlisted for {selectedCountry} yet
                              </Typography>
                            </Box>
                          );
                        } else {
                          // No country selected and no universities found
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities shortlisted yet
                              </Typography>
                            </Box>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing university shortlist:', e);
                        console.error('Student notes:', student?.notes);
                        console.error('Country profile notes:', currentCountryProfile?.notes);
                        return (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                              Error loading universities
                            </Typography>
                          </Box>
                        );
                      }
                    })()}

                    {/* Application Universities - Show for Application Submission phase (current or completed) */}
                    {phase.key === 'APPLICATION_SUBMISSION' && (phase.isCurrent || phase.isCompleted) && (() => {
                      try {
                        // First, try to get universities from applicationSubmissionUniversities (selected in phase popup)
                        const notes = getCountrySpecificNotes();
                        const applicationUniversities = notes?.applicationSubmissionUniversities;
                        
                        let universitiesToDisplay = [];
                        
                        // If we have applicationSubmissionUniversities, use those
                        if (applicationUniversities?.universities && Array.isArray(applicationUniversities.universities)) {
                          // Filter by selected country if country is selected
                          if (selectedCountry) {
                            const normalizeCountry = (country) => {
                              if (!country) return '';
                              const normalized = country.trim().toUpperCase();
                              if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
                                return 'UNITED KINGDOM';
                              }
                              if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
                                return 'UNITED STATES';
                              }
                              return normalized.replace(/\s+/g, ' ').trim();
                            };
                            
                            const normalizedSelected = normalizeCountry(selectedCountry);
                            universitiesToDisplay = applicationUniversities.universities.filter(u => {
                              if (!u || !u.country) return false;
                              return normalizeCountry(u.country) === normalizedSelected;
                            });
                          } else {
                            universitiesToDisplay = applicationUniversities.universities;
                          }
                        }
                        
                        // If no universities from applicationSubmissionUniversities, fallback to applications array
                        if (universitiesToDisplay.length === 0) {
                          const countryApplications = selectedCountry 
                            ? applications.filter(app => app.university?.country === selectedCountry)
                            : applications;
                          
                          if (countryApplications.length > 0) {
                            const uniqueUniversities = countryApplications
                              .map(app => app.university)
                              .filter((uni, index, self) => 
                                uni && index === self.findIndex(u => u && u.id === uni.id)
                              );
                            
                            universitiesToDisplay = uniqueUniversities.map(uni => ({
                              id: uni.id,
                              name: uni.name,
                              country: uni.country,
                              city: uni.city
                            }));
                          }
                        }
                        
                        // Display universities if we have any
                        if (universitiesToDisplay.length > 0) {
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}08`, borderRadius: 1, border: `1px solid ${phase.color}30` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <SchoolIcon sx={{ fontSize: 14, color: phase.color }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: phase.color, fontSize: '0.7rem' }}>
                                  Selected Universities ({universitiesToDisplay.length})
                                </Typography>
                                {selectedCountry && (
                                  <Chip 
                                    label={selectedCountry} 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.6rem',
                                      backgroundColor: `${phase.color}20`,
                                      color: phase.color
                                    }} 
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {universitiesToDisplay.map((uni, idx) => (
                                  <Chip
                                    key={uni.id || idx}
                                    label={uni.name || `University ${idx + 1}`}
                                    size="small"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: 24,
                                      backgroundColor: `${phase.color}25`,
                                      color: phase.color,
                                      border: `1px solid ${phase.color}50`,
                                      fontWeight: 500,
                                      '&:hover': {
                                        backgroundColor: `${phase.color}35`
                                      }
                                    }}
                                    icon={<SchoolIcon sx={{ fontSize: 14, color: phase.color }} />}
                                  />
                                ))}
                              </Box>
                              {selectedCountry && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                                  All universities are from {selectedCountry}
                                </Typography>
                              )}
                            </Box>
                          );
                        } else if (selectedCountry) {
                          // Show message when country is selected but no universities found
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities selected for application submission to {selectedCountry} yet
                              </Typography>
                            </Box>
                          );
                        } else {
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities selected for application submission yet
                              </Typography>
                            </Box>
                          );
                        }
                      } catch (e) {
                        console.error('Error displaying application universities:', e);
                        return (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                              Error loading universities
                            </Typography>
                          </Box>
                        );
                      }
                    })()}

                    {/* Selected Universities - Show for Offer Received phase (current or completed) */}
                    {phase.key === 'OFFER_RECEIVED' && (phase.isCurrent || phase.isCompleted) && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const offers = notes?.universitiesWithOffers;
                        
                        // Get applications with ACCEPTED status, filtered by country
                        const acceptedApplications = selectedCountry
                          ? applications.filter(app => 
                              app.university?.country === selectedCountry && 
                              app.applicationStatus === 'ACCEPTED'
                            )
                          : applications.filter(app => app.applicationStatus === 'ACCEPTED');
                        
                        if (offers && offers.universities && Array.isArray(offers.universities) && offers.universities.length > 0) {
                          // Filter by selected country - always filter if country is selected
                          let universities = filterUniversitiesByCountry(offers.universities);
                          
                          // If filtering resulted in empty but we have universities, show all as fallback
                          if (universities.length === 0 && offers.universities.length > 0) {
                            const hasCountryInfo = offers.universities.some(u => u?.country);
                            if (hasCountryInfo) {
                              console.warn(`Country filter "${selectedCountry}" didn't match any universities with offers. Showing all.`);
                              universities = offers.universities; // Show all as fallback
                            } else {
                              universities = offers.universities; // No country info - show all
                            }
                          }
                          
                          // Merge with accepted applications (already filtered by country above)
                          acceptedApplications.forEach(app => {
                            if (app.university && !universities.find(u => u.id === app.university.id)) {
                              universities.push(app.university);
                            }
                          });
                          
                          if (universities.length > 0) {
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                  Universities with Offers ({universities.length}):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {universities.map((uni, idx) => (
                                  <Chip
                                    key={uni.id || idx}
                                    label={uni.name || `University ${idx + 1}`}
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        backgroundColor: `${phase.color}20`,
                                        color: phase.color,
                                        border: `1px solid ${phase.color}40`
                                      }}
                                      icon={<CheckCircleIcon sx={{ fontSize: 14, color: phase.color }} />}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            );
                          } else if (selectedCountry) {
                            // Show message when country is selected but no offers found for that country
                            return (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                  No offers received for {selectedCountry}
                                </Typography>
                              </Box>
                            );
                          }
                        } else if (acceptedApplications.length > 0) {
                          // Show accepted applications if no offers in notes
                          const uniqueUniversities = acceptedApplications
                            .map(app => app.university)
                            .filter((uni, index, self) => 
                              uni && index === self.findIndex(u => u.id === uni.id)
                            );
                          
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Accepted Universities ({uniqueUniversities.length}):
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {uniqueUniversities.map((uni, idx) => (
                                  <Chip
                                    key={uni.id || idx}
                                    label={uni.name}
                                    size="small"
                                    sx={{
                                      fontSize: '0.65rem',
                                      height: 20,
                                      backgroundColor: `${phase.color}20`,
                                      color: phase.color,
                                      border: `1px solid ${phase.color}40`
                                    }}
                                    icon={<CheckCircleIcon sx={{ fontSize: 14, color: phase.color }} />}
                                  />
                                ))}
                              </Box>
                            </Box>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing universities with offers:', e);
                        return null;
                      }
                      return null;
                    })()}

                    {/* Universities for Initial Payment phase - Show Offer Received universities */}
                    {phase.key === 'INITIAL_PAYMENT' && (phase.isCurrent || phase.isCompleted) && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const offers = notes?.universitiesWithOffers;
                        const paymentUni = notes?.initialPaymentUniversity;
                        
                        // Get universities from Offer Received phase
                        let universitiesToDisplay = [];
                        if (offers && offers.universities && Array.isArray(offers.universities)) {
                          // Filter by selected country if country is selected
                          if (selectedCountry) {
                            const normalizeCountry = (country) => {
                              if (!country) return '';
                              const normalized = country.trim().toUpperCase();
                              if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
                                return 'UNITED KINGDOM';
                              }
                              if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
                                return 'UNITED STATES';
                              }
                              return normalized.replace(/\s+/g, ' ').trim();
                            };
                            
                            const normalizedSelected = normalizeCountry(selectedCountry);
                            universitiesToDisplay = offers.universities.filter(u => {
                              if (!u || !u.country) return false;
                              return normalizeCountry(u.country) === normalizedSelected;
                            });
                          } else {
                            universitiesToDisplay = offers.universities;
                          }
                        }
                        
                        // If we have universities from Offer Received phase, display them
                        if (universitiesToDisplay.length > 0) {
                          // Check if a university has been selected for payment
                          const selectedUniversity = paymentUni?.university;
                          const isSelected = (uni) => selectedUniversity && selectedUniversity.id === uni.id;
                          
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}08`, borderRadius: 1, border: `1px solid ${phase.color}30` }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                <SchoolIcon sx={{ fontSize: 14, color: phase.color }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: phase.color, fontSize: '0.7rem' }}>
                                  Universities with Offers ({universitiesToDisplay.length})
                                </Typography>
                                {selectedCountry && (
                                  <Chip 
                                    label={selectedCountry} 
                                    size="small" 
                                    sx={{ 
                                      height: 18, 
                                      fontSize: '0.6rem',
                                      backgroundColor: `${phase.color}20`,
                                      color: phase.color
                                    }} 
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {universitiesToDisplay.map((uni, idx) => {
                                  const selected = isSelected(uni);
                                  return (
                                    <Chip
                                      key={uni.id || idx}
                                      label={uni.name || `University ${idx + 1}`}
                                      size="small"
                                      sx={{
                                        fontSize: '0.7rem',
                                        height: 24,
                                        backgroundColor: selected 
                                          ? `${phase.color}40` 
                                          : `${phase.color}25`,
                                        color: phase.color,
                                        border: `1px solid ${selected ? phase.color : `${phase.color}50`}`,
                                        fontWeight: selected ? 600 : 500,
                                        '&:hover': {
                                          backgroundColor: `${phase.color}35`
                                        }
                                      }}
                                      icon={selected 
                                        ? <PaymentIcon sx={{ fontSize: 14, color: phase.color }} /> 
                                        : <CheckCircleIcon sx={{ fontSize: 14, color: phase.color }} />
                                      }
                                    />
                                  );
                                })}
                              </Box>
                              {selectedUniversity && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                                  Selected for Payment: <strong>{selectedUniversity.name}</strong>
                                </Typography>
                              )}
                              {selectedCountry && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.65rem' }}>
                                  All universities are from {selectedCountry}
                                </Typography>
                              )}
                            </Box>
                          );
                        } else if (selectedCountry) {
                          // Show message when country is selected but no universities found
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities with offers found for {selectedCountry}. Please complete the Offer Received phase first.
                              </Typography>
                            </Box>
                          );
                        } else {
                          // No country selected and no universities found
                          return (
                            <Box sx={{ mt: 1.5, p: 1, backgroundColor: `${phase.color}05`, borderRadius: 1, border: `1px dashed ${phase.color}30` }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 14 }} />
                                No universities with offers found. Please complete the Offer Received phase first.
                              </Typography>
                            </Box>
                          );
                        }
                      } catch (e) {
                        console.error('Error parsing universities for Initial Payment:', e);
                        return (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="error" sx={{ fontSize: '0.65rem' }}>
                              Error loading universities
                            </Typography>
                          </Box>
                        );
                      }
                    })()}

                    {/* Interview Status Display - Show for Interview phase whenever there's a status */}
                    {phase.key === 'INTERVIEW' && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const interviewStatus = notes?.interviewStatus;
                        if (interviewStatus && interviewStatus.status) {
                          const status = interviewStatus.status;
                          const isApproved = status === 'APPROVED';
                          const isRefused = status === 'REFUSED';
                          const isStopped = status === 'STOPPED';
                          
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Interview Status:
                              </Typography>
                              <Chip
                                label={isApproved ? 'Approved' : isRefused ? 'Refused' : 'Stopped'}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: isApproved 
                                    ? '#4caf5020' 
                                    : isRefused 
                                    ? '#f4433620' 
                                    : '#ff980020',
                                  color: isApproved 
                                    ? '#4caf50' 
                                    : isRefused 
                                    ? '#f44336' 
                                    : '#ff9800',
                                  border: `1px solid ${isApproved ? '#4caf5040' : isRefused ? '#f4433640' : '#ff980040'}`,
                                  fontWeight: 600,
                                  mb: isRefused ? 1 : 0
                                }}
                                icon={isApproved ? <CheckCircleIcon sx={{ fontSize: 14, color: isApproved ? '#4caf50' : 'inherit' }} /> : <WarningIcon sx={{ fontSize: 14, color: isRefused ? '#f44336' : 'inherit' }} />}
                              />
                              {/* Retry and Stop buttons - Show only if refused */}
                              {isRefused && onInterviewRetry && onInterviewStop && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onInterviewRetry();
                                    }}
                                    sx={{
                                      flex: 1,
                                      fontSize: '0.7rem',
                                      py: 0.3,
                                      borderColor: phase.color,
                                      color: phase.color,
                                      '&:hover': {
                                        borderColor: phase.color,
                                        backgroundColor: `${phase.color}10`
                                      }
                                    }}
                                  >
                                    Retry
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onInterviewStop();
                                    }}
                                    sx={{
                                      flex: 1,
                                      fontSize: '0.7rem',
                                      py: 0.3,
                                      borderColor: '#ff9800',
                                      color: '#ff9800',
                                      '&:hover': {
                                        borderColor: '#ff9800',
                                        backgroundColor: '#ff980010'
                                      }
                                    }}
                                  >
                                    Stop
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* CAS Process Status Display - Show for CAS Process phase whenever there's a status */}
                    {phase.key === 'CAS_VISA' && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const casVisaStatus = notes?.casVisaStatus;
                        if (casVisaStatus && casVisaStatus.status) {
                          const status = casVisaStatus.status;
                          const isApproved = status === 'APPROVED';
                          const isRefused = status === 'REFUSED';
                          const isStopped = status === 'STOPPED';
                          
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                CAS Process Status:
                              </Typography>
                              <Chip
                                label={isApproved ? 'Approved' : isRefused ? 'Refused' : 'Stopped'}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: isApproved 
                                    ? '#4caf5020' 
                                    : isRefused 
                                    ? '#f4433620' 
                                    : '#ff980020',
                                  color: isApproved 
                                    ? '#4caf50' 
                                    : isRefused 
                                    ? '#f44336' 
                                    : '#ff9800',
                                  border: `1px solid ${isApproved ? '#4caf5040' : isRefused ? '#f4433640' : '#ff980040'}`,
                                  fontWeight: 600,
                                  mb: isRefused ? 1 : 0
                                }}
                                icon={isApproved ? <CheckCircleIcon sx={{ fontSize: 14, color: isApproved ? '#4caf50' : 'inherit' }} /> : <WarningIcon sx={{ fontSize: 14, color: isRefused ? '#f44336' : 'inherit' }} />}
                              />
                              {/* Retry and Stop buttons - Show only if refused */}
                              {isRefused && onCasVisaRetry && onCasVisaStop && (
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCasVisaRetry();
                                    }}
                                    sx={{
                                      flex: 1,
                                      fontSize: '0.7rem',
                                      py: 0.3,
                                      borderColor: phase.color,
                                      color: phase.color,
                                      '&:hover': {
                                        borderColor: phase.color,
                                        backgroundColor: `${phase.color}10`
                                      }
                                    }}
                                  >
                                    Retry
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCasVisaStop();
                                    }}
                                    sx={{
                                      flex: 1,
                                      fontSize: '0.7rem',
                                      py: 0.3,
                                      borderColor: '#ff9800',
                                      color: '#ff9800',
                                      '&:hover': {
                                        borderColor: '#ff9800',
                                        backgroundColor: '#ff980010'
                                      }
                                    }}
                                  >
                                    Stop
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* Visa Process Status Display - Show for Visa Process phase whenever there's a status */}
                    {phase.key === 'VISA_APPLICATION' && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const visaStatus = notes?.visaStatus;
                        if (visaStatus && visaStatus.status) {
                          const status = visaStatus.status;
                          const isApproved = status === 'APPROVED';
                          const isRefused = status === 'REFUSED';
                          const isStopped = status === 'STOPPED';
                          
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Visa Process Status:
                              </Typography>
                              <Chip
                                label={isApproved ? 'Approved' : isRefused ? 'Refused' : 'Stopped'}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: isApproved 
                                    ? '#4caf5020' 
                                    : isRefused 
                                    ? '#f4433620' 
                                    : '#ff980020',
                                  color: isApproved 
                                    ? '#4caf50' 
                                    : isRefused 
                                    ? '#f44336' 
                                    : '#ff9800',
                                  border: `1px solid ${isApproved ? '#4caf5040' : isRefused ? '#f4433640' : '#ff980040'}`,
                                  fontWeight: 600,
                                  mb: isRefused ? 1 : 0
                                }}
                                icon={isApproved ? <CheckCircleIcon sx={{ fontSize: 14, color: isApproved ? '#4caf50' : 'inherit' }} /> : <WarningIcon sx={{ fontSize: 14, color: isRefused ? '#f44336' : 'inherit' }} />}
                              />
                              {/* Refused message and Retry button - Show only if refused */}
                              {isRefused && onVisaRetry && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1, fontSize: '0.7rem', fontStyle: 'italic' }}>
                                    Visa has been refused
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onVisaRetry();
                                    }}
                                    sx={{
                                      fontSize: '0.7rem',
                                      py: 0.3,
                                      borderColor: phase.color,
                                      color: phase.color,
                                      '&:hover': {
                                        borderColor: phase.color,
                                        backgroundColor: `${phase.color}10`
                                      }
                                    }}
                                  >
                                    Retry
                                  </Button>
                                </Box>
                              )}
                            </Box>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* Financial Option Display - Show for Financial & TB Test phase (current or completed) */}
                    {phase.key === 'FINANCIAL_TB_TEST' && (phase.isCurrent || phase.isCompleted) && (() => {
                      try {
                        const notes = getCountrySpecificNotes();
                        const financialOption = notes?.financialOption;
                        if (financialOption && financialOption.label) {
                          return (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Financial Option:
                              </Typography>
                              <Chip
                                label={financialOption.label}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  backgroundColor: `${phase.color}20`,
                                  color: phase.color,
                                  border: `1px solid ${phase.color}40`,
                                  fontWeight: 600
                                }}
                                icon={<EventIcon sx={{ fontSize: 14, color: phase.color }} />}
                              />
                            </Box>
                          );
                        }
                      } catch (e) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* Upload Documents Button - Show for Document Collection phase until all required documents are uploaded */}
                    {phase.key === 'DOCUMENT_COLLECTION' && 
                     phase.isCurrent && 
                     phase.missingDocs && phase.missingDocs.length > 0 &&
                     onUploadDocuments && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUploadDocuments();
                          }}
                          sx={{
                            width: '100%',
                            fontSize: '0.75rem',
                            py: 0.5,
                            backgroundColor: phase.color,
                            '&:hover': {
                              backgroundColor: phase.color,
                              opacity: 0.9
                            }
                          }}
                        >
                          Upload Documents
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
                
                {/* Enrollment University Display - Show university from Initial Payment phase (outside card) */}
                {phase.key === 'ENROLLMENT' && (phase.isCurrent || phase.isCompleted) && (() => {
                  try {
                    const notes = getCountrySpecificNotes();
                    const paymentUni = notes?.initialPaymentUniversity;
                    
                    if (paymentUni && paymentUni.university) {
                      const university = paymentUni.university;
                      return (
                        <Box sx={{ mt: 2, p: 1.5, backgroundColor: `${phase.color}08`, borderRadius: 1, border: `1px solid ${phase.color}30` }}>
                          <Chip
                            label={university.name || 'University'}
                            size="small"
                            sx={{
                              fontSize: '0.8rem',
                              height: 28,
                              backgroundColor: `${phase.color}40`,
                              color: phase.color,
                              border: `1px solid ${phase.color}`,
                              fontWeight: 600
                            }}
                          />
                          {university.country && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                              Country: <strong>{university.country}</strong>
                            </Typography>
                          )}
                        </Box>
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing enrollment university:', e);
                    return null;
                  }
                  return null;
                })()}
              </Grid>
            ))}
          </Grid>

          {/* Detailed View */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Detailed Progress
            </Typography>
            
            <List>
              {progressData.map((phase, index) => (
                <React.Fragment key={phase.key}>
                  <ListItem sx={{ 
                    backgroundColor: phase.isCurrent ? `${phase.color}10` : 'transparent',
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <ListItemIcon sx={{ color: phase.color }}>
                      {phase.icon}
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ component: 'div' }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
                          <Typography variant="body1" sx={{ fontWeight: 600 }} component="div">
                            {phase.label}
                          </Typography>
                          {getStatusIcon(phase)}
                        </Box>
                      }
                    />
                    <Box sx={{ mt: 1, ml: 7 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress: {Math.round(phase.phaseCompletion)}%
                      </Typography>
                      {(phase.isCurrent || phase.isNextPhase) && phase.requiredDocs.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Required Documents:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {phase.requiredDocs.map(docType => {
                              const isUploaded = phase.uploadedDocs.some(doc => doc.type === docType);
                              return (
                                <Chip
                                  key={docType}
                                  label={docType.replace(/_/g, ' ')}
                                  size="small"
                                  color={isUploaded ? 'success' : 'default'}
                                  variant={isUploaded ? 'filled' : 'outlined'}
                                  icon={isUploaded ? <CheckCircleIcon /> : <PendingIcon />}
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      {(phase.isCurrent || phase.isNextPhase) && phase.missingDocs.length > 0 && (
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                          ⚠️ Missing: {phase.missingDocs.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </ListItem>
                  {index < progressData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    </Fade>
  );
};

export default StudentProgressBar; 