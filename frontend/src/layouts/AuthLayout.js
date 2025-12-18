// src/layouts/AuthLayout.js
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper } from '@mui/material';

function AuthLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}

export default AuthLayout;