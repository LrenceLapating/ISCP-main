/**
 * authRoutes.js
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: May 17, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Authentication routes for user registration, login,
 * logout, and current user information retrieval.
 */

const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router; 