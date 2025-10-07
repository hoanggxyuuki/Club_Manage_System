import { useState, useEffect } from 'react';

export const useUrlPreview = (url) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_PROXY_API_URL}api/url-preview?url=${encodeURIComponent(url)}&_bypassSW=true&_nocache=${Date.now()}`
        );
        const data = await response.json();
        
        if (response.ok) {
          setPreview({
            title: data.title || '',
            description: data.description || '',
            image: data.image || '',
            domain: new URL(url).hostname
          });
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }

    return () => {
      setPreview(null);
      setLoading(true);
      setError(null);
    };
  }, [url]);

  return { preview, loading, error };
};
