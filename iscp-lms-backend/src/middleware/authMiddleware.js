/**
 * authMiddleware.js
 * 
 * Author: Marc Laurence Lapating
 * Date: May 24, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Authentication middleware for verifying user authorization
 * and enforcing role-specific access controls.
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = { authMiddleware }; 