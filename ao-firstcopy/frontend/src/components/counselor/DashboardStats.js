import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Fade,
  Grow,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

const PHASE_COLORS = {
  DOCUMENT_COLLECTION: '#2196f3',
  UNIVERSITY_SHORTLISTING: '#ff9800',
  APPLICATION_SUBMISSION: '#9c27b0',
  OFFER_RECEIVED: '#4caf50',
  INITIAL_PAYMENT: '#795548',
  INTERVIEW: '#607d8b',
  FINANCIAL_TB_TEST: '#ff5722',
  CAS_VISA: '#8bc34a',
  VISA_APPLICATION: '#ffc107',
  ENROLLMENT: '#03a9f4'
};

const DashboardStats = ({ stats, phaseDistribution, universityDistribution }) => {
  const theme = useTheme();

  const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
    <Grow in={true} timeout={800}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
          border: `1px solid ${color}20`,
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${color}30`,
            borderColor: color,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box
              sx={{
                backgroundColor: `${color}15`,
                borderRadius: 3,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${color}30`
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  color: color,
                  fontSize: '1.5rem'
                } 
              })}
            </Box>
            {trend && (
              <Chip
                icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={`${Math.abs(trend)}%`}
                size="small"
                color={trend > 0 ? 'success' : 'error'}
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
          <Typography variant="h3" component="div" sx={{ 
            fontWeight: 700, 
            mb: 1,
            color: theme.palette.text.primary,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ 
            fontWeight: 500,
            mb: subtitle ? 1 : 0
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grow>
  );

  const formatPhaseLabel = (phase) => {
    if (!phase || typeof phase !== 'string') {
      return 'Unknown Phase';
    }
    return phase.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ 
          p: 2, 
          boxShadow: theme.shadows[8],
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {label || payload[0].name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Count: {payload[0].value}
          </Typography>
          {payload[0].payload.percentage && (
            <Typography variant="body2" color="textSecondary">
              Percentage: {payload[0].payload.percentage}%
            </Typography>
          )}
        </Card>
      );
    }
    return null;
  };

  const pieChartData = phaseDistribution.map(phase => ({
    name: formatPhaseLabel(phase.currentPhase),
    value: parseInt(phase.count),
    color: PHASE_COLORS[phase.currentPhase],
    percentage: ((parseInt(phase.count) / stats.totalStudents) * 100).toFixed(1)
  }));

  const barChartData = universityDistribution.map(uni => ({
    name: uni.name,
    Students: parseInt(uni.studentCount),
    color: theme.palette.primary.main
  }));

  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<PersonIcon />}
          color="#2196f3"
          trend={12}
          subtitle="Active in system"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Applications"
          value={stats.activeApplications}
          icon={<SchoolIcon />}
          color="#4caf50"
          trend={8}
          subtitle="In progress"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Documents"
          value={stats.pendingDocuments}
          icon={<AssignmentIcon />}
          color="#ff9800"
          trend={-5}
          subtitle="Requires attention"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlines}
          icon={<NotificationsIcon />}
          color="#f50057"
          trend={15}
          subtitle="Next 30 days"
        />
      </Grid>

      {/* Charts */}
      <Grid item xs={12} lg={6}>
        <Fade in={true} timeout={1000}>
          <Card sx={{ 
            height: '100%', 
            minHeight: 450,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Student Phase Distribution
                </Typography>
                <Chip 
                  label={`${stats.totalStudents} Total`} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
              <Box sx={{ width: '100%', height: 350, position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      labelLine={false}
                      paddingAngle={2}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={theme.palette.background.paper}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              {/* Legend */}
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {pieChartData.map((entry, index) => (
                  <Chip
                    key={index}
                    label={`${entry.name} (${entry.value})`}
                    size="small"
                    sx={{
                      backgroundColor: `${entry.color}15`,
                      color: entry.color,
                      border: `1px solid ${entry.color}30`,
                      fontWeight: 500
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Grid>

      <Grid item xs={12} lg={6}>
        <Fade in={true} timeout={1200}>
          <Card sx={{ 
            height: '100%', 
            minHeight: 450,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  University Applications
                </Typography>
                <Chip 
                  label="Top Universities" 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              </Box>
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart 
                    data={barChartData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={80}
                      tick={{ fontSize: 12 }}
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke={theme.palette.text.secondary}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="Students" 
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Grid>

      {/* Progress Overview */}
      <Grid item xs={12}>
        <Fade in={true} timeout={1400}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: `1px solid ${theme.palette.divider}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Application Progress Overview
              </Typography>
              <Grid container spacing={3}>
                {pieChartData.slice(0, 4).map((phase, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {phase.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {phase.value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(phase.value / stats.totalStudents) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: `${phase.color}20`,
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: phase.color,
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      </Grid>
    </Grid>
  );
};

export default DashboardStats; 