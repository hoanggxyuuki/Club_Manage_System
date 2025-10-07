import React, { useState, useEffect } from "react";
import {
  getMyNotifications,
  markAsRead,
} from "../../../../services/notification";
import moment from "moment";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={`p-4 rounded-lg border ${notification.read ? "bg-gray-50" : "bg-white"}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            {!notification.read && (
              <button
                onClick={() => handleMarkAsRead(notification._id)}
                className="text-sm text-primary-600"
              >
                Mark as read
              </button>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {moment(notification.createdAt).fromNow()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
