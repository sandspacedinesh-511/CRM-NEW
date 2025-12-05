const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { cacheUtils } = require('../config/redis');
const { User, Student, StudentUniversityApplication, Document } = require('../models');

// Get performance analytics dashboard data (admin only)
router.get('/dashboard', auth, checkRole(['admin']), async (req, res) => {
  try {
    // Fetch real data from database
    const [
      totalCounselors,
      activeCounselors,
      totalStudents,
      activeStudents,
      totalApplications,
      pendingApplications,
      completedApplications,
      totalDocuments,
      counselors
    ] = await Promise.all([
      User.count({ where: { role: 'counselor' } }),
      User.count({ where: { role: 'counselor', active: true } }),
      Student.count(),
      Student.count({ where: { status: 'ACTIVE' } }),
      StudentUniversityApplication.count(),
      StudentUniversityApplication.count({ where: { applicationStatus: 'pending' } }),
      StudentUniversityApplication.count({ where: { applicationStatus: 'completed' } }),
      Document.count(),
      User.findAll({
        where: { role: 'counselor' },
        attributes: ['id', 'name', 'email', 'active', 'lastLogin', 'createdAt']
      })
    ]);

    // Calculate counselor metrics
    const counselorMetrics = await Promise.all(
      counselors.map(async (counselor) => {
        const [studentCount, activeStudentCount] = await Promise.all([
          Student.count({ where: { counselorId: counselor.id } }),
          Student.count({ where: { counselorId: counselor.id, status: 'ACTIVE' } })
        ]);

        // Calculate productivity score based on various factors
        const productivityScore = Math.min(100, Math.max(0, 
          (activeStudentCount * 2) + 
          (studentCount * 1.5) + 
          (counselor.active ? 10 : 0)
        ));

        return {
          id: counselor.id,
          name: counselor.name,
          email: counselor.email,
          totalStudents: studentCount,
          activeStudents: activeStudentCount,
          completedApplications: Math.floor(studentCount * 0.8), // Estimated
          pendingApplications: Math.floor(studentCount * 0.2), // Estimated
          responseTime: Math.random() * 3 + 1, // Placeholder - would need real tracking
          satisfactionScore: Math.random() * 1 + 4, // Placeholder - would need real ratings
          productivityScore: Math.round(productivityScore),
          lastActivity: counselor.lastLogin || counselor.createdAt
        };
      })
    );

    const analytics = {
      overview: {
        totalCounselors,
        activeCounselors,
        totalStudents,
        activeStudents,
        totalApplications,
        pendingApplications,
        completedApplications,
        totalDocuments,
        averageResponseTime: 2.1, // Placeholder
        averageSatisfactionScore: 4.7 // Placeholder
      },
      counselorMetrics,
      systemMetrics: {
        uptime: '99.9%',
        responseTime: 150,
        errorRate: 0.1,
        throughput: 1250,
        activeUsers: activeCounselors,
        peakUsers: totalCounselors,
        averageSessionDuration: 25
      }
    };

    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    logger.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics'
    });
  }
});

// Get counselor performance comparison (admin only)
router.get('/comparison', auth, checkRole(['admin']), async (req, res) => {
  try {
    const comparison = await cacheUtils.get('counselor_comparison') || {};
    
    // If no comparison data in cache, provide mock data for development
    if (Object.keys(comparison).length === 0) {
      const mockComparison = {
        topPerformers: [
          {
            counselorId: 'counselor1',
            name: 'Jane Smith',
            score: 95,
            applicationsProcessed: 78,
            responseTime: 1.8,
            satisfactionScore: 4.9
          },
          {
            counselorId: 'counselor2',
            name: 'Bob Wilson',
            score: 88,
            applicationsProcessed: 56,
            responseTime: 2.3,
            satisfactionScore: 4.6
          },
          {
            counselorId: 'counselor3',
            name: 'Alice Johnson',
            score: 82,
            applicationsProcessed: 42,
            responseTime: 2.8,
            satisfactionScore: 4.5
          }
        ],
        performanceMetrics: {
          averageApplicationsPerCounselor: 58.7,
          averageResponseTime: 2.3,
          averageSatisfactionScore: 4.7,
          totalProductivityScore: 88.3
        },
        rankings: {
          byApplications: [
            { counselorId: 'counselor1', name: 'Jane Smith', count: 78 },
            { counselorId: 'counselor2', name: 'Bob Wilson', count: 56 },
            { counselorId: 'counselor3', name: 'Alice Johnson', count: 42 }
          ],
          byResponseTime: [
            { counselorId: 'counselor1', name: 'Jane Smith', time: 1.8 },
            { counselorId: 'counselor2', name: 'Bob Wilson', time: 2.3 },
            { counselorId: 'counselor3', name: 'Alice Johnson', time: 2.8 }
          ],
          bySatisfaction: [
            { counselorId: 'counselor1', name: 'Jane Smith', score: 4.9 },
            { counselorId: 'counselor2', name: 'Bob Wilson', score: 4.6 },
            { counselorId: 'counselor3', name: 'Alice Johnson', score: 4.5 }
          ]
        }
      };
      
      res.json({
        success: true,
        comparison: mockComparison
      });
    } else {
      res.json({
        success: true,
        comparison: comparison
      });
    }
  } catch (error) {
    logger.error('Error fetching performance comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance comparison'
    });
  }
});

// Get system performance metrics (admin only)
router.get('/system', auth, checkRole(['admin']), async (req, res) => {
  try {
    const systemMetrics = await cacheUtils.get('system_metrics') || {};
    
    // If no system metrics in cache, provide mock data for development
    if (Object.keys(systemMetrics).length === 0) {
      const mockSystemMetrics = {
        server: {
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 23.4,
          networkLatency: 12.5,
          uptime: '15 days, 8 hours',
          status: 'healthy'
        },
        database: {
          connectionCount: 25,
          queryTime: 45.2,
          slowQueries: 3,
          cacheHitRate: 89.5,
          status: 'healthy'
        },
        application: {
          responseTime: 150,
          errorRate: 0.1,
          throughput: 1250,
          activeSessions: 45,
          status: 'healthy'
        },
        storage: {
          totalSpace: '500 GB',
          usedSpace: '234 GB',
          availableSpace: '266 GB',
          fileCount: 15420,
          status: 'healthy'
        }
      };
      
      res.json({
        success: true,
        metrics: mockSystemMetrics
      });
    } else {
      res.json({
        success: true,
        metrics: systemMetrics
      });
    }
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics'
    });
  }
});

module.exports = router;
