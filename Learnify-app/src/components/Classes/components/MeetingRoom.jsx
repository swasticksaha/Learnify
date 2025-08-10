import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../common/ProfileContext';
import MeetingHeader from './MeetingHeader';
import VideoGrid from './VideoGrid';
import MeetingControls from './MeetingControls';
import ChatPanel from './ChatPanel';
import ParticipantsPanel from './ParticipantsPanel';
import socketService from '../services/socketService';
import mediaSoupService from '../services/webRTCService';
import JoinRequestToast from './JoinRequestToast';

const MeetingRoom = ({ roomId = 'test-room' }) => {
  const { profileData, getProfileImageSrc } = useProfile();
  const userName = profileData?.username || "Anonymous User";
  const profilePic = getProfileImageSrc() || "";

  const navigate = useNavigate();
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMediaSoupInitialized, setIsMediaSoupInitialized] = useState(false);
  const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [screenSharingUsers, setScreenSharingUsers] = useState(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const initializeServices = async () => {
      try {
        socketService.connect('http://localhost:5000');

        socketService.on('connected', () => {
          setIsConnected(true);
        });

        socketService.on('disconnected', () => {
          setIsConnected(false);
          setIsMediaSoupInitialized(false);
          setIsLocalStreamReady(false);
        });

        socketService.on('router-rtp-capabilities', async (data) => {
          try {
            mediaSoupService.on('local-stream', (stream) => {
              setLocalStream(stream);
              setIsLocalStreamReady(true);
              setMediaError('');
            });

            mediaSoupService.on('media-error', (error) => {
              setMediaError('Media error: ' + error.message);
            });

            mediaSoupService.on('device-error', (error) => {
              setMediaError('MediaSoup device error: ' + error.message);
            });

            mediaSoupService.on('remote-stream', ({ peerId, stream }) => {
              setRemoteStreams(prev => {
                const newStreams = new Map(prev);
                newStreams.set(peerId, stream);
                return newStreams;
              });
            });

            mediaSoupService.on('remote-stream-removed', ({ peerId }) => {
              setRemoteStreams(prev => {
                const newStreams = new Map(prev);
                newStreams.delete(peerId);
                return newStreams;
              });
            });

            mediaSoupService.on('screen-share-started', (stream) => {
              setLocalStream(stream);
              setIsScreenSharing(true);
            });

            mediaSoupService.on('screen-share-stopped', (stream) => {
              setLocalStream(stream);
              setIsScreenSharing(false);
            });

            mediaSoupService.on('screen-share-error', (error) => {
              setMediaError('Screen share error: ' + error.message);
            });

            mediaSoupService.on('producing-started', () => {});
            mediaSoupService.on('producing-stopped', () => {});
            mediaSoupService.on('producing-error', (error) => {
              setMediaError('Media production error: ' + error.message);
            });

            mediaSoupService.on('transport-error', (error) => {
              setMediaError('Transport error: ' + error);
            });

            mediaSoupService.on('consumer-error', (error) => {
              setMediaError('Consumer error: ' + error.message);
            });

            if (!mediaSoupService.device?.loaded && !mediaSoupService.isInitializing) {
              await mediaSoupService.initialize(data.rtpCapabilities);
              setIsMediaSoupInitialized(true);
            }

            try {
              await mediaSoupService.initializeLocalStream({
                video: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
                audio: true
              });
            } catch (mediaError) {
              setMediaError('Failed to access camera/microphone: ' + mediaError.message);
              setMediaError('All media access methods failed: ' + mediaError.message);
            }
          } catch (error) {
            setMediaError('Failed to initialize MediaSoup: ' + error.message);
          }
        });

        socketService.on('joined-room', async (data) => {
          setIsJoined(true);
          setParticipants(data.participants);
          socketService.socket.emit('get-producers', async (response) => {
            if (response.error) return;
            const { producers } = response;
            for (const producer of producers) {
              await mediaSoupService.createConsumer(producer.producerId, producer.peerId, producer.kind);
            }
          });
          setMessages(data.messages || []);
          if (isMediaSoupInitialized && isLocalStreamReady) {
            await startMediaProduction();
          }
        });

        socketService.on('user-joined', (data) => {
          setParticipants(data.participants);
        });

        socketService.on('user-left', (data) => {
          setParticipants(data.participants);
        });

        socketService.on('participant-updated', (data) => {
          setParticipants(data.participants);
        });

        socketService.off('new-message', handleNewMessage);
        socketService.on('new-message', handleNewMessage);

        socketService.on('host-changed', (data) => {
          setParticipants(data.participants);
        });

        socketService.on('user-screen-share', (data) => {
          setScreenSharingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isSharing) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        });

        socketService.on('connection-error', (error) => {
          setMediaError('Connection error: ' + error.message);
        });

        // Handle join request denial
        socketService.off('join-denied');
        socketService.on('join-denied', (data) => {
          console.log("❌ Join request denied:", data.reason);
          alert(data.reason || "You were not allowed to join.");
          setTimeout(() => {
            const from = location.state?.from || '/dashboard';
            navigate(from, { replace: true });
          }, 3000);
        });

        // Student got approved (retry actual join)
        socketService.on('join-approved', ({ roomId, userName, profilePic }) => {
          socketService.joinRoom(roomId, userName, profilePic);
        });

        // Host receives a student join request
        socketService.off('student-join-request');
        socketService.on('student-join-request', ({ socketId, userName, profilePic }) => {
          console.log("✅ Join request received from:", userName);
          setJoinRequests((prev) => {
            if (prev.some((req) => req.socketId === socketId)) return prev;
            return [...prev, { socketId, userName, profilePic }];
          });
        });

      } catch (error) {
        setMediaError('Failed to initialize services: ' + error.message);
      }
    };

    initializeServices();

    return () => {
      socketService.off('new-message', handleNewMessage);
      socketService.off('join-approved');
      socketService.off('join-denied');
      socketService.off('student-join-request');
      socketService.disconnect();
      mediaSoupService.cleanup();
    };
  }, []);

  const handleNewMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const startMediaProduction = async () => {
    try {
      if (!isMediaSoupInitialized || !isJoined || !isLocalStreamReady) {
        return;
      }
      await mediaSoupService.createSendTransport();
      await mediaSoupService.createRecvTransport();
      await mediaSoupService.startProducing();
    } catch (error) {
      setMediaError('Failed to start media production: ' + error.message);
    }
  };

  useEffect(() => {
    if (isMediaSoupInitialized && isJoined && isLocalStreamReady) {
      startMediaProduction();
    }
  }, [isMediaSoupInitialized, isJoined, isLocalStreamReady]);

  useEffect(() => {
    if (isConnected && !isJoined) {
      try {
        socketService.joinRoom(roomId, userName, profilePic);
      } catch (error) {
        setMediaError('Failed to join room: ' + error.message);
      }
    }
  }, [isConnected, isJoined, roomId, userName]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMuteToggle = async () => {
    try {
      const newMuteState = await mediaSoupService.toggleAudio();
      setIsMuted(!newMuteState);
      socketService.toggleAudio(!newMuteState);
    } catch (error) {
      setMediaError('Failed to toggle audio');
    }
  };

  const handleVideoToggle = async () => {
    try {
      const newVideoState = await mediaSoupService.toggleVideo();
      setIsVideoOn(newVideoState);
      socketService.toggleVideo(newVideoState);
    } catch (error) {
      setMediaError('Failed to toggle video');
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        await mediaSoupService.startScreenShare();
        socketService.startScreenShare();
      } else {
        await mediaSoupService.stopScreenShare();
        socketService.stopScreenShare();
      }
    } catch (error) {
      setMediaError('Screen sharing failed: ' + error.message);
    }
  };

const handleLeaveMeeting = async () => {
  try {
    socketService.leaveRoom();
    await mediaSoupService.cleanup();

    // 🔄 Hard reload after navigating — ensures camera stops
    const from = location.state?.from || '/dashboard';
    window.location.href = from;
  } catch (error) {
    console.error('❌ Failed to leave:', error);
  }
};

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      try {
        socketService.sendMessage(chatMessage);
        setChatMessage('');
      } catch (error) {
        setMediaError('Failed to send message');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const socketId = socketService?.socket?.id || 'local-user';

  const currentUser = participants.find(p => p.id === socketId) || {
    id: socketId,
    name: userName,
    isMuted,
    isVideoOn,
    isHost: false
  };

  const enhancedParticipants = participants.map(participant => {
    if (participant.name === userName) {
      return {
        ...participant,
        remoteStream: null,
        isScreenSharing: screenSharingUsers.has(participant.id)
      };
    }
    const remoteStream = remoteStreams.get(participant.id);
    return {
      ...participant,
      remoteStream: remoteStream,
      isScreenSharing: screenSharingUsers.has(participant.id)
    };
  });

  const handleApprove = (socketId) => {
    socketService.socket.emit('approve-join', { roomId, socketId });
    setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
  };

  const handleReject = (socketId) => {
    socketService.socket.emit('reject-join', { roomId, socketId });
    setJoinRequests(prev => prev.filter(req => req.socketId !== socketId));
  };


  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800 flex flex-col overflow-hidden">
      <MeetingHeader
        roomId={roomId}
        participantCount={participants.length}
        currentTime={currentTime}
      />

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <VideoGrid
            participants={enhancedParticipants}
            currentUser={currentUser}
            localStream={localStream}
            isScreenSharing={isScreenSharing}
            remoteStreams={remoteStreams}
          />

          <MeetingControls
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isVideoOn={isVideoOn}
            setIsVideoOn={setIsVideoOn}
            showChat={showChat}
            showParticipants={showParticipants}
            handleToggleChat={() => {
              setShowChat(!showChat);
              if (!showChat && showParticipants) {
                setShowParticipants(false);
              }
            }}
            handleToggleParticipants={() => {
              setShowParticipants(!showParticipants);
              if (!showParticipants && showChat) {
                setShowChat(false);
              }
            }}
            handleMuteToggle={handleMuteToggle}
            handleVideoToggle={handleVideoToggle}
            handleLeaveMeeting={handleLeaveMeeting}
            handleScreenShare={handleScreenShare}
            isScreenSharing={isScreenSharing}
          />
        </div>

        <ChatPanel
          showChat={showChat}
          setShowChat={setShowChat}
          messages={messages}
          chatMessage={chatMessage}
          setChatMessage={setChatMessage}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          currentUser={currentUser}
        />

        <ParticipantsPanel
          showParticipants={showParticipants}
          setShowParticipants={setShowParticipants}
          participants={participants}
          currentUser={currentUser}
        />

        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
          {joinRequests.map((req) => (
            <JoinRequestToast
              key={req.socketId}
              request={req}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;