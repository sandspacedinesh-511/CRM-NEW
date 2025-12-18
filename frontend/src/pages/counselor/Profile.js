
import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Grid,
    Divider,
    Paper
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

function Profile() {
    const { user } = useAuth();

    const InfoItem = ({ icon, label, value }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{
                mr: 2,
                p: 1,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body1">
                    {value || 'Not provided'}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                My Profile
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ textAlign: 'center', p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mb: 2,
                                    bgcolor: 'primary.main',
                                    fontSize: '3rem'
                                }}
                            >
                                {user?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {user?.name || 'User Name'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Counselor'}
                            </Typography>

                            <Divider sx={{ width: '100%', my: 2 }} />

                            <Box sx={{ width: '100%', textAlign: 'left' }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Account Status
                                </Typography>
                                <Box sx={{
                                    display: 'inline-block',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: 'success.light',
                                    color: 'success.dark',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                }}>
                                    Active
                                </Box>
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            Personal Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <InfoItem
                                    icon={<PersonIcon />}
                                    label="Full Name"
                                    value={user?.name}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <InfoItem
                                    icon={<EmailIcon />}
                                    label="Email Address"
                                    value={user?.email}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <InfoItem
                                    icon={<PhoneIcon />}
                                    label="Phone Number"
                                    value={user?.phone}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <InfoItem
                                    icon={<WorkIcon />}
                                    label="Role"
                                    value={user?.role?.toUpperCase()}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <InfoItem
                                    icon={<BadgeIcon />}
                                    label="User ID"
                                    value={user?.id}
                                />
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Profile;
