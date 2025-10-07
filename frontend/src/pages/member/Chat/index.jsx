import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatProvider, useChat } from "../../../context/ChatContext";

import UsersList from "../../../components/chat/UsersList";
import ChatWindow from "../../../components/chat/ChatWindow";
import { Menu, X, MessageCircle, Loader } from "lucide-react";

const Chat = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchParams] = useSearchParams();
  const focusUserId = searchParams.get("userId");
  const { selectChat, loading, error } = useChat();
  const [initializing, setInitializing] = useState(!!focusUserId);
  const initialized = useRef(false);
  const { createOrGetChat, activeChat, socket, isConnected } = useChat();

  useEffect(() => {
    const initializeFromUrl = async () => {
      if (focusUserId && !initialized.current && isConnected) {
        try {
          setInitializing(true);
          console.log(`Initializing chat with user ID: ${focusUserId}`);

          const chat = await createOrGetChat(focusUserId);

          console.log("Chat initialized:", chat._id);

          initialized.current = true;
        } catch (err) {
          console.error("Error initializing chat from URL:", err);
        } finally {
          setInitializing(false);
        }
      }
    };

    if (focusUserId && isConnected) {
      initializeFromUrl();
    }
  }, [focusUserId, isConnected, createOrGetChat]);

  
  useEffect(() => {
    return () => {
      initialized.current = false;
    };
  }, [focusUserId]);
  return (
    <ChatProvider>
      <div className="h-[calc(100vh-4rem)] bg-gray-50">
        <div className="h-full max-w-7xl mx-auto px-4 py-6">
          <div className="relative grid grid-cols-12 gap-4 h-full">
            {/* Mobile menu button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              aria-label="Toggle user list"
            >
              {showSidebar ? (
                <X className="w-6 h-6" />
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
            </button>

            {/* Sidebar for desktop */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3 bg-white rounded-lg shadow-lg overflow-hidden">
              <UsersList focusUserId={focusUserId} />
            </div>

            {/* Sidebar for mobile */}
            <div
              className={`
                fixed inset-y-0 left-0 z-40 w-3/4 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden
                ${showSidebar ? "translate-x-0" : "-translate-x-full"}
              `}
            >
              <div className="h-full overflow-hidden">
                <UsersList focusUserId={focusUserId} />
              </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {showSidebar && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* Chat window */}
            <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-white rounded-lg shadow-lg overflow-hidden">
              <ChatWindow onMobileBack={() => setShowSidebar(true)} />
            </div>
          </div>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Chat;
