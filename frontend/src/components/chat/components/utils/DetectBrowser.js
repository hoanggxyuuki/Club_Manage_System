/**
 * DetectBrowser utility
 * Detects current browser and platform information for optimizing WebRTC settings
 */

export const DetectBrowser = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  
  const isChrome = /Chrome/.test(userAgent) && !/Chromium|Edge|Edg|OPR|SamsungBrowser/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium|Edge|Edg|OPR|SamsungBrowser/.test(userAgent);
  const isEdge = /Edge|Edg/.test(userAgent);
  const isOpera = /OPR/.test(userAgent);
  const isSamsung = /SamsungBrowser/.test(userAgent);
  
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Mobile/.test(userAgent);
  const isWindows = /Win/.test(platform);
  const isMacOS = /Mac/.test(platform) && !isIOS;
  const isLinux = /Linux/.test(platform) && !isAndroid;
  
  
  let browserVersion = '0';
  
  if (isChrome) {
    const matches = userAgent.match(/Chrome\/([0-9\.]+)/);
    if (matches) browserVersion = matches[1];
  } else if (isFirefox) {
    const matches = userAgent.match(/Firefox\/([0-9\.]+)/);
    if (matches) browserVersion = matches[1];
  } else if (isSafari) {
    const matches = userAgent.match(/Version\/([0-9\.]+)/);
    if (matches) browserVersion = matches[1];
  } else if (isEdge) {
    const matches = userAgent.match(/Edge\/([\d\.]+)/) || userAgent.match(/Edg\/([\d\.]+)/);
    if (matches) browserVersion = matches[1];
  }
  
  
  let connectionType = 'unknown';
  if (navigator.connection) {
    connectionType = navigator.connection.effectiveType || 'unknown';
  }
  
  
  const hasWebRTCSupport = !!(
    window.RTCPeerConnection || 
    window.webkitRTCPeerConnection || 
    window.mozRTCPeerConnection
  );
  
  
  const capabilities = {
    h264: isChrome || isEdge || isSafari,  
    vp8: isChrome || isFirefox || isEdge,  
    vp9: isChrome || isFirefox,            
    screenSharing: !(isSafari && isIOS),   
    backgroundBlur: isChrome && parseInt(browserVersion) >= 92, 
  };
  
  return {
    browser: isChrome ? 'chrome' : 
             isFirefox ? 'firefox' : 
             isSafari ? 'safari' : 
             isEdge ? 'edge' : 
             isOpera ? 'opera' : 
             isSamsung ? 'samsung' : 
             'unknown',
    browserVersion,
    isIOS,
    isAndroid,
    isMobile,
    isDesktop: !isMobile,
    isWindows,
    isMacOS,
    isLinux,
    connectionType,
    hasWebRTCSupport,
    capabilities
  };
};