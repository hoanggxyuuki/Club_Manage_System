import React, { useState, useEffect, useRef } from "react";
import { Video as TwilioVideo } from "twilio-video";

/**
 * Twilio Video Implementation
 *
 * Installation:
 * npm install twilio-video
 *
 * Server-side setup:
 * 1. Create a Twilio account: https://www.twilio.com/
 * 2. Get API credentials (Account SID, API Key SID, and API Key Secret)
 * 3. Add a server endpoint to generate access tokens
 */

const TwilioVideoComponent = ({ roomId, onEndCall }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const participantRefs = useRef(new Map());

  
  useEffect(() => {
    
    const getAccessToken = async () => {
      try {
        const response = await fetch("/api/video/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });

        if (!response.ok) {
          throw new Error("Failed to get access token");
        }

        const { token } = await response.json();
        return token;
      } catch (error) {
        console.error("Error getting access token:", error);
        setError("Failed to get access credentials");
        setIsConnecting(false);
        throw error;
      }
    };

    
    const connectToRoom = async () => {
      try {
        setIsConnecting(true);

        
        const token = await getAccessToken();

        
        const room = await TwilioVideo.connect(token, {
          name: roomId,
          audio: true,
          video: true,
        });

        setRoom(room);
        setIsConnecting(false);

        
        const localTrackPublication = Array.from(
          room.localParticipant.videoTracks.values(),
        )[0];
        if (localTrackPublication) {
          const localTrack = localTrackPublication.track;
          if (localVideoRef.current) {
            localTrack.attach(localVideoRef.current);
          }
        }

        
        room.participants.forEach((participant) => {
          addParticipant(participant);
        });

        
        room.on("participantConnected", (participant) => {
          console.log(`Participant connected: ${participant.identity}`);
          addParticipant(participant);
        });

        
        room.on("participantDisconnected", (participant) => {
          console.log(`Participant disconnected: ${participant.identity}`);
          removeParticipant(participant);
        });

        
        room.on("disconnected", () => {
          console.log("Disconnected from room");
          cleanup();
        });
      } catch (error) {
        console.error("Error connecting to Twilio room:", error);
        setError("Failed to connect to video room");
        setIsConnecting(false);
      }
    };

    connectToRoom();

    return () => {
      
      cleanup();
    };
  }, [roomId]);

  
  const addParticipant = (participant) => {
    setParticipants((prevParticipants) => {
      return [...prevParticipants, participant];
    });

    
    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        trackSubscribed(publication.track, participant);
      }
    });

    participant.on("trackSubscribed", (track) => {
      trackSubscribed(track, participant);
    });

    participant.on("trackUnsubscribed", (track) => {
      trackUnsubscribed(track, participant);
    });
  };

  
  const removeParticipant = (participant) => {
    setParticipants((prevParticipants) => {
      return prevParticipants.filter((p) => p !== participant);
    });

    
    if (participantRefs.current.has(participant.identity)) {
      participantRefs.current.delete(participant.identity);
    }
  };

  
  const trackSubscribed = (track, participant) => {
    if (track.kind === "video") {
      const element = document.createElement("video");
      element.setAttribute("autoplay", "true");
      element.setAttribute("playsinline", "true");
      track.attach(element);

      
      participantRefs.current.set(participant.identity, element);

      
      const container = document.getElementById("remote-participants");
      if (container) {
        const wrapper = document.createElement("div");
        wrapper.id = `participant-${participant.identity}`;
        wrapper.appendChild(element);
        container.appendChild(wrapper);
      }
    }
  };

  
  const trackUnsubscribed = (track) => {
    if (track.kind === "video") {
      track.detach().forEach((element) => element.remove());
    }
  };

  
  const endCall = () => {
    cleanup();
    if (onEndCall) onEndCall();
  };

  
  const cleanup = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }

    participantRefs.current.clear();
    setParticipants([]);
  };

  
  const toggleAudio = () => {
    if (room) {
      room.localParticipant.audioTracks.forEach((publication) => {
        publication.track.enable(!publication.track.isEnabled);
      });
    }
  };

  
  const toggleVideo = () => {
    if (room) {
      room.localParticipant.videoTracks.forEach((publication) => {
        publication.track.enable(!publication.track.isEnabled);
      });
    }
  };

  return (
    <div className="twilio-video-container">
      {/* Loading state */}
      {isConnecting && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Connecting to video room...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="error-overlay">
          <p className="error-message">{error}</p>
          <button onClick={endCall}>Close</button>
        </div>
      )}

      {/* Video layout */}
      <div className="video-grid">
        {/* Local video */}
        <div className="local-video">
          <video ref={localVideoRef} autoPlay playsInline muted />
        </div>

        {/* Remote participants */}
        <div id="remote-participants" className="remote-participants">
          {/* Twilio will dynamically add participant videos here */}
        </div>
      </div>

      {/* Controls */}
      <div className="video-controls">
        <button onClick={toggleAudio}>Toggle Audio</button>
        <button onClick={toggleVideo}>Toggle Video</button>
        <button onClick={endCall} className="end-call-button">
          End Call
        </button>
      </div>
    </div>
  );
};

export default TwilioVideoComponent;
