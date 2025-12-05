const express = require('express');
const router = express.Router();
const { University, Student } = require('../models');
const { auth, checkRole } = require('../middlewares/auth');

// Get all universities (for dropdowns and lists)
router.get('/', auth, async (req, res) => {
  try {
    const universities = await University.findAll({
      where: { active: true },
      attributes: ['id', 'name', 'country', 'city', 'ranking', 'acceptanceRate'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: universities
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch universities' 
    });
  }
});

// Add university to student's shortlist
router.post('/:studentId', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      name,
      program,
      applicationDeadline,
      applicationFee,
      tuitionFee,
      priority
    } = req.body;

    const student = await Student.findOne({
      where: {
        id: studentId,
        ...(req.user.role === 'counselor' ? { counselorId: req.user.id } : {})
      }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const university = await University.create({
      studentId,
      name,
      program,
      applicationDeadline,
      applicationFee,
      tuitionFee,
      priority
    });

    res.status(201).json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's university applications
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'counselor') {
      const student = await Student.findOne({
        where: { id: studentId, counselorId: req.user.id }
      });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
    }

    const universities = await University.findAll({
      where: { studentId },
      order: [['priority', 'ASC']]
    });

    res.json(universities);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update university application status
router.put('/:id/status', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationStatus, offerConditions } = req.body;

    const university = await University.findOne({
      where: { id },
      include: [{
        model: Student,
        as: 'student',
        where: req.user.role === 'counselor' ? { counselorId: req.user.id } : {}
      }]
    });

    if (!university) {
      return res.status(404).json({ message: 'University application not found' });
    }

    await university.update({
      applicationStatus,
      ...(offerConditions && { offerConditions })
    });

    res.json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update university application details
router.put('/:id', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      program,
      applicationDeadline,
      applicationFee,
      tuitionFee,
      priority,
      notes
    } = req.body;

    const university = await University.findOne({
      where: { id },
      include: [{
        model: Student,
        as: 'student',
        where: req.user.role === 'counselor' ? { counselorId: req.user.id } : {}
      }]
    });

    if (!university) {
      return res.status(404).json({ message: 'University application not found' });
    }

    await university.update({
      name,
      program,
      applicationDeadline,
      applicationFee,
      tuitionFee,
      priority,
      notes
    });

    res.json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete university from shortlist
router.delete('/:id', auth, checkRole(['admin', 'counselor']), async (req, res) => {
  try {
    const { id } = req.params;

    const university = await University.findOne({
      where: { id },
      include: [{
        model: Student,
        as: 'student',
        where: req.user.role === 'counselor' ? { counselorId: req.user.id } : {}
      }]
    });

    if (!university) {
      return res.status(404).json({ message: 'University application not found' });
    }

    await university.destroy();
    res.json({ message: 'University application removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 