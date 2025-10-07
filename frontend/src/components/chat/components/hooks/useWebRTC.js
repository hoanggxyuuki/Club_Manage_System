import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../../../context/ChatContext';
import WebRTCService from '../services/WebRTCService';

export const useWebRTC = ({
  targetUserId,
  localStream,
  onEndCall,
  setError,
  setIsLoading,
  enabled = true
}) => {
  const { socket } = useChat();
  const [connectionStatus, setConnectionStatus] = useState('new');
  const [streamQuality, setStreamQuality] = useState('excellent');
  const [networkStats, setNetworkStats] = useState(null);
  const webRTCServiceRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const qualityCheckIntervalRef = useRef(null);
  const lastAdaptationTimeRef = useRef(0);
  const adaptationWindowMs = 5000; 

  
  const initializeWebRTC = useCallback(() => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.cleanup();
      webRTCServiceRef.current = null;
    }

    if (!socket || !targetUserId || !localStream) {
      return;
    }

    const webRTCService = new WebRTCService({
      socket,
      targetUserId,
      onConnectionStateChange: (state) => {
        setConnectionStatus(state);
        
        if (state === 'connected') {
          setIsLoading(false);
        } else if (state === 'failed' || state === 'disconnected') {
          setError('Connection lost. Attempting to reconnect...');
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        remoteStreamRef.current = stream;
      },
      onError: (message) => {
        setError(message);
      }
    });

    webRTCService.initialize(localStream)
      .then(() => {
        webRTCServiceRef.current = webRTCService;
        
        
        setupSignalingHandlers();
        
        
        webRTCService.createOffer()
          .then((offer) => {
            socket.emit('webrtc_signal', {
              targetUserId,
              signal: { type: 'offer', sdp: offer.sdp }
            });
          })
          .catch((err) => {
            setError(`Failed to create offer: ${err.message}`);
            setIsLoading(false);
          });
      })
      .catch((err) => {
        setError(`WebRTC initialization failed: ${err.message}`);
        setIsLoading(false);
      });
      
    
    startQualityMonitoring();
  }, [socket, targetUserId, localStream, setError, setIsLoading]);

  const setupSignalingHandlers = useCallback(() => {
    if (!socket) return;
    
    socket.on('webrtc_signal', async (data) => {
      if (!webRTCServiceRef.current) return;
      
      try {
        const { signal } = data;
        
        if (signal.type === 'offer') {
          await webRTCServiceRef.current.handleOffer(signal);
        } else if (signal.type === 'answer') {
          await webRTCServiceRef.current.handleAnswer(signal);
        } else if (signal.type === 'ice_candidate') {
          await webRTCServiceRef.current.handleIceCandidate(signal);
        }
      } catch (error) {
        console.error('Error handling WebRTC signal:', error);
        setError(`Signal handling error: ${error.message}`);
      }
    });
    
    socket.on('webrtc_error', (data) => {
      setError(data.message || 'WebRTC error occurred');
    });
    
    return () => {
      socket.off('webrtc_signal');
      socket.off('webrtc_error');
    };
  }, [socket, setError]);
  
  
  const startQualityMonitoring = useCallback(() => {
    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
    }
    
    qualityCheckIntervalRef.current = setInterval(async () => {
      if (!webRTCServiceRef.current || connectionStatus !== 'connected') return;
      
      try {
        const qualityResult = await webRTCServiceRef.current.analyzeStreamQuality();
        setNetworkStats(qualityResult.stats);
        
        
        if (qualityResult.status === 'poor') {
          setStreamQuality('poor');
        } else if (qualityResult.status === 'fair') {
          setStreamQuality('good');
        } else {
          setStreamQuality('excellent');
        }
        
        
        if (qualityResult.status === 'poor' && 
            Date.now() - lastAdaptationTimeRef.current > adaptationWindowMs) {
          adaptStreamQuality('low');
        } else if (qualityResult.status === 'fair' && 
                  Date.now() - lastAdaptationTimeRef.current > adaptationWindowMs) {
          adaptStreamQuality('medium');
        } else if (qualityResult.status === 'good' && 
                  streamQuality !== 'excellent' && 
                  Date.now() - lastAdaptationTimeRef.current > adaptationWindowMs * 2) {
          adaptStreamQuality('high');
        }
      } catch (error) {
        console.error('Error analyzing stream quality:', error);
      }
    }, 2000);
    
    return () => {
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
      }
    };
  }, [connectionStatus]);
  
  const adaptStreamQuality = useCallback((qualityLevel) => {
    if (!localStream || !webRTCServiceRef.current) return;
    
    const videoTrack = localStream.getVideoTracks()[0];
    if (!videoTrack) return;
    
    lastAdaptationTimeRef.current = Date.now();
    
    try {
      const sender = webRTCServiceRef.current.peerConnection?.getSenders()
        .find(s => s.track && s.track.kind === 'video');
      
      if (!sender) return;
      
      const params = sender.getParameters();
      if (!params.encodings) {
        params.encodings = [{}];
      }
      
      
      switch (qualityLevel) {
        case 'low':
          params.encodings[0].maxBitrate = 200000; 
          params.encodings[0].scaleResolutionDownBy = 3.0;
          params.encodings[0].maxFramerate = 15;
          console.log('Adapting to low quality due to poor connection');
          break;
        case 'medium':
          params.encodings[0].maxBitrate = 500000; 
          params.encodings[0].scaleResolutionDownBy = 2.0;
          params.encodings[0].maxFramerate = 24;
          console.log('Adapting to medium quality due to fair connection');
          break;
        case 'high':
          params.encodings[0].maxBitrate = 1500000; 
          params.encodings[0].scaleResolutionDownBy = 1.0;
          params.encodings[0].maxFramerate = 30;
          console.log('Restoring to high quality due to good connection');
          break;
      }
      
      sender.setParameters(params);
    } catch (error) {
      console.error('Error adapting stream quality:', error);
    }
  }, [localStream]);

  
  useEffect(() => {
    if (enabled && socket && targetUserId && localStream) {
      setIsLoading(true);
      initializeWebRTC();
    }
    
    return () => {
      if (webRTCServiceRef.current) {
        webRTCServiceRef.current.cleanup();
      }
      
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
      }
    };
  }, [enabled, socket, targetUserId, localStream, initializeWebRTC]);

  
  useEffect(() => {
    if (!socket) return;
    
    const handleReconnect = () => {
      if (webRTCServiceRef.current && connectionStatus !== 'connected') {
        webRTCServiceRef.current.restartConnection()
          .catch(err => {
            console.error('Connection restart failed:', err);
          });
      }
    };
    
    socket.on('reconnect', handleReconnect);
    
    return () => {
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, connectionStatus]);

  
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localVideoRef, localStream]);

  const handleEndCall = useCallback(() => {
    if (webRTCServiceRef.current) {
      webRTCServiceRef.current.cleanup();
    }
    
    if (onEndCall) {
      onEndCall();
    }
  }, [onEndCall]);

  return {
    connectionStatus,
    streamQuality,
    networkStats,
    localVideoRef,
    remoteVideoRef,
    remoteStream: remoteStreamRef.current,
    handleEndCall
  };
};
