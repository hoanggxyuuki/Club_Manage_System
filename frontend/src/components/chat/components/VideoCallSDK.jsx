import React, { useEffect, useRef } from 'react';
import { useParticipants } from './hooks/useParticipants';

const VideoCallSDK = () => {
  const participants = useParticipants();
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);

  

  
  useEffect(() => {
    
    if (remoteVideoRef.current && remoteStreamRef.current) {
      console.log('Attaching stored remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [participants]); 

  return (
    <div className="video-call-sdk">
      {/* ...existing code... */}

      {/* In the render section for remote video: */}
      {participants.length > 0 ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => console.error('Video element error:', e)}
        />
      ) : (
        
      )}

      {/* ...existing code... */}
    </div>
  );
};

export default VideoCallSDK;