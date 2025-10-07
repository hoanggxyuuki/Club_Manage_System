import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Send, X, Minimize, MessageSquare, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const MiniChatWindow = ({ onClose, onMinimize, onClickUser }) => {
  const {
    activeChat,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    typingUsers,
    isConnected,
  } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const url = import.meta.env.VITE_PROXY_API_URL;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const handleTyping = () => {
    if (!activeChat || !isTyping) return;
    setIsTyping(true);
    startTyping(activeChat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(activeChat._id);
    }, 1000);
  };

  const handleReaction = (messageId, emoji) => {
    if (!activeChat) return;
    addReaction(activeChat._id, messageId, emoji.native);
    setShowReactionPicker(null);
  };

  const handleRemoveReaction = (messageId) => {
    if (!activeChat) return;
    removeReaction(activeChat._id, messageId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    const messageContent = message.trim();
    setMessage("");
    if (isTyping) {
      stopTyping(activeChat._id);
      setIsTyping(false);
    }

    try {
      await sendMessage(activeChat._id, messageContent, replyToMessage?._id);
      if (replyToMessage) {
        setReplyToMessage(null);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!activeChat) return null;

  const currentUserId = user?.userId;
  const partner = activeChat.participants.find((p) => p._id !== currentUserId);

  const getSenderId = (msg) => {
    if (msg.pending) return currentUserId;
    return msg.sender?._id || msg.sender || "";
  };

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-white rounded-t-lg shadow-lg overflow-hidden border border-gray-200 z-50">
      <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
        <div
          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg transition-colors duration-200"
          onClick={() => onClickUser?.(partner)}
        >
          {partner?.avatar ? (
            <img
              src={`${url}${partner.avatar}`}
              alt={partner.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {partner?.fullName?.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
              {partner?.fullName}
            </h3>
            {typingUsers[activeChat._id]?.length > 0 && (
              <p className="text-xs text-blue-500">typing...</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onMinimize}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Minimize className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="h-96 overflow-y-auto bg-gray-50 p-3">
        <div className="space-y-4">
          {activeChat.messages.map((msg, index) => {
            const senderId = getSenderId(msg);
            const isOwn = senderId === currentUserId;
            const messageKey = `${msg._id || "temp"}-${index}-${msg.timestamp}`;

            return (
              <div
                key={messageKey}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div className="relative">
                    {msg.replyTo && (
                      <div className="mb-1 ml-2 text-xs text-gray-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="opacity-75">
                          {activeChat.messages
                            .find((m) => m._id === msg.replyTo)
                            ?.content?.substring(0, 30)}
                          ...
                        </span>
                      </div>
                    )}
                    <div
                      className={`group/message px-3 py-2 rounded-lg ${
                        isOwn
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <div
                        className={`absolute ${isOwn ? "left-0" : "right-0"} top-1/2 transform -translate-y-1/2
                        ${isOwn ? "-translate-x-full" : "translate-x-full"} opacity-0 group-hover/message:opacity-100
                        transition-opacity duration-200 flex flex-col gap-1 mx-1`}
                      >
                        <button
                          onClick={() => setShowReactionPicker(msg._id)}
                          className="p-1 rounded-full bg-white shadow-md hover:bg-gray-50"
                        >
                          <Smile className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setReplyToMessage(msg)}
                          className="p-1 rounded-full bg-white shadow-md hover:bg-gray-50"
                        >
                          <MessageSquare className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      {showReactionPicker === msg._id && (
                        <div
                          className={`absolute bottom-full ${isOwn ? "right-0" : "left-0"} mb-2 z-50`}
                        >
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) =>
                              handleReaction(msg._id, emoji)
                            }
                            theme="light"
                            previewPosition="none"
                            skinTonePosition="none"
                            perLine={8}
                            maxFrequentRows={1}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <span className="text-xs text-gray-500 mt-1">
                                 {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                </span> */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex items-center gap-1 bg-white rounded-full shadow-sm py-0.5 px-2 mt-1">
                          {msg.reactions.map((reaction, index) => (
                            <span
                              key={`${reaction.userId}-${index}`}
                              className="cursor-pointer hover:bg-gray-100 rounded p-0.5 relative group/reaction"
                              onClick={() => {
                                if (
                                  reaction.userId?.toString() === currentUserId
                                ) {
                                  handleRemoveReaction(msg._id);
                                }
                              }}
                            >
                              {reaction.emoji}
                              <span
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1
                                opacity-0 group-hover/reaction:opacity-100 transition-opacity duration-200
                                text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap z-30"
                              >
                                {reaction.userId?.toString() === currentUserId
                                  ? "You"
                                  : "Other"}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200">
        {replyToMessage && (
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />

              <span className="text-sm text-gray-600 truncate">
                {replyToMessage.content}
              </span>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
        <div className="p-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type your message..."
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-full
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700
                      disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MiniChatWindow;
