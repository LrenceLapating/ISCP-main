const pool = require('../config/db').pool;

// Create a notification for a specific user
const createNotification = async (userId, title, message, type, relatedId = null) => {
  try {
    const query = `
      INSERT INTO notifications 
      (user_id, title, message, type, related_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const values = [userId, title, message, type, relatedId];
    const [result] = await pool.query(query, values);
    
    return result.insertId;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Get user settings to check if notifications should be sent
const shouldSendNotification = async (userId, notificationType) => {
  try {
    const query = `
      SELECT * FROM user_settings
      WHERE user_id = ?
    `;
    
    const [settings] = await pool.query(query, [userId]);
    
    if (settings.length === 0) {
      // If no settings exist, use defaults (true for all)
      return true;
    }
    
    const setting = settings[0];
    
    switch (notificationType) {
      case 'assignment':
        return setting.assignment_notifications;
      case 'grade':
        return true; // Always notify about grades
      case 'course':
        return true; // Always notify about course changes
      case 'message':
        return setting.message_notifications;
      case 'announcement':
        return setting.announcement_notifications;
      case 'system':
        return true; // Always send system notifications
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to sending if there's an error
  }
};

// Notification for when an assignment is graded
const notifyAssignmentGraded = async (studentId, assignmentId, assignmentTitle, grade) => {
  try {
    if (!(await shouldSendNotification(studentId, 'grade'))) return;

    // Get the assignment title from the database if it's undefined
    let finalAssignmentTitle = assignmentTitle;
    
    if (!finalAssignmentTitle || finalAssignmentTitle === 'undefined') {
      // Fetch the assignment title from the database
      const [assignmentData] = await pool.query(`
        SELECT a.title, c.code AS course_code 
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE a.id = ?
      `, [assignmentId]);
      
      if (assignmentData.length > 0) {
        finalAssignmentTitle = assignmentData[0].title;
        // Optionally add course code for more context
        if (assignmentData[0].course_code) {
          finalAssignmentTitle += ` (${assignmentData[0].course_code})`;
        }
      } else {
        // Use a generic fallback
        finalAssignmentTitle = "your assignment";
      }
    }
    
    const title = 'Assignment Graded';
    const message = `Your assignment "${finalAssignmentTitle}" has been graded. You received ${grade}%.`;
    
    return await createNotification(
      studentId,
      title,
      message,
      'grade',
      assignmentId
    );
  } catch (error) {
    console.error('Error creating grade notification:', error);
    return null;
  }
};

// Notification for new assignment
const notifyNewAssignment = async (studentId, assignmentId, assignmentTitle, courseName, dueDate) => {
  if (!(await shouldSendNotification(studentId, 'assignment'))) return;
  
  const title = 'New Assignment Posted';
  const message = `A new assignment "${assignmentTitle}" has been posted in ${courseName}. Due: ${dueDate}.`;
  
  return await createNotification(
    studentId,
    title,
    message,
    'assignment',
    assignmentId
  );
};

// Notification for course approval/availability
const notifyCourseAvailable = async (studentId, courseId, courseTitle, instructor) => {
  if (!(await shouldSendNotification(studentId, 'course'))) return;
  
  const title = 'New Course Available';
  const message = `A new course "${courseTitle}" taught by ${instructor} is now available for enrollment.`;
  
  return await createNotification(
    studentId,
    title,
    message,
    'course',
    courseId
  );
};

// Notification for new message
const notifyNewMessage = async (recipientId, messageId, senderName, senderId) => {
  if (!(await shouldSendNotification(recipientId, 'message'))) return;
  
  const title = 'New Message';
  const message = `You have received a new message from ${senderName}.`;
  
  return await createNotification(
    recipientId,
    title,
    message,
    'message',
    messageId
  );
};

// Notification for new announcement
const notifyAnnouncement = async (studentId, announcementId, announcementTitle, author) => {
  if (!(await shouldSendNotification(studentId, 'announcement'))) return;
  
  const title = 'New Announcement';
  const message = `${author} posted a new announcement: "${announcementTitle}"`;
  
  return await createNotification(
    studentId,
    title,
    message,
    'announcement',
    announcementId
  );
};

// Notification for system events
const notifySystem = async (studentId, title, message) => {
  if (!(await shouldSendNotification(studentId, 'system'))) return;
  
  return await createNotification(
    studentId,
    title,
    message,
    'system',
    null
  );
};

// Notification for when a student submits an assignment
const notifyAssignmentSubmission = async (assignmentId, studentName, assignmentTitle) => {
  try {
    // Get the student name from the database if it's undefined or not provided
    let validStudentName = studentName;
    
    if (!validStudentName || validStudentName === 'undefined') {
      // Fetch the student name from the database using the assignment submission
      const [submissionData] = await pool.query(`
        SELECT 
          u.full_name AS student_name
        FROM assignment_submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY s.created_at DESC
        LIMIT 1
      `, [assignmentId]);
      
      validStudentName = submissionData.length > 0 && submissionData[0].student_name 
        ? submissionData[0].student_name 
        : 'A student';
    }
    
    // Get the instructor ID and course info for this assignment
    const [assignmentData] = await pool.query(`
      SELECT 
        a.id AS assignment_id,
        a.title AS assignment_title,
        c.id AS course_id,
        c.name AS course_name,
        c.code AS course_code,
        c.instructor_id
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = ?
    `, [assignmentId]);
    
    if (assignmentData.length === 0) {
      console.error('Assignment not found for notification:', assignmentId);
      return null;
    }
    
    const { 
      instructor_id, 
      course_name, 
      course_code,
      assignment_title
    } = assignmentData[0];
    
    // Use assignment title from database as fallback if not provided
    const title = `New Submission from ${validStudentName}`;
    const finalAssignmentTitle = assignmentTitle || assignment_title || 'assignment';
    
    // Include more details in the message
    const message = `${validStudentName} has submitted the assignment "${finalAssignmentTitle}" for ${course_code}: ${course_name}.`;
    
    if (!(await shouldSendNotification(instructor_id, 'assignment'))) {
      console.log('Notification disabled for instructor:', instructor_id);
      return null;
    }
    
    return await createNotification(
      instructor_id,
      title,
      message,
      'submission',
      assignmentId
    );
  } catch (error) {
    console.error('Error creating assignment submission notification:', error);
    return null;
  }
};

// Notification for discussion reply
const notifyDiscussionReply = async (discussionId, studentName, discussionTitle) => {
  try {
    // Get the student name from the database if it's undefined or not provided
    let validStudentName = studentName;
    
    if (!validStudentName || validStudentName === 'undefined') {
      // Fetch the student name from the database using the discussion reply
      const [replyData] = await pool.query(`
        SELECT 
          u.full_name AS student_name
        FROM discussion_replies r
        JOIN users u ON r.user_id = u.id
        WHERE r.discussion_id = ?
        ORDER BY r.created_at DESC
        LIMIT 1
      `, [discussionId]);
      
      validStudentName = replyData.length > 0 && replyData[0].student_name 
        ? replyData[0].student_name 
        : 'A student';
    }
    
    // Get the discussion author ID and course info
    const [discussionData] = await pool.query(`
      SELECT 
        d.id, 
        d.title,
        d.created_by AS author_id,
        c.id AS course_id,
        c.name AS course_name,
        c.code AS course_code
      FROM discussions d
      JOIN courses c ON d.course_id = c.id
      WHERE d.id = ?
    `, [discussionId]);
    
    if (discussionData.length === 0) {
      console.error('Discussion not found for notification:', discussionId);
      return null;
    }
    
    const { 
      author_id, 
      title,
      course_name,
      course_code
    } = discussionData[0];
    
    // Use discussion title from database as fallback
    const finalDiscussionTitle = discussionTitle || title || 'discussion';
    
    // Notification title and message
    const notificationTitle = 'New Reply to Discussion';
    const message = `${validStudentName} has replied to your discussion "${finalDiscussionTitle}" in ${course_code}: ${course_name}.`;
    
    if (!(await shouldSendNotification(author_id, 'discussion'))) {
      console.log('Discussion notifications disabled for user:', author_id);
      return null;
    }
    
    return await createNotification(
      author_id,
      notificationTitle,
      message,
      'discussion',
      discussionId
    );
  } catch (error) {
    console.error('Error creating discussion reply notification:', error);
    return null;
  }
};

// Notification for course enrollment
const notifyCourseEnrollment = async (courseId, studentName, courseTitle) => {
  try {
    // Get the student name from the database if it's undefined or not provided
    let validStudentName = studentName;
    
    if (!validStudentName || validStudentName === 'undefined') {
      // Fetch the student name from the database using the course enrollment
      const [enrollmentData] = await pool.query(`
        SELECT 
          u.full_name AS student_name
        FROM course_enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.course_id = ?
        LIMIT 1
      `, [courseId]);
      
      validStudentName = enrollmentData.length > 0 && enrollmentData[0].student_name 
        ? enrollmentData[0].student_name 
        : 'A student';
    }
    
    // Get the course and instructor information
    const [courseData] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.code,
        c.instructor_id,
        u.full_name AS instructor_name
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ?
    `, [courseId]);
    
    if (courseData.length === 0) {
      console.error('Course not found for enrollment notification:', courseId);
      return null;
    }
    
    const { instructor_id, name, code } = courseData[0];
    
    // Use course title from database as fallback
    const finalCourseTitle = courseTitle || name || 'a course';
    
    const title = 'New Course Enrollment';
    const message = `${validStudentName} has enrolled in your course "${code}: ${finalCourseTitle}".`;
    
    return await createNotification(
      instructor_id,
      title,
      message,
      'course',
      courseId
    );
  } catch (error) {
    console.error('Error creating course enrollment notification:', error);
    return null;
  }
};

// Notification for when a faculty requests a new course
const notifyCourseRequest = async (courseId, facultyName, courseTitle, courseCode) => {
  try {
    // Get all admin users to notify them
    const [admins] = await pool.query('SELECT id FROM users WHERE role = "admin"');
    
    if (admins.length === 0) {
      console.log('No admins found to notify about course request');
      return null;
    }
    
    const title = 'New Course Request';
    const message = `${facultyName} has requested a new course "${courseCode}: ${courseTitle}". Please review.`;
    
    // Send notification to all admins
    for (const admin of admins) {
      await createNotification(
        admin.id,
        title,
        message,
        'course',
        courseId
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error creating course request notification:', error);
    return null;
  }
};

module.exports = {
  createNotification,
  shouldSendNotification,
  notifyAssignmentGraded,
  notifyNewAssignment,
  notifyCourseAvailable,
  notifyNewMessage,
  notifyAnnouncement,
  notifySystem,
  notifyAssignmentSubmission,
  notifyDiscussionReply,
  notifyCourseEnrollment,
  notifyCourseRequest
};