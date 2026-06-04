'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useConversation - Orchestrates the full pipeline:
 * 
 * ARCHITECTURE:
 * 1. ElevenLabs Conversational AI handles: microphone input → STT → LLM → TTS → audio playback
 * 2. D-ID Streams API handles: text → TTS (via ElevenLabs) → lip-synced avatar video
 * 3. When agent generates a response, we send the text to D-ID to animate the avatar
 * 4. Client tools (analyze_scene) let the agent "see" via the webcam
 * 
 * The flow is SEQUENTIAL:
 *   User speaks → ElevenLabs STT → LLM generates response 
 *   → We intercept the text → Send to D-ID for avatar lip-sync
 *   → D-ID plays the response with lip-sync via WebRTC
 *   → Meanwhile ElevenLabs also plays audio (we mute this since D-ID handles it)
 */
export function useConversation({ captureFrame, country }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [didStatus, setDidStatus] = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // D-ID refs
  const peerConnectionRef = useRef(null);
  const streamIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const dataChannelRef = useRef(null);
  const streamVideoRef = useRef(null);
  const isStreamReadyRef = useRef(false);

  // ElevenLabs refs
  const conversationRef = useRef(null);
  const wsRef = useRef(null);

  // Store current country for vision calls
  const countryRef = useRef(country);
  useEffect(() => {
    countryRef.current = country;
  }, [country]);

  // Store captureFrame ref
  const captureFrameRef = useRef(captureFrame);
  useEffect(() => {
    captureFrameRef.current = captureFrame;
  }, [captureFrame]);

  const addTranscript = useCallback((role, text) => {
    setTranscript((prev) => [...prev, { role, text, id: Date.now() + Math.random() }]);
  }, []);

  // ============ D-ID STREAMING ============

  const connectDID = useCallback(async (videoElement) => {
    try {
      setDidStatus('connecting');
      streamVideoRef.current = videoElement;

      // Step 1: Create stream
      const streamRes = await fetch('/api/did/stream', { method: 'POST' });
      if (!streamRes.ok) throw new Error('Failed to create D-ID stream');
      const { streamId, sessionId, offer, iceServers } = await streamRes.json();

      streamIdRef.current = streamId;
      sessionIdRef.current = sessionId;

      // Step 2: Create WebRTC peer connection
      const pc = new RTCPeerConnection({ iceServers });
      peerConnectionRef.current = pc;

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await fetch('/api/did/ice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                streamId,
                sessionId,
                candidate: event.candidate,
              }),
            });
          } catch (err) {
            console.error('ICE candidate error:', err);
          }
        }
      };

      // Handle incoming video stream from D-ID
      pc.ontrack = (event) => {
        if (videoElement && event.streams[0]) {
          videoElement.srcObject = event.streams[0];
        }
      };

      // Handle data channel for stream events
      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannelRef.current = dc;
        dc.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'stream/ready') {
              isStreamReadyRef.current = true;
              console.log('D-ID stream is ready');
            }
            if (data.type === 'stream/started') {
              setIsSpeaking(true);
            }
            if (data.type === 'stream/done') {
              setIsSpeaking(false);
            }
          } catch {
            // ignore non-JSON messages
          }
        };
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setDidStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setDidStatus('error');
        }
      };

      // Step 3: Set remote description and create answer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Step 4: Send SDP answer
      await fetch('/api/did/sdp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          sessionId,
          answer,
        }),
      });

      return true;
    } catch (error) {
      console.error('D-ID connection error:', error);
      setDidStatus('error');
      return false;
    }
  }, []);

  const sendToDID = useCallback(async (text) => {
    if (!streamIdRef.current || !sessionIdRef.current) return;

    try {
      await fetch('/api/did/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: streamIdRef.current,
          sessionId: sessionIdRef.current,
          text,
        }),
      });
    } catch (error) {
      console.error('D-ID talk error:', error);
    }
  }, []);

  const disconnectDID = useCallback(async () => {
    try {
      if (streamIdRef.current && sessionIdRef.current) {
        await fetch('/api/did/destroy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: streamIdRef.current,
            sessionId: sessionIdRef.current,
          }),
        });
      }
    } catch {
      // best effort
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    streamIdRef.current = null;
    sessionIdRef.current = null;
    dataChannelRef.current = null;
    isStreamReadyRef.current = false;
    setDidStatus('idle');
    setIsSpeaking(false);
  }, []);

  // ============ ELEVENLABS CONVERSATIONAL AI ============

  const connectElevenLabs = useCallback(async () => {
    try {
      // Get signed URL
      const urlRes = await fetch('/api/signed-url');
      if (!urlRes.ok) throw new Error('Failed to get signed URL');
      const { signedUrl } = await urlRes.json();

      // Request microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Dynamically import ElevenLabs SDK
      const { Conversation } = await import('@elevenlabs/client');

      const conversation = await Conversation.startSession({
        signedUrl,
        
        overrides: {
          agent: {
            prompt: {
              prompt: `You are "The Critic" — a sharp, witty, culturally aware AI fashion and food critic. You combine brutal honesty with genuine helpfulness. You use humor and wit — never mean-spirited, but always direct. You speak conversationally like chatting with a friend.

The user is located in: ${countryRef.current || 'Unknown'}. Consider fashion trends and cultural norms for their region.

When the user asks you to look at something, evaluate their outfit, check their food, or says "what do you think?", "how does this look?", "rate this", etc. — you MUST call the analyze_scene tool FIRST before giving your opinion. Never make up what you see.

Always be specific to what you actually see. If you can't see clearly, ask them to adjust the camera. Give actionable advice.`
            },
            firstMessage: `Hey! I'm The Critic — your personal fashion and food advisor. I can see you through your camera, so whenever you're ready, show me what you've got. Whether it's an outfit, some clothes you're thinking of wearing, or a meal you just made — I'll give you my honest take. What are we working with today?`
          }
        },

        clientTools: {
          analyze_scene: async (params) => {
            console.log('Agent calling analyze_scene:', params);
            setIsAnalyzing(true);

            try {
              const frame = captureFrameRef.current?.();
              if (!frame) {
                setIsAnalyzing(false);
                return JSON.stringify({
                  error: 'Could not capture webcam frame. Ask the user to make sure their camera is on.',
                });
              }

              const response = await fetch('/api/vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  image: frame,
                  country: countryRef.current,
                }),
              });

              if (!response.ok) {
                setIsAnalyzing(false);
                return JSON.stringify({ error: 'Vision analysis failed' });
              }

              const { analysis } = await response.json();
              setIsAnalyzing(false);
              return JSON.stringify(analysis);
            } catch (error) {
              setIsAnalyzing(false);
              return JSON.stringify({ error: 'Vision analysis error: ' + error.message });
            }
          },
        },

        onConnect: ({ conversationId }) => {
          console.log('ElevenLabs connected:', conversationId);
          setStatus('connected');
        },

        onDisconnect: () => {
          console.log('ElevenLabs disconnected');
          setStatus('idle');
        },

        onMessage: (message) => {
          // message contains the agent's spoken text
          if (message.source === 'ai') {
            addTranscript('agent', message.message);
            // Send agent's response text to D-ID for lip-sync
            sendToDID(message.message);
          } else if (message.source === 'user') {
            addTranscript('user', message.message);
          }
        },

        onError: (error) => {
          console.error('ElevenLabs error:', error);
          setStatus('error');
        },

        onStatusChange: (statusInfo) => {
          console.log('ElevenLabs status:', statusInfo);
        },
      });

      conversationRef.current = conversation;
      return true;
    } catch (error) {
      console.error('ElevenLabs connection error:', error);
      setStatus('error');
      return false;
    }
  }, [addTranscript, sendToDID]);

  // ============ MAIN CONNECT/DISCONNECT ============

  const connect = useCallback(
    async (videoElement) => {
      setStatus('connecting');
      setTranscript([]);

      // Step 1: Connect D-ID first (avatar stream)
      const didOk = await connectDID(videoElement);
      if (!didOk) {
        setStatus('error');
        return;
      }

      // Step 2: Connect ElevenLabs (conversation)
      const elOk = await connectElevenLabs();
      if (!elOk) {
        await disconnectDID();
        setStatus('error');
        return;
      }

      setStatus('connected');
    },
    [connectDID, connectElevenLabs, disconnectDID]
  );

  const disconnect = useCallback(async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch {
        // best effort
      }
      conversationRef.current = null;
    }

    await disconnectDID();
    setStatus('idle');
    setIsSpeaking(false);
    setIsAnalyzing(false);
  }, [disconnectDID]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    didStatus,
    transcript,
    isSpeaking,
    isAnalyzing,
    connect,
    disconnect,
  };
}
