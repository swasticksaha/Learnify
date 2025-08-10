// components/settings/GoogleDriveConnect.jsx
import React, { useState, useEffect, useCallback } from 'react';
import SettingsSection from './SettingsSection';
import { FaGoogleDrive } from 'react-icons/fa';

function GoogleDriveConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if Google Drive is already connected
  const checkDriveConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/api/drive/status', {
        credentials: 'include'
      });
      const data = await res.json();
      setIsConnected(data.connected);
      setError(null);
    } catch (err) {
      console.error('Error checking drive connection:', err);
      setError('Failed to check drive connection');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Google Drive connection
  const handleConnect = async () => {
    try {
      // Open OAuth popup window
      const win = window.open(
        'http://localhost:5000/api/drive/connect',
        'Connect Google Drive',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Monitor the popup window
      const timer = setInterval(() => {
        if (win.closed) {
          clearInterval(timer);
          // Check connection status after popup closes
          checkDriveConnection();
        }
      }, 1000);

      // Fallback timeout to clear interval after 5 minutes
      setTimeout(() => {
        clearInterval(timer);
        if (!win.closed) {
          win.close();
        }
      }, 300000); // 5 minutes

    } catch (error) {
      console.error('Connection failed:', error);
      setError('Failed to connect to Google Drive');
    }
  };

  // Handle disconnection (optional)
  const handleDisconnect = async () => {
    const confirmDisconnect = window.confirm('Are you sure you want to disconnect Google Drive?');
    if (!confirmDisconnect) return;

    try {
      const res = await fetch('http://localhost:5000/api/drive/disconnect', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        setIsConnected(false);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnection failed:', error);
      setError('Failed to disconnect Google Drive');
    }
  };

  // Check connection status on component mount
  useEffect(() => {
    checkDriveConnection();
  }, [checkDriveConnection]);

  if (isLoading) {
    return (
      <SettingsSection icon={FaGoogleDrive} title="Google Drive">
        <div className="flex items-center space-x-2 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <p className="text-[#4B5563]">Checking connection status...</p>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection icon={FaGoogleDrive} title="Google Drive">
      {/* Connection Status */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        <p className="text-[#4B5563]">
          {isConnected
            ? 'Google Drive is connected to your account.'
            : 'Connect your Google Drive to get access to your books and files.'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">{error}</p>
          <button
            onClick={checkDriveConnection}
            className="text-red-600 hover:text-red-800 text-sm font-medium mt-1 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!isConnected ? (
          <button
        onClick={handleConnect}
        className="bg-[#10B981] hover:bg-[#047857] text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto cursor-pointer"
          >
        Connect to Google Drive
          </button>
        ) : (
          <>
        <button
          onClick={checkDriveConnection}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto cursor-pointer"
        >
          Refresh Status
        </button>
        <button
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto cursor-pointer"
        >
          Disconnect
        </button>
          </>
        )}
      </div>

      {/* Additional Info */}
      {isConnected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700 text-sm">
            ✅ Your Google Drive is successfully connected. You can now access your files from the Drive page.
          </p>
        </div>
      )}
    </SettingsSection>
  );
}

export default GoogleDriveConnect;