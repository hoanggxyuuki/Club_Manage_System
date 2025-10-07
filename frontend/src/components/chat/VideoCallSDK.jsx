import React, { useState, useEffect, useRef } from "react";
import { useChat } from "../../context/ChatContext";
import {
  Phone,
  PhoneOff,
  Video,
  Camera,
  Mic,
  MicOff,
  VideoOff,
} from "lucide-react";

/**
 * VideoCallSDK component - Implements video calling using a simplified SDK approach
 * This component serves as an abstraction over the chosen SDK (e.g., Twilio, Agora, Daily.co)
 */
const VideoCallSDK = ({ roomId, caller, onEndCall }) => {
  const { socket } = useChat();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: "prompt",
    microphone: "prompt",
  });
  const [permissionReady, setPermissionReady] = useState(false);

  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);

  
  const timerRef = useRef(null);

  
  useEffect(() => {
    checkMediaPermissions();
  }, []);

  
  const checkMediaPermissions = async () => {
    console.log("Checking media permissions...");
    try {
      
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraStatus = await navigator.permissions.query({
            name: "camera",
          });
          const microphoneStatus = await navigator.permissions.query({
            name: "microphone",
          });

          const newPermissionStatus = {
            camera: cameraStatus.state,
            microphone: microphoneStatus.state,
          };

          setPermissionStatus(newPermissionStatus);
          console.log("Permission status:", newPermissionStatus);

          
          cameraStatus.addEventListener("change", () => {
            setPermissionStatus((prev) => ({
              ...prev,
              camera: cameraStatus.state,
            }));
            console.log("Camera permission changed to:", cameraStatus.state);

            
            if (
              cameraStatus.state === "granted" &&
              microphoneStatus.state === "granted"
            ) {
              console.log(
                "Permissions granted after change, initializing call",
              );
              initializeCall();
            }
          });

          microphoneStatus.addEventListener("change", () => {
            setPermissionStatus((prev) => ({
              ...prev,
              microphone: microphoneStatus.state,
            }));
            console.log(
              "Microphone permission changed to:",
              microphoneStatus.state,
            );

            
            if (
              cameraStatus.state === "granted" &&
              microphoneStatus.state === "granted"
            ) {
              console.log(
                "Permissions granted after change, initializing call",
              );
              initializeCall();
            }
          });

          
          if (
            cameraStatus.state === "granted" &&
            microphoneStatus.state === "granted"
          ) {
            console.log("Permissions already granted, initializing call");
            setPermissionReady(true);
            initializeCall();
            return;
          }

          
          if (
            cameraStatus.state === "denied" ||
            microphoneStatus.state === "denied"
          ) {
            console.log("Permissions denied, showing error");
            let deniedString = "";
            if (
              cameraStatus.state === "denied" &&
              microphoneStatus.state === "denied"
            ) {
              deniedString = "camera and microphone";
            } else if (cameraStatus.state === "denied") {
              deniedString = "camera";
            } else {
              deniedString = "microphone";
            }

            setError(
              `Access to your ${deniedString} has been denied. Please allow access in your browser settings and try again.`,
            );
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn(
            "Error checking permission status with Permissions API:",
            err,
          );
          
        }
      }

      
      console.log("Explicitly requesting media permissions...");
      await requestMediaPermissions();
    } catch (err) {
      console.error("Permission check failed:", err);
      setError(
        "Failed to check media permissions. Please ensure your browser supports camera and microphone access.",
      );
      setIsLoading(false);
    }
  };

  
  const requestMediaPermissions = async () => {
    try {
      console.log("Requesting media permissions explicitly...");

      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      
      console.log("Permissions granted via getUserMedia");

      
      stream.getTracks().forEach((track) => track.stop());

      setPermissionStatus({
        camera: "granted",
        microphone: "granted",
      });

      setPermissionReady(true);
      console.log("Permissions ready, initializing call");
      initializeCall();
    } catch (err) {
      console.error("Permission request failed:", err);

      let errorMessage = "Failed to access camera and microphone. ";

      
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage +=
          "You denied permission to use your camera and/or microphone. " +
          "Please allow access in your browser settings and try again.";

        setPermissionStatus({
          camera: "denied",
          microphone: "denied",
        });
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage +=
          "No camera or microphone found. Please connect a camera and microphone to your device and try again.";

        
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          audioStream.getTracks().forEach((track) => track.stop());

          setPermissionStatus({
            camera: "denied",
            microphone: "granted",
          });

          setPermissionReady(true);
          console.log("Audio-only permissions granted, initializing call");
          initializeCall();
          return;
        } catch (audioErr) {
          console.error("Audio-only fallback failed:", audioErr);
        }
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage +=
          "Your camera or microphone is already in use by another application. " +
          "Please close any other applications that might be using your camera or microphone.";
      } else if (
        err.name === "OverconstrainedError" ||
        err.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage +=
          "Your camera does not meet the required specifications. " +
          "Please try with a different camera.";
      } else {
        errorMessage +=
          "Please ensure your camera and microphone are working properly and you have granted permission to use them.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    console.log("Video call component mounted with room ID:", roomId);

    return () => {
      
      endCall();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  
  const initializeCall = async () => {
    try {
      setIsLoading(true);
      setError(null);

      
      console.log("Requesting user media for call...");
      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .catch((err) => {
          console.error(
            "[CALL DEBUG] Error getting media:",
            err.name,
            err.message,
          );

          
          if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError" ||
            (err.name === "NotAllowedError" && err.message.includes("video"))
          ) {
            console.log("Trying audio-only fallback...");
            return navigator.mediaDevices.getUserMedia({ audio: true });
          }

          throw err; 
        });

      
      localStreamRef.current = stream;

      
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setIsVideoEnabled(hasVideo);
      setIsAudioEnabled(hasAudio);

      console.log("Got media stream with video:", hasVideo, "audio:", hasAudio);

      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      
      

      
      console.log("Connecting to SDK service for room:", roomId);

      
      setTimeout(() => {
        console.log("SDK connected successfully");
        setIsConnected(true);
        setIsLoading(false);

        
        if (socket) {
          socket.emit("sdk_call_connected", { roomId });
        }

        
        if (caller) {
          setParticipants([
            {
              id: caller.id,
              name: caller.name,
              isVideoEnabled: true,
              isAudioEnabled: true,
            },
          ]);
        }
      }, 1500);

      
      if (socket) {
        socket.on("call_ended", handleRemoteEndCall);
        socket.on("sdk_participant_update", handleParticipantUpdate);
      }
    } catch (err) {
      console.error("Failed to initialize call:", err);

      let errorMessage = "Failed to access camera and microphone. ";

      
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        errorMessage +=
          "You denied permission to use your camera and/or microphone. " +
          "Please allow access in your browser settings and try again.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        errorMessage +=
          "No camera or microphone found. Please connect a camera and microphone to your device and try again.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        errorMessage +=
          "Your camera or microphone is already in use by another application. " +
          "Please close any other applications that might be using your camera or microphone.";
      } else if (
        err.name === "OverconstrainedError" ||
        err.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage +=
          "Your camera does not meet the required specifications. " +
          "Please try with a different camera.";
      } else {
        errorMessage +=
          "Please ensure your camera and microphone are working properly and you have granted permission to use them.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  
  const handleParticipantUpdate = (data) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === data.participantId) {
          return {
            ...p,
            isVideoEnabled: data.hasOwnProperty("videoEnabled")
              ? data.videoEnabled
              : p.isVideoEnabled,
            isAudioEnabled: data.hasOwnProperty("audioEnabled")
              ? data.audioEnabled
              : p.isAudioEnabled,
          };
        }
        return p;
      }),
    );
  };

  
  const endCall = () => {
    console.log("Ending call");

    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    
    if (socket) {
      socket.emit("end_call", { roomId });
      socket.off("call_ended", handleRemoteEndCall);
      socket.off("sdk_participant_update", handleParticipantUpdate);
    }

    
    setIsConnected(false);
    setParticipants([]);

    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    
    if (onEndCall) onEndCall();
  };

  
  const handleRemoteEndCall = () => {
    console.log("Remote party ended the call");
    endCall();
  };

  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newVideoState = !isVideoEnabled;

        videoTracks.forEach((track) => {
          track.enabled = newVideoState;
        });

        setIsVideoEnabled(newVideoState);

        
        if (socket) {
          socket.emit("sdk_participant_update", {
            roomId,
            videoEnabled: newVideoState,
          });
        }
      }
    }
  };

  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newAudioState = !isAudioEnabled;

        audioTracks.forEach((track) => {
          track.enabled = newAudioState;
        });

        setIsAudioEnabled(newAudioState);

        
        if (socket) {
          socket.emit("sdk_participant_update", {
            roomId,
            audioEnabled: newAudioState,
          });
        }
      }
    }
  };

  
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  
  const renderPermissionError = () => {
    return (
      <div className="call-permission-error flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-red-600 mb-3">
          Camera/Microphone Access Required
        </h3>
        <p className="text-gray-700 mb-6 text-center">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
            onClick={requestMediaPermissions}
          >
            Allow Camera & Microphone
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={endCall}
          >
            Cancel
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          If you've denied permission, you'll need to reset it in your browser
          settings. Look for the camera icon in your address bar.
        </p>
      </div>
    );
  };

  
  if (isLoading) {
    return (
      <div className="call-loading flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Connecting to call...</p>
        <p className="text-sm text-gray-500 mt-2">
          {permissionReady
            ? "Establishing connection..."
            : "Checking camera and microphone access..."}
        </p>
      </div>
    );
  }

  
  if (error) {
    return renderPermissionError();
  }

  return (
    <div className="video-call-container h-full flex flex-col">
      <div className="call-duration p-2 bg-black bg-opacity-50 text-white rounded-md absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        {formatDuration(callDuration)}
      </div>

      <div className="video-grid flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local video */}
        <div
          className={`video-container local relative bg-gray-900 rounded-lg overflow-hidden ${!isVideoEnabled ? "video-off" : ""}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {!isVideoEnabled && (
            <div className="video-placeholder absolute inset-0 flex items-center justify-center bg-gray-800">
              <Camera size={48} className="text-gray-400" />
            </div>
          )}
          <div className="participant-info absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
            <span>You</span>
            <div className="flex items-center space-x-2">
              {!isAudioEnabled && <MicOff size={16} className="text-red-400" />}
              {!isVideoEnabled && (
                <VideoOff size={16} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Remote videos */}
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`video-container remote relative bg-gray-900 rounded-lg overflow-hidden ${!participant.isVideoEnabled ? "video-off" : ""}`}
          >
            <video
              ref={participants.length === 1 ? remoteVideoRef : null}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {!participant.isVideoEnabled && (
              <div className="video-placeholder absolute inset-0 flex items-center justify-center bg-gray-800">
                <Camera size={48} className="text-gray-400" />
              </div>
            )}
            <div className="participant-info absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
              <span>{participant.name || "Participant"}</span>
              <div className="flex items-center space-x-2">
                {!participant.isAudioEnabled && (
                  <MicOff size={16} className="text-red-400" />
                )}
                {!participant.isVideoEnabled && (
                  <VideoOff size={16} className="text-red-400" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="call-controls p-4 flex justify-center gap-4">
        <button
          className={`control-button w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isAudioEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          className="control-button end-call w-14 h-14 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all"
          onClick={endCall}
        >
          <PhoneOff size={28} />
        </button>

        <button
          className={`control-button w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-600 hover:bg-red-700"
          } text-white`}
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
      </div>
    </div>
  );
};

export default VideoCallSDK;
