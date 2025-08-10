import React, { useEffect, useState } from "react";
import axios from "axios";
import { PiChalkboardTeacherDuotone,PiStudentDuotone } from "react-icons/pi";
import socketService from "../Classes/services/socketService";

const PeopleTab = ({ classroomId }) => {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);

  const fetchPeople = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/classrooms/${classroomId}/people`, {
        withCredentials: true
      });
      setTeacher(res.data.teacher);
      setStudents(res.data.students);
    } catch (err) {
      console.error("Failed to fetch people:", err);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [classroomId]);

  useEffect(() => {
  if (!classroomId) return;

  if (!socketService.isSocketConnected()) {
    socketService.connect();
  }

  socketService.joinClassroomTabRoom(classroomId);

  const handlePeopleUpdate = (data) => {
    if (data.classroomId === classroomId) {
      console.log("🔄 People updated via socket");
      fetchPeople();
    }
  };

  socketService.on("people-updated", handlePeopleUpdate);

  return () => {
    socketService.off("people-updated", handlePeopleUpdate);
  };
}, [classroomId]);


  const getProfileImageSrc = (profilePic) => {
    if (!profilePic || profilePic.includes('image.png')) {
      return 'http://localhost:5000/image.png';
    }
    if (profilePic.startsWith('http')) {
      return profilePic; 
    }
    return `http://localhost:5000${profilePic}`;
  };

  return (
    <div className="space-y-6">
      {/* Teacher */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold text-green-700 mb-3 justify-center"><PiChalkboardTeacherDuotone className="inline-block mr-2 h-9 w-9" /> Teacher</h3>
        {teacher ? (
          <div className="flex items-center space-x-4">
            <img
              src={getProfileImageSrc(teacher.profilePic)}
              alt="teacher"
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
            <div>
              <p className="font-medium">{teacher.username}</p>
              <p className="text-sm text-gray-500">{teacher.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No teacher info found.</p>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-xl shadow p-4">
        <h3 className="text-lg font-semibold text-green-700 mb-3">
          <PiStudentDuotone className="inline-block mr-2 h-9 w-9" /> Students ({students.length})
        </h3>
        {students.length === 0 ? (
          <p className="text-gray-500">No students have joined yet.</p>
        ) : (
          <ul className="space-y-4">
            {students.map((student) => (
              <li key={student._id} className="flex items-center space-x-4">
                <img
                  src={getProfileImageSrc(student.profilePic)}
                  alt={student.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => (e.target.src = "/default-avatar.png")}
                />
                <div>
                  <p className="font-medium">{student.username}</p>
                  <p className="text-sm text-gray-500">{student.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PeopleTab;
