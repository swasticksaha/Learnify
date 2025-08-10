import { Settings, MoreVertical, BookOpen } from 'lucide-react';

const MeetingHeader = ({ currentTime }) => {
  return (
    <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side: Title + time */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Virtual Classroom
            </h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-gray-600">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MeetingHeader;