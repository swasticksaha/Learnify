import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageSquare,
  Users,
  Monitor
} from 'lucide-react';

const MeetingControls = ({
  isMuted,
  setIsMuted,
  isVideoOn,
  setIsVideoOn,
  showChat,
  showParticipants,
  handleToggleChat,
  handleToggleParticipants,
  handleMuteToggle,
  handleVideoToggle,
  handleLeaveMeeting,
  handleScreenShare,
  isScreenSharing
}) => {
  const baseBtnClass =
    'p-3 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg';

  return (
    <div className="absolute bottom-25 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 bg-white/95 backdrop-blur-xl px-6 py-4 rounded-2xl border border-gray-200 shadow-xl z-10">
      {/* Mic Toggle */}
      <button
        onClick={handleMuteToggle}
        className={`${baseBtnClass} ${
          isMuted
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
            : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-300'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
      </button>

      {/* Video Toggle */}
      <button
        onClick={handleVideoToggle}
        className={`${baseBtnClass} ${
          !isVideoOn
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
            : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300'
        }`}
        title={isVideoOn ? 'Turn off video' : 'Turn on video'}
      >
        {isVideoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
      </button>

      {/* Screen Share */}
      <button
        onClick={handleScreenShare}
        className={`${baseBtnClass} ${
          isScreenSharing
            ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300'
            : 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-300'
        }`}
        title={isScreenSharing ? 'Stop presenting' : 'Present to class'}
      >
        <Monitor className="w-5 h-5 text-white" />
      </button>

      {/* Leave */}
      <button
        onClick={handleLeaveMeeting}
        className="p-3 rounded-xl bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all hover:scale-105 shadow-lg"
        title="Leave class"
      >
        <Phone className="w-5 h-5 text-white" />
      </button>

      {/* Toggle Chat */}
      <button
        onClick={handleToggleChat}
        className={`${baseBtnClass} ${
          showChat
            ? 'bg-teal-500 hover:bg-teal-600 focus:ring-teal-300'
            : 'bg-gray-400 hover:bg-gray-500 focus:ring-gray-300'
        }`}
        title="Toggle discussion"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>

      {/* Toggle Participants */}
      <button
        onClick={handleToggleParticipants}
        className={`${baseBtnClass} ${
          showParticipants
            ? 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-300'
            : 'bg-gray-400 hover:bg-gray-500 focus:ring-gray-300'
        }`}
        title="Toggle students"
      >
        <Users className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default MeetingControls;