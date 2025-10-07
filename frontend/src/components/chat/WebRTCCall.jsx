import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import { useVideoCall } from "../../context/VideoCallContext";
import MediaControls from "./components/MediaControls";
import LocalVideo from "./components/LocalVideo";
import RemoteVideo from "./components/RemoteVideo";
import StreamQuality from "./components/StreamQuality";

/**
 * WebRTCCall - Component cuộc gọi video sử dụng WebRTC thuần
 * Phiên bản đã được tối ưu để sử dụng VideoCallContext
 */
const WebRTCCall = ({ roomId, caller, onEndCall }) => {
  const { socket } = useChat();
  const {
    localStream,
    peerConnection,
    endCall: contextEndCall,
  } = useVideoCall();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [streamQuality, setStreamQuality] = useState("good");
  const [callDuration, setCallDuration] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [networkStats, setNetworkStats] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const isCallerRef = useRef(false);

  
  useEffect(() => {
    console.log("[WebRTC] Initializing call for room:", roomId);
    console.log("[WebRTC] Caller info:", caller);

    if (caller && caller.id) {
      
      isCallerRef.current = caller.id === localStorage.getItem("userId");
      console.log("[WebRTC] User is caller:", isCallerRef.current);
    }

    
    setupConnectionListeners();

    
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    
    setIsLoading(false);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [roomId, localStream]);

  
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  
  const setupConnectionListeners = () => {
    if (!peerConnection) return;

    
    const connectionStateHandler = () => {
      console.log("[WebRTC] Connection state:", peerConnection.connectionState);

      if (peerConnection.connectionState === "connected") {
        console.log("[WebRTC] Peers connected!");
        setIsConnected(true);
        setIsLoading(false);
      } else if (
        ["disconnected", "failed", "closed"].includes(
          peerConnection.connectionState,
        )
      ) {
        console.log(
          "[WebRTC] Connection state changed to:",
          peerConnection.connectionState,
        );
        setIsConnected(false);
        if (peerConnection.connectionState === "failed") {
          setError("Kết nối thất bại. Vui lòng thử lại.");
        }
      }
    };

    peerConnection.addEventListener(
      "connectionstatechange",
      connectionStateHandler,
    );

    
    peerConnection.ontrack = (event) => {
      console.log("[WebRTC] Remote track received");
      if (remoteVideoRef.current && event.streams && event.streams[0]) {
        console.log("[WebRTC] Setting remote stream");
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    
    connectionStateHandler();

    
    return () => {
      peerConnection.removeEventListener(
        "connectionstatechange",
        connectionStateHandler,
      );
    };
  };

  
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        track.enabled = !track.enabled;
        setIsAudioEnabled(track.enabled);
      }
    }
  };

  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      }
    }
  };

  
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  
  const handleEndCall = () => {
    contextEndCall(roomId);
    if (onEndCall) onEndCall();
  };

  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center text-white">
          <div className="w-20 h-20 mb-4 mx-auto">
            <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-xl font-medium">Đang kết nối...</p>
          <p className="text-gray-400 mt-2">Thiết lập kết nối an toàn</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 ${fullscreen ? "p-0" : "p-4"}`}
    >
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      <div
        className={`
        relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col
        ${fullscreen ? "max-w-none max-h-none" : ""}
      `}
      >
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-50 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-3">
          <div
            className={`
            w-2 h-2 rounded-full
            ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}
          `}
          ></div>
          <span className="text-white font-medium">
            {isConnected ? "Đã kết nối" : "Đang kết nối..."}
          </span>
          {isConnected && (
            <span className="text-gray-300 ml-2">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>

        <div className="relative flex-grow aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-xl">
          {/* Remote video fills the container */}
          <div
            className={`absolute inset-0 ${fullscreen ? "rounded-none" : "rounded-lg"} overflow-hidden bg-black`}
          >
            <RemoteVideo
              remoteVideoRef={remoteVideoRef}
              connectionStatus={isConnected ? "connected" : "connecting"}
              isLoading={isLoading}
              error={error}
              networkStats={showStats ? networkStats : null}
            />
          </div>

          {/* Local video in a draggable picture-in-picture */}
          <div
            className="absolute bottom-4 right-4 z-10 w-1/4 aspect-video shadow-xl rounded-lg overflow-hidden 
                      border-2 border-white border-opacity-30 transform transition-transform
                      hover:scale-105"
          >
            <LocalVideo
              localVideoRef={localVideoRef}
              isVideoOff={!isVideoEnabled}
            />
          </div>
        </div>

        <MediaControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          endCall={handleEndCall}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={fullscreen}
        />
      </div>
    </div>
  );
};

export default WebRTCCall;
