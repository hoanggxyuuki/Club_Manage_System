import React from "react";
import {
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  BarChart2,
} from "lucide-react";

/**
 * StreamQuality - Indicator for WebRTC connection quality
 */
const StreamQuality = ({ quality = "good", onClick }) => {
  const getQualityIcon = () => {
    switch (quality) {
      case "excellent":
        return <Signal className="text-green-500" size={18} />;

      case "good":
        return <SignalHigh className="text-green-400" size={18} />;

      case "fair":
        return <SignalMedium className="text-yellow-400" size={18} />;

      case "poor":
        return <SignalLow className="text-red-500" size={18} />;

      default:
        return <SignalMedium className="text-gray-400" size={18} />;
    }
  };

  const getQualityText = () => {
    switch (quality) {
      case "excellent":
        return "Tuyệt vời";
      case "good":
        return "Tốt";
      case "fair":
        return "Trung bình";
      case "poor":
        return "Kém";
      default:
        return "Không xác định";
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-green-50 text-green-700 border-green-200";
      case "fair":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "poor":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${getQualityColor()} text-xs font-medium`}
      title="Click để xem chi tiết kết nối"
    >
      {getQualityIcon()}
      <span>{getQualityText()}</span>
      <BarChart2 size={14} className="ml-1 opacity-70" />
    </button>
  );
};

export default StreamQuality;
