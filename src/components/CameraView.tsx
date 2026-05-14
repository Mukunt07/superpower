import React, { useEffect, useRef, useState } from 'react';
import { CameraEngine } from '../core/CameraEngine';
import { VoiceEngine } from '../core/VoiceEngine';
import { useStore } from '../store/useStore';
import './CameraView.css';

export const CameraView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CameraEngine | null>(null);
  const voiceRef = useRef<VoiceEngine | null>(null);

  const {
    activePower,
    setDetectedGesture, setGestureConfidence,
    setHandLandmarks, setPoseLandmarks, setFaceLandmarks,
    setFps, setVoiceCommand, setVoiceListening,
    setCameraReady, showLandmarks,
    voiceListening,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [loadMsg, setLoadMsg] = useState('Initializing AI Models...');
  const [error, setError] = useState('');

  useEffect(() => {
    const engine = new CameraEngine();
    engineRef.current = engine;

    const run = async () => {
      try {
        setLoadMsg('Loading Hand Tracking Model...');
        await engine.init(videoRef.current!, canvasRef.current!, {
          onGestureChange: (gesture, _power, confidence) => {
            setDetectedGesture(gesture as any);
            setGestureConfidence(confidence);
            // Auto-activation removed: power selection is manual only
          },
          onHandLandmarks: setHandLandmarks,
          onPoseLandmarks: setPoseLandmarks,
          onFaceLandmarks: setFaceLandmarks,
          onFpsUpdate: setFps,
        });

        setLoadMsg('Starting Camera...');
        await engine.startCamera();
        setCameraReady(true);
        setLoading(false);

        // Init voice engine
        const voice = new VoiceEngine(engine.gestureClassifierRef);
        voiceRef.current = voice;
        voice.init();
        voice.onCommand = (_power, transcript) => {
          // Auto-activation removed: power selection is manual only
          setVoiceCommand(transcript);
          setTimeout(() => setVoiceCommand(''), 3000);
        };
        voice.onTranscript = (text) => setVoiceCommand(text);

      } catch (err: any) {
        setError(err?.message ?? 'Camera access denied.');
        setLoading(false);
      }
    };

    run();

    return () => {
      engineRef.current?.stop();
      voiceRef.current?.stop();
    };
  }, []);

  // Sync active power to engine
  useEffect(() => {
    engineRef.current?.setPower(activePower);
  }, [activePower]);

  // Sync landmark debug
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.showLandmarks = showLandmarks;
    }
  }, [showLandmarks]);

  // Toggle voice
  const toggleVoice = () => {
    const v = voiceRef.current;
    if (!v) return;
    if (voiceListening) {
      v.stop();
      setVoiceListening(false);
    } else {
      v.start();
      setVoiceListening(true);
    }
  };

  return (
    <div className="camera-view" id="camera-view">
      <video ref={videoRef} className="camera-video" muted playsInline />
      <canvas ref={canvasRef} className="camera-canvas" />

      {loading && (
        <div className="camera-loading">
          <div className="loading-spinner" />
          <p className="loading-msg font-display">{loadMsg}</p>
          <div className="loading-progress">
            <div className="loading-bar" />
          </div>
        </div>
      )}

      {error && (
        <div className="camera-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <p className="error-hint">Please allow camera access and refresh.</p>
        </div>
      )}

      {/* Voice button */}
      {!loading && !error && (
        <button
          id="voice-toggle-btn"
          className={`voice-btn ${voiceListening ? 'listening' : ''}`}
          onClick={toggleVoice}
          title={voiceListening ? 'Stop Voice' : 'Start Voice Commands'}
        >
          <span className="voice-icon">{voiceListening ? '🔴' : '🎤'}</span>
          <span className="voice-label font-ui">
            {voiceListening ? 'Listening...' : 'Voice'}
          </span>
        </button>
      )}
    </div>
  );
};
