import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // ADD THIS IMPORT

const SetupPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    profilePic: null,
    profilePicPreview: '',
    role: 'student',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setForm({ 
        ...form, 
        profilePic: file,
        profilePicPreview: previewUrl 
      });
      setError('');
    }
  };

  const removeProfilePic = () => {
    if (form.profilePicPreview) {
      URL.revokeObjectURL(form.profilePicPreview);
    }
    setForm({ 
      ...form, 
      profilePic: null,
      profilePicPreview: '' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('role', form.role);
      if (form.profilePic) {
        formData.append('profilePic', form.profilePic);
      }

      const res = await axios.post(
        'http://localhost:5000/api/setup',
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (res.status === 200) {
        console.log('Setup successful:', res.data);
        window.location.href = '/dashboard';
      } else {
        setError(res.data.message || 'Setup failed.');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError('Session expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response.data?.message || 'Setup failed.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user', {
          withCredentials: true
        });
        if (response.data.setupCompleted) {
          window.location.href = '/dashboard';
        }
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const roleIcons = {
    student: '🎓',
    teacher: '👨‍🏫'
  };

  const roleDescriptions = {
    student: 'Access courses, submit assignments, and track progress',
    teacher: 'Create courses, manage students, and grade assignments'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Just a few more details to get you started</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
                <span className="text-emerald-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField('')}
                  className={`w-full px-4 py-3 pl-12 border-2 rounded-xl bg-gray-50/50 transition-all duration-300 placeholder-gray-400 ${
                    focusedField === 'username' 
                      ? 'border-emerald-400 bg-white shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter your username"
                  required
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  👤
                </div>
              </div>
            </div>

            {/* Profile Picture Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Profile Picture
                <span className="text-gray-400 text-xs ml-2">(optional)</span>
              </label>
              
              {!form.profilePicPreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profilePicInput"
                  />
                  <label
                    htmlFor="profilePicInput"
                    className="flex flex-col items-center justify-center w-full py-8 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400 transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">📸</span>
                    </div>
                    <p className="text-gray-600 font-medium mb-1">Upload a profile picture</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <img
                    src={form.profilePicPreview}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Profile picture selected</p>
                    <p className="text-sm text-gray-500">{form.profilePic?.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeProfilePic}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove picture"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Your Role
                <span className="text-emerald-500 ml-1">*</span>
              </label>
              <div className="grid gap-3">
                {Object.entries(roleIcons).map(([role, icon]) => (
                  <label
                    key={role}
                    className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      form.role === role
                        ? 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        form.role === role ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                      }`}>
                        {icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{role}</div>
                        <div className="text-sm text-gray-500">{roleDescriptions[role]}</div>
                      </div>
                    </div>
                    {form.role === role && (
                      <div className="text-emerald-500">
                        ✓
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !form.username.trim()}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                loading || !form.username.trim()
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Setting up your profile...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Continue to Dashboard
                  <span className="text-lg">→</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Already have an account? 
            <button 
              onClick={() => navigate('/login')}
              className="text-emerald-600 hover:text-emerald-700 font-medium ml-1 transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
