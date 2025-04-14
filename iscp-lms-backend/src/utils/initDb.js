/**
 * initDb.js
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: May 16, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Database initialization script creating schema,
 * tables, indexes, and initial system configuration.
 */

const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const createTables = async () => {
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('student', 'teacher', 'admin') NOT NULL,
        campus VARCHAR(50) NOT NULL,
        profile_image VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create courses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        teacher_id INT,
        credits INT NOT NULL DEFAULT 3,
        max_students INT NOT NULL DEFAULT 30,
        campus VARCHAR(50) NOT NULL,
        status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Create course_enrollments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
        progress DECIMAL(5,2) DEFAULT 0.00,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, course_id)
      )
    `);
    
    // Create class_sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS class_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        location VARCHAR(100),
        meeting_link VARCHAR(255),
        status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);
    
    // Create assignments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        instructor_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        instructions TEXT,
        due_date DATETIME NOT NULL,
        points INT NOT NULL,
        max_attempts INT DEFAULT 1,
        allow_late_submission BOOLEAN DEFAULT FALSE,
        visibility ENUM('draft', 'published') DEFAULT 'published',
        attachment_url VARCHAR(255),
        attachment_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create assignment_submissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        student_id INT NOT NULL,
        attempt_number INT DEFAULT 1,
        submission_text TEXT,
        file_url VARCHAR(255),
        file_type VARCHAR(50),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade DECIMAL(5,2),
        feedback TEXT,
        graded_at DATETIME,
        graded_by INT,
        status ENUM('draft', 'submitted', 'late', 'graded', 'resubmitted') DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_submission_attempt (assignment_id, student_id, attempt_number)
      )
    `);
    
    // Create announcements table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        target VARCHAR(20) DEFAULT 'all',
        campus VARCHAR(50) DEFAULT 'All Campuses',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create messages table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create discussions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS discussions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create discussion_replies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS discussion_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discussion_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create archives table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS archives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        size INT NOT NULL,
        uploaded_by INT NOT NULL,
        campus VARCHAR(50) DEFAULT 'All Campuses',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create grades table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        assignment_id INT,
        grade_type ENUM('assignment', 'midterm', 'final', 'overall') NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        max_score DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL
      )
    `);
    
    // Create user_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        phone VARCHAR(20),
        profile_picture VARCHAR(255),
        theme ENUM('light', 'dark', 'system') DEFAULT 'dark',
        language VARCHAR(20) DEFAULT 'English',
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT FALSE,
        assignment_notifications BOOLEAN DEFAULT TRUE,
        message_notifications BOOLEAN DEFAULT TRUE,
        announcement_notifications BOOLEAN DEFAULT TRUE,
        profile_visibility ENUM('public', 'private', 'contacts') DEFAULT 'public',
        show_online_status BOOLEAN DEFAULT TRUE,
        show_last_seen BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        related_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Commit transaction
    await connection.commit();
    
    console.log('Database tables created successfully');
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Failed to create tables:', error);
    throw error;
  } finally {
    connection.release();
  }
};

const seedAdminUser = async () => {
  try {
    // Check if admin user already exists
    const [adminCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', ['admin@iscp.edu.ph', 'admin']);
    
    if (adminCheck.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const [result] = await pool.query(
        'INSERT INTO users (email, password, full_name, role, campus) VALUES (?, ?, ?, ?, ?)',
        ['admin@iscp.edu.ph', hashedPassword, 'Admin User', 'admin', 'All Campuses']
      );
      
      // Create default settings for admin user
      if (result.insertId) {
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [result.insertId, 'Admin', 'User']
        );
      }
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
      
      // Check if settings exist for admin user
      const adminId = adminCheck[0].id;
      const [settingsCheck] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [adminId]);
      
      if (settingsCheck.length === 0) {
        // Create default settings
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [adminId, 'Admin', 'User']
        );
        console.log('Admin user settings created');
      }
    }
    
    // Do the same for demo teacher and student
    await seedDemoUsers();
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    throw error;
  }
};

const seedDemoUsers = async () => {
  try {
    // Create teacher if not exists
    const [teacherCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', ['teacher@iscp.edu.ph', 'teacher']);
    
    if (teacherCheck.length === 0) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      const [result] = await pool.query(
        'INSERT INTO users (email, password, full_name, role, campus) VALUES (?, ?, ?, ?, ?)',
        ['teacher@iscp.edu.ph', hashedPassword, 'Teacher User', 'teacher', 'Main Campus']
      );
      
      if (result.insertId) {
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [result.insertId, 'Teacher', 'User']
        );
      }
      
      console.log('Demo teacher created successfully');
    } else {
      // Check if settings exist
      const teacherId = teacherCheck[0].id;
      const [settingsCheck] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [teacherId]);
      
      if (settingsCheck.length === 0) {
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [teacherId, 'Teacher', 'User']
        );
      }
    }
    
    // Create student if not exists
    const [studentCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND role = ?', ['student@iscp.edu.ph', 'student']);
    
    if (studentCheck.length === 0) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      const [result] = await pool.query(
        'INSERT INTO users (email, password, full_name, role, campus) VALUES (?, ?, ?, ?, ?)',
        ['student@iscp.edu.ph', hashedPassword, 'Student User', 'student', 'Main Campus']
      );
      
      if (result.insertId) {
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [result.insertId, 'Student', 'User']
        );
      }
      
      console.log('Demo student created successfully');
    } else {
      // Check if settings exist
      const studentId = studentCheck[0].id;
      const [settingsCheck] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [studentId]);
      
      if (settingsCheck.length === 0) {
        await pool.query(
          'INSERT INTO user_settings (user_id, first_name, last_name) VALUES (?, ?, ?)',
          [studentId, 'Student', 'User']
        );
      }
    }
  } catch (error) {
    console.error('Failed to seed demo users:', error);
    throw error;
  }
};

const ensureAnnouncementsColumns = async () => {
  try {
    // Check if created_at column exists in announcements table
    const [columns] = await pool.query('SHOW COLUMNS FROM announcements LIKE ?', ['created_at']);
    if (columns.length === 0) {
      console.log('Adding created_at column to announcements table...');
      await pool.query('ALTER TABLE announcements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('created_at column added successfully');
    }
    
    // Check if updated_at column exists in announcements table
    const [updatedColumns] = await pool.query('SHOW COLUMNS FROM announcements LIKE ?', ['updated_at']);
    if (updatedColumns.length === 0) {
      console.log('Adding updated_at column to announcements table...');
      await pool.query('ALTER TABLE announcements ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
      console.log('updated_at column added successfully');
    }
  } catch (err) {
    console.error('Error checking/adding timestamp columns to announcements table:', err);
  }
};

const fixAnnouncementsTableSchema = async () => {
  const connection = await pool.getConnection();
  
  try {
    console.log('Fixing announcements table schema...');
    
    // Check current target column type
    const [columns] = await connection.query('SHOW COLUMNS FROM announcements WHERE Field = ?', ['target']);
    
    if (columns.length > 0) {
      console.log('Current target column definition:', columns[0]);
      
      // If the column exists, modify it to be VARCHAR instead of ENUM to avoid issues
      await connection.query(`
        ALTER TABLE announcements MODIFY COLUMN target VARCHAR(20) DEFAULT 'all'
      `);
      
      console.log('Updated target column to VARCHAR type');
      
      // Update any announcements with NULL target to 'all'
      await connection.query(`
        UPDATE announcements SET target = 'all' WHERE target IS NULL OR target = ''
      `);
      
      console.log('Fixed any NULL targets in announcements table');
    }
    
    console.log('Announcements table schema fixed successfully');
  } catch (error) {
    console.error('Error fixing announcements table schema:', error);
  } finally {
    connection.release();
  }
};

const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Create tables
    await createTables();
    
    // Add status column to users table if it doesn't exist
    try {
      const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE ?', ['status']);
      if (columns.length === 0) {
        console.log('Adding status column to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN status ENUM("active", "inactive") DEFAULT "active"');
        console.log('Status column added successfully');
      }
    } catch (err) {
      console.error('Error checking/adding status column:', err);
    }
    
    // Ensure announcements table has timestamp columns
    await ensureAnnouncementsColumns();
    
    // Fix announcements table schema - target column
    await fixAnnouncementsTableSchema();
    
    // Seed admin user if not exists
    await seedAdminUser();
    
    // Create course_materials table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        file_url VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        uploaded_by INT NOT NULL,
        type VARCHAR(50) DEFAULT 'document',
        url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add attendance table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (course_id, student_id, date)
      )
    `);

    // Add course_progress table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        student_id INT NOT NULL,
        modules_completed INT NOT NULL DEFAULT 0,
        total_modules INT NOT NULL DEFAULT 0,
        progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_progress (course_id, student_id)
      )
    `);
    
    // Seed demo users for development
    if (process.env.NODE_ENV === 'development') {
      await seedDemoUsers();
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

module.exports = { initDatabase }; 