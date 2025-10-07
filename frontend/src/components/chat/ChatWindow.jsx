import React, { useState, useEffect, useRef } from "react";
import VideoCall from "./VideoCall";
import VideoCallDialog from "./VideoCallDialog";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  Smile,
  Reply,
  X,
  ArrowLeft,
  Video,
  PhoneOff,
  Mic,
  MoreVertical,
} from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { ChatUrlPreview } from "./ChatUrlPreview";
import MobileBottomSheet from "./MobileBottomSheet";
import EmojiBottomSheet from "./EmojiBottomSheet";
import useIsMobile from "../../hooks/useIsMobile";
import "./ChatReactions.css";

const ChatWindow = ({ onMobileBack }) => {
  const {
    activeChat,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    isConnected,
    addReaction,
    removeReaction,
    replyToMessage,
    setReplyToMessage,
    deleteMessage,
    socket,
  } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const messageEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const previousMessageCount = useRef(0);
  const reactionPickerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const url = import.meta.env.VITE_PROXY_API_URL;
  const isMobile = useIsMobile(768);

  useEffect(() => {
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window) &&
      !("mozSpeechRecognition" in window) &&
      !("msSpeechRecognition" in window)
    ) {
      console.log(
        "Tính năng nhận dạng giọng nói không được hỗ trợ trên trình duyệt này",
      );
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;

    const getVoiceLanguages = () => {
      return new Promise((resolve) => {
        if (window.speechSynthesis) {
          let voices = window.speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve(voices);
            };
          }
        } else {
          resolve([]);
        }
      });
    };

    recognition.lang = "vi-VN";

    getVoiceLanguages().then((voices) => {
      console.log(
        "Các ngôn ngữ được hỗ trợ:",
        voices.map((v) => `${v.name} (${v.lang})`),
      );
    });

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      
      if (finalTranscript) {
        setMessage((prevMessage) => {
          const newMessage = prevMessage + " " + finalTranscript;
          return newMessage.trim();
        });
      }

      
      if (messageInputRef.current) {
        messageInputRef.current.style.height = "auto";
        messageInputRef.current.style.height =
          Math.min(messageInputRef.current.scrollHeight, 150) + "px";
      }
    };

    
    recognition.onend = () => {
      setIsListening(false);
    };

    
    recognition.onerror = (event) => {
      console.error("Lỗi nhận dạng giọng nói:", event.error);
      if (event.error === "not-allowed") {
        alert(
          "Vui lòng cấp quyền truy cập microphone để sử dụng tính năng này",
        );
      } else if (event.error === "no-speech") {
        console.log("Không phát hiện giọng nói, vui lòng thử lại");
      }
      setIsListening(false);
    };

    
    setSpeechRecognition(recognition);

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechRecognition) return;

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      speechRecognition.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    const currentCount = activeChat?.messages?.length || 0;
    if (currentCount !== previousMessageCount.current) {
      previousMessageCount.current = currentCount;
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?.messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming_call", (data) => {
      setIncomingCall(data);
    });

    socket.on("call_connected", ({ roomId }) => {
      setShowVideoCall(true);
    });

    socket.on("call_rejected", () => {
      alert("Video call was rejected");
    });

    socket.on("call_ended", () => {
      setShowVideoCall(false);
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_connected");
      socket.off("call_rejected");
      socket.off("call_ended");
    };
  }, [socket]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker(null);
      }
      
      
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      
      
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeChat) {
      setShowEmojiPicker(false);
      setShowReactionPicker(null);
      setShowMobileMenu(null);
      setReplyToMessage(null);
    }
  }, [activeChat]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    const messageContent = message.trim();
    setMessage("");
    if (isTyping) {
      stopTyping(activeChat._id);
      setIsTyping(false);
    }

    
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "42px";
    }

    try {
      await sendMessage(activeChat._id, messageContent);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleReaction = (messageId, emoji) => {
    if (!activeChat) return;
    addReaction(activeChat._id, messageId, emoji.native);
    setShowReactionPicker(null);
  };

  
  const getReactionPickerPosition = (isOwn) => {
    if (isMobile) {
      return {
        position: "fixed",
        className: "mobile-reaction-picker"
      };
    }
    
    return {
      position: "absolute", 
      className: `absolute ${isOwn ? "right-0" : "left-0"} bottom-full transform -translate-y-2`
    };
  };

  
  const getMobileMenuPosition = (messageId, isOwn) => {
    if (typeof window === 'undefined') {
      return {};
    }

    if (!isMobile) {
      
      return {
        top: '100%',
        marginTop: '8px',
        left: isOwn ? 'auto' : '0',
        right: isOwn ? '0' : 'auto',
        maxWidth: 'calc(100vw - 2rem)'
      };
    }

    
    return {};
  };

  
  useEffect(() => {
    if (isMobile && (showReactionPicker || showEmojiPicker || showMobileMenu)) {
      document.body.classList.add('body-no-scroll');
      
      if (showMobileMenu) {
        document.body.classList.add('bottom-sheet-open');
      }
      if (showEmojiPicker) {
        document.body.classList.add('emoji-picker-open');
      }
    } else {
      document.body.classList.remove('body-no-scroll');
      document.body.classList.remove('bottom-sheet-open');
      document.body.classList.remove('emoji-picker-open');
    }

    return () => {
      document.body.classList.remove('body-no-scroll');
      document.body.classList.remove('bottom-sheet-open');
      document.body.classList.remove('emoji-picker-open');
    };
  }, [showReactionPicker, showEmojiPicker, showMobileMenu, isMobile]);
  useEffect(() => {
    const handleResize = () => {
      
      if (isMobile) {
        setShowReactionPicker(null);
        setShowEmojiPicker(false);
        setShowMobileMenu(null);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile]);

  
  useEffect(() => {
    if (showMobileMenu && isMobile) {
      
      document.body.classList.add('bottom-sheet-open');
    } else {
      document.body.classList.remove('bottom-sheet-open');
    }
  }, [showMobileMenu, isMobile]);

  const handleRemoveReaction = (messageId) => {
    if (!activeChat) return;
    removeReaction(activeChat._id, messageId);
  };

  const handleReply = (message) => {
    setReplyToMessage(message);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 0);
  };

  
  useEffect(() => {
    const handleScroll = () => {
      setShowReactionPicker(null);
      setShowEmojiPicker(false);
      setShowMobileMenu(null);
    };

    const chatContainer = document.querySelector('.overflow-y-auto');
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  
  useEffect(() => {
    const handleKeyDown = (e) => {
      
      if (e.key === 'Escape') {
        setShowReactionPicker(null);
        setShowEmojiPicker(false);
        setShowMobileMenu(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">
          Chọn một cuộc trò chuyện để bắt đầu
        </p>
      </div>
    );
  }

  const currentUserId = user?.userId;
  const partner = activeChat.participants.find((p) => p._id !== currentUserId);

  const getSenderId = (msg) => {
    if (msg.pending) return currentUserId;
    return msg.sender?._id || msg.sender || "";
  };

  const MessageBubble = ({ msg, isOwn }) => {
    const originalMessage = msg.replyTo
      ? activeChat.messages.find((m) => m._id === msg.replyTo)
      : null;

    return (
      <div
        className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1 px-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1">
            {msg.sender?.avatar ? (
              <img
                src={`${url}${msg.sender.avatar}`}
                alt={msg.sender.fullName.charAt(0)}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : null}
            <span className="text-xs text-gray-500">{partner?.fullName}</span>
          </div>
        )}
        <div className="relative group">
          {originalMessage && (
            <div
              className={`
                mb-2 px-3 py-2 text-xs rounded-lg cursor-pointer
                ${isOwn ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}
              `}
              onClick={() => {
                const element = document.getElementById(
                  `msg-${originalMessage._id}`,
                );
                if (element) {
                  element.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  element.classList.add("bg-gray-100");
                  setTimeout(
                    () => element.classList.remove("bg-gray-100"),
                    1000,
                  );
                }
              }}
            >
              <span className="font-medium">
                {originalMessage.sender._id === currentUserId
                  ? "You"
                  : originalMessage.sender.fullName}
              </span>
              <p className="truncate mt-1">
                {originalMessage.content.length > 20
                  ? originalMessage.content.substring(0, 20) + "..."
                  : originalMessage.content}
              </p>
            </div>
          )}
          <div
            className={`
            px-4 py-[10px] rounded-2xl relative space-y-1
            ${
              isOwn
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100"
            }
          `}
          >
            <div className="space-y-2">
              <p
                className={`
                text-sm whitespace-pre-line break-words overflow-y-auto leading-relaxed
                ${msg.isDeleted ? "italic text-gray-500" : ""}
              `}
                style={{
                  maxWidth: "89ch",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {msg.isDeleted ? (
                  <span className="flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {msg.content}
                  </span>
                ) : (
                  msg.content.split("\n").map((line, i, arr) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))
                )}
              </p>

              {/* Add URL Preview */}
              {!msg.isDeleted && <ChatUrlPreview message={msg.content} />}
            </div>

            {!msg.pending && (
              <div
                className={`
                  absolute ${isOwn ? "-left-14 md:-left-16" : "-right-14 md:-right-16"} 
                  top-1/2 transform -translate-y-1/2
                  transition-all duration-200 ease-in-out
                  scale-95 group-hover:scale-100
                `}
              >
                {/* Desktop: Individual buttons */}
                <div className="hidden md:flex items-center gap-1 bg-white rounded-full shadow-lg border border-gray-100 
                               p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100">
                  {!msg.isDeleted && (
                    <>
                      <button
                        onClick={() => handleReply(msg)}
                        className="hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150 group/btn
                                 flex items-center justify-center"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4 text-gray-500 group-hover/btn:text-blue-600 transition-colors duration-150" />
                      </button>
                      <button
                        onClick={() => setShowReactionPicker(msg._id)}
                        className="hover:bg-gray-100 p-1.5 rounded-full transition-colors duration-150 group/btn
                                 flex items-center justify-center"
                        title="Add reaction"
                      >
                        <Smile className="w-4 h-4 text-gray-500 group-hover/btn:text-yellow-500 transition-colors duration-150" />
                      </button>
                      {isOwn &&
                        Date.now() - new Date(msg.timestamp).getTime() <=
                          15 * 60 * 1000 && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Bạn có chắc chắn muốn thu hồi tin nhắn này?",
                                )
                              ) {
                                deleteMessage(activeChat._id, msg._id);
                              }
                            }}
                            className="hover:bg-red-50 p-1.5 rounded-full transition-colors duration-150 group/btn
                                     flex items-center justify-center"
                            title="Delete message"
                          >
                            <X className="w-4 h-4 text-gray-500 group-hover/btn:text-red-500 transition-colors duration-150" />
                          </button>
                        )}
                    </>
                  )}
                </div>

                {/* Mobile: Three-dot menu */}
                <div className="md:hidden relative">
                  <button
                    onClick={(e) => {
                      
                      setShowReactionPicker(null);
                      setShowEmojiPicker(false);
                      
                      
                      if ('vibrate' in navigator) {
                        navigator.vibrate(10);
                      }
                      
                      const newMenuState = showMobileMenu === msg._id ? null : msg._id;
                      setShowMobileMenu(newMenuState);
                    }}
                    className="bg-white rounded-full shadow-lg border border-gray-100 p-2 
                             hover:bg-gray-50 transition-all duration-200 
                             active:scale-95 flex items-center justify-center
                             min-w-[2.5rem] min-h-[2.5rem] mobile-menu-btn"
                    title="Message options"
                    aria-label="Open message options menu"
                    aria-expanded={showMobileMenu === msg._id}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Mobile menu now handled by MobileBottomSheet */}
                </div>
              </div>
            )}

            {showReactionPicker === msg._id && (
              <>
                {isMobile && (
                  <div 
                    className="mobile-picker-backdrop"
                    onClick={() => setShowReactionPicker(null)}
                  />
                )}
                
                <div
                  ref={reactionPickerRef}
                  className={`
                    ${getReactionPickerPosition(isOwn).position}
                    ${getReactionPickerPosition(isOwn).className}
                    z-50 bg-white rounded-2xl shadow-2xl border border-gray-200
                    ${isMobile 
                      ? 'reaction-picker-mobile min-h-[280px] max-h-[60vh]' 
                      : 'reaction-picker-enter max-w-80'
                    }
                  `}
                >
                  <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-700">Choose a reaction</h3>
                    <button
                      onClick={() => setShowReactionPicker(null)}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-150"
                      title="Close"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-3 md:p-3">
                    <div className="flex items-center justify-center gap-3 md:gap-2 mb-4 md:mb-3 pb-3 border-b border-gray-100">
                      {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg._id, { native: emoji })}
                          className="quick-reaction-btn text-3xl md:text-2xl p-3 md:p-2 hover:bg-gray-100 rounded-2xl md:rounded-xl 
                                   transition-all duration-150 transform hover:scale-110 active:scale-95 
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                   min-w-[3rem] min-h-[3rem] md:min-w-0 md:min-h-0 flex items-center justify-center"
                          title={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    {/* Full emoji picker with mobile-optimized height */}
                    <div className="max-h-40 md:max-h-48 overflow-hidden">
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji) => handleReaction(msg._id, emoji)}
                        theme="light"
                        previewPosition="none"
                        skinTonePosition="none"
                        searchPosition="none"
                        maxFrequentRows={0}
                        perLine={isMobile ? 7 : 8}
                        set="native"
                        emojiSize={isMobile ? 22 : 18}
                        emojiButtonSize={isMobile ? 36 : 32}
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  
                  {/* Close button for desktop only (mobile has header close) */}
                  <button
                    onClick={() => setShowReactionPicker(null)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 
                             transition-colors duration-150 hidden md:block"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </>
            )}

            {msg.reactions && msg.reactions.length > 0 && (
              <div
                className={`
                  absolute ${isOwn ? "right-0" : "left-0"} -bottom-8 md:-bottom-7
                  flex items-center gap-1 bg-white rounded-full shadow-lg border border-gray-100 
                  py-1.5 px-2 md:py-1 md:px-2
                  z-10 transform translate-y-2 max-w-full reactions-container
                  text-sm md:text-xs
                `}
              >
                {/* Group reactions by emoji */}
                {Object.entries(
                  msg.reactions.reduce((acc, reaction) => {
                    const emoji = reaction.emoji;
                    if (!acc[emoji]) {
                      acc[emoji] = {
                        emoji,
                        count: 0,
                        userIds: [],
                        hasCurrentUser: false
                      };
                    }
                    acc[emoji].count++;
                    acc[emoji].userIds.push(reaction.userId);
                    if (reaction.userId?.toString() === currentUserId) {
                      acc[emoji].hasCurrentUser = true;
                    }
                    return acc;
                  }, {})
                ).map(([emoji, data]) => (
                  <button
                    key={emoji}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 md:px-2 md:py-1 rounded-full text-sm md:text-sm
                      reaction-btn min-h-[2rem] md:min-h-0
                      ${data.hasCurrentUser 
                        ? 'bg-blue-100 border border-blue-200 text-blue-700' 
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                      relative group/reaction cursor-pointer
                    `}
                    onClick={() => {
                      if (data.hasCurrentUser) {
                        handleRemoveReaction(msg._id);
                      } else {
                        handleReaction(msg._id, { native: emoji });
                      }
                    }}
                  >
                    <span className="text-lg md:text-base leading-none">{emoji}</span>
                    {data.count > 1 && (
                      <span className="text-xs md:text-xs font-medium min-w-[1rem] text-center leading-none">
                        {data.count}
                      </span>
                    )}
                    
                    {/* Tooltip - hidden on mobile for better UX */}
                    <div className="
                      absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                      opacity-0 group-hover/reaction:opacity-100 transition-opacity duration-200
                      bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-40
                      pointer-events-none hidden md:block
                    ">
                      {data.hasCurrentUser ? 'Click to remove' : 'Click to react'}
                      {data.count > 1 && (
                        <div className="text-gray-300">
                          {data.count} reaction{data.count > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onMobileBack}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center flex-1 space-x-3 sm:space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
              {partner?.avatar ? (
                <img
                  src={`${url}${partner.avatar}`}
                  alt={partner.fullName.charAt(0)}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-lg">
                    {partner?.fullName?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600">
                    {partner?.fullName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {typingUsers[activeChat._id]?.length > 0 && (
                    <p className="text-sm text-blue-500">typing...</p>
                  )}
                  {!isConnected && (
                    <p className="text-xs text-red-500 truncate">
                      Đang mất kết nối - Tin nhắn sẽ được đồng bộ khi kết nối
                      lại
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* {showVideoCall ? (
              <button
                onClick={() => {
                  socket.emit("video_call_ended", {
                    roomId: [user._id, partner._id].sort().join("-"),
                  });
                  setShowVideoCall(false);
                }}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  socket.emit("video_call_request", {
                    targetUserId: partner._id,
                  });
                }}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              >
                <Video className="w-5 h-5" />
              </button>
            )} */}
          </div>
        </div>
      </div>

      {showVideoCall && (
        <VideoCall
          targetUserId={partner._id}
          onEndCall={() => setShowVideoCall(false)}
        />
      )}

      {incomingCall && (
        <VideoCallDialog
          caller={{ name: incomingCall.callerName }}
          onAccept={() => {
            socket.emit("video_call_accepted", {
              callerId: incomingCall.callerId,
            });
            setShowVideoCall(true);
            setIncomingCall(null);
          }}
          onReject={() => {
            socket.emit("video_call_rejected", {
              callerId: incomingCall.callerId,
            });
            setIncomingCall(null);
          }}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        <div className="space-y-6">
          {activeChat.messages.map((msg, index) => {
            const senderId = getSenderId(msg);
            const isOwn = senderId === currentUserId;
            const messageKey = `${msg._id || "temp"}-${index}-${msg.timestamp}`;

            return (
              <div
                key={messageKey}
                id={`msg-${msg._id}`}
                data-message-id={msg._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} transition-colors duration-300`}
              >
                <MessageBubble msg={msg} isOwn={isOwn} />
              </div>
            );
          })}
          <div ref={messageEndRef} />
        </div>
      </div>

      {replyToMessage && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-gray-500 flex-shrink-0" />

            <span className="text-sm text-gray-600 whitespace-nowrap">
              Trả lời
            </span>
            <p className="text-sm text-gray-500 truncate">
              {replyToMessage.content}
            </p>
          </div>
          <button
            onClick={() => setReplyToMessage(null)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();

                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 150) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={
                replyToMessage ? "Nhập tin nhắn trả lời..." : "Nhập tin nhắn..."
              }
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 resize-none
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        min-h-[42px] max-h-[150px] overflow-y-auto"
              rows={1}
            />
{/* 
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                       text-gray-400 hover:text-gray-600"
            >
              <Smile className="w-5 h-5" />
            </button> */}
            
            {/* Show emoji picker - mobile uses bottom sheet, desktop uses popup */}
            {showEmojiPicker && !isMobile && (
              <div 
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 z-50 bg-white shadow-2xl border border-gray-200 rounded-xl max-w-sm"
              >
                <div className="p-3">
                  {/* Quick emoji row */}
                  <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    {['😀', '😍', '🤔', '👍', '👎', '❤️', '😂', '😮'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessage((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-2xl p-2 hover:bg-gray-100 rounded-xl 
                                 transition-all duration-150 transform hover:scale-110 active:scale-95 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                                 flex items-center justify-center"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  {/* Full emoji picker */}
                  <div className="max-h-64 overflow-hidden">
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                      searchPosition="none"
                      maxFrequentRows={0}
                      perLine={8}
                      set="native"
                      emojiSize={18}
                      emojiButtonSize={32}
                      autoFocus={false}
                    />
                  </div>
                </div>
                
                {/* Desktop close button */}
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 
                           transition-colors duration-150"
                  title="Close"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
          {/* <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-full ${isListening ? "bg-red-600 text-white" : "bg-blue-600 text-white"} hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
          >
            <Mic className="w-5 h-5" />
          </button> */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
      
      {/* Mobile Bottom Sheet for Message Actions */}
      <MobileBottomSheet
        isOpen={!!showMobileMenu && isMobile}
        onClose={() => setShowMobileMenu(null)}
        message={showMobileMenu ? activeChat?.messages?.find(msg => msg._id === showMobileMenu) : null}
        onReply={(message) => {
          handleReply(message);
          setShowMobileMenu(null);
        }}
        onReact={(messageId, emoji) => {
          handleReaction(messageId, emoji);
          setShowMobileMenu(null);
        }}
        onDelete={(messageId) => {
          deleteMessage(activeChat._id, messageId);
          setShowMobileMenu(null);
        }}
        canDelete={showMobileMenu ? (() => {
          const msg = activeChat?.messages?.find(m => m._id === showMobileMenu);
          return msg && msg.sender._id === user._id && 
                 Date.now() - new Date(msg.timestamp).getTime() <= 15 * 60 * 1000;
        })() : false}
      />

      {/* Mobile Bottom Sheet for Emoji Picker */}
      <EmojiBottomSheet
        isOpen={showEmojiPicker && isMobile}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={(emoji) => {
          setMessage(prev => prev + emoji.native);
          setShowEmojiPicker(false);
        }}
      />
    </div>
  );
};

export default ChatWindow;
