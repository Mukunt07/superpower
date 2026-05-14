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

    if (hands.length === 0) {
      this.particles.update(dt);
      return;
    }

    const hand1 = hands[0];
    const hand2 = hands[1] ?? null;

    const palm = landmarkToCanvas(hand1[9], canvasW, canvasH);
    
    if (hand2) {
      // Two hands: distance between hands controls radius
      const palm2 = landmarkToCanvas(hand2[9], canvasW, canvasH);
      const d = Math.sqrt((palm.x - palm2.x) ** 2 + (palm.y - palm2.y) ** 2);
      this.shieldRadius = Math.max(80, Math.min(300, d * 0.8));
    } else {
      // One hand: distance from wrist to palm controls radius
      const wrist = landmarkToCanvas(hand1[0], canvasW, canvasH);
      const palmDist = Math.sqrt((palm.x - wrist.x) ** 2 + (palm.y - wrist.y) ** 2);
      this.shieldRadius = Math.max(60, Math.min(140, palmDist * 2.5));
    }

    // Fire sparks around shield
    if (Math.random() > 0.25) {
      const angle = Math.random() * Math.PI * 2;
      const sr = this.shieldRadius + randomBetween(-10, 15);
      this.particles.spawn({
        x: palm.x + Math.cos(angle) * sr,
        y: palm.y + Math.sin(angle) * sr,
        vx: Math.cos(angle) * randomBetween(1, 4),
        vy: Math.sin(angle) * randomBetween(1, 4) - 0.5,
        color: Math.random() > 0.4 ? '#ff6a00' : '#ffcc33',
        type: 'spark',
        size: randomBetween(2, 6),
        maxLife: randomBetween(0.4, 0.9),
        trailLength: 8,
      });
    }

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    if (hands.length === 0) return;
    const palm = landmarkToCanvas(hands[0][9], canvasW, canvasH);

    ctx.save();
    ctx.globalAlpha = this.intensity;

    // ── Realistic Multi-pass Shield ──────────────────────────────────────────
    
    // 1. Broad outer glow
    ctx.fillStyle = 'rgba(255, 106, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main shield body
    const grad = ctx.createRadialGradient(palm.x, palm.y, 0, palm.x, palm.y, this.shieldRadius);
    grad.addColorStop(0, 'rgba(255, 106, 0, 0.2)');
    grad.addColorStop(0.7, 'rgba(255, 106, 0, 0.1)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Rune animation
    this.rune.draw(ctx, palm.x, palm.y, this.shieldRadius, '#ff6a00');

    // 4. Pulsing edge ring
    const pulse = 0.8 + 0.2 * Math.sin(this.phase * 5);
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.7 * pulse})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Inner bright ring
    ctx.beginPath();
    ctx.arc(palm.x, palm.y, this.shieldRadius * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Particles
    this.particles.render(ctx);

    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.phase = 0;
  }
}
