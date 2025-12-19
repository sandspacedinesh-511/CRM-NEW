import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Snackbar,
  useTheme,
  Fade,
  Grow,
  LinearProgress,
  Badge,
  Skeleton,
  Breadcrumbs,
  Link,
  Rating,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  OutlinedInput
} from '@mui/material';
import {
  getFileValidationError,
  FILE_SIZE_LIMITS
} from '../../utils/fileValidation';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Description as DocumentIcon,
  School as SchoolIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Note as NoteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  PriorityHigh as PriorityHighIcon,
  LowPriority as LowPriorityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Dashboard as DashboardIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Close as CloseIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Flight as FlightIcon,
  Alarm as AlarmIcon,
  Verified as VerifiedIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import useWebSocket from '../../hooks/useWebSocket';
import ApplicationForm from '../../components/counselor/ApplicationForm';
import TaskManager from '../../components/counselor/TaskManager';
// AcademicRecords import removed
import StudentProgressBar, { getDocumentsForPhase, BASE_DOCUMENTS } from '../../components/counselor/StudentProgressBar';
import PhaseChangeErrorDialog from '../../components/common/PhaseChangeErrorDialog';
import StudentChat from '../../components/counselor/StudentChat';
import ReminderModal from '../../components/counselor/ReminderModal';
import ReminderList from '../../components/counselor/ReminderList';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PHASES = [
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

const DOCUMENT_TYPES = [
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
  'OFFER_LETTER',
  'OTHER'
];

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';
  try {
    const formatStr = includeTime ? 'MMM d, yyyy \u2014 hh:mm a' : 'MMM d, yyyy';
    return format(new Date(dateString), formatStr);
  } catch (error) {
    console.error('Invalid date:', dateString);
    return '';
  }
};

// Phase requirements for documents
// Required documents for Document Collection: PASSPORT, ACADEMIC_TRANSCRIPT, RECOMMENDATION_LETTER, STATEMENT_OF_PURPOSE, CV_RESUME
const PHASE_REQUIREMENTS = {
  'DOCUMENT_COLLECTION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'],
  'UNIVERSITY_SHORTLISTING': ['PASSPORT', 'ACADEMIC_TRANSCRIPT'],
  'APPLICATION_SUBMISSION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
  'OFFER_RECEIVED': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE'],
  'INITIAL_PAYMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
  'INTERVIEW': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT'],
  'FINANCIAL_TB_TEST': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
  'CAS_VISA': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
  'VISA_APPLICATION': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE'],
  // Enrollment phase: universal docs required for ALL countries
  'ENROLLMENT': ['ID_CARD', 'ENROLLMENT_LETTER']
};

// Format student name with marketing owner name (telecaller, marketing, or b2b_marketing) if available
const formatStudentName = (student) => {
  if (!student) return '';

  const firstName = student.firstName || '';
  const lastName = student.lastName || '';

  // If student has a marketingOwner and lastName indicates it's from a lead source
  if (student.marketingOwner && student.marketingOwner.name) {
    // Handle telecaller leads (lastName = "From Telecaller")
    if (lastName === 'From Telecaller') {
      return `${firstName} from ${student.marketingOwner.name}`;
    }

    // Handle marketing leads (lastName = "Lead" and role is "marketing")
    if (lastName === 'Lead' && student.marketingOwner.role === 'marketing') {
      return `${firstName} from ${student.marketingOwner.name}`;
    }

    // Handle B2B marketing leads (lastName = "Lead" and role is "b2b_marketing")
    if (lastName === 'Lead' && student.marketingOwner.role === 'b2b_marketing') {
      return `${firstName} from ${student.marketingOwner.name}`;
    }
  }

  // Otherwise, return the normal name
  return `${firstName} ${lastName}`.trim();
};

