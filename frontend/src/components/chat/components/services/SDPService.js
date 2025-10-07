'use strict';

/**
 * Service for handling SDP (Session Description Protocol)
 * Resolves WebRTC extension mapping issues and ensures consistent IDs 
 * and optimizes media parameters for better performance
 */
export default class SDPService {
    constructor() {
      this.extensionIds = new Map();
    }
    
    /**
     * Process offer before sending
     * - Fix extension mappings
     * - Optimize video codec preferences
     * - Set bandwidth limits
     */
    async processOffer(offer) {
      
      this.extensionIds.clear();
      
      
      const lines = offer.sdp.split('\n');
      const processedLines = [];

      let currentMedia = null;
      
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        
        if (line.startsWith('m=')) {
          currentMedia = line.split(' ')[0].split('=')[1];
        }

        
        if (line.startsWith('a=extmap:')) {
          try {
            const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
            if (id && uri) {
              this.extensionIds.set(uri, id);
            }
          } catch (error) {
            console.warn('Failed to parse extension:', line, error);
          }
        }

        
        if (currentMedia === 'video' && line.startsWith('c=')) {
          processedLines.push(line);
          
          processedLines.push('b=AS:1500'); 
          processedLines.push('b=TIAS:1500000');
          continue;
        }
        
        
        if (currentMedia === 'video' && line.startsWith('a=rtpmap:')) {
          processedLines.push(line);
          
          
          if (line.includes('VP8')) {
            
            const payloadType = line.split(':')[1].split(' ')[0];
            const fmtpLine = `a=fmtp:${payloadType} x-google-min-bitrate=400;x-google-max-bitrate=1500;x-google-start-bitrate=800`;
            processedLines.push(fmtpLine);
          } else if (line.includes('H264')) {
            
            const payloadType = line.split(':')[1].split(' ')[0];
            const fmtpLine = `a=fmtp:${payloadType} level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f`;
            processedLines.push(fmtpLine);
          }
          continue;
        }
        
        processedLines.push(line);
      }

      
      offer.sdp = processedLines.join('\n');
      return offer;
    }
    
    /**
     * Process received offer
     * - Fix extension mappings
     * - Ensure codec compatibility
     */
    processReceivedOffer(sdp) {
      
      this.extensionIds.clear();
      
      
      const lines = sdp.split('\n');
      const extensionUris = new Set();
      const extensionIds = new Set();
      
      
      lines.forEach(line => {
        if (line.startsWith('a=extmap:')) {
          try {
            const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
            if (id && uri) {
              this.extensionIds.set(uri, id);
              extensionUris.add(uri);
              extensionIds.add(id);
            }
          } catch (error) {
            console.warn('Failed to parse extension:', line, error);
          }
        }
      });
      
      return sdp;
    }
    
    /**
     * Process answer before sending
     * - Match extension IDs with the local offer
     * - Optimize media parameters based on negotiation
     */
    async processAnswer(answer, localOffer) {
      if (!localOffer) return answer;
      
      
      const offerExtensions = new Map();
      localOffer.sdp.split('\n').forEach(line => {
        if (line.startsWith('a=extmap:')) {
          try {
            const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
            if (id && uri) {
              offerExtensions.set(uri, id);
            }
          } catch (error) {
            console.warn('Failed to parse extension from offer:', line, error);
          }
        }
      });
      
      
      const answerLines = answer.sdp.split('\n');
      const processedLines = [];
      
      let currentMedia = null;
      
      for (let i = 0; i < answerLines.length; i++) {
        const line = answerLines[i];

        
        if (line.startsWith('m=')) {
          currentMedia = line.split(' ')[0].split('=')[1];
        }
        
        
        if (line.startsWith('a=extmap:')) {
          const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
          if (id && uri && offerExtensions.has(uri)) {
            
            const originalId = offerExtensions.get(uri);
            processedLines.push(`a=extmap:${originalId} ${uri}`);
            continue;
          }
        }
        
        
        if (currentMedia === 'video' && line.startsWith('c=')) {
          processedLines.push(line);
          processedLines.push('b=AS:1000'); 
          processedLines.push('b=TIAS:1000000');
          continue;
        }
        
        processedLines.push(line);
      }
      
      answer.sdp = processedLines.join('\n');
      return answer;
    }
    
    /**
     * Process received answer
     * - Fix extension mappings
     * - Ensure compatibility with local offer
     */
    processReceivedAnswer(sdp, localOffer) {
      if (!localOffer) return sdp;
      
      
      const offerExtensions = new Map();
      localOffer.sdp.split('\n').forEach(line => {
        if (line.startsWith('a=extmap:')) {
          try {
            const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
            if (id && uri) {
              offerExtensions.set(uri, id);
            }
          } catch (error) {
            console.warn('Failed to parse extension from local offer:', line, error);
          }
        }
      });
      
      
      const answerLines = sdp.split('\n');
      const processedLines = [];
      
      for (let i = 0; i < answerLines.length; i++) {
        const line = answerLines[i];
        
        if (line.startsWith('a=extmap:')) {
          const [, id, uri] = line.match(/a=extmap:(\d+)(?:\/[\w\d]+)?\s+(.+)/) || [];
          if (id && uri && offerExtensions.has(uri)) {
            
            const originalId = offerExtensions.get(uri);
            processedLines.push(`a=extmap:${originalId} ${uri}`);
            continue;
          }
        }
        
        processedLines.push(line);
      }
      
      return processedLines.join('\n');
    }
    
    /**
     * Optimize SDP for mobile devices
     * - Lower bitrates
     * - Prefer more efficient codecs
     */
    optimizeForMobile(sdp) {
      const lines = sdp.split('\n');
      const processedLines = [];
      let currentMedia = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('m=')) {
          currentMedia = line.split(' ')[0].split('=')[1];
        }
        
        if (currentMedia === 'video' && line.startsWith('c=')) {
          processedLines.push(line);
          processedLines.push('b=AS:500'); 
          processedLines.push('b=TIAS:500000');
          continue;
        }
        
        if (currentMedia === 'video' && line.startsWith('a=rtpmap:')) {
          
          if (line.includes('VP8')) {
            const payloadType = line.split(':')[1].split(' ')[0];
            processedLines.push(line);
            processedLines.push(`a=fmtp:${payloadType} x-google-min-bitrate=250;x-google-max-bitrate=500;x-google-start-bitrate=350`);
            continue;
          }
        }
        
        processedLines.push(line);
      }
      
      return processedLines.join('\n');
    }
    
    /**
     * Fix known compatibility issues with specific browsers
     */
    fixBrowserCompatibility(sdp, browser) {
      if (browser === 'safari') {
        
        sdp = sdp.replace(/a=rtcp-fb:*\s*nack\s*pli/g, '');
      } else if (browser === 'firefox') {
        
        
      }
      
      return sdp;
    }
  }