import { ParticleSystem } from '../effects/ParticleSystem';
import { randomBetween } from '../utils/mathUtils';

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

  constructor(cx: number, cy: number) {
    this.cx = cx;
    this.cy = cy;
  }

  update(dt: number): void {
    this.phase += dt;
    this.innerAngle += dt * 3.5;
    this.outerAngle -= dt * 1.8;
    this.distortOffset += dt * 2;
    this.radius = Math.min(this.targetRadius, this.radius + dt * 120);
    this.particles.update(dt);

    // Golden sparks around edge
    if (Math.random() > 0.2) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.radius + randomBetween(-8, 8);
      this.particles.spawn({
        x: this.cx + Math.cos(angle) * r,
        y: this.cy + Math.sin(angle) * r,
        vx: Math.cos(angle) * randomBetween(1, 4),
        vy: Math.sin(angle) * randomBetween(1, 4),
        color: Math.random() > 0.3 ? '#ffd700' : '#ffaa00',
        type: 'spark',
        size: randomBetween(2, 6),
        maxLife: randomBetween(0.3, 0.8),
        trailLength: 8,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { cx, cy, radius } = this;
    if (radius < 5) return;

    ctx.save();

    // ── Portal interior (void + distortion) ─────────────────────────────────
    // Dark void center
    const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.85);
    voidGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    voidGrad.addColorStop(0.5, 'rgba(5, 0, 30, 0.8)');
    voidGrad.addColorStop(0.8, 'rgba(60, 20, 120, 0.5)');
    voidGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Inner swirling rings
    for (let i = 0; i < 3; i++) {
      const ir = radius * (0.4 + i * 0.15);
      const alpha = 0.4 - i * 0.1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.innerAngle + i * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, ir, 0, Math.PI * 1.7);
      ctx.strokeStyle = `rgba(180, 100, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#8b5cf6';
      ctx.stroke();
      ctx.restore();
    }

    // Outer golden ring segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.outerAngle);
    const segCount = 12;
    const segGap = 0.08;
    for (let i = 0; i < segCount; i++) {
      const start = (i / segCount) * Math.PI * 2 + segGap;
      const end = ((i + 1) / segCount) * Math.PI * 2 - segGap;
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, end);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffaa00';
      ctx.stroke();
    }
    ctx.restore();

    // Second outer ring (counter-rotating)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.outerAngle * 1.5);
    for (let i = 0; i < 6; i++) {
      const start = (i / 6) * Math.PI * 2 + 0.2;
      const end = ((i + 0.6) / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, start, end);
      ctx.strokeStyle = 'rgba(255, 200, 50, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    // Portal glow edge
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Particles
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
