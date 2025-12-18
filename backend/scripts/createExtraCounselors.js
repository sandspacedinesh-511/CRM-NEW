const sequelize = require('../config/database');
const { User } = require('../models');

const newCounselors = [
    {
        name: 'Counselor Two',
        email: 'counselor2@crm.com',
        password: 'Counselor@123',
        role: 'counselor'
    },
    {
        name: 'Counselor Three',
        email: 'counselor3@crm.com',
        password: 'Counselor@123',
        role: 'counselor'
    }
];

async function createExtraCounselors() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        for (const user of newCounselors) {
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

        console.log('\nNew counselors processed.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to create counselors:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`- ${e.message}`));
        }
        process.exit(1);
    }
}

createExtraCounselors();
