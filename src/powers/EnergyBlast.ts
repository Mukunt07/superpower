import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { landmarkToCanvas, randomBetween } from '../utils/mathUtils';

export class EnergyBlast {
  private particles = new ParticleSystem();
  private phase = 0;
  private beamLength = 0;
  private intensity = 0;
  private shakeX = 0;
  private shakeY = 0;

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.intensity = Math.min(1, this.intensity + dt * 3);
    this.beamLength = Math.min(canvasW * 0.8, this.beamLength + dt * 600);

    // Camera shake simulation
    this.shakeX = (Math.random() - 0.5) * 6 * this.intensity;
    this.shakeY = (Math.random() - 0.5) * 6 * this.intensity;

    if (hands.length === 0) {
      this.particles.update(dt);
      return;
    }

    // Process each hand
    for (const hand of hands) {
      const fist = landmarkToCanvas(hand[9], canvasW, canvasH);
      const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);

      // Beam direction (fist to wrist vector)
      const dx = fist.x - wrist.x;
      const dy = fist.y - wrist.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ndx = dx / len;
      const ndy = dy / len;

      // Core beam particles
      const step = 25;
      for (let d = 0; d < this.beamLength; d += step) {
        if (Math.random() > 0.65) {
          const spread = 12 * (d / this.beamLength);
          this.particles.spawn({
            x: fist.x + ndx * d + randomBetween(-spread, spread),
            y: fist.y + ndy * d + randomBetween(-spread, spread),
            vx: ndx * randomBetween(3, 7) + randomBetween(-1, 1),
            vy: ndy * randomBetween(3, 7) + randomBetween(-1, 1),
            color: Math.random() > 0.4 ? '#00d4ff' : '#ffffff',
            type: 'spark',
            size: randomBetween(2, 6),
            maxLife: randomBetween(0.1, 0.4),
            trailLength: 5,
          });
        }
      }

      // Impact burst at end
      if (Math.random() > 0.7) {
        const ix = fist.x + ndx * this.beamLength;
        const iy = fist.y + ndy * this.beamLength;
        this.particles.spawnSparkBurst(ix, iy, 4, '#00d4ff', 6);
        if (Math.random() > 0.8) this.particles.spawnEnergyOrb(ix, iy, '#ffffff');
      }
    }

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    if (hands.length === 0) return;
    
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    ctx.globalAlpha = this.intensity;

    for (const hand of hands) {
      const fist = landmarkToCanvas(hand[9], canvasW, canvasH);
      const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);
      const dx = fist.x - wrist.x;
      const dy = fist.y - wrist.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ndx = dx / len;
      const ndy = dy / len;
      const endX = fist.x + ndx * this.beamLength;
      const endY = fist.y + ndy * this.beamLength;

      // ── Realistic Multi-pass Beam ──────────────────────────────────────────
      
      // 1. Outer broad glow
      ctx.beginPath();
      ctx.moveTo(fist.x, fist.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.1)';
      ctx.lineWidth = 60;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Secondary glow
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.lineWidth = 30;
      ctx.stroke();

      // 3. Main energy core
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.7)';
      ctx.lineWidth = 12;
      ctx.stroke();

      // 4. White hot center
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 5. Fist charge effect
      const chargeR = 45;
      ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(fist.x, fist.y, chargeR, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(fist.x, fist.y, chargeR * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.beamLength = 0;
  }
}
