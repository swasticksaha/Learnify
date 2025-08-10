import React, { useEffect, useState } from "react";
import CalendarGrid from "./CalendarGrid";
import { EventListPanel } from "./EventListPanel";
import axios from "axios";
import { FaCalendarAlt,FaArrowLeft, FaArrowRight} from "react-icons/fa";

const CalendarComponent = ({ refreshKey }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/calendar/list", {
        withCredentials: true,
      });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
      setError("Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const currentMonthEvents = events.filter((event) => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-xl p-8 text-center text-gray-600">
            <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading calendar...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">😕</div>
            <div className="text-lg text-red-500 font-medium mb-2">{error}</div>
            <div className="text-gray-500">Please try refreshing the page</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section: Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-green-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold flex items-center"><FaCalendarAlt className="inline mr-2" /> Calendar</h1>
                    <p className="text-green-100 text-sm">
                      {currentMonthEvents.length} events this month
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full transition flex items-center justify-center"
                      title="Previous"
                    >
                      <FaArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 py-1 bg-white/20 rounded-lg text-sm font-semibold">
                      {currentDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <button
                      onClick={handleNextMonth}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 text-white rounded-full transition flex items-center justify-center"
                      title="Next"
                    >
                      <FaArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <CalendarGrid
                  currentDate={currentDate}
                  events={currentMonthEvents}
                />
              </div>
            </div>
          </div>

          {/* Right Section: Event Panel */}
          <div className="lg:col-span-1">
            <EventListPanel events={events} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarComponent;
