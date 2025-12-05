const { Op, fn, col, literal } = require('sequelize');
const { Task, Student, Activity, Note, TelecallerImportedTask } = require('../models');
const websocketService = require('../services/websocketService');
const { performanceLogger, errorLogger } = require('../utils/logger');
const XLSX = require('xlsx');

const CALL_OUTCOME_OPTIONS = [
  'Connected',
  'Left Voicemail',
  'No Answer',
  'Callback Requested',
  'Wrong Number',
  'Other'
];

const PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
// Only these headers are strictly required; the rest are optional
const REQUIRED_IMPORT_HEADERS = ['S.No', 'Name', 'Contact Number'];

const normalizeHeader = (header = '') => String(header || '').trim().toLowerCase();

const deriveTaskStatus = (task, now = new Date()) => {
  if (task.completed) {
    return 'COMPLETED';
  }
  if (!task.dueDate) {
    return 'PENDING';
  }
  if (task.dueDate < now.setHours(0, 0, 0, 0)) {
    return 'OVERDUE';
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (task.dueDate >= startOfToday && task.dueDate <= endOfToday) {
    return 'TODAY';
  }
  return 'UPCOMING';
};

const buildDateRange = (days) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  return { start, end };
};

const fetchLatestNotesForStudents = async (studentIds) => {
  if (!studentIds.length) {
    return {};
  }

  const notes = await Note.findAll({
    where: { studentId: { [Op.in]: studentIds } },
    attributes: ['studentId', 'content', 'createdAt'],
    order: [['createdAt', 'DESC']]
  });

  const latestByStudent = {};
  notes.forEach((note) => {
    if (!latestByStudent[note.studentId]) {
      latestByStudent[note.studentId] = {
        content: note.content,
        createdAt: note.createdAt
      };
    }
  });

  return latestByStudent;
};

const formatTaskForQueue = (task, notesMap) => {
  const status = deriveTaskStatus(task);
  const studentInfo = task.student
    ? {
      id: task.student.id,
      name: `${task.student.firstName} ${task.student.lastName}`,
      email: task.student.email,
      phone: task.student.phone,
      status: task.student.status,
      currentPhase: task.student.currentPhase
    }
    : null;

  const latestNote = task.studentId ? notesMap[task.studentId] : null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    status,
    reminder: task.reminder,
    callOutcome: task.callOutcome,
    callNotes: task.callNotes,
    attempts: task.attempts,
    lastAttemptAt: task.lastAttemptAt,
    completed: task.completed,
    completedAt: task.completedAt,
    student: studentInfo,
    notesPreview: latestNote
      ? {
        content: latestNote.content,
        createdAt: latestNote.createdAt
      }
      : null
  };
};

const buildEngagementAlerts = (tasks, now = new Date()) => {
  const alerts = [];

  tasks.forEach((task) => {
    if (task.completed) {
      return;
    }

    const status = deriveTaskStatus(task, now);
    if (status === 'OVERDUE') {
      alerts.push({
        type: 'overdue',
        severity: 'warning',
        taskId: task.id,
        message: `${task.title || 'Follow-up'} is overdue`,
        dueDate: task.dueDate
      });
    }

    if ((task.attempts || 0) >= 3) {
      alerts.push({
        type: 'high_attempts',
        severity: 'info',
        taskId: task.id,
        message: `${task.title || 'Follow-up'} has ${task.attempts} attempts`,
        attempts: task.attempts
      });
    }
  });

  return alerts.slice(0, 5); // keep alerts concise
};

const buildPrioritySummary = (tasks) => {
  const totalTasks = tasks.length || 0;
  return PRIORITY_OPTIONS.map((priority) => {
    const total = tasks.filter((task) => (task.priority || 'MEDIUM') === priority).length;
    return {
      priority,
      total,
      percentage: totalTasks === 0 ? 0 : Math.round((total / totalTasks) * 100)
    };
  });
};

