import api from './api';


export const getAllDemoNotifications = async () => {
  try {
    const response = await api.get('/demo-notifications/admin/all');
    return response;
  } catch (error) {
    console.error('Error fetching all demo notifications:', error);
    return { success: false, message: error.message || 'Không thể tải danh sách thông báo', data: [] };
  }
};


export const getPendingUserNotifications = async () => {
  try {
    const response = await api.get('/demo-notifications/public');
    return response;
  } catch (error) {
    console.error('Error fetching public demo notifications:', error);
    return { success: false, message: error.message, data: [] };
  }
};


export const getDemoNotifications = async () => {
  try {
    const response = await api.get('/demo-notifications');
    return response;
  } catch (error) {
    console.error('Error fetching demo notifications:', error);
    return { success: false, message: error.message, data: [] };
  }
};


export const getDemoNotificationById = async (id) => {
  try {
    const response = await api.get(`/demo-notifications/admin/${id}`);
    return response;
  } catch (error) {
    console.error(`Error fetching demo notification with id ${id}:`, error);
    return { success: false, message: error.message, data: null };
  }
};


export const createDemoNotification = async (data) => {
  try {
    const response = await api.post('/demo-notifications/admin/create', data);
    return response;
  } catch (error) {
    console.error('Error creating demo notification:', error);
    return { success: false, message: error.message };
  }
};


export const updateDemoNotification = async (id, data) => {
  try {
    const response = await api.put(`/demo-notifications/admin/${id}`, data);
    return response;
  } catch (error) {
    console.error(`Error updating demo notification with id ${id}:`, error);
    return { success: false, message: error.message };
  }
};


export const deleteDemoNotification = async (id) => {
  try {
    const response = await api.delete(`/demo-notifications/admin/${id}`);
    return response;
  } catch (error) {
    console.error(`Error deleting demo notification with id ${id}:`, error);
    return { success: false, message: error.message };
  }
};


export const markDemoNotificationAsRead = async (id) => {
  try {
    const response = await api.patch(`/demo-notifications/${id}/read`);
    return response;
  } catch (error) {
    console.error(`Error marking demo notification as read:`, error);
    return { success: false, message: error.message };
  }
};