import { useState, useEffect } from 'react';

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    
    checkIfMobile();

    
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('orientationchange', checkIfMobile);

    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('orientationchange', checkIfMobile);
    };
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
