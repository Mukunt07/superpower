import React, { useEffect, useState } from 'react';
import './IntroScreen.css';

interface Props {
  onComplete: () => void;
}

export const IntroScreen: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => setPhase(3), 3000);
    const t4 = setTimeout(() => onComplete(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`intro-screen ${phase >= 3 ? 'fade-out' : ''}`} id="intro-screen">
      {/* Background particles */}
      <div className="intro-bg">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="intro-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      {/* Central logo */}
      <div className={`intro-content ${phase >= 1 ? 'visible' : ''}`}>
        <div className="intro-logo-ring">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
          <div className="intro-logo-core">
            <span className="logo-icon">⚡</span>
          </div>
        </div>

        <div className={`intro-text ${phase >= 2 ? 'text-visible' : ''}`}>
          <h1 className="intro-title font-display">
            <span className="title-meta">META</span>
            <span className="title-hero">HERO</span>
          </h1>
          <p className="intro-subtitle font-display">VISION</p>
          <p className="intro-tagline font-ui">AI SUPERPOWER CAMERA SYSTEM</p>
        </div>

        <div className={`intro-loading ${phase >= 2 ? 'loading-visible' : ''}`}>
          <div className="loading-dots font-ui">INITIALIZING{dots}</div>
          <div className="intro-progress">
            <div className="intro-progress-fill" />
          </div>
          <p className="intro-version font-ui">v1.0 // POWERED BY MEDIAPIPE AI</p>
        </div>
      </div>

      {/* Scan lines */}
      <div className="scan-lines" />
    </div>
  );
};
