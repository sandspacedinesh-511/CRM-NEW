import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  Fade,
  Grow,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Description as DocumentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import DocumentUpload from '../../components/common/DocumentUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passport', color: 'primary' },
  { value: 'ACADEMIC_TRANSCRIPT', label: 'Academic Transcript', color: 'secondary' },
  { value: 'RECOMMENDATION_LETTER', label: 'Recommendation Letter', color: 'success' },
  { value: 'STATEMENT_OF_PURPOSE', label: 'Statement of Purpose', color: 'info' },
  { value: 'ENGLISH_TEST_SCORE', label: 'English Test Score', color: 'warning' },
  { value: 'CV_RESUME', label: 'CV/Resume', color: 'error' },
  { value: 'FINANCIAL_STATEMENT', label: 'Financial Statement', color: 'primary' },
  { value: 'OTHER', label: 'Other', color: 'default' }
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' }
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Upload Date (Newest)' },
  { value: 'date_asc', label: 'Upload Date (Oldest)' },
  { value: 'name_asc', label: 'Student Name (A-Z)' },
  { value: 'name_desc', label: 'Student Name (Z-A)' },
  { value: 'type_asc', label: 'Document Type (A-Z)' },
  { value: 'type_desc', label: 'Document Type (Z-A)' }
];

function Documents() {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [documentType, setDocumentType] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'PENDING'
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/documents', {
        params: {
          search: searchQuery,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          type: typeFilter === 'ALL' ? undefined : typeFilter,
          sort: sortBy,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      
      if (response.data.success) {
        setDocuments(response.data.data?.documents || []);
      } else {
        setDocuments(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents. Please try again later.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await axiosInstance.get('/counselor/students');
      if (response.data.success) {
        setStudents(response.data.data?.students || []);
      } else {
        setStudents(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStudents();
  }, [searchQuery, statusFilter, typeFilter, sortBy, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUploadSuccess = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', selectedStudent);
      formData.append('type', documentType);

      await axiosInstance.post(`/counselor/students/${selectedStudent}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setOpenUpload(false);
      fetchDocuments();
      setSelectedStudent('');
      setDocumentType('');
      setUploadError(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Failed to upload document. Please try again.');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await axiosInstance.get(`/counselor/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      let errorMessage = 'Failed to download document. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Document file not found on server.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this document.';
      }
      
      setError(errorMessage);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete document:', documentId);
      const response = await axiosInstance.delete(`/counselor/documents/${documentId}`);
      console.log('Delete response:', response.data);
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
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

  const handleEdit = (document) => {
    setEditingDocument(document);
    setEditFormData({
      name: document.name || '',
      description: document.description || '',
      status: document.status || 'PENDING'
    });
    setEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingDocument) return;

    try {
      console.log('Attempting to update document:', editingDocument.id);
      console.log('Update data:', editFormData);
      const response = await axiosInstance.put(`/counselor/documents/${editingDocument.id}`, editFormData);
      console.log('Update response:', response.data);
      setEditDialog(false);
      setEditingDocument(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to update document. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this document.';
      }
      
      setError(errorMessage);
    }
  };

  const handleCloseEdit = () => {
    setEditDialog(false);
    setEditingDocument(null);
    setEditFormData({
      name: '',
      description: '',
      status: 'PENDING'
    });
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedDocuments.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await axiosInstance.delete('/counselor/documents/bulk', {
          data: { documentIds: selectedDocuments }
        });
      } else if (bulkAction === 'download') {
        // Handle bulk download
        for (const docId of selectedDocuments) {
          const doc = documents.find(d => d.id === docId);
          if (doc) {
            await handleDownload(doc.id, doc.name);
          }
        }
      }
      
      setSelectedDocuments([]);
      setBulkActionDialog(false);
      setBulkAction('');
      fetchDocuments();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action. Please try again.');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleSelectDocument = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('date_desc');
    setPage(0);
  };

  const getDocumentIcon = (fileName, documentType) => {
    // Special icon for academic records
    if (documentType === 'ACADEMIC_TRANSCRIPT') {
      return <SchoolIcon />;
    }
    
    if (!fileName || typeof fileName !== 'string') {
      return <FileIcon />;
    }
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <PdfIcon />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <ImageIcon />;
      default: return <FileIcon />;
    }
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'EXPIRED': return 'default';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    const typeObj = DOCUMENT_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.color : 'default';
  };

  const getDocumentStats = () => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === 'PENDING').length;
    const approved = documents.filter(d => d.status === 'APPROVED').length;
    const rejected = documents.filter(d => d.status === 'REJECTED').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getDocumentStats();

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );

  if (loading && documents.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LoadingSkeleton />
        </Box>
      </Container>
    );
  }

  const handlePreview = async (document) => {
    try {
      setPreviewDocument(document);
      setPreviewDialog(true);
      
      // For academic records, create a formatted preview
      if (document.type === 'ACADEMIC_TRANSCRIPT' && document.description) {
        const academicData = formatAcademicRecordData(document.description);
        if (academicData) {
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
                    <td style="padding: 8px; border: 1px solid #ddd;">${academicData.qualification}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Institution:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${academicData.institution}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Major/Subject:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${academicData.major}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Duration:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${academicData.duration}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fff8e1;">Grade:</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${academicData.grade}</td>
                  </tr>
                </table>
              </div>
              
              ${academicData.remarks && academicData.remarks !== 'No remarks' ? `
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">Remarks</h3>
                  <p style="margin: 0; font-style: italic; color: #555;">${academicData.remarks}</p>
                </div>
              ` : ''}
            </div>
          `;
          
          const blob = new Blob([previewContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          setPreviewDocument({ 
            ...document, 
            previewable: true, 
            previewUrl: url,
            mimeType: 'text/html'
          });
          return;
        }
      }
      
      // Check if document is previewable
      let response;
      try {
        response = await axiosInstance.get(`/counselor/documents/${document.id}/preview`, {
          responseType: 'blob'
        });
      } catch (error) {
        // If blob request fails, try as JSON to get error details
        if (error.response?.status === 404 || error.response?.status === 500) {
          try {
            const jsonResponse = await axiosInstance.get(`/counselor/documents/${document.id}/preview`);
            const data = jsonResponse.data;
            if (!data.previewable) {
              setPreviewDocument({ ...document, previewable: false, message: data.message });
              return;
            }
          } catch (jsonError) {
            throw error; // Re-throw original error if JSON request also fails
          }
        } else {
          throw error;
        }
      }
      
      // Check if response is JSON (non-previewable file)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const text = await response.data.text();
        const data = JSON.parse(text);
        if (!data.previewable) {
          setPreviewDocument({ ...document, previewable: false, message: data.message });
          return;
        }
      }
      
      // Create preview URL for previewable files
      const url = window.URL.createObjectURL(response.data);
      setPreviewDocument({ 
        ...document, 
        previewable: true, 
        previewUrl: url,
        mimeType: response.headers['content-type'] || document.mimeType
      });
    } catch (error) {
      console.error('Error previewing document:', error);
      let errorMessage = 'Failed to load preview. Please download to view.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Document file is not available locally. This may be because the file was uploaded to a different server environment.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to preview this document.';
      }
      
      setPreviewDocument({ 
        ...document, 
        previewable: false, 
        message: errorMessage 
      });
    }
  };

  const handleClosePreview = () => {
    if (previewDocument?.previewUrl) {
      window.URL.revokeObjectURL(previewDocument.previewUrl);
    }
    setPreviewDocument(null);
    setPreviewDialog(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Fade in={true} timeout={600}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Document Management
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Upload, organize, and track student documents
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDocuments}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={() => {/* Handle export */}}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setOpenUpload(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
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
            </Box>
          </Box>
        </Fade>

        {/* Stats Cards */}
        <Fade in={true} timeout={800}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
                border: `1px solid ${theme.palette.primary[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
                border: `1px solid ${theme.palette.warning[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
                border: `1px solid ${theme.palette.success[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.error[50]} 0%, ${theme.palette.error[100]} 100%)`,
                border: `1px solid ${theme.palette.error[200]}`
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Fade>

        {error && (
          <Fade in={true} timeout={800}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem'
                }
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Filters */}
        <Fade in={true} timeout={1000}>
          <Card sx={{ 
            mb: 3,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filters & Search
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    variant={showFilters ? "contained" : "outlined"}
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    variant="outlined"
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ borderRadius: 2 }}
                  />
                </Grid>
                
                {showFilters && (
                  <>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Status"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          label="Type"
                        >
                          <MenuItem value="ALL">All Types</MenuItem>
                          {DOCUMENT_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          label="Sort By"
                        >
                          {SORT_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <Fade in={true} timeout={800}>
            <Card sx={{ mb: 3, backgroundColor: theme.palette.primary[50] }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {selectedDocuments.length} document(s) selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setBulkActionDialog(true)}
                    >
                      Bulk Actions
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedDocuments([])}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Documents Table */}
        <Grow in={true} timeout={1200}>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedDocuments.length === documents.length && documents.length > 0}
                        indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < documents.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Upload Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onChange={() => handleSelectDocument(document.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: theme.palette.grey[100],
                            color: theme.palette.text.secondary,
                            mt: 0.5
                          }}>
                            {getDocumentIcon(document.name, document.type)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {document.name || 'Untitled Document'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                              {document.size ? `${Math.round(document.size / 1024)} KB` : 'Unknown size'}
                            </Typography>
                            {renderDocumentContent(document)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {document.student?.firstName} {document.student?.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={DOCUMENT_TYPES.find(t => t.value === document.type)?.label}
                          color={getTypeColor(document.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={document.status}
                          color={getStatusColor(document.status)}
                          size="small"
                          icon={
                            document.status === 'APPROVED' ? <CheckCircleIcon /> :
                            document.status === 'PENDING' ? <WarningIcon /> :
                            document.status === 'REJECTED' ? <ErrorIcon /> : null
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {document.createdAt ? format(new Date(document.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                        </Typography>
                      </TableCell>
                                             <TableCell>
                         <Box sx={{ display: 'flex', gap: 1 }}>
                           <Tooltip title="Preview">
                             <IconButton
                               size="small"
                               onClick={() => handlePreview(document)}
                             >
                               <ViewIcon />
                             </IconButton>
                           </Tooltip>
                           <Tooltip title="Download">
                             <IconButton
                               size="small"
                               onClick={() => handleDownload(document.id, document.name)}
                             >
                               <DownloadIcon />
                             </IconButton>
                           </Tooltip>
                           <Tooltip title="Edit">
                             <IconButton
                               size="small"
                               onClick={() => handleEdit(document)}
                               sx={{ color: theme.palette.primary.main }}
                             >
                               <EditIcon />
                             </IconButton>
                           </Tooltip>
                           <Tooltip title="Delete">
                             <IconButton
                               size="small"
                               onClick={() => handleDelete(document.id)}
                               sx={{ color: theme.palette.error.main }}
                             >
                               <DeleteIcon />
                             </IconButton>
                           </Tooltip>
                         </Box>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {documents.length === 0 && !loading && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.text.secondary
              }}>
                <DocumentIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No documents found
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by uploading your first document'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setOpenUpload(true)}
                >
                  Upload Document
                </Button>
              </Box>
            )}

            <TablePagination
              component="div"
              count={-1} // You can set actual count if available
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Paper>
        </Grow>
      </Box>

      {/* Upload Dialog */}
      <Dialog 
        open={openUpload} 
        onClose={() => setOpenUpload(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                >
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Document Type"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            </Grid>
            {uploadError && (
              <Grid item xs={12}>
                <Alert severity="error">{uploadError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialog} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview: {previewDocument?.name || 'Untitled Document'}
        </DialogTitle>
        <DialogContent>
          {previewDocument && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {previewDocument.previewable ? (
                <Box>
                  {previewDocument.mimeType?.includes('pdf') ? (
                    <iframe
                      src={previewDocument.previewUrl}
                      width="100%"
                      height="500px"
                      style={{ border: 'none' }}
                      title={previewDocument.name}
                    />
                  ) : previewDocument.mimeType?.includes('image') ? (
                    <img
                      src={previewDocument.previewUrl}
                      alt={previewDocument.name}
                      style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                    />
                  ) : (
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Preview not available for this file type. Please download to view.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          handleDownload(previewDocument.id, previewDocument.name);
                          handleClosePreview();
                        }}
                      >
                        Download Document
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {previewDocument.message || 'Preview not available for this file type. Please download to view.'}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      handleDownload(previewDocument.id, previewDocument.name);
                      handleClosePreview();
                    }}
                  >
                    Download Document
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            What would you like to do with {selectedDocuments.length} selected document(s)?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="download">Download All</MenuItem>
              <MenuItem value="delete">Delete All</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkAction} 
            variant="contained" 
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            disabled={!bulkAction}
          >
            Confirm
          </Button>
                 </DialogActions>
       </Dialog>

       {/* Edit Document Dialog */}
       <Dialog 
         open={editDialog} 
         onClose={handleCloseEdit}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle>Edit Document</DialogTitle>
         <DialogContent>
           <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 label="Document Name"
                 value={editFormData.name}
                 onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
               />
             </Grid>
             <Grid item xs={12}>
               <TextField
                 fullWidth
                 multiline
                 rows={3}
                 label="Description"
                 value={editFormData.description}
                 onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
               />
             </Grid>
             <Grid item xs={12}>
               <FormControl fullWidth>
                 <InputLabel>Status</InputLabel>
                 <Select
                   value={editFormData.status}
                   onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                   label="Status"
                 >
                   <MenuItem value="PENDING">Pending</MenuItem>
                   <MenuItem value="APPROVED">Approved</MenuItem>
                   <MenuItem value="REJECTED">Rejected</MenuItem>
                   <MenuItem value="EXPIRED">Expired</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
           </Grid>
         </DialogContent>
         <DialogActions>
           <Button onClick={handleCloseEdit}>Cancel</Button>
           <Button onClick={handleUpdate} variant="contained">
             Update
           </Button>
         </DialogActions>
       </Dialog>
     </Container>
   );
 }

export default Documents; 