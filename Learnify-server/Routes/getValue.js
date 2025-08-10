const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../Middleware/authMiddleware.js');
const User = require('../Model/User.js');

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up multer for image uploads with file validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Add file extension validation
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not found in session' });
    }

    const { username, email, profilePic, role } = req.user;
    console.log("Profile requested for user:", req.user._id);
    
    res.json({ 
      username: username || '', 
      email: email || '', 
      profilePic: profilePic && profilePic !== '/image.png' ? profilePic : '/image.png',
      role: role || 'student'
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT profile (with optional image)
router.put('/profile', authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not found in session' });
    }

    const { username } = req.body;
    
    // Validate username
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const update = { username: username.trim() };

    // Handle profile picture update
    if (req.file) {
      const oldProfilePic = req.user.profilePic;
      update.profilePic = `/uploads/${req.file.filename}`;
      
      // Delete old profile picture if it exists and is not the default
      if (oldProfilePic && oldProfilePic !== '/image.png' && !oldProfilePic.includes('googleusercontent')) {
        const oldFilePath = path.join(__dirname, '..', oldProfilePic);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, 
      update, 
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the session user data
    req.user.username = user.username;
    if (user.profilePic) {
      req.user.profilePic = user.profilePic;
    }

    res.json({
      username: user.username,
      email: user.email,
      profilePic: user.profilePic && user.profilePic !== '/image.png' ? user.profilePic : '/image.png'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email already exists' 
      });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: 'Only image files are allowed!' });
  }
  next(error);
});

module.exports = router;