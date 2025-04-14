/**
 * messageController.js
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: May 25, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Message controller handling communication between users,
 * including direct messages, group messages, and notification delivery.
 */

const { pool } = require('../config/db');

/**
 * Get all conversations for a user
 */
const getConversations = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get all conversations where the user is a participant
    const [rows] = await pool.query(`
      SELECT 
        c.id, 
        c.title, 
        c.type, 
        c.created_at,
        c.updated_at,
        (
          SELECT JSON_OBJECT(
            'id', u.id,
            'fullName', u.full_name,
            'email', u.email,
            'profileImage', COALESCE(us.profile_picture, u.profile_image),
            'role', u.role,
            'campus', u.campus,
            'status', 'offline'
          )
          FROM conversation_participants cp2
          JOIN users u ON cp2.user_id = u.id
          LEFT JOIN user_settings us ON u.id = us.user_id
          WHERE cp2.conversation_id = c.id AND cp2.user_id != ?
          LIMIT 1
        ) as other_participant,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.sender_id != ?
          AND m.created_at > IFNULL(
            (SELECT created_at FROM messages WHERE id = cp.last_read_message_id),
            '1970-01-01'
          )
          AND m.deleted = 0
        ) as unread_count,
        (
          SELECT JSON_OBJECT(
            'id', m.id,
            'content', m.content,
            'sender_id', m.sender_id,
            'created_at', m.created_at,
            'sender_name', (SELECT full_name FROM users WHERE id = m.sender_id),
            'sender_profile_image', (SELECT COALESCE(
              (SELECT profile_picture FROM user_settings WHERE user_id = m.sender_id),
              (SELECT profile_image FROM users WHERE id = m.sender_id)
            ))
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.deleted = 0
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = ?
      ORDER BY c.updated_at DESC
    `, [userId, userId, userId]);
    
    // Process the results
    const conversations = rows.map(row => {
      // Parse the JSON strings
      const otherParticipant = row.other_participant ? JSON.parse(row.other_participant) : null;
      const lastMessage = row.last_message ? JSON.parse(row.last_message) : null;
      
      // For direct conversations, use the other participant's name as the title if no title exists
      let title = row.title;
      if (row.type === 'direct' && !title && otherParticipant) {
        title = otherParticipant.fullName;
      }
      
      return {
        id: row.id,
        title: title,
        type: row.type,
        unreadCount: row.unread_count,
        lastMessage: lastMessage,
        otherParticipant: otherParticipant,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    return res.status(200).json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    return res.status(500).json({ message: 'Server error while fetching conversations' });
  }
};

/**
 * Get all messages in a conversation
 */
const getMessages = async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;
  
  try {
    // Verify user is a participant in this conversation
    const [participants] = await pool.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );
    
    if (participants.length === 0) {
      return res.status(403).json({ message: 'User is not a participant in this conversation' });
    }
    
    // Get all participants in this conversation for read receipts
    const [allParticipants] = await pool.query(
      'SELECT user_id, last_read_message_id FROM conversation_participants WHERE conversation_id = ?',
      [conversationId]
    );
    
    // Create a map of participant IDs to their last read message IDs
    const participantReadStatus = {};
    allParticipants.forEach(p => {
      participantReadStatus[p.user_id] = p.last_read_message_id || 0;
    });
    
    // Get all messages in the conversation
    const [messages] = await pool.query(`
      SELECT 
        m.id,
        m.sender_id,
        u.full_name as sender_name,
        COALESCE(us.profile_picture, u.profile_image) as sender_profile_image,
        u.campus as sender_campus,
        m.content,
        m.attachment_url,
        m.attachment_type,
        m.created_at,
        m.updated_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE m.conversation_id = ?
      AND m.deleted = 0
      ORDER BY m.created_at ASC
    `, [conversationId]);
    
    // Add read status to each message
    const messagesWithReadStatus = messages.map(message => {
      // A message is read by a participant if their last_read_message_id is >= this message's id
      const readBy = Object.entries(participantReadStatus)
        .filter(([participantId, lastReadId]) => 
          // Don't include the sender in the read receipts
          parseInt(participantId) !== message.sender_id && 
          lastReadId >= message.id
        )
        .map(([participantId]) => parseInt(participantId));
      
      return {
        ...message,
        read_by: readBy,
        // For UI convenience, add a quick boolean to check if message is read by all
        read_by_all: readBy.length === allParticipants.length - 1 // -1 to exclude the sender
      };
    });
    
    // Mark all messages as read
    await pool.query(
      'UPDATE conversation_participants SET last_read_message_id = (SELECT MAX(id) FROM messages WHERE conversation_id = ?) WHERE conversation_id = ? AND user_id = ?',
      [conversationId, conversationId, userId]
    );
    
    return res.status(200).json(messagesWithReadStatus);
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({ message: 'Server error while fetching messages' });
  }
};

/**
 * Create a new message in a conversation
 */
