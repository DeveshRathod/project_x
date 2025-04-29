import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_HOST = process.env.DB_HOST;

const createDatabaseIfNotExists = async () => {
  const connection = await mysql.createConnection({ 
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
};

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false
});

const connectDB = async () => {
  try {
    await createDatabaseIfNotExists(); 
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log("DB connected SQL");
  } catch (err) {
    console.error('DB connection/sync error:', err);
  }
};

export { connectDB, sequelize };
