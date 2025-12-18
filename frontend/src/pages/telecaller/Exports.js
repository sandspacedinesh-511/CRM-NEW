import { useCallback, useEffect, useMemo, useState } from 'react';
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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import {
  exportTelecallerTasks,
  fetchTelecallerDashboard,
  fetchImportedTelecallerTasks
} from '../../services/telecallerService';

const Exports = () => {
  const [statusFilter, setStatusFilter] = useState('No Response');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [importedTasks, setImportedTasks] = useState([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, importedResponse] = await Promise.all([
        fetchTelecallerDashboard(),
        fetchImportedTelecallerTasks().catch(() => ({ data: [] }))
      ]);
      setDashboardData(dashboardResponse?.data ?? dashboardResponse);
      const importedPayload = importedResponse?.data ?? importedResponse;
      setImportedTasks(
        Array.isArray(importedPayload)
          ? importedPayload
          : Array.isArray(importedPayload?.data)
            ? importedPayload.data
            : []
      );
    } catch (err) {
      console.error('Failed to load call summary:', err);
      setMessage({
        type: 'error',
        text: 'Unable to load call summary. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const summarizeCalls = useMemo(() => {
    // Match dashboard logic: date filter is based on createdAt (imported date)
    const filterDate = dateFilter;
    const tasksForDate = importedTasks.filter((row) => {
      if (!filterDate) return true;
      const sourceDate = row.createdAt;
      if (!sourceDate) return false;
      const d = new Date(sourceDate);
      if (Number.isNaN(d.getTime())) return false;
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const dateStr = local.toISOString().slice(0, 10);
      return dateStr === filterDate;
    });

    const summary = {
      pendingToday: 0,
      scheduledToday: 0,
      dontFollowUp: 0,
      noResponse: 0,
      completed: 0,
      total: tasksForDate.length
    };

    tasksForDate.forEach((task) => {
      const raw = (task.callStatus || '').trim().toLowerCase();
      const hasStatus = raw && raw !== '-' && raw !== '—' && raw !== 'n/a';

      // Scheduled Today: callbackDateTime on selected date (local)
      if (task.callbackDateTime) {
        const cb = new Date(task.callbackDateTime);
        if (!Number.isNaN(cb.getTime())) {
          const local = new Date(cb.getTime() - cb.getTimezoneOffset() * 60000);
          const cbDate = local.toISOString().slice(0, 10);
          if (cbDate === filterDate) {
            summary.scheduledToday += 1;
          }
        }
      }

      if (!hasStatus) {
        summary.pendingToday += 1;
        return;
      }

      if (raw.includes("don't follow up") || raw.includes('dont follow up')) {
        summary.dontFollowUp += 1;
      } else if (raw === 'no response' || raw.includes('no answer') || raw.includes('missed')) {
        summary.noResponse += 1;
      }

      // Any non-empty status counts as completed (matches dashboard logic)
      summary.completed += 1;
    });

    return summary;
  }, [importedTasks, dateFilter]);

  const statusBreakdown = useMemo(() => {
    // Same date filter as summarizeCalls (createdAt)
    const filterDate = dateFilter;
    const tasksForDate = importedTasks.filter((row) => {
      if (!filterDate) return true;
      const sourceDate = row.createdAt;
      if (!sourceDate) return false;
      const d = new Date(sourceDate);
      if (Number.isNaN(d.getTime())) return false;
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const dateStr = local.toISOString().slice(0, 10);
      return dateStr === filterDate;
    });

    const counts = {};
    tasksForDate.forEach((task) => {
      const raw = (task.callStatus || '').trim();
      if (!raw || raw === '-' || raw === '—' || raw.toLowerCase() === 'n/a') return;
      const key = raw.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([key, value]) => ({
      status: key,
      count: value
    }));

    // Sort alphabetically by status for consistency
    entries.sort((a, b) => a.status.localeCompare(b.status));
    return entries;
  }, [importedTasks, dateFilter]);

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
    <Stack spacing={3}>
      <Card>
        <CardHeader
          title="Call Summary"
          subheader="Overview of your call outcomes from marked leads"
        />
        <CardContent>
          <Stack spacing={2}>
            {message && message.type === 'error' && (
              <Alert severity="error" onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <TextField
                label="Date"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ minWidth: 200 }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDashboard}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Stack>
          </Stack>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Pending Calls (Today)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Scheduled Today</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Don&apos;t Follow Up</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>No Response</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Completed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Calls</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{summarizeCalls.pendingToday}</TableCell>
                  <TableCell>{summarizeCalls.scheduledToday}</TableCell>
                  <TableCell>{summarizeCalls.dontFollowUp}</TableCell>
                  <TableCell>{summarizeCalls.noResponse}</TableCell>
                  <TableCell>{summarizeCalls.completed}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{summarizeCalls.total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Counts are based on your imported tasks (Call Status) for the selected date.
          </Typography>
        </CardContent>
      </Card>

      <Divider />

      <Card>
        <CardHeader
          title="Call Status Breakdown"
          subheader="Completed calls grouped by specific call status for the selected date"
        />
        <CardContent>
          {statusBreakdown.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No calls with a recorded status for this date.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Call Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statusBreakdown.map((item) => (
                    <TableRow key={item.status}>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.count}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Total (with status)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {statusBreakdown.reduce((sum, i) => sum + i.count, 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
    </Stack>
  );
};

export default Exports;

