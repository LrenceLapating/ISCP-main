/**
 * userRoutes.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 22, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: User management routes for handling user profiles,
 * preferences, and account settings.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get the current user's profile settings
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT us.*, u.email, u.campus, u.id as student_id 
      FROM user_settings us
      JOIN users u ON us.user_id = u.id
      WHERE us.user_id = ?
    `;
    
    const [results] = await pool.query(query, [req.user.id]);
    
    if (results.length === 0) {
      // Create default settings if they don't exist
      const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      
      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const fullName = user[0].full_name.split(' ');
      const firstName = fullName[0];
      const lastName = fullName.slice(1).join(' ');
      
      const insertQuery = `
        INSERT INTO user_settings 
        (user_id, first_name, last_name)
        VALUES (?, ?, ?)
      `;
      
      await pool.query(insertQuery, [req.user.id, firstName, lastName]);
      
      // Get the newly created settings
      const [newSettings] = await pool.query(query, [req.user.id]);
      
      return res.json({
        ...newSettings[0],
        email: user[0].email,
        campus: user[0].campus
      });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile settings
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      theme,
      language,
      emailNotifications,
      pushNotifications,
      assignmentNotifications,
      messageNotifications,
      announcementNotifications,
      profileVisibility,
      showOnlineStatus,
      showLastSeen
    } = req.body;
    
    // Check if settings exist
    const [exists] = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    
    let query;
    let params;
    
    if (exists.length === 0) {
      // Create new settings
      query = `
        INSERT INTO user_settings (
          user_id, first_name, last_name, phone, 
          theme, language, 
          email_notifications, push_notifications,
          assignment_notifications, message_notifications, announcement_notifications,
          profile_visibility, show_online_status, show_last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      params = [
        req.user.id, firstName, lastName, phone,
        theme, language,
        emailNotifications, pushNotifications,
        assignmentNotifications, messageNotifications, announcementNotifications,
        profileVisibility, showOnlineStatus, showLastSeen
      ];
    } else {
      // Update existing settings
      query = `
        UPDATE user_settings SET
          first_name = ?,
          last_name = ?,
          phone = ?,
          theme = ?,
          language = ?,
          email_notifications = ?,
          push_notifications = ?,
          assignment_notifications = ?,
          message_notifications = ?,
          announcement_notifications = ?,
          profile_visibility = ?,
          show_online_status = ?,
          show_last_seen = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      
      params = [
        firstName, lastName, phone,
        theme, language,
        emailNotifications, pushNotifications,
        assignmentNotifications, messageNotifications, announcementNotifications,
        profileVisibility, showOnlineStatus, showLastSeen,
        req.user.id
      ];
    }
    
    await pool.query(query, params);
    
    // Update full_name in users table
    await pool.query(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [`${firstName} ${lastName}`, req.user.id]
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/profile-picture', verifyToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileName = req.file.filename;
    const filePath = `/uploads/profiles/${fileName}`;
    
    // Update profile_picture in user_settings
    await pool.query(
      'UPDATE user_settings SET profile_picture = ? WHERE user_id = ?',
      [filePath, req.user.id]
    );
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      profilePicture: filePath
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Verify current password
    const [user] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 