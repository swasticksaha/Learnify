const mongoose = require('mongoose');
const calenderEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date : { type: Date, required: true },
  time: { type: String},
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  classroomName: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('CalenderEvent', calenderEventSchema);