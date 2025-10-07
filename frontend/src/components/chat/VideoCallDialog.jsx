import React, { useState, useEffect, Fragment } from "react";
import { useChat } from "../../context/ChatContext";
import VideoCall from "./VideoCall";
import { Phone, PhoneOff, Video, Camera, AlertOctagon } from "lucide-react";

const VideoCallDialog = ({ caller, onAccept, onReject }) => {
  const [showCall, setShowCall] = useState(false);
  const [showDialog, setShowDialog] = useState(true); 
  const [roomId, setRoomId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket, acceptVideoCall } = useChat();
  const [ringCount, setRingCount] = useState(0);

  console.log("[CALL DEBUG] VideoCallDialog mounted with caller:", caller);

  
  useEffect(() => {
    console.log("[CALL DEBUG] VideoCallDialog animation effect initialized");
    
    const ringInterval = setInterval(() => {
      setRingCount((prev) => prev + 1);
    }, 1200);

    const timeoutId = setTimeout(() => {
      if (!showCall) {
        console.log("[CALL DEBUG] Call auto-rejected due to timeout");
        handleReject("Call timed out");
      }
    }, 30000); 

    return () => {
      clearTimeout(timeoutId);
      clearInterval(ringInterval);
      console.log("[CALL DEBUG] VideoCallDialog animation effect cleanup");
    };
  }, [showCall]);

  
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  useEffect(() => {
    if (socket) {
      console.log("[CALL DEBUG] Setting up call_connected listener");

      socket.on("call_connected", ({ roomId: newRoomId }) => {
        console.log(
          "[CALL DEBUG] Received call_connected event with roomId:",
          newRoomId,
        );
        setRoomId(newRoomId);
        setShowCall(true);
      });

      return () => {
        console.log("[CALL DEBUG] Removing call_connected listener");
        socket.off("call_connected");
      };
    }
  }, [socket]);

  const handleAccept = async () => {
    console.log("[CALL DEBUG] Call accept button clicked");
    try {
      setIsLoading(true);
      setError(null);

      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("[CALL DEBUG] Browser does not support getUserMedia");
        throw new Error("Your browser does not support video calls");
      }

      
      console.log("[CALL DEBUG] Requesting camera/mic permissions");
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log("[CALL DEBUG] Permissions granted");

      console.log("[CALL DEBUG] Accepting call from ID:", caller.id);
      await acceptVideoCall(caller.id);
      setShowDialog(false); 
      onAccept();
      console.log("[CALL DEBUG] Call accepted successfully");
    } catch (error) {
      console.error("[CALL DEBUG] Error accepting call:", error);
      setError(error.message || "Failed to start video call");

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        handleReject("Camera/microphone access denied");
      } else {
        handleReject("Technical error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = (reason = "Call declined") => {
    console.log("[CALL DEBUG] Call rejected. Reason:", reason);
    if (!isLoading) {
      setShowDialog(false); 
      onReject(reason);
    }
  };

  const handleEndCall = () => {
    console.log("[CALL DEBUG] Call ended by user");
    setShowCall(false);
    setRoomId(null);
    setError(null);
    setShowDialog(false); 
  };

  
  console.log(
    "[CALL DEBUG] Rendering state - showCall:",
    showCall,
    "roomId:",
    roomId,
    "showDialog:",
    showDialog,
  );

  if (showCall && roomId) {
    console.log(
      "[CALL DEBUG] Rendering VideoCall component with roomId:",
      roomId,
    );
    return <VideoCall roomId={roomId} onEndCall={handleEndCall} />;
  }

  
  if (!showDialog) {
    console.log("[CALL DEBUG] Dialog hidden, returning null");
    return null;
  }

  console.log(
    "[CALL DEBUG] Rendering incoming call dialog for caller:",
    caller?.name,
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-title"
    >
      <div
        className="max-w-md w-full bg-gradient-to-b from-white to-gray-50 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          transform: "translateY(0px)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Caller avatar and info section */}
        <div className="relative p-6 pb-8">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-blue-500 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 0 10 L 20 10 M 10 0 L 10 20"
                    stroke="#5B21B6"
                    strokeWidth="0.5"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative flex flex-col items-center">
            {/* Ring animation circles */}
            <div
              className={`absolute -z-10 rounded-full w-28 h-28 bg-blue-100 opacity-60 transform scale-${1 + (ringCount % 3)} transition-transform duration-700`}
            ></div>
            <div
              className={`absolute -z-10 rounded-full w-36 h-36 bg-blue-100 opacity-40 transform scale-${1 + ((ringCount + 1) % 3)} transition-transform duration-700`}
            ></div>
            <div
              className={`absolute -z-10 rounded-full w-44 h-44 bg-blue-100 opacity-20 transform scale-${1 + ((ringCount + 2) % 3)} transition-transform duration-700`}
            ></div>

            {/* Avatar */}
            <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg mb-6 border-4 border-white">
              {caller.avatar ? (
                <img
                  src={caller.avatar}
                  alt={caller.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-semibold">
                  {caller.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Caller info */}
            <h2
              id="call-title"
              className="text-2xl font-bold text-gray-900 animate-pulse mb-1"
            >
              Incoming Video Call
            </h2>
            <p className="text-lg text-gray-700 mb-6">{caller.name}</p>

            {error && (
              <div
                className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm flex items-center gap-2 justify-center max-w-sm"
                role="alert"
                aria-live="assertive"
              >
                <AlertOctagon className="w-4 h-4 flex-shrink-0" />

                {error}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 bg-gray-100 border-t border-gray-200">
          {isLoading ? (
            <div className="text-center" role="status" aria-label="Loading">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div
                    className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <p className="text-gray-600" aria-live="polite">
                  Preparing video call...
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Checking camera and microphone permissions
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-6">
              {/* Reject button */}
              <button
                onClick={() => handleReject()}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  bg-red-100 hover:bg-red-200 text-red-600
                  transform transition-all duration-200 hover:scale-105 
                  shadow-md hover:shadow-lg
                `}
                aria-label={`Decline video call from ${caller.name}`}
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Accept button */}
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  bg-green-600 hover:bg-green-700 text-white
                  transform transition-all duration-200 hover:scale-105
                  shadow-md hover:shadow-lg
                `}
                aria-busy={isLoading}
                aria-label={`Accept video call from ${caller.name}`}
              >
                <Video className="w-7 h-7" />
              </button>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isLoading ? "Please wait..." : "Tap to answer or decline"}
            </p>
          </div>
        </div>

        {/* Add some CSS animations */}
        <style jsx>{`
          @keyframes slideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default VideoCallDialog;
