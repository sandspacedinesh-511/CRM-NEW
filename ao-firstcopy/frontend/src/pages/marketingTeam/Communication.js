import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  LinearProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Message as MessageIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
  Upload as UploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  Note as NoteIcon,
  Save as SaveIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import StudentProgressBar from '../../components/counselor/StudentProgressBar';
import useWebSocket from '../../hooks/useWebSocket';

function MarketingCommunication() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, onEvent, joinRoom } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [communications, setCommunications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [loadingLeadDetails, setLoadingLeadDetails] = useState(false);
  const [leadDocuments, setLeadDocuments] = useState([]);
  const [leadApplications, setLeadApplications] = useState([]);
  const [countryProfiles, setCountryProfiles] = useState([]);
  const [uploadingDocuments, setUploadingDocuments] = useState({
    idCard: false,
    enrollmentLetter: false,
    others: false
  });
  const [documentFiles, setDocumentFiles] = useState({
    idCard: null,
    enrollmentLetter: null,
    others: null
  });
  const [submittedDocuments, setSubmittedDocuments] = useState({
    idCard: false,
    enrollmentLetter: false,
    others: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [reminder, setReminder] = useState({
    date: '',
    time: '',
    text: ''
  });
  const [remarks, setRemarks] = useState('');
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingRemarks, setSavingRemarks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load leads for communication
      const leadsResponse = await axiosInstance.get('/marketing/leads');
      if (leadsResponse.data.success) {
        setLeads(leadsResponse.data.data?.leads || leadsResponse.data.leads || []);
      }

      // Load recent messages
      try {
        const messagesResponse = await axiosInstance.get('/messages/recent');
        if (messagesResponse.data.success) {
          setRecentMessages(messagesResponse.data.data || []);
        }
      } catch (err) {
        console.log('Error loading recent messages:', err);
        setRecentMessages([]);
      }

      // Communications will be loaded from messages API when needed
      setCommunications([]);
    } catch (err) {
      console.error('Error loading communication data:', err);
      setError('Failed to load communication data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // WebSocket setup for real-time updates
  useEffect(() => {
    if (!isConnected || !user) return;

    // Join user-specific room for receiving messages
    joinRoom(`user:${user.id}`);
    
    // Join role-based room for marketing users
    if (user.role === 'marketing' || user.role === 'b2b_marketing') {
      joinRoom(`role:${user.role}`);
    }

    // Listen for new messages
    const cleanupMessage = onEvent('new_message', (data) => {
      console.log('New message received via WebSocket:', data);
      
      // Update recent messages if this is a reply from counselor
      if (data.message && data.studentId) {
        setRecentMessages(prev => {
          const existing = prev.find(msg => msg.studentId === data.studentId);
          if (existing) {
            // Update existing message
            return prev.map(msg => 
              msg.studentId === data.studentId 
                ? { ...msg, ...data.message, createdAt: data.message.createdAt }
                : msg
            );
          } else {
            // Add new message
            return [{ ...data.message, studentId: data.studentId }, ...prev];
          }
        });

        // If the dialog is open for this lead, refresh the lead details
        if (selectedLead && selectedLead.id === data.studentId) {
          loadLeadDetails(data.studentId);
        }
      }

      // Reload data to get updated leads list
      loadData();
    });

    // Listen for application updates
    const cleanupApplication = onEvent('application_update', (data) => {
      console.log('Application update received via WebSocket:', data);
      // Reload leads to get updated application progress
      loadData();
    });

    // Listen for application progress updates
    const cleanupProgress = onEvent('application_progress', (data) => {
      console.log('Application progress update received via WebSocket:', data);
      // Reload leads to get updated progress
      loadData();
    });

    // Listen for notifications (which include application updates)
    const cleanupNotification = onEvent('notification', (notification) => {
      console.log('Notification received via WebSocket:', notification);
      // If it's an application update notification, reload data
      if (notification.type === 'application_update' || notification.type === 'application_progress') {
        loadData();
      }
    });

    // Cleanup listeners on unmount
    return () => {
      cleanupMessage?.();
      cleanupApplication?.();
      cleanupProgress?.();
      cleanupNotification?.();
    };
  }, [isConnected, user, onEvent, joinRoom, selectedLead, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter leads based on selected tab and search query
  const filteredLeads = useMemo(() => {
    let filtered = [];
    
    if (tabValue === 0) {
      // All Leads
      filtered = leads;
    } else if (tabValue === 1) {
      // Recent Communications - leads with recent messages (replies from counselor)
      const leadsWithMessages = recentMessages.map(msg => msg.studentId);
      filtered = leads.filter(lead => leadsWithMessages.includes(lead.id));
      // Sort by most recent message
      filtered = filtered.sort((a, b) => {
        const msgA = recentMessages.find(msg => msg.studentId === a.id);
        const msgB = recentMessages.find(msg => msg.studentId === b.id);
        if (!msgA || !msgB) return 0;
        return new Date(msgB.createdAt) - new Date(msgA.createdAt);
      });
    } else if (tabValue === 2) {
      // Pending Follow-ups - leads without counselor or in early phases
      filtered = leads.filter(lead => {
        // Leads without counselor assigned
        if (!lead.counselor || !lead.counselor.id) return true;
        // Leads in early phases that might need follow-up
        const earlyPhases = ['DOCUMENT_COLLECTION', 'UNIVERSITY_SHORTLISTING'];
        if (earlyPhases.includes(lead.currentPhase)) {
          // Check if updated recently (more than 3 days ago needs follow-up)
          if (lead.updatedAt) {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return new Date(lead.updatedAt) < threeDaysAgo;
          }
          return true;
        }
        return false;
      });
    } else {
      filtered = leads;
    }

    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead => {
        const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      });
    }

    return filtered;
  }, [leads, tabValue, searchQuery, recentMessages]);

  const handleOpenDialog = async (lead) => {
    setSelectedLead(lead);
    setMessage('');
    setOpenDialog(true);
    
    // Load lead details for application progress
    await loadLeadDetails(lead.id);
  };

  const loadLeadDetails = async (leadId) => {
    try {
      setLoadingLeadDetails(true);
      
      // Fetch lead details, documents, applications, and country profiles in parallel
      const [leadResponse, documentsResponse, applicationsResponse, countryProfilesResponse] = await Promise.all([
        axiosInstance.get(`/marketing/leads/${leadId}`).catch(() => null),
        axiosInstance.get(`/marketing/leads/${leadId}/documents`).catch(() => ({ data: { success: true, data: [] } })),
        axiosInstance.get(`/marketing/leads/${leadId}/applications`).catch(() => ({ data: { success: true, data: [] } })),
        axiosInstance.get(`/marketing/leads/${leadId}/country-profiles`).catch(() => ({ data: { success: true, data: [] } }))
      ]);

      // Set lead details
      if (leadResponse?.data?.success) {
        setSelectedLeadDetails(leadResponse.data.data);
      } else {
        // Fallback to lead data we already have
        const leadData = leads.find(l => l.id === leadId);
        if (leadData) {
          setSelectedLeadDetails(leadData);
        }
      }

      // Set documents
      if (documentsResponse?.data?.success) {
        const docs = documentsResponse.data.data || [];
        setLeadDocuments(docs);
        
        // Check which document types have been uploaded
        const hasIdCard = docs.some(doc => doc.type === 'ID_CARD');
        const hasEnrollmentLetter = docs.some(doc => doc.type === 'ENROLLMENT_LETTER');
        const hasOthers = docs.some(doc => doc.type === 'OTHER');
        
        setSubmittedDocuments({
          idCard: hasIdCard,
          enrollmentLetter: hasEnrollmentLetter,
          others: hasOthers
        });
      } else {
        setLeadDocuments([]);
        setSubmittedDocuments({
          idCard: false,
          enrollmentLetter: false,
          others: false
        });
      }

      // Load remarks if available
      if (leadResponse?.data?.success) {
        const leadData = leadResponse.data.data;
        // Check if remarks are stored in notes field or separate field
        if (leadData.remarks) {
          setRemarks(leadData.remarks);
        } else if (leadData.notes) {
          try {
            const notesData = typeof leadData.notes === 'string' ? JSON.parse(leadData.notes) : leadData.notes;
            if (notesData.remarks) {
              setRemarks(notesData.remarks);
            }
          } catch (e) {
            // If notes is not JSON, ignore
          }
        }
      }

      // Set applications
      if (applicationsResponse?.data?.success) {
        setLeadApplications(applicationsResponse.data.data || []);
      } else {
        setLeadApplications([]);
      }

      // Set country profiles
      if (countryProfilesResponse?.data?.success) {
        setCountryProfiles(countryProfilesResponse.data.data || []);
      } else {
        setCountryProfiles([]);
      }
    } catch (err) {
      console.error('Error loading lead details:', err);
      // Fallback to lead data we already have
      const leadData = leads.find(l => l.id === leadId);
      if (leadData) {
        setSelectedLeadDetails(leadData);
      }
    } finally {
      setLoadingLeadDetails(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLead(null);
    setSelectedLeadDetails(null);
    setMessage('');
    setLeadDocuments([]);
    setLeadApplications([]);
    setCountryProfiles([]);
    setDocumentFiles({
      idCard: null,
      enrollmentLetter: null,
      others: null
    });
    setUploadingDocuments({
      idCard: false,
      enrollmentLetter: false,
      others: false
    });
    setSubmittedDocuments({
      idCard: false,
      enrollmentLetter: false,
      others: false
    });
    setReminder({
      date: '',
      time: '',
      text: ''
    });
    setRemarks('');
    setSelectedCountry(null);
  };

  const handleFileSelect = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleRemoveFile = (type) => {
    setDocumentFiles(prev => ({ ...prev, [type]: null }));
  };

  const handleSubmitDocuments = async () => {
    if (!selectedLead) return;

    // Check if at least one document is selected
    const hasDocuments = Object.values(documentFiles).some(file => file !== null);
    if (!hasDocuments) {
      setSnackbar({
        open: true,
        message: 'Please select at least one document to upload.',
        severity: 'warning'
      });
      return;
    }

    try {
      // Set all uploading states to true
      setUploadingDocuments({
        idCard: documentFiles.idCard !== null,
        enrollmentLetter: documentFiles.enrollmentLetter !== null,
        others: documentFiles.others !== null
      });

      const uploadPromises = [];
      const uploadedTypes = [];

      // Upload each selected document
      if (documentFiles.idCard) {
        const formData = new FormData();
        formData.append('file', documentFiles.idCard);
        formData.append('type', 'ID_CARD');
        formData.append('description', 'ID Card uploaded by marketing');
        
        uploadPromises.push(
          axiosInstance.post(
            `/marketing/leads/${selectedLead.id}/documents/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        );
        uploadedTypes.push('ID Card');
      }

      if (documentFiles.enrollmentLetter) {
        const formData = new FormData();
        formData.append('file', documentFiles.enrollmentLetter);
        formData.append('type', 'ENROLLMENT_LETTER');
        formData.append('description', 'Enrollment Letter uploaded by marketing');
        
        uploadPromises.push(
          axiosInstance.post(
            `/marketing/leads/${selectedLead.id}/documents/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        );
        uploadedTypes.push('Enrollment Letter');
      }

      if (documentFiles.others) {
        const formData = new FormData();
        formData.append('file', documentFiles.others);
        formData.append('type', 'OTHER');
        formData.append('description', 'Other Document uploaded by marketing');
        
        uploadPromises.push(
          axiosInstance.post(
            `/marketing/leads/${selectedLead.id}/documents/upload`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          )
        );
        uploadedTypes.push('Document');
      }

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');
      
      if (failures.length > 0) {
        console.error('Some documents failed to upload:', failures);
        const errorMessages = failures.map(f => f.reason?.response?.data?.message || f.reason?.message || 'Unknown error');
        throw new Error(`Failed to upload ${failures.length} document(s): ${errorMessages.join(', ')}`);
      }
      
      // Verify all uploads were successful
      const allSuccessful = successes.every(result => result.value?.data?.success);
      if (!allSuccessful) {
        throw new Error('Some documents did not upload successfully');
      }

      // Clear all files after successful upload
      setDocumentFiles({
        idCard: null,
        enrollmentLetter: null,
        others: null
      });

      // Reload lead documents
      if (selectedLead.id) {
        const documentsResponse = await axiosInstance.get(`/marketing/leads/${selectedLead.id}/documents`);
        if (documentsResponse?.data?.success) {
          const docs = documentsResponse.data.data || [];
          setLeadDocuments(docs);
          
          // Update submitted documents state
          const hasIdCard = docs.some(doc => doc.type === 'ID_CARD');
          const hasEnrollmentLetter = docs.some(doc => doc.type === 'ENROLLMENT_LETTER');
          const hasOthers = docs.some(doc => doc.type === 'OTHER');
          
          setSubmittedDocuments({
            idCard: hasIdCard,
            enrollmentLetter: hasEnrollmentLetter,
            others: hasOthers
          });
        }
      }

      // Show success message
      setSnackbar({
        open: true,
        message: `${uploadedTypes.join(', ')} uploaded successfully!`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error uploading documents:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload documents. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      // Reset all uploading states
      setUploadingDocuments({
        idCard: false,
        enrollmentLetter: false,
        others: false
      });
    }
  };

  const handleSaveReminder = async () => {
    if (!selectedLead || !reminder.date || !reminder.time || !reminder.text.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all reminder fields (date, time, and text).',
        severity: 'warning'
      });
      return;
    }

    try {
      setSavingReminder(true);
      
      // Combine date and time
      const scheduledDateTime = new Date(`${reminder.date}T${reminder.time}`);
      
      const response = await axiosInstance.post('/marketing/leads/reminder', {
        leadId: selectedLead.id,
        scheduledTime: scheduledDateTime.toISOString(),
        reminderText: reminder.text
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Reminder saved successfully!',
          severity: 'success'
        });
        // Clear reminder fields
        setReminder({
          date: '',
          time: '',
          text: ''
        });
      }
    } catch (err) {
      console.error('Error saving reminder:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save reminder. Please try again.',
        severity: 'error'
      });
    } finally {
      setSavingReminder(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!selectedLead) return;

    try {
      setSavingRemarks(true);
      
      const response = await axiosInstance.post('/marketing/leads/remarks', {
        leadId: selectedLead.id,
        remarks: remarks
      });

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Remarks saved successfully!',
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error saving remarks:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save remarks. Please try again.',
        severity: 'error'
      });
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedLead) return;

    try {
      setSending(true);
      
      // Determine receiver (counselor if assigned, otherwise we'll handle it in backend)
      const receiverId = selectedLead.counselor?.id;
      
      if (!receiverId) {
        setError('Cannot send message: No counselor assigned to this lead.');
        setSending(false);
        return;
      }

      // Send message via the messages API
      const response = await axiosInstance.post('/messages', {
        studentId: selectedLead.id,
        receiverId: receiverId,
        message: message.trim()
      });
      
      if (response.data.success) {
        setMessage('');
        // Show success message
        setError(null);
        // Refresh leads and recent messages
        await loadData();
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '70vh',
          gap: 3
        }}
      >
        <CircularProgress size={64} thickness={4} />
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Loading communications...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Communication Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Manage all communications with your leads
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Leads" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Recent Communications" icon={<HistoryIcon />} iconPosition="start" />
            <Tab label="Pending Follow-ups" icon={<ScheduleIcon />} iconPosition="start" />
          </Tabs>
        </Box>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Leads</Typography>}
              subheader="Select a lead to send a message"
            />
            <CardContent>
              {/* Search Field */}
              <TextField
                fullWidth
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
                size="small"
              />
              {filteredLeads.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {tabValue === 2 
                      ? 'No pending follow-ups at this time.'
                      : 'No leads available for communication.'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 600, overflow: 'auto', px: 0 }}>
                  {filteredLeads.map((lead, index) => (
                    <Box key={lead.id}>
                      <ListItem
                        sx={{
                          alignItems: 'flex-start',
                          px: 2,
                          py: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                        onClick={() => handleOpenDialog(lead)}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.18),
                              color: theme.palette.primary.main
                            }}
                          >
                            {lead.firstName ? lead.firstName.charAt(0) : 'L'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {lead.firstName} {lead.lastName}
                              </Typography>
                              <Chip
                                label={lead.status || 'ACTIVE'}
                                size="small"
                                color={
                                  lead.status === 'COMPLETED'
                                    ? 'success'
                                    : lead.status === 'REJECTED'
                                      ? 'error'
                                      : 'default'
                                }
                              />
                            </Stack>
                          }
                          secondary={
                            <>
                              {tabValue === 1 && (() => {
                                // Show latest message/reply for Recent Communications tab
                                const latestMessage = recentMessages.find(msg => msg.studentId === lead.id);
                                return (
                                  <>
                                    {lead.counselor?.name && (
                                      <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        <PersonIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                        Counselor: {lead.counselor.name}
                                      </Typography>
                                    )}
                                    {lead.consultancyName && (
                                      <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        <SchoolIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                        Consultancy: {lead.consultancyName}
                                      </Typography>
                                    )}
                                    {latestMessage ? (
                                      <>
                                        <Typography 
                                          component="span" 
                                          variant="body2" 
                                          color={latestMessage.senderId !== user?.id ? 'primary' : 'text.secondary'} 
                                          sx={{ 
                                            display: 'block', 
                                            mb: 0.5,
                                            fontWeight: latestMessage.senderId !== user?.id ? 600 : 400,
                                            fontStyle: latestMessage.senderId !== user?.id ? 'italic' : 'normal'
                                          }}
                                        >
                                          {latestMessage.senderId !== user?.id ? '↩ Reply from ' : 'You: '}
                                          {latestMessage.message.length > 50 
                                            ? latestMessage.message.substring(0, 50) + '...' 
                                            : latestMessage.message}
                                        </Typography>
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          {formatDistanceToNow(new Date(latestMessage.createdAt), { addSuffix: true })}
                                        </Typography>
                                      </>
                                    ) : (
                                      <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                        No messages yet
                                      </Typography>
                                    )}
                                  </>
                                );
                              })()}
                              {tabValue !== 1 && (
                                <>
                                  {lead.counselor?.name && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      <PersonIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      Counselor: {lead.counselor.name}
                                    </Typography>
                                  )}
                                  {lead.consultancyName && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      <SchoolIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      Consultancy: {lead.consultancyName}
                                    </Typography>
                                  )}
                                  {lead.email && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      <EmailIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      {lead.email}
                                    </Typography>
                                  )}
                                  {lead.phone && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                      {lead.phone}
                                    </Typography>
                                  )}
                                  {lead.createdAt && (
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                                      Created: {format(new Date(lead.createdAt), 'PPp')}
                                    </Typography>
                                  )}
                                </>
                              )}
                            </>
                          }
                        />
                        {tabValue === 1 && (() => {
                          const latestMessage = recentMessages.find(msg => msg.studentId === lead.id);
                          const isReply = latestMessage && latestMessage.senderId !== user?.id;
                          return (
                            <Badge 
                              badgeContent={isReply ? <ReplyIcon sx={{ fontSize: 12 }} /> : null}
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  bgcolor: theme.palette.success.main,
                                  color: 'white',
                                  minWidth: 20,
                                  height: 20,
                                  padding: 0
                                }
                              }}
                            >
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.2)
                                  }
                                }}
                              >
                                <MessageIcon />
                              </IconButton>
                            </Badge>
                          );
                        })()}
                        {tabValue !== 1 && (
                          <IconButton
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.2)
                              }
                            }}
                          >
                            <MessageIcon />
                          </IconButton>
                        )}
                      </ListItem>
                      {index !== filteredLeads.length - 1 && <Divider component="li" sx={{ mx: 2 }} />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Quick Actions</Typography>}
            />
            <CardContent>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<EmailIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', py: 1.5 }}
                >
                  Send Bulk Email
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PhoneIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', py: 1.5 }}
                >
                  Schedule Call
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ChatIcon />}
                  sx={{ borderRadius: 2, textTransform: 'none', py: 1.5 }}
                >
                  Start Chat
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Lead Details Dialog with Application Progress */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  color: theme.palette.primary.main,
                  width: 56,
                  height: 56
                }}
              >
                {selectedLead?.firstName ? selectedLead.firstName.charAt(0) : 'L'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {selectedLead?.firstName} {selectedLead?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLead?.email}
                </Typography>
                {selectedLead?.phone && (
                  <Typography variant="body2" color="text.secondary">
                    <PhoneIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                    {selectedLead.phone}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingLeadDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Application Progress Section - Display for selected country */}
              {selectedLeadDetails && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Application Progress
                    </Typography>
                    {countryProfiles && countryProfiles.length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>Select Country</InputLabel>
                        <Select
                          value={selectedCountry || ''}
                          onChange={(e) => setSelectedCountry(e.target.value)}
                          label="Select Country"
                        >
                          <MenuItem value="">
                            <em>All Countries</em>
                          </MenuItem>
                          {countryProfiles.map((profile) => (
                            <MenuItem key={profile.id || profile.country} value={profile.country}>
                              {profile.country}
                              {profile.preferredCountry && ' ⭐'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                  {countryProfiles && countryProfiles.length > 0 ? (
                    selectedCountry ? (
                      // Show progress for selected country
                      (() => {
                        const countryProfile = countryProfiles.find(p => p.country === selectedCountry);
                        if (!countryProfile) {
                          return (
                            <Typography variant="body2" color="text.secondary">
                              Country profile not found.
                            </Typography>
                          );
                        }
                        return (
                          <Box>
                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                {countryProfile.country}
                              </Typography>
                              {countryProfile.preferredCountry && (
                                <Chip 
                                  label="Preferred" 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                              <Chip 
                                label={`Phase: ${countryProfile.currentPhase?.replace(/_/g, ' ') || 'Not Started'}`} 
                                size="small" 
                                color="secondary"
                                variant="outlined"
                              />
                            </Box>
                            <StudentProgressBar
                              student={{
                                id: selectedLeadDetails.id,
                                firstName: selectedLeadDetails.firstName,
                                lastName: selectedLeadDetails.lastName,
                                currentPhase: countryProfile.currentPhase || selectedLeadDetails.currentPhase,
                                status: selectedLeadDetails.status,
                                marketingOwnerId: selectedLeadDetails.marketingOwnerId,
                                ...selectedLeadDetails
                              }}
                              documents={leadDocuments || []}
                              applications={leadApplications || []}
                              countryProfiles={[countryProfile]}
                              selectedCountry={selectedCountry}
                            />
                          </Box>
                        );
                      })()
                    ) : (
                      // Show overall progress when "All Countries" is selected
                      <StudentProgressBar
                        student={{
                          id: selectedLeadDetails.id,
                          firstName: selectedLeadDetails.firstName,
                          lastName: selectedLeadDetails.lastName,
                          currentPhase: selectedLeadDetails.currentPhase,
                          status: selectedLeadDetails.status,
                          marketingOwnerId: selectedLeadDetails.marketingOwnerId,
                          ...selectedLeadDetails
                        }}
                        documents={leadDocuments || []}
                        applications={leadApplications || []}
                        countryProfiles={countryProfiles}
                        selectedCountry={null}
                      />
                    )
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No country profiles found. Showing overall progress.
                      </Typography>
                      <StudentProgressBar
                        student={{
                          id: selectedLeadDetails.id,
                          firstName: selectedLeadDetails.firstName,
                          lastName: selectedLeadDetails.lastName,
                          currentPhase: selectedLeadDetails.currentPhase,
                          status: selectedLeadDetails.status,
                          marketingOwnerId: selectedLeadDetails.marketingOwnerId,
                          ...selectedLeadDetails
                        }}
                        documents={leadDocuments || []}
                        applications={leadApplications || []}
                        countryProfiles={[]}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Lead Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Lead Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedLead?.status || 'ACTIVE'}
                      size="small"
                      color={
                        selectedLead?.status === 'COMPLETED'
                          ? 'success'
                          : selectedLead?.status === 'REJECTED'
                            ? 'error'
                            : 'default'
                      }
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current Phase
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {selectedLead?.currentPhase?.replace(/_/g, ' ') || 'Not set'}
                    </Typography>
                  </Grid>
                  {selectedLead?.createdAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {format(new Date(selectedLead.createdAt), 'PPp')}
                      </Typography>
                    </Grid>
                  )}
                  {selectedLead?.counselor && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Assigned Counselor
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedLead.counselor.name || 'Not assigned'}
                      </Typography>
                    </Grid>
                  )}
                  {selectedLead?.consultancyName && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Consultancy Name
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600 }}>
                        {selectedLead.consultancyName}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Document Upload Section */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Upload Documents
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* ID Card */}
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      border: '1px dashed', 
                      borderColor: submittedDocuments.idCard ? 'success.main' : 'divider',
                      borderRadius: 2, 
                      p: 2,
                      backgroundColor: submittedDocuments.idCard ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        ID Card
                      </Typography>
                      {submittedDocuments.idCard && (
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      )}
                    </Stack>
                    {submittedDocuments.idCard ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ flex: 1, color: 'success.main', fontWeight: 500 }}>
                            Document Submitted
                          </Typography>
                        </Stack>
                        <Button
                          variant="outlined"
                          color="success"
                          component="label"
                          startIcon={<AttachFileIcon />}
                          fullWidth
                          size="small"
                          disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                        >
                          Re-upload ID Card
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              handleFileSelect('idCard', e);
                              setSubmittedDocuments(prev => ({ ...prev, idCard: false }));
                            }}
                          />
                        </Button>
                      </Box>
                    ) : documentFiles.idCard ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AttachFileIcon fontSize="small" />
                          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {documentFiles.idCard.name}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemoveFile('idCard')} disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {uploadingDocuments.idCard && <LinearProgress sx={{ mb: 1 }} />}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFileIcon />}
                        fullWidth
                        disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                      >
                        Select ID Card
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('idCard', e)}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>

                {/* Enrollment Letter */}
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      border: '1px dashed', 
                      borderColor: submittedDocuments.enrollmentLetter ? 'success.main' : 'divider',
                      borderRadius: 2, 
                      p: 2,
                      backgroundColor: submittedDocuments.enrollmentLetter ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Enrollment Letter
                      </Typography>
                      {submittedDocuments.enrollmentLetter && (
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      )}
                    </Stack>
                    {submittedDocuments.enrollmentLetter ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ flex: 1, color: 'success.main', fontWeight: 500 }}>
                            Document Submitted
                          </Typography>
                        </Stack>
                        <Button
                          variant="outlined"
                          color="success"
                          component="label"
                          startIcon={<AttachFileIcon />}
                          fullWidth
                          size="small"
                          disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                        >
                          Re-upload Enrollment Letter
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              handleFileSelect('enrollmentLetter', e);
                              setSubmittedDocuments(prev => ({ ...prev, enrollmentLetter: false }));
                            }}
                          />
                        </Button>
                      </Box>
                    ) : documentFiles.enrollmentLetter ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AttachFileIcon fontSize="small" />
                          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {documentFiles.enrollmentLetter.name}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemoveFile('enrollmentLetter')} disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {uploadingDocuments.enrollmentLetter && <LinearProgress sx={{ mb: 1 }} />}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFileIcon />}
                        fullWidth
                        disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                      >
                        Select Enrollment Letter
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('enrollmentLetter', e)}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>

                {/* Others */}
                <Grid item xs={12} md={4}>
                  <Box 
                    sx={{ 
                      border: '1px dashed', 
                      borderColor: submittedDocuments.others ? 'success.main' : 'divider',
                      borderRadius: 2, 
                      p: 2,
                      backgroundColor: submittedDocuments.others ? alpha(theme.palette.success.main, 0.05) : 'transparent'
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Others
                      </Typography>
                      {submittedDocuments.others && (
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      )}
                    </Stack>
                    {submittedDocuments.others ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ flex: 1, color: 'success.main', fontWeight: 500 }}>
                            Document Submitted
                          </Typography>
                        </Stack>
                        <Button
                          variant="outlined"
                          color="success"
                          component="label"
                          startIcon={<AttachFileIcon />}
                          fullWidth
                          size="small"
                          disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                        >
                          Re-upload Document
                          <input
                            type="file"
                            hidden
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              handleFileSelect('others', e);
                              setSubmittedDocuments(prev => ({ ...prev, others: false }));
                            }}
                          />
                        </Button>
                      </Box>
                    ) : documentFiles.others ? (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AttachFileIcon fontSize="small" />
                          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {documentFiles.others.name}
                          </Typography>
                          <IconButton size="small" onClick={() => handleRemoveFile('others')} disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        {uploadingDocuments.others && <LinearProgress sx={{ mb: 1 }} />}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<AttachFileIcon />}
                        fullWidth
                        disabled={uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others}
                      >
                        Select Other Document
                        <input
                          type="file"
                          hidden
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileSelect('others', e)}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Submit Documents Button */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmitDocuments}
                  disabled={
                    (!documentFiles.idCard && !documentFiles.enrollmentLetter && !documentFiles.others) ||
                    uploadingDocuments.idCard ||
                    uploadingDocuments.enrollmentLetter ||
                    uploadingDocuments.others
                  }
                  startIcon={
                    (uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others) ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <UploadIcon />
                    )
                  }
                  sx={{ textTransform: 'none', fontWeight: 600, px: 4 }}
                >
                  {(uploadingDocuments.idCard || uploadingDocuments.enrollmentLetter || uploadingDocuments.others)
                    ? 'Submitting Documents...'
                    : 'Submit Documents'}
                </Button>
              </Box>

              {/* Remarks Section */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                <NoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Remarks
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Add Remarks / Notes"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Write your notes or remarks about this lead..."
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={savingRemarks ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSaveRemarks}
                  disabled={savingRemarks}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {savingRemarks ? 'Saving...' : 'Save Remarks'}
                </Button>
              </Box>

              {/* Reminder Section */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Set Reminder
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Reminder Date"
                    value={reminder.date}
                    onChange={(e) => setReminder(prev => ({ ...prev, date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Reminder Time"
                    value={reminder.time}
                    onChange={(e) => setReminder(prev => ({ ...prev, time: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Reminder Text"
                    value={reminder.text}
                    onChange={(e) => setReminder(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter reminder message..."
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={savingReminder ? <CircularProgress size={16} /> : <NotificationsIcon />}
                  onClick={handleSaveReminder}
                  disabled={savingReminder || !reminder.date || !reminder.time || !reminder.text.trim()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {savingReminder ? 'Saving...' : 'Save Reminder'}
                </Button>
              </Box>

              {/* Send Message Section */}
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Send Message
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={sending}>
            Close
          </Button>
          <Button
            onClick={handleSendMessage}
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            disabled={!message.trim() || sending}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default MarketingCommunication;

