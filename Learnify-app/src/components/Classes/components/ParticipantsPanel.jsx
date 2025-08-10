import { X, Users, Crown } from 'lucide-react';
import ParticipantItem from './ParticipantItem';

const ParticipantsPanel = ({ 
  showParticipants, 
  setShowParticipants, 
  participants,
  currentUser 
}) => {
  if (!showParticipants) return null;

  // Sort participants: host first, then current user, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    if (a.name === currentUser?.name) return -1;
    if (b.name === currentUser?.name) return 1;
    return a.name.localeCompare(b.name);
  });

  const hostCount = participants.filter(p => p.isHost).length;
  const onlineCount = participants.filter(p => p.isOnline !== false).length;

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col animate-in slide-in-from-right duration-300 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">
            Students
          </h3>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
            {participants.length}
          </span>
        </div>
        <button
          onClick={() => setShowParticipants(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Close participants"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>{onlineCount} Online</span>
          </div>
          {hostCount > 0 && (
            <div className="flex items-center space-x-2 text-amber-600">
              <Crown className="w-3 h-3" />
              <span>{hostCount} Teacher{hostCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {sortedParticipants.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No participants</p>
          </div>
        ) : (
          sortedParticipants.map((participant) => (
            <ParticipantItem 
              key={participant.id} 
              participant={participant}
              isCurrentUser={participant.name === currentUser?.name}
            />
          ))
        )}
      </div>

      {/* Meeting Info */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-600">
          <div className="mb-1 font-medium">Class Information</div>
          <div className="flex items-center space-x-4">
            <span>Total: {participants.length}</span>
            <span>Active: {onlineCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPanel;