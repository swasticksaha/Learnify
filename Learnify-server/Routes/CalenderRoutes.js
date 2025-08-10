const express = require('express');
const router = express.Router();
const CalenderEvent = require('../Model/CalenderEvent');
const authMiddleware = require('../Middleware/authMiddleware');
const Classroom = require('../Model/Classroom');

router.post('/create', authMiddleware, async (req, res) => {
    const { title, date, time, classroomId } = req.body;
    
    try{
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const calenderEvent = new CalenderEvent({
            title,
            date,
            time,
            classroomId: classroom._id,
            classroomName: classroom.name,
            createdBy: req.user._id
        });

        await calenderEvent.save();
        
        res.status(201).json({ message: 'Event created successfully', calenderEvent });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.get('/list', authMiddleware, async (req, res) => {
    try{
        const userId = req.user._id;

        // First, let's see what classrooms this user has access to
        const classrooms = await Classroom.find(
            { $or: [
                { teacher: userId },
                { students: { $in: [userId] } }
            ]});

        const classroomIds = classrooms.map(classroom => classroom._id);

        // Now get events for this user's classrooms
        const events = await CalenderEvent.find({ 
            classroomId: { $in: classroomIds.map(id => id.toString()) } 
        }).sort({ date: 1, time: 1 });

        res.status(200).json({ events });
        
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

module.exports = router;
