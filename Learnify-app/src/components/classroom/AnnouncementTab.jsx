import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaBullhorn, FaPlus, FaTrash, FaEdit, FaTimes, FaCheck, FaExclamationTriangle,FaSpinner} from "react-icons/fa";
import socketService from "../Classes/services/socketService"; // Adjust the import path as needed

const AnnouncementTab = ({ classroomId, user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [loading, setLoading] = useState({ 
    fetch: true, 
    post: false, 
    edit: false, 
    delete: null 
  });
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  console.log('AnnouncementTab mounted with classroomId:', classroomId, 'user:', user);

  // Memoize user permissions
  const isTeacher = useMemo(() => user?.role === "teacher", [user?.role]);

  // Enhanced error handling
  const handleError = useCallback((err, defaultMessage) => {
    const errorMessage = err.response?.data?.message || defaultMessage;
    console.error("AnnouncementTab Error:", err);
    return errorMessage;
  }, []);

  // Fetch announcements with better error handling
  const fetchAnnouncements = useCallback(async () => {
    if (!classroomId) return;
    
    try {
      setLoading(prev => ({ ...prev, fetch: true }));
      setError(null);
      
      const response = await axios.get(
        `/api/classrooms/${classroomId}/announcements`, 
        { withCredentials: true }
      );
      
      console.log("Fetched announcements:", response.data);

      const sortedAnnouncements = response.data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setAnnouncements(sortedAnnouncements);
    } catch (err) {
      const errorMessage = handleError(err, "Failed to load announcements");
      setError(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, fetch: false }));
    }
  }, [classroomId, handleError]);

  const getProfileImageSrc = (profilePic) => {
    if (!profilePic || profilePic.includes('image.png')) {
      return 'http://localhost:5000/image.png';
    }
    if (profilePic.startsWith('http')) {
      return profilePic; 
    }
    return `http://localhost:5000${profilePic}`;
  };

  // Post announcement with validation
  const handlePost = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      alert("Please enter a message");
      return;
    }

    if (trimmedMessage.length > 1000) {
      alert("Message is too long. Please keep it under 1000 characters.");
      return;
    }

    setLoading(prev => ({ ...prev, post: true }));
    
    try {
      const response = await axios.post(
        `/api/classrooms/${classroomId}/announcements`,
        { message: trimmedMessage },
        { withCredentials: true }
      );
      
      setAnnouncements(prev => [response.data, ...prev]);
      setMessage("");
    } catch (err) {
      const errorMessage = handleError(err, "Failed to post announcement");
      alert(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, post: false }));
    }
  };

  // Edit announcement with validation
  const handleEdit = async (id) => {
    const trimmedMessage = editMessage.trim();
    if (!trimmedMessage) {
      alert("Please enter a message");
      return;
    }

    if (trimmedMessage.length > 1000) {
      alert("Message is too long. Please keep it under 1000 characters.");
      return;
    }

    setLoading(prev => ({ ...prev, edit: true }));
    
    try {
      const response = await axios.put(
        `/api/classrooms/${classroomId}/announcements/${id}`,
        { message: trimmedMessage },
        { withCredentials: true }
      );
      
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement._id === id ? response.data : announcement
        )
      );
      
      handleCancelEdit();
    } catch (err) {
      const errorMessage = handleError(err, "Failed to edit announcement");
      alert(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, edit: false }));
    }
  };

  // Cancel edit mode
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditMessage("");
  }, []);

  // Start edit mode
  const handleStartEdit = useCallback((announcement) => {
    console.log('Starting edit for announcement:', announcement._id);
    setEditingId(announcement._id);
    setEditMessage(announcement.message);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback((id) => {
    setShowConfirmDelete(id);
  }, []);

  // Delete announcement
  const handleDelete = async (id) => {
    setLoading(prev => ({ ...prev, delete: id }));
    setShowConfirmDelete(null);
    
    try {
      await axios.delete(
        `/api/classrooms/${classroomId}/announcements/${id}`,
        { withCredentials: true }
      );
      
      setAnnouncements(prev => prev.filter(announcement => announcement._id !== id));
    } catch (err) {
      const errorMessage = handleError(err, "Failed to delete announcement");
      alert(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, delete: null }));
    }
  };

  // Enhanced date formatting
  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Check if user can edit/delete announcement - More lenient check
  const canModifyAnnouncement = useCallback((announcement) => {
    console.log('Checking permissions:', {
      user: user,
      isTeacher,
      userId: user?._id,
      authorId: announcement.author?._id,
      userRole: user?.role,
      canModify: isTeacher && String(announcement.author?._id) === String(user?._id)
    });
    
    // More lenient permission check
    if (!user || !announcement.author) return false;
    
    // Convert both IDs to strings for comparison
    const userIdStr = String(user.email);
    const authorIdStr = String(announcement.author.email);
    return (user.role === "teacher") && userIdStr === authorIdStr;
  }, [isTeacher, user]);

  // Load announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (!classroomId) return;

    // Connect only if not already connected
    if (!socketService.isSocketConnected()) {
      socketService.connect();
    }

    socketService.joinClassroomTabRoom(classroomId);

    const handleNewAnnouncement = (announcement) => {
      setAnnouncements((prev) => {
        const exists = prev.some(a => a._id === announcement._id);
        if (exists) return prev;
        console.log("📬 Received new announcement from socket:", announcement);
        return [announcement, ...prev];
      });
    };

    socketService.on("announcement-added", handleNewAnnouncement);

    // Clean up to avoid memory leaks or duplicate listeners
    return () => {
      socketService.off("announcement-added", handleNewAnnouncement);
    };
  }, [classroomId]);


  // Loading state
  if (loading.fetch) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FaSpinner className="animate-spin text-4xl text-green-600 mb-4" />
        <p className="text-gray-600">Loading announcements...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
        <p className="text-red-600 text-center mb-6 max-w-md">{error}</p>
        <button 
          onClick={fetchAnnouncements}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-100 p-3 rounded-full">
          <FaBullhorn className="text-green-600 text-2xl" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Announcements</h2>
          <p className="text-gray-600">Stay updated with classroom news</p>
        </div>
      </div>

      {/* Create Announcement (Teacher Only) */}
      {isTeacher && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaPlus className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Create Announcement</h3>
          </div>
          
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-colors"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share an announcement with your students..."
            disabled={loading.post}
            maxLength={1000}
          />
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {message.length}/1000 characters
            </span>
            <button 
              onClick={handlePost}
              disabled={loading.post || !message.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {loading.post ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <FaBullhorn />
                  Post Announcement
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Announcements List */}
      <div className="space-y-4 ">
        {announcements.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <FaBullhorn className="text-3xl text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Announcements Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {isTeacher 
                ? "Create your first announcement to share important updates with your students." 
                : "Your teacher hasn't posted any announcements yet. Check back later for updates."
              }
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-shadow"
              >
                {console.log('Rendering announcement:', announcement.author)}
                {/* Announcement Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getProfileImageSrc(announcement.author.profilePic)}
                      alt={announcement.author?.username || "Unknown"}
                      className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                      onError={(e) => {
                        e.target.src = 'http://localhost:5000/image.png';
                      }}
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {announcement.author?.username || "Unknown Author"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(announcement.createdAt)}
                        {announcement.updatedAt !== announcement.createdAt && (
                          <span className="ml-1 text-blue-600">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons (Teacher Only) */}
                  {canModifyAnnouncement(announcement) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit announcement"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(announcement._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete announcement"
                      >
                        {loading.delete === announcement._id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Announcement Content */}
                {editingId === announcement._id ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      disabled={loading.edit}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {editMessage.length}/1000 characters
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(announcement._id)}
                          disabled={loading.edit || !editMessage.trim()}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                          {loading.edit ? (
                            <>
                              <FaSpinner className="animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <FaCheck />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                          <FaTimes />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {announcement.message}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <FaExclamationTriangle className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Announcement</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showConfirmDelete)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementTab;