import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  useTheme,
  alpha,
  Fade,
  Grow
} from '@mui/material';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DocumentStats = ({ data }) => {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return theme.palette.success.main;
      case 'PENDING':
        return theme.palette.warning.main;
      case 'REJECTED':
        return theme.palette.error.main;
      default:
        return theme.palette.grey.main;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'PENDING':
        return <PendingIcon sx={{ color: theme.palette.warning.main }} />;
      case 'REJECTED':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <WarningIcon sx={{ color: theme.palette.grey.main }} />;
    }
  };

  const formatDocumentType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const totalDocuments = data.reduce((sum, doc) => sum + doc.total, 0);
  const pendingDocuments = data.reduce((sum, doc) => sum + doc.pending, 0);
  const approvedDocuments = data.reduce((sum, doc) => sum + doc.approved, 0);
  const rejectedDocuments = data.reduce((sum, doc) => sum + doc.rejected, 0);

  const pieData = [
    { name: 'Approved', value: approvedDocuments, color: theme.palette.success.main },
    { name: 'Pending', value: pendingDocuments, color: theme.palette.warning.main },
    { name: 'Rejected', value: rejectedDocuments, color: theme.palette.error.main }
  ];

  const selectedDocData = selectedType ? data.find(doc => doc.type === selectedType) : null;

  return (
    <Box>
      <Fade in={true} timeout={800}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Document Status Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Fade>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1000}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <DescriptionIcon sx={{ color: theme.palette.primary.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {totalDocuments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Documents
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1200}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.2),
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {approvedDocuments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1400}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: alpha(theme.palette.warning.main, 0.2),
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PendingIcon sx={{ color: theme.palette.warning.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {pendingDocuments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Grow in={true} timeout={1600}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: alpha(theme.palette.error.main, 0.2),
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ErrorIcon sx={{ color: theme.palette.error.main }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {rejectedDocuments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rejected
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        </Grid>
      </Grid>

      {/* Document Type Breakdown */}
      <Grow in={true} timeout={1800}>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Document Type Breakdown
            </Typography>
            <Grid container spacing={2}>
              {data.map((docType, index) => (
                <Grid item xs={12} md={6} lg={4} key={docType.type}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                      border: selectedType === docType.type ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                        border: `2px solid ${theme.palette.primary.main}`
                      }
                    }}
                    onClick={() => setSelectedType(selectedType === docType.type ? null : docType.type)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {formatDocumentType(docType.type)}
                        </Typography>
                        <Chip
                          label={docType.total}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`${docType.approved} Approved`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          icon={<PendingIcon />}
                          label={`${docType.pending} Pending`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          icon={<ErrorIcon />}
                          label={`${docType.rejected} Rejected`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Box>

                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Approval Rate
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {docType.total > 0 ? Math.round((docType.approved / docType.total) * 100) : 0}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 4,
                            backgroundColor: alpha(theme.palette.grey[300], 0.5),
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              width: `${docType.total > 0 ? (docType.approved / docType.total) * 100 : 0}%`,
                              height: '100%',
                              backgroundColor: theme.palette.success.main,
                              transition: 'width 0.3s ease-in-out'
                            }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grow>
    </Box>
  );
};

export default DocumentStats; 