import React, { useState, useEffect, useRef } from "react";
import { useWebRTC } from "./components/hooks/useWebRTC";
import { useMediaStream } from "./components/hooks/useMediaStream";
import { useSocketHandlers } from "./components/hooks/useSocketHandlers";
import { useConnectionHandlers } from "./components/hooks/useConnectionHandlers";
import { useChat } from "../../context/ChatContext";

import RemoteVideo from "./components/RemoteVideo";
import LocalVideo from "./components/LocalVideo";
import MediaControls from "./components/MediaControls";
import ConnectionStatus from "./components/ConnectionStatus";
import StreamQuality from "./components/StreamQuality";
import ErrorDisplay from "./components/ErrorDisplay";
import { DetectBrowser } from "./components/utils/DetectBrowser";

const VideoCall = ({ roomId, targetUserId, onEndCall }) => {
  const { socket, currentCall } = useChat();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [userOnline, setUserOnline] = useState(false);
  const [callReadyState, setCallReadyState] = useState("checking"); 
  const [callDuration, setCallDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [browserInfo] = useState(DetectBrowser());
  const [showStats, setShowStats] = useState(false);
  const errorTimeoutRef = useRef(null);

  
  const actualTargetUserId = useRef(null);

  useEffect(() => {
    
    if (targetUserId) {
      actualTargetUserId.current = targetUserId;
    } else if (
      currentCall &&
      currentCall.participants &&
      currentCall.participants.length > 0
    ) {
      
      const otherParticipant = currentCall.participants.find(
        (p) => p.id !== socket?.id,
      );
      if (otherParticipant) {
        actualTargetUserId.current = otherParticipant.id;
      }
    } else if (roomId && socket) {
      
      
      const parts = roomId.split("-");
      if (parts.length === 2) {
        const otherId = parts[0] === socket.id ? parts[1] : parts[0];
        actualTargetUserId.current = otherId;
      }
    }

    
    if (!actualTargetUserId.current) {
      console.error("Could not determine target user ID for call");
      setError("Connection error: Missing participant information");
      setCallReadyState("failed");
    }
  }, [targetUserId, roomId, currentCall, socket]);

  
  useEffect(() => {
    let interval;
    if (callReadyState === "ready" && !isLoading) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callReadyState, isLoading]);

  
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      
      if (!error.includes("failed") && !error.includes("Could not reconnect")) {
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 5000);
      }
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    availableDevices,
    switchCamera,
    switchMicrophone,
  } = useMediaStream({
    setError,
    initialQuality: browserInfo.isMobile ? "medium" : "high", 
  });

  
  useEffect(() => {
    if (!socket) {
      setError("Cannot connect: Socket not initialized");
      setCallReadyState("failed");
      return;
    }

    if (!actualTargetUserId.current) {
      return; 
    }

    const checkUserOnlineAndInitiate = async () => {
      try {
        if (!socket.connected) {
          console.log("Socket not connected, waiting for connection...");
          return;
        }

        setCallReadyState("checking");

        
        socket.emit(
          "check_user_online",
          { targetUserId: actualTargetUserId.current },
          (response) => {
            if (response && response.online) {
              console.log("User is online, can start call");
              setUserOnline(true);
              setCallReadyState("ready");
            } else {
              console.error("User not online");
              setError("User is not online. Cannot start call.");
              setCallReadyState("failed");
              setTimeout(() => {
                if (onEndCall) onEndCall("User offline");
              }, 3000);
            }
          },
        );
      } catch (err) {
        console.error("Error checking user status:", err);
        setError(`Error checking user status: ${err.message}`);
        setCallReadyState("failed");
      }
    };

    checkUserOnlineAndInitiate();

    
    const intervalId = setInterval(() => {
      if (callReadyState !== "ready") {
        checkUserOnlineAndInitiate();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [socket, actualTargetUserId.current]);

  
  const {
    connectionStatus,
    streamQuality,
    networkStats,
    localVideoRef,
    remoteVideoRef,
    handleEndCall,
  } = useWebRTC({
    targetUserId: actualTargetUserId.current,
    localStream,
    onEndCall,
    setError,
    setIsLoading,
    enabled:
      userOnline && callReadyState === "ready" && !!actualTargetUserId.current,
  });

  
  useEffect(() => {
    if (connectionStatus === "connected" && error) {
      if (error.includes("failed") || error.includes("Could not reconnect")) {
        
      } else {
        const timer = setTimeout(() => {
          setError(null);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [connectionStatus, error]);

  
  useSocketHandlers({
    socket,
    targetUserId: actualTargetUserId.current,
    localStream,
    connectionStatus,
    setError,
  });

  
  useConnectionHandlers({
    targetUserId: actualTargetUserId.current,
    connectionStatus,
    webRTCService: null, 
    socket,
    setError,
  });

  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const toggleNetworkStats = () => {
    setShowStats(!showStats);
  };

  
  const safeEndCall = () => {
    if (onEndCall) {
      try {
        onEndCall();
      } catch (err) {
        console.error("Error ending call:", err);
      }
    }
  };

  return (
    <div
      className={`
      fixed inset-0 z-50 bg-gradient-to-b from-black to-gray-900 
      flex items-center justify-center p-2 sm:p-4 transition-all duration-300
      ${fullscreen ? "p-0" : ""}
    `}
    >
      <ErrorDisplay error={error} />

      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-30">
          <div className="w-20 h-20 mb-4">
            <svg className="animate-spin w-full h-full" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-white text-xl font-medium">Connecting...</p>
          <p className="text-gray-400 mt-2">Setting up your video call</p>
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
            ${connectionStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}
          `}
          ></div>
          <span className="text-white font-medium">
            {connectionStatus === "connected" ? "Connected" : "Connecting..."}
          </span>
          {connectionStatus === "connected" && (
            <span className="text-gray-300 ml-2">
              {formatDuration(callDuration)}
            </span>
          )}
        </div>

        {streamQuality !== "excellent" &&
          connectionStatus === "connected" &&
          !error && (
            <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-800 bg-opacity-90 text-yellow-200 text-sm px-3 py-1.5 rounded-lg">
              {streamQuality === "poor"
                ? "Poor connection"
                : "Connection unstable"}
            </div>
          )}

        <div className="relative flex-grow aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-xl">
          {/* Remote video fills the container */}
          <div
            className={`absolute inset-0 ${fullscreen ? "rounded-none" : "rounded-lg"} overflow-hidden bg-black`}
          >
            <RemoteVideo
              remoteStream={remoteStream}
              remoteVideoRef={remoteVideoRef}
              connectionStatus={connectionStatus}
              isLoading={isLoading}
              error={error}
              networkStats={showStats ? networkStats : null}
            />
          </div>

          {/* Local video in a draggable picture-in-picture */}
          <div
            className="absolute bottom-4 right-4 z-10 w-1/4 aspect-video shadow-xl rounded-lg overflow-hidden 
                      border-2 border-white border-opacity-30 transform transition-transform
                      hover:scale-105 cursor-move"
          >
            <LocalVideo
              localStream={localStream}
              localVideoRef={localVideoRef}
            />
          </div>

          {/* Stream quality indicator */}
          {connectionStatus === "connected" && !isLoading && (
            <div className="absolute top-2 right-2 z-10">
              <StreamQuality
                quality={streamQuality}
                onClick={toggleNetworkStats}
              />
            </div>
          )}
        </div>

        <MediaControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          endCall={safeEndCall}
          toggleFullscreen={toggleFullscreen}
          isFullscreen={fullscreen}
        />
      </div>
    </div>
  );
};

export default VideoCall;
