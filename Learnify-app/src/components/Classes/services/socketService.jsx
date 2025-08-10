import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.roomId = null;
    this.userName = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(serverUrl = 'http://localhost:5000') {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: false,
      secure: false,
      rejectUnauthorized: false,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection-failed', {
          error,
          message: 'Failed to connect after multiple attempts. Please check if the server is running on port 5000.',
        });
      }
      this.emit('connection-error', error);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        this.socket.connect();
      }
      this.emit('disconnected', { reason });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {});

    this.socket.on('reconnect', (attemptNumber) => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      this.emit('reconnection-failed');
    });

    this.setupEventListeners();

    return this.socket;
  }

  setupEventListeners() {
    this.socket.on('router-rtp-capabilities', (data) => {
      this.emit('router-rtp-capabilities', data);
    });

    this.socket.on('new-producer', (data) => {
      this.emit('new-producer', data);
    });

    this.socket.on('producer-closed', (data) => {
      this.emit('producer-closed', data);
    });

    this.socket.on('consumer-closed', (data) => {
      this.emit('consumer-closed', data);
    });

    this.socket.on('transport-closed', (data) => {
      this.emit('transport-closed', data);
    });

    this.socket.on('producer-paused', (data) => {
      this.emit('producer-paused', data);
    });

    this.socket.on('producer-resumed', (data) => {
      this.emit('producer-resumed', data);
    });

    this.socket.on('consumer-paused', (data) => {
      this.emit('consumer-paused', data);
    });

    this.socket.on('consumer-resumed', (data) => {
      this.emit('consumer-resumed', data);
    });

    this.socket.on('joined-room', (data) => {
      this.emit('joined-room', data);
    });

    this.socket.on('user-joined', (data) => {
      this.emit('user-joined', data);
    });

    this.socket.on('student-join-request', (data) => {
      console.log("🔥 student-join-request received in socketService:", data); // For debugging
      this.emit('student-join-request', data); // Forward to MeetingRoom.jsx
    });

    this.socket.on('user-left', (data) => {
      this.emit('user-left', data);
    });

    this.socket.on('participant-updated', (data) => {
      this.emit('participant-updated', data);
    });

    this.socket.on('host-changed', (data) => {
      this.emit('host-changed', data);
    });

    this.socket.on('new-message', (message) => {
      this.emit('new-message', message);
    });

    this.socket.on('user-screen-share', (data) => {
      this.emit('user-screen-share', data);
    });

    this.socket.on('offer', (data) => {
      this.emit('offer', data);
    });

    this.socket.on('answer', (data) => {
      this.emit('answer', data);
    });

    this.socket.on('ice-candidate', (data) => {
      this.emit('ice-candidate', data);
    });

    this.socket.on('peer-id-exchange', (data) => {
      this.emit('peer-id-exchange', data);
    });

    this.socket.on('existing-peers', (data) => {
      this.emit('existing-peers', data);
    });

    this.socket.on('announcement-added', (data) => {
      this.emit('announcement-added', data);
    });

    this.socket.on('assignment-added', (data) => {
      this.emit('assignment-added', data);
    });

    this.socket.on("people-updated", (data) => {
      this.emit("people-updated", data);
    });

    this.socket.on('join-denied', (data) => {
      console.log("❌ join-denied received globally", data);
      this.emit('join-denied', data);
    });

  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.roomId = null;
      this.userName = null;
      this.reconnectAttempts = 0;
    }
  }

  async testConnection(serverUrl = 'http://localhost:5000') {
    try {
      const response = await fetch(`${serverUrl}/api/health`);
      await response.json();
      return true;
    } catch (error) {
      return false;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {}
      });
    }
  }

  async getRtpCapabilities() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get-rtp-capabilities', {}, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.rtpCapabilities);
        }
      });
    });
  }

  async createWebRtcTransport(direction) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create-webrtc-transport', { direction }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async createTransport() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create-transport', {}, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async connectWebRtcTransport(transportId, dtlsParameters) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('connect-webrtc-transport', {
        transportId,
        dtlsParameters
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async connectTransport(transportId, dtlsParameters) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('connect-transport', {
        transportId,
        dtlsParameters
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async produce(transportId, kind, rtpParameters) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('produce', {
        transportId,
        kind,
        rtpParameters
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async consume(transportId, producerId, rtpCapabilities) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('consume', {
        transportId,
        producerId,
        rtpCapabilities
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async resumeConsumer(consumerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('resume-consumer', { consumerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async pauseConsumer(consumerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('pause-consumer', { consumerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async closeConsumer(consumerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('close-consumer', { consumerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async closeProducer(producerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('close-producer', { producerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async pauseProducer(producerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('pause-producer', { producerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async resumeProducer(producerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('resume-producer', { producerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  async closeTransport(transportId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('close-transport', { transportId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  setRtpCapabilities(rtpCapabilities) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('set-rtp-capabilities', { rtpCapabilities });
  }

  async getProducerStats(producerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get-producer-stats', { producerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.stats);
        }
      });
    });
  }

  async getConsumerStats(consumerId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get-consumer-stats', { consumerId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.stats);
        }
      });
    });
  }

  async getTransportStats(transportId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get-transport-stats', { transportId }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.stats);
        }
      });
    });
  }

  joinRoom(roomId, userName, profilePic) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.roomId = roomId;
    this.userName = userName;
    this.profilePic = profilePic;
    this.socket.emit('join-room', { roomId, userName, profilePic });
  }

  leaveRoom() {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('leave-room');
    this.roomId = null;
    this.userName = null;
  }

  sendMessage(message) {
    if (!this.socket || !this.isConnected || !this.roomId) {
      throw new Error('Not connected to a room');
    }
    this.socket.emit('send-message', { message });
  }

  toggleAudio(isMuted) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('toggle-audio', { isMuted });
  }

  toggleVideo(isVideoOn) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('toggle-video', { isVideoOn });
  }

  startScreenShare() {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('start-screen-share');
  }

  stopScreenShare() {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('stop-screen-share');
  }

  sendOffer(target, sdp) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('offer', { target, sdp });
  }

  sendAnswer(target, sdp) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('answer', { target, sdp });
  }

  sendIceCandidate(target, candidate) {
    if (!this.socket || !this.isConnected) {
      return;
    }
    this.socket.emit('ice-candidate', { target, candidate });
  }

  

  getSocketId() {
    return this.socket?.id || null;
  }

  joinClassroomTabRoom(classroomId) {
  if (this.socket && this.isConnected) {
    this.socket.emit('join-classroom-tab', { classroomId });
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getRoomId() {
    return this.roomId;
  }

  getUserName() {
    return this.userName;
  }

  getConnectionState() {
    return {
      isConnected: this.isConnected,
      socketId: this.getSocketId(),
      roomId: this.roomId,
      userName: this.userName,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

const socketService = new SocketService();

export default socketService;
