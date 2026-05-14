import { ParticleSystem } from '../effects/ParticleSystem';
import { randomBetween, landmarkToCanvas, lerp } from '../utils/mathUtils';
import type { HandLandmarks } from '../mediapipe/HandTracker';

export class StrangePortal {
  private particles = new ParticleSystem();
  private phase = 0;
  private radius = 0;
  private targetRadius = 130;
  private cx = 0;
  private cy = 0;
  private innerAngle = 0;
  private outerAngle = 0;
  private distortOffset = 0;

  constructor() {
    // Center and radius are set during update
  }

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.innerAngle += dt * 3;
    this.outerAngle -= dt * 1.5;
    this.distortOffset += dt * 2;
    this.particles.update(dt);

    if (hands.length === 0) {
      this.radius = Math.max(0, this.radius - dt * 200);
      return;
    }

    const hand1 = hands[0];
    const hand2 = hands[1] ?? null;

    const p1 = landmarkToCanvas(hand1[9], canvasW, canvasH);
    
    // Set center to first hand
    this.cx = p1.x;
    this.cy = p1.y;

    if (hand2) {
      // Use distance between hands to control radius
      const p2 = landmarkToCanvas(hand2[9], canvasW, canvasH);
      const d = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
      this.targetRadius = Math.max(60, Math.min(canvasW * 0.4, d * 0.6));
    } else {
      this.targetRadius = 120;
    }

    // Smooth radius transition
    this.radius = lerp(this.radius, this.targetRadius, 0.1);

    // Golden sparks around edge
    if (this.radius > 10 && Math.random() > 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.radius + randomBetween(-10, 10);
      this.particles.spawn({
        x: this.cx + Math.cos(angle) * r,
        y: this.cy + Math.sin(angle) * r,
        vx: Math.cos(angle) * randomBetween(1, 5),
        vy: Math.sin(angle) * randomBetween(1, 5),
        color: Math.random() > 0.3 ? '#ffd700' : '#ffaa00',
        type: 'spark',
        size: randomBetween(2, 6),
        maxLife: randomBetween(0.4, 1.0),
        trailLength: 10,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { cx, cy, radius } = this;
    if (radius < 10) return;

    ctx.save();

    // ── Realistic Multi-pass Portal ─────────────────────────────────────────
    
    // 1. Outer golden atmospheric glow
    const atmosphericGrad = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
    atmosphericGrad.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
    atmosphericGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = atmosphericGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dark void center
    ctx.fillStyle = 'rgba(10, 5, 20, 0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.92, 0, Math.PI * 2);
    ctx.fill();

    // 3. Inner shimmering nebula effect
    for (let i = 0; i < 4; i++) {
      const ir = radius * (0.3 + i * 0.18);
      const alpha = 0.5 - i * 0.1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.innerAngle + i * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, ir, 0, Math.PI * 1.6);
      ctx.strokeStyle = `rgba(150, 80, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Main golden ring passes
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.outerAngle);
    
    // Broad ring pass
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Segmented ring pass
    const segCount = 10;
    const segGap = 0.12;
    for (let i = 0; i < segCount; i++) {
      const start = (i / segCount) * Math.PI * 2 + segGap;
      const end = ((i + 1) / segCount) * Math.PI * 2 - segGap;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, end);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // White hot highlight on segment
      ctx.beginPath();
      ctx.arc(0, 0, radius, start + 0.1, start + 0.3);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // 5. Particles
    this.particles.render(ctx);

    ctx.restore();
  }

  setCenter(cx: number, cy: number): void {
    this.cx = cx;
    this.cy = cy;
  }

  reset(): void {
    this.radius = 0;
    this.phase = 0;
  }
}