const buildWorkloadAging = (tasks, now = new Date()) => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const dayInMs = 24 * 60 * 60 * 1000;

  const buckets = [
    {
      key: 'upcoming',
      label: 'Upcoming',
      matcher: (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate > endOfToday && !task.completed;
      }
    },
    {
      key: 'today',
      label: 'Due Today',
      matcher: (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return (
          dueDate >= startOfToday &&
          dueDate <= endOfToday &&
          !task.completed
        );
      }
    },
    {
      key: 'overdue_1_2',
      label: '1-2 days overdue',
      matcher: (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        if (dueDate >= startOfToday) return false;
        const diff = Math.floor((startOfToday - dueDate) / dayInMs);
        return diff >= 1 && diff <= 2 && !task.completed;
      }
    },
    {
      key: 'overdue_3_5',
      label: '3-5 days overdue',
      matcher: (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        if (dueDate >= startOfToday) return false;
        const diff = Math.floor((startOfToday - dueDate) / dayInMs);
        return diff >= 3 && diff <= 5 && !task.completed;
      }
    },
    {
      key: 'overdue_6_plus',
      label: '6+ days overdue',
      matcher: (task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        if (dueDate >= startOfToday) return false;
        const diff = Math.floor((startOfToday - dueDate) / dayInMs);
        return diff >= 6 && !task.completed;
      }
    }
  ];

  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    total: tasks.filter(bucket.matcher).length
  }));
};

const findNextFollowUp = (tasks) => {
  const pending = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return pending.length ? pending[0] : null;
};

const buildCallVolume = (tasks, importedTasks = []) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toLocaleDateString('en-CA');
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ dateKey, formatted });
  }

  const counts = days.map(({ dateKey, formatted }) => {
    const systemTotal = tasks.reduce((acc, task) => {
      const attemptDate = task.lastAttemptAt || task.completedAt || task.updatedAt || task.createdAt;
      if (!attemptDate) return acc;
      const attemptKey = new Date(attemptDate).toLocaleDateString('en-CA');
      if (attemptKey === dateKey) {
        return acc + 1;
      }
      return acc;
    }, 0);

    const importedTotal = importedTasks.reduce((acc, task) => {
      const attemptDate = task.updatedAt;
      if (!attemptDate) return acc;
      const attemptKey = new Date(attemptDate).toLocaleDateString('en-CA');
      if (attemptKey === dateKey) {
        return acc + 1;
      }
      return acc;
    }, 0);

    return { date: formatted, total: systemTotal + importedTotal };
  });

  return counts;
};

