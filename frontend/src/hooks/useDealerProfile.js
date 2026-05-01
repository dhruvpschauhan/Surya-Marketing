import { useState, useEffect } from 'react';
import { getDealerProfile } from '../api/client';

/**
 * Hook to fetch and cache dealer profile data.
 */
export function useDealerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await getDealerProfile();
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to load dealer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  return { profile, loading, refetch: fetchProfile };
}
