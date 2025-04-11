-- Script to clean up the assignments and related tables for a fresh start

-- First, delete all submissions
DELETE FROM assignment_submissions;

-- Then delete all assignments
DELETE FROM assignments;

-- Reset auto-increment counters
ALTER TABLE assignment_submissions AUTO_INCREMENT = 1;
ALTER TABLE assignments AUTO_INCREMENT = 1;

-- Check faculty courses to ensure instructor_id is set
UPDATE courses
SET instructor_id = (
    SELECT id FROM users WHERE role = 'teacher' LIMIT 1
)
WHERE instructor_id IS NULL;

-- Verify all course enrollments to ensure proper course/student relationships
-- Delete any invalid enrollments (missing students or courses)
DELETE FROM course_enrollments
WHERE student_id NOT IN (SELECT id FROM users WHERE role = 'student')
   OR course_id NOT IN (SELECT id FROM courses);

-- Output completion message
SELECT 'Assignment data cleanup complete. Tables reset successfully.' AS Result; 