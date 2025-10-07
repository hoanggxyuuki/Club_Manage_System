import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

/**
 * PeerJS Implementation
 *
 * PeerJS là một thư viện miễn phí giúp đơn giản hóa WebRTC
 *
 * Installation:
 * npm install peerjs
 */

const PeerJSComponent = ({ roomId, caller, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const callRef = useRef(null);

  
  useEffect(() => {
    import("peerjs")
      .then(({ default: Peer }) => {
        const initializePeer = async () => {
          try {
            setIsConnecting(true);

            
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });

            setLocalStream(stream);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }

            
            const isInitiator = !caller; 
            const userId = isInitiator
              ? `${roomId}-initiator`
              : `${roomId}-receiver`;
            const targetId = isInitiator
              ? `${roomId}-receiver`
              : `${roomId}-initiator`;

            
            const peer = new Peer(userId, {
              host: "peerjs-server.com", 
              secure: true,
              debug: 2,
              config: {
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" },
                  { urls: "stun:stun1.l.google.com:19302" },
                  { urls: "stun:stun2.l.google.com:19302" },
                ],
              },
            });

            peerRef.current = peer;

            
            peer.on("open", (id) => {
              console.log("Kết nối PeerJS đã mở với ID:", id);
              setIsConnecting(false);

              
              if (isInitiator) {
                setTimeout(() => initiateCall(targetId, stream), 1000);
              }
            });

            
            peer.on("call", (call) => {
              console.log("Nhận cuộc gọi từ:", call.peer);
              callRef.current = call;

              
              call.answer(stream);

              
              call.on("stream", (remoteMediaStream) => {
                console.log("Đã nhận stream từ bên kia");
                setRemoteStream(remoteMediaStream);

                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteMediaStream;
                }

                setIsConnected(true);
              });

              call.on("close", () => {
                console.log("Cuộc gọi đã bị đóng bởi bên kia");
                handleDisconnect();
              });

              call.on("error", (err) => {
                console.error("Lỗi trong cuộc gọi:", err);
                setError(`Lỗi kết nối: ${err.message}`);
                handleDisconnect();
              });
            });

            
            peer.on("error", (err) => {
              console.error("Lỗi PeerJS:", err);
              setError(`Lỗi kết nối: ${err.message}`);
              setIsConnecting(false);
            });

            peer.on("disconnected", () => {
              console.log("Mất kết nối với máy chủ PeerJS");
              handleDisconnect();
            });

            peer.on("close", () => {
              console.log("Kết nối PeerJS đã đóng");
              handleDisconnect();
            });
          } catch (err) {
            console.error("Lỗi khi khởi tạo PeerJS:", err);
            setError(`Không thể kết nối: ${err.message}`);
            setIsConnecting(false);
          }
        };

        initializePeer();
      })
      .catch((err) => {
        console.error("Lỗi khi tải thư viện PeerJS:", err);
        setError("Không thể tải thư viện PeerJS");
        setIsConnecting(false);
      });

    return () => {
      
      cleanupConnection();
    };
  }, [roomId]);

  
  const initiateCall = (targetPeerId, stream) => {
    try {
      console.log("Đang gọi đến:", targetPeerId);

      const call = peerRef.current.call(targetPeerId, stream);
      callRef.current = call;

      call.on("stream", (remoteMediaStream) => {
        console.log("Đã nhận stream từ:", targetPeerId);
        setRemoteStream(remoteMediaStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteMediaStream;
        }

        setIsConnected(true);
      });

      call.on("close", () => {
        console.log("Cuộc gọi đã bị đóng");
        handleDisconnect();
      });

      call.on("error", (err) => {
        console.error("Lỗi trong cuộc gọi:", err);
        setError(`Lỗi kết nối: ${err.message}`);
        handleDisconnect();
      });
    } catch (err) {
      console.error("Lỗi khi gọi:", err);
      setError(`Không thể kết nối cuộc gọi: ${err.message}`);
    }
  };

  
  const handleDisconnect = () => {
    cleanupConnection();
    if (onEndCall) onEndCall();
  };

  
  const cleanupConnection = () => {
    
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    
    setRemoteStream(null);
    setIsConnected(false);
  };

  
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  
  const endCall = () => {
    handleDisconnect();
  };

  
  if (isConnecting) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-white mt-4 text-lg">Đang kết nối...</p>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
          <p className="font-bold">Lỗi kết nối</p>
          <p>{error}</p>
          <button
            onClick={onEndCall}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Video container */}
      <div className="flex-1 relative w-full">
        {/* Remote video (full screen) */}
        <div className="absolute inset-0 bg-black">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-white mt-4 text-lg">
                  Đang chờ người khác tham gia...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (PiP) */}
        <div className="absolute bottom-4 right-4 w-1/4 max-w-[240px] aspect-video rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Indicators for muted audio/video */}
          <div className="absolute bottom-2 right-2 flex space-x-2">
            {!isAudioEnabled && (
              <div className="bg-red-600 p-1 rounded-full">
                <MicOff size={16} className="text-white" />
              </div>
            )}
            {!isVideoEnabled && (
              <div className="bg-red-600 p-1 rounded-full">
                <VideoOff size={16} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full ${isAudioEnabled ? "bg-gray-700" : "bg-red-600"}`}
        >
          {isAudioEnabled ? (
            <Mic className="text-white" />
          ) : (
            <MicOff className="text-white" />
          )}
        </button>

        {/* Video toggle */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full ${isVideoEnabled ? "bg-gray-700" : "bg-red-600"}`}
        >
          {isVideoEnabled ? (
            <Video className="text-white" />
          ) : (
            <VideoOff className="text-white" />
          )}
        </button>

        {/* End call */}
        <button onClick={endCall} className="bg-red-600 p-4 rounded-full">
          <PhoneOff className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default PeerJSComponent;
