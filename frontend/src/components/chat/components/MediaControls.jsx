import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize,
  Minimize,
  ScreenShare,
} from "lucide-react";

/**
 * MediaControls - Control panel for WebRTC call with audio, video, and call controls
 */
const MediaControls = ({
  isAudioEnabled,
  isVideoEnabled,
  toggleAudio,
  toggleVideo,
  endCall,
  toggleFullscreen,
  isFullscreen,
  onScreenShare,
}) => {
  return (
    <div className="flex justify-center items-center gap-3 md:gap-6 p-4 mt-4">
      <button
        onClick={toggleAudio}
        className={`
          w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
          transition-all duration-200
          ${
            isAudioEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          } 
          text-white shadow-md
        `}
        title={isAudioEnabled ? "Tắt mic" : "Bật mic"}
      >
        {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      <button
        onClick={endCall}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200"
        title="Kết thúc cuộc gọi"
      >
        <PhoneOff size={24} />
      </button>

      <button
        onClick={toggleVideo}
        className={`
          w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
          transition-all duration-200
          ${
            isVideoEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          } 
          text-white shadow-md
        `}
        title={isVideoEnabled ? "Tắt camera" : "Bật camera"}
      >
        {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </button>

      <button
        onClick={toggleFullscreen}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white shadow-md transition-all duration-200"
        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {onScreenShare && (
        <button
          onClick={onScreenShare}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white shadow-md transition-all duration-200"
          title="Chia sẻ màn hình"
        >
          <ScreenShare size={20} />
        </button>
      )}
    </div>
  );
};

export default MediaControls;
