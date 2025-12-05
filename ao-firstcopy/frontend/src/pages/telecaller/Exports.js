import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Typography,
  MenuItem
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { exportTelecallerTasks } from '../../services/telecallerService';

const Exports = () => {
  const [statusFilter, setStatusFilter] = useState('No Response');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    try {
      const params = {
        status: statusFilter,
        date: dateFilter
      };
      const data = await exportTelecallerTasks(params);
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `telecaller_export_${statusFilter.replace(/\s+/g, '_')}_${dateFilter}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Export generated successfully.' });
    } catch (apiError) {
      console.error('Export failed:', apiError);
      setMessage({
        type: 'error',
        text: apiError.response?.data?.message || 'Failed to export data.'
      });
    } finally {
      setExporting(false);
    }
  }, [statusFilter, dateFilter]);

  const resetFilters = () => {
    setStatusFilter('No Response');
    setDateFilter(new Date().toISOString().slice(0, 10));
  };

  return (
    <Card>
      <CardHeader
        title="Export Follow-ups"
        subheader="Download your queue as CSV for reporting or sharing"
      />
      <CardContent>
        <Stack spacing={3}>
          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Status filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              select
              helperText="Filter by status"
              sx={{ minWidth: 220 }}
            >
              {['No Response', 'Follow Up'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date filter"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: new Date().toISOString().split('T')[0]
              }}
              helperText="Filter by date"
              sx={{ minWidth: 220 }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
              sx={{ textTransform: 'none' }}
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetFilters}
              disabled={exporting}
              sx={{ textTransform: 'none' }}
            >
              Reset filters
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            The export includes task title, student contact details, due date, attempts, outcome, and latest call note.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Exports;