exports.getDashboard = async (req, res) => {
  const telecallerId = req.user.id;
  const timer = performanceLogger.startTimer('telecaller_dashboard');

  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(endOfToday);
    endOfYesterday.setDate(endOfYesterday.getDate() - 1);

    const followUpTasks = await Task.findAll({
      where: {
        counselorId: telecallerId,
        type: 'FOLLOW_UP'
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'currentPhase']
        }
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']]
    });

    const studentIds = followUpTasks
      .map((task) => task.studentId)
      .filter((id) => !!id);
    const latestNotesMap = await fetchLatestNotesForStudents(studentIds);

    const formattedTasks = followUpTasks.map((task) => formatTaskForQueue(task, latestNotesMap));

    const totalFollowUps = formattedTasks.length;
    const completedFollowUps = formattedTasks.filter((task) => task.completed).length;
    const pendingFollowUps = formattedTasks.filter((task) => !task.completed).length;
    const overdueFollowUps = formattedTasks.filter(
      (task) => task.status === 'OVERDUE'
    ).length;
    const todayFollowUps = formattedTasks.filter(
      (task) => task.status === 'TODAY'
    ).length;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentImportedTasksForVolume = await TelecallerImportedTask.findAll({
      where: {
        telecallerId,
        updatedAt: { [Op.gte]: sevenDaysAgo },
        callStatus: {
          [Op.notIn]: ['', 'n/a', '-', '—'],
          [Op.ne]: null
        }
      },
      attributes: ['updatedAt']
    });

    const callVolume = buildCallVolume(followUpTasks, recentImportedTasksForVolume);

    // Imported tasks "assigned" today for this telecaller (based on createdAt date)
    const todaysImportedTasks = await TelecallerImportedTask.findAll({
      where: {
        telecallerId,
        createdAt: {
          [Op.gte]: startOfToday,
          [Op.lte]: endOfToday
        }
      }
    });

    const importedTasksToday = todaysImportedTasks.length;

    let importedCompletedToday = 0;
    let pendingImportedToday = 0;
    let noResponseToday = 0;
    let dontFollowUpToday = 0;

    todaysImportedTasks.forEach((row) => {
      const rawStatus = (row.callStatus || '').trim().toLowerCase();
      if (!rawStatus || rawStatus === '-' || rawStatus === '—' || rawStatus === 'n/a') {
        pendingImportedToday += 1;
      } else {
        importedCompletedToday += 1;
        if (rawStatus === 'no response') {
          noResponseToday += 1;
        } else if (rawStatus === "don't follow up" || rawStatus === 'dont follow up') {
          dontFollowUpToday += 1;
        }
      }
    });

    // Total pending imported calls across all days (lifetime pending)
    const totalPendingImportedCalls = await TelecallerImportedTask.count({
      where: {
        telecallerId,
        [Op.or]: [
          { callStatus: null },
          { callStatus: '' },
          { callStatus: '-' },
          { callStatus: '—' },
          { callStatus: 'n/a' }
        ]
      }
    });

    const callOutcomeSummary = formattedTasks.reduce(
      (acc, task) => {
        if (task.completed) {
          acc.completed += 1;
        } else if (task.status === 'OVERDUE') {
          acc.overdue += 1;
        } else {
          acc.pending += 1;
        }

        if (task.callOutcome) {
          const existing = acc.byOutcome.find((item) => item.outcome === task.callOutcome);
          if (existing) {
            existing.total += 1;
          } else {
            acc.byOutcome.push({ outcome: task.callOutcome, total: 1 });
          }
        }

        return acc;
      },
      { completed: 0, pending: 0, overdue: 0, byOutcome: [] }
    );

    const recentActivities = await Activity.findAll({
      where: {
        userId: telecallerId
      },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    const activityFeedCore = recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt,
      student: activity.student
        ? {
          id: activity.student.id,
          name: `${activity.student.firstName} ${activity.student.lastName}`
        }
        : null
    }));

    // Derive recent call activity from imported telecaller tasks as well
    const recentImportedCalls = await TelecallerImportedTask.findAll({
      where: {
        telecallerId,
        callStatus: {
          [Op.notIn]: ['', 'n/a', '-', '—'],
          [Op.ne]: null
        }
      },
      limit: 10,
      order: [['updatedAt', 'DESC']]
    });

    const importedActivity = recentImportedCalls.map((row) => ({
      id: `imported-${row.id}`,
      type: 'IMPORTED_CALL',
      description: `Call to ${row.name || 'contact'} (${row.contactNumber || 'no number'}) · Status: ${row.callStatus || 'n/a'
        }`,
      timestamp: row.updatedAt,
      student: null
    }));

    // Combine and sort by timestamp, then limit to 10 items
    const activityFeed = [...activityFeedCore, ...importedActivity]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const engagementAlerts = buildEngagementAlerts(followUpTasks, now);

    const prioritySummary = buildPrioritySummary(formattedTasks);
    const workloadAging = buildWorkloadAging(formattedTasks, now);
    const nextFollowUp = findNextFollowUp(formattedTasks);

    const baseCallsAttemptedToday = followUpTasks.reduce((count, task) => {
      const attemptDates = [task.lastAttemptAt, task.completedAt].filter(Boolean);
      const hasAttemptToday = attemptDates.some(
        (date) => date >= startOfToday && date <= endOfToday
      );
      return hasAttemptToday ? count + 1 : count;
    }, 0);

    // Include calls made against imported telecaller tasks where call status was logged recently
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const importedCallsToday = await TelecallerImportedTask.count({
      where: {
        telecallerId,
        callStatus: {
          [Op.notIn]: ['', 'n/a', '-', '—'],
          [Op.ne]: null
        },
        updatedAt: {
          [Op.gte]: twentyFourHoursAgo
        }
      }
    });

    const callsAttemptedToday = baseCallsAttemptedToday + importedCallsToday;

    // Leads derived from imported tasks marked as lead by this telecaller
    const importedLeadRows = await TelecallerImportedTask.findAll({
      where: {
        telecallerId,
        isLead: true
      },
      order: [['updatedAt', 'DESC']]
    });

    const importedLeads = importedLeadRows.map((lead) => ({
      id: lead.id,
      name: lead.name,
      contactNumber: lead.contactNumber,
      emailId: lead.emailId,
      assigned: lead.assigned,
      callStatus: lead.callStatus,
      leadStatus: lead.leadStatus,
      interestedCountry: lead.interestedCountry,
      services: lead.services,
      comments: lead.comments,
      updatedAt: lead.updatedAt
    }));

    // Imported tasks whose call status is exactly "follow up" (for telecaller follow-ups page)
    const importedFollowUpRows = await TelecallerImportedTask.findAll({
      where: {
        telecallerId,
        callStatus: 'follow up'
      },
      order: [['updatedAt', 'DESC']]
    });

    const importedFollowUps = importedFollowUpRows.map((row) => ({
      id: row.id,
      name: row.name,
      contactNumber: row.contactNumber,
      emailId: row.emailId,
      assigned: row.assigned,
      callStatus: row.callStatus,
      leadStatus: row.leadStatus,
      interestedCountry: row.interestedCountry,
      services: row.services,
      comments: row.comments,
      updatedAt: row.updatedAt
    }));

    // Yesterday's pending imported calls (assigned yesterday but not yet updated)
    const yesterdayPendingImportedCalls = await TelecallerImportedTask.count({
      where: {
        telecallerId,
        createdAt: {
          [Op.gte]: startOfYesterday,
          [Op.lte]: endOfYesterday
        },
        [Op.or]: [
          { callStatus: null },
          { callStatus: '' },
          { callStatus: '-' },
          { callStatus: '—' },
          { callStatus: 'n/a' }
        ]
      }
    });

    const completedWithTimes = followUpTasks.filter(
      (task) => task.completed && task.completedAt && task.createdAt
    );
    const avgCompletionTimeHours = completedWithTimes.length
      ? Math.round(
        (completedWithTimes.reduce((total, task) => total + (task.completedAt - task.createdAt), 0) /
          completedWithTimes.length /
          (1000 * 60 * 60)) *
        10
      ) / 10
      : 0;

    const uniquePriorities = Array.from(
      new Set(
        formattedTasks
          .map((task) => task.priority)
          .filter(Boolean)
      )
    );

    const filterOptions = {
      statuses: ['ALL', 'OVERDUE', 'TODAY', 'UPCOMING', 'COMPLETED'],
      outcomes: CALL_OUTCOME_OPTIONS
    };

    const responsePayload = {
      success: true,
      data: {
        stats: {
          totalFollowUps,
          pendingFollowUps,
          completedFollowUps,
          overdueFollowUps,
          todayFollowUps,
          followUpPerformance:
            totalFollowUps === 0
              ? 0
              : Math.round((completedFollowUps / totalFollowUps) * 100),
          callsAttemptedToday,
          avgCompletionTimeHours,
          pendingImportedCalls: pendingImportedToday,
          totalPendingImportedCalls,
          importedTasksToday,
          importedCompletedCalls: importedCompletedToday,
          yesterdayPendingImportedCalls,
          noResponseToday,
          dontFollowUpToday
        },
        callQueue: formattedTasks,
        callVolume,
        callOutcomes: callOutcomeSummary,
        activityFeed,
        filters: {
          ...filterOptions,
          priorities: uniquePriorities.length ? uniquePriorities : PRIORITY_OPTIONS
        },
        engagementAlerts,
        insights: {
          prioritySummary,
          workloadAging,
          nextFollowUp
        },
        importedLeads,
        importedFollowUps
      }
    };

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/dashboard', duration, 200, telecallerId);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json(responsePayload);
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/dashboard', duration, 500, telecallerId);
    errorLogger.logError(error, {
      scope: 'telecaller_dashboard',
      userId: telecallerId
    });
    console.error('Error fetching telecaller dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load telecaller dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const findTaskForTelecaller = async (taskId, telecallerId) => {
  return Task.findOne({
    where: {
      id: taskId,
      counselorId: telecallerId,
      type: 'FOLLOW_UP'
    }
  });
};

