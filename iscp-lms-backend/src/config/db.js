/**
 * db.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 15, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Database configuration and connection handling
 * using MySQL for the LMS application.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { pool, connectDB }; 