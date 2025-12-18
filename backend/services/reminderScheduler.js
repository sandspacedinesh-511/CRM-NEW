const cron = require('node-cron');
const { Reminder, Student, Notification, TelecallerImportedTask } = require('../models');
const { logger } = require('../utils/logger');
const webSocketService = require('./websocketService');
const { Op } = require('sequelize');

class ReminderScheduler {
    constructor() {
        this.task = null;
    }

    // Start the scheduler
    start() {
        // Run every minute to check for due reminders and callbacks
        this.task = cron.schedule('* * * * *', async () => {
            try {
                await this.checkAndTriggerReminders();
                await this.checkAndTriggerCallbackReminders();
            } catch (error) {
                logger.error('Error in reminder scheduler:', error);
            }
        });

        logger.info('Reminder scheduler started - checking every minute');
    }

    // Stop the scheduler
    stop() {
        if (this.task) {
            this.task.stop();
            logger.info('Reminder scheduler stopped');
        }
    }

    // Check for due reminders and trigger them
    async checkAndTriggerReminders() {
        try {
            const now = new Date();

            // Find all pending reminders that are due
            const dueReminders = await Reminder.findAll({
                where: {
                    status: 'pending',
                    reminderDatetime: {
                        [Op.lte]: now
                    }
                },
                include: [
                    {
                        model: Student,
                        as: 'student',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            if (dueReminders.length > 0) {
                logger.info(`Found ${dueReminders.length} due reminder(s) to trigger`);
                // Process each due reminder
                for (const reminder of dueReminders) {
                    try {
                        await this.triggerReminder(reminder);
                    } catch (error) {
                        logger.error(`Error triggering reminder ${reminder.id}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.error('Error checking due reminders:', error);
        }
    }

    // Check for due callbacks and trigger notifications
    async checkAndTriggerCallbackReminders() {
        try {
            const now = new Date();

            // Find all imported tasks with callbacks due or past due
            const dueCallbacks = await TelecallerImportedTask.findAll({
                where: {
                    callbackDateTime: {
                        [Op.lte]: now
                    },
                    callStatus: {
                        [Op.not]: 'completed' // Assuming we don't remind for completed tasks, adjust if needed
                    }
                    // Note: We don't have a 'status' like 'pending' for callbacks in the tasks table itself
                    // so we rely on checking if a notification has already been sent.
                }
            });

            if (dueCallbacks.length === 0) {
                return;
            }

            for (const task of dueCallbacks) {
                try {
                    // Check if a notification for this specific callback instance (time + task) already exists
                    // We use the callbackDateTime in metadata or query to ensure if they reschedule, we notify again.
                    // However, simplified: check if we notified for this taskId and type recently or if existing notification matches.
                    // Better: Check if a notification exists for this taskId with type 'callback_reminder' 
                    // AND where the scheduledTime matches the current task's callbackDateTime.

                    const existingNotification = await Notification.findOne({
                        where: {
                            type: 'callback_reminder',
                            metadata: {
                                taskId: task.id,
                                scheduledTime: task.callbackDateTime // Important: Must match strict time to allow re-notification on reschedule
                            }
                        }
                    });

                    if (!existingNotification) {
                        await this.triggerCallbackNotification(task);
                    }
                } catch (error) {
                    logger.error(`Error processing callback reminder for task ${task.id}:`, error);
                }
            }

        } catch (error) {
            logger.error('Error checking due callback reminders:', error);
        }
    }

    // Trigger a specific reminder
    async triggerReminder(reminder) {
        try {
            const student = reminder.student;
            const studentName = `${student.firstName} ${student.lastName}`;

            // Create notification in database
            const notification = await Notification.create({
                userId: reminder.counselorId,
                type: 'reminder',
                title: reminder.title || 'Student Reminder',
                message: `Reminder for ${studentName}: ${reminder.message}`,
                priority: 'high',
                isRead: false,
                metadata: {
                    reminderId: reminder.id,
                    studentId: reminder.studentId,
                    studentName: studentName,
                    reminderMessage: reminder.message,
                    reminderTitle: reminder.title,
                    scheduledTime: reminder.reminderDatetime
                }
            });

            // Update reminder status to triggered
            await reminder.update({ status: 'triggered' });

            // Send real-time notification
            this.sendWebSocketNotification(reminder.counselorId, notification, {
                type: 'reminder',
                studentId: reminder.studentId,
                studentName: studentName,
                reminderId: reminder.id,
                reminderMessage: reminder.message,
                reminderTitle: reminder.title,
                scheduledTime: reminder.reminderDatetime
            });

        } catch (error) {
            logger.error(`Error in triggerReminder for reminder ${reminder.id}:`, error);
            throw error;
        }
    }

    async triggerCallbackNotification(task) {
        try {
            // Create notification in database
            const notification = await Notification.create({
                userId: task.telecallerId,
                type: 'callback_reminder',
                title: 'Callback Reminder',
                message: `Callback due for ${task.name || 'Contact'} (${task.contactNumber})`,
                priority: 'high',
                isRead: false,
                metadata: {
                    taskId: task.id,
                    name: task.name,
                    contactNumber: task.contactNumber,
                    scheduledTime: task.callbackDateTime
                }
            });

            logger.info(`Callback notification created for task ${task.id}`);

            // Send real-time notification
            this.sendWebSocketNotification(task.telecallerId, notification, {
                type: 'callback_reminder',
                taskId: task.id,
                name: task.name,
                contactNumber: task.contactNumber,
                scheduledTime: task.callbackDateTime
            });

        } catch (error) {
            logger.error(`Error triggering callback notification for task ${task.id}:`, error);
            throw error;
        }
    }

    async sendWebSocketNotification(userId, notification, extraPayload = {}) {
        try {
            const notificationPayload = {
                id: notification.id,
                title: notification.title,
                message: notification.message,
                priority: notification.priority,
                createdAt: notification.createdAt,
                ...extraPayload
            };

            await webSocketService.sendNotification(userId, notificationPayload);
        } catch (wsError) {
            logger.warn(`WebSocket notification failed for user ${userId}:`, wsError.message);
        }
    }
}

// Create singleton instance
const reminderScheduler = new ReminderScheduler();

module.exports = reminderScheduler;