const broadcastTaskUpdate = (telecallerId, taskId) => {
  const payload = {
    telecallerId,
    taskId,
    timestamp: new Date().toISOString()
  };
  websocketService.broadcastToRoom('role:telecaller', 'telecaller_task_updated', payload);
  websocketService.broadcastToUser(telecallerId, 'telecaller_task_updated', payload);
};

// Log a call initiation so recent call activity updates immediately when clicking the call icon
exports.logCallInitiated = async (req, res) => {
  const telecallerId = req.user.id;
  const { studentId, phone, name, source, importedTaskId, taskId } = req.body || {};

  try {
    const descriptionParts = ['Call started'];
    if (name) {
      descriptionParts.push(`to ${name}`);
    } else {
      descriptionParts.push('to contact');
    }
    if (phone) {
      descriptionParts.push(`(${phone})`);
    }

    const description = descriptionParts.join(' ');

    const activity = await Activity.create({
      type: 'TELECALLER_CALL_STARTED',
      description,
      studentId: studentId || null,
      userId: telecallerId,
      metadata: {
        phone: phone || null,
        source: source || null,
        importedTaskId: importedTaskId || null,
        taskId: taskId || null,
        initiatedAt: new Date().toISOString()
      }
    });

    // Reuse existing websocket event so dashboards reload without manual refresh
    broadcastTaskUpdate(telecallerId, taskId || importedTaskId || null);

    res.json({
      success: true,
      message: 'Call initiation logged',
      data: {
        id: activity.id
      }
    });
  } catch (error) {
    console.error('Error logging telecaller call initiation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log call initiation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.completeTask = async (req, res) => {
  const telecallerId = req.user.id;
  const { id } = req.params;
  const { outcome, notes } = req.body;

  const timer = performanceLogger.startTimer('telecaller_complete_task');

  try {
    const task = await findTaskForTelecaller(id, telecallerId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const now = new Date();

    await task.update({
      completed: true,
      completedAt: now,
      callOutcome: outcome || null,
      callNotes: notes || null,
      lastAttemptAt: now,
      attempts: (task.attempts || 0) + 1
    });

    // Log this completed follow-up as an activity so it appears in Recent Call Activity
    try {
      await Activity.create({
        type: 'TELECALLER_CALL',
        description: `Follow-up call${task.title ? ` - ${task.title}` : ''}${outcome ? ` (${outcome})` : ''
          }`,
        studentId: task.studentId || null,
        userId: telecallerId,
        metadata: {
          taskId: task.id,
          outcome: outcome || null,
          notes: notes || null,
          completedAt: now.toISOString()
        }
      });
    } catch (activityError) {
      console.error('Error creating telecaller activity for completed task:', activityError);
      // Do not fail the request if activity logging fails
    }

    broadcastTaskUpdate(telecallerId, task.id);

    const duration = timer.end();
    performanceLogger.logApiRequest('PATCH', '/api/telecaller/tasks/:id/complete', duration, 200, telecallerId);

    res.json({
      success: true,
      message: 'Follow-up marked as completed',
      data: {
        id: task.id,
        callOutcome: task.callOutcome,
        callNotes: task.callNotes,
        completedAt: task.completedAt,
        attempts: task.attempts
      }
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('PATCH', '/api/telecaller/tasks/:id/complete', duration, 500, telecallerId);
    errorLogger.logError(error, {
      scope: 'telecaller_complete_task',
      userId: telecallerId
    });
    console.error('Error completing telecaller task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.rescheduleTask = async (req, res) => {
  const telecallerId = req.user.id;
  const { id } = req.params;
  const { dueDate, notes } = req.body;

  const timer = performanceLogger.startTimer('telecaller_reschedule_task');

  try {
    const task = await findTaskForTelecaller(id, telecallerId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'New due date is required to reschedule'
      });
    }

    const newDueDate = new Date(dueDate);
    if (Number.isNaN(newDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date provided'
      });
    }

    const now = new Date();

    await task.update({
      dueDate: newDueDate,
      completed: false,
      completedAt: null,
      lastAttemptAt: now,
      callNotes: notes || task.callNotes,
      attempts: (task.attempts || 0) + 1
    });

    broadcastTaskUpdate(telecallerId, task.id);

    const duration = timer.end();
    performanceLogger.logApiRequest('PATCH', '/api/telecaller/tasks/:id/reschedule', duration, 200, telecallerId);

    res.json({
      success: true,
      message: 'Follow-up rescheduled successfully',
      data: {
        id: task.id,
        dueDate: task.dueDate,
        attempts: task.attempts,
        callNotes: task.callNotes
      }
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('PATCH', '/api/telecaller/tasks/:id/reschedule', duration, 500, telecallerId);
    errorLogger.logError(error, {
      scope: 'telecaller_reschedule_task',
      userId: telecallerId
    });
    console.error('Error rescheduling telecaller task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getTasks = async (req, res) => {
  const telecallerId = req.user.id;
  const { status, search, priority } = req.query;

  const timer = performanceLogger.startTimer('telecaller_tasks_list');

  try {
    const tasks = await Task.findAll({
      where: {
        counselorId: telecallerId,
        type: 'FOLLOW_UP'
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status', 'currentPhase']
        }
      ],
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']]
    });

    const notesMap = await fetchLatestNotesForStudents(
      tasks.map((task) => task.studentId).filter(Boolean)
    );

    let formatted = tasks.map((task) => formatTaskForQueue(task, notesMap));

    if (status && status !== 'ALL') {
      formatted = formatted.filter((task) => task.status === status);
    }

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      formatted = formatted.filter((task) => {
        const targetStrings = [
          task.title,
          task.description,
          task.student?.name,
          task.student?.email,
          task.student?.phone
        ].filter(Boolean);
        return targetStrings.some((value) => value.toLowerCase().includes(searchTerm));
      });
    }

    if (priority && priority !== 'ALL') {
      formatted = formatted.filter((task) => (task.priority || '').toUpperCase() === priority.toUpperCase());
    }

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/tasks', duration, 200, telecallerId);

    res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/tasks', duration, 500, telecallerId);
    errorLogger.logError(error, {
      scope: 'telecaller_tasks_list',
      userId: telecallerId
    });
    console.error('Error fetching telecaller tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.exportTasks = async (req, res) => {
  const telecallerId = req.user.id;
  const { status, date } = req.query;

  const timer = performanceLogger.startTimer('telecaller_tasks_export');

  try {
    // If status is one of the new filters, we export from TelecallerImportedTask
    if (status === 'No Response' || status === 'Follow Up') {
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required for this export'
        });
      }

      const targetDateStart = new Date(date);
      targetDateStart.setHours(0, 0, 0, 0);
      const targetDateEnd = new Date(date);
      targetDateEnd.setHours(23, 59, 59, 999);

      // Map UI status to DB status if needed, or use direct string match
      // The UI sends "No Response" or "Follow Up"
      // The DB stores "no response", "follow up" (lowercase usually, but let's be case-insensitive or precise)
      // Based on previous code, it seems to be stored as lowercase or mixed.
      // Let's try to match loosely or exactly as stored.
      // Previous code checked: rawStatus === 'no response'
      const dbStatus = status.toLowerCase();

      const tasks = await TelecallerImportedTask.findAll({
        where: {
          telecallerId,
          callStatus: dbStatus,
          updatedAt: {
            [Op.between]: [targetDateStart, targetDateEnd]
          }
        },
        order: [['updatedAt', 'DESC']]
      });

      if (!tasks.length) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=telecaller-export.csv');
        res.send('message\nNo records found for the selected date and status');
        return;
      }

      // Headers matching the import template
      const csvHeaders = [
        'S.No',
        'Name',
        'Contact Number',
        'Email ID',
        'Assigned',
        'Call Status',
        'Lead Status',
        'Interested country',
        'Services',
        'Comments'
      ];

      const csvRows = tasks.map((task, index) => {
        return [
          task.sNo || index + 1,
          `"${task.name || ''}"`,
          `"${task.contactNumber || ''}"`,
          `"${task.emailId || ''}"`,
          `"${task.assigned || ''}"`,
          `"${task.callStatus || ''}"`,
          `"${task.leadStatus || ''}"`,
          `"${task.interestedCountry || ''}"`,
          `"${task.services || ''}"`,
          `"${task.comments || ''}"`
        ].join(',');
      });

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=telecaller_export_${status.replace(/\s+/g, '_')}_${date}.csv`
      );
      res.send(csvContent);

    } else {
      // Fallback to old logic if needed, or just return empty for now as UI only allows the above
      // But to be safe, let's keep a minimal fallback or just error if unexpected status
      // For now, assuming UI only sends the new statuses.
      // If we want to support "ALL" or others, we'd need the old logic.
      // Given the requirement "left filter includes only 'No Response' and 'Follow Up'",
      // we can assume we only handle these.

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=telecaller-export.csv');
      res.send('message\nInvalid status filter');
    }

    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/tasks/export', duration, 200, telecallerId);
  } catch (error) {
    const duration = timer.end();
    performanceLogger.logApiRequest('GET', '/api/telecaller/tasks/export', duration, 500, telecallerId);
    errorLogger.logError(error, {
      scope: 'telecaller_tasks_export',
      userId: telecallerId
    });
    console.error('Error exporting telecaller tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Import telecaller tasks from Excel and persist in database
exports.importTasksFromExcel = async (req, res) => {
  const telecallerId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded Excel file does not contain any sheets.'
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded Excel file is empty.'
      });
    }

    const headerRow = rows[0].map((h) => normalizeHeader(h));
    const headerMap = {};
    headerRow.forEach((header, index) => {
      if (header) {
        headerMap[header] = index;
      }
    });

    const missingHeaders = REQUIRED_IMPORT_HEADERS.filter(
      (required) => headerMap[normalizeHeader(required)] == null
    );

    if (missingHeaders.length) {
      return res.status(400).json({
        success: false,
        message: 'The Excel file is missing required columns.',
        missingHeaders
      });
    }

    const dataRows = rows
      .slice(1)
      .filter((row) => row.some((cell) => String(cell).trim() !== ''));

    if (!dataRows.length) {
      return res.status(400).json({
        success: false,
        message: 'No data rows found in the Excel file.'
      });
    }

    const records = dataRows.map((row, index) => ({
      telecallerId,
      sNo: row[headerMap[normalizeHeader('S.No')]] || String(index + 1),
      name: row[headerMap[normalizeHeader('Name')]] || '',
      contactNumber: row[headerMap[normalizeHeader('Contact Number')]] || '',
      emailId: row[headerMap[normalizeHeader('Email ID')]] || '',
      assigned: row[headerMap[normalizeHeader('Assigned')]] || '',
      callStatus: row[headerMap[normalizeHeader('Call Status')]] || '',
      leadStatus: row[headerMap[normalizeHeader('Lead Status')]] || '',
      interestedCountry: row[headerMap[normalizeHeader('Interested country')]] || '',
      services: row[headerMap[normalizeHeader('Services')]] || '',
      comments: row[headerMap[normalizeHeader('Comments')]] || '',
      isLead: false
    }));

    // Append new imported tasks for this telecaller (do not delete existing)
    // await TelecallerImportedTask.destroy({ where: { telecallerId } });
    await TelecallerImportedTask.bulkCreate(records);

    return res.json({
      success: true,
      message: 'Tasks imported successfully',
      inserted: records.length
    });
  } catch (error) {
    errorLogger.logError(error, {
      scope: 'telecaller_tasks_import',
      userId: telecallerId
    });
    console.error('Error importing telecaller tasks from Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get imported tasks for current telecaller from database
exports.getImportedTasks = async (req, res) => {
  const telecallerId = req.user.id;

  try {
    const items = await TelecallerImportedTask.findAll({
      where: { telecallerId },
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: items
    });
  } catch (error) {
    errorLogger.logError(error, {
      scope: 'telecaller_imported_tasks_list',
      userId: telecallerId
    });
    console.error('Error fetching imported telecaller tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load imported tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a single imported task with call details and metadata
exports.updateImportedTask = async (req, res) => {
  const telecallerId = req.user.id;
  const { id } = req.params;
  const {
    emailId,
    assigned,
    callStatus,
    leadStatus,
    interestedCountry,
    services,
    comments,
    isLead
  } = req.body || {};

  try {
    const existing = await TelecallerImportedTask.findOne({
      where: { id, telecallerId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Imported task not found'
      });
    }

    await existing.update({
      emailId: typeof emailId === 'undefined' ? existing.emailId : emailId,
      assigned: typeof assigned === 'undefined' ? existing.assigned : assigned,
      callStatus: typeof callStatus === 'undefined' ? existing.callStatus : callStatus,
      leadStatus: typeof leadStatus === 'undefined' ? existing.leadStatus : leadStatus,
      interestedCountry:
        typeof interestedCountry === 'undefined'
          ? existing.interestedCountry
          : interestedCountry,
      services: typeof services === 'undefined' ? existing.services : services,
      comments: typeof comments === 'undefined' ? existing.comments : comments,
      isLead:
        typeof isLead === 'undefined'
          ? existing.isLead
          : Boolean(isLead)
    });

    // Notify telecaller dashboard/follow-ups via websocket so counts refresh without reload
    broadcastTaskUpdate(telecallerId, existing.id);

    return res.json({
      success: true,
      message: 'Imported task updated successfully',
      data: existing
    });
  } catch (error) {
    errorLogger.logError(error, {
      scope: 'telecaller_imported_task_update',
      userId: telecallerId
    });
    console.error('Error updating imported telecaller task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update imported task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
