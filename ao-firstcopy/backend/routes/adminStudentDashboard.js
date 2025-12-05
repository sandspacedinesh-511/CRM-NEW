const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User, Student, StudentUniversityApplication, Document } = require('../models');

// Get all students for admin dashboard (admin only)
router.get('/students', auth, checkRole(['admin']), async (req, res) => {
  try {
    // Fetch real students from database
    const students = await Student.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'currentPhase', 'counselorId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Get counselor information for each student
    const counselorIds = [...new Set(students.map(student => student.counselorId).filter(id => id))];
    const counselors = await User.findAll({
      where: { id: counselorIds },
      attributes: ['id', 'name', 'email']
    });
    const counselorMap = counselors.reduce((acc, counselor) => {
      acc[counselor.id] = counselor;
      return acc;
    }, {});

    // Transform the data to include counselor information
    const formattedStudents = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      phone: student.phone,
      status: student.status,
      currentPhase: student.currentPhase,
      counselorId: student.counselorId,
      counselorName: counselorMap[student.counselorId]?.name || 'Unassigned',
      counselorEmail: counselorMap[student.counselorId]?.email || '',
      createdAt: student.createdAt,
      // Add some calculated fields
      applicationsCount: Math.floor(Math.random() * 5) + 1, // Placeholder
      documentsCount: Math.floor(Math.random() * 10) + 1, // Placeholder
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    res.json({
      success: true,
      students: formattedStudents
    });
  } catch (error) {
    logger.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get student statistics (admin only)
router.get('/statistics', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      deferredStudents,
      rejectedStudents,
      totalCounselors,
      activeCounselors,
      totalApplications,
      pendingApplications
    ] = await Promise.all([
      Student.count(),
      Student.count({ where: { status: 'ACTIVE' } }),
      Student.count({ where: { status: 'DEFERRED' } }),
      Student.count({ where: { status: 'REJECTED' } }),
      User.count({ where: { role: 'counselor' } }),
      User.count({ where: { role: 'counselor', active: true } }),
      StudentUniversityApplication.count(),
      StudentUniversityApplication.count({ where: { applicationStatus: 'pending' } })
    ]);

    const statistics = {
      students: {
        total: totalStudents,
        active: activeStudents,
        deferred: deferredStudents,
        rejected: rejectedStudents
      },
      counselors: {
        total: totalCounselors,
        active: activeCounselors
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        completed: totalApplications - pendingApplications
      }
    };

    res.json({
      success: true,
      statistics: statistics
    });
  } catch (error) {
    logger.error('Error fetching student statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student statistics'
    });
  }
});

// Get students without dual applications (admin only)
router.get('/students-without-dual-applications', auth, checkRole(['admin']), async (req, res) => {
  try {
    // This is a simplified version - in a real app, you'd have more complex logic
    const students = await Student.findAll({
      where: { status: 'ACTIVE' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'counselorId'],
      limit: 20
    });

    // Mock data for students without dual applications
    const studentsWithoutDualApplications = students.slice(0, 5).map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      counselorId: student.counselorId,
      applicationCount: 1,
      needsDualApplication: true,
      lastReminder: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    res.json({
      success: true,
      students: studentsWithoutDualApplications
    });
  } catch (error) {
    logger.error('Error fetching students without dual applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students without dual applications'
    });
  }
});

// Get counselor performance summary (admin only)
router.get('/counselor-performance', auth, checkRole(['admin']), async (req, res) => {
  try {
    const counselors = await User.findAll({
      where: { role: 'counselor' },
      attributes: ['id', 'name', 'email', 'active']
    });

    const counselorPerformance = await Promise.all(
      counselors.map(async (counselor) => {
        const [studentCount, activeStudentCount] = await Promise.all([
          Student.count({ where: { counselorId: counselor.id } }),
          Student.count({ where: { counselorId: counselor.id, status: 'ACTIVE' } })
        ]);

        return {
          id: counselor.id,
          name: counselor.name,
          email: counselor.email,
          active: counselor.active,
          totalStudents: studentCount,
          activeStudents: activeStudentCount,
          completionRate: studentCount > 0 ? Math.round((activeStudentCount / studentCount) * 100) : 0,
          lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        };
      })
    );

    res.json({
      success: true,
      counselorPerformance: counselorPerformance
    });
  } catch (error) {
    logger.error('Error fetching counselor performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch counselor performance'
    });
  }
});

module.exports = router;
