import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotification } from "../../../context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import CryptoJS from "crypto-js";
import { markAllAsRead } from "../../../services/noti";

const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "default32byteslongkeythisisexample";

/**
 * Decrypt data received from the server
 * @param {string} encryptedData - Data in format "iv:encryptedContent"
 * @returns {Object|string} Decrypted data
 */
const decrypt = (encryptedData) => {
  try {
    const textParts = encryptedData.split(":");
    const iv = CryptoJS.enc.Hex.parse(textParts[0]);
    const encryptedContent = CryptoJS.enc.Hex.parse(textParts[1]);

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedContent },
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );

    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};

const NotificationList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications: encryptedNotifications,
    unreadCount: encryptedUnreadCount,
    markAsRead,
  } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const handleMarkAllAsRead = async () => {
    try {
      
      await markAllAsRead();

      
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      );
      setUnreadCount(0);

      
      if (fetchNotifications) {
        fetchNotifications();
      }

      if (fetchUnreadCount) {
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };
  
  useEffect(() => {
    if (encryptedNotifications) {
      if (
        encryptedNotifications.encrypted === true &&
        encryptedNotifications.data
      ) {
        const decryptedData = decrypt(encryptedNotifications.data);
        setNotifications(decryptedData || []);
      } else {
        setNotifications(encryptedNotifications);
      }
    }
  }, [encryptedNotifications]);

  
  useEffect(() => {
    
    if (typeof encryptedUnreadCount === "number") {
      setUnreadCount(encryptedUnreadCount);
      return;
    }

    
    if (
      encryptedUnreadCount &&
      typeof encryptedUnreadCount === "object" &&
      encryptedUnreadCount.encrypted === true &&
      encryptedUnreadCount.data
    ) {
      const decryptedCount = decrypt(encryptedUnreadCount.data);

      
      if (typeof decryptedCount === "number") {
        setUnreadCount(decryptedCount);
      } else if (typeof decryptedCount === "string") {
        
        const parsedCount = parseInt(decryptedCount, 10);
        setUnreadCount(isNaN(parsedCount) ? 0 : parsedCount);
      } else {
        setUnreadCount(0);
      }
    }
    
    else if (
      encryptedUnreadCount &&
      typeof encryptedUnreadCount === "object" &&
      "count" in encryptedUnreadCount
    ) {
      setUnreadCount(encryptedUnreadCount.count);
    }
    
    else {
      const count = encryptedUnreadCount || 0;
      setUnreadCount(count);
    }
  }, [encryptedUnreadCount]);

  useEffect(() => {
    const handleOutsideInteraction = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    
    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction, {
      passive: true,
    });

    
    const handleScroll = () => {
      if (window.innerWidth < 768 && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  
  useEffect(() => {}, [unreadCount]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    switch (notification.type) {
      case "task":
        break;
      case "announcement":
        break;
      case "reminder":
        break;
      case "chat":
        
        if (notification.url) {
          window.location.href = notification.url;
        }
        break;
      default:
        
        if (notification.url) {
          window.location.href = notification.url;
        }
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "task":
        return "📋";
      case "announcement":
        return "📢";
      case "reminder":
        return "⏰";
      case "chat":
        return "💬";
      default:
        return "📬";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onTouchEnd={(e) => {
          e.preventDefault(); 
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-600 hover:text-blue-600 active:text-blue-700 focus:outline-none touch-manipulation"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 md:h-6 md:w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[1.25rem] md:min-w-[1.5rem]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-[4rem] mx-2 md:absolute md:inset-auto md:right-0 md:mx-0 md:w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              Thông báo
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-[calc(100vh-12rem)] md:max-h-96 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-2 md:p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <span className="text-xl md:text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
