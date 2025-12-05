import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
  Divider,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from '../../utils/axios';
import { formatFileSize, getFileValidationError } from '../../utils/fileValidation';

// Enhanced validation schema for real-world use
const validationSchema = Yup.object({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Last name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email format')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid phone number (10-15 digits)')
    .test('phone-length', 'Phone number must be between 10-15 digits', value => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    })
    .required('Phone number is required'),
  dateOfBirth: Yup.date()
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 16)), 'Student must be at least 16 years old')
    .min(new Date(new Date().setFullYear(new Date().getFullYear() - 100)), 'Please enter a valid date of birth')
    .required('Date of birth is required'),
  address: Yup.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .required('Address is required'),
  country: Yup.string()
    .min(2, 'Country must be at least 2 characters')
    .required('Country is required'),
  city: Yup.string()
    .min(2, 'City must be at least 2 characters')
    .required('City is required'),
  postalCode: Yup.string()
    .matches(/^[a-zA-Z0-9\s-]{3,10}$/, 'Please enter a valid postal code')
    .required('Postal code is required'),
  intendedProgram: Yup.string()
    .min(3, 'Program name must be at least 3 characters')
    .required('Intended program is required'),
  intendedUniversity: Yup.string()
    .min(3, 'University name must be at least 3 characters')
    .required('Intended university is required'),
  intendedCountry: Yup.string()
    .min(2, 'Country must be at least 2 characters')
    .required('Intended country is required'),
  nextIntakeDate: Yup.date()
    .min(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'Intake date must be at least 1 month in the future')
    .max(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'Intake date cannot be more than 2 years in the future')
    .required('Intake date is required'),
  budget: Yup.number()
    .min(1000, 'Budget must be at least $1,000')
    .max(1000000, 'Budget cannot exceed $1,000,000')
    .required('Budget is required'),
  previousEducation: Yup.string()
    .min(10, 'Please provide details about previous education')
    .required('Previous education is required'),
  workExperience: Yup.string()
    .min(10, 'Please provide details about work experience')
    .required('Work experience is required'),
  englishProficiency: Yup.string()
    .oneOf(['NATIVE', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'], 'Please select a valid proficiency level')
    .required('English proficiency is required')
});

