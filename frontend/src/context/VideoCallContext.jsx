import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useChat } from "./ChatContext";
import { useAuth } from "./AuthContext";


const VideoCallContext = createContext();


export const VideoCallProvider = ({ children }) => {
  const { socket } = useChat();
  const { user } = useAuth();

  
  const [activeSDK, setActiveSDK] = useState("webrtc");

  const [callState, setCallState] = useState({
    isInCall: false,
    callRoomId: null,
    callerId: null,
    callerName: null,
    remoteParticipants: [],
  });

  const [incomingCall, setIncomingCall] = useState(null);

  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const signallingReadyRef = useRef(false);

  
  useEffect(() => {
    if (!socket || !user) return;

    
    socket.on("incoming_call", ({ callerId, callerName }) => {
      console.log("[VIDEO] Cuộc gọi đến từ:", callerId, callerName);
      setIncomingCall({ id: callerId, name: callerName });
    });

    
    socket.on("call_connected", (callInfo) => {
      console.log("[VIDEO] Cuộc gọi đã kết nối:", callInfo);

      
      const participants = Array.isArray(callInfo.participants)
        ? callInfo.participants
        : [];
      const firstParticipant = participants.length > 0 ? participants[0] : null;

      setCallState({
        isInCall: true,
        callRoomId: callInfo.roomId || null,
        callerId: firstParticipant?.id || null,
        callerName: firstParticipant?.name || "Người dùng không xác định",
        remoteParticipants: participants,
      });

      setIncomingCall(null);

      
      signallingReadyRef.current = true;
    });

    
    socket.on("call_rejected", ({ userId, username, reason }) => {
      console.log(
        "[VIDEO] Cuộc gọi bị từ chối bởi:",
        username,
        "Lý do:",
        reason,
      );
      setCallState((prev) => ({ ...prev, isInCall: false, callRoomId: null }));
      cleanupWebRTC();
    });

    
    socket.on("call_ended", ({ reason }) => {
      console.log("[VIDEO] Cuộc gọi kết thúc. Lý do:", reason);
      setCallState((prev) => ({ ...prev, isInCall: false, callRoomId: null }));
      cleanupWebRTC();
    });

    
    socket.on("webrtc_offer", async (data) => {
      console.log("[WebRTC] Received offer from:", data.callerId);
      if (activeSDK === "webrtc") {
        try {
          await handleWebRTCOffer(data);
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
        }
      }
    });

    socket.on("webrtc_answer", async (data) => {
      console.log("[WebRTC] Received answer from:", data.callerId);
      if (activeSDK === "webrtc") {
        try {
          await handleWebRTCAnswer(data);
        } catch (err) {
          console.error("[WebRTC] Error handling answer:", err);
        }
      }
    });

    socket.on("webrtc_ice_candidate", async (data) => {
      console.log("[WebRTC] Received ICE candidate from:", data.callerId);
      if (activeSDK === "webrtc") {
        try {
          await handleWebRTCIceCandidate(data);
        } catch (err) {
          console.error("[WebRTC] Error handling ICE candidate:", err);
        }
      }
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_connected");
      socket.off("call_rejected");
      socket.off("call_ended");
      socket.off("webrtc_offer");
      socket.off("webrtc_answer");
      socket.off("webrtc_ice_candidate");
    };
  }, [socket, user, activeSDK]);

  
  const initializeWebRTC = async () => {
    try {
      
      cleanupWebRTC();

      console.log("[WebRTC] Initializing WebRTC...");

      
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          {
            urls: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
          },
        ],

        iceCandidatePoolSize: 10,
      };

      
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      localStreamRef.current = stream;

      
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      
      pc.onicecandidate = handleIceCandidate;
      pc.ontrack = handleRemoteTrack;
      pc.oniceconnectionstatechange = handleIceConnectionStateChange;

      console.log("[WebRTC] Initialization complete");
      return true;
    } catch (err) {
      console.error("[WebRTC] Error initializing WebRTC:", err);
      return false;
    }
  };

  
  const handleIceCandidate = (event) => {
    if (event.candidate && signallingReadyRef.current && callState.callerId) {
      console.log("[WebRTC] Generated local ICE candidate");

      socket.emit("webrtc_ice_candidate", {
        targetUserId: callState.callerId,
        candidate: event.candidate,
      });
    }
  };

  
  const handleRemoteTrack = (event) => {
    console.log("[WebRTC] Received remote track");
    
  };

  
  const handleIceConnectionStateChange = () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    console.log("[WebRTC] ICE connection state:", pc.iceConnectionState);

    if (
      pc.iceConnectionState === "failed" ||
      pc.iceConnectionState === "disconnected"
    ) {
      console.log("[WebRTC] Attempting to restart ICE connection...");
      
    }
  };

  
  const handleWebRTCOffer = async (data) => {
    if (!data || !data.sdp) {
      throw new Error("Invalid offer data");
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error("No peer connection available");
    }

    try {
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      
      const answer = await pc.createAnswer();

      
      await pc.setLocalDescription(answer);

      
      await waitForLocalDescription(pc);

      
      socket.emit("webrtc_answer", {
        targetUserId: data.callerId,
        sdp: pc.localDescription,
      });

      
      processIceCandidateQueue();

      signallingReadyRef.current = true;
    } catch (err) {
      console.error("[WebRTC] Error handling offer:", err);
      throw err;
    }
  };

  
  const handleWebRTCAnswer = async (data) => {
    if (!data || !data.sdp) {
      throw new Error("Invalid answer data");
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error("No peer connection available");
    }

    try {
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      
      processIceCandidateQueue();

      signallingReadyRef.current = true;
    } catch (err) {
      console.error("[WebRTC] Error handling answer:", err);
      throw err;
    }
  };

  
  const handleWebRTCIceCandidate = async (data) => {
    if (!data.candidate) return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else {
        
        iceCandidatesQueue.current.push(data.candidate);
      }
    } catch (err) {
      console.error("[WebRTC] Error adding ICE candidate:", err);
    }
  };

  
  const processIceCandidateQueue = () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
        console.warn("[WebRTC] Error adding queued ICE candidate:", err),
      );
    }
  };

  
  const waitForLocalDescription = async (pc) => {
    if (!pc) return null;

    const maxRetries = 20;
    const retryInterval = 100;
    let retries = 0;

    while (!pc.localDescription && retries < maxRetries) {
      console.log(
        `[WebRTC] Waiting for localDescription (attempt ${retries + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
      retries++;
    }

    if (!pc.localDescription) {
      throw new Error("localDescription was not set within expected timeframe");
    }

    return pc.localDescription;
  };

  
  const createWebRTCOffer = async (targetUserId) => {
    const pc = peerConnectionRef.current;
    if (!pc) {
      throw new Error("No peer connection available");
    }

    try {
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      
      await pc.setLocalDescription(offer);

      
      await waitForLocalDescription(pc);

      
      socket.emit("webrtc_offer", {
        targetUserId,
        sdp: pc.localDescription,
      });

      signallingReadyRef.current = true;
    } catch (err) {
      console.error("[WebRTC] Error creating offer:", err);
      throw err;
    }
  };

  
  const cleanupWebRTC = () => {
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    
    iceCandidatesQueue.current = [];

    
    signallingReadyRef.current = false;
  };

  
  const startCall = async (targetUserId) => {
    console.log(
      `[VIDEO] Bắt đầu gọi tới: ${targetUserId} sử dụng SDK: ${activeSDK}`,
    );
    if (!socket?.connected) {
      console.error("[VIDEO] Socket không kết nối, không thể bắt đầu cuộc gọi");
      return false;
    }

    if (activeSDK === "jitsi") {
      
      const roomId = `jitsi-${user._id}-${targetUserId}-${Date.now()}`;

      
      socket.emit("video_call_request", {
        targetUserId,
        roomId,
        sdkType: "jitsi",
      });

      
      setCallState({
        isInCall: true,
        callRoomId: roomId,
        callerId: targetUserId,
        callerName: "Đang kết nối...",
        remoteParticipants: [],
      });
    } else if (activeSDK === "webrtc") {
      try {
        
        const initialized = await initializeWebRTC();
        if (!initialized) {
          throw new Error("WebRTC initialization failed");
        }

        
        const roomId = `webrtc-${user._id}-${targetUserId}-${Date.now()}`;

        
        socket.emit("video_call_request", {
          targetUserId,
          roomId,
          sdkType: "webrtc",
        });

        
        setCallState({
          isInCall: true,
          callRoomId: roomId,
          callerId: targetUserId,
          callerName: "Đang kết nối...",
          remoteParticipants: [],
        });

        
        setTimeout(async () => {
          try {
            await createWebRTCOffer(targetUserId);
          } catch (err) {
            console.error("[WebRTC] Error creating offer:", err);
          }
        }, 1000);
      } catch (err) {
        console.error("[VIDEO] Error starting WebRTC call:", err);
        return false;
      }
    }

    return true;
  };

  
  const acceptCall = async (callerId) => {
    console.log(
      `[VIDEO] Chấp nhận cuộc gọi từ: ${callerId} sử dụng SDK: ${activeSDK}`,
    );
    if (!socket?.connected || !incomingCall) {
      console.error("[VIDEO] Socket không kết nối hoặc không có cuộc gọi đến");
      return false;
    }

    
    if (activeSDK === "webrtc") {
      try {
        const initialized = await initializeWebRTC();
        if (!initialized) {
          throw new Error("WebRTC initialization failed");
        }
      } catch (err) {
        console.error(
          "[VIDEO] Error initializing WebRTC for call acceptance:",
          err,
        );
        return false;
      }
    }

    
    socket.emit("video_call_accepted", {
      callerId,
      sdkType: activeSDK,
    });

    return true;
  };

  
  const rejectCall = (callerId, reason = "Từ chối cuộc gọi") => {
    console.log("[VIDEO] Từ chối cuộc gọi từ:", callerId, "Lý do:", reason);
    if (!socket?.connected) {
      console.error("[VIDEO] Socket không kết nối, không thể từ chối cuộc gọi");
      return false;
    }

    socket.emit("video_call_rejected", { callerId, reason });
    setIncomingCall(null);

    
    if (activeSDK === "webrtc") {
      cleanupWebRTC();
    }

    return true;
  };

  
  const endCall = (roomId) => {
    console.log("[VIDEO] Kết thúc cuộc gọi trong phòng:", roomId);
    if (!socket?.connected) {
      console.error(
        "[VIDEO] Socket không kết nối, không thể kết thúc cuộc gọi",
      );
      setCallState((prev) => ({ ...prev, isInCall: false, callRoomId: null }));
      return false;
    }

    socket.emit("video_call_ended", { roomId });
    setCallState((prev) => ({ ...prev, isInCall: false, callRoomId: null }));

    
    if (activeSDK === "webrtc") {
      cleanupWebRTC();
    }

    return true;
  };

  
  const switchSDK = (sdkName) => {
    if (["jitsi", "webrtc"].includes(sdkName)) {
      setActiveSDK(sdkName);
      return true;
    }
    return false;
  };

  
  const value = {
    activeSDK,
    callState,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    switchSDK,
    
    localStream: localStreamRef.current,
    peerConnection: peerConnectionRef.current,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};


export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error("useVideoCall phải được sử dụng trong VideoCallProvider");
  }
  return context;
};
