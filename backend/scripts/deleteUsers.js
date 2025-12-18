const sequelize = require('../config/database');
const { User } = require('../models');
const { Op } = require('sequelize');

const emailsToDelete = [
    'dineshgattigorl123@gmail.com',
    'gattigorladinesh45@gmail.com'
];

async function deleteUsers() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log(`Attempting to delete users with emails: ${emailsToDelete.join(', ')}`);

        const result = await User.destroy({
            where: {
                email: {
                    [Op.in]: emailsToDelete
                }
            }
        });

        console.log(`Successfully deleted ${result} user(s).`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to delete users:', error);
        process.exit(1);
    }
}

deleteUsers();
