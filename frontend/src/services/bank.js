import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export const setupBankAccount = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/bank/setup`, data,{
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to setup bank account' };
  }
};

export const resetBankAccount = async (accountNo) => {
  try {
    const response = await axios.post(`${API_URL}/bank/reset/${accountNo}`,{
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to reset bank account' };
  }
};

export const getTransactionHistory = async (accountNo) => {
  try {
    const response = await axios.get(`${API_URL}/bank/history/${accountNo}`,{
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch transaction history' };
  }
};

export const getMemberPayments = async (memberId) => {
  try {
    const url =`${API_URL}/bank/payments/${memberId}`;
    const response = await axios.get(url,{
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch payment history' };
  }
};
export const getMemberPaymentsAdmin = async () => {
    try {
      const url =`${API_URL}/bank/payments/`;
      const response = await axios.get(url,{
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch payment history' };
    }
  };
export const getAccountNo = async () => {
    try {
        const response = await axios.get(`${API_URL}/bank/getaccountno`,{
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response.data;
    }
    catch (error) {
        throw error.response?.data || { success: false, message: 'Failed to fetch account number' };
    }
    };