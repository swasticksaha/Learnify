import React, { useState, useRef } from 'react'
import Header from '../components/common/Header'
import { IoMdAdd } from "react-icons/io";
import DriveComponent from '../components/Books/DriveComponent'
import { useProfile } from '../components/common/ProfileContext';
import axios from 'axios';

function Books() {
  const { profileData } = useProfile();
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const driveComponentRef = useRef(null);

  const handleConnectionChange = (connected) => {
    setIsDriveConnected(connected);
  };

  const handleFileUpload = async (file) => {
    if (profileData?.role !== 'teacher') {
      alert("Only teachers are allowed to upload files.");
      return;
    }
    try {
      setUploadStatus('Uploading...');
      const folderId = driveComponentRef.current?.getCurrentFolderId?.() || 'root';

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `http://localhost:5000/api/drive/upload/${folderId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadStatus('Upload successful!');
      
      setTimeout(() => setUploadStatus(null), 3000);

      if (driveComponentRef.current?.refreshFiles) {
        driveComponentRef.current.refreshFiles();
      }
    
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('Upload failed!');
      
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className={'flex-1 overflow-auto relative z-10'}>
      <Header 
        buttonTitle='Upload to Drive'
        title='Books' 
        icon={<IoMdAdd className='w-7 h-7 cursor-pointer' />}
        uploadEnabled={isDriveConnected}
        onFileUpload={handleFileUpload}
      />
      
      {/* Upload Status Notification */}
      {uploadStatus && (
        <div className={'mx-6 mt-4 p-3 rounded-lg text-center ' + (
              uploadStatus.includes('successful') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : uploadStatus.includes('failed')
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            )}>
          {uploadStatus}
        </div>
      )}
      
      <DriveComponent 
        ref={driveComponentRef} 
        onConnectionChange={handleConnectionChange}
      />
    </div>
  )
}

export default Books;
