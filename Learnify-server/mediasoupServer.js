let globalIo = null;

const setupMediaServer= async (server) => {
  const socketIo = require('socket.io');
  const mediasoup = require('mediasoup');
  const config = require('./Config/Mediasoup.js');

  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });
  globalIo = io; 
  // MediaSoup workers and routers
  const workers = [];
  const routers = new Map();
  const rooms = new Map();
  const pendingJoins = new Map();
  const peers = new Map();
  const transports = new Map();
  const producers = new Map();
  const consumers = new Map();

  // Initialize MediaSoup workers
  async function initializeWorkers() {
    const { numWorkers } = config.mediasoup;
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.logLevel,
        logTags: config.mediasoup.worker.logTags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
      });

      worker.on('died', (error) => {
        console.error('MediaSoup worker died:', error);
        setTimeout(() => process.exit(1), 2000);
      });

      workers.push(worker);
      console.log(`🔧 MediaSoup worker ${i + 1} created`);
    }
  }

  // Get next available worker
  function getNextWorker() {
    const worker = workers[Math.floor(Math.random() * workers.length)];
    return worker;
  }

  // Create router for a room
  async function createRouter(roomId) {
    const worker = getNextWorker();
    
    const router = await worker.createRouter({
      mediaCodecs: config.mediasoup.router.mediaCodecs,
    });

    routers.set(roomId, router);
    console.log(`📡 Router created for room ${roomId}`);
    return router;
  }

  // Create WebRTC transport
  async function createWebRtcTransport(router, callback) {
    try {
      const transport = await router.createWebRtcTransport({
        listenIps: config.mediasoup.webRtcTransport.listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        initialAvailableOutgoingBitrate: config.mediasoup.webRtcTransport.initialAvailableOutgoingBitrate,
        minimumAvailableOutgoingBitrate: config.mediasoup.webRtcTransport.minimumAvailableOutgoingBitrate,
        maxSctpMessageSize: config.mediasoup.webRtcTransport.maxSctpMessageSize,
      });

      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          transport.close();
        }
      });

      transport.on('close', () => {
        console.log('🔌 Transport closed');
      });

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });

      return transport;
    } catch (error) {
      console.error('Error creating WebRTC transport:', error);
      callback({ error: error.message });
    }
  }

  await initializeWorkers();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    socket.on('join-classroom-tab', ({ classroomId }) => {
      socket.join(classroomId);
      console.log(`📚 Socket ${socket.id} joined classroom tab room ${classroomId}`);
    });

    // Join room
    socket.on('join-room', async (data) => {
      const { roomId, userName, profilePic } = data;

      try {
        const isRoomExisting = rooms.has(roomId);
        const router = routers.get(roomId) || await createRouter(roomId);

        if (!isRoomExisting) {
          // First joiner = host
          rooms.set(roomId, {
            participants: new Map(),
            messages: []
          });
          console.log(`🏠 Room ${roomId} created`);
        }

        const room = rooms.get(roomId);
        const isHost = room.participants.size === 0;

        // If not host, wait for approval
        if (!isHost) {
          const host = Array.from(room.participants.values()).find(p => p.isHost);
          if (!host) {
            socket.emit('join-denied', { reason: 'Waiting for teacher to start the session.' });
            return;
          }

          // Save this join request
          if (!pendingJoins.has(roomId)) pendingJoins.set(roomId, []);
          pendingJoins.get(roomId).push({ socket, userName, profilePic });

          // Notify host
          io.to(host.id).emit('student-join-request', {
            socketId: socket.id,
            userName,
            profilePic
          });

          console.log(`⏳ Approval requested for ${userName} in ${roomId}`);
          return; // wait for approval
        }

        // Host OR approved student
        proceedToJoin(socket, roomId, userName, profilePic);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    function proceedToJoin(socket, roomId, userName, profilePic) {
      socket.join(roomId);
      const room = rooms.get(roomId);

      const peer = {
        id: socket.id,
        name: userName,
        roomId,
        profilePic,
        isMuted: false,
        isVideoOn: true,
        isHost: room.participants.size === 0,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map(),
        rtpCapabilities: null
      };

      peers.set(socket.id, peer);
      room.participants.set(socket.id, peer);

      const rtpCapabilities = routers.get(roomId).rtpCapabilities;

      socket.emit('joined-room', {
        success: true,
        peer,
        participants: Array.from(room.participants.values()),
        messages: room.messages,
        rtpCapabilities
      });

      socket.emit('router-rtp-capabilities', { rtpCapabilities });

      socket.to(roomId).emit('user-joined', {
        user: peer,
        participants: Array.from(room.participants.values())
      });

      console.log(`✅ ${userName} joined room ${roomId}`);
    }

    socket.on('approve-join', ({ roomId, socketId }) => {
      const requests = pendingJoins.get(roomId) || [];
      const req = requests.find(r => r.socket.id === socketId);
      if (!req) return;

      pendingJoins.set(roomId, requests.filter(r => r.socket.id !== socketId));
      proceedToJoin(req.socket, roomId, req.userName, req.profilePic);
    });

    socket.on('reject-join', ({ roomId, socketId }) => {
      const requests = pendingJoins.get(roomId) || [];
      const req = requests.find(r => r.socket.id === socketId);
      if (!req) return;

      pendingJoins.set(roomId, requests.filter(r => r.socket.id !== socketId));
      req.socket.emit('join-denied', { reason: 'The teacher rejected your join request.' });
    });


    // Create WebRTC transport
    socket.on('create-transport', async (data, callback) => {
      try {
        const peer = peers.get(socket.id);
        if (!peer) {
          throw new Error('Peer not found');
        }
        
        const router = routers.get(peer.roomId);
        if (!router) {
          throw new Error('Router not found');
        }
        
        const transport = await createWebRtcTransport(router, callback);
        
        // Store transport
        transports.set(transport.id, transport);
        peer.transports.set(transport.id, transport);
        
        console.log(`🚛 Transport created for peer ${socket.id}`);
      } catch (error) {
        console.error('Error creating transport:', error);
        callback({ error: error.message });
      }
    });

    // Connect transport
    socket.on('connect-transport', async (data, callback) => {
      try {
        const { transportId, dtlsParameters } = data;
        const transport = transports.get(transportId);
        
        if (!transport) {
          throw new Error('Transport not found');
        }
        
        await transport.connect({ dtlsParameters });
        callback({ success: true });
        
        console.log(`🔗 Transport connected: ${transportId}`);
      } catch (error) {
        console.error('Error connecting transport:', error);
        callback({ error: error.message });
      }
    });

    // Create producer
    socket.on('produce', async (data, callback) => {
      try {
        const { transportId, kind, rtpParameters } = data;
        const transport = transports.get(transportId);
        
        if (!transport) {
          throw new Error('Transport not found');
        }
        
        const producer = await transport.produce({
          kind,
          rtpParameters,
        });
        
        const peer = peers.get(socket.id);
        if (!peer) {
          throw new Error('Peer not found');
        }
        
        // Store producer
        producers.set(producer.id, producer);
        peer.producers.set(producer.id, producer);
        
        producer.on('transportclose', () => {
          producer.close();
          producers.delete(producer.id);
          peer.producers.delete(producer.id);
        });
        
        callback({ id: producer.id });
        
        // Notify other participants about new producer
        socket.to(peer.roomId).emit('new-producer', {
          producerId: producer.id,
          peerId: socket.id,
          kind
        });
        
        console.log(`📹 Producer created: ${producer.id} (${kind})`);
      } catch (error) {
        console.error('Error creating producer:', error);
        callback({ error: error.message });
      }
    });

    // Create consumer
    socket.on('consume', async (data, callback) => {
      try {
        const { transportId, producerId, rtpCapabilities } = data;
        const transport = transports.get(transportId);
        
        if (!transport) {
          throw new Error('Transport not found');
        }
        
        const peer = peers.get(socket.id);
        if (!peer) {
          throw new Error('Peer not found');
        }
        
        const router = routers.get(peer.roomId);
        if (!router) {
          throw new Error('Router not found');
        }
        
        if (!router.canConsume({ producerId, rtpCapabilities })) {
          throw new Error('Cannot consume this producer');
        }
        
        const consumer = await transport.consume({
          producerId,
          rtpCapabilities,
          paused: true, // Start paused
        });
        
        // Store consumer
        consumers.set(consumer.id, consumer);
        peer.consumers.set(consumer.id, consumer);
        
        consumer.on('transportclose', () => {
          consumer.close();
          consumers.delete(consumer.id);
          peer.consumers.delete(consumer.id);
        });
        
        callback({
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
        
        console.log(`📺 Consumer created: ${consumer.id}`);
      } catch (error) {
        console.error('Error creating consumer:', error);
        callback({ error: error.message });
      }
    });

    // Resume consumer
    socket.on('resume-consumer', async (data, callback) => {
      try {
        const { consumerId } = data;
        const consumer = consumers.get(consumerId);
        
        if (!consumer) {
          throw new Error('Consumer not found');
        }
        
        await consumer.resume();
        callback({ success: true });
        
        console.log(`▶️ Consumer resumed: ${consumerId}`);
      } catch (error) {
        console.error('Error resuming consumer:', error);
        callback({ error: error.message });
      }
    });

    // Get existing producers
    socket.on('get-producers', (callback) => {
      try {
        const peer = peers.get(socket.id);
        if (!peer) {
          throw new Error('Peer not found');
        }
        
        const room = rooms.get(peer.roomId);
        if (!room) {
          throw new Error('Room not found');
        }
        
        const producerList = [];
        
        // Get all producers from other participants
        for (const [participantId, participant] of room.participants) {
          if (participantId !== socket.id) {
            for (const [producerId, producer] of participant.producers) {
              producerList.push({
                producerId,
                peerId: participantId,
                kind: producer.kind
              });
            }
          }
        }
        
        callback({ producers: producerList });
      } catch (error) {
        console.error('Error getting producers:', error);
        callback({ error: error.message });
      }
    });

    // Set RTP capabilities
    socket.on('set-rtp-capabilities', (data) => {
      const { rtpCapabilities } = data;
      const peer = peers.get(socket.id);
      
      if (peer) {
        peer.rtpCapabilities = rtpCapabilities;
        console.log(`🎯 RTP capabilities set for peer ${socket.id}`);
      }
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      const peer = peers.get(socket.id);
      if (!peer) return;
      
      const message = {
        id: Date.now(),
        sender: peer.name,
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date()
      };
      
      const room = rooms.get(peer.roomId);
      if (room) {
        room.messages.push(message);
        io.to(peer.roomId).emit('new-message', message);
      }
    });

    // Handle media state changes
    socket.on('toggle-audio', (data) => {
      const peer = peers.get(socket.id);
      if (!peer) return;
      
      peer.isMuted = data.isMuted;
      const room = rooms.get(peer.roomId);
      if (room) {
        room.participants.set(socket.id, peer);
        io.to(peer.roomId).emit('participant-updated', {
          userId: socket.id,
          isMuted: data.isMuted,
          participants: Array.from(room.participants.values())
        });
      }
    });

    socket.on('toggle-video', (data) => {
      const peer = peers.get(socket.id);
      if (!peer) return;
      
      peer.isVideoOn = data.isVideoOn;
      const room = rooms.get(peer.roomId);
      if (room) {
        room.participants.set(socket.id, peer);
        io.to(peer.roomId).emit('participant-updated', {
          userId: socket.id,
          isVideoOn: data.isVideoOn,
          participants: Array.from(room.participants.values())
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const peer = peers.get(socket.id);
      if (peer) {
        // Close all producers
        for (const [producerId, producer] of peer.producers) {
          producer.close();
          producers.delete(producerId);
        }
        
        // Close all consumers
        for (const [consumerId, consumer] of peer.consumers) {
          consumer.close();
          consumers.delete(consumerId);
        }
        
        // Close all transports
        for (const [transportId, transport] of peer.transports) {
          transport.close();
          transports.delete(transportId);
        }
        
        const room = rooms.get(peer.roomId);
        if (room) {
          room.participants.delete(socket.id);
          
          // Notify other participants
          socket.to(peer.roomId).emit('user-left', {
            userId: socket.id,
            userName: peer.name,
            participants: Array.from(room.participants.values())
          });
          
          // Clean up empty room
          if (room.participants.size === 0) {
            rooms.delete(peer.roomId);
            const router = routers.get(peer.roomId);
            if (router) {
              router.close();
              routers.delete(peer.roomId);
            }
            console.log(`🗑️ Room ${peer.roomId} cleaned up`);
          }
        }
        
        peers.delete(socket.id);
        console.log(`❌ Peer ${socket.id} disconnected`);
      }
    });
  });

  return {
    mediaSoupStats: {
      getWorkers: () => workers,
      getRooms: () => rooms,
      getPeers: () => peers,
      getRouters: () => routers
    }
  };

};

module.exports = {
  setupMediaServer,
  getSocketIO: () => globalIo
};
