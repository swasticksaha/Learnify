import { Mic, MicOff, Monitor, Wifi, WifiOff, Crown, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const ParticipantVideo = ({ 
  participant, 
  isMainUser = false, 
  localStream, 
  isScreenSharing = false,
  remoteStream 
}) => {
  const videoRef = useRef(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoElementReady, setVideoElementReady] = useState(false);

  const setVideoRef = (node) => {
    if (node) {
      videoRef.current = node;
      setVideoElementReady(true);
    }
  };

  // Handle local stream (current user)
  useEffect(() => {
    if (isMainUser && localStream && videoRef.current) {
      try {
        videoRef.current.srcObject = localStream;
        setIsStreamActive(true);
        setStreamError(null);
        
        const handleLoadedMetadata = () => {
          setIsVideoLoaded(true);
          if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                setStreamError('Autoplay blocked - click to play');
              });
            }
          }
        };
        
        const handleError = () => {
          setStreamError('Local video error');
          setIsStreamActive(false);
          setIsVideoLoaded(false);
        };

        const handleCanPlay = () => {
          setIsVideoLoaded(true);
        };

        const handlePlaying = () => {};

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('error', handleError);
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('playing', handlePlaying);
        
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.removeEventListener('error', handleError);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            videoRef.current.removeEventListener('playing', handlePlaying);
          }
        };
      } catch {
        setStreamError('Failed to setup local video');
        setIsStreamActive(false);
        setIsVideoLoaded(false);
      }
    }
  }, [isMainUser, localStream, videoElementReady, participant.name]);

  // Handle remote stream (other participants)
  useEffect(() => {
    if (!isMainUser && remoteStream && videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.srcObject = remoteStream;
        setIsStreamActive(true);
        setStreamError(null);
        
        const handleLoadedMetadata = () => {
          setIsVideoLoaded(true);
          if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                setStreamError('Failed to play remote video');
              });
            }
          }
        };
        
        const handleError = () => {
          setStreamError('Remote video error');
          setIsStreamActive(false);
          setIsVideoLoaded(false);
        };

        const handleStreamEnded = () => {
          setIsStreamActive(false);
          setIsVideoLoaded(false);
        };

        const handleCanPlay = () => {
          setIsVideoLoaded(true);
        };

        const handlePlaying = () => {};

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('error', handleError);
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('playing', handlePlaying);
        
        remoteStream.getTracks().forEach(track => {
          track.addEventListener('ended', handleStreamEnded);
        });
        
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.removeEventListener('error', handleError);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            videoRef.current.removeEventListener('playing', handlePlaying);
          }
          remoteStream.getTracks().forEach(track => {
            track.removeEventListener('ended', handleStreamEnded);
          });
        };
      } catch {
        setStreamError('Failed to setup remote video');
        setIsStreamActive(false);
        setIsVideoLoaded(false);
      }
    } else if (!isMainUser && !remoteStream) {
      setIsStreamActive(false);
      setIsVideoLoaded(false);
      setStreamError(null);
    }
  }, [isMainUser, remoteStream, videoElementReady, participant.name]);

  const getGradient = (id) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-purple-500 to-pink-600',
      'from-yellow-500 to-orange-600',
      'from-pink-500 to-red-600',
      'from-indigo-500 to-blue-600',
      'from-teal-500 to-green-600'
    ];
    return gradients[(id || 0) % gradients.length];
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const shouldShowVideo = () => {
    if (isMainUser) {
      return (participant.isVideoOn || isScreenSharing) && localStream;
    } else {
      return participant.isVideoOn && remoteStream && isStreamActive;
    }
  };

  const shouldShowAvatar = () => {
    return !shouldShowVideo();
  };

  const isOnline = participant.isOnline !== false;

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className={`relative bg-gray-100 rounded-xl overflow-hidden transition-all duration-200 shadow-lg border-2 text-green-400 ${
      isMainUser ? 'border-gray-200 ' : 'border-emerald-300 text-green-400'
    } ${!isOnline ? 'opacity-60' : ''}`}>
      <div className={`w-full h-full ${
        isScreenSharing ? 'bg-black' : `bg-gradient-to-br ${
          isMainUser ? 'from-emerald-400 to-teal-500' : getGradient(participant.id || 0)
        }`
      } flex items-center justify-center relative`}>
        
        {/* Video Element */}
          <video
            ref={setVideoRef}
            autoPlay
            muted={isMainUser}
            playsInline
            controls={false}
            style={{ display: shouldShowVideo() ? 'block' : 'none' }}
            className={`w-full h-full transition-opacity duration-300 ${
              isScreenSharing || isVideoLoaded ? 'object-contain bg-black' : 'object-cover'
            }`}
            onClick={handleManualPlay}
          />
        
        {/* Debug Click Area for Video Issues */}
        {shouldShowVideo() && streamError && streamError.includes('click to play') && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
            onClick={handleManualPlay}
          >
            <div className="text-center text-white">
              <div className="text-lg mb-2">▶️</div>
              <div className="text-sm">Click to play video</div>
            </div>
          </div>
        )}
        
        {/* Loading state for video */}
        {shouldShowVideo() && !isVideoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm">Loading video...</div>
            </div>
          </div>
        )}
        
        {/* Avatar/Placeholder */}
        {shouldShowAvatar() && (
          <div className="text-center">
            <div className={`${
              isMainUser ? 'w-24 h-24 border-white/40' : 'w-16 h-16 border-emerald-300'
            } rounded-full mb-2 border-4  relative overflow-hidden shadow-lg`}>
              {participant.profilePic ? (
                <img
                  src={participant.profilePic}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ${
                  isMainUser ? 'text-2xl' : 'text-lg'
                } font-bold w-full h-full`}>
                  {getInitials(participant.name)}
                </div>
              )}

              {participant.isHost && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className={`text-sm font-medium ${
              isMainUser ? 'text-white/90' : 'text-emerald-400'}`}>
              {!isOnline ? 'Offline' :
              !participant.isVideoOn ? 'Camera off' :
              'Connecting...'}
            </div>
          </div>
        )}
        
        {/* Connection Status Indicator */}
        {!isMainUser && (
          <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full p-1">
            {isOnline ? (
              remoteStream && isStreamActive ? (
                <Wifi className="w-4 h-4 text-emerald-400" />
              ) : (
                <Wifi className="w-4 h-4 text-amber-400" />
              )
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        )}

        {/* Stream Error */}
        {streamError && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <WifiOff className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <div className="text-sm">{streamError}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Participant Info */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm flex items-center space-x-2 shadow-md">
        <span className="text-gray-800 font-medium">{participant.name}</span>
        {participant.isHost && <Crown className="w-3 h-3 text-amber-600" />}
        {!participant.isMuted && <Mic className="w-3 h-3 text-emerald-600" />}
        {isScreenSharing && <Monitor className="w-3 h-3 text-blue-600" />}
      </div>
      
      {/* Mute Indicator */}
      {participant.isMuted && (
        <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <MicOff className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Video Off Indicator */}
      {!participant.isVideoOn && !isScreenSharing && (
        <div className="absolute top-3 right-12 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center space-x-1 shadow-lg">
          <VideoOff className="w-4 h-6" />
        </div>
      )}
      
      {/* Screen Share Indicator */}
      {isScreenSharing && (
        <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center space-x-1 shadow-lg">
          <Monitor className="w-3 h-3" />
          <span>Presenting</span>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <WifiOff className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-sm">Offline</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantVideo;