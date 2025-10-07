import React, { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getToken } from "../utils/auth";
import { getNavigate } from "../services/navigation";
import CryptoJS from "crypto-js";
import {
  registerServiceWorker,
  subscribeToPushNotifications as subscribeToNotifications,
} from "../utils/notificationUtils";

const NotificationContext = createContext();
const ENCRYPTION_KEY =
  import.meta.env.VITE_ENCRYPTION_KEY || "default32byteslongkeythisisexample";

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

const processApiResponse = (data) => {
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  return data;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
    useState(false);
  const { user } = useAuth();

  const showBrowserNotification = (title, options = {}) => {
    if (
      browserNotificationsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const notification = new Notification(title, {
        ...options,
        icon: "/iuptit_banner.svg",
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        if (options.url) {
          const navigate = getNavigate();
          navigate(options.url);
        }
        notification.close();
      };
    }
  };

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const requestNotificationPermission = async () => {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setBrowserNotificationsEnabled(permission === "granted");

        if (permission === "granted") {
          
          await registerServiceWorker();
          const subscribed = await subscribeToNotifications();
          return subscribed;
        }
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      const baseUrl = import.meta.env.VITE_PROXY_API_URL;
      const newSocket = io(baseUrl, {
        auth: {
          token: getToken(),
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected successfully");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      setSocket(newSocket);

      newSocket.on("notification", (data) => {
        if (data.type === "NEW_NOTIFICATION") {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          showToast(data.notification.title || "New notification", "info");

          showBrowserNotification(
            data.notification.title || "New notification",
            {
              body: data.notification.content || "",
              url: data.notification.url || null,
              tag: data.notification._id,
            },
          );
        }
      });

      requestNotificationPermission();

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const markAsRead = async (notificationId) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      const notification = notifications.find((n) => n._id === notificationId);

      const response = await fetch(
        `${baseUrl}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const responseData = await response.json();
        const processedData = processApiResponse(responseData);

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        if (notification?.url) {
          const navigate = getNavigate();
          navigate(notification.url);
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${baseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const responseData = await response.json();
      const processedData = processApiResponse(responseData);
      setNotifications(processedData);

      const unreadResponse = await fetch(
        `${baseUrl}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      const unreadData = await unreadResponse.json();
      const processedUnreadData = processApiResponse(unreadData);

      if (typeof processedUnreadData === "number") {
        setUnreadCount(processedUnreadData);
      } else if (
        processedUnreadData &&
        typeof processedUnreadData === "object"
      ) {
        setUnreadCount(processedUnreadData.count || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    fetchNotifications,
    toasts,
    showToast,
    browserNotificationsEnabled,
    requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
