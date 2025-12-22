
require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('Testing DB Codection...');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD); // Don't log password

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
    }
);

sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Unable to connect to the database:', error.message);
        process.exit(1);
    });
