const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Classroom = require("../Model/Classroom");
const User = require("../Model/User");
const Assignment = require("../Model/Assignment");
const Announcement = require("../Model/Announcement");
const Submission = require("../Model/Submission");
const authMiddleware = require("../Middleware/authMiddleware");

// Create classroom (teacher only)
router.post("/create", authMiddleware, async (req, res) => {
  const { name } = req.body;
  const user = req.user;

  if (user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can create classrooms" });
  }

  const code = crypto.randomBytes(3).toString("hex");

  const classroom = new Classroom({
    name,
    code,
    teacher: user._id
  });

  await classroom.save();
  await User.findByIdAndUpdate(user._id, { $push: { classroomsCreated: classroom._id } });

  res.status(201).json({ message: "Classroom created", classroom });
});

// Join classroom (student only)
router.post("/join", authMiddleware, async (req, res) => {
  const { code } = req.body;
  const user = req.user;

  const classroom = await Classroom.findOne({ code });
  if (!classroom) return res.status(404).json({ message: "Classroom not found" });

  if (classroom.students.includes(user._id)) {
    return res.status(400).json({ message: "Already joined this classroom" });
  }

  classroom.students.push(user._id);
  await classroom.save();

  await User.findByIdAndUpdate(user._id, { $push: { classroomsJoined: classroom._id } });

  res.json({ message: "Joined classroom", classroom });
  req.io.to(classroom._id.toString()).emit("people-updated", { classroomId: classroom._id });
});

// Get user's classrooms (created and joined)
router.get("/my", authMiddleware, async (req, res) => {
  const user = req.user;

  const createdClassrooms = await Classroom.find({ teacher: user._id });
  const joinedClassrooms = await Classroom.find({ students: user._id });

  res.json({
    created: createdClassrooms,
    joined: joinedClassrooms
  });
});

// Get classroom info
router.get("/:id", authMiddleware, async (req, res) => {
  const classroom = await Classroom.findById(req.params.id)
    .populate("teacher", "username email")
    .populate("students", "username email");

  if (!classroom) return res.status(404).json({ message: "Classroom not found" });

  res.json(classroom);
});

// Get people in classroom
router.get("/:id/people", authMiddleware, async (req, res) => {
  const classroom = await Classroom.findById(req.params.id)
    .populate("teacher", "username email profilePic")
    .populate("students", "username email profilePic");

  if (!classroom) return res.status(404).json({ message: "Classroom not found" });

  res.json({
    teacher: classroom.teacher,
    students: classroom.students
  });
});

// ANNOUNCEMENTS
// Create announcement
router.post("/:id/announcements", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const classroomId = req.params.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Check if user is teacher of this classroom or a student in it
    const hasAccess = classroom.teacher.toString() === req.user._id.toString() || 
                     classroom.students.includes(req.user._id);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Only teachers can post announcements
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can post announcements" });
    }

    const announcement = await Announcement.create({
      classroom: classroomId,
      author: req.user._id,
      message: message.trim()
    });

    // Populate the author field for the response
    await announcement.populate("author", "username email profilePic");

    await Classroom.findByIdAndUpdate(classroomId, {
      $push: { announcements: announcement._id }
    });

    res.status(201).json(announcement);
    req.io.to(classroomId).emit("announcement-added", announcement);
    console.log("📣 Emitting announcement-added to room", classroomId);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get announcements
