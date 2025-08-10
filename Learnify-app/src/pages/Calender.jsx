import React, { useState } from "react";
import CalendarComponent from "../components/calender/CalenderComponent";
import AddCalendarEventModal from "../components/calender/AddCalendarEventModal";
import Header from "../components/common/Header";
import { FaCalendarAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { useProfile } from "../components/common/ProfileContext";


const Calendar = () => {
  const { profileData } = useProfile();
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <motion.div
      className="flex-1 overflow-auto relative z-10 min-h-screen"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Header title="Calendar" />
      <div className="mt-6 flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-800 flex items-center">
          <FaCalendarAlt className="inline mr-2" /> Calendar
        </h1>
        {profileData?.role === "teacher" && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            + Add Event
          </button>
        )}
      </div>

      {/* Calendar with refresh trigger */}
      <CalendarComponent refreshKey={refreshKey} />

      {/* Modal */}
      <AddCalendarEventModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleRefresh}
      />
    </motion.div>
  );
};

export default Calendar;
