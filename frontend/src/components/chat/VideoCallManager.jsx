import React from "react";
import { useVideoCall } from "../../context/VideoCallContext";
import VideoCallDialogSDK from "./VideoCallDialogSDK";


import VideoCallSDK from "./VideoCallSDK";
import WebRTCCall from "./WebRTCCall"; 

/**
 * VideoCallManager - Central component for managing video calls
 * This component now prioritizes pure WebRTC implementation over 3rd party SDKs
 */
const VideoCallManager = () => {
  const {
    activeSDK,
    callState,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useVideoCall();

  
  const handleAccept = () => {
    if (incomingCall?.id) {
      acceptCall(incomingCall.id);
    }
  };

  
  const handleReject = (reason = "Call declined") => {
    if (incomingCall?.id) {
      rejectCall(incomingCall.id, reason);
    }
  };

  
  const handleEndCall = () => {
    if (callState.callRoomId) {
      endCall(callState.callRoomId);
    }
  };

  
  if (incomingCall) {
    return (
      <VideoCallDialogSDK
        caller={incomingCall}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    );
  }

  
  if (callState.isInCall && callState.callRoomId) {
    
    return (
      <WebRTCCall
        roomId={callState.callRoomId}
        caller={{ id: callState.callerId, name: callState.callerName }}
        onEndCall={handleEndCall}
      />
    );

    /* SDK implementations are now disabled in favor of WebRTC
    switch (activeSDK) {
      case 'twilio':
        return (
          <TwilioImplementation
            roomId={callState.callRoomId}
            onEndCall={handleEndCall}
          />
        );
        
      case 'agora':
        return (
          <AgoraImplementation
            roomId={callState.callRoomId}
            onEndCall={handleEndCall}
          />
        );
      
      case 'jitsi':
        return (
          <JitsiMeetComponent
            roomId={callState.callRoomId}
            onEndCall={handleEndCall}
          />
        );
      
      case 'peerjs':
        return (
          <PeerJSComponent
            roomId={callState.callRoomId}
            caller={callState.callerId ? { id: callState.callerId, name: callState.callerName } : null}
            onEndCall={handleEndCall}
          />
        );
        
      case 'custom':
      default:
        return (
          <VideoCallSDK
            roomId={callState.callRoomId}
            caller={{ id: callState.callerId, name: callState.callerName }}
            onEndCall={handleEndCall}
          />
        );
    }
    */
  }

  
  return null;
};

export default VideoCallManager;
