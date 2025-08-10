import React from 'react';
import DriveFileCard from './DriveFileCard';

const DriveFileGrid = ({ files, onFileDelete, onFolderOpen }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">No files found in this folder.</p>
      </div>
    );
  }

  // Separate folders and files, then sort them
  const folders = files.filter(file => file.mimeType === 'application/vnd.google-apps.folder');
  const regularFiles = files.filter(file => file.mimeType !== 'application/vnd.google-apps.folder');

  // Sort folders and files alphabetically
  // const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
  // const sortedFiles = regularFiles.sort((a, b) => a.name.localeCompare(b.name));
  const sortedFolders = folders.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
const sortedFiles = regularFiles.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

  // Combine with folders first
  const sortedItems = [...sortedFolders, ...sortedFiles];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sortedItems.map((file) => (
        <DriveFileCard
          key={file.id}
          file={file}
          onDelete={onFileDelete}
          onFolderOpen={onFolderOpen}
        />
      ))}
    </div>
  );
};

export default DriveFileGrid;