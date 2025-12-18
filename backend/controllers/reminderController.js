const { Reminder, Student, User } = require('../models');
const { logger } = require('../utils/logger');
const { Op } = require('sequelize');

// Create a new reminder
exports.createReminder = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { studentId, title, message, reminderDatetime } = req.body;

        // Validate required fields
        if (!studentId || !message || !reminderDatetime) {
            return res.status(400).json({
                success: false,
                message: 'Student ID, message, and reminder datetime are required'
            });
        }

        // Validate that reminder datetime is in the future
        const reminderDate = new Date(reminderDatetime);
        if (reminderDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reminder datetime must be in the future'
            });
        }

        // Verify student exists and belongs to counselor
        const student = await Student.findOne({
            where: { id: studentId, counselorId }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        // Create reminder
        const reminder = await Reminder.create({
            counselorId,
            studentId,
            title: title || null,
            message,
            reminderDatetime: reminderDate,
            status: 'pending'
        });

        // Fetch reminder with associations
        const reminderWithDetails = await Reminder.findByPk(reminder.id, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        logger.info(`Reminder created: ${reminder.id} for student ${studentId} by counselor ${counselorId}`);

        res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            reminder: reminderWithDetails
        });
    } catch (error) {
        logger.error('Error creating reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create reminder',
            error: error.message
        });
    }
};

// Get all reminders for logged-in counselor
exports.getReminders = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { status, limit = 50, offset = 0 } = req.query;

        const whereClause = { counselorId };
        if (status) {
            whereClause.status = status;
        }

        const { count, rows: reminders } = await Reminder.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['reminderDatetime', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            reminders,
            total: count
        });
    } catch (error) {
        logger.error('Error fetching reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reminders',
            error: error.message
        });
    }
};

// Get reminders for a specific student
exports.getRemindersByStudent = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { studentId } = req.params;

        // Verify student belongs to counselor
        const student = await Student.findOne({
            where: { id: studentId, counselorId }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to you'
            });
        }

        const reminders = await Reminder.findAll({
            where: { studentId, counselorId },
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['reminderDatetime', 'ASC']]
        });

        res.json({
            success: true,
            reminders
        });
    } catch (error) {
        logger.error('Error fetching student reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student reminders',
            error: error.message
        });
    }
};

// Get pending reminders for counselor
exports.getPendingReminders = async (req, res) => {
    try {
        const counselorId = req.user.id;

        const reminders = await Reminder.findAll({
            where: {
                counselorId,
                status: 'pending',
                reminderDatetime: {
                    [Op.gte]: new Date()
                }
            },
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            order: [['reminderDatetime', 'ASC']]
        });

        res.json({
            success: true,
            reminders
        });
    } catch (error) {
        logger.error('Error fetching pending reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending reminders',
            error: error.message
        });
    }
};

// Update a reminder
exports.updateReminder = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { id } = req.params;
        const { title, message, reminderDatetime, status } = req.body;

        // Find reminder
        const reminder = await Reminder.findOne({
            where: { id, counselorId }
        });

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Validate datetime if provided
        if (reminderDatetime) {
            const reminderDate = new Date(reminderDatetime);
            if (reminderDate <= new Date() && reminder.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Reminder datetime must be in the future'
                });
            }
        }

        // Update fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (message !== undefined) updateData.message = message;
        if (reminderDatetime !== undefined) updateData.reminderDatetime = new Date(reminderDatetime);
        if (status !== undefined) updateData.status = status;

        await reminder.update(updateData);

        // Fetch updated reminder with associations
        const updatedReminder = await Reminder.findByPk(id, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        logger.info(`Reminder updated: ${id} by counselor ${counselorId}`);

        res.json({
            success: true,
            message: 'Reminder updated successfully',
            reminder: updatedReminder
        });
    } catch (error) {
        logger.error('Error updating reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reminder',
            error: error.message
        });
    }
};

// Delete/Cancel a reminder
exports.deleteReminder = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { id } = req.params;

        // Find and delete reminder
        const deleted = await Reminder.destroy({
            where: { id, counselorId }
        });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        logger.info(`Reminder deleted: ${id} by counselor ${counselorId}`);

        res.json({
            success: true,
            message: 'Reminder deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete reminder',
            error: error.message
        });
    }
};
