import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate,useLocation} from "react-router-dom";
import { FaChalkboardTeacher, FaUsers, FaCopy, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import { useProfile } from "../common/ProfileContext";


const ClassroomDashboard = ({ refreshTrigger }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { profileData } = useProfile(); 

  const fetchClassrooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://localhost:5000/api/classrooms/my", {
        withCredentials: true,
      });
      const { created, joined } = res.data;
      
      // Add role information to each classroom
      const createdWithRole = created.map(c => ({ ...c, userRole: 'teacher' }));
      const joinedWithRole = joined.map(c => ({ ...c, userRole: 'student' }));
      
      setClassrooms([...createdWithRole, ...joinedWithRole]);
    } catch (err) {
      console.error("Failed to fetch classrooms:", err);
      setError("Failed to load classrooms. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopyCode = useCallback(async (code, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, []);

  const handleClassroomClick = useCallback((classroomId) => {
    if (location.pathname == `/dashboard`)
      navigate(`classroom/${classroomId}`);
    else if (location.pathname == `/dashboard/classroom`)
      navigate(`${classroomId}`);
  }, [navigate]);

  useEffect(() => {
    fetchClassrooms();
  }, [refreshTrigger, fetchClassrooms]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-3 border-green-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading your classrooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <div className="text-red-600 mb-4 font-medium">{error}</div>
          <button
            onClick={fetchClassrooms}
            className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Your Classrooms</h2>
        <p className="text-gray-600 text-lg">
          {classrooms.length === 0 
            ? "You haven't joined any classrooms yet." 
            : `You're enrolled in ${classrooms.length} classroom${classrooms.length > 1 ? 's' : ''}.`
          }
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-16 ">
          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChalkboardTeacher className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No Classes Found</h3>
            {profileData && (
              <>
                <p className="text-gray-600 mb-6">{profileData.role === "student" ? "Get started by joining a class." : "Get started by joining a class or creating your own classroom."}</p>
                <div className="text-sm text-gray-500 bg-green-50 px-4 py-3 rounded-md border border-green-200">
                  {profileData.role === "student" ? "Enter a class code to begin" : "Enter a class code or create a new classroom to begin"}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {classrooms.map((classroom) => (
            <motion.div
              key={classroom._id}
              variants={cardVariants}
              whileHover={{ 
                scale: 1.02,
                y: -2,
                boxShadow: "0 12px 24px -4px rgba(0, 0, 0, 0.12)"
              }}
              className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 cursor-pointer transition-all duration-200 border hover:border-green-600 group  border-l-4 border-green-500"
              onClick={() => handleClassroomClick(classroom._id)}
            >
              {/* Header with Class-style layout */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-md uppercase tracking-wide ${
                    classroom.userRole === 'teacher' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {classroom.userRole}
                  </span>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaChalkboardTeacher className="text-green-600 text-sm" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-green-700 transition-colors leading-tight">
                  {classroom.name}
                </h3>
                
                {/* Only show class code for teachers */}
                {classroom.userRole === 'teacher' && (
                  <div className="text-sm text-gray-500 font-medium">
                    Class ID: {classroom.code}
                  </div>
                )}
              </div>

              {/* Academic Info Panel */}
              <div className="bg-green-50 rounded-md p-4 mb-4 border border-green-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FaUsers className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700 font-medium">
                      {classroom.students?.length || 0} Students
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium text-xs">ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Quick Access Section */}
              <div className="flex items-center justify-between pt-4 border-t border-green-100">
                <div className="text-xs text-gray-500">
                  Created {new Date(classroom.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                {/* Only show copy button for teachers */}
                {classroom.userRole === 'teacher' && (
                  <button
                    onClick={(e) => handleCopyCode(classroom.code, e)}
                    className={`p-2 rounded-md text-xs font-medium transition-all duration-200 ${
                      copiedCode === classroom.code
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                    }`}
                    title={copiedCode === classroom.code ? 'Copied!' : 'Copy class code'}
                  >
                    <FaCopy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ClassroomDashboard;