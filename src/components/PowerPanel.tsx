import React from 'react';
import { useStore, POWERS, type PowerType } from '../store/useStore';
import './PowerPanel.css';

export const PowerPanel: React.FC = () => {
  const { activePower, setActivePower, showPanel, setShowPanel, detectedGesture, gestureConfidence } = useStore();

  return (
    <>
      {/* Toggle tab */}
      <button
        id="panel-toggle-btn"
        className={`panel-toggle ${showPanel ? 'open' : ''}`}
        onClick={() => setShowPanel(!showPanel)}
        title="Toggle Power Panel"
      >
        <span className="toggle-arrow">{showPanel ? '◀' : '▶'}</span>
      </button>

      <aside className={`power-panel glass-panel ${showPanel ? 'visible' : ''}`} id="power-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title-row">
            <div className="panel-logo">⚡</div>
            <div>
              <h2 className="panel-title font-display">POWERS</h2>
              <p className="panel-subtitle font-ui">MetaHero Vision</p>
            </div>
          </div>
          <div className="gesture-badge">
            <span className="badge-label font-ui">GESTURE</span>
            <span className="badge-value font-display">{detectedGesture.replace('-', ' ').toUpperCase()}</span>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${gestureConfidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Power OFF */}
        <button
          id="power-off-btn"
          className={`power-off-btn ${activePower === 'none' ? 'active' : ''}`}
          onClick={() => setActivePower('none')}
        >
          <span>🔘</span>
          <span className="font-ui">POWER OFF</span>
        </button>

        {/* Power cards */}
        <div className="power-list">
          {POWERS.map((power) => (
            <PowerCard
              key={power.id}
              power={power}
              isActive={activePower === power.id}
              onSelect={() => setActivePower(power.id === activePower ? 'none' : power.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="panel-footer font-ui">
          <span>🎤 Say power name to activate</span>
        </div>
      </aside>
    </>
  );
};

interface PowerCardProps {
  power: (typeof POWERS)[0];
  isActive: boolean;
  onSelect: () => void;
}

const PowerCard: React.FC<PowerCardProps> = ({ power, isActive, onSelect }) => {
  return (
    <button
      id={`power-btn-${power.id}`}
      className={`power-card ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      style={{ '--power-color': power.color } as React.CSSProperties}
    >
      <div className="card-icon">{power.icon}</div>
      <div className="card-info">
        <span className="card-name font-display">{power.name}</span>
        <span className="card-gesture font-ui">👋 {power.gesture}</span>
        <span className="card-voice font-ui">🎤 "{power.voice}"</span>
      </div>
      {isActive && (
        <div className="card-active-badge">
          <span className="active-dot" />
          <span className="font-ui">ON</span>
        </div>
      )}
    </button>
  );
};
