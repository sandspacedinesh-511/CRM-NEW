const { CounselorActivity } = require('../models');

// Track counselor activity
const trackActivity = async (counselorId, activityType, description = null, metadata = {}) => {
    try {
        const activityData = {
            counselorId,
            activityType,
            description,
            metadata,
            status: 'ACTIVE'
        };

        // Handle login activity
        if (activityType === 'LOGIN') {
            activityData.loginTime = metadata.loginTime || new Date();
            activityData.ipAddress = metadata.ipAddress;
            activityData.userAgent = metadata.userAgent;
            activityData.sessionId = metadata.sessionId;
        }

        // Handle logout activity
        if (activityType === 'LOGOUT') {
            activityData.logoutTime = metadata.logoutTime || new Date();
            activityData.ipAddress = metadata.ipAddress;
            activityData.userAgent = metadata.userAgent;
            activityData.sessionId = metadata.sessionId;

            // Find and update the corresponding login activity
            const loginActivity = await CounselorActivity.findOne({
                where: {
                    counselorId,
                    activityType: 'LOGIN',
                    sessionId: metadata.sessionId,
                    status: 'ACTIVE'
                },
                order: [['createdAt', 'DESC']]
            });

            if (loginActivity) {
                const sessionDuration = Math.floor((new Date(activityData.logoutTime) - new Date(loginActivity.loginTime)) / 1000);
                await loginActivity.update({
                    logoutTime: activityData.logoutTime,
                    sessionDuration,
                    status: 'COMPLETED'
                });
            }
        }

        await CounselorActivity.create(activityData);
    } catch (error) {
        console.error('Error tracking counselor activity:', error);
    }
};

module.exports = {
    trackActivity
};
