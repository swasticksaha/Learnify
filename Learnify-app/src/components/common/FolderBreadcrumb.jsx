import React from 'react';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { FaHome } from 'react-icons/fa';

const BreadcrumbItem = ({ folder, index, isLast, onClick }) => (
  <button
    onClick={() => onClick(folder.id, index)}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 truncate group ${
      isLast
        ? 'text-green-600 font-semibold bg-green-50 cursor-default'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 cursor-pointer'
    }`}
    title={folder.name}
    disabled={isLast}
    aria-current={isLast ? 'page' : undefined}
  >
    {index === 0 && (
      <FaHome className={`w-4 h-4 flex-shrink-0 ${
        isLast ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'
      }`} />
    )}
    <span className="truncate text-sm">{folder.name}</span>
  </button>
);

const FolderBreadcrumb = ({ 
  folderHistory = [], 
  onBreadcrumbClick, 
  onGoBack, 
  canGoBack = false 
}) => {
  if (!folderHistory.length) {
    return null;
  }

  const depth = folderHistory.length - 1;

  return (
    <nav 
      className="mb-6 flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
      aria-label="Breadcrumb navigation"
    >
      {/* Back Button */}
      <button
        onClick={onGoBack}
        disabled={!canGoBack}
        className={`p-2 rounded-full transition-all duration-200 ${
          canGoBack 
            ? 'hover:bg-gray-100 text-gray-600 cursor-pointer hover:scale-105 active:scale-95' 
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title={canGoBack ? "Go back" : "Can't go back"}
        aria-label="Go back"
      >
        <IoIosArrowBack className="w-5 h-5" />
      </button>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {folderHistory.map((folder, index) => (
          <React.Fragment key={`${folder.id}-${index}`}>
            {index > 0 && (
              <IoIosArrowForward 
                className="text-gray-400 w-4 h-4 flex-shrink-0" 
                aria-hidden="true" 
              />
            )}
            <BreadcrumbItem
              folder={folder}
              index={index}
              isLast={index === folderHistory.length - 1}
              onClick={onBreadcrumbClick}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Depth Indicator */}
      {depth > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-full">
          <span>{depth} level{depth > 1 ? 's' : ''} deep</span>
          {depth > 3 && (
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" title="Deep navigation" />
          )}
        </div>
      )}
    </nav>
  );
};

export default FolderBreadcrumb;