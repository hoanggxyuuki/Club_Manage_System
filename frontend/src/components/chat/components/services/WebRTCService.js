'use strict';

export default class WebRTCService {
    constructor({ socket, targetUserId, onConnectionStateChange, onRemoteStream, onError }) {
      this.socket = socket;
      this.targetUserId = targetUserId;
      this.onConnectionStateChange = onConnectionStateChange;
      this.onRemoteStream = onRemoteStream;
      this.onError = onError;
      this.pendingCandidates = [];
      this.peerConnection = null;
      this.localStream = null;
      this.reconnectionAttempts = 0;
      this.maxReconnectionAttempts = 5; 
      this.adaptiveMode = true; 
    }
    
    async initialize(localStream) {
      try {
        
        if (this.peerConnection) {
          this.cleanup(false);
        }
          
        if (!localStream) {
          throw new Error('Local stream is required for initialization');
        }

        this.localStream = localStream;
        console.log('Initializing WebRTC with configuration...');
          
        const configuration = {
          iceServers: [
            
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            
            { urls: "stun:global.stun.twilio.com:3478" },
            
            
            
            {
              urls: [
                "turn:74.125.140.127:19305?transport=udp",
                "turn:74.125.140.127:19305?transport=tcp",
                "turn:74.125.143.127:19305?transport=udp",
                "turn:74.125.143.127:19305?transport=tcp"
              ],
              username: "CKjCuLwFEgZNVs74RJVzMzBQySa7PdbDtHQxnAlJnz8",
              credential: "Psj2CiHRgt8NEOm2i07J2H4QiZM="
            },
            
            
            {
              urls: [
                "turn:turn-server-1.xirsys.com:80?transport=udp",
                "turn:turn-server-1.xirsys.com:3478?transport=udp"
              ],
              username: "7xG_hQMDBrvIDNoHUSmjxz1ngZkWXO4_JiBgLymR49mIXHT8mZuGf5WeEPKrJ5TAAAAAGN_pVGhvYW5nZ3h5dXVraQ==",
              credential: "24d54474-4745-11ee-8507-0242ac120004"
            },
            
            
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
            {
              urls: "turn:openrelay.metered.ca:443",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
            
            
            {
              urls: "turn:relay.metered.ca:80",
              username: "03bc7d5464577c8956711267",
              credential: "T9UKl/2c9mu12o3G"
            },
            {
              urls: "turn:relay.metered.ca:443",
              username: "03bc7d5464577c8956711267",
              credential: "T9UKl/2c9mu12o3G"
            },
            {
              urls: "turns:relay.metered.ca:443",
              username: "03bc7d5464577c8956711267",
              credential: "T9UKl/2c9mu12o3G"
            }
          ],
          iceCandidatePoolSize: 20, 
          bundlePolicy: 'max-bundle', 
          rtcpMuxPolicy: 'require',
          iceTransportPolicy: 'all',
          sdpSemantics: 'unified-plan'
        };
      
        this.peerConnection = new RTCPeerConnection(configuration);
        
        
        this.setupEventListeners();
        
        
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
          });
        }
        
        if (!this.peerConnection) {
          throw new Error('PeerConnection creation failed');
        }

        console.log('WebRTC initialization completed successfully');
        return this.peerConnection;
      } catch (error) {
        console.error('WebRTC initialization failed:', error);
        if (this.onError) {
          this.onError(error.message);
        }
        throw error;
      }
    }

  emitSignal(signal) {
      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket instance not found'));
          return;
        }

        if (!this.socket.connected) {
          reject(new Error('Socket is not connected'));
          return;
        }

        console.log('Emitting WebRTC signal:', signal.type);

        try {
          this.socket.emit('webrtc_signal', {
            targetUserId: this.targetUserId,
            signal: signal
          }, (response) => {
            if (response && response.error) {
              console.error('Signal emission error:', response.error);
              reject(new Error(response.error));
            } else {
              console.log('Signal emitted successfully:', signal.type);
              resolve(response);
            }
          });

          
          setTimeout(() => {
            reject(new Error('Signal emission timeout'));
          }, 5000);
        } catch (error) {
          console.error('Error emitting signal:', error);
          reject(error);
        }
      });
    }
    setupEventListeners() {
      console.log('Setting up WebRTC event listeners...');
      
      if (!this.peerConnection) {
        console.error('No peer connection available for event setup');
        return;
      }

      const pc = this.peerConnection;
      
      pc.onicecandidate = (event) => {
        if (event.candidate && this.socket) {
          this.socket.emit('webrtc_signal', {
            targetUserId: this.targetUserId,
            signal: {
              type: 'ice_candidate',
              candidate: event.candidate
            }
          });
        }
      };
      
      pc.ontrack = (event) => {
        console.log('WebRTC ontrack event received:', event);
        if (this.onRemoteStream && event && event.streams) {
          const stream = event.streams[0];
          if (stream) {
            console.log('Remote stream obtained successfully');
            this.onRemoteStream(stream);
          } else {
            console.warn('Received ontrack event but stream is null or undefined');
          }
        } else {
          console.warn('Invalid ontrack event or missing streams array');
        }
      };
      
      pc.onconnectionstatechange = () => {
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(pc.connectionState);
        }
        
        if (pc.connectionState === 'failed') {
          this.restartConnection();
        }
      };
      
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          pc.restartIce();
        }
      };
    }
    
    async createOffer() {
        console.log('Starting offer creation for user:', this.targetUserId);
        
        try {
            if (!this.peerConnection) {
                throw new Error('No peer connection available');
            }

            if (!this.socket?.connected) {
                throw new Error('Socket connection not established');
            }

            
            if (this.localStream) {
                const senders = this.peerConnection.getSenders();
                if (senders.length === 0) {
                    console.log('No tracks found, adding tracks from localStream');
                    this.localStream.getTracks().forEach(track => {
                        this.peerConnection.addTrack(track, this.localStream);
                    });
                }
            } else {
                console.warn('No local stream available for offer');
            }

            
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: this.reconnectionAttempts > 0 
            });

            console.log('Offer created, setting local description');
            await this.peerConnection.setLocalDescription(offer);

            
            console.log('Waiting for ICE gathering...');
            await this.waitForIceGathering(5000);

            if (!this.peerConnection.localDescription) {
                throw new Error('No local description available after ICE gathering');
            }

            console.log('Offer creation completed successfully');
            return this.peerConnection.localDescription;
        } catch (error) {
            console.error('Error creating offer:', error);
            if (this.onError) {
                this.onError('Failed to create offer: ' + error.message);
            }
            throw error;
        }
    }
    
    async handleOffer(signal, sdpService) {
      console.log('Handling received offer...');
      try {
        if (!this.peerConnection) {
          throw new Error('No peer connection available');
        }

        const parsedOffer = await sdpService.processReceivedOffer(signal.sdp);
        
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp: parsedOffer })
        );
        
        console.log('Remote description set, creating answer...');
        const answer = await this.peerConnection.createAnswer();
        
        const processedAnswer = await sdpService.processAnswer(
          answer,
          this.peerConnection.localDescription
        );
        
        await this.peerConnection.setLocalDescription(processedAnswer);
        
        console.log('Local description set, waiting for ICE gathering...');
        await this.waitForIceGathering(3000);
        
        await this.emitSignal({
          type: 'answer',
          sdp: this.peerConnection.localDescription.sdp
        });
        
        console.log('Answer sent successfully');
      } catch (error) {
        console.error('Error handling offer:', error);
        if (this.onError) {
          this.onError('Failed to process offer: ' + error.message);
        }
        throw error;
      }
    }
    
    async handleAnswer(signal, sdpService) {
        console.log('Processing received answer...');
        try {
            if (!this.peerConnection) {
                throw new Error('No peer connection available');
            }

            if (this.peerConnection.signalingState === 'closed') {
                throw new Error('Peer connection is closed');
            }

            if (this.peerConnection.signalingState === 'stable') {
                console.log('Connection already in stable state, ignoring answer');
                return;
            }

            
            const parsedAnswer = await sdpService.processReceivedAnswer(
                signal.sdp,
                this.peerConnection.localDescription
            );

            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: parsedAnswer })
            );
            console.log('Remote description set successfully');

            
            if (this.pendingCandidates && this.pendingCandidates.length > 0) {
                console.log(`Processing ${this.pendingCandidates.length} pending ICE candidates`);
                const candidates = [...this.pendingCandidates];
                this.pendingCandidates = [];

                await Promise.all(candidates.map(async (candidate) => {
                    try {
                        if (this.peerConnection.remoteDescription) {
                            await this.peerConnection.addIceCandidate(
                                new RTCIceCandidate(candidate)
                            );
                            console.log('Pending ICE candidate added successfully');
                        }
                    } catch (e) {
                        console.error('Error adding pending ICE candidate:', e);
                        
                    }
                }));
            }

            
            this.reconnectionAttempts = 0;
        } catch (error) {
            console.error('Error handling answer:', error);
            if (this.onError) {
                this.onError('Failed to process answer: ' + error.message);
            }
            
            
            if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                console.log('Attempting to reconnect after answer failure...');
                await this.restartConnection();
            }
            
            throw error;
        }
    }
      
    async handleIceCandidate(signal) {
        if (!signal.candidate) {
            console.log('Received empty candidate, skipping');
            return;
        }
        
        try {
            if (!this.peerConnection) {
                throw new Error('No peer connection available');
            }

            
            if (this.peerConnection.remoteDescription &&
                this.peerConnection.remoteDescription.type &&
                this.peerConnection.signalingState !== 'closed') {
                    
                await this.peerConnection.addIceCandidate(
                    new RTCIceCandidate(signal.candidate)
                );
                console.log('ICE candidate added successfully');
            } else {
                
                this.pendingCandidates = this.pendingCandidates || [];
                this.pendingCandidates.push(signal.candidate);
                console.log('ICE candidate queued for later processing');
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
            if (this.onError) {
                this.onError('Failed to process ICE candidate: ' + error.message);
            }
            
            throw error;
        }
    }
    
    async waitForIceGathering(timeout = 5000) {
      if (this.peerConnection.iceGatheringState === 'complete') {
        return;
      }
      
      return Promise.race([
        new Promise(resolve => {
          const checkState = () => {
            if (!this.peerConnection || this.peerConnection.iceGatheringState === 'complete') {
              resolve();
            } else {
              setTimeout(checkState, 100);
            }
          };
          checkState();
        }),
        new Promise(resolve => setTimeout(resolve, timeout))
      ]);
    }
    
    async restartConnection() {
        console.log('Attempting connection restart...');
        this.reconnectionAttempts++;
        
        if (this.reconnectionAttempts > this.maxReconnectionAttempts) {
            const error = new Error('Maximum reconnection attempts reached');
            if (this.onError) {
                this.onError(error.message);
            }
            throw error;
        }
        
        try {
            if (!this.socket?.connected) {
                throw new Error('Socket not connected');
            }

            
            const mediaState = this.saveMediaState();
            const originalStream = this.localStream;
            
            console.log('Cleaning up existing connection...');
            this.cleanup(false);
            
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            
            console.log('Reinitializing connection...');
            await this.initialize(originalStream);
            
            
            this.restoreMediaState(mediaState);
            
            
            console.log('Creating new offer with ICE restart...');
            const offerDescription = await this.createOffer();
            
            
            console.log('Sending new connection offer...');
            await this.emitSignal({
                type: 'offer',
                sdp: offerDescription.sdp
            });
            
            
            const answerTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Answer timeout')), 10000);
            });
            
            
            await Promise.race([
                answerTimeout,
                new Promise((resolve, reject) => {
                    const checkConnection = () => {
                        if (this.peerConnection?.connectionState === 'connected') {
                            resolve();
                        } else if (this.peerConnection?.connectionState === 'failed') {
                            reject(new Error('Connection failed'));
                        } else {
                            setTimeout(checkConnection, 1000);
                        }
                    };
                    checkConnection();
                })
            ]);
            
            console.log('Connection restart successful');
            this.reconnectionAttempts = 0; 
            return true;
        } catch (error) {
            console.error('Connection restart failed:', error);
            if (this.onError) {
                this.onError(`Connection restart failed: ${error.message}`);
            }
            
            
            if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                console.log('Scheduling another restart attempt...');
                setTimeout(() => this.restartConnection(), 2000);
            }
            
            throw error;
        }
    }
    
    saveMediaState() {
      if (!this.localStream) return {};
      
      const state = {
        audio: false,
        video: false,
        audioDeviceId: null,
        videoDeviceId: null
      };
      
      
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        state.audio = audioTrack.enabled;
        
        if (audioTrack.getSettings) {
          try {
            const settings = audioTrack.getSettings();
            if (settings.deviceId) {
              state.audioDeviceId = settings.deviceId;
            }
          } catch (err) {
            console.warn('Could not get audio track settings:', err);
          }
        }
      }
      
      
      const videoTracks = this.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        state.video = videoTrack.enabled;
        
        if (videoTrack.getSettings) {
          try {
            const settings = videoTrack.getSettings();
            if (settings.deviceId) {
              state.videoDeviceId = settings.deviceId;
            }
          } catch (err) {
            console.warn('Could not get video track settings:', err);
          }
        }
      }
      
      console.log('Saved media state:', state);
      return state;
    }
    
    restoreMediaState(mediaState) {
      if (!this.localStream || !mediaState) {
        console.warn('Cannot restore media state: missing localStream or mediaState');
        return;
      }
      
      console.log('Restoring media state:', mediaState);
      
      
      this.localStream.getAudioTracks().forEach(track => {
        if (typeof mediaState.audio === 'boolean') {
          track.enabled = mediaState.audio;
          console.log(`Restored audio track enabled state to: ${mediaState.audio}`);
        }
      });
      
      
      this.localStream.getVideoTracks().forEach(track => {
        if (typeof mediaState.video === 'boolean') {
          track.enabled = mediaState.video;
          console.log(`Restored video track enabled state to: ${mediaState.video}`);
        }
      });
    }
    
    async analyzeStreamQuality() {
      if (!this.peerConnection) return { status: 'unknown', stats: null };
      
      try {
        const stats = await this.peerConnection.getStats();
        let inboundStats = null;
        let candidatePairStats = null;
        
        stats.forEach(stat => {
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            inboundStats = stat;
          } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            candidatePairStats = stat;
          }
        });
        
        if (!inboundStats || !candidatePairStats) {
          return { status: 'unknown', stats: null };
        }
        
        
        const quality = {
          
          lossRate: inboundStats.packetsLost / (inboundStats.packetsReceived + inboundStats.packetsLost),
          jitter: inboundStats.jitter,
          rtt: candidatePairStats.currentRoundTripTime * 1000,
          frameDropRate: inboundStats.framesDropped / inboundStats.framesDecoded,
          resolution: `${inboundStats.frameWidth}x${inboundStats.frameHeight}`,
          frameRate: inboundStats.framesPerSecond
        };
        
        
        let status = 'good';
        
        if (quality.lossRate > 0.05 || quality.jitter > 0.1 || quality.rtt > 300) {
          status = 'poor';
        } else if (quality.lossRate > 0.01 || quality.jitter > 0.05 || quality.rtt > 200) {
          status = 'fair';
        }
        
        return { status, stats: quality };
      } catch (error) {
        console.error('Error analyzing stream quality:', error);
        return { status: 'unknown', stats: null };
      }
    }
    
    cleanup(emitEndSignal = true) {
      console.log('Cleaning up WebRTC connection...');
      
      try {
        
        this.pendingCandidates = [];
        
        
        if (this.peerConnection && this.localStream) {
          this.localStream.getTracks().forEach(track => {
            const sender = this.peerConnection.getSenders().find(s => s.track === track);
            if (sender) {
              this.peerConnection.removeTrack(sender);
            }
          });
        }
        
        
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            track.stop();
            this.localStream.removeTrack(track);
          });
          this.localStream = null;
        }
        
        
        if (this.peerConnection) {
          this.peerConnection.onicecandidate = null;
          this.peerConnection.ontrack = null;
          this.peerConnection.onconnectionstatechange = null;
          this.peerConnection.oniceconnectionstatechange = null;
          this.peerConnection.close();
          this.peerConnection = null;
        }
        
        
        if (emitEndSignal && this.socket && this.socket.connected) {
          const roomId = [this.socket.id, this.targetUserId].sort().join('-');
          this.socket.emit('video_call_ended', { roomId });
        }
        
        console.log('WebRTC cleanup completed');
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  }
  
