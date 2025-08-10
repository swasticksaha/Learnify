import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowForward } from "react-icons/io";
import { motion } from 'framer-motion';
import { useProfile } from './ProfileContext';

const Header = ({
  buttonTitle = "",
  title = "",
  icon = null,
  callback = () => {},
  uploadEnabled = false,
  onFileUpload = null,
  acceptedFileTypes = "*/*"
}) => {
  const { profileData,loading, getProfileImageSrc } = useProfile();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleIconClick = useCallback(() => {
    if (profileData?.role !== 'teacher') {
    alert("Only teachers can upload files.");
    return;
    }
    if (!uploadEnabled) {
      window.alert("Connect your Google Drive to upload files.");
    } else if (onFileUpload) {
      fileInputRef.current?.click();
    } else {
      callback();
    }
  }, [uploadEnabled, onFileUpload, callback]);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onFileUpload) return;

    try {
      setIsUploading(true);
      await onFileUpload(file);
      event.target.value = ''; // Clear file input for future uploads
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload]);

  const handleProfileError = useCallback((e) => {
    e.target.src = 'http://localhost:5000/image.png';
  }, []);

  return (
    <header className='bg-[#ECFDF5]/50 backdrop-blur-md shadow-lg border-b border-gray-200 rounded-2xl relative z-40'>
      <div className='w-full py-4 px-6 flex justify-between items-center'>
        {/* Logo and Navigation */}
        <nav className='text-sm font-semibold text-gray-600 flex items-center gap-2 sm:text-2xl'>
          <Link 
            to='/dashboard/classroom' 
            className="flex items-center gap-2 hover:text-green-600 transition-colors"
            aria-label="Home"
          >
            <img 
              src="/WebsiteLogo.png" 
              alt="Classroom Logo" 
              className='w-8 h-8 object-contain' 
            />
            <span>Classroom</span>
          </Link>
          
          {title && (
            <>
              <IoIosArrowForward className='mt-1 text-gray-400' />
              <span className="text-gray-700">{title}</span>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className='flex items-center gap-4 text-gray-600 relative'>
          {/* Upload Button */}
          {icon && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleIconClick}
                disabled={isUploading}
                className={`p-2 rounded-full transition-colors ${
                  isUploading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-[#D1FAE5] cursor-pointer'
                }`}
                title={isUploading ? 'Uploading...' : buttonTitle}
                aria-label={buttonTitle}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  icon
                )}
              </motion.button>

              {/* Hidden File Input */}
              {uploadEnabled && (
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept={acceptedFileTypes}
                  disabled={isUploading}
                />
              )}
            </>
          )}

          {/* Profile Picture */}
          <div className="relative">
            {loading ? (
              <div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse' />
            ) : (
              <Link to="/dashboard/settings" className="block">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={getProfileImageSrc()}
                  alt="Your Profile"
                  className='w-8 h-8 rounded-full object-cover border-2 border-gray-200 hover:border-green-300 transition-colors cursor-pointer'
                  onError={handleProfileError}
                />
              </Link>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
