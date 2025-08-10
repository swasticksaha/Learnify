import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaVideo } from "react-icons/fa";

const VideoSessionTab = ({ classroomId, user }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomExists, setRoomExists] = useState(false);
  const navigate = useNavigate();

  const fetchVideoSession = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/classrooms/${classroomId}/video`,
        { withCredentials: true }
      );
      if (res.data) {
        setSession(res.data);

        const roomId = res.data.link?.split('/').pop();
        const checkRes = await axios.get(`http://localhost:5000/api/room-exists/${roomId}`);
        setRoomExists(checkRes.data.exists);
      }
    } catch (err) {
      console.error("Failed to fetch video session:", err);
    }
  };

  const handleCreateMeeting = async () => {
    if (!title || !description) {
      alert("Please provide both title and description.");
      return;
    }

    setLoading(true);
    try {
      const timestamp = Date.now();
      const roomId = `${classroomId}-${timestamp}`;
      const link = `${window.location.origin}/meeting/${roomId}`;

      await axios.post(
        `http://localhost:5000/api/classrooms/${classroomId}/video`,
        { link, title, description },
        { withCredentials: true }
      );

      setSession({ link, title, description });
      setShowModal(false);
      setTitle("");
      setDescription("");
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Failed to create meeting.");
    }

    setLoading(false);
  };

  const handleJoinMeeting = () => {
    if (session?.link) {
      navigate(`/meeting/${session.link.split("/").pop()}`, {
        state: { from: location.pathname },
      });
    }
  };

  useEffect(() => {
    fetchVideoSession();
  }, [classroomId]);

  useEffect(() => {
  if (user?.role === 'teacher') return; // No need to poll for host

    const interval = setInterval(async () => {
      try {
        if (session?.link) {
          const roomId = session.link.split("/").pop();
          const res = await axios.get(`http://localhost:5000/api/room-exists/${roomId}`);
          if (res.data.exists) {
            setRoomExists(true);
            clearInterval(interval); // ✅ stop polling once true
          }
        }
      } catch (err) {
        console.error("Polling room existence failed:", err);
      }
    }, 5000); // poll every 5 seconds

    return () => clearInterval(interval);
  }, [session?.link, user?.role]);


  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-green-700 mb-3 flex items-center"><FaVideo className="inline-block mr-2 mt-[3px]"/> Live Video Session</h2>

      {user?.role === "teacher" ? (
        <div className="flex items-center space-y-2 justify-between">
          <p className="text-gray-600 mb-2 space-y-1">
            Start a live video session for your class. <br />Students can join using the link provided.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className=" text-white px-4 py-2 rounded bg-green-600 hover:bg-green-700 inline-block"
          >
            Start New Session
          </button>
        </div>
      ) : (
        <p className="text-gray-600">
          The teacher will share a live class session soon.
        </p>
      )}

      {session && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-2 flex items-center justify-evenly">
          <div className="flex-1 space-y-1">
              <p className="text-lg font-semibold text-green-800">{session.title}</p>
              <p className="text-gray-700">{session.description}</p>
          </div>
          <button
            onClick={handleJoinMeeting}
            disabled={user?.role !== 'teacher' && !roomExists}
            className={`px-4 py-2 rounded text-white ${
              user?.role === 'teacher' || roomExists
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {user?.role === 'teacher' || roomExists ? 'Join Now' : 'Waiting for teacher...'}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-brightness-75 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Start a New Session</h3>
            <input
              type="text"
              placeholder="Class Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border p-2 rounded focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <textarea
              placeholder="Class Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border p-2 rounded focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSessionTab;
