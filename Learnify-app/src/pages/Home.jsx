import React, { useState, useCallback } from 'react';
import Header from '../components/common/Header';
import { FaPlus, FaUserPlus } from "react-icons/fa";
import JoinClassroom from '../components/classroom/joinClassroom';
import CreateClassroom from '../components/classroom/createClassroom';
import ClassroomDashboard from '../components/classroom/ClassroomDashboard';
import { useProfile } from '../components/common/ProfileContext';

function Home() {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { profileData } = useProfile();
  console.log("Profile Data:", profileData);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleCreateClick = useCallback(() => {
    setShowCreate(true);
  }, []);

  const handleJoinClick = useCallback(() => {
    setShowJoin(true);
  }, []);

  return (
    <div className='flex-1 overflow-auto relative z-10 min-h-screen'>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
          {/* Custom Action Buttons */}
        <div className="mt-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {profileData.role === 'teacher' && (
              <button
                onClick={handleCreateClick}
                className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
              >
                <FaPlus className="w-5 h-5" />
                Create Classroom
              </button>
            )}
            <button
              onClick={handleJoinClick}
              className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FaUserPlus className="w-5 h-5" />
              Join Classroom
            </button>
          </div>
        </div>
        <ClassroomDashboard refreshTrigger={refreshKey} />
        <CreateClassroom 
          show={showCreate} 
          onClose={() => setShowCreate(false)} 
          onSuccess={handleRefresh} 
        />

        <JoinClassroom 
          show={showJoin} 
          onClose={() => setShowJoin(false)} 
          onSuccess={handleRefresh} 
        />
      </div>
    </div>
  );
}

export default Home;