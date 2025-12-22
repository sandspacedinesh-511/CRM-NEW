import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  Help as HelpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const PhaseChangeErrorDialog = ({ open, onClose, errorData, onGoToDocuments }) => {
  if (!errorData) return null;

  const { message, missingDocuments, phaseName, phaseDescription, documentDetails, country } = errorData;

  const getDocumentIcon = (docType) => {
    switch (docType) {
      case 'PASSPORT':
        return <AssignmentIcon />;
      case 'ACADEMIC_TRANSCRIPT':
        return <AssignmentIcon />;
      case 'ENGLISH_TEST_SCORE':
        return <AssignmentIcon />;
      case 'FINANCIAL_STATEMENT':
        return <AssignmentIcon />;
      case 'MEDICAL_CERTIFICATE':
        return <AssignmentIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  const getDocumentColor = (docType) => {
    switch (docType) {
      case 'PASSPORT':
        return 'primary';
      case 'ACADEMIC_TRANSCRIPT':
        return 'secondary';
      case 'ENGLISH_TEST_SCORE':
        return 'info';
      case 'FINANCIAL_STATEMENT':
        return 'warning';
      case 'MEDICAL_CERTIFICATE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Phase Change Blocked
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'scale(1.1)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Phase Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                Target Phase: {phaseName}
            </Typography>
            {country && (
              <Chip 
                label={country} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          {phaseDescription && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                {phaseDescription}
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Missing Documents Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#e74c3c', display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} />
            Missing Required Documents ({missingDocuments?.length || 0})
          </Typography>
          
          <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            {documentDetails?.map((doc, index) => (
              <ListItem key={index} sx={{ borderBottom: index < documentDetails.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <ListItemIcon>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '50%', 
                    bgcolor: `${getDocumentColor(doc.type)}.50`,
                    color: `${getDocumentColor(doc.type)}.main`
                  }}>
                    {getDocumentIcon(doc.type)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {doc.type.replace(/_/g, ' ')}
                      </Typography>
                      <Chip 
                        label="Required" 
                        size="small" 
                        color="error" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {doc.description}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Next Steps Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#27ae60', display: 'flex', alignItems: 'center' }}>
            <HelpIcon sx={{ mr: 1 }} />
            Next Steps to Proceed
          </Typography>
          
          <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2, border: '1px solid #e9ecef' }}>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#007bff' }}>1.</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Upload Missing Documents"
                  secondary="Go to the Documents section and upload all required documents"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#007bff' }}>2.</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Document Format"
                  secondary="Ensure documents are in PDF, JPG, or PNG format"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#007bff' }}>3.</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Wait for Approval"
                  secondary="Some documents may require approval before proceeding"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#007bff' }}>4.</Typography>
                </ListItemIcon>
                <ListItemText 
                  primary="Try Again"
                  secondary="Once all documents are uploaded, try changing the phase again"
                />
              </ListItem>
            </List>
          </Box>
        </Box>

        {/* Help Section */}
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            <strong>Need Help?</strong> If you have any questions about document requirements or need assistance, 
            please contact your counselor or support team.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, background: 'rgba(248,249,250,0.8)' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            borderColor: '#6c757d',
            color: '#6c757d',
            '&:hover': {
              borderColor: '#495057',
              backgroundColor: 'rgba(108, 117, 125, 0.04)'
            }
          }}
        >
          Close
        </Button>
        <Button
          onClick={() => {
            if (onGoToDocuments) {
              onGoToDocuments();
            } else {
              onClose();
            }
          }}
          variant="contained"
          startIcon={<UploadIcon />}
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(45deg, #007bff 30%, #0056b3 90%)',
            color: 'white',
            boxShadow: '0 3px 5px 2px rgba(0, 123, 255, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #0056b3 30%, #007bff 90%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px 2px rgba(0, 123, 255, .4)'
            }
          }}
        >
          Go to Documents
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PhaseChangeErrorDialog;
