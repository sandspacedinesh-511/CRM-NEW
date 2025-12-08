import { useState, useEffect, useRef } from 'react';
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
  Grid,
  MenuItem,
  Rating
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
  Language as WebsiteIcon,
  LocationOn as LocationIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';

const COUNTRIES = [
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Ireland',
  'Germany',
  'France',
  'Other'
];

function UniversityManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUniversities, setTotalUniversities] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    website: '',
    ranking: '',
    acceptanceRate: '',
    averageGPA: '',
    averageIELTS: '',
    averageTOEFL: '',
    tuitionFeeRange: '',
    description: '',
    requirements: '',
    applicationDeadlines: '',
    status: 'ACTIVE'
  });

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      clearMessages();
      const response = await axiosInstance.get('/admin/universities', {
        params: {
          page: page + 1,
          limit: rowsPerPage
        }
      });
      if (response.data.success) {
        setUniversities(response.data.data);
        setTotalUniversities(response.data.total || response.data.data.length);
      } else {
        setError(response.data.message || 'Failed to load universities');
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError(error.response?.data?.message || 'Failed to load universities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (university = null) => {
    clearMessages();
    if (university) {
      setSelectedUniversity(university);
      setFormData({
        name: university.name,
        country: university.country,
        city: university.city,
        website: university.website,
        ranking: university.ranking,
        acceptanceRate: university.acceptanceRate,
        averageGPA: university.averageGPA,
        averageIELTS: university.averageIELTS,
        averageTOEFL: university.averageTOEFL,
        tuitionFeeRange: university.tuitionFeeRange,
        description: university.description,
        requirements: university.requirements,
        applicationDeadlines: university.applicationDeadlines,
        status: university.status
      });
    } else {
      setSelectedUniversity(null);
      setFormData({
        name: '',
        country: '',
        city: '',
        website: '',
        ranking: '',
        acceptanceRate: '',
        averageGPA: '',
        averageIELTS: '',
        averageTOEFL: '',
        tuitionFeeRange: '',
        description: '',
        requirements: '',
        applicationDeadlines: '',
        status: 'ACTIVE'
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      let response;
      if (selectedUniversity) {
        response = await axiosInstance.put(`/admin/universities/${selectedUniversity.id}`, formData);
      } else {
        response = await axiosInstance.post('/admin/universities', formData);
      }
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setOpenDialog(false);
        fetchUniversities();
      } else {
        setError(response.data.message || 'Failed to save university');
      }
    } catch (error) {
      console.error('Error saving university:', error);
      setError(error.response?.data?.message || 'Failed to save university. Please try again.');
    }
  };

  const handleDelete = async (universityId) => {
    if (!window.confirm('Are you sure you want to delete this university?')) {
      return;
    }

    clearMessages();
    try {
      const response = await axiosInstance.delete(`/admin/universities/${universityId}`);
      if (response.data.success) {
        setSuccess(response.data.message);
        fetchUniversities();
      } else {
        setError(response.data.message || 'Failed to delete university');
      }
    } catch (error) {
      console.error('Error deleting university:', error);
      setError(error.response?.data?.message || 'Failed to delete university. Please try again.');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      setError('Please select an Excel file to import');
      return;
    }

    clearMessages();
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axiosInstance.post('/admin/universities/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setImportResults(response.data.results);
        setOpenImportDialog(false);
        setSelectedFile(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh the universities list
        fetchUniversities();
      } else {
        setError(response.data.message || 'Failed to import universities');
        if (response.data.results) {
          setImportResults(response.data.results);
        }
      }
    } catch (error) {
      console.error('Error importing universities:', error);
      const errorMessage = error.response?.data?.message || 'Failed to import universities. Please check the file format and try again.';
      setError(errorMessage);
      if (error.response?.data?.results) {
        setImportResults(error.response.data.results);
      }
      if (error.response?.data?.availableColumns) {
        setError(`${errorMessage}\n\nAvailable columns in your file: ${error.response.data.availableColumns.join(', ')}`);
      }
    } finally {
      setImporting(false);
    }
  };

  if (loading && page === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            University Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => {
                setOpenImportDialog(true);
                setImportResults(null);
                setSelectedFile(null);
              }}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add University
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>University Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Ranking</TableCell>
                  <TableCell>Acceptance Rate</TableCell>
                  <TableCell>Requirements</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {universities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {university.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            <WebsiteIcon sx={{ fontSize: 14, mr: 0.5 }} />
                            <a
                              href={university.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'inherit' }}
                            >
                              Visit Website
                            </a>
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 0.5, fontSize: 'small' }} />
                        {university.city}, {university.country}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {university.ranking ? `#${university.ranking}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {university.acceptanceRate ? `${university.acceptanceRate}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`IELTS: ${university.averageIELTS || 'N/A'}`}
                        size="small"
                        sx={{ mr: 0.5 }}
                      />
                      <Chip
                        label={`GPA: ${university.averageGPA || 'N/A'}`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={university.status}
                        color={university.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(university)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(university.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalUniversities}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {selectedUniversity ? 'Edit University' : 'Add University'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="University Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  >
                    {COUNTRIES.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Ranking"
                    value={formData.ranking}
                    onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Acceptance Rate (%)"
                    value={formData.acceptanceRate}
                    onChange={(e) => setFormData({ ...formData, acceptanceRate: e.target.value })}
                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Average GPA"
                    value={formData.averageGPA}
                    onChange={(e) => setFormData({ ...formData, averageGPA: e.target.value })}
                    InputProps={{ inputProps: { min: 0, max: 4, step: 0.1 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Average IELTS"
                    value={formData.averageIELTS}
                    onChange={(e) => setFormData({ ...formData, averageIELTS: e.target.value })}
                    InputProps={{ inputProps: { min: 0, max: 9, step: 0.5 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Average TOEFL"
                    value={formData.averageTOEFL}
                    onChange={(e) => setFormData({ ...formData, averageTOEFL: e.target.value })}
                    InputProps={{ inputProps: { min: 0, max: 120 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tuition Fee Range"
                    value={formData.tuitionFeeRange}
                    onChange={(e) => setFormData({ ...formData, tuitionFeeRange: e.target.value })}
                    placeholder="e.g., $20,000 - $30,000 per year"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Requirements"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Application Deadlines"
                    value={formData.applicationDeadlines}
                    onChange={(e) => setFormData({ ...formData, applicationDeadlines: e.target.value })}
                    placeholder="e.g., Fall 2024: January 15, 2024; Spring 2024: October 1, 2023"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {selectedUniversity ? 'Update' : 'Add'} University
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Bulk Import Dialog */}
        <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Bulk Import Universities</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Upload an Excel file (.xlsx or .xls) containing university data. The file should have the following columns:
              </Typography>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Required Columns:</Typography>
                <Typography variant="body2">• University Name (or Name)</Typography>
                <Typography variant="body2">• University Country (or Country)</Typography>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Optional Columns:</Typography>
                <Typography variant="body2">• Address, City, Location</Typography>
                <Typography variant="body2">• Website, URL</Typography>
                <Typography variant="body2">• Ranking, Rank</Typography>
                <Typography variant="body2">• Acceptance Rate, Acceptance</Typography>
                <Typography variant="body2">• Average GPA, GPA</Typography>
                <Typography variant="body2">• Average IELTS, IELTS</Typography>
                <Typography variant="body2">• Average TOEFL, TOEFL</Typography>
                <Typography variant="body2">• Fees, Tuition, Tuition Fee Range</Typography>
                <Typography variant="body2">• Description</Typography>
                <Typography variant="body2">• Requirements, Requirement</Typography>
                <Typography variant="body2">• Application Deadlines, Deadlines</Typography>
                <Typography variant="body2">• Campus(s), Campuses</Typography>
                <Typography variant="body2">• Intake(s), Intakes</Typography>
                <Typography variant="body2">• Course Type(s), Course Types</Typography>
              </Box>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="bulk-import-file-input"
              />
              <label htmlFor="bulk-import-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ mb: 2 }}
                  disabled={importing}
                >
                  {selectedFile ? selectedFile.name : 'Select Excel File'}
                </Button>
              </label>

              {selectedFile && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Alert>
              )}

              {importResults && (
                <Box sx={{ mt: 2 }}>
                  <Alert 
                    severity={importResults.failed > 0 ? 'warning' : 'success'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle2">
                      Import Results: {importResults.successful} successful, {importResults.failed} failed out of {importResults.total} total
                    </Typography>
                  </Alert>
                  
                  {importResults.errors && importResults.errors.length > 0 && (
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Errors:</Typography>
                      {importResults.errors.map((err, idx) => (
                        <Typography key={idx} variant="body2" color="error" sx={{ fontSize: '0.75rem' }}>
                          Row {err.row} ({err.data}): {err.error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenImportDialog(false);
              setSelectedFile(null);
              setImportResults(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkImport}
              variant="contained"
              disabled={!selectedFile || importing}
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default UniversityManagement; 