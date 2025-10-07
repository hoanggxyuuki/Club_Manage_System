import React from "react";
import { WifiOff, Wifi } from "lucide-react";

const ConnectionStatus = ({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case "connected":
        return {
          icon: <Wifi className="w-4 h-4 text-green-500" />,
          label: "Connected",
          className: "bg-green-100 text-green-800 border-green-300",
        };
      case "connecting":
        return {
          icon: <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />,

          label: "Connecting...",
          className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        };
      case "disconnected":
        return {
          icon: <WifiOff className="w-4 h-4 text-red-500" />,
          label: "Disconnected",
          className: "bg-red-100 text-red-800 border-red-300",
        };
      default:
        return {
          icon: <Wifi className="w-4 h-4 text-gray-500" />,
          label: "Checking...",
          className: "bg-gray-100 text-gray-800 border-gray-300",
        };
    }
  };

  const { icon, label, className } = getStatusInfo();

  return (
    <div
      className={`flex items-center px-2 py-1 rounded-full text-xs border ${className}`}
    >
      {icon}
      <span className="ml-1">{label}</span>
    </div>
  );
};

export default ConnectionStatus;
