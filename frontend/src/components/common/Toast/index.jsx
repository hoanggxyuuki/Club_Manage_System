import React from "react";
import { useNotification } from "../../../context/NotificationContext";

const Toast = () => {
  const { toasts } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`mb-2 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
          }`}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Toast;
