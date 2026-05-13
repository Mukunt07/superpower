import React from 'react';
import { POWERS } from '../store/useStore';
import './GestureGuide.css';

interface Props {
  onClose: () => void;
}

export const GestureGuide: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="guide-overlay" id="gesture-guide-overlay">
      <div className="guide-modal glass-panel" id="gesture-guide-modal">
        <div className="guide-header">
          <h2 className="guide-title font-display">GESTURE GUIDE</h2>
          <p className="guide-subtitle font-ui">Stand 2–3 feet from camera. Ensure good lighting.</p>
          <button id="guide-close-btn" className="guide-close" onClick={onClose}>✕</button>
        </div>

        <div className="guide-grid">
          {POWERS.map((power) => (
            <div key={power.id} className="guide-card" style={{ '--pc': power.color } as React.CSSProperties}>
              <div className="guide-icon">{power.icon}</div>
              <div className="guide-info">
                <h3 className="guide-name font-display">{power.name}</h3>
                <div className="guide-row">
                  <span className="guide-tag gesture-tag font-ui">👋 {power.gesture}</span>
                  <span className="guide-tag voice-tag font-ui">🎤 "{power.voice}"</span>
                </div>
              </div>
              <div className="guide-indicator" />
            </div>
          ))}
        </div>

        <div className="guide-tips">
          <h4 className="font-display tips-title">TIPS FOR BEST RESULTS</h4>
          <ul className="tips-list font-ui">
            <li>⚡ Hold gestures for 0.5s to activate powers</li>
            <li>💡 Use in well-lit environment</li>
            <li>📏 Stand 2–4 feet from camera</li>
            <li>👐 Keep hands visible and unobstructed</li>
            <li>🎤 Speak clearly for voice commands</li>
            <li>🔄 Gesture changes power automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
