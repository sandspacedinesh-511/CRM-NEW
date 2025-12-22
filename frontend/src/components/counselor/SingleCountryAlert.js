import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  School as SchoolIcon,
  Flag as FlagIcon,
  Person as PersonIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';

const SingleCountryAlert = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadStudentsWithoutDualApplications();
    }
  }, [user, authLoading]);

  const loadStudentsWithoutDualApplications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/applications/single-country');
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students without dual applications');
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (country) => {
    const flagMap = {
      'United Kingdom': '🇬🇧',
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Germany': '🇩🇪'
    };
    return flagMap[country] || ' ';
  };

  const handleAddApplication = (studentId) => {
    navigate(`/counselor/applications?studentId=${studentId}&tab=2`);
  };

  const handleViewStudent = (studentId) => {
    navigate(`/counselor/students/${studentId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (students.length === 0) {
    return null; // Don't show anything if no students without dual applications
  }

  return (
    <Card sx={{ mb: 3, border: '2px solid #ff9800' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ color: '#ff9800', mr: 1, fontSize: 28 }} />
          <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
            Students Without Dual Applications
          </Typography>
          <Chip 
            label={students.length} 
            color="warning" 
            size="small" 
            sx={{ ml: 2 }}
          />
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Counselor Notice:</strong> The following students have applications in only one country. 
            Consider adding applications to additional countries to increase their chances of acceptance 
            and provide backup options.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mr: 2 }}
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </Button>
          <Typography variant="body2" color="textSecondary">
            Click to view students and their current applications
          </Typography>
        </Box>

        <Collapse in={expanded}>
          <List>
            {students.map((student) => (
              <ListItem
                key={student.id}
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: '#fafafa'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {student.firstName} {student.lastName}
                      </Typography>
                      <Chip
                        label={`${student.countryCount} country`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Current Applications: {student.applications?.length || 0}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {student.countries?.map((country) => (
                          <Chip
                            key={country}
                            label={country}
                            size="small"
                            icon={<span>{getCountryFlag(country)}</span>}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      {student.applications?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Universities: {student.applications.map(app => app.university?.name).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleViewStudent(student.id)}
                    title="View Student Details"
                  >
                    <SchoolIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddApplication(student.id)}
                    sx={{ minWidth: 'auto' }}
                  >
                    Add Application
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 1 }}>
          <Typography variant="body2" color="textSecondary">
            <strong>Recommendation:</strong> Consider adding applications to countries like the United States, 
            Canada, or Australia to provide students with more options and increase their chances of acceptance.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SingleCountryAlert;
