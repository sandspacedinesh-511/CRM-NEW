const sequelize = require('../config/database');
const { User } = require('../models');

const demoUsers = [
    {
        name: 'Demo Admin',
        email: 'admin@crm.com',
        password: 'Admin@123',
        role: 'admin'
    },
    {
        name: 'Demo Counselor',
        email: 'counselor@crm.com',
        password: 'Counselor@123',
        role: 'counselor'
    },
    {
        name: 'Demo Telecaller',
        email: 'telecaller@crm.com',
        password: 'Telecaller@123',
        role: 'telecaller'
    },
    {
        name: 'Demo Marketing',
        email: 'marketing@crm.com',
        password: 'Marketing@123',
        role: 'marketing'
    }
];

async function createDemoUsers() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        for (const user of demoUsers) {
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (existingUser) {
                console.log(`User ${user.email} already exists. Skipping.`);
            } else {
                console.log(`Creating ${user.role}: ${user.email}`);
                await User.create({
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    role: user.role,
                    active: true
                });
                console.log(`Successfully created ${user.email}`);
            }
        }

        console.log('\nAll demo users processed.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create demo users:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`- ${e.message}`));
        }
        process.exit(1);
    }
}

createDemoUsers();
