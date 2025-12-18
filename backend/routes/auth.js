const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middlewares/auth');
const { upload } = require('../config/storage.config');
const { trackActivity } = require('../services/activityTracker');
const path = require('path');
const fs = require('fs');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Account not found. Please check your email address or contact your administrator to create an account.',
        errorType: 'ACCOUNT_NOT_FOUND'
      });
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Incorrect password. Please try again.',
        errorType: 'INVALID_PASSWORD'
      });
    }

    if (!user.active) {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Track activity for counselors
    if (user.role === 'counselor') {
      const sessionId = `session_${user.id}_${Date.now()}`;
      await trackActivity(user.id, 'LOGIN', 'User logged in', {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        sessionId,
        loginTime: new Date()
      });
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        passwordChangeRequired: false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'lastLogin', 'phone', 'bio', 'location', 'avatar', 'createdAt', 'specialization', 'experience', 'education', 'preferences']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, phone, bio, location, specialization, experience, education, preferences } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (experience !== undefined) updateFields.experience = experience;
    if (education !== undefined) updateFields.education = education;
    if (preferences !== undefined) updateFields.preferences = preferences;

    await user.update(updateFields);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload avatar
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `avatar_${user.id}_${timestamp}.${fileExtension}`;

    // Create avatars directory if it doesn't exist
    const avatarsDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // Save file to avatars directory
    const newPath = path.join(avatarsDir, fileName);
    fs.writeFileSync(newPath, req.file.buffer);

    // Save file path to database
    const avatarPath = `/uploads/avatars/${fileName}`;
    await user.update({ avatar: avatarPath });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarPath
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (all authenticated users)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = User.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      const missingRequirements = [];
      if (!passwordValidation.requirements.minLength) missingRequirements.push('at least 8 characters');
      if (!passwordValidation.requirements.hasLowercase) missingRequirements.push('lowercase letter');
      if (!passwordValidation.requirements.hasUppercase) missingRequirements.push('uppercase letter');
      if (!passwordValidation.requirements.hasNumber) missingRequirements.push('number');
      if (!passwordValidation.requirements.hasSpecial) missingRequirements.push('special character (@$!%*?&)');
      
      return res.status(400).json({
        message: `Password must contain: ${missingRequirements.join(', ')}`
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!(await user.validatePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is different from current
    if (await user.validatePassword(newPassword)) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Set password directly and save - Sequelize hooks will handle validation and hashing
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({ message: validationErrors });
    }
    if (error.message && error.message.includes('Password must contain')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;