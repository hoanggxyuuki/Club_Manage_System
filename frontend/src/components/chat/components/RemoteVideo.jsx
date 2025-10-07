import React, { useEffect, useState } from "react";
import { Video, User, WifiOff, Loader2 } from "lucide-react";

const RemoteVideo = ({
  remoteStream,
  remoteVideoRef,
  connectionStatus,
  isLoading,
  error,
  networkStats,
}) => {
  const [videoReady, setVideoReady] = useState(false);
  const [bufferingState, setBufferingState] = useState(false);

  
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      try {
        remoteVideoRef.current.srcObject = remoteStream;
      } catch (err) {
        console.error("Error attaching remote stream:", err);
      }
    }
  }, [remoteStream, remoteVideoRef]);

  
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;

    const videoElement = remoteVideoRef.current;

    const handleWaiting = () => setBufferingState(true);
    const handlePlaying = () => {
      setBufferingState(false);
      setVideoReady(true);
    };
    const handleCanPlay = () => setVideoReady(true);

    videoElement.addEventListener("waiting", handleWaiting);
    videoElement.addEventListener("playing", handlePlaying);
    videoElement.addEventListener("canplay", handleCanPlay);

    return () => {
      videoElement.removeEventListener("waiting", handleWaiting);
      videoElement.removeEventListener("playing", handlePlaying);
      videoElement.removeEventListener("canplay", handleCanPlay);
    };
  }, [remoteStream]);

  const noVideo =
    !remoteStream || connectionStatus !== "connected" || isLoading;

  
  if (noVideo) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900">
        {error ? (
          <div className="flex flex-col items-center">
            <WifiOff className="h-16 w-16 text-red-400 mb-4" />

            <p className="text-white text-xl font-medium">Connection Failed</p>
            <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">
              {error}
            </p>
          </div>
        ) : connectionStatus === "connecting" ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-t-blue-500 border-blue-200 animate-spin"></div>
              <Video
                className="h-10 w-10 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-gray-300 text-xl font-medium mt-4">
              Connecting...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-pulse">
            <User className="h-20 w-20 text-gray-600 mb-4" strokeWidth={1.5} />

            <p className="text-gray-300 text-xl font-medium">
              Waiting for video...
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={remoteVideoRef}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
      />

      {/* Video buffering/loading overlay */}
      {bufferingState && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-white animate-spin mb-2" />

            <p className="text-white text-sm font-medium">Buffering...</p>
          </div>
        </div>
      )}

      {/* Quality stats badge (only shown when specified) */}
      {networkStats && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-xs text-white rounded px-2 py-1 z-20">
          {networkStats.resolution && (
            <div>Resolution: {networkStats.resolution}</div>
          )}
          {networkStats.frameRate && (
            <div>FPS: {Math.round(networkStats.frameRate)}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;
