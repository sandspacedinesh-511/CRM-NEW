const express = require('express');
const router = express.Router();
const { Student, University, Document, User } = require('../models');
const { auth, checkRole } = require('../middlewares/auth');

// Get all students (filtered by counselor for non-admin)
router.get('/', auth, async (req, res) => {
  try {
    const where = req.user.role === 'counselor' ? { counselorId: req.user.id } : {};
    
    const students = await Student.findAll({
      where,
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: University,
          as: 'universities',
          attributes: ['id', 'name', 'program', 'applicationStatus']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new student
router.post('/', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      nationality,
      passportNumber
    } = req.body;

    const student = await Student.create({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      nationality,
      passportNumber,
      counselorId: req.user.role === 'admin' ? req.body.counselorId : req.user.id
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findOne({
      where: { 
        id,
        ...(req.user.role === 'counselor' ? { counselorId: req.user.id } : {})
      },
      include: [
        {
          model: User,
          as: 'counselor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: University,
          as: 'universities'
        },
        {
          model: Document,
          as: 'documents',
          where: { isLatest: true },
          required: false
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student phase
router.put('/:id/phase', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;

    const student = await Student.findOne({
      where: {
        id,
        ...(req.user.role === 'counselor' ? { counselorId: req.user.id } : {})
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await student.update({ currentPhase: phase });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student status (defer/reject)
router.put('/:id/status', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, nextIntakeDate } = req.body;

    const student = await Student.findOne({
      where: {
        id,
        ...(req.user.role === 'counselor' ? { counselorId: req.user.id } : {})
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updateData = {
      status,
      ...(status === 'DEFERRED' ? { deferralReason: reason, nextIntakeDate } : {}),
      ...(status === 'REJECTED' ? { rejectionReason: reason } : {})
    };

    await student.update(updateData);
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reassign student to different counselor (admin only)
router.put('/:id/reassign', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { counselorId } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const counselor = await User.findOne({
      where: { id: counselorId, role: 'counselor', active: true }
    });
    if (!counselor) {
      return res.status(404).json({ message: 'Counselor not found' });
    }

    await student.update({ counselorId });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 