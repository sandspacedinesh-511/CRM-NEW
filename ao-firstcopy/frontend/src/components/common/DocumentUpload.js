import { useCallback, useState } from 'react';
import { 
  Box, Typography, Button, List, ListItem, 
  ListItemIcon, ListItemText, IconButton, Alert
} from '@mui/material';
import { InsertDriveFile, Delete, CloudUpload } from '@mui/icons-material';

function DocumentUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or image file (PNG, JPG)');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile && onUploadSuccess) {
      onUploadSuccess(selectedFile);
      setSelectedFile(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Box>
      <Box 
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#fafafa',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50'
          }
        }}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <CloudUpload sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          Upload Document
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Click to select a file or drag and drop
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supported formats: PDF, PNG, JPG (Max 5MB)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {selectedFile && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Selected File:</Typography>
          <ListItem 
            sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2
            }}
            secondaryAction={
              <IconButton edge="end" onClick={removeFile}>
                <Delete />
              </IconButton>
            }
          >
            <ListItemIcon>
              <InsertDriveFile />
            </ListItemIcon>
            <ListItemText 
              primary={selectedFile.name} 
              secondary={`${(selectedFile.size / 1024).toFixed(2)} KB`} 
            />
          </ListItem>
          <Button
            variant="contained"
            fullWidth
            onClick={handleUpload}
            startIcon={<CloudUpload />}
          >
            Upload File
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default DocumentUpload;