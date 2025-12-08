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
  Info as InfoIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import ApplicationForm from '../../components/counselor/ApplicationForm';
import TaskManager from '../../components/counselor/TaskManager';
import AcademicRecords from '../../components/counselor/AcademicRecords';
import StudentProgressBar from '../../components/counselor/StudentProgressBar';
import PhaseChangeErrorDialog from '../../components/common/PhaseChangeErrorDialog';
import StudentChat from '../../components/counselor/StudentChat';

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
  'OTHER'
];

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
  'ENROLLMENT': ['PASSPORT', 'ACADEMIC_TRANSCRIPT', 'ENGLISH_TEST_SCORE', 'FINANCIAL_STATEMENT', 'MEDICAL_CERTIFICATE']
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    console.error('Invalid date:', dateString);
    return '';
  }
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

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentMenuAnchor, setDocumentMenuAnchor] = useState(null);
  const [applicationMenuAnchor, setApplicationMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openNoteDialog, setOpenNoteDialog] = useState(false);
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState([]);
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
    casVisaStatus: null, // For CAS & Visa phase decision
    financialOption: null // For Financial & TB Test phase selection
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
    
    const currentPhaseIndex = phases.indexOf(student?.currentPhase);
    const clickedPhaseIndex = phases.indexOf(phase.key);
    const isNextPhase = clickedPhaseIndex === currentPhaseIndex + 1;
    
    if (!isNextPhase) {
      showSnackbar(`You can only move to the next phase. Current phase: ${student?.currentPhase?.replace(/_/g, ' ')}`, 'warning');
      return;
    }
    
    // Show a custom dialog to confirm phase change
    if (!phase.isCompleted && phase.key !== student?.currentPhase) {
      setPhaseConfirmDialog({
        open: true,
        phase: phase,
        studentName: formatStudentName(student),
        remarks: '',
        selectedUniversities: [],
        selectedUniversity: null,
        interviewStatus: null,
        financialOption: null
      });
    }
  };

  const handlePhaseChange = async (newPhase, remarks = '', selectedUniversities = [], selectedUniversity = null, interviewStatus = null, casVisaStatus = null, financialOption = null) => {
    try {
      await axiosInstance.patch(`/counselor/students/${id}/phase`, {
        currentPhase: newPhase,
        remarks: remarks,
        selectedUniversities: selectedUniversities,
        selectedUniversity: selectedUniversity,
        interviewStatus: interviewStatus,
        casVisaStatus: casVisaStatus,
        financialOption: financialOption
      });
      fetchStudentDetails();
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
      handlePhaseChange(
        phaseConfirmDialog.phase.key, 
        phaseConfirmDialog.remarks,
        phaseConfirmDialog.selectedUniversities,
        phaseConfirmDialog.selectedUniversity,
        phaseConfirmDialog.interviewStatus,
        phaseConfirmDialog.financialOption
      );
    }
    setPhaseConfirmDialog({ open: false, phase: null, studentName: '', remarks: '', selectedUniversities: [], selectedUniversity: null, interviewStatus: null, financialOption: null });
  };

  const handlePhaseCancel = () => {
    setPhaseConfirmDialog({ open: false, phase: null, studentName: '', remarks: '', selectedUniversities: [], selectedUniversity: null, interviewStatus: null, financialOption: null });
  };

  const handlePhaseErrorClose = () => {
    setPhaseErrorDialog({ open: false, errorData: null });
  };

  // Allow retrying the Interview phase decision without moving to a new phase
  const handleInterviewRetry = () => {
    const interviewPhase = { key: 'INTERVIEW', label: 'Interview' };
    setPhaseConfirmDialog({
      open: true,
      phase: interviewPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: null
    });
  };

  // Mark interview as stopped without moving phases
  const handleInterviewStop = () => {
    handlePhaseChange('INTERVIEW', 'Interview marked as stopped', [], null, 'STOPPED');
  };

  // Allow retrying the CAS & Visa phase decision without moving to a new phase
  const handleCasVisaRetry = () => {
    const casVisaPhase = { key: 'CAS_VISA', label: 'CAS & Visa' };
    setPhaseConfirmDialog({
      open: true,
      phase: casVisaPhase,
      studentName: formatStudentName(student),
      remarks: '',
      selectedUniversities: [],
      selectedUniversity: null,
      interviewStatus: null,
      casVisaStatus: null,
      financialOption: null
    });
  };

  // Mark CAS & Visa as stopped without moving phases
  const handleCasVisaStop = () => {
    handlePhaseChange('CAS_VISA', 'CAS & Visa marked as stopped', [], null, null, 'STOPPED');
  };

  const handleGoToDocumentsFromPhaseError = () => {
    // Close the phase error dialog
    setPhaseErrorDialog({ open: false, errorData: null });
    // Switch to the Documents tab
    setTabValue(0);
    // Open the upload dialog so counselor can add required documents immediately
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
      setUniversities(response.data.success ? response.data.data : (response.data || []));
    } catch (error) {
      console.error('Error fetching universities:', error);
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

  useEffect(() => {
    fetchStudentDetails();
    fetchUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id to prevent infinite loops

  useEffect(() => {
    if (student) {
      calculateStudentStats();
    }
  }, [student, documents, applications, calculateStudentStats]);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!student?.id || !user?.id) return;
    try {
      const studentMessagesResponse = await axiosInstance.get(`/messages/student/${student.id}`);
      if (studentMessagesResponse.data.success) {
        const unread = studentMessagesResponse.data.data.filter(
          msg => msg.receiverId === user.id && !msg.isRead
        ).length;
        setUnreadMessageCount(unread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [student?.id, user?.id]);

  useEffect(() => {
    if (student?.id && student?.marketingOwner && user?.id) {
      fetchUnreadCount();
      // Poll for new messages every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [student?.id, student?.marketingOwner, user?.id, fetchUnreadCount]);

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
       printWindow.onload = function() {
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
            {student?.marketingOwner && (
              <Tooltip title="Chat with Marketing Team">
                <Badge badgeContent={unreadMessageCount} color="error">
                  <IconButton
                    onClick={() => setOpenChatDialog(true)}
                    sx={{ 
                      bgcolor: 'secondary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'secondary.dark' }
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
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
              onClick={() => setOpenUploadDialog(true)}
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {doc.name}
                    </Typography>
                    <Chip
                      label={doc.status || 'UNKNOWN'}
                      color={getDocumentStatusColor(doc.status)}
                      size="small"
                      variant="outlined"
                    />
                    {doc.priority && (
                      <Chip
                        icon={getPriorityIcon(doc.priority)}
                        label={doc.priority}
                        color={getPriorityColor(doc.priority)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                                 secondary={
                   <Box>
                     {/* Only show description if it's not an academic record with formatted data */}
                     {!(doc.type === 'ACADEMIC_TRANSCRIPT' && doc.description) && (
                       <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                         {doc.description || 'No description provided'}
                       </Typography>
                     )}
                     {renderDocumentContent(doc)}
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                       <Chip
                         label={doc.type.replace(/_/g, ' ')}
                         size="small"
                         variant="outlined"
                         sx={{ fontSize: '0.75rem' }}
                       />
                       <Typography variant="caption" color="textSecondary">
                         {formatFileSize(doc.size || 0)}
                       </Typography>
                       <Typography variant="caption" color="textSecondary">
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
                primary={
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <DocumentIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5, color: 'text.secondary' }} />
                    <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                      {searchQuery || filterStatus !== 'ALL' ? 'No documents found' : 'No documents uploaded yet'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                      {searchQuery || filterStatus !== 'ALL' ? 'Try adjusting your search or filters' : 'Start by uploading your first document'}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenUploadDialog(true)}
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Click on a document type above to select it, or choose from the dropdown below.
                </Typography>
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
                  {DOCUMENT_TYPES.map((type) => (
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
                primary={note.content}
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
                      {activity.description}
                    </Typography>
                    <Chip
                      label={formatDate(activity.timestamp)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
    </Card>
  );

  const renderApplications = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">University Applications</Typography>
          <Box>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExportApplications}
              sx={{ mr: 1 }}
            >
              Export All
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
          {applications.map((app) => (
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
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">
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
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      {app.courseName || 'No program specified'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Intake: {app.intakeTerm ? app.intakeTerm.replace('_', ' ') : 'Not specified'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Deadline: {app.applicationDeadline ? formatDate(app.applicationDeadline) : 'Not specified'}
                      </Typography>
                      {app.applicationFee && (
                        <Typography variant="caption" color="textSecondary">
                          Fee: ${app.applicationFee}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
          {applications.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No applications created yet"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </CardContent>

      {/* Application Menu */}
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

      {/* Application Dialog */}
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
    </Card>
  );

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
              
              <Box sx={{ display: 'flex', gap: 1 }}>
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
              onPhaseClick={handlePhaseClick}
              onUploadDocuments={() => setOpenUploadDialog(true)}
              onInterviewRetry={handleInterviewRetry}
              onInterviewStop={handleInterviewStop}
              onCasVisaRetry={handleCasVisaRetry}
              onCasVisaStop={handleCasVisaStop}
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
              <Tab label="Academics" />
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
              <AcademicRecords studentId={id} />
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
                  Confirm Phase Change
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Moving student to next phase
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

              {/* Display Shortlisted Universities for Application Submission Phase */}
              {phaseConfirmDialog.phase?.key === 'APPLICATION_SUBMISSION' && student?.notes && (() => {
                try {
                  const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                  const shortlist = notes?.universityShortlist;
                  if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
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
                          Shortlisted Universities ({shortlist.universities.length})
                        </Typography>
                        <Box sx={{ 
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          p: 2,
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {shortlist.universities.map((uni, idx) => (
                              <Chip
                                key={uni.id || idx}
                                label={uni.name}
                                sx={{
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.3)'
                                  }
                                }}
                                icon={<SchoolIcon sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }} />}
                              />
                            ))}
                          </Box>
                          {shortlist.universities.some(u => u.country) && (
                            <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                              Countries: {[...new Set(shortlist.universities.map(u => u.country).filter(Boolean))].join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  }
                } catch (e) {
                  return null;
                }
                return null;
              })()}

              {/* University Selection for Initial Payment Phase - Select ONE university from those with offers, or fallback to shortlisted */}
              {phaseConfirmDialog.phase?.key === 'INITIAL_PAYMENT' && student?.notes && (() => {
                try {
                  const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                  const offers = notes?.universitiesWithOffers;
                  const shortlist = notes?.universityShortlist;
                  
                  // Determine which universities to show: offers first, then fallback to shortlisted
                  let universitiesToShow = null;
                  let isFallback = false;
                  
                  if (offers && offers.universities && offers.universities.length > 0) {
                    universitiesToShow = offers.universities;
                    isFallback = false;
                  } else if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
                    universitiesToShow = shortlist.universities;
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

              {/* University Selection for Offer Received Phase - Select from Shortlisted Universities */}
              {phaseConfirmDialog.phase?.key === 'OFFER_RECEIVED' && student?.notes && (() => {
                try {
                  const notes = typeof student.notes === 'string' ? JSON.parse(student.notes) : student.notes;
                  const shortlist = notes?.universityShortlist;
                  if (shortlist && shortlist.universities && shortlist.universities.length > 0) {
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
                                  const university = shortlist.universities.find(u => u.id === value);
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
                            {shortlist.universities.map((university) => (
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
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Universities</InputLabel>
                    <Select
                      multiple
                      value={phaseConfirmDialog.selectedUniversities}
                      onChange={(e) => {
                        setPhaseConfirmDialog(prev => ({
                          ...prev,
                          selectedUniversities: e.target.value
                        }));
                      }}
                      input={<OutlinedInput label="Universities" />}
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
                      ) : universities.length === 0 ? (
                        <MenuItem disabled>No universities available</MenuItem>
                      ) : (
                        universities.map((university) => (
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
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {phaseConfirmDialog.selectedUniversities.length > 0 && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                      {phaseConfirmDialog.selectedUniversities.length} universit{phaseConfirmDialog.selectedUniversities.length === 1 ? 'y' : 'ies'} selected
                    </Typography>
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

              {/* CAS & Visa Status Selection - Show for CAS & Visa phase */}
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
                    CAS & Visa Decision
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
                        Please select a CAS & Visa decision (Approved or Refused) to proceed.
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
                (phaseConfirmDialog.phase?.key === 'FINANCIAL_TB_TEST' && !phaseConfirmDialog.financialOption)
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
              Confirm Phase Change
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
            // Refresh unread count when closing
            fetchUnreadCount();
          }}
          student={student}
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