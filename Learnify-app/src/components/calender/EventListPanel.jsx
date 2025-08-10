import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch,FaCalendarAlt,FaChalkboardTeacher,FaRegClock } from "react-icons/fa";
import { MdOutlineClear } from "react-icons/md";


const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const EventListPanel = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClassroom, setFilterClassroom] = useState("");
  const [viewMode, setViewMode] = useState("all");

  const uniqueClassrooms = [...new Set(events.map(event => event.classroomName).filter(Boolean))];

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const isToday = isSameDay(eventDate, today);
    const isPast = eventDate < today && !isToday;
    const isUpcoming = eventDate > today;

    if (viewMode === "today" && !isToday) return false;
    if (viewMode === "upcoming" && !isUpcoming) return false;
    if (viewMode === "past" && !isPast) return false;

    if (filterClassroom && event.classroomName !== filterClassroom) return false;
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterClassroom("");
    setViewMode("all");
  };

  const getCounts = () => {
    const today = new Date();
    return {
      today: events.filter(event => isSameDay(new Date(event.date), today)).length,
      upcoming: events.filter(event => new Date(event.date) > today).length,
      past: events.filter(event => new Date(event.date) < today && !isSameDay(new Date(event.date), today)).length
    };
  };

  const counts = getCounts();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-5 border-b border-green-500 bg-green-50 rounded-lg">
        <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center"> <FaCalendarAlt className="inline mr-2" /> Event Overview</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "all", label: "All", count: events.length },
            { key: "today", label: "Today", count: counts.today },
            { key: "upcoming", label: "Upcoming", count: counts.upcoming },
            { key: "past", label: "Past", count: counts.past }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`px-3 py-1 text-sm rounded-full border font-medium transition ${
                viewMode === mode.key
                  ? "bg-green-600 text-white"
                  : "bg-white text-green-700 border-green-300 hover:bg-green-100"
              }`}
            >
              {mode.label} ({mode.count})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm border rounded-lg border-gray-300 px-4 py-1 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-400 transition">
            <FaSearch className="text-green-600" />
            <input
              type="text"
              placeholder={`Search events...`}
              className="w-full px-4 py-2 focus:outline-none focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
          >
            <option value="" className="flex items-center">All Classrooms
            </option>
            {uniqueClassrooms.map((classroom) => (
              <option key={classroom} value={classroom}>
                {classroom}
              </option>
            ))}
          </select>

          {(searchTerm || filterClassroom || viewMode !== "all") && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              <MdOutlineClear className="inline mr-1 text-red-600 size-6 font-bolder" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="p-5 bg-white">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-3">📭</div>
                <div className="text-sm">No events found</div>
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const EventCard = ({ event }) => {
  const getEventStatus = (eventDate) => {
    const date = new Date(eventDate);
    const today = new Date();
    const isToday = isSameDay(date, today);
    const isPast = date < today && !isToday;
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isToday) return { label: "Today", type: "today" };
    if (isPast) return { label: "Past", type: "past" };
    if (diffDays === 1) return { label: "Tomorrow", type: "upcoming" };
    if (diffDays <= 7) return { label: `In ${diffDays} days`, type: "upcoming" };
    return { label: "Upcoming", type: "upcoming" };
  };

  const eventDate = new Date(event.date);
  const status = getEventStatus(event.date);

  const statusStyles = {
    today: "border-l-blue-500 bg-blue-50",
    upcoming: "border-l-green-500 bg-green-50",
    past: "border-l-gray-300 bg-gray-50"
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${statusStyles[status.type]} hover:shadow-sm transition`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-800 text-sm">{event.title}</h4>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          status.type === 'today' ? 'bg-blue-100 text-green-700' :
          status.type === 'upcoming' ? 'bg-green-100 text-green-700' :
          'bg-gray-200 text-gray-600'
        }`}>
          {status.label}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center">
          <FaCalendarAlt className="inline mr-1 text-green-600" />
          {eventDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
          {event.time && (
            <div className="ml-2 items-center inline-flex">
              <FaRegClock className="inline mr-1 text-green-600" />
              {event.time}
            </div>
          )}
        </div>
        {event.classroomName && (
          <div className="flex items-center">
            <FaChalkboardTeacher className="inline mr-1 text-green-600" />
            {event.classroomName}
          </div>
        )}
      </div>
    </div>
  );
};
