import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Button,
    Tooltip,
    Alert,
    Divider
} from '@mui/material';
import {
    Alarm as AlarmIcon,
    AlarmOn as AlarmOnIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ReminderList = ({ reminders, onAdd, onEdit, onDelete, loading }) => {
    const formatDateTime = (dateString) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy - hh:mm a');
        } catch (error) {
            return dateString;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'triggered':
                return 'success';
            case 'cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <AlarmIcon />;
            case 'triggered':
                return <AlarmOnIcon />;
            default:
                return <AlarmIcon />;
        }
    };

    const sortedReminders = [...reminders].sort((a, b) => {
        // Sort by status (pending first) then by datetime
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(a.reminderDatetime) - new Date(b.reminderDatetime);
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Reminders</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAdd}
                    size="small"
                >
                    New Reminder
                </Button>
            </Box>

            {loading ? (
                <Alert severity="info">Loading reminders...</Alert>
            ) : reminders.length === 0 ? (
                <Alert severity="info">
                    No reminders set for this student. Click "New Reminder" to create one.
                </Alert>
            ) : (
                <List>
                    {sortedReminders.map((reminder, index) => (
                        <React.Fragment key={reminder.id}>
                            {index > 0 && <Divider />}
                            <ListItem
                                sx={{
                                    bgcolor: reminder.status === 'pending' ? 'action.hover' : 'background.paper',
                                    borderLeft: reminder.status === 'pending' ? 3 : 0,
                                    borderColor: 'warning.main'
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            {reminder.title && (
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {reminder.title}
                                                </Typography>
                                            )}
                                            <Chip
                                                label={reminder.status}
                                                color={getStatusColor(reminder.status)}
                                                size="small"
                                                icon={getStatusIcon(reminder.status)}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                                                {reminder.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>Scheduled:</strong> {formatDateTime(reminder.reminderDatetime)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    {reminder.status === 'pending' && (
                                        <>
                                            <Tooltip title="Edit Reminder">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => onEdit(reminder)}
                                                    size="small"
                                                    sx={{ mr: 1 }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Reminder">
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => onDelete(reminder.id)}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default ReminderList;
