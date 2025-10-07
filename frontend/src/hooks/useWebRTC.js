import { useEffect, useRef, useState } from 'react';

const useWebRTC = (onRemoteStream) => {
  const [localStream, setLocalStream] = useState(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);

  useEffect(() => {
    const handleRemoteStream = (stream) => {
      console.log('Remote stream received in hook:', stream);
      
      
      if (remoteVideoRef && remoteVideoRef.current) {
        try {
          remoteVideoRef.current.srcObject = stream;
          console.log('Remote video srcObject successfully set');
        } catch (error) {
          console.error('Error setting remote video srcObject:', error);
        }
      } else {
        console.warn('Remote video reference not available yet');
        
        remoteStreamRef.current = stream;
      }
    };

    if (onRemoteStream) {
      onRemoteStream(handleRemoteStream);
    }
  }, [onRemoteStream]);

  return { localStream, remoteVideoRef, remoteStreamRef };
};

export default useWebRTC;