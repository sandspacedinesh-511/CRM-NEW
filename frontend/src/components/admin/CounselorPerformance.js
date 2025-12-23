import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Fade,
  Grow
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CounselorPerformance = ({ data }) => {
  const theme = useTheme();
  const [selectedMetric, setSelectedMetric] = useState('totalStudents');

  const getPerformanceColor = (rate) => {
    if (rate >= 80) return theme.palette.success.main;
    if (rate >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getStatusIcon = (active) => {
    return active ? (
      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
    ) : (
      <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
    );
  };

  // Ensure data is an array and handle edge cases
  const safeData = Array.isArray(data) ? data : [];
  
  const chartData = safeData.map(counselor => ({
    name: counselor.name ? counselor.name.split(' ')[0] : 'Unknown',
    totalStudents: counselor.totalStudents || 0,
    successfulApplications: counselor.successfulApplications || 0,
    successRate: counselor.successRate || 0
  }));

  return (
    <Box>
      <Fade in={true} timeout={800}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Counselor Performance Overview
            </Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                  <Bar
                    dataKey="totalStudents"
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                    name="Total Students"
                  />
                  <Bar
                    dataKey="successfulApplications"
                    fill={theme.palette.success.main}
                    radius={[4, 4, 0, 0]}
                    name="Successful Applications"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.divider, 0.05),
                borderRadius: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  No counselor performance data available
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>

      <Grow in={true} timeout={1000}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Detailed Performance
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto', maxWidth: '100%' }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Counselor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Students</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Active Applications</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Success Rate</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeData.length > 0 ? (
                    safeData.map((counselor, index) => (
                    <Grow in={true} timeout={1200 + (index * 100)} key={counselor.id}>
                      <TableRow
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                width: 32,
                                height: 32
                              }}
                            >
                              {counselor.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {counselor.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {counselor.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(counselor.active)}
                            <Chip
                              label={counselor.active ? 'Active' : 'Inactive'}
                              size="small"
                              color={counselor.active ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {counselor.totalStudents}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {counselor.activeApplications}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon sx={{ fontSize: 16, color: getPerformanceColor(counselor.successRate) }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {counselor.successRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress
                              variant="determinate"
                              value={counselor.successRate}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(getPerformanceColor(counselor.successRate), 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getPerformanceColor(counselor.successRate),
                                  borderRadius: 4,
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Grow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No counselor data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grow>
    </Box>
  );
};

export default CounselorPerformance; 