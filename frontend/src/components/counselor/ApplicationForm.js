import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axios';

const APPLICATION_STATUS = [
  'PENDING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACCEPTED',
  'REJECTED',
  'DEFERRED',
  'WAITLISTED',
  'CONDITIONAL_OFFER'
];

const COURSE_LEVELS = [
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'PHD',
  'DIPLOMA',
  'CERTIFICATE'
];

// Common intake terms for different countries
const INTAKE_TERMS = {
  'United States': ['FALL', 'SPRING', 'SUMMER'],
  'Canada': ['FALL', 'WINTER', 'SUMMER'],
  'United Kingdom': ['SEPTEMBER', 'JANUARY', 'APRIL'],
  'Australia': ['FEBRUARY', 'JULY', 'NOVEMBER'],
  'Germany': ['WINTER_SEMESTER', 'SUMMER_SEMESTER'],
  'France': ['SEPTEMBER', 'JANUARY'],
  'Netherlands': ['SEPTEMBER', 'FEBRUARY'],
  'Ireland': ['SEPTEMBER', 'JANUARY'],
  'New Zealand': ['FEBRUARY', 'JULY'],
  'Singapore': ['AUGUST', 'JANUARY'],
  'default': ['FALL', 'SPRING', 'SUMMER', 'WINTER']
};

const COURSE_OPTIONS = [
  // Computer Science & IT
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Data Science',
  'Artificial Intelligence',
  'Cybersecurity',
  'Computer Engineering',
  'Web Development',
  
  // Business & Management
  'Business Administration',
  'Business Management',
  'Finance',
  'Accounting',
  'Marketing',
  'International Business',
  'Economics',
  'Human Resource Management',
  
  // Engineering
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biomedical Engineering',
  'Aerospace Engineering',
  'Environmental Engineering',
  
  // Medicine & Health
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Physiotherapy',
  'Public Health',
  'Biomedical Sciences',
  'Psychology',
  
  // Arts & Humanities
  'English Literature',
  'History',
  'Philosophy',
  'Political Science',
  'International Relations',
  'Journalism',
  'Media Studies',
  
  // Sciences
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Statistics',
  'Environmental Science',
  
  // Other
  'Architecture',
  'Law',
  'Education',
  'Social Work',
  'Tourism & Hospitality',
  'Fashion Design',
  'Fine Arts'
];

