import * as mediasoupClient from 'mediasoup-client';
import socketService from './socketService';

class MediaSoupService  {
  constructor() {
    this.device = null;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
    this.isInitializing = false;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.isProducing = false;
    this.isScreenSharing = false;
    this.originalStream = null;
  }

  async initialize(rtpCapabilities) {
    if (this.device?.loaded) {
      return;
    }
    if (this.isInitializing) {
      return;
    }
    try {
      this.isInitializing = true;
      this.device = new mediasoupClient.Device();
      await this.device.load({ routerRtpCapabilities: rtpCapabilities });
      const safeCaps = JSON.parse(JSON.stringify(this.device.rtpCapabilities));
      socketService.socket.emit('set-rtp-capabilities', {
        rtpCapabilities: safeCaps
      });
      this.isInitialized = true;
      this.setupSocketListeners();
      return true;
    } catch (error) {
      this.emit("device-error", error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  setupSocketListeners() {
    socketService.on('new-producer', async (data) => {
      const { producerId, peerId, kind } = data;
      await this.createConsumer(producerId, peerId, kind);
    });
    socketService.on('user-left', (data) => {
      const { userId } = data;
      this.cleanupConsumersForPeer(userId);
    });
  }

  async createSendTransport() {
    try {
      const transportParams = await this.createTransport();
      this.sendTransport = this.device.createSendTransport(transportParams);
      this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.connectTransport(transportParams.id, dtlsParameters);
          callback();
        } catch (error) {
          errback(error);
        }
      });
      this.sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const producerId = await this.createProducer(transportParams.id, kind, rtpParameters);
          callback({ id: producerId });
        } catch (error) {
          errback(error);
        }
      });
      this.sendTransport.on('connectionstatechange', (state) => {
        if (state === 'failed') {
          this.emit('transport-error', 'Send transport failed');
        }
      });
      return this.sendTransport;
    } catch (error) {
      throw error;
    }
  }

  async createRecvTransport() {
    try {
      const transportParams = await this.createTransport();
      this.recvTransport = this.device.createRecvTransport(transportParams);
      this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.connectTransport(transportParams.id, dtlsParameters);
          callback();
        } catch (error) {
          errback(error);
        }
      });
      this.recvTransport.on('connectionstatechange', (state) => {
        if (state === 'failed') {
          this.emit('transport-error', 'Receive transport failed');
        }
      });
      return this.recvTransport;
    } catch (error) {
      throw error;
    }
  }

  async createTransport() {
    return new Promise((resolve, reject) => {
      socketService.socket.emit('create-transport', {}, (response) => {
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
      socketService.socket.emit('connect-transport', {
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

  async createProducer(transportId, kind, rtpParameters) {
    return new Promise((resolve, reject) => {
      socketService.socket.emit('produce', {
        transportId,
        kind,
        rtpParameters
      }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.id);
        }
      });
    });
  }

  async initializeLocalStream(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.emit('local-stream', this.localStream);
      return this.localStream;
    } catch (error) {
      this.emit('media-error', error);
      throw error;
    }
  }

  async startProducing() {
    if (!this.localStream || !this.sendTransport) {
      throw new Error('Local stream or send transport not available');
    }
    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const videoProducer = await this.sendTransport.produce({
          track: videoTrack
        });
        this.producers.set('video', videoProducer);
        videoProducer.on('transportclose', () => {
          this.producers.delete('video');
        });
        videoProducer.on('trackended', () => {});
      }
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioProducer = await this.sendTransport.produce({
          track: audioTrack
        });
        this.producers.set('audio', audioProducer);
        audioProducer.on('transportclose', () => {
          this.producers.delete('audio');
        });
        audioProducer.on('trackended', () => {});
      }
      this.isProducing = true;
      this.emit('producing-started');
    } catch (error) {
      this.emit('producing-error', error);
      throw error;
    }
  }

  async createConsumer(producerId, peerId, kind) {
    if (!this.recvTransport) {
      setTimeout(() => {
        this.createConsumer(producerId, peerId, kind);
      }, 500);
      return;
    }
    try {
      const consumerParams = await new Promise((resolve, reject) => {
        socketService.socket.emit('consume', {
          transportId: this.recvTransport.id,
          producerId,
          rtpCapabilities: this.device.rtpCapabilities
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
      const consumer = await this.recvTransport.consume(consumerParams);
      const consumerKey = `${peerId}-${kind}`;
      this.consumers.set(consumerKey, consumer);
      consumer.on('transportclose', () => {
        this.consumers.delete(consumerKey);
      });
      consumer.on('trackended', () => {});
      await new Promise((resolve, reject) => {
        socketService.socket.emit('resume-consumer', {
          consumerId: consumer.id
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        });
      });
      const stream = new MediaStream([consumer.track]);
      this.addRemoteStream(peerId, stream, kind);
    } catch (error) {
      this.emit('consumer-error', error);
    }
  }

  addRemoteStream(peerId, stream, kind) {
    let mergedStream;
    if (this.remoteStreams.has(peerId)) {
      mergedStream = this.remoteStreams.get(peerId);
      stream.getTracks().forEach(track => mergedStream.addTrack(track));
    } else {
      mergedStream = stream;
      this.remoteStreams.set(peerId, mergedStream);
    }
    this.emit('remote-stream', {
      peerId,
      stream: mergedStream,
      kind
    });
  }

  removeRemoteStream(peerId, kind) {
    if (kind) {
    } else {
      this.remoteStreams.delete(peerId);
    }
    this.emit('remote-stream-removed', { peerId, kind });
  }

  cleanupConsumersForPeer(peerId) {
    const consumersToRemove = [];
    for (const [key, consumer] of this.consumers.entries()) {
      if (key.startsWith(peerId)) {
        consumersToRemove.push(key);
        consumer.close();
      }
    }
    consumersToRemove.forEach(key => {
      this.consumers.delete(key);
    });
    this.removeRemoteStream(peerId);
  }

  async startScreenShare() {
    try {
      if (this.isScreenSharing) {
        return;
      }
      this.originalStream = this.localStream;
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      this.screenShareStream = screenStream;
      this.localStream = screenStream;
      const videoTrack = screenStream.getVideoTracks()[0];
      const videoProducer = this.producers.get('video');
      if (videoProducer && videoTrack) {
        await videoProducer.replaceTrack({ track: videoTrack });
        videoTrack.addEventListener('ended', () => {
          this.stopScreenShare();
        });
      }
      const audioTrack = screenStream.getAudioTracks()[0];
      const audioProducer = this.producers.get('audio');
      if (audioProducer && audioTrack) {
        await audioProducer.replaceTrack({ track: audioTrack });
      }
      this.isScreenSharing = true;
      this.emit('screen-share-started', screenStream);
    } catch (error) {
      this.emit('screen-share-error', error);
      throw error;
    }
  }

  async stopScreenShare() {
    try {
      if (!this.isScreenSharing) {
        return;
      }
      const restoredStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      this.localStream = restoredStream;
      const videoTrack = restoredStream.getVideoTracks()[0];
      const videoProducer = this.producers.get('video');
      if (videoProducer && videoTrack) {
        await videoProducer.replaceTrack({ track: videoTrack });
      }
      const audioTrack = restoredStream.getAudioTracks()[0];
      const audioProducer = this.producers.get('audio');
      if (audioProducer && audioTrack) {
        await audioProducer.replaceTrack({ track: audioTrack });
      }
      if (this.screenShareStream) {
        this.screenShareStream.getTracks().forEach(track => {
          if (track.readyState === 'live') track.stop();
        });
      }
      this.screenShareStream = null;
      this.isScreenSharing = false;
      this.emit('screen-share-stopped', restoredStream);
    } catch (error) {
      this.emit('screen-share-error', error);
      throw error;
    }
  }

  async toggleAudio() {
    const audioProducer = this.producers.get('audio');
    if (audioProducer) {
      if (audioProducer.paused) {
        await audioProducer.resume();
        this.emit('audio-resumed');
      } else {
        await audioProducer.pause();
        this.emit('audio-paused');
      }
      return !audioProducer.paused;
    }
    return false;
  }

  async toggleVideo() {
    const videoProducer = this.producers.get('video');
    if (videoProducer) {
      if (videoProducer.paused) {
        await videoProducer.resume();
        this.emit('video-resumed');
      } else {
        await videoProducer.pause();
        this.emit('video-paused');
      }
      return !videoProducer.paused;
    }
    return false;
  }

  async getStats() {
    const stats = {
      producers: {},
      consumers: {},
      transports: {}
    };
    for (const [kind, producer] of this.producers.entries()) {
      stats.producers[kind] = await producer.getStats();
    }
    for (const [key, consumer] of this.consumers.entries()) {
      stats.consumers[key] = await consumer.getStats();
    }
    if (this.sendTransport) {
      stats.transports.send = await this.sendTransport.getStats();
    }
    if (this.recvTransport) {
      stats.transports.receive = await this.recvTransport.getStats();
    }
    return stats;
  }

  stopMediaTracks(stream) {
  if (stream) {
    stream.getTracks().forEach((track) => {
      console.log(`🛑 Stopping ${track.kind} track`, track);
      try {
        track.stop();
      } catch (e) {
        console.warn("Failed to stop track", track, e);
      }
    });
  }
}

  async stopProducing() {
  try {
    for (const [kind, producer] of this.producers.entries()) {
      producer.close();
    }
    this.producers.clear();
    this.isProducing = false;

    // ✅ Explicitly stop local stream tracks
    this.stopMediaTracks(this.localStream);
    this.localStream = null;

    this.emit('producing-stopped');
  } catch (error) {
    this.emit('producing-error', error);
  }
}

  async cleanup() {
    console.log("🚿 Cleaning up MediaSoup");
  try {
    await this.stopProducing();

    for (const [key, consumer] of this.consumers.entries()) {
      consumer.close();
    }
    this.consumers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = null;
    }

    if (this.recvTransport) {
      this.recvTransport.close();
      this.recvTransport = null;
    }

    // ✅ Stop any remaining media tracks
    this.stopMediaTracks(this.localStream);
    this.localStream = null;

    this.stopMediaTracks(this.screenShareStream);
    this.screenShareStream = null;

    this.remoteStreams.clear();
    this.listeners.clear();
    this.isInitialized = false;
    this.isProducing = false;
    this.isScreenSharing = false;
     console.log("✅ All media tracks stopped");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}


  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
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

  get isAudioMuted() {
    const audioProducer = this.producers.get('audio');
    return audioProducer ? audioProducer.paused : true;
  }

  get isVideoMuted() {
    const videoProducer = this.producers.get('video');
    return videoProducer ? videoProducer.paused : true;
  }

  get connectionState() {
    const sendState = this.sendTransport ? this.sendTransport.connectionState : 'new';
    const recvState = this.recvTransport ? this.recvTransport.connectionState : 'new';
    return {
      send: sendState,
      receive: recvState
    };
  }
}

const mediaSoupService = new MediaSoupService();
export default mediaSoupService;
