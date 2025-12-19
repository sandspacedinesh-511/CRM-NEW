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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
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
  CloudUpload as CloudUploadIcon,
  AccountBalance as AccountBalanceIcon,
  HealthAndSafety as HealthAndSafetyIcon,
  CreditCard as CreditCardIcon,
  VerifiedUser as VerifiedUserIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

// Helper function to create phase objects with icons and colors
const createPhase = (key, label, iconType, color, requiredDocs = []) => {
  const iconMap = {
    document: <DocumentIcon />,
    school: <SchoolIcon />,
    assignment: <AssignmentIcon />,
    check: <CheckCircleIcon />,
    payment: <PaymentIcon />,
    person: <PersonIcon />,
    event: <EventIcon />,
    trending: <TrendingUpIcon />,
    flight: <FlightIcon />,
    account: <AccountBalanceIcon />,
    health: <HealthAndSafetyIcon />,
    credit: <CreditCardIcon />,
    verified: <VerifiedUserIcon />
  };

  return {
    key,
    label,
    icon: iconMap[iconType] || <EventIcon />,
    color,
    requiredDocs
  };
};

// Base documents required for Document Collection phase (common for all countries)
export const BASE_DOCUMENTS = [
  'PASSPORT',
  'ACADEMIC_TRANSCRIPT',
  'RECOMMENDATION_LETTER',
  'STATEMENT_OF_PURPOSE',
  'CV_RESUME'
];

// Shared documents that are valid across all countries
// These documents, when uploaded, should be visible and usable for all country-specific phases
export const SHARED_DOCUMENTS = [
  'FINANCIAL_PROOF',
  'FINANCIAL_STATEMENT',
  'BANK_STATEMENT',
  'BANK_STATEMENTS',
  'PASSPORT',
  'ACADEMIC_TRANSCRIPT',
  'ENGLISH_TEST_SCORE',
  'MEDICAL_CERTIFICATE',
  'CV_RESUME',
  'RECOMMENDATION_LETTER',
  'STATEMENT_OF_PURPOSE'
];

// Country and phase-specific document rules
// Country keys are normalized to lowercase (e.g., 'usa', 'uk', 'uae')
// Phase labels must match exactly with phase.label in PROCESS_STEPS
const COUNTRY_DOCUMENT_RULES = {
  usa: {
    // Offer Letter document is no longer specifically enforced for this phase
    'Offer Received': [
      'I_20_FORM'
    ],
    'SEVIS Fee Payment': [
      'SEVIS_FEE_RECEIPT'
    ],
    'Visa Application (F-1) – DS-160 + Biometrics': [
      'DS_160_CONFIRMATION',
      'VISA_APPOINTMENT_CONFIRMATION',
      'BANK_STATEMENTS',
      'SPONSOR_AFFIDAVIT',
      'INCOME_PROOF'
    ]
  },
  uk: {
    // Offer Letter / CAS Letter documents are no longer specifically enforced for this phase
    'Offer Received': [],
    'Visa Process': [
      'TB_TEST_CERTIFICATE',
      'BANK_STATEMENTS',
      'TUITION_FEE_RECEIPT'
    ]
  },
  germany: {
    'Offer Received': [],
    'Blocked Account + Health Insurance': [
      'BLOCKED_ACCOUNT_PROOF',
      'HEALTH_INSURANCE'
    ],
    'Visa Application – National D Visa': [
      'APS_CERTIFICATE',
      'VISA_APPLICATION',
      'BIOMETRICS'
    ]
  },
  canada: {
    'Letter of Acceptance (LOA)': [
      'LOA'
    ],
    'Initial Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Study Permit Application': [
      'GIC_CERTIFICATE',
      'BANK_STATEMENTS',
      'MEDICAL_EXAM',
      'BIOMETRICS'
    ]
  },
  australia: {
    // Offer Letter document is no longer specifically enforced for this phase
    'Offer Letter': [],
    'OSHC + Tuition Deposit': [
      'OSHC',
      'TUITION_FEE_RECEIPT'
    ],
    'eCOE Issued': [
      'ECOE'
    ],
    'Visa Application (Subclass 500)': [
      'FINANCIAL_PROOF',
      'VISA_APPLICATION',
      'BIOMETRICS'
    ]
  },
  ireland: {
    'Offer Received': [],
    'Initial Tuition Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Visa Application': [
      'BANK_STATEMENT',
      'MEDICAL_INSURANCE'
    ]
  },
  france: {
    'Offer Received': [],
    'Application Submission (Campus France / Direct)': [
      'CAMPUS_FRANCE_REGISTRATION',
      'INTERVIEW_ACKNOWLEDGEMENT'
    ],
    'Visa Application – VFS France': [
      'TUITION_FEE_RECEIPT',
      'OFII_FORM',
      'BIOMETRICS'
    ]
  },
  italy: {
    'Offer Received': [],
    'Pre-Enrollment on Universitaly Portal': [
      'UNIVERSITALY_RECEIPT'
    ],
    'Visa Application – Type D (Long Stay)': [
      'FINANCIAL_PROOF',
      'ACCOMMODATION_PROOF',
      'VISA_APPLICATION'
    ]
  },
  greece: {
    'Offer Received': [],
    'Initial Tuition Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Visa Application (National Visa – Type D)': [
      'FINANCIAL_PROOF',
      'ACCOMMODATION_PROOF',
      'VISA_APPLICATION'
    ]
  },
  denmark: {
    'Offer Received': [],
    'Tuition Fee Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Residence Permit Application': [
      'FINANCIAL_PROOF',
      'BIOMETRICS'
    ]
  },
  finland: {
    'Offer Received': [],
    'Tuition Fee Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Residence Permit Application': [
      'FINANCIAL_PROOF',
      'BIOMETRICS'
    ]
  },
  singapore: {
    'Offer Received': [],
    'Student Pass Application (IPA)': [
      'IPA_LETTER'
    ],
    'Student Pass Issuance': [
      'MEDICAL_REPORT'
    ]
  },
  uae: {
    'Offer Received': [],
    'Student Visa Processing': [
      'STUDENT_VISA_APPROVAL',
      'MEDICAL_TEST',
      'EMIRATES_ID_APPLICATION'
    ]
  },
  malta: {
    'Offer Received': [],
    'Initial Payment': [
      'TUITION_FEE_RECEIPT'
    ],
    'Visa Application (National Visa – Type D)': [
      'BANK_STATEMENTS',
      'ACCOMMODATION_PROOF',
      'MEDICAL_INSURANCE'
    ]
  }
};

