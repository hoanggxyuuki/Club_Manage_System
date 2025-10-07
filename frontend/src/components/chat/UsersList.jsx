import React, { useEffect, useState } from "react";
import { useChat } from "../../context/ChatContext";
import {
  Search,
  MessageSquare,
  UserCheck,
  Users,
  ChevronDown,
  Bell,
  Settings,
  Star,
} from "lucide-react";
import { toast } from "react-hot-toast";
import * as chatService from "../../services/chat";

const UsersList = ({ focusUserId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { createOrGetChat, onlineUsers, activeChat } = useChat();
  const url = import.meta.env.VITE_PROXY_API_URL;

  
  useEffect(() => {
    if (focusUserId) {
      createOrGetChat(focusUserId).catch((error) => {
        console.error("Error auto-starting chat:", error);
        toast.error("Failed to start chat");
      });
    }
  }, [focusUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const users = await chatService.getUsersList();
        const sortedUsers = [...users].sort((a, b) => {
          
          if (onlineUsers[a._id] && !onlineUsers[b._id]) return -1;
          if (!onlineUsers[a._id] && onlineUsers[b._id]) return 1;

          
          if (a.messageCount && b.messageCount) {
            return b.messageCount - a.messageCount;
          }

          
          return a.fullName.localeCompare(b.fullName);
        });

        setUsers(Array.isArray(sortedUsers) ? sortedUsers : []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [onlineUsers]);

  const getFilteredUsers = () => {
    if (!users) return [];

    
    let filtered = users.filter((user) =>
      user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    
    switch (activeTab) {
      case "online":
        filtered = filtered.filter((user) => onlineUsers[user._id]);
        break;
      case "recent":
        filtered = filtered.filter((user) => user.messageCount > 0);
        break;
      case "favorites":
        
        filtered = filtered.filter((user) => user.isFavorite);
        break;
      default: 
        break;
    }

    return filtered;
  };

  const startChat = async (userId, e) => {
    
    if (e && (e.target.tagName === "BUTTON" || e.target.closest("button"))) {
      return;
    }
    try {
      await createOrGetChat(userId);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to start chat");
    }
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="flex items-center text-xl font-bold text-gray-800">
          <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
          Trò chuyện
        </h2>

        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 transition-all duration-200"
          />

          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        {/* Tabs for filtering */}
        <div className="flex mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 px-3 text-sm font-medium transition-colors relative
                      ${
                        activeTab === "all"
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
          >
            Tất cả
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`pb-2 px-3 text-sm font-medium transition-colors relative
                      ${
                        activeTab === "online"
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
          >
            Hoat động
            {activeTab === "online" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`pb-2 px-3 text-sm font-medium transition-colors relative
                      ${
                        activeTab === "recent"
                          ? "text-blue-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
          >
            Đã nhắn
            {activeTab === "recent" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Đang lấy danh sách...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-2">
          {filteredUsers.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />

              <h3 className="text-gray-500 font-medium mb-1">
                Không tìm thấy user
              </h3>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? `Không có kết quả cho "${searchQuery}"`
                  : activeTab === "online"
                    ? "Không có bạn bè nào đang hoạt động"
                    : activeTab === "recent"
                      ? "Không có tin nhắn nào"
                      : "Không có bạn bè nào"}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isActive = activeChat?.participants?.some(
                (p) => p._id === user._id,
              );

              return (
                <div
                  key={user._id}
                  onClick={(e) => startChat(user._id, e)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer group transition-colors duration-200 ${
                    isActive ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={`${url}${user.avatar}`}
                            alt={user.fullName.charAt(0)}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white font-medium text-lg">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white
                          ${
                            onlineUsers[user?._id]
                              ? "bg-green-400"
                              : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {user.fullName}
                          </p>
                          {user.lastMessageTime && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {new Date(
                                user.lastMessageTime,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {user.lastMessage ? (
                            <p className="text-sm text-gray-500 truncate max-w-[180px]">
                              {user.lastMessage}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              Bắt đầu 1 cuộc trò chuyện
                            </p>
                          )}

                          {user.unreadCount > 0 && (
                            <span className="ml-auto bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                              {user.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startChat(user._id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full 
                               opacity-0 group-hover:opacity-100 
                               transition-opacity duration-200"
                      aria-label={`Chat with ${user.fullName}`}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab bar for mobile */}
      {/* <div className="md:hidden py-3 px-2 bg-white border-t border-gray-200 flex justify-around">
                 <button className="flex flex-col items-center p-1 text-blue-600">
                   <MessageSquare className="w-5 h-5" />
                   <span className="text-xs mt-1">Chats</span>
                 </button>
                 <button className="flex flex-col items-center p-1 text-gray-500">
                   <Users className="w-5 h-5" />
                   <span className="text-xs mt-1">Friends</span>
                 </button>
                 <button className="flex flex-col items-center p-1 text-gray-500">
                   <Bell className="w-5 h-5" />
                   <span className="text-xs mt-1">Alerts</span>
                 </button>
                 <button className="flex flex-col items-center p-1 text-gray-500">
                   <Settings className="w-5 h-5" />
                   <span className="text-xs mt-1">Settings</span>
                 </button>
                </div> */}
    </div>
  );
};

export default UsersList;
