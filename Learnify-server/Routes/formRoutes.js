const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const bcrypt = require("bcrypt");
const multer = require('multer');
const path = require('path');
const authMiddleware = require("../MiddleWare/authMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

// FIXED: Registration with proper status code
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await new User({
      email,
      password: hashedPassword,
      provider: "local",
    }).save();

    // FIXED: Set consistent session structure
    req.session.user = {
      _id: newUser._id,
      email: newUser.email,
      username: newUser.username || null,
      role: newUser.role || null,
      profilePic: newUser.profilePic || null,
      provider: newUser.provider,
    };

    console.log("User registered:", newUser);

    // FIXED: Changed to status 200 to match frontend expectation
    res.status(200).json({ 
      message: "User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// FIXED: Login with setup status check
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user registered with social provider
    if (!user.password) {
      return res.status(401).json({ 
        message: "This account was created using social login. Please use the appropriate social login button." 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // FIXED: Consistent session structure with setup status
    const setupCompleted = !!(user.username && user.role);
    
    req.session.user = {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      profilePic: user.profilePic,
      provider: user.provider,
    };

    res.json({ 
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        provider: user.provider,
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// FIXED: Logout without Passport.js
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction failed:", err);
      return res.status(500).json({ message: "Session destruction failed" });
    }
    res.clearCookie('connect.sid'); // Clear session cookie
    res.json({ message: "Logout successful" });
  });
});
 
router.get("/user", (req, res) => {
  console.log('User endpoint - Session:', req.session); // Debug
  console.log('User endpoint - User:', req.session?.user); // Debug
  
  if (req.session && req.session.user) {
    res.json({ 
      user: {
        id: req.session.user._id,
        email: req.session.user.email,
        username: req.session.user.username,
        role: req.session.user.role,
        profilePic: req.session.user.profilePic,
        provider: req.session.user.provider,
      }
    });
  } else {
    console.log('User endpoint - No authenticated user found');
    res.status(401).json({ message: "Not authenticated" });
  }
});

// FIXED: Setup with updated session
router.post("/setup", authMiddleware, upload.single("profilePic"), async (req, res) => {
  try {
    const { username, role } = req.body;
    const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

    if (!username || !role) {
      return res.status(400).json({ message: "Username and role are required" });
    }

    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.session.user._id);
    console.log("Setup requested for user:", user?._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user
    user.username = username;
    user.role = role;
    if (profilePic) user.profilePic = profilePic;

    await user.save();

    // FIXED: Update session with setup completion
    req.session.user = {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      profilePic: user.profilePic,
      provider: user.provider,
    };

    res.json({ 
      message: "Profile updated successfully", 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      }
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;