function ApplicationForm({ 
  studentId, 
  application = null, 
  onSubmit, 
  onCancel, 
  universities = [],
  loadingUniversities = false 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countryProcesses, setCountryProcesses] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryIntakeTerms, setCountryIntakeTerms] = useState([]);
  const [formData, setFormData] = useState({
    universityId: '',
    courseName: '',
    courseLevel: 'UNDERGRADUATE',
    intakeTerm: '',
    applicationDeadline: '',
    applicationStatus: 'PENDING',
    applicationFee: '',
    priority: 1,
    isPrimaryChoice: false,
    isBackupChoice: false,
    notes: ''
  });

  // Load country application processes
  useEffect(() => {
    const loadCountryProcesses = async () => {
      try {
        const response = await axiosInstance.get('/country-processes');
        const processes = {};
        response.data.data.forEach(process => {
          processes[process.country] = process;
        });
        setCountryProcesses(processes);
      } catch (error) {
        console.error('Error loading country processes:', error);
      }
    };
    loadCountryProcesses();
  }, []);

  // Update intake terms when university/country changes
  useEffect(() => {
    console.log('🔄 University selection changed:', {
      universityId: formData.universityId,
      universities: universities.length,
      countryProcesses: Object.keys(countryProcesses).length
    });
    
    if (formData.universityId) {
      const university = universities.find(u => u.id === formData.universityId);
      console.log('🏫 Selected university:', university);
      
      if (university) {
        // Get country from university data
        const country = university.country || 'default';
        console.log('🌍 University country:', country);
        setSelectedCountry(country);
        
        // Try to get intake terms from country processes first, then fallback to predefined terms
        let intakeTerms = [];
        if (countryProcesses[country] && countryProcesses[country].intakeTerms) {
          intakeTerms = countryProcesses[country].intakeTerms;
          console.log('📋 Using country process intake terms:', intakeTerms);
        } else if (INTAKE_TERMS[country]) {
          intakeTerms = INTAKE_TERMS[country];
          console.log('📋 Using predefined intake terms for', country, ':', intakeTerms);
        } else {
          intakeTerms = INTAKE_TERMS['default'];
          console.log('📋 Using default intake terms:', intakeTerms);
        }
        
        setCountryIntakeTerms(intakeTerms);
        
        // Set default intake term if not already set
        if (!formData.intakeTerm && intakeTerms.length > 0) {
          console.log('🎯 Setting default intake term:', intakeTerms[0]);
          setFormData(prev => ({ ...prev, intakeTerm: intakeTerms[0] }));
        }
      }
    } else {
      // Reset intake terms when no university is selected
      console.log('🔄 Resetting intake terms - no university selected');
      setCountryIntakeTerms([]);
      setSelectedCountry('');
    }
  }, [formData.universityId, universities, countryProcesses]);

  useEffect(() => {
    if (application) {
      setFormData({
        universityId: application.universityId || '',
        courseName: application.courseName || application.programName || '',
        courseLevel: application.courseLevel || 'UNDERGRADUATE',
        intakeTerm: application.intakeTerm || '',
        applicationDeadline: application.applicationDeadline ? format(new Date(application.applicationDeadline), 'yyyy-MM-dd') : '',
        applicationStatus: application.applicationStatus || application.status || 'PENDING',
        applicationFee: application.applicationFee || '',
        priority: application.priority || 1,
        isPrimaryChoice: application.isPrimaryChoice || false,
        isBackupChoice: application.isBackupChoice || false,
        notes: application.notes || ''
      });
    }
  }, [application]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const data = {
        ...formData,
        studentId,
        // Ensure numeric fields are properly formatted
        applicationFee: formData.applicationFee ? parseFloat(formData.applicationFee) : null,
        priority: parseInt(formData.priority)
      };

      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Fallback to direct API calls if onSubmit is not provided
        if (application) {
          await axiosInstance.put(`/counselor/applications/${application.id}`, data);
        } else {
          await axiosInstance.post('/counselor/applications', data);
        }
      }
    } catch (error) {
      console.error('Error saving application:', error);
      setError('Failed to save application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCountryProcess = () => {
    return countryProcesses[selectedCountry] || null;
  };

  const renderCountryProcessInfo = () => {
    const process = getCountryProcess();
    if (!process) return null;

    return (
      <Card sx={{ mb: 2, bgcolor: 'background.default' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            {selectedCountry} Application Process
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
                Application Timeline
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {Object.entries(process.applicationTimeline || {}).map(([intake, timeline]) => (
                  <Grid item xs={12} md={6} key={intake}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {intake.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {Object.entries(timeline).map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                <LanguageIcon sx={{ mr: 1, fontSize: 20 }} />
                Language Requirements
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                <strong>Accepted Tests:</strong> {process.languageRequirements?.tests?.join(', ')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Minimum Scores:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                {Object.entries(process.languageRequirements?.minimumScores || {}).map(([level, scores]) => (
                  <Box key={level} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="primary">
                      {level.charAt(0).toUpperCase() + level.slice(1)}:
                    </Typography>
                    {Object.entries(scores).map(([test, score]) => (
                      <Typography key={test} variant="body2" sx={{ pl: 2 }}>
                        {test.toUpperCase()}: {score}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                <AccountBalanceIcon sx={{ mr: 1, fontSize: 20 }} />
                Visa & Financial Requirements
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                <strong>Visa Type:</strong> {process.visaRequirements?.type}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Processing Time:</strong> {process.visaRequirements?.processingTime}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total Fees:</strong> ${process.visaRequirements?.fees?.total}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Financial Proof Required:</strong> {process.financialRequirements?.amount}
              </Typography>
            </AccordionDetails>
          </Accordion>

          {process.specialNotes && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                <InfoIcon sx={{ mr: 1, fontSize: 16 }} />
                Special Notes
              </Typography>
              <Typography variant="body2" color="warning.dark">
                {process.specialNotes}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>University</InputLabel>
            <Select
              value={formData.universityId}
              onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
              label="University"
              disabled={loadingUniversities}
              error={!loadingUniversities && universities.length === 0}
            >
              {loadingUniversities ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} />
                    <span>Loading universities...</span>
                  </Box>
                </MenuItem>
              ) : (
                universities.map((university) => (
                  <MenuItem key={university.id} value={university.id}>
                    <Box>
                      <Typography variant="body1">{university.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {university.country}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Country Process Information */}
        {selectedCountry && renderCountryProcessInfo()}

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Course Level</InputLabel>
            <Select
              value={formData.courseLevel}
              onChange={(e) => setFormData({ ...formData, courseLevel: e.target.value })}
              label="Course Level"
            >
              {COURSE_LEVELS.map((level) => (
                <MenuItem key={level} value={level}>
                  {level.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Course Name</InputLabel>
            <Select
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              label="Course Name"
            >
              {COURSE_OPTIONS.map((course) => (
                <MenuItem key={course} value={course}>
                  {course}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Intake Term</InputLabel>
            <Select
              value={formData.intakeTerm}
              onChange={(e) => setFormData({ ...formData, intakeTerm: e.target.value })}
              label="Intake Term"
              disabled={!formData.universityId}
            >
              {countryIntakeTerms.length > 0 ? (
                countryIntakeTerms.map((term) => (
                  <MenuItem key={term} value={term}>
                    {term.replace('_', ' ')}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {formData.universityId ? 'Loading intake terms...' : 'Select a university first'}
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Application Deadline"
            value={formData.applicationDeadline}
            onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.applicationStatus}
              onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value })}
              label="Status"
            >
              {APPLICATION_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="Application Fee ($)"
            value={formData.applicationFee}
            onChange={(e) => setFormData({ ...formData, applicationFee: e.target.value })}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            inputProps={{ min: 1, max: 10 }}
            helperText="1 = Highest priority"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isPrimaryChoice}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isPrimaryChoice: e.target.checked,
                  isBackupChoice: e.target.checked ? false : formData.isBackupChoice
                })}
              />
            }
            label="Primary Choice"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isBackupChoice}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isBackupChoice: e.target.checked,
                  isPrimaryChoice: e.target.checked ? false : formData.isPrimaryChoice
                })}
              />
            }
            label="Backup Choice"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this application..."
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || loadingUniversities || universities.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : application ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
}

export default ApplicationForm; 