// Helper function to normalize country name to lowercase key
// Examples: "USA" → "usa", "Dubai" → "uae", "United Kingdom" → "uk"
export const normalizeCountryKey = (country) => {
  if (!country) return null;
  const normalized = country.trim();
  const upperNormalized = normalized.toUpperCase();

  // Map variations to lowercase keys
  const countryKeyMap = {
    'UK': 'uk',
    'U.K.': 'uk',
    'U.K': 'uk',
    'UNITED KINGDOM': 'uk',
    'United Kingdom': 'uk',
    'USA': 'usa',
    'U.S.A.': 'usa',
    'U.S.': 'usa',
    'US': 'usa',
    'UNITED STATES': 'usa',
    'UNITED STATES OF AMERICA': 'usa',
    'United States': 'usa',
    'UAE': 'uae',
    'U.A.E.': 'uae',
    'UNITED ARAB EMIRATES': 'uae',
    'Dubai': 'uae',
    'DUBAI': 'uae',
    'Germany': 'germany',
    'GERMANY': 'germany',
    'Canada': 'canada',
    'CANADA': 'canada',
    'Australia': 'australia',
    'AUSTRALIA': 'australia',
    'Ireland': 'ireland',
    'IRELAND': 'ireland',
    'France': 'france',
    'FRANCE': 'france',
    'Italy': 'italy',
    'ITALY': 'italy',
    'Greece': 'greece',
    'GREECE': 'greece',
    'Denmark': 'denmark',
    'DENMARK': 'denmark',
    'Finland': 'finland',
    'FINLAND': 'finland',
    'Singapore': 'singapore',
    'SINGAPORE': 'singapore',
    'Malta': 'malta',
    'MALTA': 'malta'
  };

  return countryKeyMap[upperNormalized] || normalized.toLowerCase();
};

// Helper function to get documents for a phase based on country and phase label
// Returns: { documents: string[], canUpload: boolean }
export const getDocumentsForPhase = (phaseKey, phaseLabel, country) => {
  // Document Collection phase always uses BASE_DOCUMENTS and allows upload
  if (phaseKey === 'DOCUMENT_COLLECTION') {
    return {
      documents: BASE_DOCUMENTS,
      canUpload: true
    };
  }

  // Enrollment phase: universal documents required for ALL countries
  if (phaseKey === 'ENROLLMENT') {
    return {
      documents: ['ID_CARD', 'ENROLLMENT_LETTER'],
      canUpload: true
    };
  }

  // For other phases, check if country + phase exists in COUNTRY_DOCUMENT_RULES
  const countryKey = normalizeCountryKey(country);
  if (countryKey && COUNTRY_DOCUMENT_RULES[countryKey]) {
    const phaseDocuments = COUNTRY_DOCUMENT_RULES[countryKey][phaseLabel];
    if (phaseDocuments && phaseDocuments.length > 0) {
      return {
        documents: phaseDocuments,
        canUpload: true
      };
    }
  }

  // Default: no documents (will show read-only based on phase.requiredDocs from PROCESS_STEPS)
  return {
    documents: [],
    canUpload: false
  };
};

