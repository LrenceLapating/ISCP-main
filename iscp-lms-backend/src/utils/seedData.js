/**
 * seedData.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 16, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Database seeding utility for creating test data,
 * sample users, courses, and demo content.
 */

const { pool } = require('../config/db');

// Seed sample notifications
const seedNotifications = async () => {
  try {
    // Check if notifications already exist
    const [existingNotifications] = await pool.query('SELECT COUNT(*) as count FROM notifications');
    
    if (existingNotifications[0].count > 0) {
      console.log('Notifications already seeded, skipping');
      return;
    }
    
    // Get student user IDs for assigning notifications
    const [students] = await pool.query('SELECT id FROM users WHERE role = "student" LIMIT 5');
    
    if (students.length === 0) {
      console.log('No students found, skipping notification seeding');
      return;
    }
    
    const student1Id = students[0].id;
    const student2Id = students.length > 1 ? students[1].id : students[0].id;
    
    // Sample notifications data
    const notifications = [
      {
        user_id: student1Id,
        title: 'Assignment Graded',
        message: 'Your assignment "Multiverse Theory Analysis" has been graded. You received 92%.',
        type: 'grade',
        related_id: 1,
        is_read: false,
        created_at: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        user_id: student1Id,
        title: 'New Assignment Posted',
        message: 'A new assignment "Time Loop Experiment" has been posted in Time Travel Ethics. Due: Dec 15, 2023.',
        type: 'assignment',
        related_id: 2,
        is_read: true,
        created_at: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        user_id: student1Id,
        title: 'New Course Available',
        message: 'A new course "Quantum Computing Basics" taught by Dr. Bruce Banner is now available for enrollment.',
        type: 'course',
        related_id: 3,
        is_read: false,
        created_at: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        user_id: student2Id,
        title: 'New Message',
        message: 'You have received a new message from Tony Stark.',
        type: 'message',
        related_id: 1,
        is_read: false,
        created_at: new Date(Date.now() - 43200000) // 12 hours ago
      },
      {
        user_id: student2Id,
        title: 'New Announcement',
        message: 'Dr. Stephen Strange posted a new announcement: "Interdimensional Field Trip Scheduled"',
        type: 'announcement',
        related_id: 1,
        is_read: true,
        created_at: new Date(Date.now() - 259200000) // 3 days ago
      },
      {
        user_id: student2Id,
        title: 'System Maintenance',
        message: 'The Learning Management System will be down for maintenance on Saturday, December 2nd from 2AM to 4AM.',
        type: 'system',
        related_id: null,
        is_read: false,
        created_at: new Date(Date.now() - 345600000) // 4 days ago
      }
    ];
    
    // Insert sample notifications
    for (const notification of notifications) {
      await pool.query(
        `INSERT INTO notifications 
         (user_id, title, message, type, related_id, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.user_id,
          notification.title,
          notification.message,
          notification.type,
          notification.related_id,
          notification.is_read,
          notification.created_at
        ]
      );
    }
    
    console.log('Sample notifications seeded successfully');
  } catch (error) {
    console.error('Error seeding notifications:', error);
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    // ... existing seed calls ...
    
    // Seed sample notifications
    await seedNotifications();
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}; 