router.get("/:id/announcements", authMiddleware, async (req, res) => {
  try {
    const classroomId = req.params.id;

    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    const hasAccess = classroom.teacher.toString() === req.user._id.toString() || 
                     classroom.students.includes(req.user._id);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const announcements = await Announcement.find({ classroom: classroomId })
      .populate("author", "username email profilePic role")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit announcement
router.put("/:id/announcements/:announcementId", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const { id: classroomId, announcementId } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find the announcement
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Check if the announcement belongs to this classroom
    if (announcement.classroom.toString() !== classroomId) {
      return res.status(400).json({ message: "Announcement does not belong to this classroom" });
    }

    // Check if user is the author of the announcement
    if (announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own announcements" });
    }

    // Update the announcement
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementId,
      { 
        message: message.trim(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("author", "username email profilePic");

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete announcement
router.delete("/:id/announcements/:announcementId", authMiddleware, async (req, res) => {
  try {
    const { id: classroomId, announcementId } = req.params;

    // Find the announcement
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Check if the announcement belongs to this classroom
    if (announcement.classroom.toString() !== classroomId) {
      return res.status(400).json({ message: "Announcement does not belong to this classroom" });
    }

    // Check if user is the author of the announcement
    if (announcement.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own announcements" });
    }

    // Delete the announcement
    await Announcement.findByIdAndDelete(announcementId);

    // Remove from classroom's announcements array
    await Classroom.findByIdAndUpdate(classroomId, {
      $pull: { announcements: announcementId }
    });

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ASSIGNMENTS
router.post("/:id/assignments", authMiddleware, async (req, res) => {
  const { title, description, dueDate, fileUrl } = req.body;

  if (req.user.role !== "teacher") {
    return res.status(403).json({ message: "Only teachers can post assignments" });
  }

  const assignment = await Assignment.create({
    classroom: req.params.id,
    author: req.user._id,
    title,
    description,
    dueDate,
    fileUrl
  });

  await Classroom.findByIdAndUpdate(req.params.id, {
    $push: { assignments: assignment._id }
  });

  res.status(201).json({ message: "Assignment posted", assignment });
  req.io.to(req.params.id).emit("assignment-added", assignment);
  console.log("📣 Emitting assignment-added to room", req.params.id);
});

router.get("/:id/assignments", authMiddleware, async (req, res) => {
  const assignments = await Assignment.find({ classroom: req.params.id })
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res.json(assignments);
});

router.get("/:id/submissions/my", authMiddleware, async (req, res) => {
  try {
    const classroomId = req.params.id;
    const studentId = req.user._id;

    // Verify user is a student and has access to this classroom
    if (req.user.role !== "student") {
      return res.status(403).json({ 
        message: "Only students can view their submissions" 
      });
    }

    // Verify student is enrolled in this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom || !classroom.students.includes(studentId)) {
      return res.status(403).json({ message: "Access denied to this classroom" });
    }

    // Find all submissions by this student in this classroom
    const submissions = await Submission.find({
      studentId: studentId,
      classroomId: classroomId
    })
    .populate("assignmentId", "title description dueDate")
    .sort({ submittedAt: -1 });

    res.json(submissions);

  } catch (error) {
    console.error("Error fetching student submissions:", error);
    res.status(500).json({ 
      message: "Failed to fetch submissions"
    });
  }
});

router.post("/:id/assignments/:assignmentId/submit", authMiddleware, async (req, res) => {
  try {
    const classroomId = req.params.id;
    const { assignmentId } = req.params;
    const { text, fileUrl } = req.body;
    const studentId = req.user._id;

    // Verify user is a student
    if (req.user.role !== "student") {
      return res.status(403).json({ 
        message: "Only students can submit assignments" 
      });
    }

    // Validate input
    if (!text?.trim() && !fileUrl?.trim()) {
      return res.status(400).json({ 
        message: "Please provide either text submission or file attachment" 
      });
    }

    // Verify assignment exists and belongs to the classroom
    const assignment = await Assignment.findOne({
      _id: assignmentId,
      classroom: classroomId
    });

    if (!assignment) {
      return res.status(404).json({ 
        message: "Assignment not found" 
      });
    }

    // Check if student has already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId: assignmentId,
      studentId: studentId
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: "You have already submitted this assignment" 
      });
    }

    // Create new submission
    const submission = new Submission({
      assignmentId: assignmentId,
      studentId: studentId,
      classroomId: classroomId,
      text: text?.trim() || "",
      fileUrl: fileUrl?.trim() || "",
      submittedAt: new Date(),
      status: "submitted"
    });

    await submission.save();

    // Populate assignment details for response
    await submission.populate("assignmentId", "title description dueDate");

    res.status(201).json({
      message: "Assignment submitted successfully",
      submission: submission
    });

  } catch (error) {
    console.error("Error submitting assignment:", error);
    
    // Handle duplicate submission error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "You have already submitted this assignment" 
      });
    }

    res.status(500).json({ 
      message: "Failed to submit assignment"
    });
  }
});

router.get('/:id/assignments/:assignmentId/submissions', authMiddleware, async (req, res) => {
  try {
    const { id: classroomId, assignmentId } = req.params;
    const userId = req.user._id;

    // 1. Verify classroom and teacher
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        error: 'Classroom not found',
        code: 'CLASSROOM_NOT_FOUND'
      });
    }
    if (classroom.teacher.toString() !== userId.toString()) {
      return res.status(403).json({
        error: 'Access denied. Only teachers can view submissions',
        code: 'UNAUTHORIZED_ACCESS'
      });
    }

    // 2. Verify assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found',
        code: 'ASSIGNMENT_NOT_FOUND'
      });
    }
    if (assignment.classroom.toString() !== classroomId.toString()) {
      return res.status(403).json({
        error: 'Assignment does not belong to this classroom',
        code: 'ASSIGNMENT_CLASSROOM_MISMATCH'
      });
    }

    // 3. Get students in the classroom
    const studentsInClass = await User.find({
      _id: { $in: classroom.students },
      role: 'student'
    }).select('_id username email');

    // 4. Get submissions for the assignment
    const submissions = await Submission.find({ assignmentId })
      .populate('studentId', 'username email _id')
      .sort({ createdAt: -1 });

    const submittedStudentIds = new Set(submissions.map(s => s.studentId._id.toString()));

    const formattedSubmissions = submissions.map(submission => ({
      _id: submission._id,
      assignmentId: submission.assignmentId,
      student: {
        _id: submission.studentId._id,
        username: submission.studentId.username,
        email: submission.studentId.email
      },
      text: submission.text,
      fileUrl: submission.fileUrl,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      isLateSubmission: new Date(submission.createdAt) > new Date(assignment.dueDate)
    }));

    const studentsNotSubmitted = studentsInClass.filter(
      student => !submittedStudentIds.has(student._id.toString())
    );

    res.json({
      submissions: formattedSubmissions,
      metadata: {
        totalStudents: studentsInClass.length,
        submittedCount: submissions.length,
        pendingCount: studentsNotSubmitted.length,
        assignmentTitle: assignment.title,
        dueDate: assignment.dueDate,
        studentsNotSubmitted: studentsNotSubmitted.map(s => ({
          _id: s._id,
          username: s.username,
          email: s.email
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// VIDEO SESSION
router.post("/:id/video", authMiddleware, async (req, res) => {
  const { link, title, description } = req.body;

  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      {
        currentSessionLink: link,
        currentSessionTitle: title,
        currentSessionDescription: description,
      },
      { new: true }
    );

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({
      message: "Live session started",
      link: classroom.currentSessionLink,
      title: classroom.currentSessionTitle,
      description: classroom.currentSessionDescription,
    });
  } catch (err) {
    console.error("Failed to create session:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/video", authMiddleware, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json({
      link: classroom.currentSessionLink,
      title: classroom.currentSessionTitle,
      description: classroom.currentSessionDescription,
    });
  } catch (err) {
    console.error("Failed to fetch session:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;