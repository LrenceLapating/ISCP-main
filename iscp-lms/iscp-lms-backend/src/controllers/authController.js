const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

const register = async (req, res) => {
  const { email, password, fullName, role, campus } = req.body;
  
  if (!email || !password || !fullName || !role || !campus) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Validate role
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  try {
    // Check if user already exists
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (email, password, full_name, role, campus) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, fullName, role, campus]
    );
    
    // Generate JWT token
    const user = {
      id: result.insertId,
      email,
      fullName,
      role,
      campus
    };
    
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Send response without password
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        email,
        fullName,
        role,
        campus
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const userForToken = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      campus: user.campus
    };
    
    const token = jwt.sign(userForToken, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Send response without password
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        campus: user.campus,
        profileImage: user.profile_image
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};

const getCurrentUser = async (req, res) => {
  try {
    // Get user from database to ensure we have the latest data
    const [users] = await pool.query('SELECT id, email, full_name, role, campus FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Get profile image from user_settings if exists
    const [userSettings] = await pool.query(
      'SELECT profile_picture FROM user_settings WHERE user_id = ?', 
      [req.user.id]
    );
    
    const profileImage = userSettings.length > 0 ? userSettings[0].profile_picture : null;
    
    return res.status(200).json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      campus: user.campus,
      profileImage: profileImage
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
}; 