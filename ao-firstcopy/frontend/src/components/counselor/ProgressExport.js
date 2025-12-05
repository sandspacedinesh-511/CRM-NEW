import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  useTheme,
  Fade,
  Alert
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableChartIcon,
  Assessment as ReportIcon,
  DateRange as DateRangeIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ProgressExport = ({ students = [], onExport }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState('pdf');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  const handleOpen = () => {
    setSelectedStudents(students.map(s => s.id));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStudents([]);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleExport = () => {
    const exportData = {
      type: exportType,
      students: selectedStudents,
      options: {
        includeDetails,
        includeCharts,
        dateRange
      },
      timestamp: new Date().toISOString()
    };

    if (onExport) {
      onExport(exportData);
    }
    handleClose();
  };

  const getExportIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <PdfIcon />;
      case 'excel':
        return <ExcelIcon />;
      case 'csv':
        return <TableChartIcon />;
      default:
        return <DownloadIcon />;
    }
  };

  const getExportLabel = (type) => {
    switch (type) {
      case 'pdf':
        return 'PDF Report';
      case 'excel':
        return 'Excel Spreadsheet';
      case 'csv':
        return 'CSV Data';
      default:
        return 'Export';
    }
  };

  const getDateRangeLabel = (range) => {
    switch (range) {
      case 'all':
        return 'All Time';
      case 'month':
        return 'Last Month';
      case 'quarter':
        return 'Last Quarter';
      case 'year':
        return 'Last Year';
      default:
        return 'All Time';
    }
  };

  const selectedStudentsData = students.filter(s => selectedStudents.includes(s.id));

  return (
    <>
      <Fade in={true} timeout={600}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ReportIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Progress Reports
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Generate comprehensive progress reports for your students. Export data in various formats for analysis and sharing.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={handleOpen}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error[50],
                    borderColor: theme.palette.error.dark,
                  }
                }}
              >
                Export PDF Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={handleOpen}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: theme.palette.success.main,
                  color: theme.palette.success.main,
                  '&:hover': {
                    backgroundColor: theme.palette.success[50],
                    borderColor: theme.palette.success.dark,
                  }
                }}
              >
                Export Excel Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleOpen}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  borderColor: theme.palette.info.main,
                  color: theme.palette.info.main,
                  '&:hover': {
                    backgroundColor: theme.palette.info[50],
                    borderColor: theme.palette.info.dark,
                  }
                }}
              >
                Export CSV
              </Button>
            </Box>

            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`${students.length} Total Students`} size="small" />
                <Chip label={`${students.filter(s => s.status === 'ACTIVE').length} Active`} size="small" color="success" />
                <Chip label={`${students.filter(s => s.status === 'DEFERRED').length} Deferred`} size="small" color="warning" />
                <Chip label={`${students.filter(s => s.currentPhase === 'ENROLLMENT').length} Enrolled`} size="small" color="primary" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DownloadIcon color="primary" />
            Export Progress Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Export Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon color="error" />
                      PDF Report
                    </Box>
                  </MenuItem>
                  <MenuItem value="excel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ExcelIcon color="success" />
                      Excel Spreadsheet
                    </Box>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableChartIcon color="info" />
                      CSV Data
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  label="Date Range"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="quarter">Last Quarter</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Export Options */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Export Options
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                    />
                  }
                  label="Include detailed student information"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                    />
                  }
                  label="Include progress charts and graphs"
                />
              </Box>
            </Grid>

            {/* Student Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Select Students ({selectedStudents.length} of {students.length})
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedStudents.length === students.length}
                      indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
                      onChange={handleSelectAll}
                    />
                  }
                  label="Select All Students"
                />
              </Box>

              <Box sx={{ 
                maxHeight: 200, 
                overflow: 'auto', 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 1
              }}>
                {students.map((student) => (
                  <FormControlLabel
                    key={student.id}
                    control={
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {student.firstName} {student.lastName}
                        </Typography>
                        <Chip
                          label={student.currentPhase.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem' }}
                        />
                        <Chip
                          label={student.status}
                          size="small"
                          color={student.status === 'ACTIVE' ? 'success' : 'default'}
                          sx={{ fontSize: '0.6rem' }}
                        />
                      </Box>
                    }
                    sx={{ display: 'block', mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Preview */}
            {selectedStudentsData.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Exporting {selectedStudentsData.length} students as {getExportLabel(exportType)} 
                    {dateRange !== 'all' && ` (${getDateRangeLabel(dateRange)})`}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={selectedStudents.length === 0}
            startIcon={getExportIcon(exportType)}
          >
            Export {getExportLabel(exportType)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProgressExport; 