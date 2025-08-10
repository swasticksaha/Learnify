import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import DriveHeader from './DriveHeader';
import DriveConnectionButton from './DriveConnectionButton';
import DriveFileGrid from './DriveFileGrid';
import FolderBreadcrumb from '../common/FolderBreadcrumb';
import { useProfile } from '../common/ProfileContext';

const DriveComponent = forwardRef(({ onConnectionChange }, ref) => {
  const { profileData } = useProfile();
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderHistory, setFolderHistory] = useState([
    { id: 'root', name: 'My Drive' }
  ]);

  const checkDriveConnection = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/drive/status', {
        credentials: 'include'
      });
      const data = await res.json();
      const connected = data.connected;
      setIsDriveConnected(connected);
      if (onConnectionChange) {
        onConnectionChange(connected);
      }
    } catch (err) {
      console.error('Error checking drive connection:', err);
      setError('Failed to check drive connection');
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    }
  }, [onConnectionChange]);

  const fetchDriveFiles = useCallback(async (folderId = 'root') => {
    try {
      setLoading(true);
      let url;
      if (folderId === 'root'){
        url = profileData?.role === 'Teacher' 
        ? 'http://localhost:5000/api/drive/dashboard-data'
        : 'http://localhost:5000/api/drive/combined-root'
      }else{
        url= `http://localhost:5000/api/drive/folder/${folderId}`;
      }
      const res = await fetch(url, {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await res.json();
      setFiles(data.files || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileDelete = useCallback(async (fileId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/drive/delete/${fileId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      await fetchDriveFiles(currentFolderId);

    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  }, [currentFolderId, fetchDriveFiles]);

  const handleFolderOpen = useCallback(async (folder) => {
    try {
      setCurrentFolderId(folder.id);
      setFolderHistory(prev => {
        const exists = prev.find(item => item.id === folder.id);
        if (!exists) {
          return [...prev, { id: folder.id, name: folder.name }];
        }
        return prev;
      });
      await fetchDriveFiles(folder.id);
    } catch (error) {
      console.error('Error opening folder:', error);
      setError('Failed to open folder');
    }
  }, [fetchDriveFiles]);

  const handleBreadcrumbClick = useCallback(async (folderId, clickedIndex) => {
    try {
      setCurrentFolderId(folderId);
      setFolderHistory(prev => prev.slice(0, clickedIndex + 1));
      await fetchDriveFiles(folderId);
    } catch (error) {
      console.error('Error navigating to folder:', error);
      setError('Failed to navigate to folder');
    }
  }, [fetchDriveFiles]);

  const handleGoBack = useCallback(() => {
    if (folderHistory.length > 1) {
      const newHistory = folderHistory.slice(0, -1);
      const parentFolder = newHistory[newHistory.length - 1];
      setFolderHistory(newHistory);
      setCurrentFolderId(parentFolder.id);
      fetchDriveFiles(parentFolder.id);
    }
  }, [folderHistory, fetchDriveFiles]);

  useImperativeHandle(ref, () => ({
    refreshFiles: () => {
      if (isDriveConnected) {
        fetchDriveFiles(currentFolderId);
      }
    },
    isConnected: () => isDriveConnected,
    checkConnection: checkDriveConnection,
    goToRoot: () => {
      setCurrentFolderId('root');
      setFolderHistory([{ id: 'root', name: 'My Drive' }]);
      fetchDriveFiles('root');
    },
    getCurrentFolderId: () => currentFolderId
  }));

  useEffect(() => {
    checkDriveConnection();
  }, [checkDriveConnection]);

  useEffect(() => {
    if (isDriveConnected) {
      fetchDriveFiles(currentFolderId);
    } else {
      setLoading(false);
    }
  }, [isDriveConnected, fetchDriveFiles, currentFolderId]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={checkDriveConnection}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DriveHeader
        isConnected={isDriveConnected}
        fileCount={files.length}
        currentFolder={folderHistory[folderHistory.length - 1]?.name || 'My Drive'}
      />
      {isDriveConnected && (
        <FolderBreadcrumb 
          folderHistory={folderHistory}
          onBreadcrumbClick={handleBreadcrumbClick}
          onGoBack={handleGoBack}
          canGoBack={folderHistory.length > 1}
        />
      )}
      {!isDriveConnected ? (
        <DriveConnectionButton />
      ) : (
        <DriveFileGrid 
          files={files} 
          onFileDelete={handleFileDelete}
          onFolderOpen={handleFolderOpen}
        />
      )}
    </div>
  );
});

export default DriveComponent;
