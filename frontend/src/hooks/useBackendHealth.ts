import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useBackendHealth() {
  const [isBackendUp, setIsBackendUp] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        setIsBackendUp(true);
      } else {
        setIsBackendUp(false);
      }
    } catch {
      setIsBackendUp(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check immediately
    checkBackendHealth();

    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isBackendUp, loading };
}