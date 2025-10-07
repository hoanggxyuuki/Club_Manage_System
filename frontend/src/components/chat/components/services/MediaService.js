class MediaService {
    constructor({ setError }) {
      this.setError = setError;
      this.currentQuality = 'high';
      this.availableDevices = {
        video: [],
        audio: []
      };
      this.cachedStreams = new Map(); 
      this.permissionsGranted = {
        camera: false,
        microphone: false
      };
    }
    
    async getLocalStream(quality = 'high') {
      try {
        
        this.currentQuality = quality;
        
        
        await this.checkAndRequestPermissions();
        
        
        if (this.cachedStreams.has(quality)) {
          const cachedStream = this.cachedStreams.get(quality);
          
          const allTracksActive = cachedStream.getTracks().every(track => track.readyState === 'live');
          if (allTracksActive) {
            console.log(`Using cached ${quality} quality stream`);
            return cachedStream;
          } else {
            console.log(`Cached ${quality} stream has inactive tracks, creating a new one`);
            this.cachedStreams.delete(quality); 
          }
        }
        
        
        let constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: {}
        };
        
        
        switch (quality) {
          case 'high':
            constraints.video = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            };
            break;
          case 'medium':
            constraints.video = {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 25 }
            };
            break;
          case 'low':
            constraints.video = {
              width: { ideal: 320 },
              height: { ideal: 240 },
              frameRate: { ideal: 20 }
            };
            break;
          case 'bandwidth-saver':
            constraints.video = {
              width: { ideal: 320 },
              height: { ideal: 180 },
              frameRate: { ideal: 15 }
            };
            break;
          case 'audio-only':
            constraints.video = false;
            break;
          default:
            constraints.video = true;
        }
        
        console.log(`Requesting user media with ${quality} quality`);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log(`Successfully obtained ${quality} quality stream`);
        
        
        if (['high', 'medium', 'low', 'bandwidth-saver'].includes(quality)) {
          this.cachedStreams.set(quality, stream);
        }
        
        this.permissionsGranted = {
          camera: quality !== 'audio-only',
          microphone: true
        };
        
        return stream;
      } catch (error) {
        console.error('Error getting user media:', error);
        
        
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          try {
            console.log('No video device found, attempting audio only');
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              },
              video: false 
            });
            
            this.cachedStreams.set('audio-only', audioOnlyStream);
            this.permissionsGranted = {
              camera: false,
              microphone: true
            };
            return audioOnlyStream;
          } catch (audioError) {
            console.error('Error getting audio-only stream:', audioError);
            this.permissionsGranted = {
              camera: false, 
              microphone: false
            };
            throw audioError;
          }
        }
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          this.permissionsGranted = {
            camera: false,
            microphone: false
          };
          
          if (this.setError) {
            this.setError('Camera/microphone permissions denied. Please allow access in your browser settings.');
          }
        }
        
        throw error;
      }
    }
    
    async checkAndRequestPermissions() {
      
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const results = await Promise.all([
            navigator.permissions.query({ name: 'camera' }),
            navigator.permissions.query({ name: 'microphone' })
          ]);
          
          const cameraStatus = results[0];
          const micStatus = results[1];
          
          this.permissionsGranted = {
            camera: cameraStatus.state === 'granted',
            microphone: micStatus.state === 'granted'
          };
          
          console.log('Permission status:', this.permissionsGranted);
          
          
          if (this.permissionsGranted.camera && this.permissionsGranted.microphone) {
            console.log('Permissions already granted');
            return true;
          }
        } catch (err) {
          console.warn('Error querying permissions:', err);
          
        }
      }
      
      
      try {
        console.log('Explicitly requesting camera and microphone permissions');
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        
        tempStream.getTracks().forEach(track => track.stop());
        
        this.permissionsGranted = {
          camera: true,
          microphone: true
        };
        
        console.log('Camera and microphone permissions granted');
        return true;
      } catch (err) {
        console.error('Error requesting permissions:', err);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.permissionsGranted = {
            camera: false,
            microphone: false
          };
          throw new Error('Camera/microphone permissions denied. Please allow access in your browser settings.');
        }
        
        
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          try {
            
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            audioOnlyStream.getTracks().forEach(track => track.stop());
            
            this.permissionsGranted = {
              camera: false,
              microphone: true
            };
            
            console.log('Only microphone permission granted (no camera found)');
            return true;
          } catch (audioErr) {
            this.permissionsGranted = {
              camera: false,
              microphone: false
            };
            throw new Error('Could not access microphone. Please check permissions.');
          }
        }
        
        throw err;
      }
    }
    
    stopStream(stream) {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
    }
    
    async getDeviceList() {
      try {
        
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .catch(() => {
              
            });
        } catch (permissionErr) {
          console.log('Could not get full device permissions', permissionErr);
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
        const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
        
        
        this.availableDevices = {
          video: videoDevices,
          audio: audioInputDevices,
          audioOutput: audioOutputDevices
        };
        
        return {
          videoDevices,
          audioInputDevices,
          audioOutputDevices
        };
      } catch (error) {
        console.error('Error getting device list:', error);
        throw error;
      }
    }
    
    async switchCamera(stream, deviceId) {
      if (!stream) return null;
      
      
      stream.getVideoTracks().forEach(track => track.stop());
      
      
      try {
        const constraints = {
          audio: false,
          video: { 
            deviceId: { exact: deviceId } 
          }
        };
        
        
        if (this.currentQuality === 'high') {
          constraints.video.width = { ideal: 1280 };
          constraints.video.height = { ideal: 720 };
          constraints.video.frameRate = { ideal: 30 };
        } else if (this.currentQuality === 'medium') {
          constraints.video.width = { ideal: 640 };
          constraints.video.height = { ideal: 480 };
          constraints.video.frameRate = { ideal: 25 };
        } else if (this.currentQuality === 'low' || this.currentQuality === 'bandwidth-saver') {
          constraints.video.width = { ideal: 320 };
          constraints.video.height = { ideal: 240 };
          constraints.video.frameRate = { ideal: 15 };
        }
        
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        
        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        
        const combinedStream = new MediaStream();
        if (videoTrack) combinedStream.addTrack(videoTrack);
        if (audioTrack) combinedStream.addTrack(audioTrack);
        
        return combinedStream;
      } catch (error) {
        console.error('Error switching camera:', error);
        throw error;
      }
    }
    
    async switchMicrophone(stream, deviceId) {
      if (!stream) return null;
      
      
      stream.getAudioTracks().forEach(track => track.stop());
      
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { 
            deviceId: { exact: deviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];
        
        
        const combinedStream = new MediaStream();
        if (videoTrack) combinedStream.addTrack(videoTrack);
        if (audioTrack) combinedStream.addTrack(audioTrack);
        
        return combinedStream;
      } catch (error) {
        console.error('Error switching microphone:', error);
        throw error;
      }
    }
    
    async adaptToNetworkConditions(stream, networkQuality) {
      if (!stream) return;
      
      const { status } = networkQuality;
      let targetQuality;
      
      
      if (status === 'excellent' || status === 'good') {
        targetQuality = 'high';
      } else if (status === 'fair') {
        targetQuality = 'medium';
      } else if (status === 'poor') {
        targetQuality = 'low';
      } else if (status === 'very-poor') {
        targetQuality = 'bandwidth-saver';
      } else {
        return; 
      }
      
      
      if (targetQuality !== this.currentQuality) {
        this.currentQuality = targetQuality;
        
        
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          try {
            const videoTrack = videoTracks[0];
            const sender = this.peerConnection?.getSenders().find(s => s.track === videoTrack);
            
            if (sender) {
              const parameters = sender.getParameters();
              
              
              if (!parameters.encodings) {
                parameters.encodings = [{}];
              }
              
              if (targetQuality === 'high') {
                parameters.encodings[0].maxBitrate = 1500000; 
              } else if (targetQuality === 'medium') {
                parameters.encodings[0].maxBitrate = 700000; 
              } else if (targetQuality === 'low') {
                parameters.encodings[0].maxBitrate = 250000; 
              } else if (targetQuality === 'bandwidth-saver') {
                parameters.encodings[0].maxBitrate = 150000; 
              }
              
              await sender.setParameters(parameters);
              console.log(`Adapted stream to ${targetQuality} quality`);
            }
          } catch (error) {
            console.warn('Error while adapting stream quality:', error);
          }
        }
      }
    }
    
    
    clearStreamCache() {
      this.cachedStreams.forEach((stream) => {
        this.stopStream(stream);
      });
      this.cachedStreams.clear();
    }
  }
  
  export default MediaService;