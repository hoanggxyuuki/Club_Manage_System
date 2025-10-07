import React, { useState, useEffect } from "react";
import { useFriend } from "../../../context/FriendContext";
import { useChat } from "../../../context/ChatContext";
import {
  Search,
  UserPlus,
  Check,
  X,
  Users,
  UserCheck,
  UserSearch,
  UserX,
  MessageCircle,
  UserCog,
  Clock,
} from "lucide-react";
import MiniChatWindow from "../../../components/chat/MiniChatWindow";
import MemberList from "../../../components/members/MemberList";

const Friends = () => {
  const {
    friends,
    pendingRequests,
    searchResults,
    loading,
    sendFriendRequest,
    respondToRequest,
    searchUsers,
    loadFriends,
    loadPendingRequests,
    deleteFriend,
  } = useFriend();
  const { createOrGetChat, setActiveChat } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = React.useRef(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("friends");
  const [showMiniChat, setShowMiniChat] = useState(false);
  const [minimizedChat, setMinimizedChat] = useState(false);
  const [pendingSentRequests, setPendingSentRequests] = useState(new Set());
  const url = import.meta.env.VITE_PROXY_API_URL;

  const handleStartChat = async (friend) => {
    try {
      const chat = await createOrGetChat(friend._id);
      setActiveChat(chat);
      setShowMiniChat(true);
      setMinimizedChat(false);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleCloseMiniChat = () => {
    setShowMiniChat(false);
    setMinimizedChat(false);
    setActiveChat(null);
  };

  const handleMinimizeMiniChat = () => {
    setMinimizedChat(!minimizedChat);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      setPendingSentRequests((prev) => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers(searchQuery.trim(), 1);
      setPage(1);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchResults]);

  const loadMore = async () => {
    if (
      loading ||
      !searchResults.pagination ||
      page >= searchResults.pagination.total
    )
      return;

    try {
      const nextPage = page + 1;
      await searchUsers(searchQuery, nextPage);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more users:", error);
    }
  };

  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    if (bottom && !loading) {
      loadMore();
    }
  };

  const Avatar = ({ user, size = "md" }) => {
    const sizeClasses = size === "md" ? "w-10 h-10" : "w-8 h-8";

    return user.avatar ? (
      <img
        src={`${url}${user.avatar}`}
        alt={user.fullName.charAt(0)}
        className={`${sizeClasses} rounded-full object-cover`}
      />
    ) : (
      <div
        className={`${sizeClasses} bg-blue-100 rounded-full flex items-center justify-center`}
      >
        <span className="text-blue-600 font-medium">
          {user.fullName.charAt(0)}
        </span>
      </div>
    );
  };

  const FriendsTab = () => (
    <div className="space-y-3">
      {friends.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          You don't have any friends yet
        </p>
      ) : (
        friends.map((friend) => (
          <div
            key={friend._id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Avatar user={friend} />
              <div>
                <p className="font-medium">{friend.fullName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStartChat(friend)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                aria-label="Start chat"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => deleteFriend(friend._id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Remove friend"
              >
                <UserX className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const RequestsTab = () => (
    <div className="space-y-3">
      {pendingRequests.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          No pending friend requests
        </p>
      ) : (
        pendingRequests.map((request) => (
          <div
            key={request._id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Avatar user={request.user} />
              <div>
                <p className="font-medium">{request.user.fullName}</p>
                {request.status === "accepted" && (
                  <p className="text-sm text-green-600">
                    Friend request accepted
                  </p>
                )}
              </div>
            </div>
            {request.status === "pending" && (
              <div className="flex space-x-1">
                <button
                  onClick={() => respondToRequest(request._id, "accepted")}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  aria-label="Accept"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => respondToRequest(request._id, "rejected")}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  aria-label="Reject"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const SearchTab = () => (
    <>
      <div className="relative mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchInputRef.current?.focus();
          }}
          autoFocus
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <Search
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${loading ? "text-blue-500" : "text-gray-400"}`}
        />
      </div>
      <div
        className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        onScroll={handleScroll}
      >
        {searchQuery && searchResults.users?.length === 0 && !loading ? (
          <p className="text-gray-500 text-center py-6">No users found</p>
        ) : (
          searchResults.users?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Avatar user={user} />
                <div>
                  <p className="font-medium">{user.fullName}</p>
                </div>
              </div>
              {user.friendStatus === "none" && (
                <button
                  onClick={() => handleSendFriendRequest(user._id)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  aria-label="Send friend request"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              )}
              {user.friendStatus === "pending" && (
                <div
                  className="p-1.5 text-yellow-600"
                  title="Friend request pending"
                >
                  <Clock className="w-5 h-5" />
                </div>
              )}
              {user.friendStatus === "rejected" && (
                <div
                  className="p-1.5 text-gray-400"
                  title="Cannot send friend request"
                >
                  <UserX className="w-5 h-5" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}
      </div>
    </>
  );

  const MembersTab = () => (
    <div className="space-y-4">
      <MemberList />
    </div>
  );

  const tabs = [
    { id: "friends", label: "Friends", icon: Users, count: friends.length },
    {
      id: "requests",
      label: "Requests",
      icon: UserCheck,
      count: pendingRequests.length,
    },
    { id: "members", label: "Members", icon: UserCog },
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="sm:hidden">
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-center text-sm font-medium transition-colors
                    ${activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <div className="flex flex-col items-center">
                    <tab.icon className="w-5 h-5 mb-1" />
                    {tab.label}
                    {tab.count > 0 && tab.id === "requests" && (
                      <span className="ml-1 bg-red-100 text-red-600 text-xs rounded-full px-2 py-0.5">
                        {tab.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === "friends" && <FriendsTab />}
              {activeTab === "requests" && <RequestsTab />}
              {activeTab === "search" && <SearchTab />}
              {activeTab === "members" && <MembersTab />}
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  My Friends
                </h2>
                <FriendsTab />
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                  Friend Requests
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-sm rounded-full px-2 py-0.5">
                      {pendingRequests.length}
                    </span>
                  )}
                </h2>
                <RequestsTab />
              </div>
            </div>

            <div className="border-t mt-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold flex items-center mb-4">
                  <UserCog className="w-5 h-5 mr-2 text-blue-600" />
                  Members List
                </h2>
                <MembersTab />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showMiniChat && !minimizedChat && (
        <MiniChatWindow
          onClose={handleCloseMiniChat}
          onMinimize={handleMinimizeMiniChat}
        />
      )}
      {minimizedChat && (
        <button
          onClick={() => setMinimizedChat(false)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default Friends;
