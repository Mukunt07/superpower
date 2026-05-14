import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { RuneAnimator, LightningRenderer } from '../effects/GlowRenderer';
import { landmarkToCanvas, randomBetween, dist2D, lerpVec2 } from '../utils/mathUtils';

export class StrangeShield {
  private particles = new ParticleSystem();
  private rune = new RuneAnimator();
  private phase = 0;
  private intensity = 0;

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.rune.update(dt);
    this.intensity = Math.min(1, this.intensity + dt * 2);

    if (hands.length === 0) {
      this.particles.update(dt);
      return;
    }

    // Update particles for each hand
    hands.forEach((hand) => {
      const palm = landmarkToCanvas(hand[9], canvasW, canvasH);
      const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);
      const palmDist = dist2D(palm, wrist);
      const radius = Math.max(70, Math.min(150, palmDist * 2.2));
      
      // Store current hand's radius (removed unused property)

      // Fire sparks around shield
      if (Math.random() > 0.3) {
        const angle = Math.random() * Math.PI * 2;
        const sr = radius + randomBetween(-10, 15);
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
    });

    // If two hands, add ray particles
    if (hands.length >= 2) {
      const p1 = landmarkToCanvas(hands[0][9], canvasW, canvasH);
      const p2 = landmarkToCanvas(hands[1][9], canvasW, canvasH);
      const count = 3;
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const pos = lerpVec2(p1, p2, t);
        this.particles.spawn({
          x: pos.x + randomBetween(-10, 10),
          y: pos.y + randomBetween(-10, 10),
          vx: randomBetween(-1, 1),
          vy: randomBetween(-1, 1),
          color: '#ffcc33',
          type: 'spark',
          size: randomBetween(1, 4),
          maxLife: randomBetween(0.2, 0.5),
        });
      }
    }

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    if (hands.length === 0) return;

    ctx.save();
    ctx.globalAlpha = this.intensity;

    // Draw shields on all detected hands
    hands.forEach((hand) => {
      const palm = landmarkToCanvas(hand[9], canvasW, canvasH);
      const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);
      const palmDist = dist2D(palm, wrist);
      const radius = Math.max(70, Math.min(150, palmDist * 2.2));
      
      this.drawSingleShield(ctx, palm.x, palm.y, radius);
    });

    // If two hands, draw the ray
    if (hands.length >= 2) {
      const p1 = landmarkToCanvas(hands[0][9], canvasW, canvasH);
      const p2 = landmarkToCanvas(hands[1][9], canvasW, canvasH);
      this.drawRay(ctx, p1.x, p1.y, p2.x, p2.y);
    }

    // Render particles
    this.particles.render(ctx);

    ctx.restore();
  }

  private drawSingleShield(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    // 1. Broad outer glow
    ctx.fillStyle = 'rgba(255, 106, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main shield body
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255, 106, 0, 0.2)');
    grad.addColorStop(0.7, 'rgba(255, 106, 0, 0.1)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Rune animation
    this.rune.draw(ctx, x, y, r, '#ff6a00');

    // 4. Pulsing edge ring
    const pulse = 0.8 + 0.2 * Math.sin(this.phase * 5);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 50, ${0.7 * pulse})`;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Inner bright ring
    ctx.beginPath();
    ctx.arc(x, y, r * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawRay(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const d = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const jitter = Math.max(0.1, 0.5 - (d / 1000)); // More jitter when closer
    const width = Math.max(1, 4 - (d / 300)); // Thicker when closer

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    // Multi-pass lightning for the ray
    for (let i = 0; i < 2; i++) {
      LightningRenderer.drawBolt(
        ctx, x1, y1, x2, y2, 
        i === 0 ? 'rgba(255, 150, 0, 0.5)' : 'rgba(255, 255, 150, 0.8)',
        width * (i + 1), 
        3, 
        jitter
      );
    }

    // Core bright line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = width * 0.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6a00';
    ctx.stroke();

    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.phase = 0;
  }
}

