import { Send, X, MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const ChatPanel = ({
  showChat,
  setShowChat,
  messages,
  chatMessage,
  setChatMessage,
  handleSendMessage,
  handleKeyPress,
  currentUser
}) => {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (showChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showChat]);

  if (!showChat) return null;

  const enhancedMessages = messages.map(msg => ({
    ...msg,
    isCurrentUser: msg.sender === currentUser?.name || msg.userId === currentUser?.id
  }));

  return (
    <div className="w-80 bg-white border-l border-gray-300 flex flex-col animate-in slide-in-from-right duration-300 shadow-xl">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-gray-800">
            Class Discussion
          </h3>
          {messages.length > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowChat(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          title="Close chat"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {enhancedMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the discussion!</p>
          </div>
        ) : (
          enhancedMessages.map((msg, index) => (
            <ChatMessage key={msg.id || index} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            maxLength={500}
          />
          <button
            onClick={handleSendMessage}
            disabled={!chatMessage.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            title="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Press Enter to send
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;