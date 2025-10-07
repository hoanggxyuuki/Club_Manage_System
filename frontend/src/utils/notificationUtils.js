import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample';

/**
 * Decrypts data received from the server
 * @param {string} encryptedData - Encrypted data string in format "iv:encryptedContent"
 * @returns {Object|string} - Decrypted data
 */
const decrypt = (encryptedData) => {
  try {
    const textParts = encryptedData.split(':');
    const iv = CryptoJS.enc.Hex.parse(textParts[0]);
    const encryptedContent = CryptoJS.enc.Hex.parse(textParts[1]);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encryptedContent },
      CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY),
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );
    
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Process API response and handle decryption if needed
 * @param {Response} response - Fetch API response
 * @returns {Promise<any>} - Processed response data
 */
const processResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const data = await response.json();
  
  if (data && data.encrypted === true && data.data) {
    return decrypt(data.data);
  }
  
  return data;
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const swPath = `${window.location.origin}/service-worker.js`;
      
      
      const registration = await navigator.serviceWorker.register(swPath);
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const subscribeToPushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const response = await fetch(`${API_URL}/push/vapid-public-key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await processResponse(response);
    const vapidPublicKey = data.vapidPublicKey;
    
    if (!vapidPublicKey) {
      throw new Error('No VAPID public key received from server');
    }
    
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
    

    const subscriptionData = {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('auth'))))
      }
    };
    
    const jsonString = JSON.stringify(subscriptionData);

    const subscribeResponse = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: jsonString
    });
    
    const result = await processResponse(subscribeResponse);
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

export const unsubscribeFromPushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      const response = await fetch(`${API_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      await processResponse(response);
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

export const arePushNotificationsSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  return Notification.permission;
};