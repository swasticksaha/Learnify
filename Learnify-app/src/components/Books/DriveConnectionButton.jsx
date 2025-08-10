import React from 'react';
import { useNavigate } from 'react-router-dom';

const DriveConnectionButton = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    // Just redirect - no connection work
    navigate('/dashboard/settings');
  };

  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <div className="text-6xl mb-4">🔗</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Connect Your Google Drive
        </h3>
        <p className="text-gray-500 mb-6">
          Access and manage your Google Drive files directly from here
        </p>
      </div>
      
      <button
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium cursor-pointer"
        onClick={handleButtonClick}
      >
        Connect Google Drive
      </button>
    </div>
  );
};

export default DriveConnectionButton;