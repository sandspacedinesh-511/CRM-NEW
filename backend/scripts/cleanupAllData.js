require('dotenv').config();
const sequelize = require('../config/database');
const {
    User,
    Student,
    CounselorActivity,
    Document,
    Note,
    Activity,
    Task,
    TelecallerImportedTask,
    Notification,
    SharedLead,
    Message,
    Reminder,
    StudentUniversityApplication,
    ApplicationCountry
} = require('../models');

/**
 * Cleanup Script - Removes all counselors, telecallers, marketing team members, and their associated data
 * WARNING: This script will permanently delete data. Use with caution!
 */

async function cleanupAllData() {
    try {
        console.log('🚀 Starting cleanup process...\n');

        // Start transaction for data integrity
        const transaction = await sequelize.transaction();

        try {
            // Step 1: Get all users to be deleted (counselors, telecallers, marketing, b2b_marketing)
            const usersToDelete = await User.findAll({
                where: {
                    role: ['counselor', 'telecaller', 'marketing', 'b2b_marketing']
                },
                attributes: ['id', 'name', 'email', 'role'],
                transaction
            });

            console.log(`  Found ${usersToDelete.length} users to delete:`);
            usersToDelete.forEach(user => {
                console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
            });
            console.log('');

            const userIds = usersToDelete.map(u => u.id);
            const counselorIds = usersToDelete.filter(u => u.role === 'counselor').map(u => u.id);
            const telecallerIds = usersToDelete.filter(u => u.role === 'telecaller').map(u => u.id);
            const marketingIds = usersToDelete.filter(u => ['marketing', 'b2b_marketing'].includes(u.role)).map(u => u.id);

            // Step 2: Get all students/leads associated with these users
            const studentsToDelete = await Student.findAll({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { counselorId: counselorIds },
                        { marketingOwnerId: [...telecallerIds, ...marketingIds] }
                    ]
                },
                attributes: ['id', 'firstName', 'lastName', 'email'],
                transaction
            });

            console.log(`  Found ${studentsToDelete.length} students/leads to delete:`);
            studentsToDelete.forEach(student => {
                console.log(`   - ${student.firstName} ${student.lastName} (${student.email})`);
            });
            console.log('');

            const studentIds = studentsToDelete.map(s => s.id);

            // Step 3: Delete all related data in the correct order (child tables first)

            console.log('   Deleting Reminders...');
            const remindersDeleted = await Reminder.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { counselorId: counselorIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${remindersDeleted} reminders\n`);

            console.log('   Deleting Messages...');
            const messagesDeleted = await Message.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { senderId: userIds },
                        { receiverId: userIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${messagesDeleted} messages\n`);

            console.log('   Deleting Shared Leads...');
            const sharedLeadsDeleted = await SharedLead.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { senderId: userIds },
                        { receiverId: userIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${sharedLeadsDeleted} shared leads\n`);

            console.log('   Deleting Notifications...');
            const notificationsDeleted = await Notification.destroy({
                where: {
                    userId: userIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${notificationsDeleted} notifications\n`);

            console.log('   Deleting Telecaller Imported Tasks...');
            const telecallerTasksDeleted = await TelecallerImportedTask.destroy({
                where: {
                    telecallerId: telecallerIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${telecallerTasksDeleted} telecaller imported tasks\n`);

            console.log('   Deleting Tasks...');
            const tasksDeleted = await Task.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { counselorId: counselorIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${tasksDeleted} tasks\n`);

            console.log('   Deleting Activities...');
            const activitiesDeleted = await Activity.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { userId: userIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${activitiesDeleted} activities\n`);

            console.log('   Deleting Counselor Activities...');
            const counselorActivitiesDeleted = await CounselorActivity.destroy({
                where: {
                    counselorId: counselorIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${counselorActivitiesDeleted} counselor activities\n`);

            console.log('   Deleting Notes...');
            const notesDeleted = await Note.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { counselorId: counselorIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${notesDeleted} notes\n`);

            console.log('   Deleting Documents...');
            const documentsDeleted = await Document.destroy({
                where: {
                    [sequelize.Sequelize.Op.or]: [
                        { uploadedBy: userIds },
                        { studentId: studentIds }
                    ]
                },
                transaction
            });
            console.log(`   ✓ Deleted ${documentsDeleted} documents\n`);

            console.log('   Deleting Application Countries (student-country profiles)...');
            const applicationCountriesDeleted = await ApplicationCountry.destroy({
                where: {
                    studentId: studentIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${applicationCountriesDeleted} application countries\n`);

            console.log('   Deleting Student University Applications...');
            const applicationsDeleted = await StudentUniversityApplication.destroy({
                where: {
                    studentId: studentIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${applicationsDeleted} university applications\n`);

            console.log('   Deleting Students/Leads...');
            const studentsDeletedCount = await Student.destroy({
                where: {
                    id: studentIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${studentsDeletedCount} students/leads\n`);

            console.log('   Deleting Users (Counselors, Telecallers, Marketing)...');
            const usersDeletedCount = await User.destroy({
                where: {
                    id: userIds
                },
                transaction
            });
            console.log(`   ✓ Deleted ${usersDeletedCount} users\n`);

            // Commit transaction
            await transaction.commit();

            console.log('  Cleanup completed successfully!\n');
            console.log('  Summary:');
            console.log(`   - Users deleted: ${usersDeletedCount}`);
            console.log(`   - Students/Leads deleted: ${studentsDeletedCount}`);
            console.log(`   - University Applications deleted: ${applicationsDeleted}`);
            console.log(`   - Application Countries deleted: ${applicationCountriesDeleted}`);
            console.log(`   - Documents deleted: ${documentsDeleted}`);
            console.log(`   - Notes deleted: ${notesDeleted}`);
            console.log(`   - Tasks deleted: ${tasksDeleted}`);
            console.log(`   - Activities deleted: ${activitiesDeleted}`);
            console.log(`   - Telecaller Tasks deleted: ${telecallerTasksDeleted}`);
            console.log(`   - Notifications deleted: ${notificationsDeleted}`);
            console.log(`   - Shared Leads deleted: ${sharedLeadsDeleted}`);
            console.log(`   - Messages deleted: ${messagesDeleted}`);
            console.log(`   - Reminders deleted: ${remindersDeleted}`);

        } catch (error) {
            // Rollback transaction on error
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('  Error during cleanup:', error);
        throw error;
    } finally {
        await sequelize.close();
        console.log('\n🔌 Database connection closed.');
    }
}

// Run the cleanup
cleanupAllData()
    .then(() => {
        console.log('\n✨ Script execution completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script execution failed:', error);
        process.exit(1);
    });
