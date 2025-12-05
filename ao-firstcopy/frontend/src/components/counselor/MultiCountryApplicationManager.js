import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Flag as FlagIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const MultiCountryApplicationManager = ({ studentId }) => {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState([]);
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [countryProcesses, setCountryProcesses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [studentId, user, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load applications grouped by country with retry logic
      let applicationsResponse;
      try {
        applicationsResponse = await axiosInstance.get(`/applications/student/${studentId}/by-country`);
      } catch (error) {
        if (error.response?.status === 429) {
          // Wait 2 seconds and retry once
          await new Promise(resolve => setTimeout(resolve, 2000));
          applicationsResponse = await axiosInstance.get(`/applications/student/${studentId}/by-country`);
        } else {
          throw error;
        }
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load country processes with retry logic
      let processesResponse;
      try {
        processesResponse = await axiosInstance.get('/country-processes');
      } catch (error) {
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          processesResponse = await axiosInstance.get('/country-processes');
        } else {
          throw error;
        }
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load universities with retry logic
      let universitiesResponse;
      try {
        universitiesResponse = await axiosInstance.get('/counselor/universities');
      } catch (error) {
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          universitiesResponse = await axiosInstance.get('/counselor/universities');
        } else {
          throw error;
        }
      }
      
      const applicationsData = applicationsResponse.data.data || [];
      const applicationsByCountry = {};
      applicationsData.forEach(countryData => {
        applicationsByCountry[countryData.country] = countryData.applications || [];
      });
      setApplications(applicationsByCountry);
      setCountries(applicationsData.map(countryData => countryData.country));
      setUniversities(universitiesResponse.data);
      
      // Create country processes lookup
      const processes = {};
      processesResponse.data.data.forEach(process => {
        processes[process.country] = process;
      });
      setCountryProcesses(processes);
      
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('Failed to load application data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCountryApplications = (country) => {
    return applications[country] || [];
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      case 'SUBMITTED': return 'info';
      case 'UNDER_REVIEW': return 'primary';
      default: return 'default';
    }
  };

  const getApplicationStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircleIcon />;
      case 'REJECTED': return <WarningIcon />;
      case 'PENDING': return <InfoIcon />;
      default: return <TimelineIcon />;
    }
  };

  const renderCountryOverview = (country) => {
    const countryApps = getCountryApplications(country);
    const process = countryProcesses[country];
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FlagIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{country}</Typography>
            <Chip 
              label={`${countryApps.length} applications`} 
              color="primary" 
              size="small" 
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Application System
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {process?.applicationProcess?.system || 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Max Choices
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {process?.applicationProcess?.maxChoices || 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Available Intakes
              </Typography>
              <Typography variant="body2">
                {process?.intakeTerms?.join(', ') || 'N/A'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Visa Requirements
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {process?.visaRequirements?.type || 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Processing Time
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {process?.visaRequirements?.processingTime || 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Fees
              </Typography>
              <Typography variant="body2">
                ${process?.visaRequirements?.fees?.total || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderApplicationsTable = (country) => {
    const countryApps = getCountryApplications(country);
    
    return (
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>University</TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Intake</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {countryApps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {app.university?.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {app.university?.country}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {app.courseName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {app.courseLevel}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{app.intakeTerm}</TableCell>
                <TableCell>
                  <Chip
                    icon={getApplicationStatusIcon(app.applicationStatus)}
                    label={app.applicationStatus}
                    color={getApplicationStatusColor(app.applicationStatus)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={app.priority}
                    color={app.isPrimaryChoice ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  ${app.applicationFee || 0}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderCountryProcessDetails = (country) => {
    const process = countryProcesses[country];
    if (!process) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <SchoolIcon sx={{ mr: 1, fontSize: 20 }} />
            {country} Application Process Details
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Application Steps
              </Typography>
              {process.applicationProcess?.steps?.map((step, index) => (
                <Box key={index} sx={{ mb: 1, pl: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Step {step.step}: {step.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {step.description} ({step.duration})
                  </Typography>
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Required Documents
              </Typography>
              {Object.entries(process.requiredDocuments || {}).map(([category, docs]) => (
                <Box key={category} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                    {category}:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {docs.map((doc, index) => (
                      <Typography key={index} variant="caption" display="block">
                        • {doc}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Please log in to view application data.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ m: 2 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadData}
              disabled={loading}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    );
  }

  // Check if student has only one country application
  const hasSingleCountry = countries.length === 1;
  const totalApplications = Object.values(applications).reduce((sum, apps) => sum + apps.length, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Multi-Country Application Manager
      </Typography>
      
      {/* Show warning message for single country applications */}
      {hasSingleCountry && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Single Country Application Notice:</strong> This student currently has applications in only one country ({countries[0]}). 
            Consider adding applications to additional countries to increase their chances of acceptance and provide backup options.
          </Typography>
        </Alert>
      )}
      
      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Applications" />
        <Tab label="Country Processes" />
      </Tabs>

      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {hasSingleCountry ? `Application Summary for ${countries[0]}` : 'Application Summary by Country'}
          </Typography>
          {countries.map(country => renderCountryOverview(country))}
          
          {/* Show suggestion for single country applications */}
          {hasSingleCountry && (
            <Card sx={{ mt: 3, backgroundColor: '#fff3e0', border: '1px solid #ff9800' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon sx={{ color: '#ff9800', mr: 1 }} />
                  <Typography variant="subtitle1" color="warning.main" fontWeight="bold">
                    Recommendation for Better Success
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  To increase this student's chances of acceptance, consider adding applications to additional countries such as:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {['United States', 'Canada', 'Australia', 'Germany'].filter(c => !countries.includes(c)).map(country => (
                    <Chip
                      key={country}
                      label={country}
                      variant="outlined"
                      size="small"
                      icon={<FlagIcon />}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="textSecondary">
                  <strong>Benefits of multi-country applications:</strong> Higher acceptance rates, backup options, 
                  different intake timelines, and varied scholarship opportunities.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {hasSingleCountry ? `Applications in ${countries[0]}` : 'Applications by Country'}
          </Typography>
          {countries.map(country => (
            <Box key={country} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {country} Applications ({getCountryApplications(country).length} application{getCountryApplications(country).length !== 1 ? 's' : ''})
              </Typography>
              {renderApplicationsTable(country)}
            </Box>
          ))}
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            {hasSingleCountry ? `${countries[0]} Application Process` : 'Country-Specific Application Processes'}
          </Typography>
          {countries.map(country => renderCountryProcessDetails(country))}
        </Box>
      )}
    </Box>
  );
};

export default MultiCountryApplicationManager;