// Country-specific phase mappings
const PROCESS_STEPS = {
  // United Kingdom
  'United Kingdom': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_PAYMENT', 'Initial Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('INTERVIEW', 'Interview', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('FINANCIAL_TB_TEST', 'Financial & TB Test', 'event', '#ff5722', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('CAS_VISA', 'CAS Process', 'trending', '#8bc34a', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_APPLICATION', 'Visa Process', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Italy
  'Italy': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('PRE_ENROLLMENT_UNIVERSITALY', 'Pre-Enrollment on Universitaly Portal', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_PAYMENT', 'Initial Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_ITALY', 'Visa Application – Type D (Long Stay)', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_RESIDENCE_PERMIT', 'Arrival & Residence Permit (Permesso di Soggiorno)', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // France
  'France': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION_FRANCE', 'Application Submission (Campus France / Direct)', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INTERVIEW_CAMPUS_FRANCE', 'Interview (Campus France)', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_PAYMENT', 'Initial Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_FRANCE', 'Visa Application – VFS France', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('OFII_ARRIVAL', 'OFII / Arrival Formalities', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Germany
  'Germany': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('APS_CERTIFICATE', 'APS (If Not Done Before)', 'verified', '#8bc34a', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('BLOCKED_ACCOUNT_HEALTH', 'Blocked Account + Health Insurance', 'account', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_GERMANY', 'Visa Application – National D Visa', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_GERMANY', 'Arrival in Germany', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // United States
  'United States': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('DEPOSIT_I20', 'Deposit Payment & I-20', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('SEVIS_FEE', 'SEVIS Fee Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_USA', 'Visa Application (F-1) – DS-160 + Biometrics', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_INTERVIEW', 'Visa Interview', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_ENROLLMENT_USA', 'Arrival & Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Canada
  'Canada': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('LETTER_OF_ACCEPTANCE', 'Letter of Acceptance (LOA)', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_PAYMENT', 'Initial Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('GIC_OPTIONAL', 'GIC (Optional for SDS)', 'credit', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('STUDY_PERMIT_APPLICATION', 'Study Permit Application', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('PRE_DEPARTURE', 'Pre-Departure', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Australia
  'Australia': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_LETTER_AUSTRALIA', 'Offer Letter', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OSHC_TUITION_DEPOSIT', 'OSHC + Tuition Deposit', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('ECOE_ISSUED', 'eCOE Issued', 'verified', '#8bc34a', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_AUSTRALIA', 'Visa Application (Subclass 500)', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('PRE_DEPARTURE', 'Pre-Departure', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Ireland
  'Ireland': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_TUITION_PAYMENT', 'Initial Tuition Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION', 'Visa Application', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('PRE_DEPARTURE', 'Pre-Departure', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('GNIB_REGISTRATION', 'Arrival → GNIB Registration', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Greece
  'Greece': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_TUITION_PAYMENT', 'Initial Tuition Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_GREECE', 'Visa Application (National Visa – Type D)', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_GREECE', 'Arrival in Greece', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('RESIDENCE_PERMIT_GREECE', 'Residence Permit', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Denmark
  'Denmark': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('TUITION_FEE_PAYMENT', 'Tuition Fee Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('RESIDENCE_PERMIT_APPLICATION_DENMARK', 'Residence Permit Application', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_PERMIT_DECISION_DENMARK', 'Visa / Permit Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('PRE_DEPARTURE', 'Pre-Departure', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_CPR_REGISTRATION', 'Arrival & CPR Registration', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Finland
  'Finland': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('ENTRANCE_EXAM_INTERVIEW', 'Entrance Exam / Interview', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('TUITION_FEE_PAYMENT', 'Tuition Fee Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('RESIDENCE_PERMIT_APPLICATION_FINLAND', 'Residence Permit Application', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_MUNICIPALITY_REGISTRATION', 'Arrival & Municipality Registration', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Singapore
  'Singapore': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('ACCEPT_OFFER_PAY_DEPOSIT', 'Accept Offer & Pay Deposit', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('STUDENT_PASS_APPLICATION_IPA', 'Student Pass Application (IPA)', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('IPA_RECEIVED', 'In-Principle Approval (IPA) Received', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_SINGAPORE', 'Arrival in Singapore', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('STUDENT_PASS_ISSUANCE', 'Student Pass Issuance', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // UAE (Dubai)
  'UAE': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_TUITION_PAYMENT', 'Initial Tuition Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('STUDENT_VISA_PROCESSING_UAE', 'Student Visa Processing', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_APPROVAL_UAE', 'Visa Approval', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_UAE', 'Arrival in UAE', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('EMIRATES_ID_MEDICAL', 'Emirates ID & Medical', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ],

  // Malta
  'Malta': [
    createPhase('DOCUMENT_COLLECTION', 'Document Collection', 'document', '#2196f3', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME']),
    createPhase('UNIVERSITY_SHORTLISTING', 'University Shortlisting', 'school', '#ff9800', ['PASSPORT', 'ACADEMIC_TRANSCRIPT']),
    createPhase('APPLICATION_SUBMISSION', 'Application Submission', 'assignment', '#9c27b0', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('OFFER_RECEIVED', 'Offer Received', 'check', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE']),
    createPhase('INITIAL_PAYMENT', 'Initial Payment', 'payment', '#795548', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT']),
    createPhase('VISA_APPLICATION_MALTA', 'Visa Application (National Visa – Type D)', 'flight', '#ffc107', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('VISA_DECISION', 'Visa Decision', 'verified', '#4caf50', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ARRIVAL_MALTA', 'Arrival in Malta', 'flight', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('RESIDENCE_PERMIT_APPLICATION_MALTA', 'Residence Permit Application', 'person', '#607d8b', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']),
    createPhase('ENROLLMENT', 'Enrollment', 'school', '#03a9f4', ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'])
  ]
};

// Helper function to normalize country names
const normalizeCountryName = (country) => {
  if (!country) return null;
  const normalized = country.trim();

  // Map variations to standard names
  const countryMap = {
    'UK': 'United Kingdom',
    'U.K.': 'United Kingdom',
    'U.K': 'United Kingdom',
    'UNITED KINGDOM': 'United Kingdom',
    'USA': 'United States',
    'U.S.A.': 'United States',
    'U.S.': 'United States',
    'US': 'United States',
    'UNITED STATES': 'United States',
    'UNITED STATES OF AMERICA': 'United States'
  };

  const upperNormalized = normalized.toUpperCase();
  return countryMap[upperNormalized] || normalized;
};

// Helper function to clean country name (remove brackets, quotes, extra spaces)
const cleanCountryName = (country) => {
  if (!country) return '';
  return country
    .replace(/[\[\]"]/g, '') // Remove brackets and quotes
    .trim();
};

// Helper function to get phases for a country
const getPhasesForCountry = (country) => {
  if (!country) {
    console.log('[getPhasesForCountry] No country provided, defaulting to UK');
    return PROCESS_STEPS['United Kingdom']; // Default to UK if no country
  }

  // First clean the country name (remove brackets, quotes, etc.)
  const cleanedCountry = cleanCountryName(country);
  const normalizedCountry = normalizeCountryName(cleanedCountry);

  console.log(`[getPhasesForCountry] Input: "${country}" -> Cleaned: "${cleanedCountry}" -> Normalized: "${normalizedCountry}"`);

  // Try exact match first (with cleaned and normalized)
  if (PROCESS_STEPS[cleanedCountry]) {
    console.log(`[getPhasesForCountry] Found exact match: "${cleanedCountry}"`);
    return PROCESS_STEPS[cleanedCountry];
  }

  if (PROCESS_STEPS[normalizedCountry]) {
    console.log(`[getPhasesForCountry] Found normalized match: "${normalizedCountry}"`);
    return PROCESS_STEPS[normalizedCountry];
  }

  // Try case-insensitive match
  const countryKeys = Object.keys(PROCESS_STEPS);
  const matchedKey = countryKeys.find(key => {
    const keyCleaned = cleanCountryName(key);
    const keyNormalized = normalizeCountryName(keyCleaned);

    // Add null safety checks before calling toLowerCase()
    if (!cleanedCountry || !normalizedCountry) return false;

    return keyCleaned.toLowerCase() === cleanedCountry.toLowerCase() ||
      (keyNormalized && keyNormalized.toLowerCase() === normalizedCountry.toLowerCase()) ||
      key.toLowerCase() === cleanedCountry.toLowerCase() ||
      key.toLowerCase() === normalizedCountry.toLowerCase();
  });

  if (matchedKey) {
    console.log(`[getPhasesForCountry] Found case-insensitive match: "${matchedKey}"`);
    return PROCESS_STEPS[matchedKey];
  }

  // Default to UK if country not found
  console.warn(`[getPhasesForCountry] Country "${country}" (cleaned: "${cleanedCountry}", normalized: "${normalizedCountry}") not found in PROCESS_STEPS. Defaulting to United Kingdom. Available countries:`, countryKeys);
  return PROCESS_STEPS['United Kingdom'];
};

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
  onVisaDecisionRetry,
  onCountryChange,
  onRefresh, // Callback to refresh student data after reopen
  hideCountrySelector = false
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phaseMetadata, setPhaseMetadata] = useState({});
  const [loadingPhaseMetadata, setLoadingPhaseMetadata] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('info'); // 'info', 'confirm', 'error', 'success'
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogOnConfirm, setDialogOnConfirm] = useState(null);
  const [reopeningPhase, setReopeningPhase] = useState(null);

  // Initialize and sync selectedCountry when prop or countryProfiles change
  useEffect(() => {
    // Priority: propSelectedCountry > first country profile
    let countryToSet = propSelectedCountry ? cleanCountryName(propSelectedCountry) : null;

    // If no prop and we have country profiles, use the first one
    // But only if we don't already have a selectedCountry set (to avoid overwriting user selection)
    if (!countryToSet && countryProfiles.length > 0 && !selectedCountry) {
      countryToSet = cleanCountryName(countryProfiles[0].country);
    }

    // Update if we have a country to set and it's different from current
    if (countryToSet && countryToSet !== selectedCountry) {
      console.log(`[useEffect] Setting selectedCountry to: "${countryToSet}"`);
      setSelectedCountry(countryToSet);
    }
  }, [propSelectedCountry, countryProfiles]); // Don't include selectedCountry to avoid circular dependency

  // Fetch phase metadata when student, country, or countryProfiles change
  useEffect(() => {
    const fetchPhaseMetadata = async () => {
      if (!student?.id || !selectedCountry) {
        setPhaseMetadata({});
        return;
      }

      setLoadingPhaseMetadata(true);
      try {
        const response = await axiosInstance.get(
          `/counselor/students/${student.id}/phase-metadata`,
          { params: { country: selectedCountry } }
        );

        if (response.data && response.data.phaseMetadata) {
          // Convert array to object keyed by phaseName
          const metadataObj = {};
          if (Array.isArray(response.data.phaseMetadata)) {
            response.data.phaseMetadata.forEach(pm => {
              metadataObj[pm.phaseName] = pm;
            });
          }
          setPhaseMetadata(metadataObj);
          console.log('[PhaseMetadata] Loaded metadata:', metadataObj);
        } else {
          setPhaseMetadata({});
        }
      } catch (error) {
        // Handle errors gracefully - allow button to show even without metadata
        if (error.response?.status === 404 || error.response?.status === 500) {
          console.warn('[PhaseMetadata] Phase metadata not available (table may not exist yet)');
        } else {
          console.warn('[PhaseMetadata] Error fetching phase metadata:', error.message);
        }
        setPhaseMetadata({});
      } finally {
        setLoadingPhaseMetadata(false);
      }
    };

    fetchPhaseMetadata();
  }, [student?.id, selectedCountry]);

  // Check if student was created by telecaller/marketing/b2b_marketing
  const isMarketingLead = !!student?.marketingOwnerId;

  // Helper to get current country - use prop if available, otherwise use state, or first country profile
  const getCurrentCountry = () => {
    return propSelectedCountry || selectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null);
  };

  // Get current country - computed on each render
  const currentCountry = getCurrentCountry();

  // Get current country profile - try to match by exact name or normalized name
  const currentCountryProfile = countryProfiles.find(p => {
    if (!p || !p.country) return false;
    const normalizedProfileCountry = normalizeCountryName(p.country);
    const normalizedSelectedCountry = normalizeCountryName(currentCountry);
    return p.country === currentCountry || normalizedProfileCountry === normalizedSelectedCountry;
  });

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

  // Calculate progress whenever dependencies change
  useEffect(() => {
    // Calculate progress function
    const calculateProgress = () => {
      // Get the current country - prioritize prop, then state, then first country profile
      // This must match the dropdown's value resolution logic exactly
      let countryForPhases = propSelectedCountry || selectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null);

      // Clean the country name to remove any brackets, quotes, or extra spaces
      if (countryForPhases) {
        countryForPhases = cleanCountryName(countryForPhases);
      }

      console.log(`[calculateProgress] Country resolution: propSelectedCountry="${propSelectedCountry}", selectedCountry="${selectedCountry}", countryProfiles[0]="${countryProfiles.length > 0 ? countryProfiles[0].country : 'N/A'}" -> Final (cleaned): "${countryForPhases}"`);

      // Get phases for the current country (or default to UK)
      const phases = getPhasesForCountry(countryForPhases);

      console.log(`[calculateProgress] Got ${phases.length} phases. First phase: "${phases[0]?.label}", Last phase: "${phases[phases.length - 1]?.label}"`);

      let currentPhaseIndex = phases.findIndex(phase => phase.key === effectiveCurrentPhase);

      // Check if Document Collection is actually complete (all documents uploaded)
      let documentCollectionComplete = false;
      if (effectiveCurrentPhase === 'DOCUMENT_COLLECTION' || currentPhaseIndex === 0) {
        // Use BASE_DOCUMENTS for Document Collection phase
        const requiredDocs = BASE_DOCUMENTS;
        const relevantDocs = isMarketingLead
          ? documents.filter(doc => doc.uploader?.role === 'counselor' && ['PENDING', 'APPROVED'].includes(doc.status))
          : documents.filter(doc => ['PENDING', 'APPROVED'].includes(doc.status));
        const uploadedDocTypes = relevantDocs.filter(doc => requiredDocs.includes(doc.type)).map(doc => doc.type);
        const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));
        documentCollectionComplete = missingDocs.length === 0;
      }

      const progress = phases.map((phase, index) => {
        // Check phase metadata for lock/reopen info (do NOT let stale metadata break phase order UI)
        const metadata = phaseMetadata[phase.key];
        const phaseStatus = metadata?.status;

        // Determine phase state primarily by the actual current phase order.
        // This prevents cases like "Visa Decision = Current" while "Pre-Departure = Completed".
        let isCompleted = false;
        let isCurrent = false;
        let isPending = false;

        if (currentPhaseIndex >= 0) {
          // Order is known: force states by index
          isCompleted = index < currentPhaseIndex;
          isCurrent = index === currentPhaseIndex;
          isPending = index > currentPhaseIndex;

          // If metadata says Locked, keep it locked (it should only happen on previous phases)
          if (phaseStatus === 'Locked') {
            // Locked phases are treated as completed but cannot be edited
            isCompleted = true;
            isCurrent = false;
            isPending = false;
          }
        } else {
          // Order unknown (current phase not found in list): fall back to metadata
          if (phaseStatus === 'Locked') {
            isCompleted = true;
          } else if (phaseStatus === 'Completed') {
            isCompleted = true;
          } else if (phaseStatus === 'Current') {
            isCurrent = true;
          } else {
            isPending = true;
          }
        }

        const isNextPhase = currentPhaseIndex >= 0 && index === currentPhaseIndex + 1; // Only check next immediate phase

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
        if ((phase.key === 'APPLICATION_SUBMISSION' || phase.key.startsWith('APPLICATION_SUBMISSION')) && isNextPhase && effectiveCurrentPhase === 'UNIVERSITY_SHORTLISTING') {
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
        let canUpload = false;

        // Get documents for this phase based on country and phase label
        const phaseDocInfo = getDocumentsForPhase(phase.key, phase.label, countryForPhases);
        const phaseSpecificDocs = phaseDocInfo.documents;
        const phaseCanUpload = phaseDocInfo.canUpload;

        // Debug logging for document calculation
        if (isCurrent) {
          console.log(`[calculateProgress] Phase: ${phase.key} (${phase.label})`, {
            country: countryForPhases,
            phaseSpecificDocs: phaseSpecificDocs,
            phaseCanUpload: phaseCanUpload,
            phaseRequiredDocs: phase.requiredDocs,
            isCurrent: isCurrent
          });
        }

        // Use phase-specific documents if available, otherwise fall back to phase.requiredDocs
        // This allows us to show country+phase documents when rules exist, but still show
        // phase.requiredDocs as read-only when no rules exist
        const effectiveRequiredDocs = phaseSpecificDocs.length > 0 ? phaseSpecificDocs : phase.requiredDocs;

        // Special handling for Document Collection phase
        if (phase.key === 'DOCUMENT_COLLECTION' && isCurrent) {
          requiredDocs = effectiveRequiredDocs;
          canUpload = phaseCanUpload; // Always true for Document Collection

          // For marketing leads, only count documents uploaded by counselor
          // For other leads, count all documents
          const relevantDocs = isMarketingLead
            ? documents.filter(doc => doc.uploader?.role === 'counselor' && ['PENDING', 'APPROVED'].includes(doc.status))
            : documents.filter(doc => ['PENDING', 'APPROVED'].includes(doc.status));

          // For Document Collection, include documents that match required types
          // Since documents don't have a country field, ALL documents for the student are checked
          // This means FINANCIAL_PROOF uploaded for one country will be recognized for all countries
          uploadedDocs = relevantDocs.filter(doc => {
            // Simple check: if this document type is in the required documents list, include it
            // This automatically handles shared documents like FINANCIAL_PROOF across all countries
            return requiredDocs.includes(doc.type);
          });

          // Check if all required document types are present
          // For shared documents, check if any uploaded shared document satisfies the requirement
          const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
          missingDocs = requiredDocs.filter(docType => {
            // If it's a shared document, check if any shared document of that type exists
            if (SHARED_DOCUMENTS.includes(docType)) {
              return !uploadedDocTypes.includes(docType);
            }
            // For non-shared documents, require exact match
            return !uploadedDocTypes.includes(docType);
          });

          // Document Collection is only complete when ALL required documents are uploaded
          isReady = missingDocs.length === 0;
          docCompletion = requiredDocs.length > 0 ?
            ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100 : 0;
        } else if (isCurrent || isNextPhase) {
          // For other phases, use phase-specific documents if available
          requiredDocs = effectiveRequiredDocs;
          // Allow upload if phase has country-specific documents OR generic requiredDocs
          // This ensures upload button shows for all phases with document requirements
          // For current phase, always allow upload if it has required documents
          canUpload = isCurrent
            ? (phaseCanUpload || (requiredDocs && requiredDocs.length > 0))
            : (phaseCanUpload || (requiredDocs && requiredDocs.length > 0));

          // Filter documents: include shared documents (like FINANCIAL_PROOF) for all countries
          // When a phase requires a shared document type, accept ANY uploaded document of that type
          // regardless of which country it was uploaded for
          // Since documents don't have a country field, we check ALL documents for the student
          uploadedDocs = documents.filter(doc => {
            const isValidStatus = ['PENDING', 'APPROVED'].includes(doc.status);
            if (!isValidStatus) return false;

            // Simple check: if this document type is in the required documents list, include it
            // This works for both shared and non-shared documents
            // For shared documents like FINANCIAL_PROOF, if it's required and uploaded (for any country),
            // it will be included here
            return requiredDocs.includes(doc.type);
          });

          // Check if all required document types are present
          // For shared documents, check if ANY uploaded document of that type exists (from any country)
          const uploadedDocTypes = uploadedDocs.map(doc => doc.type);
          missingDocs = requiredDocs.filter(docType => {
            // Check if we have this document type uploaded
            const isUploaded = uploadedDocTypes.includes(docType);

            // If it's a shared document and not found, check if any shared document of that type exists
            if (!isUploaded && SHARED_DOCUMENTS.includes(docType)) {
              // For shared documents, we already checked above, so if it's not in uploadedDocTypes,
              // it means it's missing
              return true; // Missing
            }

            return !isUploaded; // Missing if not uploaded
          });

          // Phase is ready if no documents are required OR all required document types are present
          isReady = requiredDocs.length === 0 || missingDocs.length === 0;

          // Calculate completion percentage based on required document types present
          docCompletion = requiredDocs.length > 0 ?
            ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100 : 100;
        } else {
          // For completed or pending phases, still use effectiveRequiredDocs for display
          requiredDocs = effectiveRequiredDocs;
          canUpload = false; // Don't allow upload for non-current phases
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

        // Ensure canUpload is true if phase is current and has required documents
        // This ensures upload button shows for all current phases with document requirements
        // Also check if phase has country-specific documents even if effectiveRequiredDocs is empty
        const hasCountrySpecificDocs = phaseSpecificDocs && phaseSpecificDocs.length > 0;
        const finalCanUpload = isCurrent && (effectiveRequiredDocs && effectiveRequiredDocs.length > 0 || hasCountrySpecificDocs)
          ? true
          : canUpload;

        // Extract payment info from notes
        let paymentInfo = null;
        try {
          const notes = getCountrySpecificNotes();
          if (notes?.payments && notes.payments[phase.key]) {
            paymentInfo = notes.payments[phase.key];
          }
        } catch (e) {
          // Ignore errors
        }

        return {
          ...phase,
          isCompleted,
          paymentInfo,
          isCurrent,
          isPending,
          isNextPhase: isNextPhase || canProceedToNext,
          canProceedToNext,
          isReady,
          docCompletion,
          phaseCompletion,
          uploadedDocs,
          missingDocs,
          requiredDocs: effectiveRequiredDocs, // Use effective documents (phase-specific or fallback)
          canUpload: finalCanUpload // Flag indicating if upload is enabled for this phase
        };
      });

      setProgressData(progress);
    };

    // Always calculate progress (will default to UK if no country selected)
    calculateProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, documents, applications, selectedCountry, currentCountryProfile, countryProfiles, propSelectedCountry, phaseMetadata]);

  const getOverallProgress = () => {
    const countryForPhases = propSelectedCountry || selectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null);
    const phases = getPhasesForCountry(countryForPhases);
    const completedPhases = progressData.filter(phase => phase.isCompleted).length;
    const currentPhaseProgress = progressData.find(phase => phase.isCurrent)?.phaseCompletion || 0;
    return ((completedPhases + (currentPhaseProgress / 100)) / phases.length) * 100;
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

  // Helper function to show dialog
  const showDialog = (type, title, message, onConfirm = null) => {
    setDialogType(type);
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOnConfirm(() => onConfirm);
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogOnConfirm(null);
    setReopeningPhase(null);
  };

  // Handle dialog confirm
  const handleDialogConfirm = () => {
    if (dialogOnConfirm) {
      dialogOnConfirm();
    }
    handleDialogClose();
  };

  const handleReopenPhase = async (phase) => {
    if (!student?.id || !selectedCountry) {
      showDialog('info', 'Country Required', 'Please select a country first to reopen a phase.');
      return;
    }

    const metadata = phaseMetadata[phase.key];
    if (metadata?.status === 'Locked') {
      showDialog('error', 'Phase Locked', 'This phase is permanently locked. Maximum updates reached.');
      return;
    }

    // Show confirmation dialog
    setReopeningPhase(phase);
    showDialog(
      'confirm',
      'Reopen Phase',
      `Are you sure you want to reopen "${phase.label}"? This will allow editing this phase again.`,
      async () => {
        await performReopenPhase(phase);
      }
    );
  };

  const performReopenPhase = async (phase) => {
    try {
      const response = await axiosInstance.post(`/counselor/students/${student.id}/phase/reopen`, {
        phaseName: phase.key,
        country: selectedCountry
      });

      // Refresh phase metadata
      try {
        const metadataResponse = await axiosInstance.get(
          `/counselor/students/${student.id}/phase-metadata`,
          { params: { country: selectedCountry } }
        );
        if (metadataResponse.data && metadataResponse.data.phaseMetadata) {
          const metadataObj = {};
          metadataResponse.data.phaseMetadata.forEach(pm => {
            metadataObj[pm.phaseName] = pm;
          });
          setPhaseMetadata(metadataObj);
        }
      } catch (metadataError) {
        console.warn('[PhaseMetadata] Error refreshing metadata:', metadataError);
        // Don't fail the reopen if metadata refresh fails
      }

      // Update phase metadata if available
      if (response.data?.phaseMetadata) {
        const metadataObj = {};
        // Handle both single metadata object and array
        if (Array.isArray(response.data.phaseMetadata)) {
          response.data.phaseMetadata.forEach(pm => {
            metadataObj[pm.phaseName] = pm;
          });
        } else {
          metadataObj[response.data.phaseMetadata.phaseName] = response.data.phaseMetadata;
        }
        setPhaseMetadata(metadataObj);
      }

      // Close the reopen confirmation dialog
      handleDialogClose();

      // Refresh student data if callback is provided
      if (onRefresh) {
        onRefresh();
      }

      // After successful reopen, open the phase popup/dialog for editing
      // The backend has already updated the phase to "Current", so we can now open the dialog
      // Wait a bit to ensure the backend has updated and frontend state is refreshed
      setTimeout(() => {
        if (onPhaseClick) {
          // Call onPhaseClick to open the phase dialog
          // This will allow the user to make changes in the phase popup
          // The phase should now be "Current" so it can be clicked
          onPhaseClick(phase);
        } else {
          // If no onPhaseClick handler, reload the page to get fresh data
          window.location.reload();
        }
      }, 500); // Increased delay to ensure backend has updated
    } catch (error) {
      console.error('Error reopening phase:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while reopening the phase. Please try again.';
      showDialog('error', 'Failed to Reopen Phase', errorMessage);
    }
  };

  return (
    <>
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
                {countryProfiles.length > 0 && (() => {
                  const currentCountry = selectedCountry || propSelectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null);
                  if (currentCountry) {
                    return (
                      <Chip
                        label={currentCountry}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    );
                  }
                  return null;
                })()}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {countryProfiles.length > 1 && !hideCountrySelector && (() => {
                  // Helper function to clean country names by removing brackets, quotes, and extra characters
                  const cleanCountryName = (country) => {
                    if (!country) return '';
                    // Remove brackets, quotes, and extra whitespace
                    return country
                      .replace(/[\[\]"]/g, '') // Remove brackets and quotes
                      .trim();
                  };

                  // Helper function to normalize country names for deduplication
                  const normalizeCountryForDedup = (country) => {
                    if (!country) return '';
                    const cleaned = cleanCountryName(country);
                    const normalized = cleaned.toUpperCase();
                    if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') {
                      return 'UNITED KINGDOM';
                    }
                    if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') {
                      return 'UNITED STATES';
                    }
                    return normalized.replace(/\s+/g, ' ').trim();
                  };

                  // Get unique countries by normalizing and deduplicating
                  const seenNormalized = new Set();
                  const uniqueCountryProfiles = countryProfiles.filter((profile) => {
                    const normalized = normalizeCountryForDedup(profile.country);
                    if (seenNormalized.has(normalized)) {
                      return false;
                    }
                    seenNormalized.add(normalized);
                    return true;
                  });

                  return (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Select Country</InputLabel>
                      <Select
                        value={cleanCountryName(selectedCountry || propSelectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : '') || '')}
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
                        {uniqueCountryProfiles.map((profile) => {
                          const cleanedCountry = cleanCountryName(profile.country);
                          return (
                            <MenuItem key={profile.id || cleanedCountry} value={cleanedCountry}>
                              {cleanedCountry}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  );
                })()}
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
                      opacity: (() => {
                        const metadata = phaseMetadata[phase.key];
                        if (metadata?.status === 'Locked') return 0.5;
                        return (phase.isNextPhase || phase.canProceedToNext) ? 1 : 0.7;
                      })(),
                      position: 'relative',
                      '&:hover': {
                        transform: (phase.isNextPhase || phase.canProceedToNext) ? 'translateY(-2px)' : 'none',
                        boxShadow: (phase.isNextPhase || phase.canProceedToNext) ? theme.shadows[4] : 'none',
                        borderColor: (phase.isNextPhase || phase.canProceedToNext) ? phase.color : theme.palette.divider
                      }
                    }}
                    onClick={() => {
                      const metadata = phaseMetadata[phase.key];
                      if (metadata?.status === 'Locked') return;
                      if (phase.isNextPhase || phase.canProceedToNext) {
                        handlePhaseClick(phase);
                      }
                    }}
                  >
                    {/* Locked overlay */}
                    {(() => {
                      const metadata = phaseMetadata[phase.key];
                      if (metadata?.status === 'Locked') {
                        return (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                              borderRadius: 1
                            }}
                          >
                            <Box sx={{ textAlign: 'center', color: 'white' }}>
                              <LockIcon sx={{ fontSize: 32, mb: 1 }} />
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                                Locked
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                Maximum updates reached
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }
                      return null;
                    })()}
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

                      {phase.paymentInfo && (
                        <Box sx={{ mb: 1.5, p: 1, bgcolor: `${phase.color}15`, borderRadius: 1, border: `1px dashed ${phase.color}40` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <AccountBalanceIcon sx={{ fontSize: 14, color: phase.color }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: phase.color }}>
                              Payment Details
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Amount:</Typography>
                            <Typography variant="caption" fontWeight="bold">{phase.paymentInfo.amount}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Type:</Typography>
                            <Chip
                              label={phase.paymentInfo.type}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                bgcolor: phase.color,
                                color: 'white',
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        </Box>
                      )}

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
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          {(() => {
                            const metadata = phaseMetadata[phase.key];
                            if (metadata?.status === 'Locked') {
                              return (
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: 14 }} />}
                                  label="Locked"
                                  size="small"
                                  color="error"
                                  variant="filled"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              );
                            }
                            return (
                              <Chip
                                label={phase.isCompleted ? 'Completed' : phase.isCurrent ? 'Current' : 'Pending'}
                                size="small"
                                color={getStatusColor(phase)}
                                variant={phase.isCurrent ? 'filled' : 'outlined'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            );
                          })()}
                          {(() => {
                            const metadata = phaseMetadata[phase.key];
                            if (metadata && metadata.editsLeft !== undefined && metadata.editsLeft > 0) {
                              return (
                                <Chip
                                  label={`Edits: ${metadata.editsLeft}`}
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem', backgroundColor: theme.palette.info.light, color: theme.palette.info.dark }}
                                />
                              );
                            }
                            return null;
                          })()}
                        </Box>
                      </Box>

                      {/* Reopen button for completed phases */}
                      {(() => {
                        const metadata = phaseMetadata[phase.key];

                        // Debug logging
                        if (phase.isCompleted) {
                          console.log(`[EditButton] Phase ${phase.key}:`, {
                            isCompleted: phase.isCompleted,
                            selectedCountry: selectedCountry,
                            metadata: metadata,
                            status: metadata?.status,
                            reopenCount: metadata?.reopenCount,
                            maxReopen: metadata?.maxReopenAllowed ?? 2
                          });
                        }

                        // Show button if:
                        // 1. Phase is completed
                        // 2. Country is selected
                        // 3. Phase is not locked (either no metadata or status !== 'Locked')
                        // 4. Can reopen (either no metadata or reopenCount < maxReopenAllowed + 1)

                        if (!phase.isCompleted) {
                          return null;
                        }

                        if (!selectedCountry) {
                          return (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic' }}>
                                Select a country to edit
                              </Typography>
                            </Box>
                          );
                        }

                        // If no metadata exists, treat as first time (allow reopen)
                        const isLocked = metadata?.status === 'Locked';
                        const maxReopen = metadata?.maxReopenAllowed ?? 2;
                        const reopenCount = metadata?.reopenCount ?? 0;
                        const canReopen = !isLocked && reopenCount < maxReopen + 1;

                        // Hide edit button for marketing and b2b_marketing users
                        const userRole = user?.role?.toLowerCase?.() || user?.role || '';
                        const shouldHideEditButton = userRole === 'marketing' || userRole === 'b2b_marketing';

                        if (!canReopen) {
                          if (isLocked) {
                            return (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  icon={<LockIcon sx={{ fontSize: 14 }} />}
                                  label="Permanently Locked"
                                  size="small"
                                  color="error"
                                  sx={{ fontSize: '0.65rem', height: 24 }}
                                />
                              </Box>
                            );
                          }
                          return null;
                        }

                        // Don't show edit button for marketing and b2b_marketing users
                        if (shouldHideEditButton) {
                          return null;
                        }

                        return (
                          <Box sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReopenPhase(phase);
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                py: 0.75,
                                px: 1.5,
                                borderColor: phase.color,
                                color: phase.color,
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                  borderColor: phase.color,
                                  backgroundColor: `${phase.color}15`,
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 2px 8px ${phase.color}30`
                                }
                              }}
                            >
                              Edit Again {metadata && `(${maxReopen + 1 - reopenCount} left)`}
                            </Button>
                          </Box>
                        );
                      })()}

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
                      {(phase.key === 'APPLICATION_SUBMISSION' || phase.key.startsWith('APPLICATION_SUBMISSION')) && (phase.isCurrent || phase.isCompleted) && (() => {
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
                      {(phase.key === 'INTERVIEW' || phase.key.startsWith('INTERVIEW')) && (() => {
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
                      {(phase.key === 'VISA_APPLICATION' || phase.key.startsWith('VISA_APPLICATION')) && (() => {
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

                      {/* Visa Decision Status Display - Show for Visa Decision phase (current or completed) */}
                      {(phase.key === 'VISA_DECISION' || phase.key?.includes('VISA_DECISION')) && (phase.isCurrent || phase.isCompleted) && (() => {
                        try {
                          const notes = getCountrySpecificNotes();
                          const visaDecisionStatus = notes?.visaDecisionStatus;

                          // Fallback to student notes if not in country profile
                          let decisionStatus = null;
                          if (visaDecisionStatus?.status) {
                            decisionStatus = visaDecisionStatus.status;
                          } else if (student?.notes) {
                            try {
                              const studentNotes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                              if (studentNotes?.visaDecisionStatus?.status) {
                                decisionStatus = studentNotes.visaDecisionStatus.status;
                              }
                            } catch (e) {
                              console.warn('Error parsing student notes for visa decision:', e);
                            }
                          }

                          if (decisionStatus && (decisionStatus === 'APPROVED' || decisionStatus === 'REJECTED')) {
                            const isApproved = decisionStatus === 'APPROVED';
                            return (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                  Visa Decision Status:
                                </Typography>
                                <Chip
                                  label={isApproved ? 'Approved' : 'Rejected'}
                                  size="small"
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    backgroundColor: isApproved
                                      ? '#4caf5020'
                                      : '#f4433620',
                                    color: isApproved
                                      ? '#4caf50'
                                      : '#f44336',
                                    border: `1px solid ${isApproved ? '#4caf5040' : '#f4433640'}`,
                                    fontWeight: 600,
                                    mb: !isApproved && onVisaDecisionRetry ? 1 : 0
                                  }}
                                  icon={isApproved ? <CheckCircleIcon sx={{ fontSize: 14, color: '#4caf50' }} /> : <CancelIcon sx={{ fontSize: 14, color: '#f44336' }} />}
                                />
                                {/* Retry button for rejected visa decisions */}
                                {!isApproved && onVisaDecisionRetry && (
                                  <Box sx={{ mt: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onVisaDecisionRetry();
                                      }}
                                      sx={{
                                        fontSize: '0.7rem',
                                        py: 0.5,
                                        px: 1.5,
                                        borderColor: '#f44336',
                                        color: '#f44336',
                                        '&:hover': {
                                          borderColor: '#d32f2f',
                                          backgroundColor: '#f4433610'
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
                          console.error('Error displaying visa decision status:', e);
                          return null;
                        }
                        return null;
                      })()}

                      {/* Selected Countries Display - Show for Enrollment phase (current or completed) */}
                      {phase.key === 'ENROLLMENT' && (phase.isCurrent || phase.isCompleted) && (() => {
                        try {
                          // Get all countries that have reached Enrollment phase or are completed
                          // A country is considered "selected" if it has a country profile
                          const enrolledCountries = countryProfiles
                            .filter(profile => {
                              if (!profile || !profile.country) return false;
                              // Include countries that are at Enrollment phase or beyond
                              // Also include countries that are completed (status might indicate completion)
                              const currentPhase = profile.currentPhase || '';
                              return currentPhase === 'ENROLLMENT' ||
                                currentPhase.includes('ENROLLMENT') ||
                                profile.status === 'COMPLETED' ||
                                profile.status === 'ENROLLED';
                            })
                            .map(profile => profile.country)
                            .filter(Boolean);

                          // If no countries at Enrollment, show all countries with profiles (they're all potential enrollment countries)
                          const countriesToDisplay = enrolledCountries.length > 0
                            ? enrolledCountries
                            : countryProfiles.map(p => p.country).filter(Boolean);

                          if (countriesToDisplay.length > 0) {
                            return (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                  Selected Countries ({countriesToDisplay.length}):
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {countriesToDisplay.map((country, idx) => (
                                    <Chip
                                      key={country || idx}
                                      label={country}
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        backgroundColor: `${phase.color}20`,
                                        color: phase.color,
                                        border: `1px solid ${phase.color}40`,
                                        fontWeight: 500
                                      }}
                                      icon={<CheckCircleIcon sx={{ fontSize: 14, color: phase.color }} />}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            );
                          }
                        } catch (e) {
                          console.error('Error displaying selected countries for Enrollment:', e);
                          return null;
                        }
                        return null;
                      })()}

                      {/* Upload Documents Button - Show for phases with upload enabled (Document Collection or country+phase rules) */}
                      {/* Show upload button if:
                        1. Phase is current
                        2. Phase has required documents (either country-specific or generic)
                        3. onUploadDocuments handler is available
                        4. For Document Collection: always show (even without country)
                        5. For other phases: country must be selected (for country-specific document support)
                    */}
                      {(() => {
                        // Show upload button if:
                        // 1. Phase is current
                        // 2. Phase has required documents (either country-specific or generic)
                        // 3. onUploadDocuments handler is available
                        // 4. For Document Collection: always show (even without country)
                        // 5. For other phases: country must be selected (for country-specific document support)
                        const hasRequiredDocs = phase.requiredDocs && phase.requiredDocs.length > 0;
                        const missingCount = Array.isArray(phase.missingDocs) ? phase.missingDocs.length : 0;

                        // Enrollment: hide the upload button once all required docs are uploaded
                        const enrollmentAllowsUpload = phase.key !== 'ENROLLMENT' || missingCount > 0;

                        const shouldShow = phase.isCurrent &&
                          hasRequiredDocs &&
                          onUploadDocuments &&
                          (phase.key === 'DOCUMENT_COLLECTION' || selectedCountry) &&
                          enrollmentAllowsUpload;

                        // Debug logging for upload button visibility
                        if (phase.isCurrent) {
                          console.log(`[UploadButton] Phase: ${phase.key} (${phase.label})`, {
                            isCurrent: phase.isCurrent,
                            requiredDocs: phase.requiredDocs,
                            requiredDocsLength: phase.requiredDocs?.length || 0,
                            hasRequiredDocs: hasRequiredDocs,
                            selectedCountry: selectedCountry,
                            canUpload: phase.canUpload,
                            hasOnUploadDocuments: !!onUploadDocuments,
                            isDocumentCollection: phase.key === 'DOCUMENT_COLLECTION',
                            shouldShow: shouldShow
                          });
                        }

                        return shouldShow;
                      })() && (
                          <Box sx={{ mt: 1.5 }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<CloudUploadIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Get current country for document filtering
                                const currentCountry = propSelectedCountry || selectedCountry || (countryProfiles.length > 0 ? countryProfiles[0].country : null);
                                onUploadDocuments({
                                  phaseKey: phase.key,
                                  phaseLabel: phase.label,
                                  country: currentCountry,
                                  requiredDocs: phase.requiredDocs,
                                  missingDocs: phase.missingDocs || []
                                });
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
                              {phase.missingDocs && phase.missingDocs.length > 0
                                ? `Upload Documents (${phase.missingDocs.length} missing)`
                                : 'Upload Documents'
                              }
                            </Button>
                          </Box>
                        )}
                    </CardContent>
                  </Card>

                  {/* Enrollment University Display - Show saved Enrollment university (outside card) */}
                  {/* Show even if Enrollment is Pending (e.g., user reopened a previous phase) */}
                  {phase.key === 'ENROLLMENT' && (() => {
                    try {
                      const notes = getCountrySpecificNotes();
                      const enrollmentUni = notes?.enrollmentUniversity;
                      const paymentUni = notes?.initialPaymentUniversity;

                      // Prefer enrollmentUniversity; fallback to initialPaymentUniversity for backward compatibility
                      const university = enrollmentUni?.university || paymentUni?.university;

                      if (university) {
                        return (
                          <Box sx={{ mt: 2, p: 1.5, backgroundColor: `${phase.color}08`, borderRadius: 1, border: `1px solid ${phase.color}30` }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.8, display: 'block', fontSize: '0.7rem', fontWeight: 700 }}>
                              {phase.isCurrent || phase.isCompleted ? 'Enrollment University' : 'Saved Enrollment University'}
                            </Typography>
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

      {/* Dialog for messages and confirmations */}
      {dialogOpen && (
        <Dialog
          open={dialogOpen}
          onClose={handleDialogClose}
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            id="dialog-title"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: dialogType === 'error' ? 'error.main' :
                dialogType === 'success' ? 'success.main' :
                  dialogType === 'confirm' ? 'warning.main' : 'primary.main'
            }}
          >
            {dialogType === 'error' && <WarningIcon color="error" />}
            {dialogType === 'success' && <CheckCircleIcon color="success" />}
            {dialogType === 'confirm' && <WarningIcon color="warning" />}
            {dialogType === 'info' && <CheckCircleIcon color="primary" />}
            {dialogTitle || 'Notification'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText
              id="dialog-description"
              sx={{ fontSize: '0.95rem', whiteSpace: 'pre-line' }}
            >
              {dialogMessage || ''}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            {dialogType === 'confirm' ? (
              <>
                <Button onClick={handleDialogClose} color="inherit" variant="outlined">
                  Cancel
                </Button>
                <Button
                  onClick={handleDialogConfirm}
                  color="primary"
                  variant="contained"
                  autoFocus
                >
                  Confirm
                </Button>
              </>
            ) : (
              <Button
                onClick={handleDialogClose}
                color="primary"
                variant="contained"
                autoFocus
              >
                {dialogType === 'success' ? 'Great!' : 'OK'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default StudentProgressBar; 