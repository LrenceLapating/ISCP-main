/**
 * studentRoutes.js
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: May 19, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student routes for course enrollment, assignment submissions,
 * grade viewing, and student-specific functionality.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isStudent } = require('../middleware/auth');
const notificationHelpers = require('../utils/notificationHelpers');

// Get all approved courses available for enrollment
router.get('/courses/approved', verifyToken, isStudent, async (req, res) => {
  try {
    // First get the student's campus
    const [studentInfo] = await pool.query(
      'SELECT campus FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!studentInfo.length) {
      return res.status(404).json({ message: 'Student information not found' });
    }

    const studentCampus = studentInfo[0].campus;

    // Get all approved courses that:
    // 1. Student hasn't enrolled in yet
    // 2. Match their campus
    // 3. Are approved and active
    const query = `
      SELECT c.*, u.full_name as instructor 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id
      WHERE c.request_status = 'approved' 
      AND c.status = 'active'
      AND c.campus = ?
      AND c.id NOT IN (
        SELECT course_id FROM course_enrollments 
        WHERE student_id = ?
      )
      ORDER BY c.code
    `;
    
    const [approvedCourses] = await pool.query(query, [studentCampus, req.user.id]);
    
    // Transform data to match frontend format
    const transformedCourses = approvedCourses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name || course.title,
      description: course.description || course.request_notes || course.department,
      instructor: course.instructor,
      campus: course.campus,
      schedule: course.schedule || 'Schedule TBA',
      status: course.status,
      // Map credit_hours to credits field for frontend
      credits: course.credit_hours || 3,
      color: '#1976d2', // Default color
      rating: 4.5, // Default rating
      category: course.department || 'General'
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching approved courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's enrolled courses
router.get('/courses/enrolled', verifyToken, isStudent, async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.full_name as instructor 
      FROM courses c 
      JOIN users u ON c.instructor_id = u.id
      JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE ce.student_id = ?
      ORDER BY c.code
    `;
    
    const [enrolledCourses] = await pool.query(query, [req.user.id]);
    
    // Transform data to match frontend format
    const transformedCourses = enrolledCourses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name || course.title,
      description: course.description || course.request_notes || course.department,
      instructor: course.instructor,
      campus: course.campus,
      schedule: course.schedule || 'Schedule TBA',
      status: course.status,
      // Map credit_hours to credits field for frontend
      credits: course.credit_hours || 3,
      color: '#1976d2', // Default color
      rating: 4.5, // Default rating
      category: course.department || 'General',
      progress: course.progress || 0,
      enrolled: true
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unenroll from a course
router.delete('/courses/unenroll/:courseId', verifyToken, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check if enrolled
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(404).json({ message: 'You are not enrolled in this course' });
    }
    
    // Delete enrollment
    const [result] = await pool.query(
      'DELETE FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Successfully unenrolled from course', courseId });
    } else {
      throw new Error('Failed to unenroll from course');
    }
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all materials from enrolled courses
router.get('/materials', verifyToken, isStudent, async (req, res) => {
  try {
    const query = `
      SELECT cm.*, c.name as course_name, c.code as course_code, c.id as course_id, 
             u.full_name as uploader_name
      FROM course_materials cm
      JOIN courses c ON cm.course_id = c.id
      JOIN users u ON cm.uploaded_by = u.id
      JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE ce.student_id = ?
      ORDER BY cm.created_at DESC
    `;
    
    const [materials] = await pool.query(query, [req.user.id]);
    
    // Transform the materials to match the frontend format
    const transformedMaterials = materials.map(material => ({
      id: material.id,
      title: material.title,
      description: material.description,
      fileType: material.file_type,
      fileUrl: material.file_url,
      uploadDate: new Date(material.created_at).toISOString().split('T')[0],
      course: {
        id: material.course_id,
        code: material.course_code,
        title: material.course_name,
        color: '#1976d2' // Default color, can be customized
      },
      url: material.file_url,
      starred: false, // Default value, can implement starring functionality later
      author: material.uploader_name,
      downloadCount: 0 // Default value, can implement download tracking later
    }));
    
    res.json(transformedMaterials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get materials for a specific enrolled course
router.get('/courses/:courseId/materials', verifyToken, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if the student is enrolled in this course
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Get materials for this course
    const query = `
      SELECT cm.*, c.name as course_name, c.code as course_code, 
             u.full_name as uploader_name
      FROM course_materials cm
      JOIN courses c ON cm.course_id = c.id
      JOIN users u ON cm.uploaded_by = u.id
      WHERE cm.course_id = ?
      ORDER BY cm.created_at DESC
    `;
    
    const [materials] = await pool.query(query, [courseId]);
    
    // Transform the materials to match the frontend format
    const transformedMaterials = materials.map(material => ({
      id: material.id,
      title: material.title,
      description: material.description,
      fileType: material.file_type,
      fileUrl: material.file_url,
      uploadDate: new Date(material.created_at).toISOString().split('T')[0],
      course: {
        id: material.course_id,
        code: material.course_code,
        title: material.course_name,
        color: '#1976d2' // Default color, can be customized
      },
      url: material.file_url,
      starred: false, // Default value, can implement starring functionality later
      author: material.uploader_name,
      downloadCount: 0 // Default value, can implement download tracking later
    }));
    
    res.json(transformedMaterials);
  } catch (error) {
    console.error('Error fetching materials for course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a course
router.post('/courses/enroll', verifyToken, isStudent, async (req, res) => {
  try {
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check if the course exists and is approved
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND status = "active" AND request_status = "approved"',
      [courseId]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or not available for enrollment' });
    }
    
    // Check if already enrolled
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (enrollmentCheck.length > 0) {
      return res.status(409).json({ message: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    const query = `
      INSERT INTO course_enrollments 
      (student_id, course_id, enrollment_date, status, progress)
      VALUES (?, ?, NOW(), 'active', 0)
    `;
    
    const [result] = await pool.query(query, [req.user.id, courseId]);
    
    if (result.affectedRows === 1) {
      // Get the course details for response
      const [course] = await pool.query(
        'SELECT c.*, u.full_name as instructor FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?',
        [courseId]
      );
      
      const enrolledCourse = {
        id: course[0].id,
        code: course[0].code,
        title: course[0].name,
        description: course[0].request_notes || `Course in ${course[0].department}`,
        instructor: course[0].instructor,
        campus: course[0].campus,
        credits: course[0].credit_hours,
        schedule: 'Schedule will be announced',
        enrolled: true,
        enrollmentId: result.insertId,
        enrollmentDate: new Date().toISOString(),
        progress: 0
      };
      
      // Notify the faculty member about the enrollment
      await notificationHelpers.notifyCourseEnrollment(
        courseId,
        req.user.full_name,
        course[0].name
      );
      
      res.status(201).json(enrolledCourse);
    } else {
      throw new Error('Failed to create enrollment');
    }
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all assignments for enrolled courses
router.get('/assignments', verifyToken, isStudent, async (req, res) => {
  try {
    // Query to get all assignments for courses the student is enrolled in
    const query = `
      SELECT a.*, c.code as course_code, c.name as course_name, u.full_name as instructor_name,
             (SELECT asub.id FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submission_id,
             (SELECT asub.status FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submission_status,
             (SELECT asub.grade FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as grade,
             (SELECT asub.submitted_at FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submitted_at
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.instructor_id = u.id 
      JOIN course_enrollments ce ON a.course_id = ce.course_id
      WHERE ce.student_id = ? 
      AND a.visibility = 'published'
      ORDER BY a.due_date
    `;
    
    const [assignments] = await pool.query(query, [
      req.user.id, req.user.id, req.user.id, req.user.id, req.user.id
    ]);
    
    // Process the assignments to include status based on submission and due date
    const processedAssignments = assignments.map(assignment => {
      let status = 'pending';
      
      if (assignment.submission_status) {
        status = assignment.submission_status;
      } else if (new Date(assignment.due_date) < new Date()) {
        status = 'late';
      }
      
      return {
        ...assignment,
        status
      };
    });
    
    res.json(processedAssignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments for a specific enrolled course
router.get('/courses/:courseId/assignments', verifyToken, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify student is enrolled in the course
    const [enrollment] = await pool.query(
      'SELECT * FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [req.user.id, courseId]
    );
    
    if (enrollment.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }
    
    // Get assignments for the specific course
    const query = `
      SELECT a.*, c.code as course_code, c.name as course_name, u.full_name as instructor_name,
             (SELECT asub.id FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submission_id,
             (SELECT asub.status FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submission_status,
             (SELECT asub.grade FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as grade,
             (SELECT asub.submitted_at FROM assignment_submissions asub 
              WHERE asub.assignment_id = a.id AND asub.student_id = ?) as submitted_at
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.instructor_id = u.id
      WHERE a.course_id = ? 
      AND a.visibility = 'published'
      ORDER BY a.due_date
    `;
    
    const [assignments] = await pool.query(query, [
      req.user.id, req.user.id, req.user.id, req.user.id, courseId
    ]);
    
    // Process the assignments to include status based on submission and due date
    const processedAssignments = assignments.map(assignment => {
      let status = 'pending';
      
      if (assignment.submission_status) {
        status = assignment.submission_status;
      } else if (new Date(assignment.due_date) < new Date()) {
        status = 'late';
      }
      
      return {
        ...assignment,
        status
      };
    });
    
    res.json(processedAssignments);
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific assignment with submission details if available
router.get('/assignments/:assignmentId', verifyToken, isStudent, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Get assignment with enrollment check
    const query = `
      SELECT a.*, c.code as course_code, c.name as course_name, u.full_name as instructor_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.instructor_id = u.id
      JOIN course_enrollments ce ON a.course_id = ce.course_id
      WHERE a.id = ? 
      AND ce.student_id = ?
      AND a.visibility = 'published'
    `;
    
    const [assignments] = await pool.query(query, [assignmentId, req.user.id]);
    
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or not accessible' });
    }
    
    const assignment = assignments[0];
    
    // Get submission if it exists
    const [submissions] = await pool.query(
      'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, req.user.id]
    );
    
    let result = {
      ...assignment,
      submission: submissions.length > 0 ? submissions[0] : null
    };
    
    // Determine status
    if (submissions.length > 0) {
      result.status = submissions[0].status;
    } else if (new Date(assignment.due_date) < new Date()) {
      result.status = 'late';
    } else {
      result.status = 'pending';
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit an assignment
router.post('/assignments/:assignmentId/submit', verifyToken, isStudent, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { submissionText, fileUrl, fileType } = req.body;
    
    if (!submissionText && !fileUrl) {
      return res.status(400).json({ message: 'Submission text or file is required' });
    }
    
    // Check if assignment exists and student is enrolled in the course
    const query = `
      SELECT a.*, c.code as course_code, c.name as course_name, a.max_attempts
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN course_enrollments ce ON a.course_id = ce.course_id
      WHERE a.id = ? 
      AND ce.student_id = ?
      AND a.visibility = 'published'
    `;
    
    const [assignments] = await pool.query(query, [assignmentId, req.user.id]);
    
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or not accessible' });
    }
    
    const assignment = assignments[0];
    
    // Get student information to ensure we have the correct name
    const [studentInfo] = await pool.query(
      'SELECT id, full_name, student_id, campus FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (studentInfo.length === 0) {
      return res.status(404).json({ message: 'Student information not found' });
    }
    
    const studentName = studentInfo[0].full_name;
    const studentId = studentInfo[0].student_id;
    const studentCampus = studentInfo[0].campus;
    
    // Check if past due date and late submissions are not allowed
    const isDueDatePassed = new Date(assignment.due_date) < new Date();
    if (isDueDatePassed && !assignment.allow_late_submission) {
      return res.status(400).json({ message: 'Late submissions are not allowed for this assignment' });
    }
    
    // Check for previous submission and attempt limits
    const [existingSubmissions] = await pool.query(
      'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ? ORDER BY attempt_number DESC',
      [assignmentId, req.user.id]
    );
    
    let attemptNumber = 1;
    let submissionStatus = isDueDatePassed ? 'late' : 'submitted';
    
    if (existingSubmissions.length > 0) {
      // Check attempts limit
      if (existingSubmissions.length >= assignment.max_attempts) {
        return res.status(400).json({ 
          message: `Maximum number of attempts (${assignment.max_attempts}) has been reached`
        });
      }
      
      attemptNumber = existingSubmissions[0].attempt_number + 1;
      
      // If already graded, mark as resubmitted
      if (existingSubmissions[0].status === 'graded') {
        submissionStatus = 'resubmitted';
      }
    }
    
    // Create submission
    const insertQuery = `
      INSERT INTO assignment_submissions 
      (assignment_id, student_id, attempt_number, submission_text, file_url, file_type, submitted_at, status)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    
    const [result] = await pool.query(
      insertQuery, 
      [assignmentId, req.user.id, attemptNumber, submissionText || null, fileUrl || null, fileType || null, submissionStatus]
    );
    
    if (result.affectedRows === 1) {
      // Get the updated submission
      const [submissions] = await pool.query(
        'SELECT * FROM assignment_submissions WHERE id = ?',
        [result.insertId]
      );
      
      // Notify the faculty member about the submission with proper student name
      await notificationHelpers.notifyAssignmentSubmission(
        assignmentId,
        studentName, // Use the explicitly fetched student name
        assignment.title
      );
      
      res.status(201).json({
        message: 'Assignment submitted successfully',
        submission: submissions[0],
        assignment: {
          id: assignment.id,
          title: assignment.title,
          course_code: assignment.course_code,
          course_name: assignment.course_name
        }
      });
    } else {
      throw new Error('Failed to submit assignment');
    }
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's grades for all enrolled courses
router.get('/grades', verifyToken, isStudent, async (req, res) => {
  try {
    // First, get all courses the student is enrolled in
    const enrolledCoursesQuery = `
      SELECT c.*, ce.enrollment_date, u.full_name as instructor
      FROM courses c
      JOIN course_enrollments ce ON c.id = ce.course_id
      JOIN users u ON c.instructor_id = u.id
      WHERE ce.student_id = ?
      ORDER BY ce.enrollment_date DESC
    `;
    
    const [enrolledCourses] = await pool.query(enrolledCoursesQuery, [req.user.id]);
    
    // Prepare to collect grades data for each course
    const gradesData = [];
    
    // Get current academic term - for now using "Spring 2023" as default
    // This could be fetched from a settings table in the future
    const currentTerm = 'Spring 2023';
    
    // For each enrolled course, get the assignment grades
    for (const course of enrolledCourses) {
      // Get assignments and submissions for this course
      const assignmentsQuery = `
        SELECT a.id, a.title, a.points as total, a.due_date,
               s.grade as score, s.status, s.graded_at
        FROM assignments a
        LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
        WHERE a.course_id = ?
        ORDER BY a.due_date
      `;
      
      const [assignments] = await pool.query(assignmentsQuery, [req.user.id, course.id]);
      
      // Transform assignments data
      const formattedAssignments = assignments.map(assignment => {
        // Default weight - in a real system this would be stored in the database
        const weight = 100 / assignments.length;
        
        return {
          name: assignment.title,
          score: assignment.score !== null ? parseFloat(assignment.score) : null,
          total: assignment.total,
          weight: weight,
          dueDate: assignment.due_date,
          status: assignment.status || 'pending'
        };
      });
      
      // Determine if this is a current term course (enrolled in the past 4 months)
      const enrollmentDate = new Date(course.enrollment_date);
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
      
      const term = enrollmentDate > fourMonthsAgo ? currentTerm : 'Previous Terms';
      
      // Pick a color based on course ID (for consistent colors)
      const colors = ['#1976d2', '#e91e63', '#9c27b0', '#ff9800', '#4caf50', '#607d8b', '#673ab7'];
      const color = colors[course.id % colors.length];
      
      // Calculate final grade if all assignments are graded
      let finalGrade = null;
      // This logic would be enhanced in a real system
      
      gradesData.push({
        id: course.id,
        course: {
          id: course.id,
          code: course.code,
          title: course.name || course.title,
          credits: course.credit_hours || 3,
          color: color
        },
        assignments: formattedAssignments,
        finalGrade: finalGrade,
        term: term
      });
    }
    
    res.json(gradesData);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications for the student
router.get('/notifications', verifyToken, isStudent, async (req, res) => {
  try {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 15
    `;
    
    const [notifications] = await pool.query(query, [req.user.id]);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for student
router.delete('/notifications', verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Delete all notifications for this student
    await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [studentId]
    );
    
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/notifications/count', verifyToken, isStudent, async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = false
    `;
    
    const [result] = await pool.query(query, [req.user.id]);
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/notifications/:id', verifyToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify the notification belongs to the user
    const [notificationCheck] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
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
router.patch('/notifications', verifyToken, isStudent, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [req.user.id]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get announcements for student
router.get('/announcements', verifyToken, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentRole = req.user.role;
    
    // Only allow students to access this endpoint
    if (studentRole !== 'student') {
      return res.status(403).json({ message: 'Access denied. Students only.' });
    }
    
    // Get student's campus
    const [studentData] = await pool.query('SELECT campus FROM users WHERE id = ?', [studentId]);
    const studentCampus = studentData[0]?.campus || '';
    
    // Get announcements for all students or specific to this student's campus
    const [announcements] = await pool.query(`
      SELECT a.*, u.full_name as author_name, u.profile_image as author_image 
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE (a.target = 'all' OR a.target = 'students')
        AND (a.campus = 'All Campuses' OR a.campus = ?)
      ORDER BY a.id DESC
    `, [studentCampus]);
    
    res.status(200).json(announcements);
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
});

module.exports = router; 