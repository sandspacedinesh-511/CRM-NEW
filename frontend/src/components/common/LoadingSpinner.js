import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Fade
} from '@mui/material';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'large',
  fullScreen = false,
  overlay = false 
}) => {
  const theme = useTheme();

  const spinnerSize = size === 'large' ? 60 : size === 'medium' ? 40 : 24;

  const content = (
    <Fade in={true} timeout={800}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 3,
          borderRadius: 3,
          backgroundColor: overlay ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: overlay ? 'blur(8px)' : 'none',
          border: overlay ? `1px solid ${theme.palette.divider}` : 'none',
          boxShadow: overlay ? theme.shadows[8] : 'none',
        }}
      >
        <CircularProgress
          size={spinnerSize}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        {message && (
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: 200,
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: theme.zIndex.modal + 1,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: overlay ? '200px' : 'auto',
        width: '100%',
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingSpinner; 