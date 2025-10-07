import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useMultiUrlPreview = (content) => {
  const [previews, setPreviews] = useState([]);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState(null);
  const [loading, setLoading] = useState({});
  const [hiddenPreviews, setHiddenPreviews] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [globalPreviewEnabled, setGlobalPreviewEnabled] = useState(true);

  const extractUrls = useCallback(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content?.match(urlRegex) || [];
    return [...new Set(urls)].filter(url => !hiddenPreviews.includes(url));
  }, [content, hiddenPreviews]);
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/url-preview/settings`,
          { headers: getAuthHeaders() }
        );
        if (response.data) {
          setGlobalPreviewEnabled(response.data.globalPreviewEnabled);
          setHiddenPreviews(response.data.hiddenPreviews.map(p => p.url));
        }
      } catch (error) {
        console.error('Failed to load preview settings:', error);
      }
    };

    loadSettings();
  }, []);

  
  useEffect(() => {
    if (!globalPreviewEnabled) {
      setPreviews([]);
      setSelectedPreviewUrl(null);
      setInitialized(false);
      return;
    }

    const uniqueUrls = extractUrls();
    
    if (uniqueUrls.length === 0) {
      setPreviews([]);
      setSelectedPreviewUrl(null);
      setInitialized(false);
      return;
    }
    
    if (!selectedPreviewUrl && uniqueUrls.length > 0 && !initialized) {
      setSelectedPreviewUrl(uniqueUrls[0]);
      setInitialized(true);
    }
  }, [content, hiddenPreviews, selectedPreviewUrl, extractUrls, initialized, globalPreviewEnabled]);


  useEffect(() => {
    if (!globalPreviewEnabled) return;

    const uniqueUrls = extractUrls();
    if (uniqueUrls.length === 0) return;
    
    const fetchPreviews = async () => {
      const newPreviews = [];

      for (const url of uniqueUrls) {
        try {
          const isInsecureProtocol = url.startsWith('http://');
          if (isInsecureProtocol) {
            newPreviews.push({
              url,
              preview: {
                warning: true,
                type: 'protocol',
                message: 'Website không sử dụng HTTPS , hãy cẩn thận khi truy cập',
                siteName: new URL(url).hostname
              }
            });
            continue; 
          }
          setLoading(prev => ({ ...prev, [url]: true }));
          
          
          const checkResponse = await axios.get(
            `${import.meta.env.VITE_PROXY_API_URL}api/url-preview/check?url=${encodeURIComponent(url)}`,
            { headers: getAuthHeaders() }
          );

          
          if (!checkResponse.data.ok) {
            const parsedUrl = new URL(url);
            newPreviews.push({
              url,
              preview: {
                warning: true,
                type: checkResponse.data.type,
                message: checkResponse.data.message,
                siteName: parsedUrl.hostname,
                title: url,
                hostname: parsedUrl.hostname
              }
            });
            continue;
          }

          
          const response = await axios.get(
            `${import.meta.env.VITE_PROXY_API_URL}api/url-preview?url=${encodeURIComponent(url)}&_bypassSW=true&_nocache=${Date.now()}`,
            { headers: getAuthHeaders() }
          );
         
          if (response.data.hidden) {
            continue;
          }

          
          if (response.data.warning) {
            newPreviews.push({
              url,
              preview: {
                warning: true,
                type: response.data.type || 'security',
                message: response.data.message || 'Warning: This URL may not be safe',
                siteName: new URL(url).hostname,
                title: response.data.title || url,
                hostname: new URL(url).hostname
              }
            });
          } else {
            newPreviews.push({
              url,
              preview: {
                ...response.data,
                siteName: response.data.siteName || new URL(url).hostname
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch preview for ${url}:`, error);
          
          
          if (error.response?.status === 403) {
            const parsedUrl = new URL(url);
            newPreviews.push({
              url,
              preview: {
                warning: true,
                type: error.response.data.type,
                message: error.response.data.message,
                siteName: parsedUrl.hostname,
                title: url,
                hostname: parsedUrl.hostname
              }
            });
          } else {
            
            newPreviews.push({
              url,
              preview: {
                warning: true,
                type: 'error',
                message: error.response?.data?.message || 'Failed to generate preview',
                siteName: new URL(url).hostname,
                title: url,
                hostname: new URL(url).hostname
              }
            });
          }
        } finally {
          setLoading(prev => ({ ...prev, [url]: false }));
        }
      }

      setPreviews(newPreviews);
    };

    fetchPreviews();
  }, [content, hiddenPreviews, extractUrls, globalPreviewEnabled]);

  const selectPreview = useCallback((url) => {
    setSelectedPreviewUrl(url);
  }, []);

  const removePreview = useCallback(async (url) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_PROXY_API_URL}api/url-preview/hide-preview`,
        { url },
        { headers: getAuthHeaders() }
      );
      setHiddenPreviews(prev => [...prev, url]);
      if (selectedPreviewUrl === url) {
        const uniqueUrls = extractUrls().filter(u => u !== url);
        setSelectedPreviewUrl(uniqueUrls[0] || null);
      }
    } catch (error) {
      console.error('Failed to hide preview:', error);
    }
  }, [selectedPreviewUrl, extractUrls]);

  const toggleGlobalPreview = useCallback(async (enabled) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_PROXY_API_URL}api/url-preview/settings`,
        { globalPreviewEnabled: enabled },
        { headers: getAuthHeaders() }
      );
      setGlobalPreviewEnabled(enabled);
    } catch (error) {
      console.error('Failed to update preview settings:', error);
    }
  }, []);

  return {
    previews,
    selectedPreviewUrl,
    selectPreview,
    removePreview,
    loading,
    hiddenPreviews,
    globalPreviewEnabled,
    toggleGlobalPreview
  };
};
