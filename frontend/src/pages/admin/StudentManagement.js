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
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';

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

const STATUSES = ['ACTIVE', 'DEFERRED', 'REJECTED'];

function StudentManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    phase: '',
    status: '',
    counselorId: ''
  });
  const [counselors, setCounselors] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPhase: '',
    status: '',
    counselorId: ''
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        _t: Date.now() // Cache busting parameter
      };
      
      const response = await axiosInstance.get('/admin/students', {
        params
      });
      
      setStudents(response.data.data?.students || []);
      setTotalStudents(response.data.data?.total || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again later.');
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const response = await axiosInstance.get('/admin/counselors', {
        params: {
          _t: Date.now() // Cache busting parameter
        }
      });
      const counselorsData = response.data.data || response.data || [];
      setCounselors(counselorsData);
    } catch (error) {
      console.error('Error fetching counselors:', error);
      setCounselors([]);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCounselors();
  }, [page, rowsPerPage, filters]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || '',
      currentPhase: student.currentPhase,
      status: student.status,
      counselorId: student.counselorId || ''
    });
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await axiosInstance.put(`/admin/students/${selectedStudent.id}`, editForm);
      setOpenEditDialog(false);
      fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error response:', error.response?.data);
      console.error('Request URL attempted:', error.config?.url);
      setError(`Failed to update student: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This will also delete all associated documents, applications, notes, and tasks.')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/admin/students/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      console.error('Error response:', error.response?.data);
      setError(`Failed to delete student: ${error.response?.data?.message || error.message}`);
    }
  };

  const getPhaseColor = (phase) => {
    const colors = {
      DOCUMENT_COLLECTION: 'info',
      UNIVERSITY_SHORTLISTING: 'primary',
      APPLICATION_SUBMISSION: 'warning',
      OFFER_RECEIVED: 'success',
      INITIAL_PAYMENT: 'secondary',
      INTERVIEW: 'warning',
      FINANCIAL_TB_TEST: 'info',
      CAS_VISA: 'primary',
      VISA_APPLICATION: 'warning',
      ENROLLMENT: 'success'
    };
    return colors[phase] || 'default';
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
        <Typography variant="h4" component="h1" gutterBottom>
          Student Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Phase"
                value={filters.phase}
                onChange={(e) => handleFilterChange('phase', e.target.value)}
              >
                <MenuItem value="">All Phases</MenuItem>
                {PHASES.map((phase) => (
                  <MenuItem key={phase} value={phase}>
                    {phase.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Counselor"
                value={filters.counselorId}
                onChange={(e) => handleFilterChange('counselorId', e.target.value)}
              >
                <MenuItem value="">All Counselors</MenuItem>
                {(counselors || []).map((counselor) => (
                  <MenuItem key={counselor.id} value={counselor.id}>
                    {counselor.name || 'Unknown Counselor'}
                  </MenuItem>
                ))}
              </TextField>
              {counselors.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No counselors found (Length: {counselors.length})
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Students Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phase</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Enrollment</TableCell>
                    <TableCell>Universities</TableCell>
                    <TableCell>Counselor</TableCell>
                    <TableCell>Registration Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {(students || []).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                        {student.firstName} {student.lastName}
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.currentPhase.replace(/_/g, ' ')}
                        color={getPhaseColor(student.currentPhase)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        color={student.status === 'ACTIVE' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.hasEnrollmentCompleted ? 'Enrolled' : 'Not Enrolled'}
                        color={student.hasEnrollmentCompleted ? 'success' : 'default'}
                        size="small"
                        variant={student.hasEnrollmentCompleted ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      {student.applications && student.applications.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {student.applications.slice(0, 2).map((app) => (
                            <Chip
                              key={app.id}
                              label={app.university?.name || 'Unknown'}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}
                          {student.applications.length > 2 && (
                            <Chip
                              label={`+${student.applications.length - 2}`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.counselor ? student.counselor.name : 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(student.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(student)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(student.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(students || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      {loading ? 'Loading...' : 'No students found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalStudents}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Edit Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Phase"
                  value={editForm.currentPhase}
                  onChange={(e) => setEditForm({ ...editForm, currentPhase: e.target.value })}
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
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Assigned Counselor"
                  value={editForm.counselorId}
                  onChange={(e) => setEditForm({ ...editForm, counselorId: e.target.value })}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {(counselors || []).map((counselor) => (
                    <MenuItem key={counselor.id} value={counselor.id}>
                      {counselor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default StudentManagement; 