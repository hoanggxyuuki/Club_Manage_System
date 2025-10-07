import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";
import * as chatService from "../services/chat";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, _setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);

  const setActiveChat = (chatOrUpdater) => {
    _setActiveChat((prev) => {
      if (prev?._id && socket?.connected) {
        const prevRoom = `chat_${prev._id}`;
        socket.emit("leave_chat", prev._id);
      }

      const nextChat =
        typeof chatOrUpdater === "function"
          ? chatOrUpdater(prev)
          : chatOrUpdater;

      if (nextChat?._id && socket?.connected) {
        const nextRoom = `chat_${nextChat._id}`;
        socket.emit("join_chat", nextChat._id);
      }

      return nextChat;
    });
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const url = import.meta.env.VITE_API_URL;
      const isHttp = url.startsWith("http://");
      const socketUrl = url
        .replace(isHttp ? "http://" : "https://", "")
        .replace("/api", "");

      const socketConfig = {
        auth: { token: localStorage.getItem("token") },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      };

      const newSocket = io(
        `${isHttp ? "ws" : "wss"}://${socketUrl}`,
        socketConfig,
      );

      newSocket.on("connect", () => {
        setIsConnected(true);
        if (activeChat?._id) {
          newSocket.emit("join_chat", activeChat._id);
        }
      });

      newSocket.on("reconnect_attempt", (attempt) => {});

      newSocket.on("reconnect", (attempt) => {
        if (activeChat?._id) {
          newSocket.emit("join_chat", activeChat._id);
        }
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });

      newSocket.on("user_online", (userId) => {
        setOnlineUsers((prev) => ({ ...prev, [userId.toString()]: true }));
      });

      newSocket.on("user_offline", (userId) => {
        setOnlineUsers((prev) => ({ ...prev, [userId.toString()]: false }));
      });

      newSocket.on("typing_started", ({ chatId, userId }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), userId],
        }));
      });

      newSocket.on("typing_stopped", ({ chatId, userId }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter((id) => id !== userId),
        }));
      });

      newSocket.on(
        "message_reaction_update",
        ({ messageId, reactions, chatId }) => {
          setActiveChat((prev) => {
            if (!prev || prev._id !== chatId) return prev;
            return {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg._id === messageId ? { ...msg, reactions } : msg,
              ),
            };
          });
        },
      );

      newSocket.on("new_reply", (newMessage) => {
        setActiveChat((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
          };
        });
      });
      newSocket.on(
        "message_reaction_update",
        ({ chatId, messageId, reactions }) => {
          setActiveChat((prev) => {
            if (!prev || prev._id !== chatId) return prev;

            return {
              ...prev,
              messages: prev.messages.map((msg) =>
                msg._id === messageId ? { ...msg, reactions } : msg,
              ),
            };
          });

          setChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat._id !== chatId) return chat;

              return {
                ...chat,
                messages: chat.messages.map((msg) =>
                  msg._id === messageId ? { ...msg, reactions } : msg,
                ),
              };
            }),
          );
        },
      );

      newSocket.on("reaction_removed", (data) => {
        const { chatId, messageId, userId } = data;

        const updateMessages = (messages) =>
          messages.map((msg) => {
            if (msg._id === messageId) {
              return {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  (r) => r.user._id !== userId,
                ),
              };
            }
            return msg;
          });
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id !== chatId) return chat;
            return {
              ...chat,
              messages: updateMessages(chat.messages),
            };
          }),
        );

        if (activeChat?._id === chatId) {
          setActiveChat((prev) => ({
            ...prev,
            messages: updateMessages(prev.messages),
          }));
        }
      });
      newSocket.on("message_reply", async ({ chatId, replyToId, content }) => {
        try {
          const newMessage = await Message.create({
            content,
            sender: socket.user._id,
            chatId,
            replyTo: replyToId,
            reactions: [],
          });

          await newMessage.populate("sender");

          io.to(`chat_${chatId}`).emit("new_reply", newMessage);
        } catch (error) {
          console.error("Error handling reply:", error);
        }
      });
      newSocket.on("message_deleted", ({ chatId, messageId, content }) => {
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id !== chatId) return chat;
            return {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg._id === messageId
                  ? { ...msg, isDeleted: true, content }
                  : msg,
              ),
            };
          }),
        );

        setActiveChat((prev) => {
          if (!prev || prev._id !== chatId) return prev;
          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg._id === messageId
                ? { ...msg, isDeleted: true, content }
                : msg,
            ),
          };
        });
      });

      newSocket.on("new_message", (data) => {
        if (!data.message || !data.chatId) {
          return;
        }
        const newMessage = {
          _id: data.message._id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          sender: {
            _id: data.message.sender._id,
            email: data.message.sender.email,
            fullName: data.message.sender.fullName,
          },
          replyTo: data.message.replyTo,
          reactions: [],
        };

        if (activeChat?._id === data.chatId && socket?.connected) {
          socket.emit("join_chat", data.chatId);
        }

        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id !== data.chatId) return chat;
            if (chat.messages.some((msg) => msg._id === newMessage._id))
              return chat;

            return {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: newMessage.timestamp,
            };
          }),
        );

        setActiveChat((prev) => {
          if (!prev || prev._id !== data.chatId) return prev;
          if (prev.messages.some((msg) => msg._id === newMessage._id))
            return prev;

          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: newMessage.timestamp,
          };
        });
      });

      
      newSocket.on("incoming_call", ({ callerId, callerName }) => {
        console.log(
          "[CALL DEBUG] Received incoming call from:",
          callerId,
          callerName,
        );
        setIncomingCall({ id: callerId, name: callerName });
      });

      newSocket.on("call_connected", (callInfo) => {
        console.log("[CALL DEBUG] Call connected:", callInfo);
        setCurrentCall(callInfo);
        setIncomingCall(null);
      });

      newSocket.on("call_rejected", ({ userId, username, reason }) => {
        console.log(
          "[CALL DEBUG] Call rejected by:",
          username,
          "Reason:",
          reason,
        );
        setCurrentCall(null);
        
      });

      newSocket.on("call_ended", ({ reason }) => {
        console.log("[CALL DEBUG] Call ended. Reason:", reason);
        setCurrentCall(null);
        
      });

      newSocket.on("peer_network_quality", ({ userId, stats }) => {
        console.log("[CALL DEBUG] Network quality update:", userId, stats);
        
        if (
          currentCall &&
          currentCall.participants.find((p) => p.id === userId)
        ) {
          
        }
      });

      setSocket(newSocket);
      return () => {
        if (currentCall) {
          newSocket.emit("video_call_ended", { roomId: currentCall.roomId });
        }
        newSocket.close();
      };
    }
  }, [user]);

  const addReaction = async (chatId, messageId, emoji) => {
    if (!socket?.connected) return;

    socket.emit("message_reaction", {
      chatId,
      messageId,
      emoji,
    });
  };
  const handleReply = async (chatId, messageId, content) => {
    if (!socket?.connected) return;

    socket.emit("message_reply", {
      chatId,
      replyToId: messageId,
      content,
    });
  };
  const removeReaction = (chatId, messageId) => {
    if (!socket?.connected) return;
    socket.emit("remove_reaction", {
      chatId,
      messageId,
    });
  };

  const sendMessage = async (chatId, content) => {
    try {
      if (socket?.connected) {
        const messageData = {
          chatId,
          message: {
            content,
            timestamp: new Date().toISOString(),
            replyTo: replyToMessage?._id,
            sender: {
              _id: user.userId,
              fullName: user.name,
              email: user.email,
            },
          },
        };

        socket.emit("send_message", messageData);

        setReplyToMessage(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const createOrGetChat = async (participantId) => {
    try {
      const newChat = await chatService.createOrGetChat(participantId);
      setChats((prevChats) => {
        const existingChat = prevChats.find((chat) => chat._id === newChat._id);
        if (!existingChat) {
          return [...prevChats, newChat];
        }
        return prevChats;
      });
      setActiveChat(newChat);
      return newChat;
    } catch (error) {
      console.error("Error creating/getting chat:", error);
      throw error;
    }
  };

  const deleteMessage = async (chatId, messageId) => {
    try {
      if (!socket?.connected) return;

      socket.emit("delete_message", {
        chatId,
        messageId,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const startVideoCall = (targetUserId) => {
    console.log("[CALL DEBUG] Starting video call to:", targetUserId);
    if (!socket?.connected) {
      console.error("[CALL DEBUG] Socket not connected, cannot start call");
      return;
    }
    socket.emit("video_call_request", { targetUserId });
  };

  const acceptVideoCall = (callerId) => {
    console.log("[CALL DEBUG] Accepting call from:", callerId);
    if (!socket?.connected) {
      console.error("[CALL DEBUG] Socket not connected, cannot accept call");
      return;
    }
    socket.emit("video_call_accepted", { callerId });
  };

  const rejectVideoCall = (callerId, reason = "Call declined") => {
    console.log(
      "[CALL DEBUG] Rejecting call from:",
      callerId,
      "Reason:",
      reason,
    );
    if (!socket?.connected) {
      console.error("[CALL DEBUG] Socket not connected, cannot reject call");
      return;
    }
    socket.emit("video_call_rejected", { callerId, reason });
    setIncomingCall(null);
  };

  const endVideoCall = (roomId) => {
    console.log("[CALL DEBUG] Ending call in room:", roomId);
    if (!socket?.connected) {
      console.error("[CALL DEBUG] Socket not connected, cannot end call");
      return;
    }
    socket.emit("video_call_ended", { roomId });
    setCurrentCall(null);
  };

  const sendWebRTCSignal = (targetUserId, signal) => {
    console.log(
      "[CALL DEBUG] Sending WebRTC signal to:",
      targetUserId,
      "Signal type:",
      signal.type,
    );
    if (!socket?.connected) {
      console.error("[CALL DEBUG] Socket not connected, cannot send signal");
      return;
    }
    socket.emit("webrtc_signal", { targetUserId, signal });
  };

  const value = {
    socket,
    chats,
    setChats,
    activeChat,
    setActiveChat,
    onlineUsers,
    typingUsers,
    sendMessage,
    startTyping: (chatId) =>
      socket?.connected && socket.emit("typing_start", chatId),
    stopTyping: (chatId) =>
      socket?.connected && socket.emit("typing_stop", chatId),
    createOrGetChat,
    isConnected,
    addReaction,
    removeReaction,
    replyToMessage,
    setReplyToMessage,
    messages,
    setMessages,
    deleteMessage,
    handleReply,
    
    incomingCall,
    currentCall,
    startVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    endVideoCall,
    sendWebRTCSignal,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
