import { useEffect, useState } from 'react';
import SettingsSection from './SettingsSection';
import { FaUser, FaPen } from 'react-icons/fa';
import axios from 'axios';
import { useProfile } from '../common/ProfileContext'; // Adjust path as needed

// Configure axios with base URL and credentials
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

function Profile() {
  const { profileData, updateProfile, getProfileImageSrc } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [newPic, setNewPic] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Update local state when profile data changes
  useEffect(() => {
    setUsername(profileData.username || '');
  }, [profileData]);

  // Handle save
  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const formData = new FormData();
      formData.append('username', username.trim());
      if (newPic) formData.append('profilePic', newPic);

      const res = await axios.put('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { username: updatedUsername, profilePic: updatedProfilePic } = res.data;
      
      // Update the global profile context
      updateProfile({
        username: updatedUsername,
        profilePic: updatedProfilePic
      });
      
      setUsername(updatedUsername);
      setNewPic(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNewPic(null);
    setIsEditing(false);
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files (JPEG, PNG, GIF, WebP) are allowed.');
        return;
      }
      
      setError('');
      setNewPic(file);
    }
  };

  const getCurrentImage = () => {
    if (newPic) {
      return URL.createObjectURL(newPic);
    }
    return getProfileImageSrc();
  };

  if (profileData.loading) {
    return (
      <SettingsSection icon={FaUser} title="Profile">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading profile...</div>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection icon={FaUser} title="Profile">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-center mb-6 w-full">
        <div className="relative w-24 h-24 mr-4">
          <img
            src={getCurrentImage()}
            alt="Profile"
            className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ${
              isEditing ? 'filter blur-1px scale-105' : ''
            }`}
            onError={(e) => {
              e.target.src = 'http://localhost:5000/image.png';
            }}
          />
          {isEditing && (
            <label className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer transition">
              <div className="absolute inset-0 bg-opacity-10 backdrop-blur-[1px] rounded-full" />
              <FaPen className="text-white z-10" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="mt-4 sm:mt-0 w-full">
          {isEditing ? (
            <div className="space-y-2">
              <label className="block mb-1 text-sm text-gray-600">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full sm:w-72 px-4 py-2 rounded-lg border border-gray-300 shadow-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#10B981] transition duration-200"
                maxLength={50}
              />
              <p className="text-[#4B5563] text-sm">{profileData.email}</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-[#1F2937]">{username || 'No username set'}</h3>
              <p className="text-[#4B5563]">{profileData.email}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#10B981] hover:bg-[#047857] disabled:bg-gray-400 text-white font-semibold py-2 px-5 rounded-lg transition duration-200"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-black font-semibold py-2 px-5 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#10B981] hover:bg-[#047857] text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            Edit Profile
          </button>
        )}
      </div>
    </SettingsSection>
  );
}

export default Profile;