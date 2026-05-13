import type { Vec2 } from '../utils/mathUtils';
import { randomBetween, lerp, clamp } from '../utils/mathUtils';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'spark' | 'fire' | 'smoke' | 'energy' | 'electric' | 'star' | 'orb';
  rotation: number;
  rotSpeed: number;
  trail: Vec2[];
  trailLength: number;
}

const MAX_PARTICLES = 3000;

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];

  constructor() {
    // Pre-allocate pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push(this.createEmpty());
    }
  }

  private createEmpty(): Particle {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      life: 0, maxLife: 1,
      size: 1, color: '#fff', alpha: 1,
      type: 'spark',
      rotation: 0, rotSpeed: 0,
      trail: [], trailLength: 0,
    };
  }

  spawn(config: Partial<Particle> & { x: number; y: number }): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    const p = this.pool.pop() ?? this.createEmpty();
    const maxLife = config.maxLife ?? randomBetween(0.5, 1.5);
    Object.assign(p, {
      x: config.x,
      y: config.y,
      vx: config.vx ?? 0,
      vy: config.vy ?? 0,
      life: maxLife,
      maxLife,
      size: config.size ?? randomBetween(2, 6),
      color: config.color ?? '#ffffff',
      alpha: config.alpha ?? 1,
      type: config.type ?? 'spark',
      rotation: config.rotation ?? Math.random() * Math.PI * 2,
      rotSpeed: config.rotSpeed ?? randomBetween(-3, 3),
      trail: [],
      trailLength: config.trailLength ?? 0,
    });
    this.particles.push(p);
  }

  // ─── Burst emitters ────────────────────────────────────────────────────────

  spawnSparkBurst(x: number, y: number, count: number, color: string, speed = 4): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = speed * randomBetween(0.5, 1.5);
      this.spawn({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        type: 'spark',
        size: randomBetween(1.5, 4),
        maxLife: randomBetween(0.4, 0.9),
        trailLength: 5,
      });
    }
  }

  spawnFireColumn(x: number, y: number, spread: number, color1: string, color2: string): void {
    for (let i = 0; i < 3; i++) {
      const cx = x + randomBetween(-spread, spread);
      this.spawn({
        x: cx, y,
        vx: randomBetween(-0.5, 0.5),
        vy: randomBetween(-3, -1.5),
        color: Math.random() > 0.5 ? color1 : color2,
        type: 'fire',
        size: randomBetween(4, 10),
        maxLife: randomBetween(0.6, 1.2),
      });
    }
  }

  spawnElectricArc(x: number, y: number, color: string): void {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = randomBetween(1, 4);
      this.spawn({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        type: 'electric',
        size: randomBetween(1, 3),
        maxLife: randomBetween(0.2, 0.5),
        trailLength: 8,
      });
    }
  }

  spawnEnergyOrb(x: number, y: number, color: string): void {
    this.spawn({
      x, y,
      vx: 0, vy: 0,
      color,
      type: 'orb',
      size: randomBetween(6, 12),
      maxLife: randomBetween(0.8, 1.6),
      alpha: 0.9,
    });
  }

  spawnFloatingStars(x: number, y: number, radius: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = randomBetween(0, radius);
      this.spawn({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r,
        vx: randomBetween(-0.3, 0.3),
        vy: randomBetween(-1, -0.2),
        color,
        type: 'star',
        size: randomBetween(1, 3),
        maxLife: randomBetween(1, 2.5),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: randomBetween(-2, 2),
      });
    }
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }

      // Trail
      if (p.trailLength > 0) {
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > p.trailLength) p.trail.pop();
      }

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed * dt;

      // Type-specific physics
      switch (p.type) {
        case 'spark':
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.vy += 0.05; // slight gravity
          break;
        case 'fire':
          p.vx += randomBetween(-0.1, 0.1);
          p.vy -= 0.02;
          p.size = lerp(p.size, 0, 0.05);
          break;
        case 'smoke':
          p.size = lerp(p.size, p.size * 1.5, 0.01);
          p.vx *= 0.99;
          p.vy *= 0.99;
          break;
        case 'electric':
          p.vx += randomBetween(-0.5, 0.5);
          p.vy += randomBetween(-0.5, 0.5);
          p.vx *= 0.9;
          p.vy *= 0.9;
          break;
        case 'star':
          p.vx += randomBetween(-0.02, 0.02);
          break;
        case 'orb':
          p.size = lerp(p.size, 0, 0.015);
          break;
      }

      // Fade based on life ratio
      const ratio = p.life / p.maxLife;
      p.alpha = ratio < 0.3 ? ratio / 0.3 : 1;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.alpha, 0, 1);

      // Draw trail
      if (p.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.4;
        ctx.globalAlpha = clamp(p.alpha * 0.5, 0, 1);
        ctx.stroke();
        ctx.globalAlpha = clamp(p.alpha, 0, 1);
      }

      switch (p.type) {
        case 'spark':
        case 'electric': {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case 'fire': {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'orb': {
          ctx.shadowBlur = 20;
          ctx.shadowColor = p.color;
          const grad2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad2.addColorStop(0, '#ffffff');
          grad2.addColorStop(0.5, p.color);
          grad2.addColorStop(1, 'transparent');
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        }
        case 'star': {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          this.drawStar(ctx, 0, 0, 4, p.size, p.size * 0.4);
          ctx.restore();
          break;
        }
        default: {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    spikes: number, outerR: number, innerR: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  }

  get count(): number { return this.particles.length; }
}
