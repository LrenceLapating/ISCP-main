-- Create course_progress table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS `course_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `modules_completed` int(11) NOT NULL DEFAULT 0,
  `total_modules` int(11) NOT NULL DEFAULT 0,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `last_activity` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progress` (`student_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `course_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_progress_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create attendance table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `session_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','late','excused') NOT NULL DEFAULT 'absent',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `student_id` (`student_id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`session_id`) REFERENCES `class_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add student_id column to users if it doesn't exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `student_id` VARCHAR(20) NULL;

-- Add profile_image column to users if it doesn't exist
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `profile_image` VARCHAR(255) NULL;

-- Upgrade messages system for better chat functionality
-- First, check if the messages table exists and drop it if it does
DROP TABLE IF EXISTS `messages`;

-- Create conversations table
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) DEFAULT NULL,
  `type` enum('direct','group') NOT NULL DEFAULT 'direct',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `last_read_message_id` int(11) DEFAULT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participant` (`conversation_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create messages table with improved schema
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `attachment_type` enum('image','document','other') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create a view for unread message counts
CREATE OR REPLACE VIEW `unread_message_counts` AS
SELECT 
  cp.user_id,
  cp.conversation_id,
  COALESCE(COUNT(m.id), 0) AS unread_count
FROM 
  conversation_participants cp
LEFT JOIN 
  messages m ON cp.conversation_id = m.conversation_id AND m.created_at > IFNULL(
    (SELECT MAX(created_at) FROM messages WHERE id = cp.last_read_message_id), 
    '1970-01-01'
  ) AND m.sender_id != cp.user_id AND m.deleted = 0
GROUP BY 
  cp.user_id, cp.conversation_id;

-- Make sure these tables and columns are created
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `enrollment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('active', 'completed', 'dropped') DEFAULT 'active',
  `progress` DECIMAL(5,2) DEFAULT 0.00,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_enrollment` (`student_id`, `course_id`)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('announcement', 'grade', 'assignment', 'course', 'message', 'system') NOT NULL,
  `related_id` INT DEFAULT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_read` (`is_read`)
);

-- Drop existing assignment-related tables to recreate with enhanced schema
DROP TABLE IF EXISTS `assignment_submissions`;
DROP TABLE IF EXISTS `assignments`;

-- Create enhanced assignments table
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `instructor_id` INT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `instructions` TEXT,
  `due_date` DATETIME NOT NULL,
  `points` INT NOT NULL,
  `max_attempts` INT DEFAULT 1,
  `allow_late_submission` BOOLEAN DEFAULT FALSE,
  `visibility` ENUM('draft', 'published') DEFAULT 'published',
  `attachment_url` VARCHAR(255),
  `attachment_type` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create enhanced assignment_submissions table
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `attempt_number` INT DEFAULT 1,
  `submission_text` TEXT,
  `file_url` VARCHAR(255),
  `file_type` VARCHAR(50),
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `grade` DECIMAL(5,2),
  `feedback` TEXT,
  `graded_at` DATETIME,
  `graded_by` INT,
  `status` ENUM('draft', 'submitted', 'late', 'graded', 'resubmitted') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`graded_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_submission_attempt` (`assignment_id`, `student_id`, `attempt_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert some sample course enrollments if none exist
INSERT IGNORE INTO `course_enrollments` (`student_id`, `course_id`)
SELECT u.id, c.id 
FROM users u, courses c 
WHERE u.role = 'student' AND c.id IN (1, 2, 3)
LIMIT 10;

-- Insert sample progress data if none exists
INSERT IGNORE INTO `course_progress` (`student_id`, `course_id`, `modules_completed`, `total_modules`, `progress_percent`)
SELECT ce.student_id, ce.course_id, 
       FLOOR(RAND() * 10), 10, 
       (FLOOR(RAND() * 10) / 10) * 100
FROM course_enrollments ce
WHERE NOT EXISTS (
    SELECT 1 FROM course_progress cp 
    WHERE cp.student_id = ce.student_id AND cp.course_id = ce.course_id
); 