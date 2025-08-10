import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaBook, 
  FaPlus, 
  FaCalendarAlt, 
  FaPaperclip, 
  FaUpload, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaEye,
  FaUsers,
  FaSpinner,
  FaClipboardList,
  FaTimes,
  FaDownload
} from "react-icons/fa";
import socketService from "../Classes/services/socketService";

const AssignmentTab = ({ classroomId, user }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [allSubmissions, setAllSubmissions] = useState({}); // For teacher view
  const [form, setForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    dueDate: ""
  });
  const [submissionForm, setSubmissionForm] = useState({
    assignmentId: "",
    text: "",
    fileUrl: ""
  });
  const [loading, setLoading] = useState({
    assignments: false,
    create: false,
    submit: null,
    submissions: false
  });
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(prev => ({ ...prev, assignments: true }));
      const res = await axios.get(`/api/classrooms/${classroomId}/assignments`, {
        withCredentials: true
      });
      setAssignments(res.data);
      
      // Fetch submissions for students
      if (user?.role === "student") {
        fetchMySubmissions();
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await axios.get(`/api/classrooms/${classroomId}/submissions/my`, {
        withCredentials: true
      });
      
      // Convert array to object for easier lookup
      const submissionsByAssignment = {};
      res.data.forEach(submission => {
        submissionsByAssignment[String(submission.assignmentId._id)] = submission;
      });
      setSubmissions(submissionsByAssignment);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  const fetchAllSubmissions = async (assignmentId) => {
    try {
      setLoading(prev => ({ ...prev, submissions: true }));
      const res = await axios.get(`/api/classrooms/${classroomId}/assignments/${assignmentId}/submissions`, {
        withCredentials: true
      });
      
      setAllSubmissions(prev => ({
        ...prev,
        [assignmentId]: {
          submissions: res.data.submissions,
          metadata: res.data.metadata
        }
      }));
    } catch (err) {
      console.error("Error fetching all submissions:", err);
    } finally {
      setLoading(prev => ({ ...prev, submissions: false }));
    }
  };

  const handleCreateAssignment = async () => {
    if (!form.title.trim()) return;
    if (!form.dueDate) {
      alert("Please select a due date");
      return;
    }
    setLoading(prev => ({ ...prev, create: true }));
    try {
      await axios.post(`/api/classrooms/${classroomId}/assignments`, form, {
        withCredentials: true
      });
      setForm({ title: "", description: "", fileUrl: "", dueDate: "" });
      fetchAssignments();
    } catch (err) {
      alert("Failed to create assignment");
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submissionForm.text.trim() && !submissionForm.fileUrl.trim()) {
      alert("Please provide either text submission or file attachment");
      return;
    }

    setLoading(prev => ({ ...prev, submit: submissionForm.assignmentId }));
    try {
      await axios.post(`/api/classrooms/${classroomId}/assignments/${submissionForm.assignmentId}/submit`, {
        text: submissionForm.text,
        fileUrl: submissionForm.fileUrl
      }, {
        withCredentials: true
      });
      
      setSubmissionForm({ assignmentId: "", text: "", fileUrl: "" });
      setShowSubmissionModal(false);
      setSelectedAssignment(null);
      fetchMySubmissions();
      alert("Assignment submitted successfully!");
    } catch (err) {
      alert("Failed to submit assignment");
    } finally {
      setLoading(prev => ({ ...prev, submit: null }));
    }
  };

  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionForm({ assignmentId: assignment._id, text: "", fileUrl: "" });
    setShowSubmissionModal(true);
  };

  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSelectedAssignment(null);
    setSubmissionForm({ assignmentId: "", text: "", fileUrl: "" });
  };

  const openSubmissionsModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionsModal(true);
    fetchAllSubmissions(assignment._id);
  };

  const closeSubmissionsModal = () => {
    setShowSubmissionsModal(false);
    setSelectedAssignment(null);
  };

  const openSubmissionDetail = (submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetail(true);
  };

  const closeSubmissionDetail = () => {
    setShowSubmissionDetail(false);
    setSelectedSubmission(null);
  };

  const getAssignmentStatus = (assignment) => {
    if (user?.role === "teacher") return null;
    
    const submission = submissions[assignment._id];
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    
    if (submission) {
      return { status: "submitted", color: "green", icon: FaCheckCircle };
    } else if (dueDate < now) {
      return { status: "overdue", color: "red", icon: FaExclamationTriangle };
    } else {
      return { status: "pending", color: "yellow", icon: FaClock };
    }
  };

  const getSubmissionStats = (assignmentId) => {
    const data  = allSubmissions[assignmentId] || [];
    if (!data?.metadata) return null;
    return {
      submitted: data.metadata.submittedCount,
      pending: data.metadata.pendingCount,
      total: data.metadata.totalStudents
    };
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchAssignments();
    getSubmissionStats();
    // Fetch submissions if user is a student
    if (user?.role === "student") {
      fetchMySubmissions();
    }
  }, [classroomId, user]);

  useEffect(() => {
    if (!classroomId) return;

    if (!socketService.isSocketConnected()) {
      socketService.connect();
    }

    socketService.joinClassroomTabRoom(classroomId);

    const handleNewAssignment = (assignment) => {
      console.log("📬 New assignment from socket:", assignment);

      setAssignments((prev) => {
        const exists = prev.some((a) => a._id === assignment._id);
        if (exists) return prev;
        return [assignment, ...prev];
      });

      // Optional: update student's submission state if needed
      if (user?.role === "student") {
        fetchMySubmissions(); // refresh submissions
      }
    };

    socketService.on("assignment-added", handleNewAssignment);

    return () => {
      socketService.off("assignment-added", handleNewAssignment);
    };
  }, [classroomId, user]);


  if (loading.assignments) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-green-600 mb-4 mx-auto" />
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div className="bg-green-100 p-3 rounded-full">
          <FaBook className="text-green-600 text-xl sm:text-2xl" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Assignments</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {user?.role === "teacher" ? "Manage and track student assignments" : "View and submit your assignments"}
          </p>
        </div>
      </div>

      {/* Create Assignment Form (Teacher Only) */}
      {user?.role === "teacher" && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <FaPlus className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Create New Assignment</h3>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Assignment Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            />
            
            <textarea
              placeholder="Assignment Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={4}
            />
            
            <input
              type="url"
              placeholder="Attachment URL (optional)"
              value={form.fileUrl}
              onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            />
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleCreateAssignment}
              disabled={loading.create || !form.title.trim()}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            >
              {loading.create ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaBook />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-20 bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="bg-gray-100 p-4 rounded-full w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <FaBook className="text-2xl sm:text-3xl text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Assignments Yet</h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto px-4">
              {user?.role === "teacher" 
                ? "Create your first assignment to get started with student submissions." 
                : "Your teacher hasn't posted any assignments yet. Check back later."
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {assignments
              .slice()
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .map((assignment) => {
                const status = getAssignmentStatus(assignment);
                const StatusIcon = status?.icon;
                const stats = user?.role === "teacher" ? getSubmissionStats(assignment._id) : null;
                
                return (
                  <motion.div
                    key={assignment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl p-4 sm:p-6 border border-gray-100 transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{assignment.title}</h3>
                          {status && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800 w-fit`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                            </div>
                          )}
                        </div>
                        
                        {assignment.description && (
                          <p className="text-sm sm:text-base text-gray-600 mb-3 leading-relaxed">{assignment.description}</p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span>Due: {formatDate(assignment.dueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaUsers className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span>By {assignment.author?.username || "Unknown"}</span>
                          </div>
                          {user?.role === "teacher" && stats && (
                            <div className="flex items-center gap-1">
                              <FaClipboardList className="w-3 sm:w-4 h-3 sm:h-4" />
                              <span>{stats.submitted} submissions</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 w-full lg:w-auto">
                        {/* Teacher Actions */}
                        {user?.role === "teacher" && (
                          <button
                            onClick={() => openSubmissionsModal(assignment)}
                            className="flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                          >
                            <FaEye className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="hidden sm:inline">View Submissions</span>
                            <span className="sm:hidden">View</span>
                          </button>
                        )}
                        
                        {/* Student Actions */}
                        {user?.role === "student" && (
                          <div className="flex gap-2 w-full lg:w-auto">
                            {!submissions[assignment._id] ? (
                              <button
                                onClick={() => openSubmissionModal(assignment)}
                                className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                              >
                                <FaUpload className="w-3 sm:w-4 h-3 sm:h-4" />
                                Submit
                              </button>
                            ) : (
                              <span className="flex items-center text-green-600 text-sm sm:text-base font-medium gap-1">
                                <FaCheckCircle className="w-4 h-4" />
                                Submitted
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Attachment */}
                    {assignment.fileUrl && (
                      <div className="border-t pt-4">
                        <a
                          href={assignment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm sm:text-base"
                        >
                          <FaPaperclip className="w-3 sm:w-4 h-3 sm:h-4" />
                          View Attachment
                        </a>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* Student Submission Modal */}
      <AnimatePresence>
        {showSubmissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-75 flex items-center justify-center z-50 p-4"
            onClick={closeSubmissionModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-green-100 p-2 rounded-full">
                  <FaUpload className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Submit Assignment</h3>
                  <p className="text-sm sm:text-base text-gray-600">{selectedAssignment?.title}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Written Submission
                  </label>
                  <textarea
                    value={submissionForm.text}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, text: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                    rows={8}
                    placeholder="Type your submission here..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Attachment (optional)
                  </label>
                  <input
                    type="url"
                    value={submissionForm.fileUrl}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, fileUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Enter file URL (Google Drive, Dropbox, etc.)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your file to a cloud service and paste the shareable link here
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-6">
                <button
                  onClick={closeSubmissionModal}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAssignment}
                  disabled={loading.submit === submissionForm.assignmentId}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                >
                  {loading.submit === submissionForm.assignmentId ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Submissions Modal */}
      <AnimatePresence>
        {showSubmissionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-brightness-75 flex items-center justify-center z-50 p-4"
            onClick={closeSubmissionsModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaClipboardList className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Assignment Submissions</h3>
                    <p className="text-sm sm:text-base text-gray-600">{selectedAssignment?.title}</p>
                  </div>
                </div>
                <button
                  onClick={closeSubmissionsModal}
                  className="text-gray-500 hover:text-gray-700 p-2 self-end sm:self-auto"
                >
                  <FaTimes className="w-4 sm:w-5 h-4 sm:h-5" />
                </button>
              </div>
              
              {allSubmissions[selectedAssignment?._id]?.submissions?.length > 0 ? (
                <div className="space-y-4">
                  {allSubmissions[selectedAssignment._id].submissions.map((submission) => (
                    <div key={submission._id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-800">
                          {submission.student?.username || "Unknown Student"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(submission.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2 whitespace-pre-line">{submission.text}</p>
                      {submission.fileUrl && (
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                        >
                          <FaDownload />
                          Download Attachment
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-4 rounded-full w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 flex items-center justify-center">
                    <FaClipboardList className="text-xl sm:text-2xl text-gray-400" />
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">No Submissions Yet</h4>
                  <p className="text-sm sm:text-base text-gray-500">Students haven't submitted their work for this assignment yet.</p>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssignmentTab;