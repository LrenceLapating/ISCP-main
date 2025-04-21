/**
 * adminController.js
 * 
 * Author: Marc Laurence Lapating
 * Date: April 9, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator controller handling user management, dashboard
 * statistics, system settings, and administrative operations.
 */

const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const notificationHelpers = require('../utils/notificationHelpers');

// Get all users (for admin dashboard)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, campus, status, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard stats (for admin dashboard)
exports.getDashboardStats = async (req, res) => {
  try {
    // Get user counts by role
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty"');
    const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const [activeUsers] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    
    // Get course counts
    const [activeCourses] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "active"');
    const [pendingRequests] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE request_status = "pending"');
    
    // Get announcement count
    const [totalAnnouncements] = await pool.query('SELECT COUNT(*) as count FROM announcements');
    
    // Get unread notifications count for admin users
    const [unreadNotifications] = await pool.query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE recipient_role = "admin" AND read_status = 0
    `);
    
    // Get courses by department
    const [coursesByDepartment] = await pool.query(`
      SELECT department, COUNT(*) as count 
      FROM courses 
      GROUP BY department
    `);
    
    // Format department data
    const departmentStats = {};
    coursesByDepartment.forEach(item => {
      departmentStats[item.department || 'Uncategorized'] = item.count;
    });
    
    // Get courses by status
    const [coursesByStatus] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM courses 
      WHERE status IN ('active', 'inactive')
      GROUP BY status
    `);
    
    // Format status data
    const statusStats = {
      active: 0,
      inactive: 0
    };
    coursesByStatus.forEach(item => {
      statusStats[item.status] = item.count;
    });
    
    // Get recent users (last 5 registered)
    const [recentUsers] = await pool.query(`
      SELECT id, full_name as fullName, email, role, campus, created_at as createdAt
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    // Get recent courses (last 5 created)
    const [recentCourses] = await pool.query(`
      SELECT c.id, c.code, c.name as title, c.department, c.campus, u.full_name as instructor, c.created_at as createdAt
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    // Mock some system metrics (these would typically come from system monitoring)
    const storageUsed = '28.4 GB';
    const serverLoad = '32%';
    const averageResponseTime = '86ms';
    
    res.json({
      activeUsers: activeUsers[0].count,
      activeCourses: activeCourses[0].count,
      totalAnnouncements: totalAnnouncements[0].count,
      pendingRequests: pendingRequests[0].count,
      unreadNotifications: unreadNotifications[0].count,
      usersByRole: {
        students: studentCount[0].count,
        teachers: facultyCount[0].count,
        admins: adminCount[0].count,
      },
      coursesByDepartment: departmentStats,
      coursesByStatus: statusStats,
      storageUsed,
      serverLoad,
      averageResponseTime,
      recentUsers,
      recentCourses
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user stats (for admin dashboard)
exports.getUserStats = async (req, res) => {
  try {
    // Get counts for different user types
    const [studentCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty"');
    const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    
    // Get count of active users
    const [activeCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE status = "active"');
    
    // Get count of courses
    const [courseCount] = await pool.query('SELECT COUNT(*) as count FROM courses');
    
    // Get count of active courses
    const [activeCourseCount] = await pool.query('SELECT COUNT(*) as count FROM courses WHERE status = "active"');
    
    res.json({
      totalUsers: studentCount[0].count + facultyCount[0].count + adminCount[0].count,
      students: studentCount[0].count,
      faculty: facultyCount[0].count,
      admins: adminCount[0].count,
      activeUsers: activeCount[0].count,
      totalCourses: courseCount[0].count,
      activeCourses: activeCourseCount[0].count
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new user (admin functionality)
exports.createUser = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      role, 
      campus,
      department,
      studentId,
      position
    } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !password || !role || !campus) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const [result] = await pool.query(
      `INSERT INTO users (
        full_name, 
        email, 
        password, 
        role, 
        campus, 
        department, 
        student_id, 
        position, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName, 
        email, 
        hashedPassword, 
        role, 
        campus, 
        department || null, 
        studentId || null, 
        position || null, 
        'active'
      ]
    );
    
    // Create user settings entry
    await pool.query(
      `INSERT INTO user_settings (
        user_id, 
        language, 
        theme, 
        email_notifications, 
        push_notifications, 
        profile_visibility
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        result.insertId,
        'English',
        'dark',
        true,
        true,
        'public'
      ]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user (admin functionality)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fullName, 
      email, 
      role, 
      campus,
      status
    } = req.body;
    
    console.log('Updating user with data:', req.body);
    
    // Check if user exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user with only the fields that exist in the database
    await pool.query(
      `UPDATE users SET 
        full_name = ?, 
        email = ?, 
        role = ?, 
        campus = ?, 
        status = ?, 
        updated_at = NOW()
      WHERE id = ?`,
      [
        fullName || existingUser[0].full_name, 
        email || existingUser[0].email, 
        role || existingUser[0].role, 
        campus || existingUser[0].campus, 
        status || existingUser[0].status,
        id
      ]
    );
    
    // Get updated user data to return to client
    const [updatedUser] = await pool.query(
      `SELECT id, full_name as fullName, email, role, campus, status 
       FROM users 
       WHERE id = ?`,
      [id]
    );
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user (admin functionality)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user's related data (you might want to archive instead)
    // This would involve deleting from multiple tables based on your schema
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// System dashboard stats
exports.getSystemStats = async (req, res) => {
  try {
    // Get total storage used (if applicable to your system)
    const [storageResult] = await pool.query(
      'SELECT SUM(file_size) as total_storage FROM course_materials'
    );
    
    // Get system activity (logins in last 24 hours)
    const [activityResult] = await pool.query(
      'SELECT COUNT(*) as count FROM login_history WHERE login_time > DATE_SUB(NOW(), INTERVAL 1 DAY)'
    );
    
    // Get total API requests in last 24 hours (if you're tracking this)
    const [apiResult] = await pool.query(
      'SELECT COUNT(*) as count FROM api_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY)'
    );
    
    res.json({
      storageUsed: storageResult[0].total_storage || 0,
      activeUsers24h: activityResult[0].count || 0,
      apiRequests24h: apiResult[0].count || 0
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users
exports.getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name as fullName, u.email, u.role, u.campus, u.status, 
      COALESCE(us.profile_picture, u.profile_image) as profileImage
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      ORDER BY u.full_name`
    );
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    
    res.json({ 
      message: `User status updated to ${status}`,
      userId: parseInt(id),
      status
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.*, u.full_name as instructor
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`
    );
    
    // Transform for frontend format
    const transformedCourses = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name,
      department: course.department,
      campus: course.campus,
      instructor: course.instructor,
      status: course.status,
      request_status: course.request_status || 'approved',
      description: course.request_notes || course.department,
      credits: course.credit_hours,
      teacherId: course.instructor_id,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create course
exports.createCourse = async (req, res) => {
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
    
    // Check for duplicate code
    const [existingCourse] = await pool.query(
      'SELECT * FROM courses WHERE code = ?', 
      [code]
    );
    
    if (existingCourse.length > 0) {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    
    // Find instructor ID if only name provided
    let instructorId = teacherId;
    if (!instructorId && instructor) {
      const [instructorData] = await pool.query(
        'SELECT id FROM users WHERE full_name = ? AND role = "faculty"',
        [instructor]
      );
      
      if (instructorData.length > 0) {
        instructorId = instructorData[0].id;
      } else {
        return res.status(404).json({ message: 'Instructor not found' });
      }
    }
    
    // Insert course
    const [result] = await pool.query(
      `INSERT INTO courses (
        code, name, department, campus, instructor_id, 
        status, request_status, request_notes, credit_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        title,
        department,
        campus,
        instructorId,
        status || 'active',
        'approved',
        description || null,
        credits || 3
      ]
    );
    
    // Get created course
    const [newCourse] = await pool.query(
      `SELECT c.*, u.full_name as instructor
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    
    // Transform for frontend
    const transformedCourse = {
      id: newCourse[0].id,
      code: newCourse[0].code,
      title: newCourse[0].name,
      department: newCourse[0].department,
      campus: newCourse[0].campus,
      instructor: newCourse[0].instructor,
      status: newCourse[0].status,
      request_status: newCourse[0].request_status || 'approved',
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
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      title, 
      department, 
      campus, 
      instructor, 
      status, 
      description, 
      credits,
      teacherId
    } = req.body;
    
    // Verify course exists
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // If code is changing, check for duplicates
    if (code && code !== courseCheck[0].code) {
      const [existingCourse] = await pool.query(
        'SELECT * FROM courses WHERE code = ? AND id != ?',
        [code, id]
      );
      
      if (existingCourse.length > 0) {
        return res.status(409).json({ message: 'Course code already exists' });
      }
    }
    
    // Find instructor ID if only name provided
    let instructorId = teacherId;
    if (!instructorId && instructor) {
      const [instructorData] = await pool.query(
        'SELECT id FROM users WHERE full_name = ? AND role = "faculty"',
        [instructor]
      );
      
      if (instructorData.length > 0) {
        instructorId = instructorData[0].id;
      } else {
        return res.status(404).json({ message: 'Instructor not found' });
      }
    }
    
    // Update course
    await pool.query(
      `UPDATE courses SET
        code = ?,
        name = ?,
        department = ?,
        campus = ?,
        instructor_id = ?,
        status = ?,
        request_notes = ?,
        credit_hours = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        code || courseCheck[0].code,
        title || courseCheck[0].name,
        department || courseCheck[0].department,
        campus || courseCheck[0].campus,
        instructorId || courseCheck[0].instructor_id,
        status || courseCheck[0].status,
        description || courseCheck[0].request_notes,
        credits || courseCheck[0].credit_hours,
        id
      ]
    );
    
    // Get updated course
    const [updatedCourse] = await pool.query(
      `SELECT c.*, u.full_name as instructor
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    
    // Transform for frontend
    const transformedCourse = {
      id: updatedCourse[0].id,
      code: updatedCourse[0].code,
      title: updatedCourse[0].name,
      department: updatedCourse[0].department,
      campus: updatedCourse[0].campus,
      instructor: updatedCourse[0].instructor,
      status: updatedCourse[0].status,
      request_status: updatedCourse[0].request_status || 'approved',
      description: updatedCourse[0].request_notes,
      credits: updatedCourse[0].credit_hours,
      teacherId: updatedCourse[0].instructor_id,
      createdAt: updatedCourse[0].created_at,
      updatedAt: updatedCourse[0].updated_at
    };
    
    res.json(transformedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify course exists
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ?',
      [id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Delete related data (due to foreign key constraints)
    
    // Delete enrollments
    await pool.query('DELETE FROM course_enrollments WHERE course_id = ?', [id]);
    
    // Delete materials
    await pool.query('DELETE FROM course_materials WHERE course_id = ?', [id]);
    
    // Delete assignments and submissions
    const [assignments] = await pool.query('SELECT id FROM assignments WHERE course_id = ?', [id]);
    for (const assignment of assignments) {
      await pool.query('DELETE FROM assignment_submissions WHERE assignment_id = ?', [assignment.id]);
    }
    await pool.query('DELETE FROM assignments WHERE course_id = ?', [id]);
    
    // Delete the course
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Course deleted successfully',
      courseId: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get pending course requests
exports.getPendingCourseRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(
      `SELECT c.*, u.full_name as instructor
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.request_status = 'pending'
       ORDER BY c.created_at DESC`
    );
    
    // Transform for frontend
    const transformedRequests = requests.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name,
      department: course.department,
      campus: course.campus,
      instructor: course.instructor,
      status: course.status,
      request_status: course.request_status,
      description: course.request_notes,
      credits: course.credit_hours,
      teacherId: course.instructor_id,
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }));
    
    res.json(transformedRequests);
  } catch (error) {
    console.error('Error fetching pending course requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course status
exports.updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Update course status
    await pool.query(
      'UPDATE courses SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({
      message: `Course status updated to ${status}`,
      courseId: parseInt(id),
      status
    });
  } catch (error) {
    console.error('Error updating course status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course request status
exports.updateCourseRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { request_status, request_notes } = req.body;
    
    if (!request_status || !['approved', 'rejected', 'pending'].includes(request_status)) {
      return res.status(400).json({ message: 'Invalid request status' });
    }
    
    // Check if course exists
    const [courseCheck] = await pool.query(
      'SELECT c.*, u.full_name as instructor_name, u.id as faculty_id, c.code as course_code FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
      [id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update the status
    await pool.query(
      `UPDATE courses SET 
        request_status = ?, 
        request_notes = ?,
        status = ?
      WHERE id = ?`,
      [
        request_status,
        request_notes || courseCheck[0].request_notes,
        request_status === 'approved' ? 'active' : 'inactive',
        id
      ]
    );
    
    // If approved, notify faculty and students in the same campus
    if (request_status === 'approved') {
      // Notify the faculty member who requested the course
      await notificationHelpers.notifyCourseApproval(
        courseCheck[0].faculty_id,
        id,
        courseCheck[0].name,
        courseCheck[0].course_code
      );
    
      // Notify students in the same campus
      const [students] = await pool.query(
        'SELECT id FROM users WHERE role = "student" AND campus = ?',
        [courseCheck[0].campus]
      );
      
      for (const student of students) {
        // Notify each student about the new course
        await notificationHelpers.notifyCourseAvailable(
          student.id,
          id,
          courseCheck[0].name,
          courseCheck[0].instructor_name
        );
      }
    }
    
    // Get updated course
    const [updatedCourse] = await pool.query(
      `SELECT c.*, u.full_name as instructor
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );
    
    // Transform for frontend
    const transformedCourse = {
      id: updatedCourse[0].id,
      code: updatedCourse[0].code,
      title: updatedCourse[0].name,
      department: updatedCourse[0].department,
      campus: updatedCourse[0].campus,
      instructor: updatedCourse[0].instructor,
      status: updatedCourse[0].status,
      request_status: updatedCourse[0].request_status,
      description: updatedCourse[0].request_notes,
      credits: updatedCourse[0].credit_hours,
      teacherId: updatedCourse[0].instructor_id,
      createdAt: updatedCourse[0].created_at,
      updatedAt: updatedCourse[0].updated_at
    };
    
    res.json(transformedCourse);
  } catch (error) {
    console.error('Error updating course request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Announcement methods
// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const [announcements] = await pool.query(
      `SELECT a.*, u.full_name as author_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       ORDER BY a.created_at DESC`
    );
    
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get announcement by ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [announcements] = await pool.query(
      `SELECT a.*, u.full_name as author_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(announcements[0]);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, target, campus } = req.body;
    const authorId = req.user.id;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO announcements (author_id, title, content, target, campus)
       VALUES (?, ?, ?, ?, ?)`,
      [authorId, title, content, target || 'all', campus || 'All Campuses']
    );
    
    // Get created announcement
    const [newAnnouncement] = await pool.query(
      `SELECT a.*, u.full_name as author_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = ?`,
      [result.insertId]
    );
    
    // Notify applicable users
    const targetRole = target === 'all' ? null : target;
    const campusFilter = campus === 'All Campuses' ? null : campus;
    
    let userQuery = 'SELECT id FROM users WHERE 1=1';
    const queryParams = [];
    
    if (targetRole) {
      userQuery += ' AND role = ?';
      queryParams.push(targetRole);
    }
    
    if (campusFilter) {
      userQuery += ' AND campus = ?';
      queryParams.push(campusFilter);
    }
    
    const [users] = await pool.query(userQuery, queryParams);
    
    for (const user of users) {
      // Skip notifying the author
      if (user.id !== authorId) {
        await notificationHelpers.notifyAnnouncement(
          user.id,
          newAnnouncement[0].id,
          newAnnouncement[0].title
        );
      }
    }
    
    res.status(201).json(newAnnouncement[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, target, campus } = req.body;
    
    // Verify announcement exists
    const [announcementCheck] = await pool.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcementCheck.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Update announcement
    await pool.query(
      `UPDATE announcements SET
        title = ?,
        content = ?,
        target = ?,
        campus = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title || announcementCheck[0].title,
        content || announcementCheck[0].content,
        target || announcementCheck[0].target,
        campus || announcementCheck[0].campus,
        id
      ]
    );
    
    // Get updated announcement
    const [updatedAnnouncement] = await pool.query(
      `SELECT a.*, u.full_name as author_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       WHERE a.id = ?`,
      [id]
    );
    
    res.json(updatedAnnouncement[0]);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify announcement exists
    const [announcementCheck] = await pool.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcementCheck.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Delete related notifications
    await pool.query(
      'DELETE FROM notifications WHERE type = "announcement" AND related_id = ?',
      [id]
    );
    
    // Delete announcement
    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Announcement deleted successfully',
      announcementId: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 