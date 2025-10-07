import React, { useEffect } from "react";
import { useVideoCall } from "../../context/VideoCallContext";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

/**
 * GlobalCallHandler - Component để xử lý các sự kiện video call toàn cục
 * Đặt component này trong App.jsx để có thể xử lý cuộc gọi từ mọi nơi trong ứng dụng
 */
const GlobalCallHandler = () => {
  const { socket, activeChat, chats } = useChat();
  const { user } = useAuth();
  const {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    callState,
    incomingCall,
  } = useVideoCall();

  
  useEffect(() => {
    if (!socket) return;

    
    const handleIncomingCall = ({ callerId, callerName }) => {
      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} 
                        max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto 
                        flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Cuộc gọi đến từ {callerName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center 
                       justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Đóng
              </button>
            </div>
          </div>
        ),

        { duration: 4000 },
      );
    };

    
    socket.on("incoming_call_notification", handleIncomingCall);

    return () => {
      socket.off("incoming_call_notification", handleIncomingCall);
    };
  }, [socket]);

  
  useEffect(() => {
    if (incomingCall) {
      const caller = chats.find(
        (chat) =>
          chat.participants &&
          chat.participants.some((p) => p._id === incomingCall.id),
      );

      if (caller) {
        
        const audio = new Audio("/sounds/ringtone.mp3");
        audio.loop = true;
        audio
          .play()
          .catch((err) => console.error("Cannot play ringtone:", err));

        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      }
    }
  }, [incomingCall, chats]);

  
  return null;
};

export default GlobalCallHandler;
