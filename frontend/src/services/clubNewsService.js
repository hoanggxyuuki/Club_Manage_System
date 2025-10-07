import api from './api';


export const getAllClubNews = async () => {
  try {
    const response = await api.get('/club-news/admin/all');
    return response;
  } catch (error) {
    console.error('Error fetching all club news:', error);
    
    return { success: false, message: error.message || 'Không thể tải dữ liệu tin tức', data: [] };
  }
};


export const getPendingUserClubNews = async () => {
  try {
    const response = await api.get('/club-news/public');
    return response;
  } catch (error) {
    console.error('Error fetching public club news:', error);
    return { success: false, message: error.message, data: [] };
  }
};


export const getMemberClubNews = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/club-news/member?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error fetching member club news:', error);
    return { success: false, message: error.message, data: [] };
  }
};


export const getClubNewsById = async (id) => {
  try {
    const response = await api.get(`/club-news/admin/${id}`);
    return response;
  } catch (error) {
    console.error(`Error fetching club news with id ${id}:`, error);
    return { success: false, message: error.message, data: null };
  }
};


export const createClubNews = async (formData) => {
  try {
    const response = await api.post('/club-news/admin/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error('Error creating club news:', error);
    return { success: false, message: error.message };
  }
};


export const updateClubNews = async (id, formData) => {
  try {
    const response = await api.put(`/club-news/admin/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating club news with id ${id}:`, error);
    return { success: false, message: error.message };
  }
};


export const deleteClubNews = async (id) => {
  try {
    const response = await api.delete(`/club-news/admin/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting club news with id ${id}:`, error);
    return { success: false, message: error.message };
  }
};