// Payment-related phases validation list
const PAYMENT_PHASES = [
  'INITIAL_PAYMENT',
  'DEPOSIT_I20',
  'SEVIS_FEE',
  'GIC_OPTIONAL',
  'OSHC_TUITION_DEPOSIT',
  'INITIAL_TUITION_PAYMENT',
  'TUITION_FEE_PAYMENT',
  'ACCEPT_OFFER_PAY_DEPOSIT',
  'BLOCKED_ACCOUNT_HEALTH'
];

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { isConnected, onEvent, joinRoom } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [showDocuments, setShowDocuments] = useState(true); // New state for document visibility
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState(null);
  const [applicationMenuAnchor, setApplicationMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [hasMessages, setHasMessages] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [openReminderModal, setOpenReminderModal] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [uploadPhaseInfo, setUploadPhaseInfo] = useState(null); // Store phase and country info for filtering
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState(DOCUMENT_TYPES); // Default to all document types
  const [uploadData, setUploadData] = useState({
    type: '',
    description: '',
    file: null,
    expiryDate: '',
    issueDate: '',
    issuingAuthority: '',
    documentNumber: '',
    countryOfIssue: '',
    remarks: '',
    priority: 'MEDIUM'
  });
  const [openApplicationDialog, setOpenApplicationDialog] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [sectionLoading, setSectionLoading] = useState({
    universities: false,
    applications: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Enhanced state variables
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'detailed', 'compact'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [studentStats, setStudentStats] = useState({
    totalDocuments: 0,
    pendingDocuments: 0,
    completedApplications: 0,
    pendingApplications: 0,
    averageRating: 0,
    progressPercentage: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    responseTime: 0,
    completionRate: 0,
    satisfactionScore: 0
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Phase change confirmation dialog state
  const [phaseConfirmDialog, setPhaseConfirmDialog] = useState({
    open: false,
    phase: null,
    studentName: '',
    remarks: '',
    selectedUniversities: [],
    selectedUniversity: null, // For single university selection (Initial Payment)
    interviewStatus: null, // For Interview phase decision
    casVisaStatus: null, // For CAS Process phase decision
    visaStatus: null, // For Visa Process phase decision
    visaDecisionStatus: null, // For Visa Decision phase decision (Approved/Rejected)
    financialOption: null, // For Financial & TB Test phase selection
    paymentAmount: '',
    paymentType: '' // 'INITIAL', 'HALF', 'COMPLETE'
  });

  // Phase change error dialog state
  const [phaseErrorDialog, setPhaseErrorDialog] = useState({
    open: false,
    errorData: null
  });

  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    to: ''
  });
  const [openFileSizeDialog, setOpenFileSizeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  // Country profile state
  const [countryProfiles, setCountryProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [openCountryProfileDialog, setOpenCountryProfileDialog] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [availableCountries] = useState([
    'United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand',
    'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway',
    'Ireland', 'Switzerland', 'Denmark', 'Finland', 'Poland', 'Portugal',
    'Singapore', 'Malaysia', 'Japan', 'South Korea', 'China', 'India'
  ]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Calculate missing documents based on current phase
  const missingDocuments = useMemo(() => {
    if (!student?.currentPhase || !documents) return [];

    const requiredDocs = PHASE_REQUIREMENTS[student.currentPhase] || [];
    if (requiredDocs.length === 0) return [];

    // Get uploaded documents that are approved or pending
    const uploadedDocTypes = documents
      .filter(doc => ['PENDING', 'APPROVED'].includes(doc.status))
      .map(doc => doc.type);

    // Find missing documents
    const missing = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));

    return missing;
  }, [student?.currentPhase, documents]);

  // Enhanced utility functions
  const calculateStudentStats = useCallback(() => {
    console.log('📊 Calculating student stats...');
    console.log('📄 Documents:', documents);
    console.log('📋 Applications:', applications);
    console.log('👤 Student phase:', student?.currentPhase);

    const totalDocs = documents.length;
    const pendingDocs = documents.filter(doc => doc.status === 'PENDING').length;
    const completedApps = applications.filter(app => app.applicationStatus === 'ACCEPTED').length;
    const pendingApps = applications.filter(app => app.applicationStatus === 'PENDING').length;

    // Calculate progress percentage based on current phase
    const phaseIndex = PHASES.indexOf(student?.currentPhase);
    const progressPercentage = phaseIndex >= 0 ? ((phaseIndex + 1) / PHASES.length) * 100 : 0;

    const stats = {
      totalDocuments: totalDocs,
      pendingDocuments: pendingDocs,
      completedApplications: completedApps,
      pendingApplications: pendingApps,
      averageRating: 4.2, // This could come from a rating system
      progressPercentage: Math.round(progressPercentage)
    };

    console.log('📊 Calculated stats:', stats);
    setStudentStats(stats);
  }, [documents, applications, student]);

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return <PriorityHighIcon />;
      case 'MEDIUM': return <WarningIcon />;
      case 'LOW': return <LowPriorityIcon />;
      case 'CRITICAL': return <PriorityHighIcon />;
      default: return <RadioButtonUncheckedIcon />;
    }
  };

  const getDocumentStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  // Academic record formatting functions
  const formatAcademicRecordData = (description) => {
    try {
      const data = JSON.parse(description);
      return {
        qualification: data.qualificationType?.replace(/_/g, ' ') || 'Unknown',
        institution: data.institutionName || 'Unknown Institution',
        major: data.majorSubject || 'N/A',
        duration: data.startDate && data.endDate ? `${data.startDate} - ${data.endDate}` : 'N/A',
        grade: data.grade ? `${data.grade} (${data.gradingSystem?.replace(/_/g, ' ')})` : 'N/A',
        remarks: data.remarks || 'No remarks'
      };
    } catch (e) {
      return null;
    }
  };

  const renderDocumentContent = (document) => {
    // For academic records, show formatted data
    if (document.type === 'ACADEMIC_TRANSCRIPT' && document.description) {
      const academicData = formatAcademicRecordData(document.description);
      if (academicData) {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
              Academic Details:
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 1,
              fontSize: '0.75rem'
            }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Qualification:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {academicData.qualification}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Institution:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {academicData.institution}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Major/Subject:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {academicData.major}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Duration:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {academicData.duration}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Grade:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                  {academicData.grade}
                </Typography>
              </Box>
            </Box>
            {academicData.remarks && academicData.remarks !== 'No remarks' && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">Remarks:</Typography>
                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                  {academicData.remarks}
                </Typography>
              </Box>
            )}
          </Box>
        );
      }
    }

    // For other documents, show description if available
    if (document.description && document.description.length < 200) {
      return (
        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
          {document.description}
        </Typography>
      );
    }

    return null;
  };

  // Helper function to safely parse notes that might be JSON or plain text
  const safeParseNotes = (notes) => {
    if (!notes) return null;
    if (typeof notes === 'object') return notes;
    if (typeof notes !== 'string') return null;

    const trimmed = notes.trim();
    // Only try to parse if it looks like JSON (starts with { or [)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(notes);
      } catch (e) {
        console.warn('Failed to parse notes as JSON:', e);
        return null;
      }
    }
    // Plain text, return null to indicate it's not structured data
    return null;
  };

  const getDocumentIcon = (fileName, documentType) => {
    // Special icon for academic records
    if (documentType === 'ACADEMIC_TRANSCRIPT') {
      return <SchoolIcon />;
    }

    if (!fileName || typeof fileName !== 'string') {
      return <DocumentIcon />;
    }
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <DocumentIcon />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <DocumentIcon />;
      default: return <DocumentIcon />;
    }
  };

  const handlePhaseClick = (phase) => {
    // Only allow clicking on the next immediate phase
    const phases = [
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

    // Use country-specific phase if country is selected, otherwise use global phase
    const activePhase = selectedCountry && countryProfiles.length > 0
      ? (countryProfiles.find(p => p.country === selectedCountry)?.currentPhase || student?.currentPhase)
      : student?.currentPhase;

    const currentPhaseIndex = phases.indexOf(activePhase);
    const clickedPhaseIndex = phases.indexOf(phase.key);

    // Check if current phase is actually complete (for Document Collection, check if all docs are uploaded)
    let effectiveCurrentPhaseIndex = currentPhaseIndex;
    if (activePhase === 'DOCUMENT_COLLECTION') {
      // Check if Document Collection is actually complete
      const requiredDocs = ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'RECOMMENDATION_LETTER', 'STATEMENT_OF_PURPOSE', 'CV_RESUME'];
      const isMarketingLead = !!student?.marketingOwnerId;
      const relevantDocs = isMarketingLead
        ? documents.filter(doc => doc.uploader?.role === 'counselor' && ['PENDING', 'APPROVED'].includes(doc.status))
        : documents.filter(doc => ['PENDING', 'APPROVED'].includes(doc.status));
      const uploadedDocTypes = relevantDocs.filter(doc => requiredDocs.includes(doc.type)).map(doc => doc.type);
      const missingDocs = requiredDocs.filter(docType => !uploadedDocTypes.includes(docType));

      // If all documents are uploaded, consider Document Collection as complete
      if (missingDocs.length === 0) {
        effectiveCurrentPhaseIndex = currentPhaseIndex + 1; // Can move to next phase
      }
    }

    // Allow clicking on:
    // 1. The next immediate phase (to progress forward) - this is the main use case
    // 2. Any phase that is marked as "next phase" or "can proceed" in the progress data
    // 3. The current phase (for editing after reopening)
    const isImmediateNextPhase = clickedPhaseIndex === effectiveCurrentPhaseIndex + 1;
    const isMarkedAsNextPhase = phase.isNextPhase || phase.canProceedToNext;
    const isCurrentPhase = clickedPhaseIndex === effectiveCurrentPhaseIndex || clickedPhaseIndex === currentPhaseIndex;

    // Allow progression if clicking on:
    // - The immediate next phase (forward movement)
    // - The phase is marked as next phase
    // - The current phase (for editing after reopening)
    const canProceedToPhase = isImmediateNextPhase || isMarkedAsNextPhase || isCurrentPhase;

    if (!canProceedToPhase) {
      const phaseName = activePhase?.replace(/_/g, ' ') || 'Unknown';
      const nextPhaseName = currentPhaseIndex >= 0 && currentPhaseIndex < phases.length - 1
        ? phases[currentPhaseIndex + 1]?.replace(/_/g, ' ')
        : 'next phase';
      showSnackbar(`You can only move to the next phase or edit the current phase. Current phase: ${phaseName}. Please click on ${nextPhaseName} to proceed.`, 'warning');
      return;
    }

    // Show a custom dialog to confirm phase change
    // Show dialog when:
    // 1. Moving to next phase (forward progression)
    // 2. Editing current phase (after reopening)
    if (isImmediateNextPhase || isMarkedAsNextPhase || isCurrentPhase) {
      // Pre-load selected universities for University Shortlisting phase
      let preloadedUniversities = [];
      let preloadedUniversity = null; // For single university selection (Initial Payment)

      // Pre-load selected university for Initial Payment phase
      if (phase.key === 'INITIAL_PAYMENT') {
        try {
          // Try to get from country profile first
          if (selectedCountry && countryProfiles.length > 0) {
            const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
            if (countryProfile?.notes) {
              const countryNotes = safeParseNotes(countryProfile.notes);
              const paymentUni = countryNotes?.initialPaymentUniversity;
              if (paymentUni?.university?.id) {
                preloadedUniversity = paymentUni.university.id;
              }
            }
          }

          // Fallback to student notes if not found in country profile
          if (!preloadedUniversity && student?.notes) {
            let notes = null;
            try {
              notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
            } catch (e) {
              console.warn('Failed to parse student notes:', e);
            }
            const paymentUni = notes?.initialPaymentUniversity;
            if (paymentUni?.university?.id) {
              preloadedUniversity = paymentUni.university.id;
            }
          }
        } catch (e) {
          console.error('Error loading pre-selected university for Initial Payment:', e);
        }
      }

      // Pre-load selected university for Enrollment phase
      if (phase.key === 'ENROLLMENT') {
        try {
          // Try to get from country profile first
          if (selectedCountry && countryProfiles.length > 0) {
            const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
            if (countryProfile?.notes) {
              const countryNotes = safeParseNotes(countryProfile.notes);
              const enrollmentUni = countryNotes?.enrollmentUniversity;
              if (enrollmentUni?.university?.id) {
                preloadedUniversity = enrollmentUni.university.id;
              }
            }
          }

          // Fallback to student notes if not found in country profile
          if (!preloadedUniversity && student?.notes) {
            let notes = null;
            try {
              notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
            } catch (e) {
              console.warn('Failed to parse student notes:', e);
            }
            const enrollmentUni = notes?.enrollmentUniversity;
            if (enrollmentUni?.university?.id) {
              preloadedUniversity = enrollmentUni.university.id;
            }
          }
        } catch (e) {
          console.error('Error loading pre-selected university for Enrollment:', e);
        }
      }

      // Pre-load selected universities for Application Submission phase
      if (phase.key === 'APPLICATION_SUBMISSION') {
        try {
          // Try to get from country profile first
          if (selectedCountry && countryProfiles.length > 0) {
            const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
            if (countryProfile?.notes) {
              let countryNotes = null;
              try {
                countryNotes = typeof countryProfile.notes === 'string'
                  ? JSON.parse(countryProfile.notes)
                  : countryProfile.notes;
              } catch (e) {
                console.warn('Failed to parse country profile notes:', e);
              }
              const applicationUniversities = countryNotes?.applicationSubmissionUniversities;
              if (applicationUniversities?.universities && Array.isArray(applicationUniversities.universities)) {
                preloadedUniversities = applicationUniversities.universities.map(u => u.id).filter(Boolean);
              }
            }
          }

          // Fallback to student notes if not found in country profile
          if (preloadedUniversities.length === 0 && student?.notes) {
            let notes = null;
            try {
              notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
            } catch (e) {
              console.warn('Failed to parse student notes:', e);
            }
            const applicationUniversities = notes?.applicationSubmissionUniversities;
            if (applicationUniversities?.universities && Array.isArray(applicationUniversities.universities)) {
              preloadedUniversities = applicationUniversities.universities.map(u => u.id).filter(Boolean);
            }
          }
        } catch (e) {
          console.error('Error loading pre-selected universities for Application Submission:', e);
        }
      }

      if (phase.key === 'UNIVERSITY_SHORTLISTING' && selectedCountry) {
        try {
          // Try to get from country profile first
          const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
          if (countryProfile?.notes) {
            const countryNotes = safeParseNotes(countryProfile.notes);
            const shortlist = countryNotes?.universityShortlist;
            if (shortlist?.universities && Array.isArray(shortlist.universities)) {
              // Filter by selected country and extract IDs
              const countryShortlist = shortlist.universities.filter(u => {
                if (!u.country) return false;
                // Normalize country names for comparison
                const normalize = (c) => {
                  if (!c) return '';
                  const n = c.trim().toUpperCase();
                  if (n === 'UK' || n === 'U.K.' || n === 'U.K' || n === 'UNITED KINGDOM') return 'UNITED KINGDOM';
                  if (n === 'USA' || n === 'U.S.A.' || n === 'US' || n === 'U.S.' || n === 'UNITED STATES' || n === 'UNITED STATES OF AMERICA') return 'UNITED STATES';
                  return n.replace(/\s+/g, ' ').trim();
                };
                return normalize(u.country) === normalize(selectedCountry);
              });
              preloadedUniversities = countryShortlist.map(u => u.id).filter(Boolean);
            }
          }

          // Fallback to student notes if not found in country profile
          if (preloadedUniversities.length === 0 && student?.notes) {
            let notes = null;
            try {
              notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
            } catch (e) {
              console.warn('Failed to parse student notes:', e);
            }
            const shortlist = notes?.universityShortlist;
            if (shortlist?.universities && Array.isArray(shortlist.universities)) {
              const countryShortlist = shortlist.universities.filter(u => {
                if (!u.country) return false;
                const normalize = (c) => {
                  if (!c) return '';
                  const n = c.trim().toUpperCase();
                  if (n === 'UK' || n === 'U.K.' || n === 'U.K' || n === 'UNITED KINGDOM') return 'UNITED KINGDOM';
                  if (n === 'USA' || n === 'U.S.A.' || n === 'US' || n === 'U.S.' || n === 'UNITED STATES' || n === 'UNITED STATES OF AMERICA') return 'UNITED STATES';
                  return n.replace(/\s+/g, ' ').trim();
                };
                return normalize(u.country) === normalize(selectedCountry);
              });
              preloadedUniversities = countryShortlist.map(u => u.id).filter(Boolean);
            }
          }
        } catch (e) {
          console.error('Error loading pre-selected universities:', e);
        }
      }

      // Pre-load visa decision status if reopening Visa Decision phase
      let preloadedVisaDecisionStatus = null;
      if ((phase.key === 'VISA_DECISION' || phase.key?.includes('VISA_DECISION')) && selectedCountry) {
        try {
          const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
          if (countryProfile?.notes) {
            const countryNotes = safeParseNotes(countryProfile.notes);
            const visaDecisionStatus = countryNotes?.visaDecisionStatus;
            if (visaDecisionStatus?.status) {
              preloadedVisaDecisionStatus = visaDecisionStatus.status;
            }
          }

          // Fallback to student notes
          if (!preloadedVisaDecisionStatus && student?.notes) {
            const notes = safeParseNotes(student.notes);
            const visaDecisionStatus = notes?.visaDecisionStatus;
            if (visaDecisionStatus?.status) {
              preloadedVisaDecisionStatus = visaDecisionStatus.status;
            }
          }
        } catch (e) {
          console.error('Error loading visa decision status:', e);
        }
      }

      // Pre-load payment details if phase is a payment phase
      let preloadedPaymentAmount = '';
      let preloadedPaymentType = '';

      if (PAYMENT_PHASES.includes(phase.key) || phase.key?.includes('PAYMENT') || phase.key?.includes('FEE') || phase.key?.includes('DEPOSIT')) {
        try {
          const loadPaymentDetails = (notesJson) => {
            const notes = typeof notesJson === 'string' ? safeParseNotes(notesJson) : notesJson;
            if (notes?.payments && notes.payments[phase.key]) {
              return notes.payments[phase.key];
            }
            return null;
          };

          let paymentData = null;
          // Check country profile first
          if (selectedCountry) {
            const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
            if (countryProfile?.notes) {
              paymentData = loadPaymentDetails(countryProfile.notes);
            }
          }

          // Fallback to student notes
          if (!paymentData && student?.notes) {
            paymentData = loadPaymentDetails(student.notes);
          }

          if (paymentData) {
            preloadedPaymentAmount = paymentData.amount || '';
            preloadedPaymentType = paymentData.type || '';
          }
        } catch (e) {
          console.error('Error loading payment details:', e);
        }
      }

      setPhaseConfirmDialog({
        open: true,
        phase: phase,
        studentName: formatStudentName(student),
        remarks: '',
        selectedUniversities: preloadedUniversities,
        selectedUniversity: preloadedUniversity || null,
        interviewStatus: null,
        casVisaStatus: null,
        visaStatus: null,
        visaDecisionStatus: preloadedVisaDecisionStatus,
        financialOption: null,
        paymentAmount: preloadedPaymentAmount,
        paymentType: preloadedPaymentType
      });
    }
  };

  const handlePhaseChange = async (newPhase, remarks = '', selectedUniversities = [], selectedUniversity = null, interviewStatus = null, casVisaStatus = null, visaStatus = null, financialOption = null, visaDecisionStatus = null, paymentAmount = null, paymentType = null) => {
    try {
      const response = await axiosInstance.patch(`/counselor/students/${id}/phase`, {
        currentPhase: newPhase,
        remarks: remarks,
        selectedUniversities: selectedUniversities,
        selectedUniversity: selectedUniversity,
        interviewStatus: interviewStatus,
        casVisaStatus: casVisaStatus,
        visaStatus: visaStatus,
        visaDecisionStatus: visaDecisionStatus,
        financialOption: financialOption,
        country: selectedCountry, // Include selected country for country-specific phase update
        paymentAmount: paymentAmount,
        paymentType: paymentType
      });

      // Optimistically update the state immediately using response data
      if (response.data) {
        const { student, countryProfile, country } = response.data;
        
        // Update student phase if it's a global phase update
        if (student && !country) {
          setStudent(prev => prev ? { ...prev, currentPhase: student.currentPhase, updatedAt: student.updatedAt } : prev);
        }
        
        // Update country profile phase if it's a country-specific update
        if (countryProfile && country) {
          setCountryProfiles(prev => prev.map(profile => 
            profile.country === country 
              ? { ...profile, currentPhase: countryProfile.currentPhase }
              : profile
          ));
        }
      }

      // Fetch updated data in parallel for complete refresh
      await Promise.all([
        fetchStudentDetails(),
        fetchCountryProfiles()
      ]);
      
      showSnackbar('Phase updated successfully', 'success');
    } catch (error) {
      console.error('Error updating phase:', error);
      if (error.response?.data?.message && error.response?.data?.missingDocuments) {
        // Show detailed error dialog for document requirement errors
        setPhaseErrorDialog({
          open: true,
          errorData: error.response.data
        });
      } else if (error.response?.data?.message) {
        showSnackbar(error.response.data.message, 'error');
      } else {
        showSnackbar('Failed to update phase', 'error');
      }
    }
  };

  const handlePhaseConfirm = () => {
    if (phaseConfirmDialog.phase) {
      // Validate University Shortlisting: require at least one university to be selected
      if (phaseConfirmDialog.phase.key === 'UNIVERSITY_SHORTLISTING') {
        if (!phaseConfirmDialog.selectedUniversities || phaseConfirmDialog.selectedUniversities.length === 0) {
          showSnackbar('Please select at least one university before proceeding', 'error');
          return;
        }

        // Validate that a country is selected
        if (!selectedCountry) {
          showSnackbar('Please select a country first', 'error');
          return;
        }
      }

      // Validate Application Submission: require at least one university to be selected and check shortlisted universities
      if (phaseConfirmDialog.phase.key === 'APPLICATION_SUBMISSION') {
        if (!phaseConfirmDialog.selectedUniversities || phaseConfirmDialog.selectedUniversities.length === 0) {
          showSnackbar('Please select at least one university for application submission', 'error');
          return;
        }

        // Check if universities are shortlisted for the selected country
        try {
          let hasShortlistedUniversities = false;
          let shortlist = null;

          if (selectedCountry && countryProfiles.length > 0) {
            const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
            if (countryProfile?.notes) {
              let countryNotes = null;
              try {
                countryNotes = typeof countryProfile.notes === 'string'
                  ? JSON.parse(countryProfile.notes)
                  : countryProfile.notes;
              } catch (e) {
                console.warn('Failed to parse country profile notes:', e);
              }
              shortlist = countryNotes?.universityShortlist;
            }
          }

          if (!shortlist && student?.notes) {
            let notes = null;
            try {
              notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
            } catch (e) {
              console.warn('Failed to parse student notes:', e);
            }
            shortlist = notes?.universityShortlist;
          }

          if (shortlist?.universities && Array.isArray(shortlist.universities) && shortlist.universities.length > 0) {
            if (selectedCountry) {
              // Check if any universities match the selected country
              const normalizeCountry = (country) => {
                if (!country) return '';
                const normalized = country.trim().toUpperCase();
                if (normalized === 'UK' || normalized === 'U.K.' || normalized === 'U.K' || normalized === 'UNITED KINGDOM') return 'UNITED KINGDOM';
                if (normalized === 'USA' || normalized === 'U.S.A.' || normalized === 'US' || normalized === 'U.S.' || normalized === 'UNITED STATES' || normalized === 'UNITED STATES OF AMERICA') return 'UNITED STATES';
                return normalized.replace(/\s+/g, ' ').trim();
              };
              const normalizedSelected = normalizeCountry(selectedCountry);
              const countryShortlist = shortlist.universities.filter(u => {
                if (!u || !u.country) return false;
                return normalizeCountry(u.country) === normalizedSelected;
              });
              hasShortlistedUniversities = countryShortlist.length > 0;
            } else {
              hasShortlistedUniversities = true;
            }
          }

          if (!hasShortlistedUniversities) {
            showSnackbar('Please shortlist universities in the University Shortlisting phase first', 'error');
            return;
          }
        } catch (e) {
          console.error('Error checking shortlisted universities:', e);
          showSnackbar('Error validating shortlisted universities', 'error');
          return;
        }
      }

      // Validate Visa Process: require status selection
      if (phaseConfirmDialog.phase.key === 'VISA_APPLICATION') {
        if (!phaseConfirmDialog.visaStatus) {
          showSnackbar('Please select a Visa Process decision (Approved or Refused) to proceed', 'error');
          return;
        }
      }

      // Validate Visa Decision: require status selection
      if (phaseConfirmDialog.phase.key === 'VISA_DECISION' || phaseConfirmDialog.phase.key?.includes('VISA_DECISION')) {
        if (!phaseConfirmDialog.visaDecisionStatus) {
          showSnackbar('Please select a Visa Decision (Approved or Rejected) to proceed', 'error');
          return;
        }
      }

      // Validate Enrollment: require a university selection
      if (phaseConfirmDialog.phase.key === 'ENROLLMENT') {
        if (!phaseConfirmDialog.selectedUniversity) {
          showSnackbar('Please select a university for Enrollment', 'error');
          return;
        }
      }

      // Validate Payment Phases: require amount and payment type
      const isPaymentPhase = PAYMENT_PHASES.includes(phaseConfirmDialog.phase.key) ||
        phaseConfirmDialog.phase.key?.includes('PAYMENT') ||
        phaseConfirmDialog.phase.key?.includes('FEE') ||
        (phaseConfirmDialog.phase.key?.includes('DEPOSIT') && phaseConfirmDialog.phase.key !== 'APPLICATION_SUBMISSION'); // Exclude if ambiguous

      if (isPaymentPhase) {
        if (!phaseConfirmDialog.paymentAmount) {
          showSnackbar('Please enter the payment amount', 'error');
          return;
        }
        if (!phaseConfirmDialog.paymentType) {
          showSnackbar('Please select payment type (Initial, Half, or Complete)', 'error');
          return;
        }
      }



      handlePhaseChange(
        phaseConfirmDialog.phase.key,
        phaseConfirmDialog.remarks,
        phaseConfirmDialog.selectedUniversities,
        phaseConfirmDialog.selectedUniversity,
        phaseConfirmDialog.interviewStatus,
        phaseConfirmDialog.casVisaStatus,
        phaseConfirmDialog.visaStatus,
        phaseConfirmDialog.financialOption,
        phaseConfirmDialog.visaDecisionStatus,
        phaseConfirmDialog.paymentAmount,
        phaseConfirmDialog.paymentType
      );
    }
    setPhaseConfirmDialog({ open: false, phase: null, studentName: '', remarks: '', selectedUniversities: [], selectedUniversity: null, interviewStatus: null, casVisaStatus: null, visaStatus: null, visaDecisionStatus: null, financialOption: null, paymentAmount: '', paymentType: '' });
  };

  const handlePhaseCancel = () => {
    setPhaseConfirmDialog({ open: false, phase: null, studentName: '', remarks: '', selectedUniversities: [], selectedUniversity: null, interviewStatus: null, casVisaStatus: null, visaStatus: null, visaDecisionStatus: null, financialOption: null, paymentAmount: '', paymentType: '' });
  };

  const handlePhaseErrorClose = () => {
    setPhaseErrorDialog({ open: false, errorData: null });
  };

  // Allow retrying the Interview phase decision without moving to a new phase
  const handleInterviewRetry = () => {
    // Pre-load current interview status
    let currentStatus = null;
    try {
      if (selectedCountry && countryProfiles.length > 0) {
        const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
        if (countryProfile?.notes) {
          let countryNotes = null;
          try {
            countryNotes = typeof countryProfile.notes === 'string'
              ? JSON.parse(countryProfile.notes)
              : countryProfile.notes;
          } catch (e) {
            console.warn('Failed to parse country profile notes:', e);
          }
          const interviewStatus = countryNotes?.interviewStatus;
          if (interviewStatus?.status) {
            currentStatus = interviewStatus.status;
          }
        }
      }

      // Fallback to student notes
      if (!currentStatus && student?.notes) {
        let notes = null;
        try {
          notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
        } catch (e) {
          console.warn('Failed to parse student notes:', e);
        }
        const interviewStatus = notes?.interviewStatus;
        if (interviewStatus?.status) {
          currentStatus = interviewStatus.status;
        }
      }
    } catch (e) {
      console.error('Error loading current interview status:', e);
    }

    const interviewPhase = { key: 'INTERVIEW', label: 'Interview' };
    setPhaseConfirmDialog({
      open: true,
      phase: interviewPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: currentStatus || 'REFUSED' // Default to REFUSED if retrying, but allow change
    });
  };

  // Mark interview as stopped without moving phases
  const handleInterviewStop = () => {
    handlePhaseChange('INTERVIEW', 'Interview marked as stopped', [], null, 'STOPPED');
  };

  // Allow retrying the CAS Process phase decision without moving to a new phase
  const handleCasVisaRetry = () => {
    // Pre-load current CAS Process status
    let currentStatus = null;
    try {
      if (selectedCountry && countryProfiles.length > 0) {
        const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
        if (countryProfile?.notes) {
          let countryNotes = null;
          try {
            countryNotes = typeof countryProfile.notes === 'string'
              ? JSON.parse(countryProfile.notes)
              : countryProfile.notes;
          } catch (e) {
            console.warn('Failed to parse country profile notes:', e);
          }
          const casVisaStatus = countryNotes?.casVisaStatus;
          if (casVisaStatus?.status) {
            currentStatus = casVisaStatus.status;
          }
        }
      }

      // Fallback to student notes
      if (!currentStatus && student?.notes) {
        let notes = null;
        try {
          notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
        } catch (e) {
          console.warn('Failed to parse student notes:', e);
        }
        const casVisaStatus = notes?.casVisaStatus;
        if (casVisaStatus?.status) {
          currentStatus = casVisaStatus.status;
        }
      }
    } catch (e) {
      console.error('Error loading current CAS Process status:', e);
    }

    const casVisaPhase = { key: 'CAS_VISA', label: 'CAS Process' };
    setPhaseConfirmDialog({
      open: true,
      phase: casVisaPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: null,
      casVisaStatus: currentStatus || 'REFUSED', // Default to REFUSED if retrying, but allow change
      financialOption: null,
      paymentAmount: '',
      paymentType: ''
    });
  };

  // Mark CAS Process as stopped without moving phases
  const handleCasVisaStop = () => {
    handlePhaseChange('CAS_VISA', 'CAS Process marked as stopped', [], null, null, 'STOPPED');
  };

  // Allow retrying the Visa Process phase decision without moving to a new phase
  const handleVisaRetry = () => {
    // Pre-load current visa status
    let currentStatus = null;
    try {
      if (selectedCountry && countryProfiles.length > 0) {
        const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
        if (countryProfile?.notes) {
          let countryNotes = null;
          try {
            countryNotes = typeof countryProfile.notes === 'string'
              ? JSON.parse(countryProfile.notes)
              : countryProfile.notes;
          } catch (e) {
            console.warn('Failed to parse country profile notes:', e);
          }
          const visaStatus = countryNotes?.visaStatus;
          if (visaStatus?.status) {
            currentStatus = visaStatus.status;
          }
        }
      }

      // Fallback to student notes
      if (!currentStatus && student?.notes) {
        let notes = null;
        try {
          notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
        } catch (e) {
          console.warn('Failed to parse student notes:', e);
        }
        const visaStatus = notes?.visaStatus;
        if (visaStatus?.status) {
          currentStatus = visaStatus.status;
        }
      }
    } catch (e) {
      console.error('Error loading current Visa Process status:', e);
    }

    const visaPhase = { key: 'VISA_APPLICATION', label: 'Visa Process' };
    setPhaseConfirmDialog({
      open: true,
      phase: visaPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: null,
      casVisaStatus: null,
      visaStatus: currentStatus || 'REFUSED', // Default to REFUSED if retrying, but allow change
      financialOption: null,
      paymentAmount: '',
      paymentType: ''
    });
  };

  // Allow retrying the Visa Decision phase decision without moving to a new phase
  const handleVisaDecisionRetry = () => {
    // Pre-load current visa decision status
    let currentStatus = null;
    try {
      if (selectedCountry && countryProfiles.length > 0) {
        const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
        if (countryProfile?.notes) {
          let countryNotes = null;
          try {
            countryNotes = typeof countryProfile.notes === 'string'
              ? JSON.parse(countryProfile.notes)
              : countryProfile.notes;
          } catch (e) {
            console.warn('Failed to parse country profile notes:', e);
          }
          const visaDecisionStatus = countryNotes?.visaDecisionStatus;
          if (visaDecisionStatus?.status) {
            currentStatus = visaDecisionStatus.status;
          }
        }
      }

      // Fallback to student notes
      if (!currentStatus && student?.notes) {
        let notes = null;
        try {
          notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
        } catch (e) {
          console.warn('Failed to parse student notes:', e);
        }
        const visaDecisionStatus = notes?.visaDecisionStatus;
        if (visaDecisionStatus?.status) {
          currentStatus = visaDecisionStatus.status;
        }
      }
    } catch (e) {
      console.error('Error loading current Visa Decision status:', e);
    }

    const visaDecisionPhase = { key: 'VISA_DECISION', label: 'Visa Decision' };
    setPhaseConfirmDialog({
      open: true,
      phase: visaDecisionPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: null,
      casVisaStatus: null,
      visaStatus: null,
      visaDecisionStatus: currentStatus || 'REJECTED', // Default to REJECTED if retrying, but allow change
      financialOption: null,
      paymentAmount: '',
      paymentType: ''
    });
  };

  const handleGoToDocumentsFromPhaseError = () => {
    // Capture missing document types from the error dialog (if provided)
    const errorData = phaseErrorDialog.errorData;
    let missingTypes = [];

    if (errorData) {
      if (Array.isArray(errorData.missingDocuments) && errorData.missingDocuments.length > 0) {
        missingTypes = errorData.missingDocuments;
      } else if (Array.isArray(errorData.documentDetails) && errorData.documentDetails.length > 0) {
        missingTypes = errorData.documentDetails
          .map(doc => doc.type)
          .filter(Boolean);
      }
    }

    const uniqueMissingTypes = Array.from(new Set(missingTypes));

    // Set upload phase info to filter documents for the current phase
    if (errorData?.phaseName && (errorData?.country || selectedCountry)) {
      setUploadPhaseInfo({
        phase: errorData.phaseName,
        country: errorData.country || selectedCountry,
        missingDocuments: uniqueMissingTypes
      });
    }

    // Filter document types to show only missing ones
    const allowedTypes = uniqueMissingTypes.length > 0
      ? DOCUMENT_TYPES.filter(doc => uniqueMissingTypes.includes(doc))
      : DOCUMENT_TYPES;

    // Close the phase error dialog
    setPhaseErrorDialog({ open: false, errorData: null });

    // Set filtered document types and pre-select the first missing document type
    setFilteredDocumentTypes(allowedTypes);
    setUploadData(prev => ({
      ...prev,
      // Pre-select the first missing document type for convenience
      type: uniqueMissingTypes.length > 0 ? uniqueMissingTypes[0] : '',
      file: null,
      description: '',
      documentNumber: '',
      issuingAuthority: '',
      issueDate: '',
      expiryDate: '',
      countryOfIssue: '',
      remarks: '',
      priority: 'MEDIUM'
    }));

    // Open the upload dialog immediately (no need to switch tabs)
    setOpenUploadDialog(true);
  };

  const handleRemarksChange = (event) => {
    setPhaseConfirmDialog(prev => ({
      ...prev,
      remarks: event.target.value
    }));
  };

  const fetchStudentDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching student details for ID:', id);

      console.log('🚀 Starting to fetch student data...');

      // Fetch core data first (required)
      const [
        studentResponse,
        documentsResponse,
        applicationsResponse,
        notesResponse
      ] = await Promise.all([
        axiosInstance.get(`/counselor/students/${id}`).catch(err => {
          console.error('❌ Student details API failed:', err);
          throw err;
        }),
        axiosInstance.get(`/counselor/students/${id}/documents`).catch(err => {
          console.error('❌ Documents API failed:', err);
          throw err;
        }),
        axiosInstance.get(`/counselor/students/${id}/applications`).catch(err => {
          console.error('❌ Applications API failed:', err);
          throw err;
        }),
        axiosInstance.get(`/counselor/students/${id}/notes`).catch(err => {
          console.error('❌ Notes API failed:', err);
          throw err;
        })
      ]);

      // Fetch activities separately (optional - don't fail the entire page if this fails)
      let activitiesResponse = null;
      try {
        activitiesResponse = await axiosInstance.get(`/counselor/students/${id}/activities`);
        console.log('✅ Activities API succeeded');
      } catch (err) {
        console.error('❌ Activities API failed (non-critical):', err);
        console.log('⚠️ Continuing without activities data');
        activitiesResponse = { data: { success: true, data: [] } }; // Fallback to empty array
      }

      console.log('✅ All API calls completed successfully');

      console.log('📄 Documents response:', documentsResponse.data);

      const studentData = studentResponse.data.success ? studentResponse.data.data : studentResponse.data;
      const documentsData = documentsResponse.data.success ? documentsResponse.data.data : documentsResponse.data;
      const applicationsData = applicationsResponse.data.success ? applicationsResponse.data.data : applicationsResponse.data;
      const notesData = notesResponse.data.success ? notesResponse.data.data : notesResponse.data;
      const activitiesData = activitiesResponse.data.success ? activitiesResponse.data.data : activitiesResponse.data;

      console.log('📄 Processed documents data:', documentsData);
      console.log('📄 Documents array length:', documentsData?.length || 0);
      console.log('📄 Activities data:', activitiesData);
      console.log('📄 Activities with user info:', activitiesData?.map(a => ({
        id: a.id,
        description: a.description,
        user: a.user
      })));

      setStudent(studentData);
      setEditData(studentData);
      setDocuments(documentsData || []);
      setApplications(applicationsData);
      setNotes(notesData);
      setActivities(activitiesData);

      // Set initial unread message count from student data if available
      if (studentData?.unreadMessageCount !== undefined) {
        setUnreadMessageCount(studentData.unreadMessageCount || 0);
        // If there are unread messages, assume there are messages
        if (studentData.unreadMessageCount > 0) {
          setHasMessages(true);
        }
      }

      // Calculate performance metrics (mock data for now)
      setPerformanceMetrics({
        responseTime: Math.floor(Math.random() * 24) + 1, // 1-24 hours
        completionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
        satisfactionScore: Math.floor(Math.random() * 2) + 4 // 4-5 stars
      });

    } catch (error) {
      console.error('Error fetching student details:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMessage = 'Failed to load student details. Please try again later.';
      if (error.response?.status === 404) {
        errorMessage = 'Student not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this student.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUniversities = useCallback(async () => {
    try {
      setSectionLoading(prev => ({ ...prev, universities: true }));
      const response = await axiosInstance.get('/counselor/universities');
      // Handle different response structures
      let universitiesData = [];
      if (response.data.success) {
        // New format: { success: true, data: { universities: [...] } }
        universitiesData = response.data.data?.universities || response.data.data || [];
      } else if (Array.isArray(response.data)) {
        // Old format: direct array
        universitiesData = response.data;
      } else if (Array.isArray(response.data.data)) {
        // Alternative format: { data: [...] }
        universitiesData = response.data.data;
      }
      // Ensure it's always an array
      setUniversities(Array.isArray(universitiesData) ? universitiesData : []);
    } catch (error) {
      console.error('Error fetching universities:', error);
      setUniversities([]); // Set to empty array on error
      // Don't call showSnackbar here to avoid dependency issues - it's not critical
    } finally {
      setSectionLoading(prev => ({ ...prev, universities: false }));
    }
  }, []);

  const fetchApplications = async () => {
    try {
      setSectionLoading(prev => ({ ...prev, applications: true }));
      const response = await axiosInstance.get(`/counselor/applications?studentId=${id}`);
      setApplications(response.data.success ? response.data.data : (response.data || []));
    } catch (error) {
      console.error('Error fetching applications:', error);
      showSnackbar('Failed to load applications', 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, applications: false }));
    }
  };

  // Fetch country profiles for student
  const fetchCountryProfiles = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/counselor/students/${id}/country-profiles`);
      const profiles = response.data.success ? response.data.data : [];
      setCountryProfiles(profiles);

      // Auto-select first profile if available and none selected
      if (profiles.length > 0 && !selectedCountry) {
        setSelectedCountry(profiles[0].country);
      }
    } catch (error) {
      console.error('Error fetching country profiles:', error);
      // Don't show error snackbar - country profiles are optional
    }
  }, [id, selectedCountry]);

  // Create country profile
  const handleCreateCountryProfile = async () => {
    if (!newCountryName.trim()) {
      showSnackbar('Please select a country', 'warning');
      return;
    }

    try {
      const response = await axiosInstance.post('/counselor/students/country-profile', {
        studentId: id,
        country: newCountryName
      });

      if (response.data.success) {
        showSnackbar(`Country profile for ${newCountryName} created successfully`, 'success');
        setOpenCountryProfileDialog(false);
        setNewCountryName('');
        await fetchCountryProfiles();
        setSelectedCountry(newCountryName);
        // Refresh student details to update progress bar
        await fetchStudentDetails();
      }
    } catch (error) {
      console.error('Error creating country profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create country profile';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Auto-create country profiles from selected universities
  const handleAutoCreateCountryProfiles = async () => {
    if (!applications || applications.length === 0) {
      showSnackbar('No applications found. Please add applications first.', 'warning');
      return;
    }

    // Extract unique countries from applications
    const countries = [...new Set(applications
      .map(app => app.university?.country)
      .filter(country => country))];

    if (countries.length === 0) {
      showSnackbar('No countries found in applications', 'warning');
      return;
    }

    try {
      const response = await axiosInstance.post('/counselor/students/auto-create-country-profiles', {
        studentId: id,
        countries: countries
      });

      if (response.data.success) {
        const { totalCreated, totalExisting } = response.data.data;
        showSnackbar(
          `Created ${totalCreated} new country profile(s). ${totalExisting} already existed.`,
          'success'
        );
        await fetchCountryProfiles();
      }
    } catch (error) {
      console.error('Error auto-creating country profiles:', error);
      const errorMessage = error.response?.data?.message || 'Failed to auto-create country profiles';
      showSnackbar(errorMessage, 'error');
    }
  };

  useEffect(() => {
    fetchStudentDetails();
    fetchUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id to prevent infinite loops

  // Fetch country profiles after student details are loaded
  useEffect(() => {
    if (student) {
      fetchCountryProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, student?.targetCountries]);

  useEffect(() => {
    if (student) {
      calculateStudentStats();
    }
  }, [student, documents, applications, calculateStudentStats]);

  // Fetch unread message count and check if there are any messages
  const fetchUnreadCount = useCallback(async () => {
    if (!student?.id || !user?.id) return;
    try {
      // First check if student has unreadMessageCount from backend
      if (student?.unreadMessageCount !== undefined) {
        setUnreadMessageCount(student.unreadMessageCount || 0);
      }

      // Also fetch from messages API to get real-time count
      const studentMessagesResponse = await axiosInstance.get(`/messages/student/${student.id}`);
      if (studentMessagesResponse.data.success) {
        const messages = studentMessagesResponse.data.data || [];
        // Check if there are any messages at all
        setHasMessages(messages.length > 0);

        // Count unread messages where current user is the receiver
        const unread = messages.filter(
          msg => msg.receiverId === user.id && !msg.isRead
        ).length;
        setUnreadMessageCount(unread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [student?.id, student?.unreadMessageCount, user?.id]);

  useEffect(() => {
    if (student?.id && user?.id) {
      fetchUnreadCount();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [student?.id, user?.id, fetchUnreadCount]);

  // Fetch reminders for the student
  const fetchReminders = useCallback(async () => {
    if (!id) return;
    try {
      setReminderLoading(true);
      const response = await axiosInstance.get(`/reminders/student/${id}`);
      if (response.data.success) {
        setReminders(response.data.reminders);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      showSnackbar('Failed to load reminders', 'error');
    } finally {
      setReminderLoading(false);
    }
  }, [id]);

  // Create a new reminder
  const handleCreateReminder = async (reminderData) => {
    try {
      const response = await axiosInstance.post('/reminders', {
        studentId: parseInt(id),
        title: reminderData.title,
        message: reminderData.message,
        reminderDatetime: reminderData.reminderDatetime.toISOString()
      });

      if (response.data.success) {
        showSnackbar('Reminder created successfully', 'success');
        fetchReminders();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      showSnackbar(error.response?.data?.message || 'Failed to create reminder', 'error');
    }
  };

  // Delete a reminder
  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/reminders/${reminderId}`);
      if (response.data.success) {
        showSnackbar('Reminder deleted successfully', 'success');
        fetchReminders();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      showSnackbar('Failed to delete reminder', 'error');
    }
  };

  // Fetch reminders when component mounts
  useEffect(() => {
    if (id) {
      fetchReminders();
    }
  }, [id, fetchReminders]);

  // WebSocket: Listen for real-time phase updates
  useEffect(() => {
    if (!isConnected || !user?.id || !id) return;

    // Join counselor room to receive phase updates
    joinRoom(`counselor:${user.id}`);
    // Also join student-specific room for targeted updates
    joinRoom(`student:${id}`);

    // Listen for student phase update events
    const cleanupPhaseUpdate = onEvent('student_phase_updated', (phaseData) => {
      console.log('📡 Phase update received via WebSocket:', phaseData);

      // Only process updates for the current student
      if (phaseData.studentId && phaseData.studentId !== parseInt(id)) {
        return;
      }

      // Optimistically update the state immediately
      if (!phaseData.country) {
        // Global phase update - update student state immediately
        setStudent(prev => prev ? { 
          ...prev, 
          currentPhase: phaseData.currentPhase,
          updatedAt: phaseData.updatedAt || new Date().toISOString()
        } : prev);
        // Then refresh to get complete data
        fetchStudentDetails();
        showSnackbar('Phase updated in real-time', 'info');
      }
      // Update country profiles if it's a country-specific phase update
      else if (phaseData.country && phaseData.countryProfile) {
        // Update country profile state immediately
        setCountryProfiles(prev => prev.map(profile => 
          profile.country === phaseData.country 
            ? { ...profile, currentPhase: phaseData.countryProfile.currentPhase }
            : profile
        ));
        // Refresh both in parallel for complete data
        Promise.all([
          fetchCountryProfiles(),
          fetchStudentDetails()
        ]);
        showSnackbar(`Phase updated for ${phaseData.country} in real-time`, 'info');
      }
    });

    return () => {
      cleanupPhaseUpdate?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, user?.id, id, onEvent, joinRoom]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await axiosInstance.put(`/counselor/students/${id}`, editData);
      setEditMode(false);
      fetchStudentDetails();
      showSnackbar('Student details updated successfully', 'success');
    } catch (error) {
      console.error('Error updating student:', error);
      setError('Failed to update student details. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditData(student);
    setEditMode(false);
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/counselor/students/${id}`);
      navigate('/counselor/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Failed to delete student. Please try again.');
    }
  };

  const handleDocumentMenuOpen = (event, document) => {
    setSelectedDocument(document);
    setDocumentMenuAnchor(event.currentTarget);
  };

  const handleDocumentMenuClose = () => {
    setSelectedDocument(null);
    setDocumentMenuAnchor(null);
  };

  const handleApplicationMenuOpen = (event, application) => {
    setSelectedApplication(application);
    setApplicationMenuAnchor(event.currentTarget);
  };

  const handleApplicationMenuClose = () => {
    setSelectedApplication(null);
    setApplicationMenuAnchor(null);
  };

  const handleExportDocuments = async () => {
    try {
      const response = await axiosInstance.get(`/counselor/students/${id}/documents/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documents_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting documents:', error);
      setError('Failed to export documents. Please try again.');
    }
  };

  const handleExportApplications = async () => {
    try {
      const response = await axiosInstance.get(`/counselor/students/${id}/applications/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications_${id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting applications:', error);
      setError('Failed to export applications. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'DEFERRED':
        return <ScheduleIcon sx={{ color: 'warning.main' }} />;
      case 'REJECTED':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const handleUploadDocument = async () => {
    try {
      if (!uploadData.file || !uploadData.type) {
        setError('Please select a file and document type');
        return;
      }

      console.log('Uploading document:', {
        file: uploadData.file.name,
        type: uploadData.type,
        size: uploadData.file.size
      });

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('type', uploadData.type);
      formData.append('description', uploadData.description);
      formData.append('expiryDate', uploadData.expiryDate);
      formData.append('issueDate', uploadData.issueDate);
      formData.append('issuingAuthority', uploadData.issuingAuthority);
      formData.append('documentNumber', uploadData.documentNumber);
      formData.append('countryOfIssue', uploadData.countryOfIssue);
      formData.append('remarks', uploadData.remarks);
      formData.append('priority', uploadData.priority);

      console.log('Sending request to:', `/counselor/students/${id}/documents/upload`);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const response = await axiosInstance.post(`/counselor/students/${id}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('Upload response:', response.data);

      // Close dialog and reset form
      setOpenUploadDialog(false);
      setUploadData({
        type: '',
        description: '',
        file: null,
        expiryDate: '',
        issueDate: '',
        issuingAuthority: '',
        documentNumber: '',
        countryOfIssue: '',
        remarks: '',
        priority: 'MEDIUM'
      });

      // Refresh student details to update missing documents list
      await fetchStudentDetails();
      showSnackbar('Document uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);

      let errorMessage = 'Failed to upload document. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add more specific error messages
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Please try again with a smaller file.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please choose a smaller file.';
      } else if (error.response?.status === 415) {
        errorMessage = 'Unsupported file type. Please choose a different file.';
      }

      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is larger than 1MB and show warning popup
      const oneMB = 1024 * 1024; // 1MB in bytes
      if (file.size > oneMB) {
        setPendingFile(file);
        setOpenFileSizeDialog(true);
        // Clear the file input for now
        event.target.value = '';
        return;
      }

      // Validate file type and size
      const validationError = getFileValidationError(file, 'documents', 'document');

      if (validationError) {
        setError(validationError);
        showSnackbar(validationError, 'error');
        // Clear the file input
        event.target.value = '';
        return;
      }

      setUploadData({
        ...uploadData,
        file: file,
        fileSize: formatFileSize(file.size)
      });

      setError(null); // Clear any previous errors
    }
  };

  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      console.log('📥 Attempting to download document:', documentId, fileName);
      const response = await axiosInstance.get(`/counselor/documents/${documentId}/download`, {
        responseType: 'blob'
      });

      console.log('📥 Download response received');

      // Check if this is a JSON response (metadata document)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // For metadata documents, the response is already JSON
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName || 'document'}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // For physical files
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'document');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      showSnackbar('Document downloaded successfully', 'success');
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMessage = 'Failed to download document. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this document.';
      }

      setError(errorMessage);
    }
  };

  const handlePreviewDocument = async (document) => {
    try {
      setPreviewLoading(true);
      setPreviewFileName(document.name);
      console.log('👁️ Attempting to preview document:', document.id, document.name);

      // For academic records with JSON metadata, create a formatted preview
      if (document.type === 'ACADEMIC_TRANSCRIPT' && document.description &&
        (document.description.trim().startsWith('{') || document.description.trim().startsWith('['))) {
        try {
          const academicData = JSON.parse(document.description);
          const previewContent = `
             <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
               <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
                 Academic Record Preview
               </h2>
               
               <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                 <h3 style="margin-top: 0; color: #333;">Document Information</h3>
                 <table style="width: 100%; border-collapse: collapse;">
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #e3f2fd;">Document Name:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${document.name}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #e3f2fd;">Type:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${document.type?.replace(/_/g, ' ')}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #e3f2fd;">Status:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${document.status}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #e3f2fd;">Created:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${new Date(document.createdAt).toLocaleDateString()}</td>
                   </tr>
                 </table>
               </div>
               
               <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                 <h3 style="margin-top: 0; color: #333;">Academic Details</h3>
                 <table style="width: 100%; border-collapse: collapse;">
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Qualification:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${academicData.qualificationType?.replace(/_/g, ' ') || 'N/A'}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Institution:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${academicData.institutionName || 'N/A'}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Major/Subject:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${academicData.majorSubject || 'N/A'}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Duration:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${academicData.startDate || 'N/A'} - ${academicData.endDate || 'N/A'}</td>
                   </tr>
                   <tr>
                     <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Grade:</td>
                     <td style="padding: 8px; border: 1px solid #ddd;">${academicData.grade || 'N/A'} (${academicData.gradingSystem?.replace(/_/g, ' ') || 'N/A'})</td>
                   </tr>
                 </table>
               </div>
               
               ${academicData.remarks ? `
                 <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                   <h3 style="margin-top: 0; color: #333;">Remarks</h3>
                   <p style="margin: 0; font-style: italic; color: #555;">${academicData.remarks}</p>
                 </div>
               ` : ''}
             </div>
           `;

          const blob = new Blob([previewContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl(url);
          setPreviewDialogOpen(true);
          setPreviewLoading(false);
          showSnackbar('Academic record preview loaded successfully!', 'success');
          return;
        } catch (e) {
          console.warn('Document preview: Invalid academic data format for document:', document.name);
          showSnackbar('Academic record data is corrupted or invalid. Please re-upload the document.', 'error');
          setPreviewLoading(false);
          return;
        }
      }

      // For regular files (including PDFs), try to preview via server
      if (document.type === 'ACADEMIC_TRANSCRIPT' && (!document.description ||
        (!document.description.trim().startsWith('{') && !document.description.trim().startsWith('[')))) {
        // This is a regular PDF file with ACADEMIC_TRANSCRIPT type but no JSON metadata
        // Fall through to server preview
      }

      // For physical files, check if document is previewable via server
      const response = await axiosInstance.get(`/counselor/documents/${document.id}/preview`, {
        responseType: 'blob' // Expect blob for local files, will be overridden for JSON responses
      });

      console.log('👁️ Preview response received:', response.data);
      console.log('👁️ Response headers:', response.headers);

      // Check if response is JSON (DigitalOcean Spaces) or blob (local file)
      const contentType = response.headers['content-type'];

      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response from DigitalOcean Spaces
        const text = await response.data.text();
        const data = JSON.parse(text);

        if (data.previewable && data.previewUrl) {
          // Document is previewable, use the signed URL
          setPreviewUrl(data.previewUrl);
          setPreviewDialogOpen(true);
          setPreviewLoading(false);
          showSnackbar('Document preview loaded successfully!', 'success');
          return;
        } else if (!data.previewable) {
          // Document is not previewable
          showSnackbar(data.message || 'Preview not available for this file type. Please download to view.', 'warning');
          setPreviewLoading(false);
          return;
        }
      } else if (contentType && (contentType.includes('application/pdf') || contentType.includes('image/'))) {
        // Handle direct file response (local files)
        console.log('📄 Received direct file response, creating preview URL');
        const url = window.URL.createObjectURL(response.data);
        setPreviewUrl(url);
        setPreviewDialogOpen(true);
        setPreviewLoading(false);
        showSnackbar('Document preview loaded successfully!', 'success');
        return;
      }

      // Fallback: if we get here, something went wrong
      showSnackbar('Failed to load document preview', 'error');
      setPreviewLoading(false);
    } catch (error) {
      console.error('❌ Error previewing document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMessage = 'Failed to preview document. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to preview this document.';
      }

      showSnackbar(errorMessage, 'error');
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setPreviewFileName('');
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete document:', documentId);
      const response = await axiosInstance.delete(`/counselor/documents/${documentId}`);
      console.log('🗑️ Delete response:', response.data);

      // Refresh documents list
      fetchStudentDetails();
      showSnackbar('Document deleted successfully', 'success');
    } catch (error) {
      console.error('❌ Error deleting document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      let errorMessage = 'Failed to delete document. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this document.';
      }

      setError(errorMessage);
    }
  };

  const handleAddNote = async () => {
    console.log('Adding note with text:', noteText);
    try {
      setError(null); // Clear previous errors

      await axiosInstance.post(`/counselor/students/${id}/notes`, {
        content: noteText
      });

      console.log('Note added successfully');
      setOpenNoteDialog(false);
      setNoteText('');
      fetchStudentDetails();
      showSnackbar('Note added successfully', 'success');
    } catch (error) {
      console.error('Error adding note:', error);

      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        showSnackbar('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to perform this action.');
        showSnackbar('You do not have permission to perform this action.', 'error');
      } else if (error.response?.status === 404) {
        setError('Student not found or access denied.');
        showSnackbar('Student not found or access denied.', 'error');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
        showSnackbar(error.response.data.message, 'error');
      } else {
        setError('Failed to add note. Please try again.');
        showSnackbar('Failed to add note. Please try again.', 'error');
      }
    }
  };

  const handleNoteTextChange = (e) => {
    console.log('Note text changed:', e.target.value);
    console.log('Previous note text:', noteText);
    setNoteText(e.target.value);
    console.log('New note text will be:', e.target.value);
  };

  const testNoteState = () => {
    console.log('Current note text:', noteText);
    console.log('Note text length:', noteText.length);
    console.log('Note text trimmed:', noteText.trim());
  };

  const handleAddApplication = async (applicationData) => {
    try {
      await axiosInstance.post('/counselor/applications', {
        ...applicationData,
        studentId: id
      });
      setOpenApplicationDialog(false);
      showSnackbar('Application added successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error adding application:', error);
      showSnackbar('Failed to add application', 'error');
    }
  };

  const handleUpdateApplication = async (applicationId, applicationData) => {
    try {
      await axiosInstance.put(`/counselor/applications/${applicationId}`, {
        ...applicationData,
        studentId: id
      });
      showSnackbar('Application updated successfully');
      fetchApplications();
      setOpenApplicationDialog(false);
    } catch (error) {
      console.error('Error updating application:', error);
      showSnackbar('Failed to update application', 'error');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      await axiosInstance.delete(`/counselor/applications/${applicationId}`);
      showSnackbar('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      showSnackbar('Failed to delete application', 'error');
    }
    handleApplicationMenuClose();
  };

  const handlePrintProfile = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');

      // Generate the HTML content for printing
      const printContent = `
         <!DOCTYPE html>
         <html>
         <head>
           <title>Student Profile - ${formatStudentName(student)}</title>
           <style>
             body {
               font-family: Arial, sans-serif;
               margin: 20px;
               line-height: 1.6;
               color: #333;
             }
             .header {
               text-align: center;
               border-bottom: 2px solid #1976d2;
               padding-bottom: 20px;
               margin-bottom: 30px;
             }
             .header h1 {
               color: #1976d2;
               margin: 0;
               font-size: 28px;
             }
             .header p {
               margin: 5px 0;
               color: #666;
             }
             .section {
               margin-bottom: 30px;
               page-break-inside: avoid;
             }
             .section h2 {
               color: #1976d2;
               border-bottom: 1px solid #ddd;
               padding-bottom: 10px;
               margin-bottom: 15px;
             }
             .info-grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 15px;
               margin-bottom: 20px;
             }
             .info-item {
               padding: 10px;
               background: #f5f5f5;
               border-radius: 5px;
             }
             .info-label {
               font-weight: bold;
               color: #1976d2;
               margin-bottom: 5px;
             }
             .info-value {
               color: #333;
             }
             .status-chip {
               display: inline-block;
               padding: 5px 10px;
               border-radius: 15px;
               font-size: 12px;
               font-weight: bold;
               text-transform: uppercase;
             }
             .status-active {
               background: #4caf50;
               color: white;
             }
             .status-pending {
               background: #ff9800;
               color: white;
             }
             .documents-list {
               list-style: none;
               padding: 0;
             }
             .document-item {
               padding: 10px;
               border: 1px solid #ddd;
               margin-bottom: 10px;
               border-radius: 5px;
               background: #f9f9f9;
             }
             .applications-list {
               list-style: none;
               padding: 0;
             }
             .application-item {
               padding: 15px;
               border: 1px solid #ddd;
               margin-bottom: 15px;
               border-radius: 5px;
               background: #f9f9f9;
             }
             .stats-grid {
               display: grid;
               grid-template-columns: repeat(4, 1fr);
               gap: 15px;
               margin-bottom: 20px;
             }
             .stat-item {
               text-align: center;
               padding: 15px;
               background: #e3f2fd;
               border-radius: 5px;
               border: 1px solid #1976d2;
             }
             .stat-number {
               font-size: 24px;
               font-weight: bold;
               color: #1976d2;
             }
             .stat-label {
               font-size: 12px;
               color: #666;
               text-transform: uppercase;
             }
             @media print {
               body { margin: 0; }
               .no-print { display: none; }
             }
           </style>
         </head>
         <body>
           <div class="header">
             <h1>Student Profile</h1>
             <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
             <p><strong>Student ID:</strong> ${student?.id}</p>
           </div>

           <div class="section">
             <h2>Personal Information</h2>
             <div class="info-grid">
               <div class="info-item">
                 <div class="info-label">Full Name</div>
                 <div class="info-value">${formatStudentName(student)}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Email</div>
                 <div class="info-value">${student?.email || 'Not provided'}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Phone</div>
                 <div class="info-value">${student?.phone || 'Not provided'}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Address</div>
                 <div class="info-value">${student?.address || 'Not provided'}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Registration Date</div>
                 <div class="info-value">${formatDate(student?.createdAt)}</div>
               </div>
               <div class="info-item">
                 <div class="info-label">Current Status</div>
                 <div class="info-value">
                   <span class="status-chip ${student?.status === 'ACTIVE' ? 'status-active' : 'status-pending'}">
                     ${student?.status || 'UNKNOWN'}
                   </span>
                 </div>
               </div>
             </div>
           </div>

           <div class="section">
             <h2>Current Phase</h2>
             <div class="info-item">
               <div class="info-label">Phase</div>
               <div class="info-value">${student?.currentPhase?.replace(/_/g, ' ') || 'Not set'}</div>
             </div>
           </div>

           <div class="section">
             <h2>Statistics Summary</h2>
             <div class="stats-grid">
               <div class="stat-item">
                 <div class="stat-number">${studentStats.totalDocuments}</div>
                 <div class="stat-label">Total Documents</div>
               </div>
               <div class="stat-item">
                 <div class="stat-number">${studentStats.pendingDocuments}</div>
                 <div class="stat-label">Pending Documents</div>
               </div>
               <div class="stat-item">
                 <div class="stat-number">${studentStats.completedApplications}</div>
                 <div class="stat-label">Completed Apps</div>
               </div>
               <div class="stat-item">
                 <div class="stat-number">${studentStats.progressPercentage}%</div>
                 <div class="stat-label">Progress</div>
               </div>
             </div>
           </div>

           <div class="section">
             <h2>Documents (${documents?.length || 0})</h2>
             <ul class="documents-list">
               ${documents?.map(doc => `
                 <li class="document-item">
                   <strong>${doc.name}</strong><br>
                   <small>Type: ${doc.type?.replace(/_/g, ' ')} | Status: ${doc.status} | Size: ${formatFileSize(doc.size || 0)}</small>
                   ${doc.description ? `<br><small>Description: ${doc.description}</small>` : ''}
                 </li>
               `).join('') || '<li>No documents uploaded</li>'}
             </ul>
           </div>

           <div class="section">
             <h2>University Applications (${applications?.length || 0})</h2>
             <ul class="applications-list">
               ${applications?.map(app => `
                 <li class="application-item">
                   <strong>${app.university?.name || 'Unknown University'}</strong><br>
                   <small>Program: ${app.programName || 'No program specified'}</small><br>
                   <small>Status: ${app.status || 'UNKNOWN'} | Intake: ${app.intakeTerm ? app.intakeTerm.replace('_', ' ') : 'Not specified'}</small>
                   ${app.applicationFee ? `<br><small>Fee: $${app.applicationFee}</small>` : ''}
                 </li>
               `).join('') || '<li>No applications created</li>'}
             </ul>
           </div>

           <div class="section">
             <h2>Notes (${notes?.length || 0})</h2>
             <ul class="documents-list">
               ${notes?.map(note => `
                 <li class="document-item">
                   <div>${note.content}</div>
                   <small>By: ${note.counselor?.name || 'Unknown Counselor'} | ${formatDate(note.createdAt)}</small>
                 </li>
               `).join('') || '<li>No notes added</li>'}
             </ul>
           </div>

           <div class="section no-print">
             <p style="text-align: center; color: #666; font-size: 12px;">
               This profile was generated from the Counselor CRM System<br>
               For any questions, please contact your counselor
             </p>
           </div>
         </body>
         </html>
       `;

      // Write the content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
      };

      showSnackbar('Print dialog opened successfully!', 'success');
    } catch (error) {
      console.error('Error printing profile:', error);
      showSnackbar('Failed to open print dialog. Please try again.', 'error');
    }
  };

  const renderPersonalInfo = () => (
    <Card sx={{
      borderRadius: 3,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      border: `1px solid ${theme.palette.divider}`
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: student?.status === 'ACTIVE' ? 'success.main' : 'warning.main',
                  border: `2px solid ${theme.palette.background.paper}`
                }}
              />
            }
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                mr: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {student?.firstName?.charAt(0)}
            </Avatar>
          </Badge>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {formatStudentName(student)}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
              Student ID: {student?.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={student?.status || 'UNKNOWN'}
                color={student?.status === 'ACTIVE' ? 'success' : 'warning'}
                size="small"
                icon={getStatusIcon(student?.status)}
              />
              <Chip
                label={student?.currentPhase?.replace(/_/g, ' ') || 'Not set'}
                color="primary"
                size="small"
                variant="outlined"
              />
              <Rating value={studentStats.averageRating} readOnly size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Student">
              <IconButton
                onClick={handleEdit}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            {(student?.marketingOwner || hasMessages || unreadMessageCount > 0) && (
              <Tooltip title={unreadMessageCount > 0 ? `${unreadMessageCount} unread message${unreadMessageCount > 1 ? 's' : ''} from marketing` : hasMessages ? "View messages" : "Chat with Marketing Team"}>
                <Badge badgeContent={unreadMessageCount > 0 ? unreadMessageCount : 0} color="error">
                  <IconButton
                    onClick={() => {
                      setOpenChatDialog(true);
                      // Refresh unread count when opening chat
                      fetchUnreadCount();
                    }}
                    sx={{
                      bgcolor: unreadMessageCount > 0 ? 'error.main' : 'secondary.main',
                      color: 'white',
                      '&:hover': { bgcolor: unreadMessageCount > 0 ? 'error.dark' : 'secondary.dark' }
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Badge>
              </Tooltip>
            )}
            <Tooltip title="Print Profile">
              <IconButton
                onClick={handlePrintProfile}
                sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share Profile">
              <IconButton sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={student?.email}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={student?.phone || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Address"
                  secondary={student?.address || 'Not provided'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PublicIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Selected Countries"
                  secondary={
                    Array.isArray(student?.targetCountries)
                      ? student.targetCountries.join(', ')
                      : typeof student?.targetCountries === 'string'
                        ? (() => {
                          try {
                            // Try to parse if it's a JSON string like ["Canada", "Germany"]
                            const parsed = JSON.parse(student.targetCountries);
                            if (Array.isArray(parsed)) return parsed.join(', ');
                            return parsed; // If it's just a string in quotes
                          } catch (e) {
                            // If parse fails, just clean up manually
                            return student.targetCountries.replace(/[\[\]"]/g, '').replace(/,/g, ', ');
                          }
                        })()
                        : 'Not provided'
                  }
                />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} sm={6}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Registration Date"
                  secondary={formatDate(student?.createdAt)}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Current Phase"
                  secondary={student?.currentPhase?.replace(/_/g, ' ') || 'Not set'}
                />
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={student?.currentPhase?.replace(/_/g, ' ') || 'Not set'}
                    color="primary"
                    size="small"
                  />
                </Box>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(student?.status)}
                </ListItemIcon>
                <ListItemText
                  primary="Status"
                  secondary={student?.status || 'Not set'}
                />
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={student?.status || 'Not set'}
                    color={student?.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </ListItem>
              {/* Interview Refusals by Country */}
              {(() => {
                try {
                  // Count interview refusals per country
                  const refusalCounts = {};
                  let totalRefusals = 0;

                  if (countryProfiles && countryProfiles.length > 0) {
                    countryProfiles.forEach(profile => {
                      if (profile.notes) {
                        try {
                          let notes;
                          if (typeof profile.notes === 'string') {
                            // Check if it looks like JSON (starts with { or [)
                            const trimmed = profile.notes.trim();
                            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                              try {
                                notes = JSON.parse(profile.notes);
                              } catch (parseError) {
                                // If JSON parsing fails, skip this profile
                                console.warn(`Failed to parse notes for ${profile.country}:`, parseError);
                                return;
                              }
                            } else {
                              // It's plain text, skip this profile (no interview status in plain text)
                              return;
                            }
                          } else {
                            notes = profile.notes;
                          }

                          const interviewStatus = notes?.interviewStatus;

                          if (interviewStatus && interviewStatus.status === 'REFUSED') {
                            const country = profile.country;
                            if (country) {
                              refusalCounts[country] = (refusalCounts[country] || 0) + 1;
                              totalRefusals++;
                            }
                          }
                        } catch (e) {
                          // Log error for debugging but continue with other profiles
                          console.warn(`Error processing notes for profile ${profile.country}:`, e);
                        }
                      }
                    });
                  }

                  // Also check student notes for backward compatibility
                  // Only use student notes if no country-specific refusals were found
                  if (student?.notes && Object.keys(refusalCounts).length === 0) {
                    try {
                      let notes;
                      if (typeof student.notes === 'string') {
                        const trimmed = student.notes.trim();
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                          notes = JSON.parse(student.notes);
                        } else {
                          // Plain text, skip
                          notes = null;
                        }
                      } else {
                        notes = student.notes;
                      }

                      if (notes) {
                        const interviewStatus = notes?.interviewStatus;

                        if (interviewStatus && interviewStatus.status === 'REFUSED') {
                          // Try to determine country from context
                          // If there's only one country profile, use that
                          if (countryProfiles && countryProfiles.length === 1) {
                            const country = countryProfiles[0].country;
                            refusalCounts[country] = 1;
                            totalRefusals = 1;
                          } else if (selectedCountry) {
                            // Use currently selected country as fallback
                            refusalCounts[selectedCountry] = 1;
                            totalRefusals = 1;
                          } else {
                            // No way to determine country, show generic
                            totalRefusals = 1;
                          }
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing student notes:', e);
                    }
                  }

                  if (totalRefusals > 0) {
                    const refusedCountries = Object.keys(refusalCounts);

                    return (
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon sx={{ color: 'error.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Interview Refusals"
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              {refusedCountries.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {refusedCountries.map((country) => (
                                    <Chip
                                      key={country}
                                      label={`Refused for ${country} (${refusalCounts[country]})`}
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                      sx={{
                                        fontWeight: 500,
                                        borderColor: 'error.main',
                                        '&:hover': {
                                          backgroundColor: 'error.light',
                                          color: 'white'
                                        }
                                      }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Chip
                                  label={`Refused (${totalRefusals})`}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  }
                  return null;
                } catch (e) {
                  console.error('Error calculating interview refusals:', e);
                  return null;
                }
              })()}
            </List>
          </Grid>
        </Grid>

        {editMode ? (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Selected Countries"
                  value={editData.targetCountries || ''}
                  onChange={(e) => setEditData({ ...editData, targetCountries: e.target.value })}
                  helperText="Enter countries separated by commas (e.g., USA, UK, Canada)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Current Phase"
                  value={editData.currentPhase}
                  onChange={(e) => setEditData({ ...editData, currentPhase: e.target.value })}
                >
                  {PHASES.map((phase) => (
                    <MenuItem key={phase} value={phase}>
                      {phase.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="DEFERRED">Deferred</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>
                Save Changes
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant={showDocuments ? "outlined" : "contained"}
              color="primary"
              onClick={() => setShowDocuments(!showDocuments)}
            >
              {showDocuments ? "Hide Documents" : "View Documents & Applications"}
            </Button>
            <Button startIcon={<EditIcon />} onClick={handleEdit}>
              Edit Details
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderDocuments = () => {
    console.log('🎨 Rendering documents tab');
    console.log('📄 Documents state:', documents);
    console.log('📄 Documents length:', documents?.length || 0);

    return (
      <Card sx={{
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documents ({documents?.length || 0})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={handleExportDocuments}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Export All
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setUploadPhaseInfo(null);
                  setFilteredDocumentTypes(DOCUMENT_TYPES);
                  setUploadData(prev => ({ ...prev, type: '' }));
                  setOpenUploadDialog(true);
                }}
                sx={{
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                  }
                }}
              >
                Upload Document
              </Button>
            </Box>
          </Box>

          {/* Enhanced Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
            </Grid>
          </Box>

          {/* Upload Dialog */}
          <Dialog
            open={openUploadDialog}
            onClose={() => setOpenUploadDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Upload Document</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                {/* Missing Documents Section */}
                {missingDocuments.length > 0 && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'warning.dark' }}>
                      Missing Documents for {student?.currentPhase?.replace(/_/g, ' ')} Phase:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {missingDocuments.map((docType) => {
                        const isSelected = uploadData.type === docType;
                        return (
                          <Chip
                            key={docType}
                            label={docType.replace(/_/g, ' ')}
                            onClick={() => setUploadData({ ...uploadData, type: docType })}
                            color={isSelected ? 'primary' : 'default'}
                            variant={isSelected ? 'filled' : 'outlined'}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                              }
                            }}
                          />
                        );
                      })}
                    </Box>




                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Search documents..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                          sx={{ borderRadius: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Status"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="ALL">All Status</MenuItem>
                          <MenuItem value="APPROVED">Approved</MenuItem>
                          <MenuItem value="PENDING">Pending</MenuItem>
                          <MenuItem value="REJECTED">Rejected</MenuItem>
                          <MenuItem value="EXPIRED">Expired</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<FilterIcon />}
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          size="small"
                          sx={{ borderRadius: 2 }}
                        >
                          {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>


            </DialogContent>
          </Dialog>


          {/* Enhanced Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </Grid>
            </Grid>
          </Box>

          <List>
            {documents
              .filter(doc => {
                const matchesSearch = !searchQuery ||
                  doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
                return matchesSearch && matchesStatus;
              })
              .map((doc) => (
                <ListItem
                  key={doc.id}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewDocument(doc)}
                          sx={{ bgcolor: 'info.50', '&:hover': { bgcolor: 'info.100' } }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadDocument(doc.id, doc.name)}
                          sx={{ bgcolor: 'success.50', '&:hover': { bgcolor: 'success.100' } }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More options">
                        <IconButton
                          size="small"
                          onClick={(e) => handleDocumentMenuOpen(e, doc)}
                          sx={{ bgcolor: 'grey.50', '&:hover': { bgcolor: 'grey.100' } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon>
                    <Avatar sx={{
                      bgcolor: getDocumentStatusColor(doc.status) === 'success' ? 'success.main' :
                        getDocumentStatusColor(doc.status) === 'error' ? 'error.main' :
                          getDocumentStatusColor(doc.status) === 'warning' ? 'warning.main' : 'primary.main',
                      width: 40,
                      height: 40
                    }}>
                      {getDocumentIcon(doc.name, doc.type)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} component="div">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} component="div">
                          {doc.name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="div">
                        {/* Only show description if it's not an academic record with formatted data */}
                        {!(doc.type === 'ACADEMIC_TRANSCRIPT' && doc.description) && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }} component="div">
                            {doc.description || 'No description provided'}
                          </Typography>
                        )}
                        {renderDocumentContent(doc)}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} component="div">
                          <Chip
                            label={doc.type.replace(/_/g, ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                          <Typography variant="caption" color="textSecondary" component="span">
                            {formatFileSize(doc.size || 0)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" component="span">
                            {getTimeAgo(doc.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            {documents.filter(doc => {
              const matchesSearch = !searchQuery ||
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
              const matchesStatus = filterStatus === 'ALL' || doc.status === filterStatus;
              return matchesSearch && matchesStatus;
            }).length === 0 && (
                <ListItem>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ textAlign: 'center', py: 4 }} component="div">
                        <DocumentIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5, color: 'text.secondary' }} />
                        <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }} component="div">
                          {searchQuery || filterStatus !== 'ALL' ? 'No documents found' : 'No documents uploaded yet'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }} component="div">
                          {searchQuery || filterStatus !== 'ALL' ? 'Try adjusting your search or filters' : 'Start by uploading your first document'}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setUploadPhaseInfo(null);
                            setFilteredDocumentTypes(DOCUMENT_TYPES);
                            setUploadData(prev => ({ ...prev, type: '' }));
                            setOpenUploadDialog(true);
                          }}
                          sx={{ borderRadius: 2 }}
                        >
                          Upload Document
                        </Button>
                      </Box>
                    }
                  />
                </ListItem>
              )}
          </List>
        </CardContent>

        {/* Document Menu */}
        <Menu
          anchorEl={documentMenuAnchor}
          open={Boolean(documentMenuAnchor)}
          onClose={handleDocumentMenuClose}
        >
          <MenuItem onClick={() => {
            handleDocumentMenuClose();
            if (selectedDocument) {
              handlePreviewDocument(selectedDocument);
            }
          }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            Preview
          </MenuItem>
          <MenuItem onClick={() => {
            handleDocumentMenuClose();
            // TODO: Add edit document functionality
            showSnackbar('Edit functionality coming soon!', 'info');
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit Details
          </MenuItem>
          <MenuItem onClick={() => {
            handleDocumentMenuClose();
            if (selectedDocument) {
              handleDeleteDocument(selectedDocument.id);
            }
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        {/* Upload Dialog */}
        <Dialog
          open={openUploadDialog}
          onClose={() => {
            setOpenUploadDialog(false);
            setUploadPhaseInfo(null);
            setFilteredDocumentTypes(DOCUMENT_TYPES);
            setUploadData(prev => ({ ...prev, type: '' }));
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {uploadPhaseInfo && (
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                    Phase: {uploadPhaseInfo.phaseLabel}
                  </Typography>
                  {uploadPhaseInfo.country && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      Country: {uploadPhaseInfo.country}
                    </Typography>
                  )}
                </Box>
              )}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Document Type"
                    value={uploadData.type}
                    onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                    required
                  >
                    {filteredDocumentTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    value={uploadData.priority}
                    onChange={(e) => setUploadData({ ...uploadData, priority: e.target.value })}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Document Number"
                    value={uploadData.documentNumber}
                    onChange={(e) => setUploadData({ ...uploadData, documentNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Issuing Authority"
                    value={uploadData.issuingAuthority}
                    onChange={(e) => setUploadData({ ...uploadData, issuingAuthority: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Issue Date"
                    value={uploadData.issueDate}
                    onChange={(e) => setUploadData({ ...uploadData, issueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date"
                    value={uploadData.expiryDate}
                    onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country of Issue"
                    value={uploadData.countryOfIssue}
                    onChange={(e) => setUploadData({ ...uploadData, countryOfIssue: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    value={uploadData.remarks}
                    onChange={(e) => setUploadData({ ...uploadData, remarks: e.target.value })}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <input
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    id="document-file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="document-file">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFileIcon />}
                      fullWidth
                    >
                      {uploadData.file ? `${uploadData.file.name} (${uploadData.fileSize})` : 'Choose File'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Max size: {formatFileSize(FILE_SIZE_LIMITS.DOCUMENT)} • Supported: PDF, Word, Excel, Images
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
            <Button
              onClick={handleUploadDocument}
              variant="contained"
              disabled={!uploadData.file || !uploadData.type}
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    );
  };

  const renderNotes = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Notes & Comments</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNoteDialog}
          >
            Add Note
          </Button>
        </Box>

        <List>
          {notes.map((note) => (
            <ListItem key={note.id} divider>
              <ListItemIcon>
                <CommentIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                secondaryTypographyProps={{ component: 'div' }}
                primary={note.content}
                secondary={
                  <Box sx={{ mt: 1 }} component="div">
                    <Typography variant="caption" color="textSecondary" component="span">
                      By {note.counselor?.name || 'Unknown Counselor'} • {formatDate(note.createdAt)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
          {notes.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No notes added yet"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>

      {/* Add Note Dialog */}
      <Dialog
        open={openNoteDialog}
        onClose={() => setOpenNoteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={noteText}
            onChange={handleNoteTextChange}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNoteDialog(false)}>Cancel</Button>
          <Button onClick={testNoteState} variant="outlined" sx={{ mr: 1 }}>
            Test Note
          </Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={!noteText.trim()}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );

  const renderTimeline = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Activity Timeline
        </Typography>

        <List>
          {activities.map((activity, index) => (
            <ListItem
              key={activity.id}
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '20px',
                  top: 0,
                  bottom: index === activities.length - 1 ? '50%' : 0,
                  width: '2px',
                  bgcolor: 'primary.main',
                  opacity: 0.2
                }
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    zIndex: 1
                  }}
                >
                  <HistoryIcon />
                </Box>
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ component: 'div' }}
                secondaryTypographyProps={{ component: 'div' }}
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
                    <Typography variant="subtitle1" component="div">
                      {activity.description}
                    </Typography>
                    <Chip
                      label={formatDate(activity.createdAt || activity.timestamp, true)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} component="div">
                    By {activity.user ?
                      `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() ||
                      activity.user.email ||
                      'Unknown User'
                      : 'Unknown User'}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          {activities.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No activities recorded yet"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card >
  );

  const renderApplications = () => {
    const filteredApplications = selectedCountry
      ? applications.filter(app => app.university?.country === selectedCountry)
      : applications;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6">
                University Applications
                {selectedCountry && (
                  <Chip
                    label={selectedCountry}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              {selectedCountry && (
                <Typography variant="caption" color="text.secondary">
                  Showing {filteredApplications.length} application(s) for {selectedCountry}
                </Typography>
              )}
            </Box>
            <Box>
              <Button
                startIcon={<DownloadIcon />}
                onClick={handleExportApplications}
                sx={{ mr: 1 }}
              >
                Export {selectedCountry ? selectedCountry : 'All'}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenApplicationDialog(true)}
              >
                New Application
              </Button>
            </Box>
          </Box>

          <List>
            {filteredApplications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }} component="div">
                      {selectedCountry
                        ? `No applications found for ${selectedCountry}. Add applications to see them here.`
                        : 'No applications found. Add an application to get started.'
                      }
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              filteredApplications.map((app) => (
                <ListItem
                  key={app.id}
                  divider
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => handleApplicationMenuOpen(e, app)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
                        <Typography variant="subtitle1" component="div">
                          {app.university?.name || 'Unknown University'}
                        </Typography>
                        <Chip
                          label={app.applicationStatus || 'UNKNOWN'}
                          color={
                            app.applicationStatus === 'ACCEPTED' ? 'success' :
                              app.applicationStatus === 'REJECTED' ? 'error' :
                                app.applicationStatus === 'WITHDRAWN' ? 'default' :
                                  app.applicationStatus === 'PENDING' ? 'warning' :
                                    app.applicationStatus === 'SUBMITTED' ? 'info' :
                                      app.applicationStatus === 'UNDER_REVIEW' ? 'primary' :
                                        'default'
                          }
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }} component="div">
                        <Typography variant="body2" component="div">
                          {app.courseName || 'No program specified'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }} component="div">
                          <Typography variant="caption" color="textSecondary" component="span">
                            Intake: {app.intakeTerm ? app.intakeTerm.replace('_', ' ') : 'Not specified'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" component="span">
                            Deadline: {app.applicationDeadline ? formatDate(app.applicationDeadline) : 'Not specified'}
                          </Typography>
                          {app.applicationFee && (
                            <Typography variant="caption" color="textSecondary" component="span">
                              Fee: ${app.applicationFee}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>
    );
  };

  {/* Application Menu */ }
  <Menu
    anchorEl={applicationMenuAnchor}
    open={Boolean(applicationMenuAnchor)}
    onClose={handleApplicationMenuClose}
  >
    <MenuItem onClick={() => {
      handleApplicationMenuClose();
      setOpenApplicationDialog(true);
    }}>
      <ListItemIcon>
        <EditIcon />
      </ListItemIcon>
      <ListItemText primary="Edit" />
    </MenuItem>
    <MenuItem onClick={() => handleDeleteApplication(selectedApplication?.id)}>
      <ListItemIcon>
        <DeleteIcon />
      </ListItemIcon>
      <ListItemText primary="Delete" />
    </MenuItem>
  </Menu>

  {/* Application Dialog */ }
  <Dialog
    open={openApplicationDialog}
    onClose={() => {
      setOpenApplicationDialog(false);
      setSelectedApplication(null);
    }}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>
      {selectedApplication ? 'Edit Application' : 'New Application'}
    </DialogTitle>
    <DialogContent>
      <ApplicationForm
        studentId={id}
        application={selectedApplication}
        onSubmit={async (data) => {
          try {
            if (selectedApplication) {
              await handleUpdateApplication(selectedApplication.id, data);
            } else {
              await handleAddApplication(data);
            }
            setOpenApplicationDialog(false);
            setSelectedApplication(null);
            showSnackbar('Application saved successfully', 'success');
          } catch (error) {
            console.error('Error saving application:', error);
            showSnackbar('Failed to save application', 'error');
          }
        }}
        onCancel={() => {
          setOpenApplicationDialog(false);
          setSelectedApplication(null);
        }}
        universities={universities}
        loadingUniversities={sectionLoading.universities}
      />
    </DialogContent>
  </Dialog>


  const renderQuickActions = () => {
    console.log('🎯 Rendering Quick Actions component');
    console.log('🎯 Student ID:', id);
    console.log('🎯 Student data:', student);

    return (
      <Card sx={{
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  console.log('📄 Upload Document button clicked');
                  setUploadPhaseInfo(null);
                  setFilteredDocumentTypes(DOCUMENT_TYPES);
                  setUploadData(prev => ({ ...prev, type: '' }));
                  setOpenUploadDialog(true);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Upload Document
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SchoolIcon />}
                onClick={() => {
                  console.log('🎓 New Application button clicked');
                  setOpenApplicationDialog(true);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  borderColor: theme.palette.secondary.main,
                  color: theme.palette.secondary.main,
                  '&:hover': {
                    borderColor: theme.palette.secondary.dark,
                    backgroundColor: theme.palette.secondary[50],
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                New Application
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<NoteIcon />}
                onClick={handleOpenNoteDialog}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Add Note
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => {
                  console.log('📧 Send Email button clicked');
                  setOpenEmailDialog(true);
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Send Email
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  console.log('🖨️ Print Profile button clicked');
                  handlePrintProfile();
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  py: 1.5,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Print Profile
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderStatistics = () => (
    <Card sx={{
      mt: 3,
      borderRadius: 3,
      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${theme.palette.divider}`
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Performance Metrics
        </Typography>

        {/* Response Time */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Response Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {performanceMetrics.responseTime}h
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((performanceMetrics.responseTime / 24) * 100, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.warning.main} 100%)`
              }
            }}
          />
        </Box>

        {/* Completion Rate */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Completion Rate
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {performanceMetrics.completionRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={performanceMetrics.completionRate}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              }
            }}
          />
        </Box>

        {/* Satisfaction Score */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Satisfaction Score
            </Typography>
            <Rating value={performanceMetrics.satisfactionScore} readOnly size="small" />
          </Box>
          <LinearProgress
            variant="determinate"
            value={(performanceMetrics.satisfactionScore / 5) * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.success.main} 100%)`
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Quick Stats */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                {notes.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Notes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                {activities.length}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Activities
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const handleSendEmail = async () => {
    console.log('Sending email with data:', emailData);
    try {
      setError(null);

      await axiosInstance.post(`/counselor/students/${id}/send-email`, {
        to: emailData.to || student?.email,
        subject: emailData.subject,
        message: emailData.message
      });

      console.log('Email sent successfully');
      setOpenEmailDialog(false);
      setEmailData({ subject: '', message: '', to: '' });
      showSnackbar('Email sent successfully', 'success');
    } catch (error) {
      console.error('Error sending email:', error);

      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        showSnackbar('Authentication failed. Please log in again.', 'error');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to send emails.');
        showSnackbar('You do not have permission to send emails.', 'error');
      } else if (error.response?.status === 404) {
        setError('Student not found or access denied.');
        showSnackbar('Student not found or access denied.', 'error');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
        showSnackbar(error.response.data.message, 'error');
      } else {
        setError('Failed to send email. Please try again.');
        showSnackbar('Failed to send email. Please try again.', 'error');
      }
    }
  };

  const handleEmailDataChange = (field, value) => {
    console.log('Email field changed:', field, value);
    setEmailData({ ...emailData, [field]: value });
  };

  const handleOpenNoteDialog = () => {
    console.log('📝 Opening note dialog...');
    console.log('📝 Current note text:', noteText);
    setOpenNoteDialog(true);
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="rectangular" width={200} height={40} />
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Enhanced Header with Breadcrumbs */}
        <Fade in={true} timeout={600}>
          <Box sx={{ mb: 4 }}>
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/counselor/dashboard');
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <DashboardIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Dashboard
              </Link>
              <Link
                color="inherit"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/counselor/students');
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <PersonIcon sx={{ mr: 0.5, fontSize: 20 }} />
                Students
              </Link>
              <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 0.5, fontSize: 20 }} />
                {formatStudentName(student)}
              </Typography>
            </Breadcrumbs>

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/counselor/students')}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Back to Students
                </Button>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={fetchStudentDetails}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Refresh
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Country Profile Dropdown - Show prominently if country profiles exist */}
                {countryProfiles.length > 0 && (() => {
                  // Helper function to clean country names by removing brackets, quotes, and extra characters
                  const cleanCountryName = (country) => {
                    if (!country) return '';
                    // Remove brackets, quotes, and extra whitespace
                    return country
                      .replace(/[\[\]"]/g, '') // Remove brackets and quotes
                      .trim();
                  };

                  return (
                    <>
                      <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel>View Progress by Country</InputLabel>
                        <Select
                          value={cleanCountryName(selectedCountry || countryProfiles[0]?.country || '')}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          label="View Progress by Country"
                          sx={{
                            backgroundColor: 'background.paper',
                            fontWeight: 600,
                            '& .MuiSelect-select': {
                              fontWeight: 600
                            }
                          }}
                        >
                          {(() => {

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

                            return uniqueCountryProfiles.map((profile) => {
                              const cleanedCountry = cleanCountryName(profile.country);
                              return (
                                <MenuItem key={profile.id} value={cleanedCountry}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {cleanedCountry}
                                    </Typography>
                                    {profile.preferredCountry && (
                                      <Chip
                                        label="Preferred"
                                        size="small"
                                        color="primary"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                      />
                                    )}
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                      {profile.currentPhase?.replace(/_/g, ' ') || 'Not started'}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              );
                            });
                          })()}
                        </Select>
                      </FormControl>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    </>
                  );
                })()}

                {countryProfiles.length === 0 && student?.targetCountries && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    <Typography variant="caption">
                      Creating country profiles from selected countries...
                    </Typography>
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenCountryProfileDialog(true)}
                  startIcon={<AddIcon />}
                >
                  Add Country
                </Button>

                {applications.length > 0 && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAutoCreateCountryProfiles}
                    startIcon={<TrendingUpIcon />}
                    color="secondary"
                  >
                    Auto-Create from Applications
                  </Button>
                )}

                {countryProfiles.length > 0 && <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />}

                <Button
                  variant={viewMode === 'overview' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('overview')}
                  startIcon={<DashboardIcon />}
                >
                  Overview
                </Button>
                <Button
                  variant={viewMode === 'detailed' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('detailed')}
                  startIcon={<AssessmentIcon />}
                >
                  Detailed
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setViewMode('compact')}
                  startIcon={<SpeedIcon />}
                >
                  Compact
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        <Grid container spacing={3}>
          {/* Main Student Info */}
          <Grid item xs={12}>
            {renderPersonalInfo()}
          </Grid>

          {/* Progress Bar */}
          <Grid item xs={12}>
            <StudentProgressBar
              student={student}
              documents={documents}
              applications={applications}
              countryProfiles={countryProfiles}
              selectedCountry={selectedCountry}
              universities={universities}
              onPhaseClick={handlePhaseClick}
              onInterviewRetry={handleInterviewRetry}
              onInterviewStop={handleInterviewStop}
              onCasVisaRetry={handleCasVisaRetry}
              onCasVisaStop={handleCasVisaStop}
              onVisaRetry={handleVisaRetry}
              onVisaDecisionRetry={handleVisaDecisionRetry}
              onRefresh={fetchStudentDetails}
              onUploadDocuments={(phaseInfo) => {
                setUploadPhaseInfo(phaseInfo);
                // Calculate filtered document types based on phase and country
                if (phaseInfo && phaseInfo.phaseKey && phaseInfo.country) {
                  const phaseDocInfo = getDocumentsForPhase(phaseInfo.phaseKey, phaseInfo.phaseLabel, phaseInfo.country);
                  const phaseDocuments = phaseDocInfo.documents;

                  // Use requiredDocs from phaseInfo if available (country-specific or generic)
                  const requiredDocs = phaseInfo.requiredDocs || phaseDocuments || [];

                  if (requiredDocs && requiredDocs.length > 0) {
                    // Filter DOCUMENT_TYPES to show only required document types
                    // This ensures we show proper labels for document types
                    const filteredTypes = DOCUMENT_TYPES.filter(docType =>
                      requiredDocs.includes(docType)
                    );

                    // If some required docs aren't in DOCUMENT_TYPES, add them as strings
                    const requiredSet = new Set(requiredDocs);
                    const filteredSet = new Set(filteredTypes);
                    const missingTypes = requiredDocs.filter(doc => !filteredSet.has(doc));

                    // Combine filtered types with missing types
                    const allTypes = [...filteredTypes, ...missingTypes];

                    // Add 'OTHER' option for flexibility
                    if (!allTypes.includes('OTHER')) {
                      allTypes.push('OTHER');
                    }

                    setFilteredDocumentTypes(allTypes);
                  } else if (phaseDocuments && phaseDocuments.length > 0) {
                    // Fallback to phase-specific documents
                    const allTypes = [...phaseDocuments];
                    if (!allTypes.includes('OTHER')) {
                      allTypes.push('OTHER');
                    }
                    setFilteredDocumentTypes(allTypes);
                  } else {
                    // No phase-specific documents, show all document types
                    setFilteredDocumentTypes(DOCUMENT_TYPES);
                  }
                } else if (phaseInfo && phaseInfo.requiredDocs && phaseInfo.requiredDocs.length > 0) {
                  // If we have requiredDocs but no country, use them directly
                  const allTypes = [...phaseInfo.requiredDocs];
                  if (!allTypes.includes('OTHER')) {
                    allTypes.push('OTHER');
                  }
                  setFilteredDocumentTypes(allTypes);
                } else {
                  // No phase info, show all document types
                  setFilteredDocumentTypes(DOCUMENT_TYPES);
                }
                // Reset upload data type when opening dialog
                setUploadData(prev => ({ ...prev, type: '' }));
                setOpenUploadDialog(true);
              }}
              onInterviewRetry={handleInterviewRetry}
              onInterviewStop={handleInterviewStop}
              onCasVisaRetry={handleCasVisaRetry}
              onCasVisaStop={handleCasVisaStop}
              onVisaRetry={handleVisaRetry}
              onVisaDecisionRetry={handleVisaDecisionRetry}
              onCountryChange={(newCountry) => setSelectedCountry(newCountry)}
            />
          </Grid>

          {/* Enhanced Statistics Cards */}
          <Grid item xs={12}>
            <Grow in={true} timeout={1000}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                    border: `1px solid ${theme.palette.primary[200]}`,
                    borderRadius: 3,
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {studentStats.totalDocuments}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Documents
                        </Typography>
                      </Box>
                      <DocumentIcon sx={{ color: theme.palette.primary.main, fontSize: 40 }} />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
                    border: `1px solid ${theme.palette.warning[200]}`,
                    borderRadius: 3,
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                          {studentStats.pendingDocuments}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Pending Documents
                        </Typography>
                      </Box>
                      <ScheduleIcon sx={{ color: theme.palette.warning.main, fontSize: 40 }} />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
                    border: `1px solid ${theme.palette.success[200]}`,
                    borderRadius: 3,
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                          {studentStats.completedApplications}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Completed Apps
                        </Typography>
                      </Box>
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 40 }} />
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${theme.palette.info[50]} 0%, ${theme.palette.info[100]} 100%)`,
                    border: `1px solid ${theme.palette.info[200]}`,
                    borderRadius: 3,
                    p: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                          {studentStats.progressPercentage}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Progress
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ color: theme.palette.info.main, fontSize: 40 }} />
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Grow>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={8}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }
              }}
            >
              <Tab label="Documents" />
              <Tab label="Applications" />
              <Tab label="Notes" />
              <Tab label="Timeline" />
              <Tab label="Reminders" icon={<AlarmIcon />} iconPosition="start" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {renderDocuments()}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {renderApplications()}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {renderNotes()}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {renderTimeline()}
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <ReminderList
                reminders={reminders}
                onAdd={() => setOpenReminderModal(true)}
                onEdit={(reminder) => showSnackbar('Edit functionality coming soon', 'info')}
                onDelete={handleDeleteReminder}
                loading={reminderLoading}
              />
            </TabPanel>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {renderQuickActions()}
            {renderStatistics()}
            <Box sx={{ mt: 3 }}>
              <TaskManager studentId={id} />
            </Box>
          </Grid>
        </Grid>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this student? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Document Preview Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={handleClosePreview}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              height: '90vh',
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocumentIcon color="primary" />
              <Typography variant="h6">
                {previewFileName}
              </Typography>
            </Box>
            <IconButton onClick={handleClosePreview} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
            {previewLoading ? (
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '400px'
              }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading preview...</Typography>
              </Box>
            ) : previewUrl ? (
              <Box sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'grey.100',
                minHeight: '400px'
              }}>
                {previewFileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/) ? (
                  <img
                    src={previewUrl}
                    alt={previewFileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : previewFileName.toLowerCase().match(/\.(pdf)$/) ? (
                  <iframe
                    src={previewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none'
                    }}
                    title={previewFileName}
                  />
                ) : (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <DocumentIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                    <Typography variant="h6" color="textSecondary">
                      Preview not available
                    </Typography>
                    <Typography variant="body2" color="textSecondary" textAlign="center">
                      This file type cannot be previewed. Please download the file to view it.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewUrl;
                        link.download = previewFileName;
                        link.click();
                      }}
                    >
                      Download File
                    </Button>
                  </Box>
                )}
              </Box>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Custom Phase Change Confirmation Dialog */}
        <Dialog
          open={phaseConfirmDialog.open}
          onClose={handlePhaseCancel}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{
            pb: 1,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <HelpIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {(() => {
                    // Check if we're editing the current phase (after reopening)
                    const activePhase = selectedCountry && countryProfiles.length > 0
                      ? (countryProfiles.find(p => p.country === selectedCountry)?.currentPhase || student?.currentPhase)
                      : student?.currentPhase;
                    const isEditingCurrent = phaseConfirmDialog.phase?.key === activePhase;
                    return isEditingCurrent ? 'Edit Phase' : 'Confirm Phase Change';
                  })()}
                  {selectedCountry && (
                    <Chip
                      label={selectedCountry}
                      size="small"
                      sx={{ ml: 1, backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                    />
                  )}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {(() => {
                    // Check if we're editing the current phase (after reopening)
                    const activePhase = selectedCountry && countryProfiles.length > 0
                      ? (countryProfiles.find(p => p.country === selectedCountry)?.currentPhase || student?.currentPhase)
                      : student?.currentPhase;
                    const isEditingCurrent = phaseConfirmDialog.phase?.key === activePhase;

                    if (isEditingCurrent) {
                      return selectedCountry
                        ? `Editing ${selectedCountry} application - ${phaseConfirmDialog.phase?.label || 'Current Phase'}`
                        : `Editing ${phaseConfirmDialog.phase?.label || 'Current Phase'}`;
                    } else {
                      return selectedCountry
                        ? `Moving ${selectedCountry} application to next phase`
                        : 'Moving student to next phase';
                    }
                  })()}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Box sx={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              p: 3,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1.5, fontSize: 28, color: 'rgba(255,255,255,0.9)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {phaseConfirmDialog.studentName}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SchoolIcon sx={{ mr: 1.5, fontSize: 24, color: 'rgba(255,255,255,0.9)' }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Move to: <strong>{phaseConfirmDialog.phase?.label}</strong>
                </Typography>
              </Box>

              {/* Warning if phase is not ready */}
              {phaseConfirmDialog.phase && !phaseConfirmDialog.phase.isReady && (
                <Alert
                  severity="warning"
                  sx={{
                    mb: 3,
                    background: 'rgba(255, 193, 7, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 193, 7, 0.4)',
                    '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                  }}
                  icon={<WarningIcon />}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    <strong>Warning:</strong> This phase requires additional documents. The system will check requirements when you confirm.
                  </Typography>
                </Alert>
              )}

              {/* University Selection for Application Submission Phase - Show only Shortlisted Universities */}
              {phaseConfirmDialog.phase?.key === 'APPLICATION_SUBMISSION' && (() => {
                try {
                  // Get shortlisted universities from country profile or student notes
                  let shortlist = null;

                  if (selectedCountry && countryProfiles.length > 0) {
                    const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
                    if (countryProfile?.notes) {
                      const countryNotes = typeof countryProfile.notes === 'string'
                        ? JSON.parse(countryProfile.notes)
                        : countryProfile.notes;
                      shortlist = countryNotes?.universityShortlist;
                    }
                  }

                  // Fallback to student notes
                  if (!shortlist && student?.notes) {
                    const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                    shortlist = notes?.universityShortlist;
                  }

                  // Get shortlisted universities list
                  let shortlistedUniversities = [];
                  if (shortlist && shortlist.universities && Array.isArray(shortlist.universities)) {
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
                      shortlistedUniversities = shortlist.universities.filter(u => {
                        if (!u || !u.country) return false;
                        return normalizeCountry(u.country) === normalizedSelected;
                      });
                    } else {
                      shortlistedUniversities = shortlist.universities;
                    }
                  }

                  if (shortlistedUniversities.length === 0) {
                    return (
                      <Box sx={{ mb: 3 }}>
                        <Alert
                          severity="warning"
                          sx={{
                            background: 'rgba(255, 193, 7, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(255, 193, 7, 0.4)',
                            '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                          }}
                          icon={<WarningIcon />}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedCountry
                              ? `No universities shortlisted for ${selectedCountry}. Please shortlist universities first in the University Shortlisting phase.`
                              : 'No universities shortlisted. Please shortlist universities first in the University Shortlisting phase.'
                            }
                          </Typography>
                        </Alert>
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        color: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <SchoolIcon sx={{ fontSize: 18 }} />
                        <Typography variant="body2" component="span">
                          Select Universities for Application Submission (Multiple Selection)
                        </Typography>
                        {selectedCountry && (
                          <Chip
                            label={selectedCountry}
                            size="small"
                            sx={{
                              ml: 1,
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        )}
                      </Box>
                      <Alert
                        severity="info"
                        sx={{
                          mb: 1.5,
                          background: 'rgba(33, 150, 243, 0.2)',
                          color: 'white',
                          border: '1px solid rgba(33, 150, 243, 0.4)',
                          '& .MuiAlert-icon': { color: 'rgba(33, 150, 243, 0.9)' }
                        }}
                        icon={<InfoIcon />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Select universities from your shortlisted universities to submit applications.
                        </Typography>
                      </Alert>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Select from Shortlisted Universities</InputLabel>
                        <Select
                          multiple
                          value={phaseConfirmDialog.selectedUniversities}
                          onChange={(e) => {
                            setPhaseConfirmDialog(prev => ({
                              ...prev,
                              selectedUniversities: e.target.value
                            }));
                          }}
                          input={<OutlinedInput label="Select from Shortlisted Universities" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const university = shortlistedUniversities.find(u => u.id === value);
                                return (
                                  <Chip
                                    key={value}
                                    label={university ? university.name : value}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255,255,255,0.2)',
                                      color: 'white',
                                      '& .MuiChip-deleteIcon': {
                                        color: 'rgba(255,255,255,0.7)'
                                      }
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                          sx={{
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.5)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.8)'
                            },
                            '& .MuiSelect-icon': {
                              color: 'rgba(255,255,255,0.7)'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                bgcolor: 'background.paper'
                              }
                            }
                          }}
                        >
                          {shortlistedUniversities.map((university) => (
                            <MenuItem key={university.id} value={university.id}>
                              <Checkbox
                                checked={phaseConfirmDialog.selectedUniversities.indexOf(university.id) > -1}
                                sx={{
                                  color: 'rgba(255,255,255,0.7)',
                                  '&.Mui-checked': {
                                    color: 'primary.main'
                                  }
                                }}
                              />
                              <Box>
                                <Typography variant="body1">{university.name}</Typography>
                                {university.country && (
                                  <Typography variant="caption" color="textSecondary">
                                    {university.country} {university.city ? `- ${university.city}` : ''}
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {phaseConfirmDialog.selectedUniversities.length > 0 && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                          {phaseConfirmDialog.selectedUniversities.length} universit{phaseConfirmDialog.selectedUniversities.length === 1 ? 'y' : 'ies'} selected for application submission
                        </Typography>
                      )}
                    </Box>
                  );
                } catch (e) {
                  console.error('Error loading shortlisted universities for Application Submission:', e);
                  return (
                    <Box sx={{ mb: 3 }}>
                      <Alert
                        severity="error"
                        sx={{
                          background: 'rgba(244, 67, 54, 0.2)',
                          color: 'white',
                          border: '1px solid rgba(244, 67, 54, 0.4)',
                          '& .MuiAlert-icon': { color: 'rgba(244, 67, 54, 0.9)' }
                        }}
                        icon={<WarningIcon />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Error loading shortlisted universities. Please try again.
                        </Typography>
                      </Alert>
                    </Box>
                  );
                }
              })()}

              {/* University Selection for Initial Payment Phase - Select ONE university from those with offers, or fallback to shortlisted */}
              {phaseConfirmDialog.phase?.key === 'INITIAL_PAYMENT' && (() => {
                try {
                  // Try to get data from country profile if country is selected, otherwise from student notes
                  let offers = null;
                  let shortlist = null;

                  if (selectedCountry && countryProfiles.length > 0) {
                    const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
                    if (countryProfile?.notes) {
                      const countryNotes = typeof countryProfile.notes === 'string' ? JSON.parse(countryProfile.notes) : countryProfile.notes;
                      offers = countryNotes?.universitiesWithOffers;
                      shortlist = countryNotes?.universityShortlist;
                    }
                  }

                  // Fallback to student notes for backward compatibility
                  if (student?.notes) {
                    const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                    if (!offers) offers = notes?.universitiesWithOffers;
                    if (!shortlist) shortlist = notes?.universityShortlist;
                  }

                  // Determine which universities to show: offers first, then fallback to shortlisted
                  let universitiesToShow = null;
                  let isFallback = false;

                  if (offers && offers.universities && offers.universities.length > 0) {
                    // Filter by country if country is selected (with normalization)
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
                      universitiesToShow = offers.universities.filter(u => {
                        if (!u || !u.country) return false;
                        return normalizeCountry(u.country) === normalizedSelected;
                      });
                    } else {
                      universitiesToShow = offers.universities;
                    }
                    isFallback = false;
                  } else if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
                    // Filter by country if country is selected (with normalization)
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
                      universitiesToShow = shortlist.universities.filter(u => {
                        if (!u || !u.country) return false;
                        return normalizeCountry(u.country) === normalizedSelected;
                      });
                    } else {
                      universitiesToShow = shortlist.universities;
                    }
                    isFallback = true;
                  }

                  if (universitiesToShow && universitiesToShow.length > 0) {
                    return (
                      <Box sx={{ mb: 3 }}>
                        {isFallback && (
                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              background: 'rgba(33, 150, 243, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(33, 150, 243, 0.4)',
                              '& .MuiAlert-icon': { color: 'rgba(33, 150, 243, 0.9)' }
                            }}
                            icon={<InfoIcon />}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              No universities with offers found. Showing shortlisted universities from Application Submission phase.
                            </Typography>
                          </Alert>
                        )}
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          color: 'rgba(255,255,255,0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <SchoolIcon sx={{ fontSize: 18 }} />
                          Select University for Initial Payment (Select One)
                        </Typography>
                        <FormControl fullWidth required>
                          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Select University</InputLabel>
                          <Select
                            value={phaseConfirmDialog.selectedUniversity || ''}
                            onChange={(e) => {
                              setPhaseConfirmDialog(prev => ({
                                ...prev,
                                selectedUniversity: e.target.value
                              }));
                            }}
                            input={<OutlinedInput label="Select University" />}
                            sx={{
                              background: 'rgba(255,255,255,0.1)',
                              borderRadius: 2,
                              border: '1px solid rgba(255,255,255,0.3)',
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.5)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.8)'
                              },
                              '& .MuiSelect-icon': {
                                color: 'rgba(255,255,255,0.7)'
                              }
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  bgcolor: 'background.paper'
                                }
                              }
                            }}
                          >
                            {universitiesToShow.map((university) => (
                              <MenuItem key={university.id} value={university.id}>
                                <Box>
                                  <Typography variant="body1">{university.name}</Typography>
                                  {university.country && (
                                    <Typography variant="caption" color="textSecondary">
                                      {university.country} {university.city ? `- ${university.city}` : ''}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {phaseConfirmDialog.selectedUniversity && (() => {
                          const selected = universitiesToShow.find(u => u.id === phaseConfirmDialog.selectedUniversity);
                          return selected ? (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                              Selected: <strong>{selected.name}</strong>
                            </Typography>
                          ) : null;
                        })()}
                        {!phaseConfirmDialog.selectedUniversity && (
                          <Alert
                            severity="warning"
                            sx={{
                              mt: 1.5,
                              background: 'rgba(255, 193, 7, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(255, 193, 7, 0.4)',
                              '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                            }}
                            icon={<WarningIcon />}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Please select a university to proceed with initial payment.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    );
                  } else {
                    // No universities found at all
                    return (
                      <Box sx={{ mb: 3 }}>
                        <Alert
                          severity="error"
                          sx={{
                            background: 'rgba(244, 67, 54, 0.2)',
                            color: 'white',
                            border: '1px solid rgba(244, 67, 54, 0.4)',
                            '& .MuiAlert-icon': { color: 'rgba(244, 67, 54, 0.9)' }
                          }}
                          icon={<WarningIcon />}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            No universities found. Please shortlist universities first in the University Shortlisting phase.
                          </Typography>
                        </Alert>
                      </Box>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing universities:', e);
                  return null;
                }
                return null;
              })()}

              {/* University Selection for Enrollment Phase - Select ONE university from Offer Received universities for the selected country (fallback to shortlisted) */}
              {phaseConfirmDialog.phase?.key === 'ENROLLMENT' && (() => {
                try {
                  let offers = null;
                  let shortlist = null;

                  if (selectedCountry && countryProfiles.length > 0) {
                    const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
                    if (countryProfile?.notes) {
                      const countryNotes = typeof countryProfile.notes === 'string' ? JSON.parse(countryProfile.notes) : countryProfile.notes;
                      offers = countryNotes?.universitiesWithOffers;
                      shortlist = countryNotes?.universityShortlist;
                    }
                  }

                  // Fallback to student notes for backward compatibility
                  if (student?.notes) {
                    const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                    if (!offers) offers = notes?.universitiesWithOffers;
                    if (!shortlist) shortlist = notes?.universityShortlist;
                  }

                  // Prefer offers list; fallback to shortlist if needed
                  let universitiesToShow = null;
                  let isFallback = false;

                  if (offers && offers.universities && offers.universities.length > 0) {
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
                      universitiesToShow = offers.universities.filter(u => {
                        if (!u || !u.country) return false;
                        return normalizeCountry(u.country) === normalizedSelected;
                      });
                    } else {
                      universitiesToShow = offers.universities;
                    }
                    isFallback = false;
                  } else if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
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
                      universitiesToShow = shortlist.universities.filter(u => {
                        if (!u || !u.country) return false;
                        return normalizeCountry(u.country) === normalizedSelected;
                      });
                    } else {
                      universitiesToShow = shortlist.universities;
                    }
                    isFallback = true;
                  }

                  if (universitiesToShow && universitiesToShow.length > 0) {
                    return (
                      <Box sx={{ mb: 3 }}>
                        {isFallback && (
                          <Alert
                            severity="info"
                            sx={{
                              mb: 2,
                              background: 'rgba(33, 150, 243, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(33, 150, 243, 0.4)',
                              '& .MuiAlert-icon': { color: 'rgba(33, 150, 243, 0.9)' }
                            }}
                            icon={<InfoIcon />}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              No universities with offers found. Showing shortlisted universities as fallback.
                            </Typography>
                          </Alert>
                        )}
                        <Typography variant="body2" sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          color: 'rgba(255,255,255,0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <SchoolIcon sx={{ fontSize: 18 }} />
                          Select University for Enrollment (Select One)
                        </Typography>
                        <FormControl fullWidth required>
                          <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Select University</InputLabel>
                          <Select
                            value={phaseConfirmDialog.selectedUniversity || ''}
                            onChange={(e) => {
                              setPhaseConfirmDialog(prev => ({
                                ...prev,
                                selectedUniversity: e.target.value
                              }));
                            }}
                            input={<OutlinedInput label="Select University" />}
                            sx={{
                              background: 'rgba(255,255,255,0.1)',
                              borderRadius: 2,
                              border: '1px solid rgba(255,255,255,0.3)',
                              color: 'white',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.3)'
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.5)'
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.8)'
                              },
                              '& .MuiSelect-icon': {
                                color: 'rgba(255,255,255,0.7)'
                              }
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  bgcolor: 'background.paper'
                                }
                              }
                            }}
                          >
                            {universitiesToShow.map((university) => (
                              <MenuItem key={university.id} value={university.id}>
                                <Box>
                                  <Typography variant="body1">{university.name}</Typography>
                                  {university.country && (
                                    <Typography variant="caption" color="textSecondary">
                                      {university.country} {university.city ? `- ${university.city}` : ''}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {phaseConfirmDialog.selectedUniversity && (() => {
                          const selected = universitiesToShow.find(u => u.id === phaseConfirmDialog.selectedUniversity);
                          return selected ? (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                              Selected: <strong>{selected.name}</strong>
                            </Typography>
                          ) : null;
                        })()}
                        {!phaseConfirmDialog.selectedUniversity && (
                          <Alert
                            severity="warning"
                            sx={{
                              mt: 1.5,
                              background: 'rgba(255, 193, 7, 0.2)',
                              color: 'white',
                              border: '1px solid rgba(255, 193, 7, 0.4)',
                              '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                            }}
                            icon={<WarningIcon />}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Please select a university to proceed with enrollment.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    );
                  }

                  return (
                    <Box sx={{ mb: 3 }}>
                      <Alert
                        severity="error"
                        sx={{
                          background: 'rgba(244, 67, 54, 0.2)',
                          color: 'white',
                          border: '1px solid rgba(244, 67, 54, 0.4)',
                          '& .MuiAlert-icon': { color: 'rgba(244, 67, 54, 0.9)' }
                        }}
                        icon={<WarningIcon />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedCountry
                            ? `No Offer Received universities found for ${selectedCountry}. Please mark offers first in the Offer Received phase.`
                            : 'No Offer Received universities found. Please mark offers first in the Offer Received phase.'
                          }
                        </Typography>
                      </Alert>
                    </Box>
                  );
                } catch (e) {
                  console.error('Error preparing enrollment universities:', e);
                  return null;
                }
              })()}

              {/* University Selection for Offer Received Phase (including Australia Offer Letter) - Select from Application Submission Universities */}
              {(phaseConfirmDialog.phase?.key === 'OFFER_RECEIVED' ||
                phaseConfirmDialog.phase?.key === 'OFFER_LETTER_AUSTRALIA') && (() => {
                  try {
                    // Try to get universities from Application Submission phase first
                    let applicationUniversities = null;
                    let shortlist = null;

                    if (selectedCountry && countryProfiles.length > 0) {
                      const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
                      if (countryProfile?.notes) {
                        const countryNotes = typeof countryProfile.notes === 'string'
                          ? JSON.parse(countryProfile.notes)
                          : countryProfile.notes;
                        applicationUniversities = countryNotes?.applicationSubmissionUniversities;
                        shortlist = countryNotes?.universityShortlist;
                      }
                    }

                    // Fallback to student notes
                    if (!applicationUniversities && student?.notes) {
                      const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                      applicationUniversities = notes?.applicationSubmissionUniversities;
                      if (!shortlist) shortlist = notes?.universityShortlist;
                    }

                    // Use Application Submission universities if available, otherwise fallback to shortlist
                    let universitiesList = [];
                    if (applicationUniversities?.universities && Array.isArray(applicationUniversities.universities)) {
                      universitiesList = applicationUniversities.universities;
                    } else if (shortlist?.universities) {
                      universitiesList = Array.isArray(shortlist.universities)
                        ? shortlist.universities
                        : (shortlist.universities ? [shortlist.universities] : []);
                    }

                    if (universitiesList.length > 0) {
                      return (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: 'rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <SchoolIcon sx={{ fontSize: 18 }} />
                            Select Universities with Offers (Multiple Selection)
                          </Typography>
                          {applicationUniversities ? (
                            <Alert
                              severity="info"
                              sx={{
                                mb: 1.5,
                                background: 'rgba(33, 150, 243, 0.2)',
                                color: 'white',
                                border: '1px solid rgba(33, 150, 243, 0.4)',
                                '& .MuiAlert-icon': { color: 'rgba(33, 150, 243, 0.9)' }
                              }}
                              icon={<InfoIcon />}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Showing universities from Application Submission phase. Select which ones received offers.
                              </Typography>
                            </Alert>
                          ) : (
                            <Alert
                              severity="warning"
                              sx={{
                                mb: 1.5,
                                background: 'rgba(255, 193, 7, 0.2)',
                                color: 'white',
                                border: '1px solid rgba(255, 193, 7, 0.4)',
                                '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                              }}
                              icon={<WarningIcon />}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                No universities from Application Submission phase found. Showing shortlisted universities as fallback.
                              </Typography>
                            </Alert>
                          )}
                          <FormControl fullWidth>
                            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Select Universities with Offers</InputLabel>
                            <Select
                              multiple
                              value={phaseConfirmDialog.selectedUniversities}
                              onChange={(e) => {
                                setPhaseConfirmDialog(prev => ({
                                  ...prev,
                                  selectedUniversities: e.target.value
                                }));
                              }}
                              input={<OutlinedInput label="Select Universities with Offers" />}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => {
                                    const university = universitiesList.find(u => u.id === value);
                                    return (
                                      <Chip
                                        key={value}
                                        label={university ? university.name : value}
                                        size="small"
                                        sx={{
                                          backgroundColor: 'rgba(255,255,255,0.2)',
                                          color: 'white',
                                          '& .MuiChip-deleteIcon': {
                                            color: 'rgba(255,255,255,0.7)'
                                          }
                                        }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                              sx={{
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: 2,
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.3)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(255,255,255,0.8)'
                                },
                                '& .MuiSelect-icon': {
                                  color: 'rgba(255,255,255,0.7)'
                                }
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    maxHeight: 300,
                                    bgcolor: 'background.paper'
                                  }
                                }
                              }}
                            >
                              {universitiesList.map((university) => (
                                <MenuItem key={university.id} value={university.id}>
                                  <Checkbox
                                    checked={phaseConfirmDialog.selectedUniversities.indexOf(university.id) > -1}
                                    sx={{
                                      color: 'rgba(255,255,255,0.7)',
                                      '&.Mui-checked': {
                                        color: 'primary.main'
                                      }
                                    }}
                                  />
                                  <Box>
                                    <Typography variant="body1">{university.name}</Typography>
                                    {university.country && (
                                      <Typography variant="caption" color="textSecondary">
                                        {university.country} {university.city ? `- ${university.city}` : ''}
                                      </Typography>
                                    )}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {phaseConfirmDialog.selectedUniversities.length > 0 && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                              {phaseConfirmDialog.selectedUniversities.length} universit{phaseConfirmDialog.selectedUniversities.length === 1 ? 'y' : 'ies'} selected with offers
                            </Typography>
                          )}
                          {phaseConfirmDialog.selectedUniversities.length === 0 && (
                            <Alert
                              severity="info"
                              sx={{
                                mt: 1.5,
                                background: 'rgba(33, 150, 243, 0.2)',
                                color: 'white',
                                border: '1px solid rgba(33, 150, 243, 0.4)',
                                '& .MuiAlert-icon': { color: 'rgba(33, 150, 243, 0.9)' }
                              }}
                              icon={<InfoIcon />}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                Please select at least one university that has sent an offer.
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      );
                    }
                  } catch (e) {
                    return null;
                  }
                  return null;
                })()}

              {/* University Selection for University Shortlisting Phase */}
              {phaseConfirmDialog.phase?.key === 'UNIVERSITY_SHORTLISTING' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SchoolIcon sx={{ fontSize: 18 }} />
                    Select Universities (Multiple Selection)
                    {selectedCountry && (
                      <Chip
                        label={selectedCountry}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    )}
                  </Typography>
                  {!selectedCountry ? (
                    <Alert severity="warning" sx={{ mb: 2, background: 'rgba(255, 193, 7, 0.2)', color: 'white', border: '1px solid rgba(255, 193, 7, 0.4)' }}>
                      Please select a country first to view universities for that country.
                    </Alert>
                  ) : (
                    <>
                      <FormControl fullWidth>
                        <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Universities for {selectedCountry}</InputLabel>
                        <Select
                          multiple
                          value={phaseConfirmDialog.selectedUniversities}
                          onChange={(e) => {
                            setPhaseConfirmDialog(prev => ({
                              ...prev,
                              selectedUniversities: e.target.value
                            }));
                          }}
                          input={<OutlinedInput label={`Universities for ${selectedCountry}`} />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const university = universities.find(u => u.id === value);
                                return (
                                  <Chip
                                    key={value}
                                    label={university ? university.name : value}
                                    size="small"
                                    sx={{
                                      backgroundColor: 'rgba(255,255,255,0.2)',
                                      color: 'white',
                                      '& .MuiChip-deleteIcon': {
                                        color: 'rgba(255,255,255,0.7)'
                                      }
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                          sx={{
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.5)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.8)'
                            },
                            '& .MuiSelect-icon': {
                              color: 'rgba(255,255,255,0.7)'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                bgcolor: 'background.paper'
                              }
                            }
                          }}
                        >
                          {sectionLoading.universities ? (
                            <MenuItem disabled>
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                              Loading universities...
                            </MenuItem>
                          ) : (() => {
                            // Filter universities by selected country
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
                            const filteredUniversities = universities.filter(u => {
                              if (!u || !u.country) return false;
                              return normalizeCountry(u.country) === normalizedSelected;
                            });

                            if (filteredUniversities.length === 0) {
                              return (
                                <MenuItem disabled>
                                  No universities available for {selectedCountry}
                                </MenuItem>
                              );
                            }

                            return filteredUniversities.map((university) => (
                              <MenuItem key={university.id} value={university.id}>
                                <Checkbox
                                  checked={phaseConfirmDialog.selectedUniversities.indexOf(university.id) > -1}
                                  sx={{
                                    color: 'rgba(255,255,255,0.7)',
                                    '&.Mui-checked': {
                                      color: 'primary.main'
                                    }
                                  }}
                                />
                                <Box>
                                  <Typography variant="body1">{university.name}</Typography>
                                  {university.country && (
                                    <Typography variant="caption" color="textSecondary">
                                      {university.country}
                                    </Typography>
                                  )}
                                </Box>
                              </MenuItem>
                            ));
                          })()}
                        </Select>
                      </FormControl>
                      {phaseConfirmDialog.selectedUniversities.length > 0 && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                          {phaseConfirmDialog.selectedUniversities.length} universit{phaseConfirmDialog.selectedUniversities.length === 1 ? 'y' : 'ies'} selected
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Remarks Text Field */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  mb: 1.5,
                  color: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <NoteIcon sx={{ fontSize: 18 }} />
                  Phase Change Remarks (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add any remarks about this phase change (e.g., reason for change, next steps, etc.)"
                  value={phaseConfirmDialog.remarks}
                  onChange={handleRemarksChange}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        background: 'rgba(255,255,255,0.15)'
                      },
                      '&.Mui-focused': {
                        borderColor: 'rgba(255,255,255,0.8)',
                        background: 'rgba(255,255,255,0.2)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-focused': {
                        color: 'rgba(255,255,255,0.9)'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.6)',
                        opacity: 1
                      }
                    }
                  }}
                />
              </Box>

              {/* Interview Status Selection - Show for Interview phase */}
              {phaseConfirmDialog.phase?.key === 'INTERVIEW' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PersonIcon sx={{ fontSize: 18 }} />
                    Interview Decision
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={phaseConfirmDialog.interviewStatus === 'APPROVED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          interviewStatus: 'APPROVED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.interviewStatus === 'APPROVED'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.interviewStatus === 'APPROVED'
                          ? 'none'
                          : '2px solid rgba(76, 175, 80, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.interviewStatus === 'APPROVED'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                            : 'rgba(76, 175, 80, 0.2)',
                          borderColor: 'rgba(76, 175, 80, 0.8)'
                        }
                      }}
                      startIcon={<CheckCircleIcon />}
                    >
                      Approved
                    </Button>
                    <Button
                      variant={phaseConfirmDialog.interviewStatus === 'REFUSED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          interviewStatus: 'REFUSED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.interviewStatus === 'REFUSED'
                          ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.interviewStatus === 'REFUSED'
                          ? 'none'
                          : '2px solid rgba(244, 67, 54, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.interviewStatus === 'REFUSED'
                            ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                            : 'rgba(244, 67, 54, 0.2)',
                          borderColor: 'rgba(244, 67, 54, 0.8)'
                        }
                      }}
                      startIcon={<WarningIcon />}
                    >
                      Refused
                    </Button>
                  </Box>
                  {!phaseConfirmDialog.interviewStatus && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                      }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Please select an interview decision (Approved or Refused) to proceed.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* CAS Process Status Selection - Show for CAS Process phase */}
              {phaseConfirmDialog.phase?.key === 'CAS_VISA' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 18 }} />
                    CAS Process Decision
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={phaseConfirmDialog.casVisaStatus === 'APPROVED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          casVisaStatus: 'APPROVED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.casVisaStatus === 'APPROVED'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.casVisaStatus === 'APPROVED'
                          ? 'none'
                          : '2px solid rgba(76, 175, 80, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.casVisaStatus === 'APPROVED'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                            : 'rgba(76, 175, 80, 0.2)',
                          borderColor: 'rgba(76, 175, 80, 0.8)'
                        }
                      }}
                      startIcon={<CheckCircleIcon />}
                    >
                      Approved
                    </Button>
                    <Button
                      variant={phaseConfirmDialog.casVisaStatus === 'REFUSED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          casVisaStatus: 'REFUSED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.casVisaStatus === 'REFUSED'
                          ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.casVisaStatus === 'REFUSED'
                          ? 'none'
                          : '2px solid rgba(244, 67, 54, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.casVisaStatus === 'REFUSED'
                            ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                            : 'rgba(244, 67, 54, 0.2)',
                          borderColor: 'rgba(244, 67, 54, 0.8)'
                        }
                      }}
                      startIcon={<WarningIcon />}
                    >
                      Refused
                    </Button>
                  </Box>
                  {!phaseConfirmDialog.casVisaStatus && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                      }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Please select a CAS Process decision (Approved or Refused) to proceed.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Visa Decision Status Selection - Show for Visa Decision phase */}
              {(phaseConfirmDialog.phase?.key === 'VISA_DECISION' || phaseConfirmDialog.phase?.key?.includes('VISA_DECISION')) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <VerifiedIcon sx={{ fontSize: 18 }} />
                    Visa Decision
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={phaseConfirmDialog.visaDecisionStatus === 'APPROVED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          visaDecisionStatus: 'APPROVED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.visaDecisionStatus === 'APPROVED'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.visaDecisionStatus === 'APPROVED'
                          ? 'none'
                          : '2px solid rgba(76, 175, 80, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.visaDecisionStatus === 'APPROVED'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                            : 'rgba(76, 175, 80, 0.2)',
                          borderColor: 'rgba(76, 175, 80, 0.8)'
                        }
                      }}
                      startIcon={<CheckCircleIcon />}
                    >
                      Approved
                    </Button>
                    <Button
                      variant={phaseConfirmDialog.visaDecisionStatus === 'REJECTED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          visaDecisionStatus: 'REJECTED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.visaDecisionStatus === 'REJECTED'
                          ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.visaDecisionStatus === 'REJECTED'
                          ? 'none'
                          : '2px solid rgba(244, 67, 54, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.visaDecisionStatus === 'REJECTED'
                            ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                            : 'rgba(244, 67, 54, 0.2)',
                          borderColor: 'rgba(244, 67, 54, 0.8)'
                        }
                      }}
                      startIcon={<CancelIcon />}
                    >
                      Rejected
                    </Button>
                  </Box>
                  {!phaseConfirmDialog.visaDecisionStatus && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                      }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Please select a Visa Decision (Approved or Rejected) to proceed.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Visa Process Status Selection - Show for Visa Process phase */}
              {phaseConfirmDialog.phase?.key === 'VISA_APPLICATION' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FlightIcon sx={{ fontSize: 18 }} />
                    Visa Process Decision
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                    <Button
                      variant={phaseConfirmDialog.visaStatus === 'APPROVED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          visaStatus: 'APPROVED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.visaStatus === 'APPROVED'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.visaStatus === 'APPROVED'
                          ? 'none'
                          : '2px solid rgba(76, 175, 80, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.visaStatus === 'APPROVED'
                            ? 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)'
                            : 'rgba(76, 175, 80, 0.2)',
                          borderColor: 'rgba(76, 175, 80, 0.8)'
                        }
                      }}
                      startIcon={<CheckCircleIcon />}
                    >
                      Approved
                    </Button>
                    <Button
                      variant={phaseConfirmDialog.visaStatus === 'REFUSED' ? 'contained' : 'outlined'}
                      onClick={() => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          visaStatus: 'REFUSED'
                        }));
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 120,
                        borderRadius: 2,
                        py: 1.5,
                        background: phaseConfirmDialog.visaStatus === 'REFUSED'
                          ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                          : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: phaseConfirmDialog.visaStatus === 'REFUSED'
                          ? 'none'
                          : '2px solid rgba(244, 67, 54, 0.5)',
                        '&:hover': {
                          background: phaseConfirmDialog.visaStatus === 'REFUSED'
                            ? 'linear-gradient(45deg, #f44336 30%, #d32f2f 90%)'
                            : 'rgba(244, 67, 54, 0.2)',
                          borderColor: 'rgba(244, 67, 54, 0.8)'
                        }
                      }}
                      startIcon={<WarningIcon />}
                    >
                      Refused
                    </Button>
                  </Box>
                  {!phaseConfirmDialog.visaStatus && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                      }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Please select a Visa Process decision (Approved or Refused) to proceed.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Financial Option Selection - Show for Financial & TB Test phase */}
              {phaseConfirmDialog.phase?.key === 'FINANCIAL_TB_TEST' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <EventIcon sx={{ fontSize: 18 }} />
                    Select Financial Option
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Financial Option</InputLabel>
                    <Select
                      value={phaseConfirmDialog.financialOption || ''}
                      onChange={(e) => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          financialOption: e.target.value
                        }));
                      }}
                      input={<OutlinedInput label="Financial Option" />}
                      sx={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.3)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.8)'
                        },
                        '& .MuiSelect-icon': {
                          color: 'rgba(255,255,255,0.7)'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                            bgcolor: 'background.paper'
                          }
                        }
                      }}
                    >
                      <MenuItem value="LOAN">Loan</MenuItem>
                      <MenuItem value="SELF_AMOUNT">Self amount</MenuItem>
                      <MenuItem value="OTHERS">Others</MenuItem>
                    </Select>
                  </FormControl>
                  {!phaseConfirmDialog.financialOption && (
                    <Alert
                      severity="warning"
                      sx={{
                        mt: 1.5,
                        background: 'rgba(255, 193, 7, 0.2)',
                        color: 'white',
                        border: '1px solid rgba(255, 193, 7, 0.4)',
                        '& .MuiAlert-icon': { color: 'rgba(255, 193, 7, 0.9)' }
                      }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Please select a financial option to proceed.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Payment Fields Selection - Show for Payment Phases */}
              {(PAYMENT_PHASES.includes(phaseConfirmDialog.phase?.key) || phaseConfirmDialog.phase?.key?.includes('PAYMENT') || phaseConfirmDialog.phase?.key?.includes('FEE') || (phaseConfirmDialog.phase?.key?.includes('DEPOSIT') && phaseConfirmDialog.phase?.key !== 'APPLICATION_SUBMISSION')) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    color: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 18 }} />
                    Payment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Payment Amount"
                        value={phaseConfirmDialog.paymentAmount || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhaseConfirmDialog(prev => ({
                            ...prev,
                            paymentAmount: val
                          }));
                        }}
                        InputLabelProps={{
                          style: { color: 'rgba(255,255,255,0.7)' }
                        }}
                        InputProps={{
                          sx: {
                            color: 'white',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.3)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.5)'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255,255,255,0.8)'
                            }
                          }
                        }}
                        placeholder="Enter amount"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block' }}>Payment Type</Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {['INITIAL', 'HALF', 'COMPLETE'].map((type) => (
                          <Button
                            key={type}
                            variant={phaseConfirmDialog.paymentType === type ? 'contained' : 'outlined'}
                            onClick={() => setPhaseConfirmDialog(prev => ({ ...prev, paymentType: type }))}
                            sx={{
                              flex: 1,
                              minWidth: 'auto',
                              textTransform: 'capitalize',
                              color: 'white',
                              borderColor: phaseConfirmDialog.paymentType === type ? 'transparent' : 'rgba(255,255,255,0.3)',
                              background: phaseConfirmDialog.paymentType === type ? 'rgba(255,255,255,0.2)' : 'transparent',
                              '&:hover': {
                                background: phaseConfirmDialog.paymentType === type ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                                borderColor: 'rgba(255,255,255,0.5)'
                              }
                            }}
                          >
                            {type.toLowerCase()}
                          </Button>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <Alert
                severity="info"
                sx={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '& .MuiAlert-icon': { color: 'rgba(255,255,255,0.9)' }
                }}
                icon={<InfoIcon />}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  This action will update the student's current phase and may trigger automated workflows.
                </Typography>
              </Alert>
            </Box>
          </DialogContent>

          <DialogActions sx={{
            px: 3,
            py: 2,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)'
          }}>
            <Button
              onClick={handlePhaseCancel}
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePhaseConfirm}
              variant="contained"
              disabled={
                (phaseConfirmDialog.phase?.key === 'INITIAL_PAYMENT' && !phaseConfirmDialog.selectedUniversity) ||
                (phaseConfirmDialog.phase?.key === 'INTERVIEW' && !phaseConfirmDialog.interviewStatus) ||
                (phaseConfirmDialog.phase?.key === 'CAS_VISA' && !phaseConfirmDialog.casVisaStatus) ||
                (phaseConfirmDialog.phase?.key === 'VISA_APPLICATION' && !phaseConfirmDialog.visaStatus) ||
                (phaseConfirmDialog.phase?.key === 'FINANCIAL_TB_TEST' && !phaseConfirmDialog.financialOption) ||
                ((phaseConfirmDialog.phase?.key === 'VISA_DECISION' || phaseConfirmDialog.phase?.key?.includes('VISA_DECISION')) && !phaseConfirmDialog.visaDecisionStatus) ||
                ((PAYMENT_PHASES.includes(phaseConfirmDialog.phase?.key) || phaseConfirmDialog.phase?.key?.includes('PAYMENT') || phaseConfirmDialog.phase?.key?.includes('FEE') || (phaseConfirmDialog.phase?.key?.includes('DEPOSIT') && phaseConfirmDialog.phase?.key !== 'APPLICATION_SUBMISSION')) && (!phaseConfirmDialog.paymentAmount || !phaseConfirmDialog.paymentType))
              }
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                color: 'white',
                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px 2px rgba(76, 175, 80, .4)'
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
              startIcon={<CheckCircleIcon />}
            >
              {(() => {
                // Check if we're editing the current phase (after reopening)
                const activePhase = selectedCountry && countryProfiles.length > 0
                  ? (countryProfiles.find(p => p.country === selectedCountry)?.currentPhase || student?.currentPhase)
                  : student?.currentPhase;
                const isEditingCurrent = phaseConfirmDialog.phase?.key === activePhase;
                return isEditingCurrent ? 'Update Phase' : 'Confirm Phase Change';
              })()}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Phase Change Error Dialog */}
        <PhaseChangeErrorDialog
          open={phaseErrorDialog.open}
          onClose={handlePhaseErrorClose}
          errorData={phaseErrorDialog.errorData}
          onGoToDocuments={handleGoToDocumentsFromPhaseError}
        />

        {/* Country Profile Creation Dialog */}
        <Dialog
          open={openCountryProfileDialog}
          onClose={() => {
            setOpenCountryProfileDialog(false);
            setNewCountryName('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <TrendingUpIcon />
            Create Country Profile
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a new country profile to track application progress for a specific country.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Country</InputLabel>
              <Select
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                label="Select Country"
              >
                {availableCountries
                  .filter(country => !countryProfiles.some(p => p.country === country))
                  .map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                {availableCountries.filter(country => !countryProfiles.some(p => p.country === country)).length === 0 && (
                  <MenuItem disabled>All available countries have profiles</MenuItem>
                )}
              </Select>
            </FormControl>
            {countryProfiles.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Existing profiles:</strong> {countryProfiles.map(p => p.country).join(', ')}
                </Typography>
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => {
                setOpenCountryProfileDialog(false);
                setNewCountryName('');
              }}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCountryProfile}
              variant="contained"
              disabled={!newCountryName.trim()}
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #45a049 30%, #4CAF50 90%)'
                }
              }}
            >
              Create Profile
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Dialog */}
        <Dialog
          open={openEmailDialog}
          onClose={() => setOpenEmailDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EmailIcon />
            Send Email to Student
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="To"
                  value={emailData.to || student?.email || ''}
                  onChange={(e) => handleEmailDataChange('to', e.target.value)}
                  placeholder="student@aoadmissionhub.com"
                  helperText="Student's email address"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={emailData.subject}
                  onChange={(e) => handleEmailDataChange('subject', e.target.value)}
                  placeholder="Important update regarding your application"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Message"
                  value={emailData.message}
                  onChange={(e) => handleEmailDataChange('message', e.target.value)}
                  placeholder="Dear [Student Name],&#10;&#10;I hope this email finds you well..."
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setOpenEmailDialog(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              variant="contained"
              disabled={!emailData.subject.trim() || !emailData.message.trim()}
              startIcon={<EmailIcon />}
            >
              Send Email
            </Button>
          </DialogActions>
        </Dialog>

        {/* File Size Warning Dialog */}
        <Dialog
          open={openFileSizeDialog}
          onClose={() => setOpenFileSizeDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <WarningIcon />
            File Size Warning
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <WarningIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Large File Detected
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                The file you selected is larger than 1MB and may take longer to upload.
              </Typography>

              <Box sx={{
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                mb: 3
              }}>
                <Typography variant="subtitle2" color="text.secondary">
                  File Details:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  📄 {pendingFile?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📏 Size: {pendingFile ? formatFileSize(pendingFile.size) : ''}
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Recommendation:</strong> For better performance, consider compressing the file or using a smaller version if possible.
                </Typography>
              </Alert>

              <Typography variant="body2" color="text.secondary">
                Do you want to proceed with uploading this file?
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button
              onClick={() => {
                setOpenFileSizeDialog(false);
                setPendingFile(null);
              }}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingFile) {
                  // Validate the file before proceeding
                  const validationError = getFileValidationError(pendingFile, 'documents', 'document');

                  if (validationError) {
                    setError(validationError);
                    showSnackbar(validationError, 'error');
                    setOpenFileSizeDialog(false);
                    setPendingFile(null);
                    return;
                  }

                  setUploadData({
                    ...uploadData,
                    file: pendingFile,
                    fileSize: formatFileSize(pendingFile.size)
                  });
                  setOpenFileSizeDialog(false);
                  setPendingFile(null);
                  showSnackbar('File selected. You can now upload it.', 'success');
                }
              }}
              variant="contained"
              color="warning"
              startIcon={<AttachFileIcon />}
            >
              Proceed with Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Chat Dialog */}
        <StudentChat
          open={openChatDialog}
          onClose={() => {
            setOpenChatDialog(false);
            // Refresh unread count when closing to update the badge
            setTimeout(() => {
              fetchUnreadCount();
            }, 500);
          }}
          student={student}
        />

        {/* Reminder Modal */}
        <ReminderModal
          open={openReminderModal}
          onClose={() => setOpenReminderModal(false)}
          onSave={handleCreateReminder}
          studentName={formatStudentName(student)}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}

export default StudentDetails; 