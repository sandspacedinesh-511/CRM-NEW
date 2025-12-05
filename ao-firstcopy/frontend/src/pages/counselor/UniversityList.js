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
  Alert,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Link,
  Chip,
  useTheme,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  InputAdornment,
  Divider,
  Rating,
  Switch,
  FormControlLabel,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as WebsiteIcon,
  School as ProgramIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  Assignment as AssignmentIcon,
  Book as BookIcon,
  Money as MoneyIcon,
  People as PeopleIcon,
  Flag as FlagIcon,
  Public as PublicIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COUNTRY_OPTIONS = [
  { value: 'ALL', label: 'All Countries' },
  { value: 'USA', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CANADA', label: 'Canada' },
  { value: 'AUSTRALIA', label: 'Australia' },
  { value: 'GERMANY', label: 'Germany' },
  { value: 'FRANCE', label: 'France' },
  { value: 'NETHERLANDS', label: 'Netherlands' },
  { value: 'IRELAND', label: 'Ireland' },
  { value: 'NEW_ZEALAND', label: 'New Zealand' },
  { value: 'OTHER', label: 'Other' }
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'ranking_asc', label: 'Ranking (Low to High)' },
  { value: 'ranking_desc', label: 'Ranking (High to Low)' },
  { value: 'acceptance_rate_asc', label: 'Acceptance Rate (Low to High)' },
  { value: 'acceptance_rate_desc', label: 'Acceptance Rate (High to Low)' },
  { value: 'created_asc', label: 'Added (Oldest)' },
  { value: 'created_desc', label: 'Added (Newest)' }
];

