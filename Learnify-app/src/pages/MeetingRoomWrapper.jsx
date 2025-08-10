// pages/MeetingRoomWrapper.jsx
import { useParams } from 'react-router-dom';
import MeetingRoom from '../components/Classes/components/MeetingRoom.jsx';

const MeetingRoomWrapper = () => {
  const { roomId } = useParams();
  return <MeetingRoom roomId={roomId} />;
};

export default MeetingRoomWrapper;
