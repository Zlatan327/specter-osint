'use client';

import { useState, useCallback, useRef } from 'react';
import { useSSE } from './useSSE';

const INITIAL_MODULE_STATES = {
  'phone-lookup': { name: 'Phone Prefix Lookup', icon: '📱', status: 'pending', duration: null, resultCount: 0, data: null },
  'caller-id': { name: 'Caller ID Check', icon: '📞', status: 'pending', duration: null, resultCount: 0, data: null },
  'financial-trail': { name: 'Financial Trail Lookup', icon: '🏦', status: 'pending', duration: null, resultCount: 0, data: null },
  'username-checker': { name: 'Username Check', icon: '🔍', status: 'pending', duration: null, resultCount: 0, data: null },
  'email-lookup': { name: 'Email Records Lookup', icon: '📧', status: 'pending', duration: null, resultCount: 0, data: null },
  'breach-checker': { name: 'Data Breach Check', icon: '🔓', status: 'pending', duration: null, resultCount: 0, data: null },
  'github-profiler': { name: 'GitHub Profile Scan', icon: '🐙', status: 'pending', duration: null, resultCount: 0, data: null },
  'domain-intel': { name: 'Domain Intel (RDAP/DNS)', icon: '🌐', status: 'pending', duration: null, resultCount: 0, data: null },
  'google-dorker': { name: 'Google Dorking Engine', icon: '🔎', status: 'pending', duration: null, resultCount: 0, data: null },
};

/**
 * Custom hook for managing investigation state.
 * Connects to the SSE endpoint and handles module-by-module updates.
 */
export function useInvestigation() {
  const [state, setState] = useState('idle'); // idle | connecting | running | complete | error
  const [modules, setModules] = useState(INITIAL_MODULE_STATES);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const { connect, disconnect, isConnected } = useSSE();
  const timeRef = useRef(null);

  const handleEvent = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case 'status':
        setStatusMessage(data.message || '');
        break;

      case 'module_complete':
        let resultCount = 0;
        if (data.status === 'success' && data.data) {
          if (Array.isArray(data.data.found)) resultCount = data.data.found.length;
          else if (Array.isArray(data.data.emailsFound)) resultCount = data.data.emailsFound.length;
          else if (Array.isArray(data.data.mxRecords)) resultCount = data.data.mxRecords.length;
          else if (Array.isArray(data.data.breaches)) resultCount = data.data.breaches.length;
          else if (Array.isArray(data.data.dorks)) resultCount = data.data.dorks.length;
          else if (Array.isArray(data.data.fintechLinks)) resultCount = data.data.fintechLinks.length;
          else if (data.data.whatsapp?.registered) resultCount = 1;
        }

        setModules(prev => {
          if (!prev[data.module]) return prev;
          return {
            ...prev,
            [data.module]: {
              ...prev[data.module],
              status: data.status === 'success' ? 'complete' : data.status === 'skipped' ? 'disabled' : 'error',
              duration: data.duration || null,
              resultCount,
              data: data.data || null,
              error: data.error || null,
            }
          };
        });
        break;

      case 'complete':
        setProfile(data);
        setState('complete');
        setStatusMessage('Investigation complete.');
        if (timeRef.current) {
          setTotalDuration(Date.now() - timeRef.current);
        }
        break;

      case 'error':
        setError(data.message || 'Investigation failed');
        setState('error');
        setStatusMessage('Error encountered.');
        break;
    }
  }, []);

  const startInvestigation = useCallback(async (query, type) => {
    setState('connecting');
    setError(null);
    setModules(INITIAL_MODULE_STATES);
    setProfile(null);
    setTotalDuration(null);
    setStatusMessage('Initiating connection...');

    const now = Date.now();
    setStartTime(now);
    timeRef.current = now;

    setState('running');

    await connect('/api/investigate', {
      body: { query, type },
      onEvent: handleEvent,
      onError: (err) => {
        setError(err.message);
        setState('error');
      },
      onComplete: () => {
        setState(prev => {
          if (prev === 'error') return prev;
          return 'complete';
        });
        if (timeRef.current) {
          setTotalDuration(Date.now() - timeRef.current);
        }
      }
    });
  }, [connect, handleEvent]);

  const reset = useCallback(() => {
    disconnect();
    setState('idle');
    setModules(INITIAL_MODULE_STATES);
    setProfile(null);
    setError(null);
    setStartTime(null);
    setTotalDuration(null);
    setStatusMessage('');
  }, [disconnect]);

  return {
    state,
    modules,
    profile,
    error,
    startTime,
    totalDuration,
    statusMessage,
    isConnected,
    startInvestigation,
    reset,
  };
}
