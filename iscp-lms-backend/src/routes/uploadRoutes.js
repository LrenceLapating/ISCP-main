/**
 * uploadRoutes.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 23, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: File upload routes for handling document, image, and
 * other file uploads across the application.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

// Ensure directories exist
const assignmentUploadsDir = path.join(__dirname, '../../uploads/assignments');
const submissionUploadsDir = path.join(__dirname, '../../uploads/submissions');
const messageUploadsDir = path.join(__dirname, '../../uploads/messages');

if (!fs.existsSync(assignmentUploadsDir)) {
  fs.mkdirSync(assignmentUploadsDir, { recursive: true });
}

if (!fs.existsSync(submissionUploadsDir)) {
  fs.mkdirSync(submissionUploadsDir, { recursive: true });
}

if (!fs.existsSync(messageUploadsDir)) {
  fs.mkdirSync(messageUploadsDir, { recursive: true });
}

// Configure storage for assignment files
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'assignment-' + uniqueSuffix + fileExt);
  }
});

// Configure storage for submission files
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, submissionUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'submission-' + uniqueSuffix + fileExt);
  }
});

// Configure storage for message attachments
const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'message-' + uniqueSuffix + fileExt);
  }
});

// Create upload middleware
const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

const uploadMessage = multer({
  storage: messageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Upload route for assignment files
router.post('/assignment', verifyToken, uploadAssignment.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading assignment file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload route for submission files
router.post('/submission', verifyToken, uploadSubmission.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/submissions/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading submission file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload route for message attachments
router.post('/message', verifyToken, uploadMessage.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/messages/${req.file.filename}`;
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading message attachment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 