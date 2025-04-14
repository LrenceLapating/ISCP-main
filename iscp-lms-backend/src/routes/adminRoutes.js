/**
 * adminRoutes.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 21, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator routes for user management, dashboard
 * statistics, system settings, and administrative operations.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const notificationHelpers = require('../utils/notificationHelpers');
const announcementController = require('../controllers/announcementController');
const adminController = require('../controllers/adminController');

// Get all approved courses
router.get('/courses/approved', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('Admin requesting approved courses');
    const query = `
      SELECT c.*, u.full_name as instructor 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id
      WHERE (c.request_status = 'approved' OR c.request_status IS NULL)
      AND c.request_status != 'pending'  
      ORDER BY c.created_at DESC
    `;
    
    const [approvedCourses] = await pool.query(query);
    
    // Transform data to match frontend format
    const transformedCourses = approvedCourses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name,
      department: course.department,
      campus: course.campus,
      instructor: course.instructor,
      status: course.status,
      request_status: course.request_status || 'approved',
      request_notes: course.request_notes,
      description: course.request_notes || course.department,
      credits: course.credit_hours,
      teacherId: course.instructor_id,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching approved courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending course requests
router.get('/courses/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.full_name as instructor 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id
      WHERE c.request_status = 'pending'
      ORDER BY c.created_at DESC
    `;
    
    const [pendingCourses] = await pool.query(query);
    
    // Transform data to match frontend format
    const transformedCourses = pendingCourses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name,
      department: course.department,
      campus: course.campus,
      instructor: course.instructor,
      status: course.status,
      request_status: course.request_status,
      request_notes: course.request_notes,
      description: course.request_notes,
      credits: course.credit_hours,
      teacherId: course.instructor_id,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching pending course requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course request status (approve/reject)
router.patch('/courses/:courseId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { request_status, request_notes } = req.body;
    
    if (!request_status || !['approved', 'rejected', 'pending', 'active', 'inactive'].includes(request_status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Check if course exists
    const [courseCheck] = await pool.query(
      'SELECT c.*, u.full_name as instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
      [courseId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // If we're setting active/inactive directly (not an approval/rejection)
    if (request_status === 'active' || request_status === 'inactive') {
      await pool.query(
        'UPDATE courses SET status = ? WHERE id = ?',
        [request_status, courseId]
      );
    } else {
      // For approve/reject, update the course status
      const newStatus = request_status === 'approved' ? 'active' : 'inactive';
      
      const query = `
        UPDATE courses
        SET request_status = ?, 
            request_notes = ?,
            status = ?
        WHERE id = ?
      `;
      
      await pool.query(query, [
        request_status,
        request_notes || courseCheck[0].request_notes,
        newStatus,
        courseId
      ]);
      
      // If approved, notify students in the same campus
      if (request_status === 'approved') {
        // Get all students in the same campus as the course
        const [students] = await pool.query(
          'SELECT id FROM users WHERE role = "student" AND campus = ?',
          [courseCheck[0].campus]
        );
        
        // Send notifications to all eligible students
        for (const student of students) {
          await notificationHelpers.notifyCourseAvailable(
            student.id,
            courseId,
            courseCheck[0].name || courseCheck[0].title,
            courseCheck[0].instructor_name
          );
        }
      }
      
      // If rejected, notify the instructor
      if (request_status === 'rejected') {
        console.log(`Course ${courseId} rejected. Notifying instructor ${courseCheck[0].instructor_id}`);
        // Notification logic for instructor would go here
      }
    }
    
    // Get the updated course
    const [updatedCourse] = await pool.query(
      'SELECT c.*, u.full_name as instructor FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
      [courseId]
    );
    
    if (updatedCourse.length === 0) {
      return res.status(500).json({ message: 'Error retrieving updated course' });
    }
    
    res.json(updatedCourse[0]);
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course
router.delete('/courses/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log(`Admin deleting course with ID: ${courseId}`);
    
    // Check if course exists
    const [courseCheck] = await pool.query(
      'SELECT id, name FROM courses WHERE id = ?',
      [courseId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete related data first due to foreign key constraints
    console.log(`Deleting related data for course ${courseId}`);
    
    // Delete course enrollments
    await pool.query('DELETE FROM course_enrollments WHERE course_id = ?', [courseId]);
    
    // Delete course materials
    await pool.query('DELETE FROM course_materials WHERE course_id = ?', [courseId]);
    
    // Delete assignments and submissions
    const [assignments] = await pool.query('SELECT id FROM assignments WHERE course_id = ?', [courseId]);
    for (const assignment of assignments) {
      await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = ?', [assignment.id]);
    }
    await pool.query('DELETE FROM assignments WHERE course_id = ?', [courseId]);
    
    // Delete class sessions
    await pool.query('DELETE FROM class_sessions WHERE course_id = ?', [courseId]);
    
    // Delete discussions and replies
    const [discussions] = await pool.query('SELECT id FROM discussions WHERE course_id = ?', [courseId]);
    for (const discussion of discussions) {
      await pool.query('DELETE FROM discussion_replies WHERE discussion_id = ?', [discussion.id]);
    }
    await pool.query('DELETE FROM discussions WHERE course_id = ?', [courseId]);
    
    // Delete grades
    await pool.query('DELETE FROM grades WHERE course_id = ?', [courseId]);
    
    // Delete course progress records
    await pool.query('DELETE FROM course_progress WHERE course_id = ?', [courseId]);
    
    // Delete attendance records
    await pool.query('DELETE FROM attendance WHERE course_id = ?', [courseId]);
    
    // Finally, delete the course
    await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);
    
    console.log(`Successfully deleted course ${courseId} (${courseCheck[0].name})`);
    res.json({ message: 'Course successfully deleted', courseId });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      message: 'Failed to delete course', 
      error: error.message 
    });
  }
});

// Create new course
router.post('/courses', verifyToken, isAdmin, async (req, res) => {
  try {
    const { 
      code, 
      title, 
      department, 
      campus, 
      instructor, 
      status, 
      description, 
      credits,
      teacherId,
      maxStudents
    } = req.body;
    
    // Validate required fields
    if (!code || !title || !department || !campus) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if course code already exists
    const [existingCourse] = await pool.query(
      'SELECT * FROM courses WHERE code = ?',
      [code]
    );
    
    if (existingCourse.length > 0) {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    
    // Find instructor ID by name if provided and not teacherId
    let instructorId = teacherId;
    if (!instructorId && instructor) {
      const [instructorData] = await pool.query(
        'SELECT id FROM users WHERE full_name = ? AND role = "teacher"',
        [instructor]
      );
      
      if (instructorData.length > 0) {
        instructorId = instructorData[0].id;
      } else {
        return res.status(404).json({ message: 'Instructor not found' });
      }
    }
    
    // Insert course
    const insertQuery = `
      INSERT INTO courses (
        code, name, department, campus, instructor_id, status, request_notes, credit_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(insertQuery, [
      code,
      title,
      department,
      campus,
      instructorId,
      status || 'active',
      description || null,
      credits || 3
    ]);
    
    // Get the created course
    const [newCourse] = await pool.query(
      'SELECT c.*, u.full_name as instructor FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
      [result.insertId]
    );
    
    // Transform to match frontend format
    const transformedCourse = {
      id: newCourse[0].id,
      code: newCourse[0].code,
      title: newCourse[0].name,
      department: newCourse[0].department,
      campus: newCourse[0].campus,
      instructor: newCourse[0].instructor,
      status: newCourse[0].status,
      request_status: newCourse[0].request_status || 'approved',
      request_notes: newCourse[0].request_notes,
      description: newCourse[0].request_notes,
      credits: newCourse[0].credit_hours,
      teacherId: newCourse[0].instructor_id,
      maxStudents: maxStudents || 30,
      createdAt: newCourse[0].created_at,
      updatedAt: newCourse[0].updated_at
    };
    
    res.status(201).json(transformedCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course
router.put('/courses/:courseId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      code, 
      title, 
      department, 
      campus, 
      instructor,
      status, 
      description, 
      credits,
      teacherId,
      maxStudents 
    } = req.body;
    
    console.log(`Admin updating course with ID: ${courseId}`);
    
    // Validate course exists
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // If code is changing, check it's not a duplicate
    if (code && code !== courseCheck[0].code) {
      const [existingCourse] = await pool.query(
        'SELECT * FROM courses WHERE code = ? AND id != ?',
        [code, courseId]
      );
      
      if (existingCourse.length > 0) {
        return res.status(409).json({ message: 'Course code already exists' });
      }
    }
    
    // Find instructor ID by name if provided and not teacherId
    let instructorId = teacherId;
    if (!instructorId && instructor) {
      const [instructorData] = await pool.query(
        'SELECT id FROM users WHERE full_name = ? AND role = "teacher"',
        [instructor]
      );
      
      if (instructorData.length > 0) {
        instructorId = instructorData[0].id;
      } else {
        return res.status(404).json({ message: 'Instructor not found' });
      }
    }
    
    // Update course
    const updateQuery = `
      UPDATE courses SET
        code = ?,
        name = ?,
        department = ?,
        campus = ?,
        instructor_id = ?,
        status = ?,
        request_notes = ?,
        credit_hours = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await pool.query(updateQuery, [
      code || courseCheck[0].code,
      title || courseCheck[0].name,
      department || courseCheck[0].department,
      campus || courseCheck[0].campus,
      instructorId || courseCheck[0].instructor_id,
      status || courseCheck[0].status,
      description || courseCheck[0].request_notes,
      credits || courseCheck[0].credit_hours,
      courseId
    ]);
    
    // Get the updated course
    const [updatedCourse] = await pool.query(
      'SELECT c.*, u.full_name as instructor FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
      [courseId]
    );
    
    // Transform to match frontend format
    const transformedCourse = {
      id: updatedCourse[0].id,
      code: updatedCourse[0].code,
      title: updatedCourse[0].name,
      department: updatedCourse[0].department,
      campus: updatedCourse[0].campus,
      instructor: updatedCourse[0].instructor,
      status: updatedCourse[0].status,
      request_status: updatedCourse[0].request_status || 'approved',
      request_notes: updatedCourse[0].request_notes,
      description: updatedCourse[0].request_notes,
      credits: updatedCourse[0].credit_hours,
      teacherId: updatedCourse[0].instructor_id,
      maxStudents: maxStudents || 30,
      createdAt: updatedCourse[0].created_at,
      updatedAt: updatedCourse[0].updated_at
    };
    
    res.json(transformedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all courses
router.get('/courses', verifyToken, isAdmin, adminController.getCourses);

// Update course request status
router.patch('/courses/:id/request-status', verifyToken, isAdmin, adminController.updateCourseRequestStatus);

// User Management
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
router.post('/users', verifyToken, isAdmin, adminController.createUser);
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);
router.patch('/users/:id/status', verifyToken, isAdmin, adminController.updateUserStatus);

// Announcement Management
router.get('/announcements', verifyToken, isAdmin, announcementController.getAllAnnouncements);
router.get('/announcements/:id', verifyToken, isAdmin, announcementController.getAnnouncementById);
router.post('/announcements', verifyToken, isAdmin, announcementController.createAnnouncement);
router.put('/announcements/:id', verifyToken, isAdmin, announcementController.updateAnnouncement);
router.delete('/announcements/:id', verifyToken, isAdmin, announcementController.deleteAnnouncement);

// Debug route to check announcements table schema
router.get('/debug/announcements-schema', verifyToken, isAdmin, async (req, res) => {
  try {
    const [columns] = await pool.query(`
      SHOW COLUMNS FROM announcements
    `);
    
    // Also get a sample of data
    const [sampleData] = await pool.query(`
      SELECT * FROM announcements LIMIT 5
    `);
    
    res.status(200).json({
      schema: columns,
      sample: sampleData
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ message: 'Error fetching schema' });
  }
});

// Debug route to fix announcement targets
router.get('/debug/fix-announcement/:id/:target', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id, target } = req.params;
    
    // Get the announcement before update
    const [beforeUpdate] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    
    if (beforeUpdate.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    console.log('Announcement before update:', beforeUpdate[0]);
    
    // Try direct update with a prepared statement
    const updateResult = await pool.query(
      'UPDATE announcements SET target = ? WHERE id = ?',
      [target, id]
    );
    
    console.log('Update result:', updateResult);
    
    // Get the announcement after update to verify
    const [afterUpdate] = await pool.query('SELECT * FROM announcements WHERE id = ?', [id]);
    
    if (afterUpdate.length === 0) {
      return res.status(404).json({ message: 'Announcement not found after update' });
    }
    
    console.log('Announcement after update:', afterUpdate[0]);
    
    // Get database schema
    const [columns] = await pool.query('SHOW COLUMNS FROM announcements');
    
    res.status(200).json({
      before: beforeUpdate[0],
      updateResult,
      after: afterUpdate[0],
      schema: columns.find(col => col.Field === 'target')
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ message: 'Error in debug operation', error: error.message });
  }
});

// Get notifications for admin
router.get('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get admin notifications
    const query = `
      SELECT n.* 
      FROM notifications n
      WHERE n.user_id = ? 
      ORDER BY n.created_at DESC 
      LIMIT 15
    `;
    
    const [notifications] = await pool.query(query, [adminId]);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for admin
router.delete('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Delete all notifications for this admin
    await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [adminId]
    );
    
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/notifications/count', verifyToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = false
    `;
    
    const [result] = await pool.query(query, [adminId]);
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/notifications/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    
    // Verify the notification belongs to the admin
    const [notificationCheck] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, adminId]
    );
    
    if (notificationCheck.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/notifications', verifyToken, isAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [adminId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin Dashboard Stats
router.get('/dashboard/stats', verifyToken, isAdmin, adminController.getDashboardStats);

module.exports = router; 