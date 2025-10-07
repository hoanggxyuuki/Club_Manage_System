import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

/**
 * Agora Video Implementation
 *
 * Installation:
 * npm install agora-rtc-sdk-ng
 *
 * Setup:
 * 1. Create an Agora.io account: https://www.agora.io/
 * 2. Create a project to get an App ID
 * 3. Set up token server (optional but recommended for production)
 */


const client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8",
});

const AgoraVideoComponent = ({ roomId, onEndCall }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  const localVideoRef = useRef(null);
  const remoteUsers = useRef({});

  
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        
        const [audioTrack, videoTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        
        

        
        
        const appId = "YOUR_AGORA_APP_ID";

        
        await client.join(appId, roomId, null); 

        
        await client.publish([audioTrack, videoTrack]);
        console.log("Successfully joined room and published local tracks");

        setIsLoading(false);
        setIsConnected(true);
      } catch (error) {
        console.error("Error initializing Agora:", error);
        setError(`Could not initialize video call: ${error.message}`);
        setIsLoading(false);
      }
    };

    
    const setupEventListeners = () => {
      
      client.on("user-published", async (user, mediaType) => {
        console.log("Remote user published:", user.uid, mediaType);

        
        await client.subscribe(user, mediaType);

        
        if (mediaType === "video") {
          
          remoteUsers.current[user.uid] = user;
          setUsers((prevUsers) => [...prevUsers, user.uid]);

          
          setTimeout(() => {
            if (user.videoTrack) {
              user.videoTrack.play(`remote-video-${user.uid}`);
            }
          }, 100);
        }

        if (mediaType === "audio") {
          
          if (user.audioTrack) {
            user.audioTrack.play();
          }
        }
      });

      
      client.on("user-unpublished", (user, mediaType) => {
        console.log("Remote user unpublished:", user.uid, mediaType);

        if (mediaType === "video") {
          if (remoteUsers.current[user.uid]) {
            delete remoteUsers.current[user.uid];
            setUsers((prevUsers) =>
              prevUsers.filter((uid) => uid !== user.uid),
            );
          }
        }
      });

      
      client.on("user-left", (user) => {
        console.log("Remote user left:", user.uid);

        if (remoteUsers.current[user.uid]) {
          delete remoteUsers.current[user.uid];
          setUsers((prevUsers) => prevUsers.filter((uid) => uid !== user.uid));
        }
      });
    };

    setupEventListeners();
    init();

    
    return () => {
      cleanup();
    };
  }, [roomId]);

  
  const cleanup = async () => {
    try {
      
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }

      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }

      
      await client.leave();
      setIsConnected(false);
      setUsers([]);
      remoteUsers.current = {};

      console.log("Left channel successfully");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  };

  
  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!localAudioTrack.enabled);
    }
  };

  
  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!localVideoTrack.enabled);
    }
  };

  
  const handleEndCall = () => {
    cleanup();
    if (onEndCall) onEndCall();
  };

  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-white">Setting up your video call...</p>
        </div>
      </div>
    );
  }

  
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <h3 className="text-red-600 text-lg font-medium mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onEndCall}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Video grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local video */}
        <div className="relative rounded overflow-hidden bg-black">
          <div ref={localVideoRef} className="w-full h-full"></div>
          <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* Remote videos */}
        {users.map((uid) => (
          <div key={uid} className="relative rounded overflow-hidden bg-black">
            <div id={`remote-video-${uid}`} className="w-full h-full"></div>
            <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
              User {uid}
            </div>
          </div>
        ))}

        {/* Placeholder if no remote users */}
        {users.length === 0 && (
          <div className="rounded overflow-hidden bg-black flex items-center justify-center">
            <p className="text-white">Waiting for others to join...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center">
        <div className="flex space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${localAudioTrack?.enabled ? "bg-blue-600" : "bg-red-600"}`}
          >
            {localAudioTrack?.enabled ? "Mute Audio" : "Unmute Audio"}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${localVideoTrack?.enabled ? "bg-blue-600" : "bg-red-600"}`}
          >
            {localVideoTrack?.enabled ? "Turn Off Video" : "Turn On Video"}
          </button>

          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-600 text-white"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoComponent;