function UniversityList() {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    website: '',
    admissionRequirements: '',
    applicationDeadline: '',
    tuitionFees: '',
    programsOffered: '',
    ranking: '',
    acceptanceRate: '',
    notes: '',
    isActive: true,
    contactEmail: '',
    contactPhone: '',
    address: '',
    foundedYear: '',
    studentPopulation: '',
    internationalStudents: ''
  });

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/counselor/universities', {
        params: {
          search: searchQuery,
          country: countryFilter === 'ALL' ? undefined : countryFilter,
          sort: sortBy,
          page: page + 1,
          limit: rowsPerPage
        }
      });
      
      if (response.data.success) {
        setUniversities(response.data.data?.universities || []);
      } else {
        setUniversities(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setError('Failed to load universities. Please try again later.');
      setUniversities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, [searchQuery, countryFilter, sortBy, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, university = null) => {
    setDialogMode(mode);
    setSelectedUniversity(university);
    if (university) {
      setFormData({
        name: university.name,
        country: university.country,
        website: university.website,
        admissionRequirements: university.admissionRequirements,
        applicationDeadline: university.applicationDeadline,
        tuitionFees: university.tuitionFees,
        programsOffered: university.programsOffered,
        ranking: university.ranking,
        acceptanceRate: university.acceptanceRate,
        notes: university.notes || '',
        isActive: university.isActive !== false,
        contactEmail: university.contactEmail || '',
        contactPhone: university.contactPhone || '',
        address: university.address || '',
        foundedYear: university.foundedYear || '',
        studentPopulation: university.studentPopulation || '',
        internationalStudents: university.internationalStudents || ''
      });
    } else {
      setFormData({
        name: '',
        country: '',
        website: '',
        admissionRequirements: '',
        applicationDeadline: '',
        tuitionFees: '',
        programsOffered: '',
        ranking: '',
        acceptanceRate: '',
        notes: '',
        isActive: true,
        contactEmail: '',
        contactPhone: '',
        address: '',
        foundedYear: '',
        studentPopulation: '',
        internationalStudents: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUniversity(null);
    setFormData({
      name: '',
      country: '',
      website: '',
      admissionRequirements: '',
      applicationDeadline: '',
      tuitionFees: '',
      programsOffered: '',
      ranking: '',
      acceptanceRate: '',
      notes: '',
      isActive: true,
      contactEmail: '',
      contactPhone: '',
      address: '',
      foundedYear: '',
      studentPopulation: '',
      internationalStudents: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === 'add') {
        await axiosInstance.post('/counselor/universities', formData);
      } else {
        await axiosInstance.put(`/counselor/universities/${selectedUniversity.id}`, formData);
      }
      handleCloseDialog();
      fetchUniversities();
    } catch (error) {
      console.error('Error saving university:', error);
      setError('Failed to save university. Please try again.');
    }
  };

  const handleDelete = async (universityId) => {
    if (!window.confirm('Are you sure you want to delete this university?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/counselor/universities/${universityId}`);
      fetchUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
      setError('Failed to delete university. Please try again.');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUniversities.length === 0) return;

    try {
      if (bulkAction === 'delete') {
        await axiosInstance.delete('/counselor/universities/bulk', {
          data: { universityIds: selectedUniversities }
        });
      } else if (bulkAction === 'activate') {
        await axiosInstance.patch('/counselor/universities/bulk-activate', {
          universityIds: selectedUniversities,
          isActive: true
        });
      } else if (bulkAction === 'deactivate') {
        await axiosInstance.patch('/counselor/universities/bulk-activate', {
          universityIds: selectedUniversities,
          isActive: false
        });
      }
      
      setSelectedUniversities([]);
      setBulkActionDialog(false);
      setBulkAction('');
      fetchUniversities();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action. Please try again.');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUniversities(universities.map(uni => uni.id));
    } else {
      setSelectedUniversities([]);
    }
  };

  const handleSelectUniversity = (universityId) => {
    setSelectedUniversities(prev => 
      prev.includes(universityId) 
        ? prev.filter(id => id !== universityId)
        : [...prev, universityId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCountryFilter('ALL');
    setSortBy('name_asc');
    setPage(0);
  };

  const getUniversityStats = () => {
    const total = universities.length;
    const active = universities.filter(u => u.isActive !== false).length;
    const inactive = universities.filter(u => u.isActive === false).length;
    const topRanked = universities.filter(u => u.ranking && parseInt(u.ranking) <= 100).length;
    const highAcceptance = universities.filter(u => u.acceptanceRate && parseFloat(u.acceptanceRate) >= 50).length;
    
    return { total, active, inactive, topRanked, highAcceptance };
  };

  const stats = getUniversityStats();

  const getCountryFlag = (country) => {
    const flags = {
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'CANADA': '🇨🇦',
      'AUSTRALIA': '🇦🇺',
      'GERMANY': '🇩🇪',
      'FRANCE': '🇫🇷',
      'NETHERLANDS': '🇳🇱',
      'IRELAND': '🇮🇪',
      'NEW_ZEALAND': '🇳🇿'
    };
    return flags[country] || 'C';
  };

  const LoadingSkeleton = () => (
    <Grid container spacing={3}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} md={4} key={item}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );

  if (loading && universities.length === 0) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LoadingSkeleton />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
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
              Universities
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Manage and track university information and partnerships
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchUniversities}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('add')}
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
              Add University
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary[50]} 0%, ${theme.palette.primary[100]} 100%)`,
              border: `1px solid ${theme.palette.primary[200]}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Universities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success[50]} 0%, ${theme.palette.success[100]} 100%)`,
              border: `1px solid ${theme.palette.success[200]}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.warning[50]} 0%, ${theme.palette.warning[100]} 100%)`,
              border: `1px solid ${theme.palette.warning[200]}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                  {stats.inactive}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Inactive
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.info[50]} 0%, ${theme.palette.info[100]} 100%)`,
              border: `1px solid ${theme.palette.info[200]}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                  {stats.topRanked}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Top 100 Ranked
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.secondary[50]} 0%, ${theme.palette.secondary[100]} 100%)`,
              border: `1px solid ${theme.palette.secondary[200]}`
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                  {stats.highAcceptance}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  High Acceptance Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
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
        )}

        {/* Filters */}
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
                    placeholder="Search universities..."
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
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Country</InputLabel>
                        <Select
                          value={countryFilter}
                          onChange={(e) => setCountryFilter(e.target.value)}
                          label="Country"
                        >
                          {COUNTRY_OPTIONS.map((country) => (
                            <MenuItem key={country.value} value={country.value}>
                              {country.value !== 'ALL' && getCountryFlag(country.value)} {country.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
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

        {/* Bulk Actions */}
        {selectedUniversities.length > 0 && (
          <Card sx={{ mb: 3, backgroundColor: theme.palette.primary[50] }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">
                  {selectedUniversities.length} university(ies) selected
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
                    onClick={() => setSelectedUniversities([])}
                  >
                    Clear Selection
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Universities Table */}
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUniversities.length === universities.length && universities.length > 0}
                        indeterminate={selectedUniversities.length > 0 && selectedUniversities.length < universities.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>University</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Ranking</TableCell>
                    <TableCell>Acceptance Rate</TableCell>
                    <TableCell>Programs</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {universities.map((university) => (
                    <TableRow key={university.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUniversities.includes(university.id)}
                          onChange={() => handleSelectUniversity(university.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: university.isActive !== false ? theme.palette.primary.main : theme.palette.grey[400]
                          }}>
                            <SchoolIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {university.name}
                            </Typography>
                            {university.website && (
                              <Link 
                                href={university.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Visit Website
                              </Link>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ fontSize: '1.2rem' }}>
                            {getCountryFlag(university.country)}
                          </span>
                          <Typography variant="body2">
                            {COUNTRY_OPTIONS.find(c => c.value === university.country)?.label || university.country}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {university.ranking ? (
                          <Chip
                            label={`#${university.ranking}`}
                            color={parseInt(university.ranking) <= 50 ? 'success' : 
                                   parseInt(university.ranking) <= 100 ? 'primary' : 
                                   parseInt(university.ranking) <= 200 ? 'warning' : 'default'}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {university.acceptanceRate ? (
                          <Typography variant="body2">
                            {university.acceptanceRate}%
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150 }}>
                          {university.programsOffered ? 
                            university.programsOffered.split(',').slice(0, 2).join(', ') + 
                            (university.programsOffered.split(',').length > 2 ? '...' : '') :
                            'N/A'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={university.isActive !== false ? 'Active' : 'Inactive'}
                          color={university.isActive !== false ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', university)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(university.id)}
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

            {universities.length === 0 && !loading && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: theme.palette.text.secondary
              }}>
                <SchoolIcon sx={{ fontSize: '4rem', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No universities found
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  {searchQuery || countryFilter !== 'ALL' 
                    ? 'Try adjusting your filters or search terms'
                    : 'Start by adding your first university'
                  }
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('add')}
                >
                  Add University
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
      </Box>

      {/* Add/Edit University Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New University' : 'Edit University'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="University Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    label="Country"
                    required
                  >
                    {COUNTRY_OPTIONS.filter(c => c.value !== 'ALL').map((country) => (
                      <MenuItem key={country.value} value={country.value}>
                        {getCountryFlag(country.value)} {country.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  type="url"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ranking"
                  value={formData.ranking}
                  onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Acceptance Rate (%)"
                  value={formData.acceptanceRate}
                  onChange={(e) => setFormData({ ...formData, acceptanceRate: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tuition Fees"
                  value={formData.tuitionFees}
                  onChange={(e) => setFormData({ ...formData, tuitionFees: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Application Deadline"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Founded Year"
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  type="email"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Programs Offered"
                  value={formData.programsOffered}
                  onChange={(e) => setFormData({ ...formData, programsOffered: e.target.value })}
                  multiline
                  rows={2}
                  placeholder="e.g., Computer Science, Business, Engineering"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Admission Requirements"
                  value={formData.admissionRequirements}
                  onChange={(e) => setFormData({ ...formData, admissionRequirements: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active University"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'add' ? 'Add University' : 'Update University'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            What would you like to do with {selectedUniversities.length} selected university(ies)?
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="activate">Activate Universities</MenuItem>
              <MenuItem value="deactivate">Deactivate Universities</MenuItem>
              <MenuItem value="delete">Delete Universities</MenuItem>
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
    </Container>
  );
}

export default UniversityList; 