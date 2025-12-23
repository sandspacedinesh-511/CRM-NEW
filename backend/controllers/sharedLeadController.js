const {
    User,
    Student,
    SharedLead,
    Notification,
    TelecallerImportedTask
} = require('../models');
const { Op } = require('sequelize');
const { cacheUtils } = require('../config/redis');
const websocketService = require('../services/websocketService');

// Share a lead with another counselor
exports.shareLead = async (req, res) => {
    try {
        const sourceCounselorId = req.user.id;
        const sourceCounselorName = req.user.name || 'Counselor';
        const { id } = req.params; // student/lead id
        const { counselorId: targetCounselorId } = req.body || {};

        if (!targetCounselorId) {
            return res.status(400).json({
                success: false,
                message: 'Target counselorId is required'
            });
        }

        if (Number(targetCounselorId) === Number(sourceCounselorId)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot share a lead with yourself'
            });
        }

        // Ensure target counselor exists and is active
        const targetCounselor = await User.findOne({
            where: {
                id: targetCounselorId,
                role: 'counselor',
                active: true
            },
            attributes: ['id', 'name', 'email']
        });

        if (!targetCounselor) {
            return res.status(404).json({
                success: false,
                message: 'Target counselor not found or inactive'
            });
        }

        // Ensure the student belongs to the current counselor
        const student = await Student.findOne({
            where: {
                id,
                counselorId: sourceCounselorId
            },
            attributes: ['id', 'firstName', 'lastName', 'email', 'counselorId']
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Lead (student) not found for this counselor'
            });
        }

        // Check if there's already a pending share for this student
        const existingShare = await SharedLead.findOne({
            where: {
                studentId: student.id,
                status: 'pending'
            }
        });

        if (existingShare) {
            return res.status(400).json({
                success: false,
                message: 'This student already has a pending share request'
            });
        }

        // Create SharedLead record
        const sharedLead = await SharedLead.create({
            senderId: sourceCounselorId,
            receiverId: targetCounselor.id,
            studentId: student.id,
            status: 'pending'
        });

        // Create persistent notification in database
        const notificationData = {
            userId: targetCounselor.id,
            type: 'lead_assignment',
            title: 'Lead Shared With You',
            message: `${sourceCounselorName} shared a lead: ${student.firstName} ${student.lastName}`,
            priority: 'high',
            leadId: student.id,
            sharedByCounselorId: sourceCounselorId,
            sharedLeadId: sharedLead.id,
            isRead: false
        };

        const savedNotification = await Notification.create(notificationData);

        // Also push to Redis/WebSocket for real-time update
        try {
            const key = `notifications:${targetCounselor.id}`;
            const existing = (await cacheUtils.get(key)) || [];
            existing.unshift(savedNotification.toJSON());
            await cacheUtils.set(key, existing, 3600);

            await websocketService.sendNotification(targetCounselor.id, savedNotification);
        } catch (notifyError) {
            console.error('Failed to push counselor lead share notification:', notifyError);
        }

        return res.json({
            success: true,
            message: `Lead share request sent to counselor ${targetCounselor.name} successfully`,
            data: {
                studentId: student.id,
                targetCounselorId: targetCounselor.id,
                sharedLeadId: sharedLead.id
            }
        });
    } catch (error) {
        console.error('Error sharing lead with counselor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share lead with counselor'
        });
    }
};

