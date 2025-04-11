const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// All routes are protected with authentication
router.use(authMiddleware);

// Get all conversations for the current user
router.get('/conversations', messageController.getConversations);

// Get users for starting a new conversation
router.get('/users', messageController.getUsers);

// Create a new conversation
router.post('/conversations', messageController.createConversation);

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);

// Create a new message in a conversation
router.post('/conversations/:conversationId/messages', messageController.createMessage);

// Mark all messages in a conversation as read
router.post('/conversations/:conversationId/read', messageController.markAsRead);

module.exports = router; 