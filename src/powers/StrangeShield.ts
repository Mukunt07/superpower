import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { RuneAnimator } from '../effects/GlowRenderer';
import { landmarkToCanvas, randomBetween } from '../utils/mathUtils';

export class StrangeShield {
  private particles = new ParticleSystem();
  private rune = new RuneAnimator();
  private phase = 0;
  private intensity = 0;
  private shieldRadius = 80;

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.rune.update(dt);
    this.intensity = Math.min(1, this.intensity + dt * 2);

    const hand = hands[0];
    if (!hand) return;

    const palm = landmarkToCanvas(hand[9], canvasW, canvasH);
    const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);
    const palmDist = Math.sqrt((palm.x - wrist.x) ** 2 + (palm.y - wrist.y) ** 2);
    this.shieldRadius = Math.max(60, Math.min(130, palmDist * 2.2));

    // Fire sparks around shield
    if (Math.random() > 0.3) {
      const angle = Math.random() * Math.PI * 2;
      const sr = this.shieldRadius + randomBetween(-5, 10);
      this.particles.spawn({
        x: palm.x + Math.cos(angle) * sr,
        y: palm.y + Math.sin(angle) * sr,
        vx: Math.cos(angle) * randomBetween(1, 3),
        vy: Math.sin(angle) * randomBetween(1, 3) - 1,
        color: Math.random() > 0.5 ? '#ff6a00' : '#ffaa33',
        type: 'spark',
        size: randomBetween(2, 5),
        maxLife: randomBetween(0.3, 0.7),
        trailLength: 6,
      });
    }

    // Core fire particles
    if (Math.random() > 0.5) {
      this.particles.spawnFireColumn(palm.x, palm.y, 15, '#ff4400', '#ffaa00');
    }

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    if (!hands[0]) return;
    const palm = landmarkToCanvas(hands[0][9], canvasW, canvasH);

    ctx.save();
    ctx.globalAlpha = this.intensity;

    // Shield background glow
    const grad = ctx.createRadialGradient(palm.x, palm.y, 0, palm.x, palm.y, this.shieldRadius);
    grad.addColorStop(0, 'rgba(255, 106, 0, 0.15)');
    grad.addColorStop(0.7, 'rgba(255, 106, 0, 0.05)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // Rune animation
    this.rune.draw(ctx, palm.x, palm.y, this.shieldRadius, '#ff6a00');

    // Particles
    this.particles.render(ctx);

    // Pulsing edge ring
    const pulse = 0.7 + 0.3 * Math.sin(this.phase * 4);
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 180, 50, ${0.6 * pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff6a00';
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.phase = 0;
  }
}
