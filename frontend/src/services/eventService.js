import axios from 'axios';
import { API_URL } from '../config/constants';


export const getUpcomingEventsForPendingUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/events/upcoming`, {
      withCredentials: true
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể lấy thông tin sự kiện sắp tới'
    };
  }
};