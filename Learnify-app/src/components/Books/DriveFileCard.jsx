import { useState, useEffect } from 'react';
import { FaFolder, FaFile, FaVideo, FaRegFilePdf, FaRegFileAudio, FaTimes, FaExternalLinkAlt, FaFolderOpen } from "react-icons/fa";
import axios from 'axios';

const DriveFileCard = ({ file, onDelete, onFolderOpen }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Auto-clear loading state after a timeout as fallback
  useEffect(() => {
    if (previewLoading) {
      const timer = setTimeout(() => {
        setPreviewLoading(false);
      }, 3000); // 3 second timeout
      
      return () => clearTimeout(timer);
    }
  }, [previewLoading]);

  const isImage = (mime) => mime.startsWith('image/');
  const isVideo = (mime) => mime.startsWith('video/');
  const isPDF = (mime) => mime === 'application/pdf';
  const isAudio = (mime) => mime.startsWith('audio/');
  const isFolder = (mime) => mime === 'application/vnd.google-apps.folder';
  const isGoogleDoc = (mime) => mime === 'application/vnd.google-apps.document';
  const isGoogleSheet = (mime) => mime === 'application/vnd.google-apps.spreadsheet';
  const isGoogleSlide = (mime) => mime === 'application/vnd.google-apps.presentation';

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Delete "${file.name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/drive/delete/${file.id}`, {}, {
        withCredentials: true,
      });

      if (res.status === 200) {
        onDelete(file.id);
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    
    if (isFolder(file.mimeType)) {
      // Handle folder opening
      if (onFolderOpen) {
        onFolderOpen(file);
      }
      return;
    }
    
    // Handle file preview
    console.log('Opening preview for:', file.name, 'Type:', file.mimeType);
    setShowPreview(true);
    setPreviewLoading(true);
  };

  const getPreviewUrl = () => {
    const baseUrl = `http://localhost:5000/api/drive/preview/${file.id}`;
    
    if (isGoogleDoc(file.mimeType) || isGoogleSheet(file.mimeType) || isGoogleSlide(file.mimeType)) {
      // For Google Workspace files, use Google's preview
      return `https://drive.google.com/file/d/${file.id}/preview`;
    }
    
    return baseUrl;
  };

  const getDirectViewUrl = () => {
    return `https://drive.google.com/file/d/${file.id}/view`;
  };

  const renderFileIcon = () => {
    const iconClass = "text-5xl mb-3";
    
    if (isFolder(file.mimeType)) {
      return (
        <div className="relative">
          <FaFolder className={`${iconClass} text-blue-500`} />
          {/* Small overlay icon to indicate it's openable */}
          <FaFolderOpen className="absolute top-0 right-0 text-lg text-blue-600 opacity-70" />
        </div>
      );
    }
    
    if (isImage(file.mimeType))
      return (
        <img
          src={`http://localhost:5000/api/drive/preview/${file.id}`}
          alt={file.name}
          className="w-full h-36 object-cover rounded-lg shadow"
        />
      );
    if (isVideo(file.mimeType)) return <FaVideo className={`${iconClass} text-red-500`} />;
    if (isPDF(file.mimeType)) return <FaRegFilePdf className={`${iconClass} text-red-600`} />;
    if (isAudio(file.mimeType)) return <FaRegFileAudio className={`${iconClass} text-purple-500`} />;
    return <FaFile className={`${iconClass} text-gray-500`} />;
  };

  const renderPreviewContent = () => {
    // For unsupported file types, don't show loading
    if (!isImage(file.mimeType) && !isVideo(file.mimeType) && !isAudio(file.mimeType) && 
        !isPDF(file.mimeType) && !isGoogleDoc(file.mimeType) && 
        !isGoogleSheet(file.mimeType) && !isGoogleSlide(file.mimeType)) {
      return (
        <div className="flex flex-col items-center p-8 text-center">
          <FaFile className="text-6xl text-green-600 mb-4" />
          <p className="text-lg font-semibold mb-2">{file.name}</p>
          <p className="text-gray-600 mb-4">Preview not available for this file type</p>
          <a
            href={getDirectViewUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FaExternalLinkAlt className="text-sm" />
            Open in Google Drive
          </a>
        </div>
      );
    }

    if (previewLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading preview...</span>
        </div>
      );
    }

    if (isImage(file.mimeType)) {
      return (
        <div className="relative">
          <img
            src={`http://localhost:5000/api/drive/preview/${file.id}`}
            alt={file.name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onLoad={() => {
              console.log('Image loaded successfully');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('Image failed to load:', e);
              setPreviewLoading(false);
            }}
            style={{ display: previewLoading ? 'none' : 'block' }}
          />
        </div>
      );
    }

    if (isVideo(file.mimeType)) {
      const videoUrl = getPreviewUrl();
      console.log('Loading video from:', videoUrl);
      return (
        <div className="relative">
          <video
            controls
            className="max-w-full max-h-[80vh] rounded-lg"
            onLoadStart={() => setPreviewLoading(false)}
            onCanPlay={() => {
              console.log('Video can play');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('Video failed to load:', e);
              setPreviewLoading(false);
            }}
            style={{ display: previewLoading ? 'none' : 'block' }}
          >
            <source src={videoUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio(file.mimeType)) {
      const audioUrl = getPreviewUrl();
      console.log('Loading audio from:', audioUrl);
      return (
        <div className="flex flex-col items-center p-8">
          <FaRegFileAudio className="text-6xl text-green-600 mb-4" />
          <p className="text-lg font-semibold mb-4">{file.name}</p>
          <audio
            controls
            className="w-full max-w-md"
            onLoadStart={() => setPreviewLoading(false)}
            onCanPlay={() => {
              console.log('Audio can play');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('Audio failed to load:', e);
              setPreviewLoading(false);
            }}
          >
            <source src={audioUrl} type={file.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (isPDF(file.mimeType) || isGoogleDoc(file.mimeType) || isGoogleSheet(file.mimeType) || isGoogleSlide(file.mimeType)) {
      const previewUrl = getPreviewUrl();
      console.log('Loading document from:', previewUrl);
      return (
        <div className="relative">
          <iframe
            src={previewUrl}
            className="w-[90vw] h-[80vh] rounded-lg border"
            title={file.name}
            onLoad={() => {
              console.log('Document loaded successfully');
              setPreviewLoading(false);
            }}
            onError={(e) => {
              console.error('Document failed to load:', e);
              setPreviewLoading(false);
            }}
            style={{ display: previewLoading ? 'none' : 'block' }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div 
        className={`border rounded-2xl shadow hover:shadow-md transition-all p-5 flex flex-col items-center text-center cursor-pointer ${
          isFolder(file.mimeType) 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-green-50 border-green-200 hover:bg-green-100'
        }`}
        onClick={handleCardClick}
      >
        {renderFileIcon()}

        <p className="text-sm font-semibold text-gray-700 mt-2 truncate w-full" title={file.name}>
          {file.name}
        </p>
        {file.isShared && (
          <span className="text-xs text-gray-400">Shared</span>
        )}
        {/* Show different text for folders */}
        {isFolder(file.mimeType) && (
          <p className="text-xs text-green-600 mt-1">Click to open folder</p>
        )}

        <div className="flex gap-2 mt-4">
          {!isFolder(file.mimeType) && (
            <a
              href={`http://localhost:5000/api/drive/download/${file.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-xs rounded-lg shadow transition"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          )}
          {
            !file.isShared ? (
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 text-xs rounded-lg shadow transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                Delete
              </button>
            ): null
          }
        </div>
      </div>

      {/* Preview Modal - Only for non-folder files */}
      {showPreview && !isFolder(file.mimeType) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-2xl w-[95vw] h-[95vh] max-w-7xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
                {file.name}
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href={getDirectViewUrl()}
                  target="_blank"
                  className="text-green-600 hover:text-green-700 transition"
                  title="Open in Google Drive"
                >
                  <FaExternalLinkAlt className="text-lg" />
                </a>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 transition p-1 cursor-pointer"
                  title="Close"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex items-center justify-center">
              {renderPreviewContent()}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-600">
                {file.mimeType} • {file.size ? `${Math.round(file.size / 1024)} KB` : 'Size unknown'}
              </div>
              <div className="flex gap-2">
                <a
                  href={`http://localhost:5000/api/drive/download/${file.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-lg transition"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriveFileCard;