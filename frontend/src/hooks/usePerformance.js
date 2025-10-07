import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Hook để debounce function calls
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Hook để throttle function calls
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  const lastCallTimer = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      callback(...args);
      lastCall.current = now;
    } else {
      if (lastCallTimer.current) {
        clearTimeout(lastCallTimer.current);
      }
      lastCallTimer.current = setTimeout(() => {
        callback(...args);
        lastCall.current = Date.now();
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (lastCallTimer.current) {
        clearTimeout(lastCallTimer.current);
      }
    };
  }, []);

  return throttledCallback;
};

// Hook để lazy load images
export const useLazyImage = (src, placeholder = '/placeholder.jpg') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };
    
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
  }, [src]);

  return { imageSrc, loading, error };
};

// Hook để optimize expensive calculations
export const useMemoizedValue = (value, deps) => {
  return useMemo(() => value, deps);
};

// Hook để track component render performance
export const useRenderTracker = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times. Time since last render: ${timeSinceLastRender}ms`);
    }
    
    lastRenderTime.current = currentTime;
  });

  return renderCount.current;
};

// Hook để optimize list rendering
export const useVirtualizedList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop)
  };
};

// Hook để optimize API calls with caching
export const useCachedAPI = (apiCall, deps = [], cacheTime = 5 * 60 * 1000) => {
  const cache = useRef(new Map());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const cacheKey = JSON.stringify(deps);
    const cached = cache.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      cache.current.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiCall, deps, cacheTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook để optimize form inputs
export const useOptimizedInput = (initialValue = '', debounceMs = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedSetValue = useDebounce(setDebouncedValue, debounceMs);

  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    debouncedSetValue(newValue);
  }, [debouncedSetValue]);

  return {
    value,
    debouncedValue,
    onChange: handleChange,
    setValue
  };
}; 