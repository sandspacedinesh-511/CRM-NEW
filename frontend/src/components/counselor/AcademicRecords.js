import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  AttachFile as AttachFileIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';

const QUALIFICATION_TYPES = [
  'HIGH_SCHOOL',
  'BACHELORS',
  'MASTERS',
  'PHD',
  'DIPLOMA',
  'CERTIFICATE',
  'OTHER'
];

const GRADING_SYSTEMS = [
  'PERCENTAGE',
  'GPA_4',
  'GPA_5',
  'GPA_10',
  'LETTER_GRADE',
  'OTHER'
];

function AcademicRecords({ studentId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [formData, setFormData] = useState({
    qualificationType: '',
    institutionName: '',
    majorSubject: '',
    startDate: '',
    endDate: '',
    gradingSystem: '',
    grade: '',
    remarks: '',
    certificateFile: null
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Fetch academic transcript documents for this student
      const response = await axiosInstance.get(`/counselor/students/${studentId}/documents?type=ACADEMIC_TRANSCRIPT`);
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error fetching academic records:', error);
      setError('Failed to load academic records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [studentId]);

  const handleOpenDialog = (record = null) => {
    if (record) {
      setSelectedRecord(record);
      // Parse the description to extract academic record data
      try {
        const academicData = JSON.parse(record.description || '{}');
        setFormData({
          qualificationType: academicData.qualificationType || '',
          institutionName: academicData.institutionName || '',
          majorSubject: academicData.majorSubject || '',
          startDate: academicData.startDate || '',
          endDate: academicData.endDate || '',
          gradingSystem: academicData.gradingSystem || '',
          grade: academicData.grade || '',
          remarks: academicData.remarks || ''
        });
      } catch (e) {
        // If parsing fails, use basic document info
        setFormData({
          qualificationType: '',
          institutionName: record.name || '',
          majorSubject: '',
          startDate: '',
          endDate: '',
          gradingSystem: '',
          grade: '',
          remarks: record.description || ''
        });
      }
    } else {
      setSelectedRecord(null);
      setFormData({
        qualificationType: '',
        institutionName: '',
        majorSubject: '',
        startDate: '',
        endDate: '',
        gradingSystem: '',
        grade: '',
        remarks: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRecord(null);
    setFormData({
      qualificationType: '',
      institutionName: '',
      majorSubject: '',
      startDate: '',
      endDate: '',
      gradingSystem: '',
      grade: '',
      remarks: '',
      certificateFile: null
    });
    // Clear the file input
    const fileInput = document.getElementById('certificate-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (formData.certificateFile) {
        // Upload file with academic record data
        const formDataToSend = new FormData();
        formDataToSend.append('file', formData.certificateFile);
        formDataToSend.append('type', 'ACADEMIC_TRANSCRIPT');
        formDataToSend.append('description', JSON.stringify({
          qualificationType: formData.qualificationType,
          institutionName: formData.institutionName,
          majorSubject: formData.majorSubject,
          startDate: formData.startDate,
          endDate: formData.endDate,
          gradingSystem: formData.gradingSystem,
          grade: formData.grade,
          remarks: formData.remarks
        }));
        formDataToSend.append('priority', 'HIGH');

        if (selectedRecord) {
          // Update existing document with new file
          await axiosInstance.put(`/counselor/documents/${selectedRecord.id}`, formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          // Create new document with file
          await axiosInstance.post(`/counselor/students/${studentId}/documents/upload`, formDataToSend, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      } else {
        // Create document without file (metadata only)
        const documentData = {
          type: 'ACADEMIC_TRANSCRIPT',
          name: `${formData.qualificationType} - ${formData.institutionName}`,
          description: JSON.stringify({
            qualificationType: formData.qualificationType,
            institutionName: formData.institutionName,
            majorSubject: formData.majorSubject,
            startDate: formData.startDate,
            endDate: formData.endDate,
            gradingSystem: formData.gradingSystem,
            grade: formData.grade,
            remarks: formData.remarks
          }),
          status: 'PENDING'
        };

        if (selectedRecord) {
          // Update existing document
          await axiosInstance.put(`/counselor/documents/${selectedRecord.id}`, documentData);
        } else {
          // Create new document
          await axiosInstance.post(`/counselor/students/${studentId}/documents`, documentData);
        }
      }
      
      fetchRecords();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving academic record:', error);
      setError('Failed to save academic record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this academic record? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Attempting to delete document:', recordId);
      const response = await axiosInstance.delete(`/counselor/documents/${recordId}`);
      console.log('Delete response:', response.data);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting academic record:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to delete academic record. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this document.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      setLoading(true);
      console.log('Attempting to download document:', documentId);
      const response = await axiosInstance.get(`/counselor/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // Check if this is a JSON response (metadata document)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // For metadata documents, the response is already JSON
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fileName || 'academic_record'}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        // For physical files
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'academic_record.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to download document. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to download this document.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (document) => {
    try {
      setLoading(true);
      console.log('Attempting to preview document:', document.id);
      console.log('Document details:', {
        id: document.id,
        name: document.name,
        type: document.type,
        mimeType: document.mimeType,
        url: document.url,
        path: document.path
      });
      
      // Check if document is previewable
      const response = await axiosInstance.get(`/counselor/documents/${document.id}/preview`);
      
      // Check if response is JSON (metadata document or non-previewable file)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const data = response.data;
        
        // Handle metadata document preview
        if (data.previewable && data.contentType === 'application/json') {
          // Create a formatted display of the metadata
          const metadata = data.document;
          let previewContent = '';
          
          try {
            // Parse the description if it's JSON
            const descriptionText = metadata.description || '{}';
            // Validate that description looks like JSON
            if (!descriptionText.trim() || (!descriptionText.trim().startsWith('{') && !descriptionText.trim().startsWith('['))) {
              throw new Error('Invalid JSON format');
            }
            const description = JSON.parse(descriptionText);
            previewContent = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>${metadata.name}</h2>
                <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
                  <p style="margin: 0; color: #0066cc;"><strong>  This is a metadata-only record. No certificate file is attached.</strong></p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">To upload a certificate file, edit this record and use the "Upload Certificate" field.</p>
                </div>
                <h3>Document Information</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${metadata.type}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${metadata.status}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Created:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(metadata.createdAt).toLocaleDateString()}</td></tr>
                </table>
                
                <h3>Academic Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Qualification:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.qualificationType || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Institution:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.institutionName || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Major/Subject:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.majorSubject || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.startDate || 'N/A'} - ${description.endDate || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Grading System:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.gradingSystem || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Grade/Score:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.grade || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Remarks:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${description.remarks || 'N/A'}</td></tr>
                </table>
              </div>
            `;
          } catch (e) {
            // Fallback if description is not valid JSON
            previewContent = `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>${metadata.name}</h2>
                <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
                  <p style="margin: 0; color: #0066cc;"><strong>  This is a metadata-only record. No certificate file is attached.</strong></p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">To upload a certificate file, edit this record and use the "Upload Certificate" field.</p>
                </div>
                <p><strong>Description:</strong> ${metadata.description || 'No description available'}</p>
                <p><strong>Type:</strong> ${metadata.type}</p>
                <p><strong>Status:</strong> ${metadata.status}</p>
                <p><strong>Created:</strong> ${new Date(metadata.createdAt).toLocaleDateString()}</p>
              </div>
            `;
          }
          
          // Create a blob with the HTML content
          const blob = new Blob([previewContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl(url);
          setPreviewFileName(document.name || 'Document Preview');
          setPreviewDialog(true);
          return;
        }
        
        // Handle non-previewable files
        if (!data.previewable) {
          alert(data.message || 'Preview not available for this file type. Please download to view.');
          return;
        }
        
        // Handle previewable files with signed URL
        if (data.previewable && data.previewUrl) {
          console.log('Using signed URL for preview:', data.previewUrl);
          setPreviewUrl(data.previewUrl);
          setPreviewFileName(document.name || 'Document Preview');
          setPreviewDialog(true);
          return;
        }
      }
      
      // For physical files, create preview URL
      const url = window.URL.createObjectURL(response.data);
      setPreviewUrl(url);
      setPreviewFileName(document.name || 'Document Preview');
      setPreviewDialog(true);
    } catch (error) {
      console.error('Error previewing document:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to preview document. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = 'Document not found or access denied.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to preview this document.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewDialog(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setPreviewFileName('');
  };

  const parseAcademicData = (record) => {
    try {
      return JSON.parse(record.description || '{}');
    } catch (e) {
      return {
        qualificationType: 'UNKNOWN',
        institutionName: record.name || 'Unknown Institution',
        majorSubject: '',
        startDate: '',
        endDate: '',
        gradingSystem: '',
        grade: '',
        remarks: record.description || ''
      };
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Academic Records</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Record
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Qualification</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Major</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => {
                  const academicData = parseAcademicData(record);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="primary" />
                          <Typography>
                            {academicData.qualificationType?.replace(/_/g, ' ') || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{academicData.institutionName}</TableCell>
                      <TableCell>{academicData.majorSubject || 'N/A'}</TableCell>
                      <TableCell>
                        {academicData.startDate && academicData.endDate 
                          ? `${academicData.startDate} - ${academicData.endDate}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {academicData.grade ? (
                          <Chip 
                            label={`${academicData.grade} (${academicData.gradingSystem?.replace(/_/g, ' ')})`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={record.status}
                          size="small"
                          color={
                            record.status === 'APPROVED' ? 'success' :
                            record.status === 'REJECTED' ? 'error' :
                            'warning'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(record.id, record.name)}
                          title="Download"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(record)}
                          title="Preview"
                        >
                          <PreviewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(record)}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(record.id)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No academic records added yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedRecord ? 'Edit Academic Record' : 'New Academic Record'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Qualification Type"
                    value={formData.qualificationType}
                    onChange={(e) => setFormData({...formData, qualificationType: e.target.value})}
                    required
                  >
                    {QUALIFICATION_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Institution Name"
                    value={formData.institutionName}
                    onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Major/Subject"
                    value={formData.majorSubject}
                    onChange={(e) => setFormData({...formData, majorSubject: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Grading System"
                    value={formData.gradingSystem}
                    onChange={(e) => setFormData({...formData, gradingSystem: e.target.value})}
                  >
                    {GRADING_SYSTEMS.map((system) => (
                      <MenuItem key={system} value={system}>
                        {system.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Grade/Score"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Remarks/Notes"
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: 2, 
                    p: 2, 
                    textAlign: 'center',
                    bgcolor: formData.certificateFile ? 'success.light' : 'grey.50',
                    borderColor: formData.certificateFile ? 'success.main' : 'grey.300'
                  }}>
                    <input
                      type="file"
                      id="certificate-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData({...formData, certificateFile: file});
                        }
                      }}
                    />
                    <label htmlFor="certificate-upload">
                      <Box sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <AttachFileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Typography variant="h6" color="primary">
                          {formData.certificateFile ? 'Certificate Selected' : 'Upload Certificate'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.certificateFile ? 
                            `${formData.certificateFile.name} (${(formData.certificateFile.size / 1024 / 1024).toFixed(2)} MB)` :
                            'Click to upload certificate (PDF, JPG, PNG, DOC, DOCX)'
                          }
                        </Typography>
                        {formData.certificateFile && (
                          <Button
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({...formData, certificateFile: null});
                              document.getElementById('certificate-upload').value = '';
                            }}
                          >
                            Remove File
                          </Button>
                        )}
                      </Box>
                    </label>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : (selectedRecord ? 'Update' : 'Add')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialog} onClose={handleClosePreview} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{previewFileName}</Typography>
              <Button onClick={handleClosePreview} color="inherit">
                Close
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0, height: '70vh' }}>
            {previewUrl && (
              <iframe
                src={previewUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Document Preview"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default AcademicRecords; 