const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  announcements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Announcement" }],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
  currentSessionLink: { type: String, default: null }, // for live class video call URL
  currentSessionTitle: { type: String, default: null }, // NEW
  currentSessionDescription: { type: String, default: null }, // NEW
}, { timestamps: true });

module.exports = mongoose.model("Classroom", classroomSchema);
