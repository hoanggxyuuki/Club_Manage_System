import { useState, useEffect, useRef } from 'react';

export const useMediaStream = ({ setError }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'prompt', 
    microphone: 'prompt'
  });
  
  const mediaStreamRequestInProgress = useRef(false);
  
  
  useEffect(() => {
    const checkPermissions = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          
          const cameraPermission = await navigator.permissions.query({ name: 'camera' });
          
          const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
          
          setPermissionStatus({
            camera: cameraPermission.state,
            microphone: microphonePermission.state
          });
          
          console.log('Initial permission status -', 'Camera:', cameraPermission.state, 'Microphone:', microphonePermission.state);
          
          
          cameraPermission.addEventListener('change', () => {
            setPermissionStatus(prev => ({ ...prev, camera: cameraPermission.state }));
            console.log('Camera permission changed to:', cameraPermission.state);
          });
          
          microphonePermission.addEventListener('change', () => {
            setPermissionStatus(prev => ({ ...prev, microphone: microphonePermission.state }));
            console.log('Microphone permission changed to:', microphonePermission.state);
          });
        } catch (err) {
          console.warn('Could not query permissions API:', err);
          
        }
      }
    };
    
    checkPermissions();
  }, []);
  
  
  useEffect(() => {
    
    if (mediaStreamRequestInProgress.current) {
      return;
    }
    
    const initializeMediaStream = async () => {
      try {
        mediaStreamRequestInProgress.current = true;
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support video calls');
        }

        
        console.log('Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        
        setPermissionStatus({
          camera: 'granted',
          microphone: 'granted'
        });
        
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          videoTrack.enabled = isVideoEnabled;
          console.log('Video track initialized with enabled:', isVideoEnabled);
        }
        
        if (audioTrack) {
          audioTrack.enabled = isAudioEnabled;
          console.log('Audio track initialized with enabled:', isAudioEnabled);
        }
        
        setLocalStream(stream);
        console.log('Media stream initialized successfully');
        
        
        await listAvailableDevices();
      } catch (err) {
        console.error('Error accessing media devices:', err);
        let errorMessage = 'Could not access your camera and microphone';
        
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionStatus({
            camera: 'denied',
            microphone: 'denied'
          });
          errorMessage = 'Camera/microphone permissions denied. Please allow access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera or microphone found on your device.';
          
          
          try {
            console.log('Attempting audio-only fallback...');
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            setLocalStream(audioStream);
            setIsVideoEnabled(false);
            setPermissionStatus(prev => ({ ...prev, microphone: 'granted', camera: 'denied' }));
            
            console.log('Audio-only stream initialized successfully');
            return;
          } catch (audioErr) {
            console.error('Audio-only fallback failed:', audioErr);
          }
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Your camera or microphone is already in use by another application.';
        } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
          errorMessage = 'Your camera does not meet the required specifications.';
          
          
          try {
            console.log('Attempting with lower video quality...');
            const lowQualityStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
              }
            });
            
            setLocalStream(lowQualityStream);
            setPermissionStatus({
              camera: 'granted',
              microphone: 'granted'
            });
            
            console.log('Lower quality stream initialized successfully');
            return;
          } catch (lowQualityErr) {
            console.error('Lower quality fallback failed:', lowQualityErr);
          }
        }
        
        setError(errorMessage);
      } finally {
        mediaStreamRequestInProgress.current = false;
      }
    };

    initializeMediaStream();

    
    return () => {
      if (localStream) {
        console.log('Cleaning up media streams');
        localStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };
  }, [setError]);
  
  
  const listAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevices({
        video: videoDevices,
        audio: audioDevices
      });
      
      return { videoDevices, audioDevices };
    } catch (err) {
      console.error('Error listing devices:', err);
      return { videoDevices: [], audioDevices: [] };
    }
  };

  
  const retryMediaAccess = async () => {
    try {
      mediaStreamRequestInProgress.current = true;
      
      console.log('Retrying media access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      setLocalStream(stream);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      setPermissionStatus({
        camera: 'granted',
        microphone: 'granted'
      });
      
      await listAvailableDevices();
      console.log('Media access successfully re-established');
      
      return true;
    } catch (err) {
      console.error('Retry media access failed:', err);
      setError('Could not access your camera and microphone. Please check your browser settings.');
      return false;
    } finally {
      mediaStreamRequestInProgress.current = false;
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('Audio toggled to:', audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('Video toggled to:', videoTrack.enabled);
      }
    }
  };
  
  
  const switchCamera = async (deviceId) => {
    if (!localStream) return;
    
    try {
      console.log('Switching to camera device:', deviceId);
      
      
      localStream.getVideoTracks().forEach(track => track.stop());
      
      
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      
      const newVideoTrack = newVideoStream.getVideoTracks()[0];
      
      
      const newStream = new MediaStream();
      
      
      localStream.getAudioTracks().forEach(track => {
        newStream.addTrack(track);
      });
      
      
      newStream.addTrack(newVideoTrack);
      newVideoTrack.enabled = isVideoEnabled;
      
      setLocalStream(newStream);
      console.log('Camera switched successfully');
      
      return newStream;
    } catch (err) {
      console.error('Error switching camera:', err);
      setError('Failed to switch camera. Please try again.');
    }
  };
  
  
  const switchMicrophone = async (deviceId) => {
    if (!localStream) return;
    
    try {
      console.log('Switching to microphone device:', deviceId);
      
      
      localStream.getAudioTracks().forEach(track => track.stop());
      
      
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const newAudioTrack = newAudioStream.getAudioTracks()[0];
      
      
      const newStream = new MediaStream();
      
      
      localStream.getVideoTracks().forEach(track => {
        newStream.addTrack(track);
      });
      
      
      newStream.addTrack(newAudioTrack);
      newAudioTrack.enabled = isAudioEnabled;
      
      setLocalStream(newStream);
      console.log('Microphone switched successfully');
      
      return newStream;
    } catch (err) {
      console.error('Error switching microphone:', err);
      setError('Failed to switch microphone. Please try again.');
    }
  };

  return {
    localStream,
    remoteStream,
    setRemoteStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    retryMediaAccess,
    permissionStatus,
    availableDevices: devices,
    switchCamera,
    switchMicrophone
  };
};