const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
  providerId: { type: String, default: '' },
  profilePic: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
    required: true
  },
  classroomsCreated: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom"
    }
  ],
  classroomsJoined: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom"
    }
  ]
});

const User = mongoose.model("User", userSchema);
module.exports = User;
