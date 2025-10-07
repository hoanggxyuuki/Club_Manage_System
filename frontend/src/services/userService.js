import api from './api';

const API_URL = '/users'; 


export const getAllUsers = () => {
  return api.get(API_URL);
};


export const getUserById = (userId) => {
  return api.get(`${API_URL}/${userId}`);
};


export const updateUser = (userId, userData) => {
  return api.put(`${API_URL}/${userId}`, userData);
};


export const updateUserRole = (userId, role) => {
  return api.put(`${API_URL}/${userId}/role`, { role });
};


export const deleteUser = (userId) => {
  return api.delete(`${API_URL}/${userId}`);
};


export const getPendingUsers = async () => {
  try {
    console.log('Calling pending-approval API...');
    const response = await api.get(`${API_URL}/pending-approval`);
    console.log('Full API response:', response);
    
    
    if (Array.isArray(response)) {
      return response;
    }
    
    
    if (response && response.data) {
      return response.data;
    }
    
    console.error('API response format is unexpected:', response);
    return [];
  } catch (error) {
    console.error('Error in getPendingUsers:', error);
    
    if (error.status === 401) {
      console.error('Authentication error - token có thể đã hết hạn');
      
    }
    return [];
  }
};


export const getUserPendingById = (userId) => {
  return api.get(`${API_URL}/pending-approval/${userId}`);
};


export const approveUser = (userId) => {
  return api.put(`${API_URL}/approve/${userId}`);
};


export const rejectUser = (userId) => {
  return api.put(`${API_URL}/reject/${userId}`);
};


export const getUsersByApprovalStatus = async (status) => {
  try {
    console.log('Calling approval-status API with status:', status);
    const response = await api.get(`${API_URL}/approval-status${status ? `?status=${status}` : ''}`);
    console.log('Full API response from approval-status:', response);
    
    
    if (Array.isArray(response)) {
      return response;
    }
    
    
    if (response && response.data) {
      return response.data;
    }
    
    console.error('API response format is unexpected:', response);
    return [];
  } catch (error) {
    console.error('Error fetching users by approval status:', error);
    console.error('Error details:', error.message, error.status);
    return [];
  }
};


export const updateApprovalStatus = async (userId, data) => {
  try {
    const response = await api.put(`${API_URL}/approval-status/${userId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating approval status:', error.response?.data || error.message);
    throw error.response?.data || new Error('Không thể cập nhật trạng thái phê duyệt');
  }
};


export const setUserToInterview = async (userId, interviewData) => {
  try {
    const response = await api.put(`${API_URL}/interview/${userId}`, interviewData);
    return response.data;
  } catch (error) {
    console.error('Error scheduling interview:', error.response?.data || error.message);
    throw error.response?.data || new Error('Không thể lên lịch phỏng vấn');
  }
};


export const getTodayBirthdays = async () => {
  const response = await api.get(`${API_URL}/today-birthdays`);
  return response.data; 
};


export const getProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch profile');
  }
};


export const updateProfile = async (profileData) => {
  try {
    
    if (profileData.avatar instanceof File) {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (key === 'avatar') {
          formData.append(key, profileData[key], profileData[key].name);
        } else if (profileData[key] !== undefined && profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
      });
      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      
      const response = await api.put('/users/profile', profileData);
      return response.data;
    }
  } catch (error) {
    console.error('Error updating profile:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update profile');
  }
};
