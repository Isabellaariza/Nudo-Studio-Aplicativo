import { useState, useEffect } from 'react';

export function useMediaQuery() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsDesktop(width > 1024);
      setIsTablet(width >= 768 && width <= 1024);
      setIsMobile(width < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isDesktop, isTablet, isMobile };
}
