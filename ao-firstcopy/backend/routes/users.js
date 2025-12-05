const express = require('express');
const router = express.Router();
const { User, Student } = require('../models');
const { auth, checkRole } = require('../middlewares/auth');

// Get all counselors (admin only)
router.get('/counselors', auth, checkRole(['admin']), async (req, res) => {
  try {
    const counselors = await User.findAll({
      where: { role: 'counselor' },
      attributes: ['id', 'name', 'email', 'active', 'lastLogin'],
      include: [{
        model: Student,
        as: 'students',
        attributes: ['id']
      }]
    });

    const counselorsWithCount = counselors.map(counselor => ({
      ...counselor.toJSON(),
      studentCount: counselor.students.length
    }));

    res.json(counselorsWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new counselor (admin only)
router.post('/counselors', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const counselor = await User.create({
      name,
      email,
      password,
      role: 'counselor'
    });

    res.status(201).json({
      id: counselor.id,
      name: counselor.name,
      email: counselor.email,
      role: counselor.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update counselor (admin only)
router.put('/counselors/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, active } = req.body;

    const counselor = await User.findOne({
      where: { id, role: 'counselor' }
    });

    if (!counselor) {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    if (email !== counselor.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }

    await counselor.update({ name, email, active });

    res.json({
      id: counselor.id,
      name: counselor.name,
      email: counselor.email,
      active: counselor.active
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get counselor performance metrics (admin only)
router.get('/counselors/:id/metrics', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const counselor = await User.findOne({
      where: { id, role: 'counselor' },
      include: [{
        model: Student,
        as: 'students',
        attributes: ['id', 'currentPhase', 'status']
      }]
    });

    if (!counselor) {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    const metrics = {
      totalStudents: counselor.students.length,
      activeStudents: counselor.students.filter(s => s.status === 'ACTIVE').length,
      deferredStudents: counselor.students.filter(s => s.status === 'DEFERRED').length,
      rejectedStudents: counselor.students.filter(s => s.status === 'REJECTED').length,
      phaseDistribution: counselor.students.reduce((acc, student) => {
        acc[student.currentPhase] = (acc[student.currentPhase] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 