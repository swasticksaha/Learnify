import { User } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isCurrentUser = message.isCurrentUser || false;
  
  return (
    <div className={`space-y-2 p-3 rounded-lg transition-all duration-200 ${
      isCurrentUser 
        ? 'bg-emerald-50 border border-emerald-200 ml-4 shadow-sm' 
        : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
    }`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className={`text-sm font-semibold ${
            isCurrentUser ? 'text-emerald-700' : 'text-gray-700'
          }`}>
            {message.sender}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {message.time || new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
      <div className={`text-sm ${
        isCurrentUser ? 'text-gray-800' : 'text-gray-700'
      }`}>
        {message.message || message.text}
      </div>
    </div>
  );
};

export default ChatMessage;