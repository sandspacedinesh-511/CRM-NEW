const sequelize = require('../config/database');
const { User } = require('../models');

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const users = await User.findAll({
            attributes: ['email', 'role', 'name']
        });

        console.log('Existing Users:');
        users.forEach(user => {
            console.log(`Role: ${user.role}, Email: ${user.email}, Name: ${user.name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}

listUsers();
