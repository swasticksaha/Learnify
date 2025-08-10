import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profilePic: '/image.png',
    role:'student'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await axios.get('/api/user/profile');
      const { username, email, profilePic,role } = res.data;
      
      setProfileData({
        username: username || '',
        email: email || '',
        profilePic: profilePic || '/image.png',
        role: role || 'student'
      });
      
      setIsAuthenticated(true);
      
    } catch (err) {
      console.error('Failed to load profile:', err);
      
      if (err.response?.status === 401) {
        // User is not authenticated
        setIsAuthenticated(false);
        setError('Please log in to view your profile');
      } else {
        // Other error
        setError('Failed to load profile');
      }
      
      setProfileData({
        username: '',
        email: '',
        profilePic: '/image.png',
        role: 'student'
      });
      
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (newProfileData) => {
    setProfileData(prev => ({
      ...prev,
      ...newProfileData
    }));
  };

  const getProfileImageSrc = () => {
    const { profilePic } = profileData;
    if (!profilePic || profilePic === '/image.png') {
      return 'http://localhost:5000/image.png';
    }
    if (profilePic.startsWith('http')) {
      return profilePic; // For Google profile pics
    }
    return `http://localhost:5000${profilePic}`;
  };

  // Check authentication status first
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      // Create a simple auth check endpoint or use existing profile endpoint
      const res = await axios.get('/api/user/profile');
      
      // If we get here, user is authenticated
      const { username, email, profilePic, role } = res.data;
      setProfileData({
        username: username || '',
        email: email || '',
        profilePic: profilePic || '/image.png',
        role: role || 'student'
      });
      setIsAuthenticated(true);
      setError('');
      
    } catch (err) {
      // User is not authenticated or other error
      setIsAuthenticated(false);
      if (err.response?.status === 401) {
        setError(''); // Don't show error for unauthenticated users
      } else {
        setError('Failed to load profile');
      }
      
      setProfileData({
        username: '',
        email: '',
        profilePic: '/image.png',
        role: 'student'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    profileData,
    loading,
    error,
    isAuthenticated,
    fetchProfile,
    updateProfile,
    getProfileImageSrc,
    checkAuthStatus
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};