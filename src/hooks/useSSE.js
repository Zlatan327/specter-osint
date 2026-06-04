'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Generic SSE connection hook using fetch + ReadableStream.
 * Supports POST-based SSE endpoints.
 */
export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const readerRef = useRef(null);

  const connect = useCallback(async (url, { body, method = 'POST', onEvent, onError, onComplete } = {}) => {
    // Cleanup any existing connection
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsConnected(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream complete
          setIsConnected(false);
          onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEventType = 'message';
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim();
          } else if (line === '') {
            // Empty line = end of event
            if (currentData) {
              try {
                const parsed = JSON.parse(currentData);
                const event = { type: currentEventType, data: parsed };
                setLastEvent(event);
                onEvent?.(event);
              } catch {
                // Non-JSON data
                const event = { type: currentEventType, data: currentData };
                setLastEvent(event);
                onEvent?.(event);
              }
              currentData = '';
              currentEventType = 'message';
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Expected when disconnecting
        return;
      }
      setError(err.message);
      setIsConnected(false);
      onError?.(err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.cancel().catch(() => {});
      readerRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    error,
    connect,
    disconnect,
  };
}
