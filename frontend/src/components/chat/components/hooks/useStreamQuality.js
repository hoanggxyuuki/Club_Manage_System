import { useState, useEffect } from 'react';

export const useStreamQuality = (webRTCService, remoteStream, connectionStatus) => {
  const [streamQuality, setStreamQuality] = useState({ status: 'unknown', stats: null });
  
  
  useEffect(() => {
    if (!remoteStream || connectionStatus !== 'connected') {
      setStreamQuality({ status: 'unknown', stats: null });
      return;
    }
    
    const intervalId = setInterval(async () => {
      try {
        const quality = await webRTCService.analyzeStreamQuality();
        setStreamQuality(quality);
      } catch (error) {
        console.warn('Quality monitoring error:', error);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [remoteStream, webRTCService, connectionStatus]);
  
  return streamQuality;
};