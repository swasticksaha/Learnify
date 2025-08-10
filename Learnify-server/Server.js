const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const path = require('path');
const http = require("http");
require('dotenv').config();

require("./Config/passport.js");
const socialRoutes = require("./Routes/socialRoutes.js");
const formRoutes = require("./Routes/formRoutes.js");
const getValue = require("./Routes/getValue.js");
const driveRoutes = require("./Routes/driveRoutes.js");
const classroomRoutes = require("./Routes/classroomRoutes.js");
const CalenderRoutes = require("./Routes/CalenderRoutes.js");
const { setupMediaServer, getSocketIO } = require("./mediasoupServer.js");
const mediaStatsRoutes = require("./Routes/MediasoupRoutes.js");


const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({ 
  secret: process.env.SESSION_SECRET || "top-secret-key",
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/image.png', express.static(path.join(__dirname, 'public', 'image.png')));

// Routes
app.use("/auth", socialRoutes);
app.use("/api", formRoutes);
app.use("/api/user", getValue);
app.use("/api/drive", driveRoutes);
app.use("/api/calendar", CalenderRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/learnify-admin")
  .then(() => {
    console.log("Connected to MongoDB");
    
    // Setup MediaSoup with socket
    setupMediaServer(server).then(({ mediaSoupStats }) => {
      // Mount the MediaSoup health/stats routes
      app.use('/api', mediaStatsRoutes(mediaSoupStats));
      const io = getSocketIO();
      app.use("/api/classrooms", (req, res, next) => { req.io = io; next(); }, classroomRoutes);
      // Start combined server
      server.listen(process.env.PORT || 5000, () =>
        console.log(`🚀 Server + MediaSoup running on port ${process.env.PORT || 5000}`)
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