// Accept a shared lead
exports.acceptSharedLead = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { id } = req.params; // sharedLead id

        const sharedLead = await SharedLead.findOne({
            where: {
                id,
                receiverId: counselorId,
                status: 'pending'
            },
            include: [
                { model: Student, as: 'student' },
                { model: User, as: 'sender', attributes: ['id', 'name'] }
            ]
        });

        if (!sharedLead) {
            return res.status(404).json({
                success: false,
                message: 'Pending shared lead request not found'
            });
        }

        const student = sharedLead.student;
        const previousCounselorId = student.counselorId;

        // IMPORTANT: Update SharedLead status to 'accepted' FIRST, then update student
        // Use direct update to ensure it's saved
        await SharedLead.update(
            { status: 'accepted' },
            { where: { id: sharedLead.id } }
        );
        
        // Reload sharedLead to ensure we have the latest data
        await sharedLead.reload();
        
        // Verify the SharedLead status was updated
        const verifySharedLead = await SharedLead.findByPk(sharedLead.id, { attributes: ['id', 'status'] });
        if (!verifySharedLead || verifySharedLead.status !== 'accepted') {
            console.error(`ERROR: SharedLead ${sharedLead.id} status is still '${verifySharedLead?.status}' after update! Expected: 'accepted'`);
            // Try one more time
            await SharedLead.update({ status: 'accepted' }, { where: { id: sharedLead.id } });
            console.log(`Retried: Updated SharedLead ${sharedLead.id} status to 'accepted'`);
        } else {
            console.log(`Verified: SharedLead ${sharedLead.id} status is correctly set to 'accepted'`);
        }

        // Assign student to new counselor - use save() to ensure it's persisted
        student.counselorId = counselorId;
        await student.save();
        
        // Reload student to ensure we have the latest data
        await student.reload();
        
        // CRITICAL: Cancel ALL other pending SharedLeads for this student
        // This ensures no pending shares remain after acceptance
        const canceledCount = await SharedLead.update(
            { status: 'rejected' },
            {
                where: {
                    studentId: student.id,
                    status: 'pending',
                    id: { [Op.ne]: sharedLead.id }
                }
            }
        );
        if (canceledCount[0] > 0) {
            console.log(`Canceled ${canceledCount[0]} other pending SharedLead(s) for student ${student.id}`);
        }
        
        // Verify the updates were saved
        console.log(`Lead accepted: Student ${student.id} (counselorId: ${student.counselorId}) assigned to counselor ${counselorId}, SharedLead ${sharedLead.id} status: ${sharedLead.status}`);
        
        // Double-check: verify student has counselorId set by querying the database directly
        const verifyStudent = await Student.findByPk(student.id, { attributes: ['id', 'counselorId'] });
        if (!verifyStudent || !verifyStudent.counselorId) {
            console.error(`ERROR: Student ${student.id} counselorId is still null after update! Expected: ${counselorId}, Got: ${verifyStudent?.counselorId}`);
            // Try one more time with direct update
            await Student.update({ counselorId }, { where: { id: student.id } });
            console.log(`Retried: Updated student ${student.id} counselorId to ${counselorId}`);
        } else {
            console.log(`Verified: Student ${student.id} counselorId is correctly set to ${verifyStudent.counselorId}`);
        }
        
        // Final verification: ensure NO pending SharedLeads remain for this student
        const remainingPending = await SharedLead.count({
            where: {
                studentId: student.id,
                status: 'pending'
            }
        });
        if (remainingPending > 0) {
            console.error(`ERROR: Student ${student.id} still has ${remainingPending} pending SharedLead(s) after acceptance! Attempting to fix...`);
            // Force update all remaining pending SharedLeads
            await SharedLead.update(
                { status: 'rejected' },
                { where: { studentId: student.id, status: 'pending' } }
            );
            console.log(`Fixed: Rejected all remaining pending SharedLeads for student ${student.id}`);
        } else {
            console.log(`Verified: No pending SharedLeads remain for student ${student.id}`);
        }

        // Notify the sender
        const notificationData = {
            userId: sharedLead.senderId,
            type: 'info',
            title: 'Lead Share Accepted',
            message: `${req.user.name || 'Counselor'} accepted your shared lead: ${student.firstName} ${student.lastName}`,
            priority: 'normal',
            isRead: false
        };
        await Notification.create(notificationData);

        // Real-time notification for sender
        try {
            await websocketService.sendNotification(sharedLead.senderId, notificationData);
            
            // Send lead status update for real-time UI update
            // This will broadcast to the sender and all admins
            const leadStatusData = {
                studentId: student.id,
                sharedLeadId: sharedLead.id,
                status: 'accepted',
                counselorId: counselorId,
                counselorName: req.user.name || 'Counselor'
            };
            
            console.log(`Sending WebSocket lead_status_update to sender ${sharedLead.senderId} and all admins:`, leadStatusData);
            await websocketService.sendLeadStatusUpdate(sharedLead.senderId, leadStatusData);
            console.log(`WebSocket lead_status_update sent successfully`);
        } catch (e) {
            console.error("Failed to send socket notification", e);
        }

        // Clear dashboard cache for both previous and new counselor
        try {
            const newCacheKey = `dashboard:${counselorId}`;
            await cacheUtils.del(newCacheKey);

            if (previousCounselorId && previousCounselorId !== counselorId) {
                const previousCacheKey = `dashboard:${previousCounselorId}`;
                await cacheUtils.del(previousCacheKey);
            }
        } catch (cacheError) {
            console.error('Error clearing dashboard cache:', cacheError);
        }

        // Update telecaller tasks if applicable
        try {
            const where = {};
            const orConditions = [];
            if (student.email) orConditions.push({ emailId: student.email });
            if (student.phone) orConditions.push({ contactNumber: student.phone });

            if (orConditions.length) {
                where[Op.or] = orConditions;
                await TelecallerImportedTask.update(
                    { leadStatus: 'ASSIGNED_TO_COUNSELOR' },
                    { where }
                );
            }
        } catch (err) {
            console.error('Error updating telecaller tasks', err);
        }

        return res.json({
            success: true,
            message: 'Lead accepted successfully'
        });
    } catch (error) {
        console.error('Error accepting shared lead:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept shared lead'
        });
    }
};

// Reject a shared lead
exports.rejectSharedLead = async (req, res) => {
    try {
        const counselorId = req.user.id;
        const { id } = req.params; // sharedLead id

        const sharedLead = await SharedLead.findOne({
            where: {
                id,
                receiverId: counselorId,
                status: 'pending'
            },
            include: [
                { model: Student, as: 'student' },
                { model: User, as: 'sender', attributes: ['id', 'name'] }
            ]
        });

        if (!sharedLead) {
            return res.status(404).json({
                success: false,
                message: 'Pending shared lead request not found'
            });
        }

        // Update SharedLead status
        await sharedLead.update({ status: 'rejected' });

        // Notify the sender
        const notificationData = {
            userId: sharedLead.senderId,
            type: 'warning',
            title: 'Lead Share Rejected',
            message: `${req.user.name || 'Counselor'} rejected your shared lead: ${sharedLead.student.firstName} ${sharedLead.student.lastName}`,
            priority: 'normal',
            isRead: false
        };
        await Notification.create(notificationData);

        // Real-time notification for sender
        try {
            await websocketService.sendNotification(sharedLead.senderId, notificationData);
        } catch (e) {
            console.error("Failed to send socket notification", e);
        }

        return res.json({
            success: true,
            message: 'Lead rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting shared lead:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject shared lead'
        });
    }
};

// Get pending shared leads
exports.getPendingSharedLeads = async (req, res) => {
    try {
        const counselorId = req.user.id;

        const pendingLeads = await SharedLead.findAll({
            where: {
                [Op.or]: [
                    { senderId: counselorId },
                    { receiverId: counselorId }
                ],
                status: 'pending'
            },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'email'] },
                { model: User, as: 'sender', attributes: ['id', 'name'] },
                { model: User, as: 'receiver', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.json({
            success: true,
            data: pendingLeads
        });
    } catch (error) {
        console.error('Error fetching pending shared leads:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending shared leads'
        });
    }
};
