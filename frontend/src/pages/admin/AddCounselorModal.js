// src/pages/admin/AddCounselorModal.js
import { useState } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Stack
} from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

function AddCounselorModal({ open, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic here
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>Add New Counselor</Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              name="name"
              label="Full Name"
              required
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
            <Button type="submit" variant="contained">Create Account</Button>
          </Stack>
        </form>
      </Box>
    </Modal>
  );
}

export default AddCounselorModal;