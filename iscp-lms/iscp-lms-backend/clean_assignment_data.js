/**
 * Script to clean up assignment data and reset tables
 * Run with: node clean_assignment_data.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function cleanAssignmentData() {
  console.log('Starting assignment data cleanup...');
  
  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Important for running multiple SQL statements
  });
  
  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'sql', 'clean_assignment_data.sql');
    const sqlScript = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL script
    console.log('Executing SQL cleanup script...');
    const [results] = await connection.query(sqlScript);
    
    // Log results
    console.log('Cleanup completed successfully!');
    console.log('Assignment tables have been reset.');
    
    if (Array.isArray(results) && results.length > 0 && results[results.length - 1][0]) {
      console.log(results[results.length - 1][0].Result);
    }
    
    return true;
  } catch (error) {
    console.error('Error cleaning assignment data:', error);
    return false;
  } finally {
    // Close the connection
    await connection.end();
    console.log('Database connection closed.');
  }
}

// Run the cleanup if script is executed directly
if (require.main === module) {
  cleanAssignmentData()
    .then(success => {
      if (success) {
        console.log('Assignment data cleanup completed successfully.');
        process.exit(0);
      } else {
        console.error('Assignment data cleanup failed.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during cleanup:', err);
      process.exit(1);
    });
}

module.exports = { cleanAssignmentData }; 