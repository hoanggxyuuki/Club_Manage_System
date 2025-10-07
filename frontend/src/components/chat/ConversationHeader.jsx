import React from "react";
import { useChat } from "../../context/ChatContext";
import { useVideoCall } from "../../context/VideoCallContext";
import { Video, Info } from "lucide-react";

const ConversationHeader = ({ conversation }) => {
  const { setShowInfo } = useChat();
  const { startCall } = useVideoCall();

  
  const participant = conversation?.participants?.find(
    (p) => p._id !== localStorage.getItem("userId"),
  );

  
  const handleVideoCall = () => {
    if (participant?._id) {
      startCall(participant._id);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 p-3 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={participant?.avatar || "/default-avatar.png"}
            alt={participant?.username}
            className="w-10 h-10 rounded-full"
          />

          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
        </div>
        <div>
          <h2 className="font-medium text-gray-800 dark:text-white">
            {participant?.username}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
        </div>
      </div>

      <div className="flex space-x-2">
        {/* Nút gọi video */}
        <button
          onClick={handleVideoCall}
          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Gọi video"
        >
          <Video size={20} />
        </button>

        {/* Nút hiển thị thông tin */}
        <button
          onClick={() => setShowInfo(true)}
          className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
          title="Thông tin cuộc trò chuyện"
        >
          <Info size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConversationHeader;
