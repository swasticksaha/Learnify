import ParticipantVideo from './ParticipantVideo';

const VideoGrid = ({
  participants,
  currentUser,
  localStream,
  isScreenSharing,
  remoteStreams
}) => {
  // Exclude current user from remote participants
  const otherParticipants = participants.filter(p => p.name !== currentUser.name);

  // Sort screen sharers first
  const sortedParticipants = [...otherParticipants].sort((a, b) => {
    if (a.isScreenSharing && !b.isScreenSharing) return -1;
    if (!a.isScreenSharing && b.isScreenSharing) return 1;
    return 0;
  });

  // Total count for grid layout
  const totalParticipants = sortedParticipants.length + 1; // +1 for current user

  const getGridCols = () => {
    if (totalParticipants === 1) return 'grid-cols-1 max-h-[600px] md:max-h-[600px]';
    if (totalParticipants === 2) return 'grid-rows-2 grid-cols-1 max-h-[600px] xl:grid-cols-2 xl:max-h-[600px] lg:grid-rows-1';
    if (totalParticipants <= 4) return 'grid-cols-2 md:grid-cols-2 max-h-[600px]';
    if (totalParticipants <= 6) return 'grid-cols-2 md:grid-cols-3 max-h-[600px]';
    return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 max-h-[600px]';
  };

  return (
    <div className="h-screen p-6 relative bg-gradient-to-br from-gray-50 to-gray-100 lg:grid-cols-2">
      <div className={`grid ${getGridCols()} gap-6 h-full`}>
        {/* Current User */}
        <ParticipantVideo
          participant={currentUser}
          isMainUser={true}
          localStream={localStream}
          isScreenSharing={isScreenSharing}
          remoteStream={null}
        />

        {/* Other Participants */}
        {sortedParticipants.map((participant) => {
          return (
            <ParticipantVideo
              key={participant.id}
              participant={participant}
              isMainUser={false}
              localStream={null}
              isScreenSharing={participant.isScreenSharing}
              remoteStream={participant.remoteStream}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VideoGrid;

