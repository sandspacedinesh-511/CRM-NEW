import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  FilePresent as FileIcon
} from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  validateFileType, 
  validateFileSize, 
  getFileValidationError, 
  formatFileSize,
  getFileIcon,
  getFileTypeCategory
} from '../../utils/fileValidation';

const FileUpload = ({
  onFileSelect,
  onFileRemove,
  acceptedTypes = 'all',
  fileType = 'default',
  maxFiles = 1,
  disabled = false,
  existingFiles = [],
  showPreview = true,
  sx = {}
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState([]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const newErrors = [];
    const validFiles = [];

    fileArray.forEach((file, index) => {
      const error = getFileValidationError(file, acceptedTypes, fileType);
      if (error) {
        newErrors.push({
          file: file.name,
          error
        });
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileIndex) => {
    onFileRemove(fileIndex);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getAcceptedTypesText = () => {
    switch (acceptedTypes) {
      case 'documents':
        return 'PDF, Word, Excel files';
      case 'images':
        return 'JPEG, PNG, GIF images';
      case 'avatars':
        return 'JPEG, PNG images';
      default:
        return 'PDF, Word, Excel, JPEG, PNG files';
    }
  };

  const getMaxSizeText = () => {
    switch (fileType) {
      case 'avatar':
        return '250KB';
      case 'image':
        return '500KB';
      case 'document':
        return '2MB';
      default:
        return '2MB';
    }
  };

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        accept={acceptedTypes === 'documents' ? '.pdf,.doc,.docx,.xls,.xlsx' :
                acceptedTypes === 'images' ? '.jpg,.jpeg,.png,.gif' :
                acceptedTypes === 'avatars' ? '.jpg,.jpeg,.png' :
                '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif'}
      />

      {/* Upload Area */}
      <Paper
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        sx={{
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: `2px dashed ${dragActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3)}`,
          borderRadius: 2,
          backgroundColor: dragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
            borderColor: disabled ? alpha(theme.palette.primary.main, 0.3) : theme.palette.primary.main
          },
          opacity: disabled ? 0.6 : 1
        }}
      >
        <CloudUploadIcon 
          sx={{ 
            fontSize: 48, 
            color: dragActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
            mb: 2
          }} 
        />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {getAcceptedTypesText()} (Max: {getMaxSizeText()})
        </Typography>
        {maxFiles > 1 && (
          <Typography variant="caption" color="text.secondary">
            Maximum {maxFiles} files
          </Typography>
        )}
      </Paper>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Uploading... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Alert 
              key={index} 
              severity="error" 
              sx={{ mb: 1 }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setErrors(errors.filter((_, i) => i !== index))}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <strong>{error.file}:</strong> {error.error}
            </Alert>
          ))}
        </Box>
      )}

      {/* File Preview */}
      {showPreview && existingFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Selected Files:
          </Typography>
          <Stack spacing={1}>
            {existingFiles.map((file, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: alpha(theme.palette.success.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CheckCircleIcon 
                    sx={{ 
                      color: theme.palette.success.main, 
                      mr: 1,
                      fontSize: 20
                    }} 
                  />
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {getFileIcon(file.type)} {file.name}
                  </Typography>
                  <Chip
                    label={formatFileSize(file.size)}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={getFileTypeCategory(file.type)}
                    size="small"
                    color="primary"
                    variant="filled"
                  />
                </Box>
                <Tooltip title="Remove file">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
