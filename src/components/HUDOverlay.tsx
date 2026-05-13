import React from 'react';
import { useStore, POWERS } from '../store/useStore';
import './HUDOverlay.css';

export const HUDOverlay: React.FC = () => {
  const {
    fps, activePower, detectedGesture, gestureConfidence,
    handLandmarks, poseLandmarks, voiceCommand, voiceListening,
    showLandmarks, setShowLandmarks,
  } = useStore();

  const power = POWERS.find((p) => p.id === activePower);

  return (
    <div className="hud-overlay" id="hud-overlay">
      {/* Top-left: FPS + status */}
      <div className="hud-corner hud-top-left">
        <div className="hud-stat">
          <span className="stat-label font-ui">FPS</span>
          <span className={`stat-value font-display ${fps < 20 ? 'warn' : ''}`}>{fps}</span>
        </div>
        <div className="hud-stat">
          <span className="stat-label font-ui">HANDS</span>
          <span className="stat-value font-display">{handLandmarks.length}</span>
        </div>
        <div className="hud-stat">
          <span className="stat-label font-ui">POSE</span>
          <span className="stat-value font-display">{poseLandmarks.length > 0 ? '✓' : '—'}</span>
        </div>
        <button
          id="landmarks-toggle-btn"
          className={`debug-btn font-ui ${showLandmarks ? 'active' : ''}`}
          onClick={() => setShowLandmarks(!showLandmarks)}
          title="Toggle Landmark Debug"
        >
          {showLandmarks ? '🔵 Landmarks ON' : '⚫ Landmarks'}
        </button>
      </div>

      {/* Top-right: active power */}
      {power && (
        <div className="hud-corner hud-top-right">
          <div className="active-power-display" style={{ '--pc': power.color } as React.CSSProperties}>
            <span className="ap-icon">{power.icon}</span>
            <div>
              <p className="ap-label font-ui">ACTIVE POWER</p>
              <p className="ap-name font-display">{power.name.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom-left: gesture info */}
      <div className="hud-corner hud-bottom-left">
        <div className="gesture-info">
          <span className="gi-label font-ui">DETECTED</span>
          <span className="gi-gesture font-display">
            {detectedGesture === 'none' ? '—' : detectedGesture.replace('-', ' ').toUpperCase()}
          </span>
          <div className="gi-bar">
            <div
              className="gi-fill"
              style={{ width: `${gestureConfidence * 100}%` }}
            />
          </div>
          <span className="gi-conf font-ui">{Math.round(gestureConfidence * 100)}%</span>
        </div>
      </div>

      {/* Voice command display */}
      {voiceCommand && (
        <div className="voice-display" id="voice-display">
          <span className="vd-icon">{voiceListening ? '🔴' : '🎤'}</span>
          <span className="vd-text font-ui">"{voiceCommand}"</span>
        </div>
      )}

      {/* Corner decorations */}
      <div className="hud-corner-deco top-left-deco" />
      <div className="hud-corner-deco top-right-deco" />
      <div className="hud-corner-deco bot-left-deco" />
      <div className="hud-corner-deco bot-right-deco" />
    </div>
  );
};
