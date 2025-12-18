const sequelize = require('../config/database');
const { User, Counselor, Student, University, Application, Document } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('Starting database seeding...');

        // Add any initial data here if needed
        // For now, we just ensure the connection works and tables are ready
        await sequelize.authenticate();

        console.log('Database seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
