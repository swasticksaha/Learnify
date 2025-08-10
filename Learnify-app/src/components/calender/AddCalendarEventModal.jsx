import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";

const AddCalendarEventModal = ({ show, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    classroomId: ""
  });
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get("/api/classrooms/my", { withCredentials: true });
      setClassrooms(res.data.created || []);
    } catch (err) {
      console.error("Failed to load classrooms", err);
    }
  };

  useEffect(() => {
    if (show) fetchClassrooms();
  }, [show]);

  const handleCreate = async () => {
    const { title, date, classroomId } = form;
    if (!title || !date || !classroomId) {
      return alert("Please fill all required fields");
    }
    
    setLoading(true);
    try {
      await axios.post("/api/calendar/create", form, { withCredentials: true });
      setForm({ title: "", date: "", time: "", classroomId: "" });
      onSuccess?.();
      onClose();
    } catch (err) {
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Add Calendar Event</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                  placeholder="Event title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-500"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Classroom <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 rounded bg-white focus:outline-none focus:border-blue-500"
                  value={form.classroomId}
                  onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
                >
                  <option value="">Select a classroom</option>
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Event"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddCalendarEventModal;