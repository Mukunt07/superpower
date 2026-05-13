import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { PowerPanel } from './components/PowerPanel';
import { HUDOverlay } from './components/HUDOverlay';
import { GestureGuide } from './components/GestureGuide';
import { IntroScreen } from './components/IntroScreen';
import { useStore } from './store/useStore';
import './App.css';

const App: React.FC = () => {
  const { introComplete, setIntroComplete, showGuide, setShowGuide } = useStore();
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroComplete(true);
  };

  return (
    <div className="app" id="app-root">
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}

      <div className={`app-main ${introComplete ? 'active' : ''}`}>
        {/* Camera + AR canvas */}
        <CameraView />

        {/* AR HUD */}
        <HUDOverlay />

        {/* Power selection panel */}
        <PowerPanel />

        {/* Bottom toolbar */}
        <div className="app-toolbar" id="app-toolbar">
          <div className="toolbar-left">
            <div className="brand font-display">
              <span className="brand-icon">⚡</span>
              <span className="brand-text">METAHERO<span className="brand-accent"> VISION</span></span>
            </div>
          </div>

          <div className="toolbar-center">
            {/* Quick power buttons */}
            <button
              id="quick-shield-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('strange-shield')}
              title="Doctor Strange Shield"
            >🛡️</button>
            <button
              id="quick-portal-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('strange-portal')}
              title="Strange Portal"
            >🌀</button>
            <button
              id="quick-hud-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('ironman-hud')}
              title="Iron Man HUD"
            >🤖</button>
            <button
              id="quick-lightning-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('lightning')}
              title="Lightning"
            >🌩️</button>
            <button
              id="quick-blast-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('energy-blast')}
              title="Energy Blast"
            >⚡</button>
            <button
              id="quick-telekinesis-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('telekinesis')}
              title="Telekinesis"
            >🔮</button>
            <button
              id="quick-aura-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('aura')}
              title="Aura"
            >✨</button>
            <button
              id="quick-shield2-btn"
              className="quick-btn"
              onClick={() => useStore.getState().setActivePower('super-shield')}
              title="Super Shield"
            >🔵</button>
          </div>

          <div className="toolbar-right">
            <button
              id="guide-open-btn"
              className="toolbar-btn font-ui"
              onClick={() => setShowGuide(true)}
            >
              📖 Guide
            </button>
          </div>
        </div>
      </div>

      {showGuide && <GestureGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default App;