// Document types
const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passport', required: true },
  { value: 'ACADEMIC_TRANSCRIPT', label: 'Academic Transcript', required: true },
  { value: 'RECOMMENDATION_LETTER', label: 'Recommendation Letter', required: true },
  { value: 'STATEMENT_OF_PURPOSE', label: 'Statement of Purpose', required: true },
  { value: 'ENGLISH_TEST_SCORE', label: 'English Test Score', required: false },
  { value: 'CV_RESUME', label: 'CV/Resume', required: true },
  { value: 'FINANCIAL_STATEMENT', label: 'Financial Statement', required: true },
  { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate', required: true },
  { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate', required: false },
  { value: 'POLICE_CLEARANCE', label: 'Police Clearance', required: false },
  { value: 'BANK_STATEMENT', label: 'Bank Statement', required: false },
  { value: 'SPONSOR_LETTER', label: 'Sponsor Letter', required: false },
  { value: 'OTHER', label: 'Other', required: false }
];

const STEPS = [
  'Basic Information',
  'Contact Details',
  'Academic Information',
  'Documents',
  'Review & Submit'
];

const AddStudentModal = ({ open, onClose, onStudentAdded }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [documents, setDocuments] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [openFileSizeDialog, setOpenFileSizeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingDocType, setPendingDocType] = useState('');
  const fileInputRef = useRef({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);

  // Formik setup
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      country: '',
      city: '',
      postalCode: '',
      intendedProgram: '',
      intendedUniversity: '',
      intendedCountry: '',
      nextIntakeDate: '',
      budget: '',
      previousEducation: '',
      workExperience: '',
      englishProficiency: ''
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldError }) => {
      try {
        setLoading(true);
        console.log('🚀 Starting student creation process...');
        console.log('📋 Form values:', values);

        // Validate all required fields are filled
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'address', 'country', 'city', 'postalCode', 'intendedProgram', 'intendedUniversity', 'intendedCountry', 'nextIntakeDate', 'budget', 'previousEducation', 'workExperience', 'englishProficiency'];
        const missingFields = requiredFields.filter(field => !values[field] || values[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          showSnackbar(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
          setLoading(false);
          return;
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(values.email)) {
          setFieldError('email', 'Please enter a valid email address');
          showSnackbar('Please enter a valid email address', 'error');
          setLoading(false);
          return;
        }

        // Validate phone number
        const phoneDigits = values.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10 || phoneDigits.length > 15) {
          setFieldError('phone', 'Phone number must be between 10-15 digits');
          showSnackbar('Please enter a valid phone number', 'error');
          setLoading(false);
          return;
        }

        // Validate date of birth (must be at least 16 years old)
        const dob = new Date(values.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 16) {
          setFieldError('dateOfBirth', 'Student must be at least 16 years old');
          showSnackbar('Student must be at least 16 years old', 'error');
          setLoading(false);
          return;
        }

        // Validate intake date (must be at least 1 month in future)
        const intakeDate = new Date(values.nextIntakeDate);
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        if (intakeDate < oneMonthFromNow) {
          setFieldError('nextIntakeDate', 'Intake date must be at least 1 month in the future');
          showSnackbar('Intake date must be at least 1 month in the future', 'error');
          setLoading(false);
          return;
        }

        // Validate budget
        const budget = parseFloat(values.budget);
        if (isNaN(budget) || budget < 1000 || budget > 1000000) {
          setFieldError('budget', 'Budget must be between $1,000 and $1,000,000');
          showSnackbar('Please enter a valid budget amount', 'error');
          setLoading(false);
          return;
        }

        // Create student
        const studentResponse = await axios.post('/counselor/students', values);
        console.log('✅ Student created successfully:', studentResponse.data);

        const studentId = studentResponse.data.data.id;

        // Upload documents
        await uploadDocuments(studentId);

        // Show success message
        showSnackbar('Student added successfully!', 'success');
        
        // Reset form and close modal
        formik.resetForm();
        setDocuments({});
        setActiveStep(0);
        onClose();
        
        // Notify parent component
        if (onStudentAdded) {
          onStudentAdded(studentResponse.data.data);
        }

      } catch (error) {
        console.error('❌ Error creating student:', error);
        console.error('❌ Error response:', error.response);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Error data:', error.response?.data);
        console.error('❌ Error message:', error.message);
        
        if (error.response?.data?.errors) {
          // Handle validation errors from server
          Object.keys(error.response.data.errors).forEach(field => {
            setFieldError(field, error.response.data.errors[field]);
          });
        } else {
          showSnackbar(
            error.response?.data?.message || 'Failed to create student. Please try again.',
            'error'
          );
        }
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }
  });

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const uploadDocuments = async (studentId) => {
    const documentEntries = Object.entries(documents).filter(([_, doc]) => doc.file);
    
    if (documentEntries.length === 0) {
      console.log('📄 No documents to upload');
      return;
    }

    setUploading(true);
    console.log(`📁 Uploading ${documentEntries.length} documents...`);

    for (const [docType, doc] of documentEntries) {
      try {
        setUploadProgress(prev => ({ ...prev, [docType]: 0 }));

        const formData = new FormData();
        formData.append('file', doc.file);
        formData.append('type', docType);
        formData.append('description', doc.description || '');
        formData.append('priority', doc.priority || 'MEDIUM');
        
        if (doc.expiryDate) formData.append('expiryDate', doc.expiryDate);
        if (doc.issueDate) formData.append('issueDate', doc.issueDate);
        if (doc.issuingAuthority) formData.append('issuingAuthority', doc.issuingAuthority);
        if (doc.documentNumber) formData.append('documentNumber', doc.documentNumber);
        if (doc.countryOfIssue) formData.append('countryOfIssue', doc.countryOfIssue);
        if (doc.remarks) formData.append('remarks', doc.remarks);

        const response = await axios.post(
          `/counselor/students/${studentId}/documents/upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [docType]: progress }));
            }
          }
        );

        console.log(`✅ Document ${docType} uploaded successfully:`, response.data);
        setUploadProgress(prev => ({ ...prev, [docType]: 100 }));

        } catch (error) {
        console.error(`❌ Error uploading ${docType}:`, error);
        showSnackbar(`Failed to upload ${docType}: ${error.response?.data?.message || 'Unknown error'}`, 'error');
        throw error; // Stop the process if any document fails
      }
    }

    setUploading(false);
    setUploadProgress({});
    console.log('🎉 All documents uploaded successfully!');
  };

  const handleFileChange = (docType, file) => {
    if (file) {
      // Check if file is larger than 1MB and show warning popup
      const oneMB = 1024 * 1024; // 1MB in bytes
      if (file.size > oneMB) {
        setPendingFile(file);
        setPendingDocType(docType);
        setOpenFileSizeDialog(true);
        return;
      }

      // Validate file type and size
      const validationError = getFileValidationError(file, 'documents', 'document');
      
      if (validationError) {
        showSnackbar(validationError, 'error');
        return;
      }

      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          file,
          name: file.name,
          size: file.size
        }
      }));
    }
  };

  const removeDocument = (docType) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docType];
      return newDocs;
    });
    
    // Reset file input
    if (fileInputRef.current[docType]) {
      fileInputRef.current[docType].value = '';
    }
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    const currentStepFields = getStepFields(activeStep);

    // Mark current step fields as touched so their errors show near inputs
    formik.setTouched(
      currentStepFields.reduce((acc, field) => ({ ...acc, [field]: true }), {
        ...formik.touched
      })
    );

    const allErrors = await formik.validateForm();
    const stepErrors = {};

    currentStepFields.forEach(field => {
      if (allErrors[field]) {
        stepErrors[field] = allErrors[field];
      }
    });

    if (Object.keys(stepErrors).length > 0) {
      setShowErrorSummary(true);
      showSnackbar('Please fix the errors before proceeding', 'error');
      return;
    }

    setShowErrorSummary(false);
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
      formik.resetForm();
      setDocuments({});
      setActiveStep(0);
      showSnackbar('Form cleared successfully', 'info');
    }
  };

  const validateEntireForm = () => {
    const errors = {};
    
    // Basic Information
    if (!formik.values.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formik.values.lastName?.trim()) errors.lastName = 'Last name is required';
    if (!formik.values.email?.trim()) errors.email = 'Email is required';
    if (!formik.values.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formik.values.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    
    // Contact Details
    if (!formik.values.address?.trim()) errors.address = 'Address is required';
    if (!formik.values.country?.trim()) errors.country = 'Country is required';
    if (!formik.values.city?.trim()) errors.city = 'City is required';
    if (!formik.values.postalCode?.trim()) errors.postalCode = 'Postal code is required';
    
    // Academic Information
    if (!formik.values.intendedProgram?.trim()) errors.intendedProgram = 'Intended program is required';
    if (!formik.values.intendedUniversity?.trim()) errors.intendedUniversity = 'Intended university is required';
    if (!formik.values.intendedCountry?.trim()) errors.intendedCountry = 'Intended country is required';
    if (!formik.values.nextIntakeDate) {
      errors.nextIntakeDate = 'Intake date is required';
    } else {
      const intakeDate = new Date(formik.values.nextIntakeDate);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      oneMonthFromNow.setHours(0, 0, 0, 0);

      if (intakeDate < oneMonthFromNow) {
        errors.nextIntakeDate = 'Intake date must be at least 1 month in the future';
      }
    }
    if (!formik.values.budget) errors.budget = 'Budget is required';
    if (!formik.values.englishProficiency) errors.englishProficiency = 'English proficiency is required';
    if (!formik.values.previousEducation?.trim()) errors.previousEducation = 'Previous education is required';
    if (!formik.values.workExperience?.trim()) errors.workExperience = 'Work experience is required';

    // Push errors into Formik so they show on the form and review step
    Object.entries(errors).forEach(([field, message]) => {
      formik.setFieldError(field, message);
    });
    
    return Object.keys(errors).length === 0;
  };

  const getStepFields = (step) => {
    switch (step) {
      case 0: return ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth'];
      case 1: return ['address', 'country', 'city', 'postalCode'];
      case 2: return ['intendedProgram', 'intendedUniversity', 'intendedCountry', 'nextIntakeDate', 'budget', 'previousEducation', 'workExperience', 'englishProficiency'];
      default: return [];
    }
  };

  const validateCurrentStep = () => {
    const currentStepFields = getStepFields(activeStep);
    formik.setTouched(
      currentStepFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );
    
    const errors = formik.validateSync(formik.values);
    const stepErrors = {};
    
    currentStepFields.forEach(field => {
      if (errors[field]) {
        stepErrors[field] = errors[field];
      }
    });

    return Object.keys(stepErrors).length === 0;
  };

  const renderBasicInformation = () => {
    const basicStepFields = getStepFields(0);
    const hasBasicErrors = basicStepFields.some(field => formik.errors[field]);

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 1 }} />
          Basic Information
        </Typography>
        
        {showErrorSummary && activeStep === 0 && hasBasicErrors && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Please fix the following errors before proceeding:
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {basicStepFields.map(field => (
                formik.errors[field] ? <li key={field}>{formik.errors[field]}</li> : null
              ))}
            </ul>
          </Alert>
        )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            placeholder="Enter student's first name"
            value={formik.values.firstName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.firstName && Boolean(formik.errors.firstName)}
            helperText={formik.touched.firstName && formik.errors.firstName || "Enter the student's legal first name"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 50 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            placeholder="Enter student's last name"
            value={formik.values.lastName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.lastName && Boolean(formik.errors.lastName)}
            helperText={formik.touched.lastName && formik.errors.lastName || "Enter the student's legal last name"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 50 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            placeholder="student@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email || "Enter a valid email address"}
            required
            inputProps={{ 
              style: { textTransform: 'lowercase' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            placeholder="+1 (555) 123-4567"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone || "Include country code (e.g., +1 for US)"}
            required
            inputProps={{ 
              maxLength: 20 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formik.values.dateOfBirth}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
            helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth || "Student must be at least 16 years old"}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 
              max: new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0],
              min: new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]
            }}
            required
          />
        </Grid>
      </Grid>
      </Box>
    );
  };

  const renderContactDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Contact Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            name="address"
            placeholder="Enter complete address including street, city, state/province"
            multiline
            rows={3}
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && formik.errors.address || "Include street address, apartment/unit number if applicable"}
            required
            inputProps={{ 
              maxLength: 200 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Country"
            name="country"
            placeholder="Enter country name"
            value={formik.values.country}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.country && Boolean(formik.errors.country)}
            helperText={formik.touched.country && formik.errors.country || "Enter the country name"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 50 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            name="city"
            placeholder="Enter city name"
            value={formik.values.city}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.city && Boolean(formik.errors.city)}
            helperText={formik.touched.city && formik.errors.city || "Enter the city name"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 50 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Postal Code"
            name="postalCode"
            placeholder="12345 or A1B 2C3"
            value={formik.values.postalCode}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
            helperText={formik.touched.postalCode && formik.errors.postalCode || "Enter postal/zip code"}
            required
            inputProps={{ 
              style: { textTransform: 'uppercase' },
              maxLength: 10 
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderAcademicInformation = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SchoolIcon sx={{ mr: 1 }} />
        Academic Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Intended Program"
            name="intendedProgram"
            placeholder="e.g., Computer Science, Business Administration"
            value={formik.values.intendedProgram}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.intendedProgram && Boolean(formik.errors.intendedProgram)}
            helperText={formik.touched.intendedProgram && formik.errors.intendedProgram || "Enter the program/degree the student wants to pursue"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 100 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Intended University"
            name="intendedUniversity"
            placeholder="e.g., Harvard University, MIT"
            value={formik.values.intendedUniversity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.intendedUniversity && Boolean(formik.errors.intendedUniversity)}
            helperText={formik.touched.intendedUniversity && formik.errors.intendedUniversity || "Enter the university name"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 100 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Intended Country"
            name="intendedCountry"
            placeholder="e.g., United States, Canada, United Kingdom"
            value={formik.values.intendedCountry}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.intendedCountry && Boolean(formik.errors.intendedCountry)}
            helperText={formik.touched.intendedCountry && formik.errors.intendedCountry || "Enter the country where the student wants to study"}
            required
            inputProps={{ 
              style: { textTransform: 'capitalize' },
              maxLength: 50 
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Next Intake Date"
            name="nextIntakeDate"
            type="date"
            value={formik.values.nextIntakeDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.nextIntakeDate && Boolean(formik.errors.nextIntakeDate)}
            helperText={formik.touched.nextIntakeDate && formik.errors.nextIntakeDate || "Select the intended start date (must be at least 1 month in future)"}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 
              min: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              max: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]
            }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Budget (USD)"
            name="budget"
            type="number"
            placeholder="50000"
            value={formik.values.budget}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.budget && Boolean(formik.errors.budget)}
            helperText={formik.touched.budget && formik.errors.budget || "Enter the student's budget for education (minimum $1,000)"}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            inputProps={{ 
              min: 1000,
              max: 1000000,
              step: 1000
            }}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={formik.touched.englishProficiency && Boolean(formik.errors.englishProficiency)}>
            <InputLabel>English Proficiency</InputLabel>
            <Select
              name="englishProficiency"
              value={formik.values.englishProficiency}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            >
              <MenuItem value="BEGINNER">Beginner</MenuItem>
              <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
              <MenuItem value="ADVANCED">Advanced</MenuItem>
              <MenuItem value="NATIVE">Native</MenuItem>
            </Select>
            {formik.touched.englishProficiency && formik.errors.englishProficiency && (
              <FormHelperText>{formik.errors.englishProficiency}</FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Previous Education"
            name="previousEducation"
            multiline
            rows={3}
            value={formik.values.previousEducation}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.previousEducation && Boolean(formik.errors.previousEducation)}
            helperText={formik.touched.previousEducation && formik.errors.previousEducation}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Work Experience"
            name="workExperience"
            multiline
            rows={3}
            value={formik.values.workExperience}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.workExperience && Boolean(formik.errors.workExperience)}
            helperText={formik.touched.workExperience && formik.errors.workExperience}
            required
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderDocuments = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AttachFileIcon sx={{ mr: 1 }} />
        Document Upload
      </Typography>
      
      <Grid container spacing={2}>
        {DOCUMENT_TYPES.map((docType) => (
          <Grid item xs={12} md={6} key={docType.value}>
            <Card variant="outlined">
        <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    {docType.label}
                    {docType.required && <span style={{ color: 'red' }}> *</span>}
          </Typography>
                  {documents[docType.value]?.file && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Uploaded"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>

                {!documents[docType.value]?.file ? (
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    component="label"
                    fullWidth
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(docType.value, e.target.files[0])}
                      ref={el => fileInputRef.current[docType.value] = el}
                    />
                  </Button>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      File: {documents[docType.value].name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {(documents[docType.value].size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    
                    {uploadProgress[docType.value] !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Upload Progress: {uploadProgress[docType.value]}%
        </Typography>
      </Box>
                    )}
                    
                      <Button
                        size="small"
                      color="error"
                        startIcon={<DeleteIcon />}
                      onClick={() => removeDocument(docType.value)}
                      sx={{ mt: 1 }}
                      >
                        Remove
                      </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderReview = () => {
    const missingFields = [];
    const requiredFields = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'address', label: 'Address' },
      { key: 'country', label: 'Country' },
      { key: 'city', label: 'City' },
      { key: 'postalCode', label: 'Postal Code' },
      { key: 'intendedProgram', label: 'Intended Program' },
      { key: 'intendedUniversity', label: 'Intended University' },
      { key: 'intendedCountry', label: 'Intended Country' },
      { key: 'nextIntakeDate', label: 'Intake Date' },
      { key: 'budget', label: 'Budget' },
      { key: 'englishProficiency', label: 'English Proficiency' },
      { key: 'previousEducation', label: 'Previous Education' },
      { key: 'workExperience', label: 'Work Experience' }
    ];

    requiredFields.forEach(field => {
      if (!formik.values[field.key] || formik.values[field.key].toString().trim() === '') {
        missingFields.push(field.label);
      }
    });

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Review Information
        </Typography>

        {missingFields.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Missing Required Fields:
            </Typography>
            <Typography variant="body2">
              {missingFields.join(', ')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please go back and fill in all required fields before creating the student.
            </Typography>
          </Alert>
        )}

        {missingFields.length === 0 && Object.keys(formik.errors).length === 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            All required fields are completed and valid. You can now create the student.
          </Alert>
        )}

        {Object.keys(formik.errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Form Validation Errors:
            </Typography>
            <Box>
              {Object.entries(formik.errors).map(([field, error]) => (
                <Typography key={field} variant="body2" component="div">
                  • {error}
                </Typography>
              ))}
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please go back and fix these errors before creating the student.
            </Typography>
          </Alert>
        )}
          
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Name:</Typography>
              <Typography variant="body1">{formik.values.firstName} {formik.values.lastName}</Typography>
                  </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Email:</Typography>
              <Typography variant="body1">{formik.values.email}</Typography>
                  </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Phone:</Typography>
              <Typography variant="body1">{formik.values.phone}</Typography>
                  </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Date of Birth:</Typography>
              <Typography variant="body1">{formik.values.dateOfBirth}</Typography>
                  </Grid>
                  </Grid>
                  </Grid>

                  <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Academic Information</Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Intended Program:</Typography>
              <Typography variant="body1">{formik.values.intendedProgram}</Typography>
                  </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">University:</Typography>
              <Typography variant="body1">{formik.values.intendedUniversity}</Typography>
                </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Country:</Typography>
              <Typography variant="body1">{formik.values.intendedCountry}</Typography>
        </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Intake Date:</Typography>
              <Typography variant="body1">{formik.values.nextIntakeDate}</Typography>
        </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Budget:</Typography>
              <Typography variant="body1">${formik.values.budget}</Typography>
        </Grid>
          </Grid>
        </Grid>

          <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Documents</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {Object.keys(documents).filter(key => documents[key]?.file).length} document(s) ready for upload
                </Typography>
          </Grid>
      </Grid>
    </Box>
    );
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0: return renderBasicInformation();
      case 1: return renderContactDetails();
      case 2: return renderAcademicInformation();
      case 3: return renderDocuments();
      case 4: return renderReview();
      default: return 'Unknown step';
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add New Student
          <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ width: '100%', mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <form onSubmit={formik.handleSubmit}>
                    {getStepContent(activeStep)}
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <Button 
              onClick={handleClearForm} 
              disabled={loading}
              color="warning"
              variant="outlined"
              size="small"
            >
              Clear Form
            </Button>
          </Box>
          
          <Button onClick={onClose} disabled={loading}>
            Cancel
            </Button>
            
          {activeStep > 0 && (
            <Button onClick={handleBack} disabled={loading}>
              Back
              </Button>
          )}
              
          {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Next
                </Button>
              ) : (
                <Tooltip 
                  title={
                    Object.keys(formik.errors).length > 0 
                      ? `Fix validation errors: ${Object.keys(formik.errors).join(', ')}`
                      : 'Create the student'
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      onClick={async (e) => {
                        e.preventDefault();
                        console.log('🚀 Create Student button clicked');
                        console.log('📋 Form values:', formik.values);
                        console.log('📋 Form errors:', formik.errors);
                        console.log('📋 Form touched:', formik.touched);
                        console.log('📋 Form isValid:', formik.isValid);
                        
                        // Force validation of all fields
                        await formik.validateForm();
                        
                        // Check if form is valid
                        if (Object.keys(formik.errors).length > 0) {
                          showSnackbar('Please fix all validation errors before creating the student', 'error');
                          console.log('❌ Form has validation errors:', formik.errors);
                          return;
                        }
                        
                        // Validate entire form before submission
                        if (!validateEntireForm()) {
                          showSnackbar('Please fill in all required fields before creating the student', 'error');
                          return;
                        }
                        
                        console.log('✅ Form is valid, proceeding with submission');
                        formik.handleSubmit(e);
                      }}
                      disabled={loading || uploading || formik.isSubmitting}
                      startIcon={(loading || uploading) && <CircularProgress size={20} />}
                    >
                      {loading ? 'Creating Student...' : uploading ? 'Uploading Documents...' : 'Create Student'}
                    </Button>
                  </span>
                </Tooltip>
              )}
        </DialogActions>
      </Dialog>

      {/* File Size Warning Dialog */}
      <Dialog
        open={openFileSizeDialog}
        onClose={() => {
          setOpenFileSizeDialog(false);
          setPendingFile(null);
          setPendingDocType('');
        }}
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
                {pendingFile?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {pendingFile ? formatFileSize(pendingFile.size) : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {pendingDocType?.replace(/_/g, ' ')}
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
              setPendingDocType('');
            }}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (pendingFile && pendingDocType) {
                // Validate the file before proceeding
                const validationError = getFileValidationError(pendingFile, 'documents', 'document');
                
                if (validationError) {
                  showSnackbar(validationError, 'error');
                  setOpenFileSizeDialog(false);
                  setPendingFile(null);
                  setPendingDocType('');
                  return;
                }
                
                setDocuments(prev => ({
                  ...prev,
                  [pendingDocType]: {
                    ...prev[pendingDocType],
                    file: pendingFile,
                    name: pendingFile.name,
                    size: pendingFile.size
                  }
                }));
                setOpenFileSizeDialog(false);
                setPendingFile(null);
                setPendingDocType('');
                showSnackbar('File selected. You can now proceed with the form.', 'success');
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
              {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default React.memo(AddStudentModal);