import { isTokenExpired } from '../utils/auth';
import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL;
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default32byteslongkeythisisexample';


class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

/**
 * Decrypts data received from the server
 * @param {string} encryptedData - Data in format "iv:encryptedContent"
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
 * Process response and handle decryption if needed
 * @param {Response} response - Fetch response
 * @returns {Promise<any>} - Processed data
 */
const processResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.message || 'API request failed', response.status);
    }
    
    const data = await response.json();
    
    
    if (data && data.encrypted === true && data.data) {
        return decrypt(data.data);
    }
    
    return data;
};

const getAuthHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired()) {
        throw new ApiError('Token expired', 401);
    }

    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

const handleApiError = (error) => {
    if (error instanceof ApiError && error.status === 401) {
        
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    throw error;
};

export const getAllUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const getUserById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const createUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateUser = async (id, userData) => {
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};


export const fetchMembers = async () => {
    try {
        const response = await fetch(`${API_URL}/members`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const getMemberList = async () => {
    try {
        const response = await fetch(`${API_URL}/members`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const fetchMemberById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/members/${id}`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const createMember = async (memberData) => {
    try {
        const response = await fetch(`${API_URL}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(memberData),
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateMember = async (id, memberData) => {
    try {
        const response = await fetch(`${API_URL}/members/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(memberData),
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const deleteMember = async (id) => {
    try {
        const response = await fetch(`${API_URL}/members/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const getPendingApprovalUsers = async () => {
    try {
        const response = await fetch(`${API_URL}/users/pending-approval`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const approveUser = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/users/approve-user/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const rejectUser = async (userId) => {
    try {
        const response = await fetch(`${API_URL}/users/reject-user/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const getProfile = async () => {
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: getAuthHeaders()
        });
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

export const updateProfile = async (data) => {
    try {
        const formData = new FormData();
        
        if (data.avatar instanceof File) {
            formData.append('avatar', data.avatar);
        }
        
        Object.keys(data).forEach(key => {
            if (key !== 'avatar' || typeof data[key] === 'string') {
                formData.append(key, data[key]);
            }
        });

        const response = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(false),
            body: formData
        });
        
        return processResponse(response);
    } catch (error) {
        return handleApiError(error);
    }
};

const _request = async (method, endpoint, body = null, options = {}) => {
    try {
        const config = {
            method,
            headers: getAuthHeaders(body ? !(body instanceof FormData) : true),
            ...options.headers, 
        };

        if (body) {
            config.body = body instanceof FormData ? body : JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, config); 
        return processResponse(response); 
    } catch (error) {
        
        return handleApiError(error);
    }
};


const apiClient = {
    get: (endpoint, options = {}) => _request('GET', endpoint, null, options),
    post: (endpoint, body, options = {}) => _request('POST', endpoint, body, options),
    put: (endpoint, body, options = {}) => _request('PUT', endpoint, body, options),
    delete: (endpoint, options = {}) => _request('DELETE', endpoint, null, options),
};

// Admin API methods
export const adminApi = {
    // Lấy toàn bộ dữ liệu
    getAllData: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/all-data`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Lấy dữ liệu bảng với phân trang và tìm kiếm
    getTableData: async (tableName, options = {}) => {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.page) queryParams.append('page', options.page);
            if (options.limit) queryParams.append('limit', options.limit);
            if (options.search) queryParams.append('search', options.search);
            if (options.sortBy) queryParams.append('sortBy', options.sortBy);
            if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
            
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    queryParams.append(`filters[${key}]`, value);
                });
            }
            
            const url = `/admin/table/${tableName}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(`${API_URL}${url}`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Lấy chi tiết bản ghi
    getRecordDetail: async (tableName, id) => {
        try {
            const response = await fetch(`${API_URL}/admin/table/${tableName}/${id}`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Tạo bản ghi mới
    createRecord: async (tableName, data) => {
        try {
            const response = await fetch(`${API_URL}/admin/table/${tableName}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Cập nhật bản ghi
    updateRecord: async (tableName, id, data) => {
        try {
            const response = await fetch(`${API_URL}/admin/table/${tableName}/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Xóa bản ghi
    deleteRecord: async (tableName, id) => {
        try {
            const response = await fetch(`${API_URL}/admin/table/${tableName}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Lấy thống kê nâng cao
    getAdvancedStats: async (options = {}) => {
        try {
            const queryParams = new URLSearchParams();
            
            if (options.tableName) queryParams.append('tableName', options.tableName);
            if (options.timeRange) queryParams.append('timeRange', options.timeRange);
            
            const url = `/admin/advanced-stats${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await fetch(`${API_URL}${url}`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Legacy methods for backward compatibility
    exportData: async (tableName) => {
        try {
            const response = await fetch(`${API_URL}/admin/export/${tableName}`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    getSystemStats: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/stats`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    // Performance monitoring methods
    getPerformanceMetrics: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/performance-metrics`, {
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    clearCache: async (pattern = null) => {
        try {
            const response = await fetch(`${API_URL}/admin/clear-cache`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ pattern })
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    optimizeDatabase: async () => {
        try {
            const response = await fetch(`${API_URL}/admin/optimize-database`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
    
    analyzeQuery: async (query, modelName) => {
        try {
            const response = await fetch(`${API_URL}/admin/analyze-query`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ query, modelName })
            });
            return processResponse(response);
        } catch (error) {
            return handleApiError(error);
        }
    },
};

export default apiClient;

// Export api for compatibility
export const api = apiClient;