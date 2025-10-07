import React, { useEffect } from "react";
import { Camera } from "lucide-react";

/**
 * LocalVideo - Component to display the local video feed
 * Accepts both stream prop or videoRef for flexibility
 */
const LocalVideo = ({
  localStream,
  localVideoRef,
  isMuted = true,
  isVideoOff = false,
}) => {
  
  useEffect(() => {
    if (localStream && localVideoRef?.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  return (
    <div className="relative w-full h-full bg-gray-800">
      {isVideoOff ? (
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="text-gray-400" size={32} />
          <span className="text-gray-400 text-sm ml-2">Camera off</span>
        </div>
      ) : (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute bottom-2 left-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        Bạn
      </div>
    </div>
  );
};

export default LocalVideo;