const createMessage = async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;
  const { content, attachmentUrl, attachmentType } = req.body;
  
  if (!content && !attachmentUrl) {
    return res.status(400).json({ message: 'Message content or attachment is required' });
  }
  
  try {
    // Verify user is a participant in this conversation
    const [participants] = await pool.query(
      'SELECT * FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );
    
    if (participants.length === 0) {
      return res.status(403).json({ message: 'User is not a participant in this conversation' });
    }
    
    // Create the message
    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, content || '', attachmentUrl || null, attachmentType || null]
    );
    
    // Update the conversation's updated_at timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
      [conversationId]
    );
    
    // Get the created message with sender details
    const [messages] = await pool.query(`
      SELECT 
        m.id,
        m.sender_id,
        u.full_name as sender_name,
        COALESCE(us.profile_picture, u.profile_image) as sender_profile_image,
        u.campus as sender_campus,
        m.content,
        m.attachment_url,
        m.attachment_type,
        m.created_at,
        m.updated_at
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE m.id = ?
    `, [result.insertId]);
    
    // Return the created message
    return res.status(201).json(messages[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    return res.status(500).json({ message: 'Server error while creating message' });
  }
};

/**
 * Create a new conversation
 */
const createConversation = async (req, res) => {
  const userId = req.user.id;
  const { title, participantIds, type = 'direct', initialMessage, attachmentUrl, attachmentType } = req.body;
  
  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ message: 'At least one participant ID is required' });
  }
  
  // Add the creator to participants if not already included
  if (!participantIds.includes(userId)) {
    participantIds.push(userId);
  }
  
  // For direct messages, check if a conversation already exists
  if (type === 'direct' && participantIds.length === 2) {
    try {
      const [existingConv] = await pool.query(`
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
        JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
        WHERE c.type = 'direct'
        AND (
          SELECT COUNT(*) FROM conversation_participants 
          WHERE conversation_id = c.id
        ) = 2
      `, [userId, participantIds.filter(id => id !== userId)[0]]);
      
      if (existingConv.length > 0) {
        const conversationId = existingConv[0].id;
        
        // If there's an initial message, add it to the existing conversation
        if (initialMessage || attachmentUrl) {
          await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)',
            [conversationId, userId, initialMessage || '', attachmentUrl || null, attachmentType || null]
          );
          
          // Update the conversation's updated_at timestamp
          await pool.query(
            'UPDATE conversations SET updated_at = NOW() WHERE id = ?',
            [conversationId]
          );
        }
        
        return res.status(200).json({ 
          conversationId: conversationId,
          alreadyExists: true
        });
      }
    } catch (error) {
      console.error('Error checking for existing conversation:', error);
      return res.status(500).json({ message: 'Server error while checking existing conversations' });
    }
  }
  
  // Create a new conversation
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      // Create the conversation
      const [result] = await conn.query(
        'INSERT INTO conversations (title, type, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [title || null, type]
      );
      
      const conversationId = result.insertId;
      
      // Add all participants
      for (const participantId of participantIds) {
        await conn.query(
          'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
          [conversationId, participantId]
        );
      }
      
      // Add initial message if provided
      if (initialMessage || attachmentUrl) {
        await conn.query(
          'INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?)',
          [conversationId, userId, initialMessage || '', attachmentUrl || null, attachmentType || null]
        );
      }
      
      await conn.commit();
      
      return res.status(201).json({ 
        conversationId: conversationId,
        alreadyExists: false
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ message: 'Server error while creating conversation' });
  }
};

/**
 * Get users for starting a new conversation
 */
const getUsers = async (req, res) => {
  const userId = req.user.id;
  const query = req.query.query || '';
  
  try {
    // Get users that match the search query
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.full_name as fullName, 
        u.email, 
        COALESCE(us.profile_picture, u.profile_image) as profileImage, 
        u.role,
        u.campus
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id != ? 
      ${query ? 'AND (u.full_name LIKE ? OR u.email LIKE ?)' : ''}
      ORDER BY u.full_name
      LIMIT 20
    `, query ? [userId, `%${query}%`, `%${query}%`] : [userId]);
    
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Server error while fetching users' });
  }
};

/**
 * Mark all messages in a conversation as read
 */
const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.conversationId;
  
  try {
    // Find the latest message in the conversation
    const [messages] = await pool.query(
      'SELECT MAX(id) as latest_id FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    
    if (messages.length === 0 || !messages[0].latest_id) {
      return res.status(200).json({ message: 'No messages to mark as read' });
    }
    
    const latestMessageId = messages[0].latest_id;
    
    // Update the last read message ID for this user
    await pool.query(
      'UPDATE conversation_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
      [latestMessageId, conversationId, userId]
    );
    
    return res.status(200).json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return res.status(500).json({ message: 'Server error while marking conversation as read' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  createMessage,
  createConversation,
  getUsers,
  markAsRead
}; 