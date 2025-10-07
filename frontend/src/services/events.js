import axios from 'axios';
import CryptoJS from 'crypto-js';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample';

/**
 * Decrypt data received from the server
 * @param {string} encryptedData - Data in format "iv:encryptedContent"
 * @returns {Object|string} Decrypted data
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

const api = axios.create({ baseURL: baseUrl });

api.interceptors.response.use(response => {
  if (response.data && response.data.encrypted === true && response.data.data) {
    response.data = decrypt(response.data.data);
  }
  return response;
}, error => {
  return Promise.reject(error);
});
export const eventService = {
  getCurrentMonthEvents: async () => {
    const response = await api.get(`/events/month/current`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    return response.data;
  },

  getEvents: async (status = 'active') => {
    const response = await api.get(`/events`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { status }
      }
    );
    return response.data;
  },

  getEventById: async (eventId) => {
    const response = await api.get(`${baseUrl}/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post(`/events`, eventData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    return response.data;
  },

  updateEvent: async (eventId, eventData) => {
    const response = await axios.put(`${baseUrl}/events/${eventId}`, eventData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    return response.data;
  },

  deleteEvent: async (eventId) => {
    const response = await axios.delete(`${baseUrl}/events/${eventId}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    return response.data;
  },

  joinEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/join`, null,
       {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  updateParticipantStatus: async (eventId, status) => {
    const response = await axios.put(`${baseUrl}/events/${eventId}/participants`,
      { status },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    return response.data;
  },

  verifyAttendance: async (qrCode) => {
    try {
      const response = await api.post(`/events/verify-attendance`,
        { qrCode },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.redirect) {
        window.location.href = response.data.redirect;
        return null;
      }
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền điểm danh cho sự kiện này');
      }
      throw error;
    }
  },

  refreshQRCode: async (eventId) => {
    const response = await api.post(`/events/${eventId}/refresh-qr`, null,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    return response.data;
  },

  parseQRCode: (qrCode) => {
    try {
      
      if (qrCode.includes('/attendance/')) {
        const parts = qrCode.split('/attendance/')[1].split('/');
        if (parts.length === 2) {
          return { eventId: parts[0], code: parts[1] };
        }
      }
      
      if (qrCode.includes('/')) {
        const [eventId, code] = qrCode.split('/');
        if (eventId && code) {
          return { eventId, code };
        }
      }
      
      return { code: qrCode };
    } catch (error) {
      console.error('QR parse error:', error);
      throw new Error('Invalid QR code format');
    }
  },

  getAttendanceUrl: (eventId, code) => {
    return `${baseUrl}/events/attendance/${eventId}/${code}`;
  },

  verifyAttendanceAfterLogin: async (eventId, code, ip) => {
    try {
      const qrCode = `${eventId}/${code}`;
      const response = await api.post(`/events/verify-attendance`,
        { qrCode, redirectedFromLogin: true, clientIp: ip },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Bạn không có quyền điểm danh cho sự kiện này');
      }
      throw error;
    }
  },

  processUrlQRCode: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const code = urlParams.get('code');
    const ip = urlParams.get('ip');
    
    if (eventId && code) {
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      return { eventId, code, ip };
    }
    return null;
  },
};

export default eventService;