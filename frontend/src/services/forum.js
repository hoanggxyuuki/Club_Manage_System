import CryptoJS from 'crypto-js';

const API_URL = import.meta.env.VITE_API_URL;
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

/**
 * Process API response and handle decryption if needed
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} - Processed response data
 */
const processResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Request failed');
    }
    
    const data = await response.json();
    
    
    if (data && data.encrypted === true && data.data) {
        return decrypt(data.data);
    }
    
    return data;
};

export const forumService = {
    getAllPosts: async ({ page = 1, limit = 10, ...otherParams } = {}) => {
        try {
            const params = {
                page,
                limit,
                ...otherParams
            };
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/forum?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            throw error;
        }
    },

    getPostById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/forum/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to fetch post:', error);
            throw error;
        }
    },

    createPost: async (formData) => {
        try {
            const response = await fetch(`${API_URL}/forum`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData 
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to create post:', error);
            throw error;
        }
    },

    updatePost: async (id, postData) => {
        try {
            const response = await fetch(`${API_URL}/forum/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(postData)
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to update post:', error);
            throw error;
        }
    },

    deletePost: async (id) => {
        try {
            const response = await fetch(`${API_URL}/forum/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to delete post:', error);
            throw error;
        }
    },

    toggleLike: async (postId) => {
        try {
            const response = await fetch(`${API_URL}/forum/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to toggle like:', error);
            throw error;
        }
    },

    addComment: async (postId, content, replyToId = null, isAnonymous = false) => {
        try {
            const response = await fetch(`${API_URL}/forum/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content, replyToId, isAnonymous })
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to add comment:', error);
            throw error;
        }
    },

    addReplyToComment: async (postId, commentId, content, isAnonymous = false) => {
        try {
            const response = await fetch(`${API_URL}/forum/${postId}/comment/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content, isAnonymous })
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to add reply:', error);
            throw error;
        }
    },

    addPoll: async (postId, pollData) => {
        try {
            const response = await fetch(`${API_URL}/forum/${postId}/poll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(pollData)
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to create poll:', error);
            throw error;
        }
    },

    voteOnPoll: async (postId, pollId, optionId) => {
        try {
            const response = await fetch(`${API_URL}/forum/${postId}/poll/${pollId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ optionId })
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to vote on poll:', error);
            throw error;
        }
    },

    searchPosts: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/forum/search?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to search posts:', error);
            throw error;
        }
    },

    getSearchSuggestions: async (query) => {
        try {
            const response = await fetch(`${API_URL}/forum/suggestions?query=${encodeURIComponent(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to get search suggestions:', error);
            throw error;
        }
    },
    translateText: async (text, targetLang) => {
        try {
            const response = await fetch(`${API_URL}/forum/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    text, 
                    targetLang 
                })
            });
            return processResponse(response);
        } catch (error) {
            console.error('Failed to translate text:', error);
            throw error;
        }
    },
};

export default forumService;