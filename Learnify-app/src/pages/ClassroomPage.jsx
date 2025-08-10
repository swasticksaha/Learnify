import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import FolderBreadcrumb from "../components/common/FolderBreadcrumb";
import AnnouncementTab from "../components/classroom/AnnouncementTab";
import AssignmentTab from "../components/classroom/AssignmentTab";
import PeopleTab from "../components/classroom/PeopleTab";
import VideoSessionTab from "../components/classroom/VideoSessionTab";
import { useProfile } from "../components/common/ProfileContext";
import Header from "../components/common/Header";

const tabs = [
  { id: "video", label: "Live Class" },
  { id: "announcements", label: "Announcements" },
  { id: "assignments", label: "Assignments" },
  { id: "people", label: "People" },
];

const ClassroomPage = () => {
  const { id } = useParams(); // classroom ID
  const navigate = useNavigate();
  const { profileData } = useProfile(); // current user info
  console.log("Profile Data Main Page:", profileData);
  const [classroom, setClassroom] = useState(null);
  const [activeTab, setActiveTab] = useState("video");
  const [breadcrumb, setBreadcrumb] = useState([
    { id: "root", name: "Classrooms" }
  ]);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const res = await axios.get(`/api/classrooms/${id}`, {
          withCredentials: true,
        });
        setClassroom(res.data);
        setBreadcrumb([
          { id: "root", name: "Classrooms" },
          { id: res.data._id, name: res.data.name },
          { id: "video", name: "Live Class" }
        ]);
      } catch (err) {
        console.error("Classroom load failed:", err);
      }
    };

    fetchClassroom();
  }, [id]);

  const handleBreadcrumbClick = (crumbId, index) => {
    if (crumbId === "root") navigate("/dashboard/classroom");
    else if (index === 1) {
      setActiveTab("video");
      setBreadcrumb((prev) => prev.slice(0, 2));
    } else {
      setActiveTab(crumbId);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const label = tabs.find((t) => t.id === tabId)?.label || tabId;
    if (classroom) {
      setBreadcrumb([
        { id: "root", name: "Classrooms" },
        { id: classroom._id, name: classroom.name },
        { id: tabId, name: label }
      ]);
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-green-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10 bg-gray-50">
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-200">
        <Header />
      </div>
      
      <div className="flex-1 p-2 lg:p-6 xl:p-8">
        <div className="mb-6 sm:mb-8">
          <FolderBreadcrumb
            folderHistory={breadcrumb}
            onBreadcrumbClick={handleBreadcrumbClick}
            onGoBack={() => handleBreadcrumbClick(breadcrumb[breadcrumb.length - 2].id, breadcrumb.length - 2)}
            canGoBack={breadcrumb.length > 1}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 lg:p-8 w-full mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="hidden sm:flex space-x-3 lg:space-x-4 lg:justify-start justify-center bg-gray-50 p-2 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 lg:px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-green-600 text-white shadow-lg transform scale-105"
                      : "bg-transparent text-gray-600 hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 text-gray-700 font-semibold shadow-sm cursor-pointer"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id} >
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content - Enhanced container */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 lg:p-8 shadow-inner border border-green-200 min-h-[250px] lg:min-h-[500px]">
            {activeTab === "video" && (
              <VideoSessionTab 
                classroomId={classroom._id} 
                user={profileData} 
              />
            )}
            {activeTab === "announcements" && (
              <AnnouncementTab 
                classroomId={classroom._id} 
                user={profileData} 
              />
            )}
            {activeTab === "assignments" && (
              <AssignmentTab 
                classroomId={classroom._id} 
                user={profileData} 
              />
            )}
            {activeTab === "people" && (
              <PeopleTab 
                classroomId={classroom._id} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomPage;