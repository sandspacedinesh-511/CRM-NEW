const sequelize = require('../config/database');
const { User } = require('../models');

async function createAdmin() {
    try {
        // Get arguments from command line
        // Usage: node scripts/createAdminUser.js "Name" "email" "password"
        const args = process.argv.slice(2);
        const name = args[0] || 'Admin User';
        const email = args[1] || 'admin@example.com';
        const password = args[2] || 'Admin@123';

        console.log(`Creating admin user: ${email}`);

        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email } });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        // Create user with RAW password. 
        // The User model's beforeCreate hook will handle validation and hashing.
        await User.create({
            name,
            email,
            password,
            role: 'admin',
            active: true
        });

        console.log('Admin user created successfully.');
        console.log('Email:', email);
        console.log('Password:', password);

        process.exit(0);
    } catch (error) {
        console.error('Failed to create admin user:', error);
        if (error.errors) {
            error.errors.forEach(e => console.error(`- ${e.message}`));
        }
        process.exit(1);
    }
}

createAdmin();
