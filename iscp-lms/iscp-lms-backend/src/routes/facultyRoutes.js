const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isTeacher } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const notificationHelpers = require('../utils/notificationHelpers');

// File upload configuration for materials
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `material-${uniqueSuffix}${ext}`);
  }
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types for course materials
    cb(null, true);
  }
});

// Get teacher's courses
router.get('/courses', verifyToken, isTeacher, async (req, res) => {
  try {
    // First get the faculty's campus
    const [facultyInfo] = await pool.query(
      'SELECT campus FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    const facultyCampus = facultyInfo[0].campus;

    const query = `
      SELECT c.*, COUNT(ce.id) as enrolled_students
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE c.instructor_id = ? AND c.campus = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const [courses] = await pool.query(query, [req.user.id, facultyCampus]);
    
    // Transform the course data to match the frontend format
    const transformedCourses = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.name,
      description: course.department, // Using department as description for now
      teacherId: course.instructor_id,
      credits: course.credit_hours,
      maxStudents: 30, // Default since the actual schema doesn't have this
      campus: course.campus,
      status: course.status,
      request_status: course.request_status,
      request_notes: course.request_notes,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      enrolledStudents: course.enrolled_students || 0,
      progress: 0 // Default since the actual schema doesn't have this
    }));
    
    res.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching faculty courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle course request from faculty
router.post('/courses/request', verifyToken, isTeacher, async (req, res) => {
  try {
    const { 
      code, 
      title, 
      description, 
      credits, 
      maxStudents, 
      department 
    } = req.body;
    
    // Validate required fields
    if (!code || !title || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get faculty's assigned campus and full name
    const [facultyInfo] = await pool.query(
      'SELECT campus, full_name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    const facultyCampus = facultyInfo[0].campus;
    const facultyName = facultyInfo[0].full_name;
    
    // Check if course code already exists
    const [existingCourse] = await pool.query(
      'SELECT * FROM courses WHERE code = ?',
      [code]
    );
    
    if (existingCourse.length > 0) {
      return res.status(409).json({ message: 'Course code already exists' });
    }
    
    // Insert the course with pending status
    const query = `
      INSERT INTO courses (
        code, name, department, campus, instructor_id, 
        credit_hours, status, request_status, request_notes
      ) VALUES (?, ?, ?, ?, ?, ?, 'inactive', 'pending', ?)
    `;
    
    const [result] = await pool.query(query, [
      code,
      title,
      department,
      facultyCampus,
      req.user.id,
      credits || 3,
      description || ''
    ]);
    
    const courseId = result.insertId;
    
    // Get the created course with ID
    const [newCourse] = await pool.query(
      'SELECT * FROM courses WHERE id = ?',
      [courseId]
    );
    
    // Notify all admins about the new course request
    await notificationHelpers.notifyCourseRequest(
      courseId,
      facultyName,
      title,
      code
    );
    
    if (newCourse.length === 0) {
      return res.status(500).json({ message: 'Error creating course' });
    }
    
    res.status(201).json({
      id: newCourse[0].id,
      code: newCourse[0].code,
      title: newCourse[0].name,
      department: newCourse[0].department,
      request_status: newCourse[0].request_status,
      request_notes: newCourse[0].request_notes,
      status: newCourse[0].status,
      credits: newCourse[0].credit_hours
    });
  } catch (error) {
    console.error('Error requesting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course details
router.get('/courses/:courseId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Get course details with enrollment count
    const query = `
      SELECT c.*, COUNT(ce.id) as enrolled_students
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    
    const [course] = await pool.query(query, [courseId]);
    
    if (course.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Transform the course data to match the frontend format
    const transformedCourse = {
      id: course[0].id,
      code: course[0].code,
      title: course[0].name,
      description: course[0].department, // Using department as description for now
      teacherId: course[0].instructor_id,
      credits: course[0].credit_hours,
      maxStudents: 30, // Default since the actual schema doesn't have this
      campus: course[0].campus,
      status: course[0].status,
      createdAt: course[0].created_at,
      updatedAt: course[0].updated_at,
      enrolledStudents: course[0].enrolled_students || 0,
      progress: 0 // Default since the actual schema doesn't have this
    };
    
    res.json(transformedCourse);
  } catch (error) {
    console.error(`Error fetching course details:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students enrolled in a course
router.get('/courses/:courseId/students', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const teacherId = req.user.id;
    
    console.log(`Teacher ${teacherId} fetching students for course ${courseId}`);
    
    // First verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, teacherId]
    );
    
    if (courseCheck.length === 0) {
      console.log(`Course ${courseId} not found or does not belong to teacher ${teacherId}`);
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    console.log(`Course ${courseId} verified to belong to teacher ${teacherId}`);
    
    // Use a query that only returns students enrolled in this specific course
    const query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.campus, 
        u.profile_image,
        u.student_id as studentId,
        ce.enrollment_date,
        ce.status as enrollment_status
      FROM users u
      JOIN course_enrollments ce ON u.id = ce.student_id
      WHERE ce.course_id = ? 
        AND u.role = 'student'
      ORDER BY u.full_name
    `;
    
    const [students] = await pool.query(query, [courseId]);
    
    console.log(`Found ${students.length} students enrolled in course ${courseId}`);
    
    // If there are no enrolled students, check if we need to create sample data
    if (students.length === 0) {
      console.log(`No students found for course ${courseId}, checking if we need to create sample data`);
      
      // Check if there are any students in the system
      const [studentCheck] = await pool.query(
        'SELECT id FROM users WHERE role = "student" LIMIT 5'
      );
      
      if (studentCheck.length > 0) {
        console.log(`Creating sample enrollments for course ${courseId}`);
        // Create some sample enrollments
        for (const student of studentCheck) {
          try {
            await pool.query(
              'INSERT IGNORE INTO course_enrollments (student_id, course_id) VALUES (?, ?)',
              [student.id, courseId]
            );
          } catch (err) {
            console.log(`Error creating enrollment: ${err.message}`);
          }
        }
        
        // Fetch the newly enrolled students
        const [newStudents] = await pool.query(query, [courseId]);
        students.push(...newStudents);
      }
    }
    
    // Transform data to include calculated fields and status
    const transformedStudents = students.map(student => {
      // Generate random data for fields we would normally get from other tables
      const progress = Math.floor(Math.random() * 100);
      const submissions_count = Math.floor(Math.random() * 10);
      const total_assignments = 10;
      const average_grade = 60 + Math.floor(Math.random() * 40);
      
      // Calculate an academic status based on progress and grades
      let status = 'active';
      if (progress > 90) {
        status = 'excellent';
      } else if (average_grade < 60) {
        status = 'at-risk';
      } else if (progress < 30 && submissions_count === 0) {
        status = 'inactive';
      }
      
      return {
        ...student,
        status,
        progress,
        enrollment_date: student.enrollment_date,
        // Format date for frontend display
        formatted_enrollment_date: new Date(student.enrollment_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        // Generate random submission data
        submissions_count,
        total_assignments,
        // Calculate submission rate
        submission_rate: ((submissions_count / total_assignments) * 100).toFixed(1),
        // Format grade for display
        grade: average_grade.toFixed(1)
      };
    });
    
    res.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching course students:', error);
    // Provide more detailed error message
    res.status(500).json({ 
      message: 'Server error while fetching students', 
      errorDetail: error.message, 
      sqlState: error.sqlState,
      sqlCode: error.code
    });
  }
});

// Create a new assignment
router.post('/courses/:courseId/assignments', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      title, 
      description, 
      dueDate, 
      points,
      attachmentUrl,
      attachmentType
    } = req.body;
    
    if (!title || !dueDate || !points) {
      return res.status(400).json({ 
        message: 'Title, due date, and points are required' 
      });
    }
    
    // Verify the faculty member teaches this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(403).json({ 
        message: 'You do not have permission to create assignments for this course' 
      });
    }
    
    // Create the assignment
    const [result] = await pool.query(
      `INSERT INTO assignments 
       (course_id, instructor_id, title, description, due_date, points, attachment_url, attachment_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, req.user.id, title, description, dueDate, points, attachmentUrl, attachmentType]
    );
    
    const assignmentId = result.insertId;
    
    // Get the course details for notifications
    const [courseDetails] = await pool.query(
      'SELECT name FROM courses WHERE id = ?',
      [courseId]
    );
    
    const courseName = courseDetails[0].name;
    
    // Format the due date
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };
    
    // Get all enrolled students for this course
    const [enrolledStudents] = await pool.query(
      'SELECT student_id FROM course_enrollments WHERE course_id = ? AND status = "active"',
      [courseId]
    );
    
    // Send notifications to all enrolled students
    for (const student of enrolledStudents) {
      await notificationHelpers.notifyNewAssignment(
        student.student_id,
        assignmentId,
        title,
        courseName,
        formatDate(dueDate)
      );
    }
    
    // Get the created assignment
    const [newAssignment] = await pool.query(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    res.status(201).json(newAssignment[0]);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments for a course
router.get('/courses/:courseId/assignments', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    const query = `
      SELECT a.*, 
             (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submissions_count,
             (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND status = 'graded') as graded_count
      FROM assignments a
      WHERE a.course_id = ?
      ORDER BY a.due_date
    `;
    
    const [assignments] = await pool.query(query, [courseId]);
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific assignment
router.get('/assignments/:assignmentId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify the teacher owns the course this assignment belongs to
    const [assignmentCheck] = await pool.query(`
      SELECT a.*, c.instructor_id, c.name as course_name, c.code as course_code
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assignmentId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignmentCheck[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get submission stats
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        AVG(grade) as average_grade
      FROM assignment_submissions
      WHERE assignment_id = ?
    `, [assignmentId]);
    
    res.json({
      ...assignmentCheck[0],
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an assignment
router.put('/assignments/:assignmentId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { 
      title, 
      description, 
      instructions, 
      dueDate, 
      points, 
      maxAttempts, 
      allowLateSubmission, 
      visibility,
      attachmentUrl,
      attachmentType 
    } = req.body;
    
    // Verify the teacher owns the course this assignment belongs to
    const [assignmentCheck] = await pool.query(`
      SELECT a.*, c.instructor_id 
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assignmentId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignmentCheck[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updateQuery = `
      UPDATE assignments SET
        title = ?,
        description = ?,
        instructions = ?,
        due_date = ?,
        points = ?,
        max_attempts = ?,
        allow_late_submission = ?,
        visibility = ?,
        attachment_url = ?,
        attachment_type = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await pool.query(updateQuery, [
      title || assignmentCheck[0].title,
      description !== undefined ? description : assignmentCheck[0].description,
      instructions !== undefined ? instructions : assignmentCheck[0].instructions,
      dueDate || assignmentCheck[0].due_date,
      points || assignmentCheck[0].points,
      maxAttempts || assignmentCheck[0].max_attempts,
      allowLateSubmission !== undefined ? allowLateSubmission : assignmentCheck[0].allow_late_submission,
      visibility || assignmentCheck[0].visibility,
      attachmentUrl !== undefined ? attachmentUrl : assignmentCheck[0].attachment_url,
      attachmentType !== undefined ? attachmentType : assignmentCheck[0].attachment_type,
      assignmentId
    ]);
    
    // Get the updated assignment
    const [updatedAssignment] = await pool.query(
      'SELECT * FROM assignments WHERE id = ?',
      [assignmentId]
    );
    
    res.json(updatedAssignment[0]);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an assignment
router.delete('/assignments/:assignmentId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify the teacher owns the course this assignment belongs to
    const [assignmentCheck] = await pool.query(`
      SELECT a.*, c.instructor_id 
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assignmentId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignmentCheck[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete the assignment (cascade will delete submissions)
    await pool.query('DELETE FROM assignments WHERE id = ?', [assignmentId]);
    
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submissions for an assignment
router.get('/assignments/:assignmentId/submissions', verifyToken, isTeacher, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    // Verify the teacher owns the course this assignment belongs to
    const [assignmentCheck] = await pool.query(`
      SELECT a.*, c.instructor_id 
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assignmentId]);
    
    if (assignmentCheck.length === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    
    if (assignmentCheck[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
      SELECT s.*, u.full_name as student_name, u.email as student_email
      FROM assignment_submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at
    `;
    
    const [submissions] = await pool.query(query, [assignmentId]);
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade a submission
router.put('/submissions/:submissionId/grade', verifyToken, isTeacher, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    
    if (grade === undefined) {
      return res.status(400).json({ message: 'Grade is required' });
    }
    
    // Verify the teacher owns the course this submission belongs to
    const [submissionCheck] = await pool.query(`
      SELECT s.*, a.course_id, c.instructor_id, a.points
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = ?
    `, [submissionId]);
    
    if (submissionCheck.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    if (submissionCheck[0].instructor_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update the submission - CRITICAL: Add status = 'graded' to the update
    await pool.query(`
      UPDATE assignment_submissions
      SET grade = ?, feedback = ?, graded_at = NOW(), graded_by = ?, status = 'graded'
      WHERE id = ?
    `, [grade, feedback, req.user.id, submissionId]);
    
    // Calculate grade percentage
    const gradePercentage = (grade / submissionCheck[0].points) * 100;
    
    // Create notification for the student
    await notificationHelpers.notifyAssignmentGraded(
      submissionCheck[0].student_id,
      submissionCheck[0].assignment_id,
      submissionCheck[0].title,
      gradePercentage.toFixed(1)
    );
    
    res.json({ 
      message: 'Submission graded successfully',
      grade,
      feedback,
      graded_at: new Date(),
      graded_by: req.user.id,
      status: 'graded'
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload course material
router.post('/materials', verifyToken, isTeacher, uploadMaterial.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { courseId, title, description } = req.body;
    
    if (!courseId || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    const fileName = req.file.filename;
    const filePath = `/uploads/materials/${fileName}`;
    const fileType = path.extname(req.file.originalname).substring(1);
    
    // Insert into database
    const query = `
      INSERT INTO course_materials
      (course_id, title, description, file_url, file_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      courseId,
      title,
      description || '',
      filePath,
      fileType,
      req.user.id
    ]);
    
    const materialId = result.insertId;
    
    // Get the material details
    const [material] = await pool.query(
      `SELECT cm.*, u.full_name as uploader_name, 
              c.name as course_name, c.code as course_code
       FROM course_materials cm
       JOIN users u ON cm.uploaded_by = u.id
       JOIN courses c ON cm.course_id = c.id
       WHERE cm.id = ?`,
      [materialId]
    );
    
    res.status(201).json(material[0]);
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course materials
router.get('/courses/:courseId/materials', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Get materials for this course
    const [materials] = await pool.query(
      `SELECT cm.*, u.full_name as uploader_name, 
              c.name as course_name, c.code as course_code
       FROM course_materials cm
       JOIN users u ON cm.uploaded_by = u.id
       JOIN courses c ON cm.course_id = c.id
       WHERE cm.course_id = ?
       ORDER BY cm.created_at DESC`,
      [courseId]
    );
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course material
router.delete('/materials/:materialId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { materialId } = req.params;
    
    // Get the material first to check ownership
    const [material] = await pool.query(
      'SELECT * FROM course_materials WHERE id = ?',
      [materialId]
    );
    
    if (material.length === 0) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Check if this material belongs to a course owned by this teacher
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [material[0].course_id, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete the material
    await pool.query('DELETE FROM course_materials WHERE id = ?', [materialId]);
    
    // Optionally, delete the file from storage
    // const filePath = path.join(__dirname, '..', '..', material[0].file_url);
    // if (fs.existsSync(filePath)) {
    //   fs.unlinkSync(filePath);
    // }
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student progress
router.get('/students/:studentId/courses/:courseId/progress', verifyToken, isTeacher, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Verify student is enrolled in this course
    const [enrollment] = await pool.query(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    
    if (enrollment.length === 0) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }
    
    // Get assignment progress
    const [assignments] = await pool.query(`
      SELECT a.id, a.title, a.points as max_points,
             asub.status, asub.grade as score
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.due_date
    `, [studentId, courseId]);
    
    // Get attendance data (if available)
    const [attendance] = await pool.query(`
      SELECT date, status
      FROM attendance
      WHERE course_id = ? AND student_id = ?
      ORDER BY date DESC
    `, [courseId, studentId]);
    
    // Calculate overall grade
    let totalPoints = 0;
    let earnedPoints = 0;
    let completedAssignments = 0;
    
    assignments.forEach(assignment => {
      totalPoints += assignment.max_points;
      if (assignment.score !== null) {
        earnedPoints += assignment.score;
        completedAssignments++;
      }
    });
    
    const overallGrade = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : null;
    const overallProgress = assignments.length > 0 ? (completedAssignments / assignments.length) * 100 : 0;
    
    res.json({
      assignments,
      attendance: attendance || [],
      overallGrade,
      overallProgress
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create an announcement
router.post('/announcements', verifyToken, isTeacher, async (req, res) => {
  try {
    const { title, content, target, campus } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const query = `
      INSERT INTO announcements
      (author_id, title, content, target, campus)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      req.user.id,
      title,
      content,
      target || 'all',
      campus || 'All Campuses'
    ]);
    
    const announcementId = result.insertId;
    
    // Get the announcement details
    const [announcement] = await pool.query(
      `SELECT a.*, u.full_name as author_name 
       FROM announcements a 
       JOIN users u ON a.author_id = u.id 
       WHERE a.id = ?`,
      [announcementId]
    );
    
    if (announcement.length === 0) {
      return res.status(500).json({ message: 'Error retrieving announcement' });
    }
    
    // Get users to notify based on target and campus
    let userQuery = `SELECT id FROM users WHERE role = ?`;
    let queryParams = [];
    
    if (target === 'all') {
      userQuery = `SELECT id FROM users WHERE role = 'student'`;
      if (campus !== 'All Campuses') {
        userQuery += ` AND campus = ?`;
        queryParams.push(campus);
      }
    } else if (target === 'students') {
      userQuery = `SELECT id FROM users WHERE role = 'student'`;
      if (campus !== 'All Campuses') {
        userQuery += ` AND campus = ?`;
        queryParams.push(campus);
      }
    }
    
    const [users] = await pool.query(userQuery, queryParams);
    
    // Create notifications for all relevant users
    for (const user of users) {
      await notificationHelpers.notifyAnnouncement(
        user.id,
        announcementId,
        title,
        announcement[0].author_name
      );
    }
    
    res.status(201).json(announcement[0]);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get discussions for a course
router.get('/courses/:courseId/discussions', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    const query = `
      SELECT d.*, 
             u.full_name as creator_name,
             (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as replies_count
      FROM discussions d
      JOIN users u ON d.created_by = u.id
      WHERE d.course_id = ?
      ORDER BY d.updated_at DESC
    `;
    
    const [discussions] = await pool.query(query, [courseId]);
    
    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new discussion
router.post('/discussions', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    
    if (!courseId || !title || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    const query = `
      INSERT INTO discussions
      (course_id, title, content, created_by)
      VALUES (?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      courseId,
      title,
      content,
      req.user.id
    ]);
    
    const discussionId = result.insertId;
    
    // Get the discussion details
    const [discussion] = await pool.query(
      'SELECT * FROM discussions WHERE id = ?',
      [discussionId]
    );
    
    res.status(201).json(discussion[0]);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get discussion details with replies
router.get('/discussions/:discussionId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { discussionId } = req.params;
    
    // Get discussion with course info to verify ownership
    const [discussionCheck] = await pool.query(`
      SELECT d.*, c.instructor_id 
      FROM discussions d
      JOIN courses c ON d.course_id = c.id
      WHERE d.id = ?
    `, [discussionId]);
    
    if (discussionCheck.length === 0) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    if (discussionCheck[0].instructor_id !== req.user.id && discussionCheck[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get discussion details
    const [discussion] = await pool.query(`
      SELECT d.*, u.full_name as creator_name
      FROM discussions d
      JOIN users u ON d.created_by = u.id
      WHERE d.id = ?
    `, [discussionId]);
    
    if (discussion.length === 0) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Get replies
    const [replies] = await pool.query(`
      SELECT r.*, u.full_name as user_name, u.role as user_role
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.discussion_id = ?
      ORDER BY r.created_at
    `, [discussionId]);
    
    // Combine data
    const result = {
      ...discussion[0],
      replies
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reply to a discussion
router.post('/discussions/:discussionId/replies', verifyToken, isTeacher, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Verify the discussion exists and teacher has access
    const [discussionCheck] = await pool.query(`
      SELECT d.*, c.instructor_id 
      FROM discussions d
      JOIN courses c ON d.course_id = c.id
      WHERE d.id = ?
    `, [discussionId]);
    
    if (discussionCheck.length === 0) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    if (discussionCheck[0].instructor_id !== req.user.id && discussionCheck[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Insert reply
    const query = `
      INSERT INTO discussion_replies
      (discussion_id, user_id, content)
      VALUES (?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      discussionId,
      req.user.id,
      content
    ]);
    
    const replyId = result.insertId;
    
    // Update discussion timestamp
    await pool.query(
      'UPDATE discussions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [discussionId]
    );
    
    // Get the reply details
    const [reply] = await pool.query(`
      SELECT r.*, u.full_name as user_name, u.role as user_role
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [replyId]);
    
    res.status(201).json(reply[0]);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course attendance
router.get('/courses/:courseId/attendance/:date?', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId, date } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    let query;
    let params;
    
    if (date) {
      // Get attendance for specific date
      query = `
        SELECT a.*, u.full_name as student_name
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.course_id = ? AND a.date = ?
        ORDER BY u.full_name
      `;
      params = [courseId, date];
    } else {
      // Get all attendance records for course
      query = `
        SELECT a.*, u.full_name as student_name
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.course_id = ?
        ORDER BY a.date DESC, u.full_name
      `;
      params = [courseId];
    }
    
    const [attendance] = await pool.query(query, params);
    
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record attendance
router.post('/courses/:courseId/attendance', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, records } = req.body;
    
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Date and attendance records are required' });
    }
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Begin transaction to ensure all records are saved or none
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const record of records) {
        const { studentId, status, notes } = record;
        
        // Check if record already exists
        const [existing] = await connection.query(
          'SELECT id FROM attendance WHERE course_id = ? AND student_id = ? AND date = ?',
          [courseId, studentId, date]
        );
        
        if (existing.length > 0) {
          // Update existing record
          await connection.query(
            'UPDATE attendance SET status = ?, notes = ? WHERE id = ?',
            [status, notes || null, existing[0].id]
          );
        } else {
          // Insert new record
          await connection.query(
            'INSERT INTO attendance (course_id, student_id, date, status, notes, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [courseId, studentId, date, status, notes || null, req.user.id]
          );
        }
      }
      
      await connection.commit();
      res.json({ message: 'Attendance recorded successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overall course progress for all students in a course
router.get('/courses/:courseId/progress', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Get progress for all enrolled students
    const query = `
      SELECT cp.*, u.full_name as student_name, u.email, u.profile_image,
             (SELECT COUNT(*) FROM assignment_submissions asub 
              JOIN assignments a ON asub.assignment_id = a.id 
              WHERE a.course_id = ? AND asub.student_id = cp.student_id) as submissions_count,
             (SELECT AVG(grade) FROM assignment_submissions asub 
              JOIN assignments a ON asub.assignment_id = a.id 
              WHERE a.course_id = ? AND asub.student_id = cp.student_id AND asub.grade IS NOT NULL) as average_grade
      FROM course_progress cp
      JOIN users u ON cp.student_id = u.id
      WHERE cp.course_id = ?
      ORDER BY cp.progress_percent DESC, u.full_name
    `;
    
    const [progress] = await pool.query(query, [courseId, courseId, courseId]);
    
    // Get students enrolled but without progress records
    const missingProgressQuery = `
      SELECT u.id as student_id, u.full_name as student_name, u.email, u.profile_image,
             0 as modules_completed, 0 as total_modules, 0 as progress_percent,
             (SELECT COUNT(*) FROM assignment_submissions asub 
              JOIN assignments a ON asub.assignment_id = a.id 
              WHERE a.course_id = ? AND asub.student_id = u.id) as submissions_count,
             (SELECT AVG(grade) FROM assignment_submissions asub 
              JOIN assignments a ON asub.assignment_id = a.id 
              WHERE a.course_id = ? AND asub.student_id = u.id AND asub.grade IS NOT NULL) as average_grade
      FROM users u
      JOIN course_enrollments ce ON u.id = ce.student_id
      LEFT JOIN course_progress cp ON u.id = cp.student_id AND ce.course_id = cp.course_id
      WHERE ce.course_id = ? AND cp.id IS NULL
      ORDER BY u.full_name
    `;
    
    const [missingProgress] = await pool.query(missingProgressQuery, [courseId, courseId, courseId]);
    
    // Combine results
    const allProgress = [...progress, ...missingProgress];
    
    res.json(allProgress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update progress for a student in a course
router.put('/students/:studentId/courses/:courseId/progress', verifyToken, isTeacher, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { modulesCompleted, totalModules } = req.body;
    
    if (modulesCompleted === undefined || totalModules === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Verify student is enrolled in this course
    const [enrollment] = await pool.query(
      'SELECT * FROM course_enrollments WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    
    if (enrollment.length === 0) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }
    
    // Calculate progress percentage
    const progressPercent = totalModules > 0 ? (modulesCompleted / totalModules) * 100 : 0;
    
    // Check if progress record exists
    const [existingProgress] = await pool.query(
      'SELECT id FROM course_progress WHERE course_id = ? AND student_id = ?',
      [courseId, studentId]
    );
    
    if (existingProgress.length > 0) {
      // Update existing record
      await pool.query(`
        UPDATE course_progress 
        SET modules_completed = ?, total_modules = ?, progress_percent = ?, last_activity = NOW()
        WHERE id = ?
      `, [modulesCompleted, totalModules, progressPercent, existingProgress[0].id]);
    } else {
      // Create new record
      await pool.query(`
        INSERT INTO course_progress 
        (student_id, course_id, modules_completed, total_modules, progress_percent, last_activity)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [studentId, courseId, modulesCompleted, totalModules, progressPercent]);
    }
    
    res.json({ 
      message: 'Progress updated successfully',
      studentId,
      courseId,
      modulesCompleted,
      totalModules,
      progressPercent
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new course
router.post('/courses', verifyToken, isTeacher, async (req, res) => {
  try {
    const { 
      code, 
      title, 
      description, 
      credits, 
      maxStudents, 
      status = 'active' 
    } = req.body;
    
    if (!code || !title) {
      return res.status(400).json({ message: 'Course code and title are required' });
    }
    
    // Get faculty's assigned campus
    const [facultyInfo] = await pool.query(
      'SELECT campus FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    const facultyCampus = facultyInfo[0].campus;
    
    // Map frontend fields to database fields
    const query = `
      INSERT INTO courses (
        code, 
        name, 
        department, 
        instructor_id, 
        credit_hours, 
        campus, 
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      code, 
      title, // Map title to name
      description, // Map description to department
      req.user.id, 
      credits, // Map credits to credit_hours
      facultyCampus,
      status
    ]);
    
    res.status(201).json({ 
      id: result.insertId, 
      code, 
      title,
      description,
      teacherId: req.user.id,
      credits,
      maxStudents: maxStudents || 30,
      campus: facultyCampus,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enrolledStudents: 0
    });
  } catch (error) {
    console.error('Error creating course:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A course with this code already exists' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a student's progress in a course
router.patch('/courses/:courseId/students/:studentId/progress', verifyToken, isTeacher, async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { progress } = req.body;
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be a number between 0 and 100' });
    }
    
    // Verify the teacher owns this course
    const [courseCheck] = await pool.query(
      'SELECT * FROM courses WHERE id = ? AND instructor_id = ?',
      [courseId, req.user.id]
    );
    
    if (courseCheck.length === 0) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }
    
    // Check if the student is enrolled in the course
    const [enrollmentCheck] = await pool.query(
      'SELECT * FROM course_enrollments WHERE student_id = ? AND course_id = ?',
      [studentId, courseId]
    );
    
    if (enrollmentCheck.length === 0) {
      return res.status(404).json({ message: 'Student is not enrolled in this course' });
    }
    
    // Update the progress
    await pool.query(
      'UPDATE course_enrollments SET progress = ? WHERE student_id = ? AND course_id = ?',
      [progress, studentId, courseId]
    );
    
    // Also update the course_progress table if it exists
    try {
      await pool.query(`
        INSERT INTO course_progress (student_id, course_id, progress_percent, updated_at)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE progress_percent = ?, updated_at = NOW()
      `, [studentId, courseId, progress, progress]);
    } catch (err) {
      // If the course_progress table doesn't exist or there's another issue, just log it
      console.log('Could not update course_progress table:', err.message);
    }
    
    res.json({ 
      message: 'Progress updated successfully',
      studentId,
      courseId,
      progress 
    });
  } catch (error) {
    console.error('Error updating student progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get faculty profile information
router.get('/profile', verifyToken, isTeacher, async (req, res) => {
  try {
    const [facultyInfo] = await pool.query(
      'SELECT id, email, full_name, campus, profile_image FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    // Get any additional user settings if they exist
    const [userSettings] = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    // Combine the data
    const profileData = {
      ...facultyInfo[0],
      settings: userSettings.length > 0 ? userSettings[0] : {}
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching faculty profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students enrolled in faculty's courses
router.get('/students', verifyToken, isTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    // First get the faculty's campus
    const [facultyInfo] = await pool.query(
      'SELECT campus FROM users WHERE id = ?',
      [teacherId]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    const facultyCampus = facultyInfo[0].campus;
    
    // First, try to create the student_status table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS student_status (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          status ENUM('active', 'inactive', 'at-risk', 'excellent') NOT NULL DEFAULT 'active',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_by INT,
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY (student_id)
        )
      `);
    } catch (tableError) {
      console.warn('Could not check or create student_status table:', tableError);
      // Continue execution even if table creation fails
    }
    
    let students;
    
    try {
      // First try the query with the student_status table
      const query = `
        SELECT DISTINCT 
          u.id, 
          u.full_name, 
          u.email, 
          u.campus, 
          u.profile_image,
          u.student_id as studentId,
          ss.status,
          GROUP_CONCAT(DISTINCT c.id) as course_ids,
          GROUP_CONCAT(DISTINCT c.name) as course_names,
          GROUP_CONCAT(DISTINCT c.code) as course_codes,
          MIN(ce.enrollment_date) as first_enrollment_date,
          us.profile_picture
        FROM users u
        JOIN course_enrollments ce ON u.id = ce.student_id
        JOIN courses c ON ce.course_id = c.id
        LEFT JOIN student_status ss ON u.id = ss.student_id
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE c.instructor_id = ?
          AND c.campus = ?
          AND u.role = 'student'
        GROUP BY u.id
        ORDER BY u.full_name
      `;
      
      [students] = await pool.query(query, [teacherId, facultyCampus]);
    } catch (queryError) {
      // If the query fails (likely because student_status table doesn't exist),
      // use a simpler query without that table
      console.warn('Error with student_status query, falling back to simpler query:', queryError.message);
      
      const fallbackQuery = `
        SELECT DISTINCT 
          u.id, 
          u.full_name, 
          u.email, 
          u.campus, 
          u.profile_image,
          u.student_id as studentId,
          GROUP_CONCAT(DISTINCT c.id) as course_ids,
          GROUP_CONCAT(DISTINCT c.name) as course_names,
          GROUP_CONCAT(DISTINCT c.code) as course_codes,
          MIN(ce.enrollment_date) as first_enrollment_date,
          us.profile_picture
        FROM users u
        JOIN course_enrollments ce ON u.id = ce.student_id
        JOIN courses c ON ce.course_id = c.id
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE c.instructor_id = ?
          AND c.campus = ?
          AND u.role = 'student'
        GROUP BY u.id
        ORDER BY u.full_name
      `;
      
      [students] = await pool.query(fallbackQuery, [teacherId, facultyCampus]);
    }
    
    // Transform data to include calculated fields and status
    const transformedStudents = students.map(student => {
      // Parse course IDs, names, and codes
      const courseIds = student.course_ids ? student.course_ids.split(',').map(Number) : [];
      const courseNames = student.course_names ? student.course_names.split(',') : [];
      const courseCodes = student.course_codes ? student.course_codes.split(',') : [];
      
      // Generate random data for fields we would normally get from other tables
      // In production, you'd want to fetch this data from the database
      const progress = Math.floor(Math.random() * 100);
      const submissions_count = Math.floor(Math.random() * 10);
      const total_assignments = 10;
      const average_grade = 60 + Math.floor(Math.random() * 40);
      
      // Calculate an academic status based on progress and grades if not set in database
      let status = student.status || 'active';
      if (!student.status) {
        if (progress > 90) {
          status = 'excellent';
        } else if (average_grade < 60) {
          status = 'at-risk';
        } else if (progress < 30 && submissions_count === 0) {
          status = 'inactive';
        }
      }
      
      // Create enrolled courses array
      const enrolledCourses = courseIds.map((id, index) => ({
        id,
        title: courseNames[index] || `Course ${id}`,
        code: courseCodes[index] || `COURSE-${id}`,
        progress: Math.floor(Math.random() * 100)
      }));
      
      // Parse the name parts for consistency
      const nameParts = student.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return {
        ...student,
        firstName,
        lastName,
        fullName: student.full_name,
        profilePicture: student.profile_picture,
        status,
        progress,
        enrollment_date: student.first_enrollment_date,
        formatted_enrollment_date: new Date(student.first_enrollment_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        submissions_count,
        total_assignments,
        submission_rate: ((submissions_count / total_assignments) * 100).toFixed(1),
        grade: average_grade.toFixed(1),
        enrolledCourses
      };
    });
    
    res.json(transformedStudents);
  } catch (error) {
    console.error('Error fetching faculty students:', error);
    res.status(500).json({ 
      message: 'Server error while fetching students', 
      errorDetail: error.message 
    });
  }
});

// Get details for a specific student
router.get('/students/:studentId', verifyToken, isTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;
    
    // First get the faculty's campus
    const [facultyInfo] = await pool.query(
      'SELECT campus FROM users WHERE id = ?',
      [teacherId]
    );

    if (!facultyInfo.length) {
      return res.status(404).json({ message: 'Faculty information not found' });
    }

    const facultyCampus = facultyInfo[0].campus;
    
    let student;
    
    try {
      // Check if student exists and is enrolled in any of the faculty's courses, with status
      const query = `
        SELECT 
          u.id, 
          u.full_name, 
          u.email, 
          u.campus, 
          u.profile_image,
          u.student_id as studentId,
          ss.status,
          GROUP_CONCAT(DISTINCT c.id) as course_ids,
          GROUP_CONCAT(DISTINCT c.name) as course_names,
          GROUP_CONCAT(DISTINCT c.code) as course_codes,
          MIN(ce.enrollment_date) as first_enrollment_date,
          (SELECT COUNT(*) FROM assignment_submissions asub 
            JOIN assignments a ON asub.assignment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE asub.student_id = u.id AND c.instructor_id = ?) as submissions_count,
          us.profile_picture
        FROM users u
        JOIN course_enrollments ce ON u.id = ce.student_id
        JOIN courses c ON ce.course_id = c.id
        LEFT JOIN student_status ss ON u.id = ss.student_id
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE u.id = ?
          AND c.instructor_id = ?
          AND c.campus = ?
          AND u.role = 'student'
        GROUP BY u.id
      `;
      
      const [students] = await pool.query(query, [teacherId, studentId, teacherId, facultyCampus]);
      
      if (students.length === 0) {
        return res.status(404).json({ message: 'Student not found or not enrolled in your courses' });
      }
      
      student = students[0];
    } catch (queryError) {
      // If the query fails, try without the student_status table
      console.warn('Error with student_status in student details query, falling back:', queryError.message);
      
      const fallbackQuery = `
        SELECT 
          u.id, 
          u.full_name, 
          u.email, 
          u.campus, 
          u.profile_image,
          u.student_id as studentId,
          GROUP_CONCAT(DISTINCT c.id) as course_ids,
          GROUP_CONCAT(DISTINCT c.name) as course_names,
          GROUP_CONCAT(DISTINCT c.code) as course_codes,
          MIN(ce.enrollment_date) as first_enrollment_date,
          (SELECT COUNT(*) FROM assignment_submissions asub 
            JOIN assignments a ON asub.assignment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE asub.student_id = u.id AND c.instructor_id = ?) as submissions_count,
          us.profile_picture
        FROM users u
        JOIN course_enrollments ce ON u.id = ce.student_id
        JOIN courses c ON ce.course_id = c.id
        LEFT JOIN user_settings us ON u.id = us.user_id
        WHERE u.id = ?
          AND c.instructor_id = ?
          AND c.campus = ?
          AND u.role = 'student'
        GROUP BY u.id
      `;
      
      const [students] = await pool.query(fallbackQuery, [teacherId, studentId, teacherId, facultyCampus]);
      
      if (students.length === 0) {
        return res.status(404).json({ message: 'Student not found or not enrolled in your courses' });
      }
      
      student = students[0];
    }
    
    // Parse course IDs, names, and codes
    const courseIds = student.course_ids ? student.course_ids.split(',').map(Number) : [];
    const courseNames = student.course_names ? student.course_names.split(',') : [];
    const courseCodes = student.course_codes ? student.course_codes.split(',') : [];
    
    // Create enrolled courses array
    const enrolledCourses = courseIds.map((id, index) => ({
      id,
      title: courseNames[index] || `Course ${id}`,
      code: courseCodes[index] || `COURSE-${id}`,
      progress: Math.floor(Math.random() * 100) // Generate random progress for demo
    }));
    
    // Transform the student data for the frontend
    const nameParts = student.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const progress = Math.floor(Math.random() * 100); // Random progress for demo
    const submissions_count = student.submissions_count || 0;
    const total_assignments = 10; // Placeholder
    const average_grade = 60 + Math.floor(Math.random() * 40); // Random grade for demo
    
    // Calculate an academic status based on progress and grades if not set in database
    let status = student.status || 'active';
    if (!student.status) {
      if (progress > 90) {
        status = 'excellent';
      } else if (average_grade < 60) {
        status = 'at-risk';
      } else if (progress < 30 && submissions_count === 0) {
        status = 'inactive';
      }
    }
    
    const transformedStudent = {
      id: student.id,
      fullName: student.full_name,
      firstName,
      lastName,
      email: student.email,
      campus: student.campus,
      profileImage: student.profile_image,
      profilePicture: student.profile_picture,
      studentId: student.studentId,
      status,
      progress,
      enrollment_date: student.first_enrollment_date,
      formatted_enrollment_date: new Date(student.first_enrollment_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      submissions_count,
      total_assignments,
      submission_rate: ((submissions_count / total_assignments) * 100).toFixed(1),
      grade: average_grade.toFixed(1),
      enrolledCourses
    };
    
    res.json(transformedStudent);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Server error while fetching student details' });
  }
});

// Update student status
router.put('/students/:studentId/status', verifyToken, isTeacher, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate the status
    const validStatuses = ['active', 'inactive', 'at-risk', 'excellent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Check if student exists and is enrolled in any of the faculty's courses
    const query = `
      SELECT u.id
      FROM users u
      JOIN course_enrollments ce ON u.id = ce.student_id
      JOIN courses c ON ce.course_id = c.id
      WHERE u.id = ?
        AND c.instructor_id = ?
        AND u.role = 'student'
      LIMIT 1
    `;
    
    const [students] = await pool.query(query, [studentId, req.user.id]);
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found or not enrolled in your courses' });
    }
    
    // Create student_status table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        status VARCHAR(20) NOT NULL,
        updated_by INT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY (student_id)
      )
    `);
    
    // Check if there's an existing status
    const [existingStatus] = await pool.query(
      'SELECT id FROM student_status WHERE student_id = ?',
      [studentId]
    );
    
    if (existingStatus.length > 0) {
      // Update existing status
      await pool.query(
        'UPDATE student_status SET status = ?, updated_by = ?, updated_at = NOW() WHERE student_id = ?',
        [status, req.user.id, studentId]
      );
    } else {
      // Insert new status
      await pool.query(
        'INSERT INTO student_status (student_id, status, updated_by) VALUES (?, ?, ?)',
        [studentId, status, req.user.id]
      );
    }
    
    res.json({ 
      message: 'Student status updated successfully',
      studentId,
      status
    });
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications for faculty
router.get('/notifications', verifyToken, isTeacher, async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    // Get notifications related to student activity in faculty's courses
    const query = `
      SELECT n.* 
      FROM notifications n
      WHERE n.user_id = ? 
      ORDER BY n.created_at DESC 
      LIMIT 15
    `;
    
    const [notifications] = await pool.query(query, [facultyId]);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching faculty notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for faculty
router.delete('/notifications', verifyToken, isTeacher, async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    // Delete all notifications for this faculty member
    await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [facultyId]
    );
    
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/notifications/count', verifyToken, isTeacher, async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = false
    `;
    
    const [result] = await pool.query(query, [facultyId]);
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/notifications/:id', verifyToken, isTeacher, async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { id } = req.params;
    
    // Verify the notification belongs to the faculty
    const [notificationCheck] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, facultyId]
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
router.patch('/notifications', verifyToken, isTeacher, async (req, res) => {
  try {
    const facultyId = req.user.id;
    
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = ?',
      [facultyId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 