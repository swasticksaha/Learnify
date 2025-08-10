// routes/mediaStats.js
const express = require('express');
const router = express.Router();

module.exports = (mediaSoupStats) => {
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      workers: mediaSoupStats.getWorkers().length,
      routers: mediaSoupStats.getRouters().size,
      peers: mediaSoupStats.getPeers().size,
      rooms: mediaSoupStats.getRooms().size,
    });
  });

  router.get('/rooms', (req, res) => {
    const roomList = Array.from(mediaSoupStats.getRooms().entries()).map(([roomId, room]) => ({
      roomId,
      participantCount: room.participants.size,
      participants: Array.from(room.participants.values()).map(p => ({
        name: p.name,
        isHost: p.isHost
      }))
    }));
    res.json(roomList);
  });

  router.get('/room-exists/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const rooms = mediaSoupStats.getRooms();
  const exists = rooms.has(roomId) && rooms.get(roomId).participants.size > 0;
  res.json({ exists });
});

  return router;
};
