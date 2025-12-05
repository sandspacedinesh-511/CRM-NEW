import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  AlertTitle,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Report as ReportIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // Log to localStorage for debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // In production, send to your error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, just copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please report this to support.');
      })
      .catch(() => {
        alert('Error details copied to clipboard. Please report this to support.');
      });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        onRetry={this.handleRetry}
        onGoHome={this.handleGoHome}
        onReportError={this.handleReportError}
      />;
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, errorInfo, errorId, onRetry, onGoHome, onReportError }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Our team has been notified.
            </Typography>
            
            {errorId && (
              <Chip
                label={`Error ID: ${errorId}`}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />
            )}
          </Box>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Development Mode</AlertTitle>
              Error details are shown below for debugging purposes.
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && error && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Error Details:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}>
                  {error.toString()}
                </Typography>
              </Paper>
            </Box>
          )}

          {process.env.NODE_ENV === 'development' && errorInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Component Stack:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}>
                  {errorInfo.componentStack}
                </Typography>
              </Paper>
            </Box>
          )}

          <Divider />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{ minWidth: 120 }}
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={onGoHome}
              sx={{ minWidth: 120 }}
            >
              Go Home
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={onReportError}
              sx={{ minWidth: 120 }}
            >
              Report Error
            </Button>
          </Box>

          {/* Helpful Information */}
          <Alert severity="info">
            <AlertTitle>Need Help?</AlertTitle>
            <Typography variant="body2">
              If this problem persists, please contact our support team with the Error ID above.
              You can also try refreshing the page or clearing your browser cache.
            </Typography>
          </Alert>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Chip
              label="Refresh Page"
              onClick={() => window.location.reload()}
              clickable
              size="small"
            />
            <Chip
              label="Clear Cache"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              clickable
              size="small"
            />
            <Chip
              label="Go Back"
              onClick={() => navigate(-1)}
              clickable
              size="small"
            />
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ErrorBoundary; 