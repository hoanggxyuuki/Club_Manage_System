import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  Camera,
  AlertOctagon,
  RefreshCw,
  Settings,
} from "lucide-react";

/**
 * VideoCallDialogSDK - Component that displays incoming call notification
 * with options to accept or reject the call
 */
const VideoCallDialogSDK = ({ caller, onAccept, onReject }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ringCount, setRingCount] = useState(0);
  const [showDialog, setShowDialog] = useState(true);
  const [permissionState, setPermissionState] = useState({
    checked: false,
    camera: "prompt",
    microphone: "prompt",
    permissionError: false,
  });

  
  const ringtoneRef = useRef(null);

  
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/ringtone.mp3");
      audio.loop = true;
      audio.volume = 0.7;
      audio
        .play()
        .catch((err) => console.warn("Could not play ringtone:", err));
      ringtoneRef.current = audio;

      return () => {
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current = null;
        }
      };
    } catch (err) {
      console.warn("Error setting up ringtone:", err);
    }
  }, []);

  
  useEffect(() => {
    checkPermissions();
  }, []);

  
  useEffect(() => {
    console.log("[SDK-CALL] Dialog mounted for caller:", caller?.name);

    
    const ringInterval = setInterval(() => {
      setRingCount((prev) => prev + 1);
    }, 1200);

    
    const timeoutId = setTimeout(() => {
      console.log("[SDK-CALL] Auto-rejecting call after timeout");
      handleReject("Call timed out");
    }, 30000);

    return () => {
      clearInterval(ringInterval);
      clearTimeout(timeoutId);
      console.log("[SDK-CALL] Dialog cleanup");
    };
  }, []);

  
  useEffect(() => {
    if (error) {
      const timeoutId = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [error]);

  
  const checkPermissions = async () => {
    try {
      
      if (navigator.permissions && navigator.permissions.query) {
        const cameraPermission = await navigator.permissions.query({
          name: "camera",
        });
        const microphonePermission = await navigator.permissions.query({
          name: "microphone",
        });

        console.log("[SDK-CALL] Permission status:", {
          camera: cameraPermission.state,
          microphone: microphonePermission.state,
        });

        setPermissionState({
          checked: true,
          camera: cameraPermission.state,
          microphone: microphonePermission.state,
          permissionError:
            cameraPermission.state === "denied" ||
            microphonePermission.state === "denied",
        });

        
        cameraPermission.addEventListener("change", () => {
          console.log(
            "[SDK-CALL] Camera permission changed to:",
            cameraPermission.state,
          );
          setPermissionState((prev) => ({
            ...prev,
            camera: cameraPermission.state,
            permissionError:
              cameraPermission.state === "denied" ||
              prev.microphone === "denied",
          }));
        });

        microphonePermission.addEventListener("change", () => {
          console.log(
            "[SDK-CALL] Microphone permission changed to:",
            microphonePermission.state,
          );
          setPermissionState((prev) => ({
            ...prev,
            microphone: microphonePermission.state,
            permissionError:
              prev.camera === "denied" ||
              microphonePermission.state === "denied",
          }));
        });
      } else {
        console.log(
          "[SDK-CALL] Permissions API not supported, will check on accept",
        );
      }
    } catch (err) {
      console.warn("[SDK-CALL] Error checking permissions:", err);
    }
  };

  
  const handleAccept = async () => {
    console.log("[SDK-CALL] Accepting call from:", caller?.name);
    try {
      setIsLoading(true);
      setError(null);

      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support video calls");
      }

      
      console.log("[SDK-CALL] Requesting camera and mic permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      
      stream.getTracks().forEach((track) => track.stop());

      
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }

      
      console.log("[SDK-CALL] Permissions granted, accepting call");
      setShowDialog(false);
      onAccept();
    } catch (error) {
      console.error("[SDK-CALL] Error accepting call:", error);

      
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setPermissionState((prev) => ({
          ...prev,
          camera: "denied",
          microphone: "denied",
          permissionError: true,
        }));

        setError(
          "Camera and microphone access is required for video calls. Please allow access in your browser settings.",
        );
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        setError(
          "No camera or microphone found. Please check that your devices are connected properly.",
        );

        
        try {
          console.log("[SDK-CALL] Trying audio-only fallback");
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          audioStream.getTracks().forEach((track) => track.stop());

          
          if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current = null;
          }

          setShowDialog(false);
          onAccept("audio-only");
          return;
        } catch (audioError) {
          console.error("[SDK-CALL] Audio-only fallback failed:", audioError);
          setError(
            "Could not access your microphone. Please check your device settings.",
          );
        }
      } else {
        setError(
          "Technical error: " + (error.message || "Failed to start video call"),
        );
      }

      setIsLoading(false);
    }
  };

  
  const handleReject = (reason = "Call declined") => {
    console.log("[SDK-CALL] Rejecting call. Reason:", reason);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }
    if (!isLoading) {
      setShowDialog(false);
      onReject(reason);
    }
  };

  
  const openBrowserSettings = () => {
    
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        
        stream.getTracks().forEach((track) => track.stop());
        handleAccept();
      })
      .catch((err) => {
        console.error("[SDK-CALL] Failed to get permissions:", err);
        setError(
          "Please open your browser settings and allow camera and microphone access manually.",
        );
      });
  };

  
  const retryPermissions = () => {
    setError(null);
    setPermissionState((prev) => ({ ...prev, checked: false }));
    checkPermissions();
    handleAccept();
  };

  
  if (!showDialog) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-title"
    >
      <div
        className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
        style={{
          transform: "translateY(0px)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Caller info section */}
        <div className="relative p-6 pb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
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
              {caller?.avatar ? (
                <img
                  src={caller?.avatar}
                  alt={caller?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-semibold">
                  {typeof caller?.name === "string" && caller?.name?.length > 0
                    ? caller?.name?.charAt(0)?.toUpperCase()
                    : "?"}
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
            <p className="text-lg text-gray-700 mb-6">
              {caller?.name || "Unknown Caller"}
            </p>

            {/* Permission warnings */}
            {permissionState.permissionError && (
              <div
                className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center text-sm flex flex-col items-center gap-2 justify-center max-w-sm"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 flex-shrink-0 text-yellow-600" />

                  <span className="font-semibold">
                    Camera/mic access required
                  </span>
                </div>
                <p>
                  Please allow access to your camera and microphone to join this
                  call.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={openBrowserSettings}
                    className="px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded flex items-center gap-1.5 transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={retryPermissions}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded flex items-center gap-1.5 transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && !permissionState.permissionError && (
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
        <div className="p-6 bg-white border-t border-gray-100">
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
            <div className="flex justify-center items-center gap-8">
              {/* Reject button */}
              <button
                onClick={() => handleReject()}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  bg-red-100 hover:bg-red-200 text-red-600
                  transform transition-all duration-200 hover:scale-110 
                  shadow-md hover:shadow-lg
                `}
                aria-label={`Decline video call from ${caller?.name || "Unknown"}`}
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Accept button */}
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  bg-green-600 hover:bg-green-700 text-white
                  transform transition-all duration-200 hover:scale-110
                  shadow-md hover:shadow-lg
                `}
                aria-busy={isLoading}
                aria-label={`Accept video call from ${caller?.name || "Unknown"}`}
              >
                <Video className="w-6 h-6" />
              </button>
            </div>
          )}
          <div className="mt-5 text-center">
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

export default VideoCallDialogSDK;
