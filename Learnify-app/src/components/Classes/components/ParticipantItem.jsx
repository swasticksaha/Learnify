import { Mic, MicOff, Video, VideoOff, Crown, Monitor, Wifi, WifiOff } from 'lucide-react';

const ParticipantItem = ({ participant, isCurrentUser = false }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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

  const isOnline = participant.isOnline !== false;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
      isCurrentUser 
        ? 'bg-emerald-50 border border-emerald-200 shadow-sm' 
        : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
    }`}>
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          {participant.profilePic ? (
            <img
              src={participant.profilePic}
              alt={participant.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${
              isCurrentUser ? 'from-emerald-500 to-teal-600' : getGradient(participant.id)
            } border-2 border-white shadow-sm`}>
              {getInitials(participant.name)}
            </div>
          )}
          
          {/* Online/Offline indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
          }`} />
          
          {/* Host crown */}
          {participant.isHost && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Crown className="w-2 h-2 text-white" />
            </div>
          )}
        </div>

        {/* Participant Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className={`text-sm font-medium ${
              isCurrentUser ? 'text-emerald-700' : 'text-gray-700'
            }`}>
              {participant.name}
              {isCurrentUser && ' (You)'}
            </div>
            {participant.isHost && !isCurrentUser && (
              <div className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                Teacher
              </div>
            )}
          </div>
          
          {/* Status indicators */}
          <div className="flex items-center space-x-2 mt-1">
            {!isOnline && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            {participant.isScreenSharing && (
              <div className="flex items-center space-x-1 text-xs text-blue-600">
                <Monitor className="w-3 h-3" />
                <span>Presenting</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Controls Status */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-gray-400" />
        )}
        
        {/* Audio Status */}
        {participant.isMuted ? (
          <MicOff className="w-4 h-4 text-red-500" />
        ) : (
          <Mic className="w-4 h-4 text-emerald-500" />
        )}
        
        {/* Video Status */}
        {participant.isVideoOn ? (
          <Video className="w-4 h-4 text-blue-500" />
        ) : (
          <VideoOff className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default ParticipantItem;