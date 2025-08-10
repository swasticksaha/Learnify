import React from 'react';

const DriveHeader = ({ isConnected, fileCount, currentFolder = 'My Drive' }) => {
  return (
    <div className="mb-6">
      {isConnected && (
        <div className="mt-2 justify-between flex items-center">
          <h4 className="text-xl font-semibold text-gray-700">
            {currentFolder}
            {fileCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({fileCount} item{fileCount !== 1 ? 's' : ''})
              </span>
            )}  
          </h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveHeader;