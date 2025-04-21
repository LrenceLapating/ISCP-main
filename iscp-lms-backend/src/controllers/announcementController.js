/**
 * announcementController.js
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: April 9, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Announcement controller managing system-wide announcements,
 * notifications, and targeted announcements for specific user groups.
 */

const { pool } = require('../config/db');
const notificationHelpers = require('../utils/notificationHelpers');

/**
 * Get all announcements
 */
const getAllAnnouncements = async (req, res) => {
  try {
    const [announcements] = await pool.query(`
      SELECT a.*, u.full_name as author_name, u.profile_image as author_image 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.id DESC
    `);
    
    console.log('Raw announcements from DB:', announcements);
    
    // Format the announcements to ensure target is properly set
    const formattedAnnouncements = announcements.map(a => ({
      ...a,
      target: a.target || 'all'
    }));
    
    res.status(200).json(formattedAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
};

/**
 * Get announcement by ID
 */
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [announcement] = await pool.query(`
      SELECT a.*, u.full_name as author_name, u.profile_image as author_image 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `, [id]);
    
    if (announcement.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.status(200).json(announcement[0]);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Server error while fetching announcement' });
  }
};

/**
 * Create a new announcement
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, target = 'all', campus = 'All Campuses' } = req.body;
    const authorId = req.user.id;
    
    // Debug info
    console.log('Creating announcement with data:', {
      title,
      content,
      target,
      campus,
      authorId
    });
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Ensure target is a valid value
    const validTargets = ['all', 'students', 'teachers', 'admins'];
    const normalizedTarget = target && validTargets.includes(target) ? target : 'all';
    
    // Insert announcement
    const [result] = await pool.query(
      'INSERT INTO announcements (author_id, title, content, target, campus) VALUES (?, ?, ?, ?, ?)',
      [authorId, title, content, normalizedTarget, campus]
    );
    
    const announcementId = result.insertId;
    
    // Get the created announcement with author details
    const [announcement] = await pool.query(`
      SELECT a.*, u.full_name as author_name, u.profile_image as author_image 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `, [announcementId]);
    
    console.log('Created announcement from DB:', announcement[0]);
    
    // Send notifications to users based on target
    await sendAnnouncementNotifications(
      announcementId, 
      title, 
      normalizedTarget, 
      campus,
      req.user.id,
      req.user.fullName || 'Administrator'
    );
    
    res.status(201).json(announcement[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error while creating announcement' });
  }
};

/**
 * Update an announcement
 */
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, target, campus } = req.body;
    
    // More detailed debugging to see exactly what's being received
    console.log('Raw update request body:', req.body);
    console.log('Target value from request:', target);
    console.log('Target type:', typeof target);
    
    // Validate required fields
    if (!title && !content) {
      return res.status(400).json({ message: 'Title or content is required' });
    }
    
    // Check if announcement exists
    const [announcements] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    console.log('Existing announcement from DB:', announcements[0]);
    
    // Ensure target is a valid value if provided
    const validTargets = ['all', 'students', 'teachers', 'admins'];
    
    // Get and debug target values
    let normalizedTarget = 'all';
    
    // Check if target exists and is valid
    if (target !== undefined && target !== null) {
      const targetStr = String(target).toLowerCase();
      console.log('Target after conversion to string:', targetStr);
      
      if (validTargets.includes(targetStr)) {
        normalizedTarget = targetStr;
        console.log('Target is valid, using:', normalizedTarget);
      } else {
        console.log('Target is invalid, using existing target:', announcements[0].target);
        normalizedTarget = announcements[0].target || 'all';
      }
    } else {
      // No target provided, use existing
      console.log('No target provided, using existing target:', announcements[0].target);
      normalizedTarget = announcements[0].target || 'all';
    }
    
    // Prepare update query
    let updateQuery = 'UPDATE announcements SET ';
    const updateValues = [];
    
    if (title) {
      updateQuery += 'title = ?, ';
      updateValues.push(title);
    }
    
    if (content) {
      updateQuery += 'content = ?, ';
      updateValues.push(content);
    }
    
    // Always include target in the update query, even if it wasn't changed
    // This ensures the target value is always properly saved
    updateQuery += 'target = ?, ';
    updateValues.push(normalizedTarget);
    
    if (campus) {
      updateQuery += 'campus = ?, ';
      updateValues.push(campus);
    }
    
    // Add updated_at and WHERE clause
    updateQuery = updateQuery.slice(0, -2); // Remove last ', '
    updateQuery += ' WHERE id = ?';
    updateValues.push(id);
    
    // Update announcement
    console.log('Executing update query:', updateQuery);
    console.log('Update values:', updateValues);
    await pool.query(updateQuery, updateValues);
    
    // Get the updated announcement
    const [updatedAnnouncement] = await pool.query(`
      SELECT a.*, u.full_name as author_name, u.profile_image as author_image 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `, [id]);
    
    if (updatedAnnouncement.length === 0) {
      return res.status(404).json({ message: 'Updated announcement not found' });
    }
    
    // Send notifications about the update
    await sendAnnouncementNotifications(
      parseInt(id),
      updatedAnnouncement[0].title, 
      updatedAnnouncement[0].target, 
      updatedAnnouncement[0].campus,
      req.user.id,
      req.user.fullName || 'Administrator',
      true // isUpdate = true
    );
    
    res.status(200).json(updatedAnnouncement[0]);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
};

/**
 * Delete an announcement
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if announcement exists
    const [announcements] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Delete announcement
    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
};

/**
 * Helper function to send notifications for a new or updated announcement
 */
const sendAnnouncementNotifications = async (
  announcementId, 
  title, 
  target = 'all', 
  campus = 'All Campuses',
  authorId,
  authorName,
  isUpdate = false
) => {
  try {
    let userQuery = 'SELECT id, role FROM users WHERE 1=1';
    const queryParams = [];
    
    // Filter by target audience
    if (target === 'students') {
      userQuery += ' AND role = "student"';
    } else if (target === 'teachers') {
      userQuery += ' AND role = "teacher"';
    } else if (target === 'admins') {
      userQuery += ' AND role = "admin"';
    }
    
    // Filter by campus (if not 'All Campuses')
    if (campus !== 'All Campuses') {
      userQuery += ' AND campus = ?';
      queryParams.push(campus);
    }
    
    // Don't send notifications to the author
    userQuery += ' AND id != ?';
    queryParams.push(authorId);
    
    const [users] = await pool.query(userQuery, queryParams);
    
    // Create notification message
    const actionText = isUpdate ? "updated an" : "posted a new";
    const message = `${authorName} ${actionText} announcement: ${title}`;
    const notificationTitle = isUpdate ? 'Announcement Update' : 'New Announcement';
    
    // Send notifications
    for (const user of users) {
      await notificationHelpers.createNotification(
        user.id,
        notificationTitle,
        message,
        'announcement',
        announcementId
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error sending announcement notifications:', error);
    return false;
  }
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
}; 