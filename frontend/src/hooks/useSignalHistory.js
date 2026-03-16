import { useState, useEffect } from 'react';
import axios from 'axios';

export function useSignalHistory(deviceId = 'WATCH-001', pollInterval = 5000) {
  const [signals, setSignals]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/sos/signals?limit=20');
      setSignals(res.data);
    } catch (err) {
      console.error('Failed to fetch signal history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, pollInterval);
    return () => clearInterval(interval);
  }, [deviceId, pollInterval]);

  return { signals, loading, refetch: fetchHistory };
}
