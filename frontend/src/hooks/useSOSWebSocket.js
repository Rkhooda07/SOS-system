import { useState, useEffect, useRef, useCallback } from 'react';

export function useSOSWebSocket() {
  const [latestSignal, setLatestSignal]     = useState(null);
  const [isConnected, setIsConnected]       = useState(false);
  const [newAlert, setNewAlert]             = useState(false);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    // Determine the WS protocol based on current connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/sos/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'sos_signal') {
        setLatestSignal(data);
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 5000); // clear alert after 5s
      } else if (data.event === 'signal_updated') {
        if (latestSignal && latestSignal.id === data.id && data.status !== 'active') {
          setNewAlert(false);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.warn('⚠️ WebSocket disconnected — retrying in 5s...');
      setTimeout(connect, 5000);  // auto-reconnect
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { latestSignal, isConnected, newAlert };
}
