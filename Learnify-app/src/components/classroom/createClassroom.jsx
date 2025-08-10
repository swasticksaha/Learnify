import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const CreateClassroom = ({ show, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await axios.post(
        "http://localhost:5000/api/classrooms/create",
        { name },
        { withCredentials: true }
      );
      onSuccess?.(); // trigger refetch
      onClose(); // close modal
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create classroom");
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <h2 className="text-xl font-bold text-green-700 mb-4">Create Classroom</h2>
            <input
              type="text"
              placeholder="Classroom name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 mb-3"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                Create
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateClassroom;
