import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography
} from '@mui/material';
import { AlarmAdd as AlarmAddIcon } from '@mui/icons-material';

const ReminderModal = ({ open, onClose, onSave, studentName }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        reminderDatetime: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.message || formData.message.trim() === '') {
            newErrors.message = 'Reminder message is required';
        }

        if (!formData.reminderDatetime) {
            newErrors.reminderDatetime = 'Date and time are required';
        } else {
            const selectedDate = new Date(formData.reminderDatetime);
            if (selectedDate <= new Date()) {
                newErrors.reminderDatetime = 'Reminder must be scheduled for a future date and time';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            // Convert the datetime string to a Date object
            const reminderData = {
                ...formData,
                reminderDatetime: new Date(formData.reminderDatetime)
            };
            onSave(reminderData);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            message: '',
            reminderDatetime: ''
        });
        setErrors({});
        onClose();
    };

    // Get minimum datetime (current time + 1 minute)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        return now.toISOString().slice(0, 16);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlarmAddIcon color="primary" />
                    <Typography variant="h6">Set Reminder for {studentName}</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Reminder Title (Optional)"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        fullWidth
                        placeholder="e.g., Follow up on application"
                    />

                    <TextField
                        label="Reminder Message"
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        fullWidth
                        required
                        multiline
                        rows={3}
                        placeholder="Enter reminder details..."
                        error={!!errors.message}
                        helperText={errors.message}
                    />

                    <TextField
                        label="Date & Time"
                        type="datetime-local"
                        value={formData.reminderDatetime}
                        onChange={(e) => handleChange('reminderDatetime', e.target.value)}
                        fullWidth
                        required
                        InputLabelProps={{
                            shrink: true,
                        }}
                        inputProps={{
                            min: getMinDateTime()
                        }}
                        error={!!errors.reminderDatetime}
                        helperText={errors.reminderDatetime || 'Select when you want to be reminded'}
                    />
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    startIcon={<AlarmAddIcon />}
                >
                    Save Reminder
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReminderModal;
