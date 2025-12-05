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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setMessage(null);
    try {
      const params = {
        status: statusFilter,
        outcome: outcomeFilter === 'ALL' ? undefined : outcomeFilter,
        search: searchTerm || undefined
      };
      const data = await exportTelecallerTasks(params);
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `telecaller_followups_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Export generated successfully.' });
    } catch (apiError) {
      console.error('Export failed:', apiError);
      setMessage({
        type: 'error',
        text: apiError.response?.data?.message || 'Failed to export follow-ups.'
      });
    } finally {
      setExporting(false);
    }
  }, [statusFilter, outcomeFilter, searchTerm]);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setOutcomeFilter('ALL');
    setSearchTerm('');
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
              helperText="Filter follow-ups by status"
              sx={{ minWidth: 220 }}
            >
              {['ALL', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'].map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Outcome filter"
              value={outcomeFilter}
              onChange={(event) => setOutcomeFilter(event.target.value)}
              select
              helperText="Filter by last recorded outcome"
              sx={{ minWidth: 220 }}
            >
              {['ALL', 'Connected', 'Left Voicemail', 'No Answer', 'Callback Requested', 'Wrong Number', 'Other'].map(
                (outcome) => (
                  <MenuItem key={outcome} value={outcome}>
                    {outcome}
                  </MenuItem>
                )
              )}
            </TextField>
          </Stack>

          <TextField
            label="Search keywords"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            helperText="Filter by student name, email, or phone"
            fullWidth
          />

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

