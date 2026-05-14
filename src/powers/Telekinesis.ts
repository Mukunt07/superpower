import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { landmarkToCanvas, randomBetween, lerp, dist2D } from '../utils/mathUtils';

interface TelekinesisOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  grabbed: boolean;
  id: number;
  trail: Array<{ x: number; y: number }>;
}

let orbId = 0;

export class Telekinesis {
  private particles = new ParticleSystem();
  private orbs: TelekinesisOrb[] = [];
  private phase = 0;
  private intensity = 0;

  constructor(canvasW: number, canvasH: number) {
    // Spawn initial orbs
    for (let i = 0; i < 5; i++) {
      this.orbs.push({
        x: randomBetween(canvasW * 0.1, canvasW * 0.9),
        y: randomBetween(canvasH * 0.1, canvasH * 0.7),
        vx: randomBetween(-1, 1),
        vy: randomBetween(-1, 1),
        targetX: canvasW / 2,
        targetY: canvasH / 2,
        grabbed: false,
        id: orbId++,
        trail: [],
      });
    }
  }

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.intensity = Math.min(1, this.intensity + dt * 2);
    this.particles.update(dt);

    const pinchPoints: Array<{ x: number; y: number }> = [];
    for (const hand of hands) {
      const thumb = landmarkToCanvas(hand[4], canvasW, canvasH);
      const index = landmarkToCanvas(hand[8], canvasW, canvasH);
      pinchPoints.push({
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2
      });
    }

    for (const orb of this.orbs) {
      // Update trail
      orb.trail.unshift({ x: orb.x, y: orb.y });
      if (orb.trail.length > 15) orb.trail.pop();

      let target: { x: number; y: number } | null = null;
      let minDist = 120;

      // Find nearest pinch point
      for (const pt of pinchPoints) {
        const d = dist2D({ x: orb.x, y: orb.y }, pt);
        if (d < minDist) {
          minDist = d;
          target = pt;
          orb.grabbed = true;
        }
      }

      if (target && orb.grabbed) {
        // Spring to target pinch point
        const fx = (target.x - orb.x) * 0.18;
        const fy = (target.y - orb.y) * 0.18;
        orb.vx = lerp(orb.vx, fx, 0.25);
        orb.vy = lerp(orb.vy, fy, 0.25);
        
        // Energy particles flow towards hand
        if (Math.random() > 0.6) {
          const t = Math.random();
          this.particles.spawn({
            x: lerp(orb.x, target.x, t) + randomBetween(-5, 5),
            y: lerp(orb.y, target.y, t) + randomBetween(-5, 5),
            vx: randomBetween(-0.5, 0.5),
            vy: randomBetween(-1, -0.2),
            color: '#8b5cf6',
            type: 'energy',
            size: randomBetween(1, 3),
            maxLife: 0.2,
          });
        }
      } else {
        orb.grabbed = false;
        // Natural floating physics
        orb.vx += Math.sin(this.phase * 0.8 + orb.id) * 0.08;
        orb.vy += Math.cos(this.phase * 0.6 + orb.id) * 0.08;
        orb.vx *= 0.98;
        orb.vy *= 0.98;
      }

      orb.x += orb.vx;
      orb.y += orb.vy;

      // Boundary bounce
      if (orb.x < 30 || orb.x > canvasW - 30) orb.vx *= -0.7;
      if (orb.y < 30 || orb.y > canvasH - 30) orb.vy *= -0.7;
      orb.x = Math.max(30, Math.min(canvasW - 30, orb.x));
      orb.y = Math.max(30, Math.min(canvasH - 30, orb.y));

      // Realistic purple energy aura
      if (orb.grabbed && Math.random() > 0.4) {
        this.particles.spawn({
          x: orb.x + randomBetween(-20, 20),
          y: orb.y + randomBetween(-20, 20),
          vx: randomBetween(-1, 1),
          vy: randomBetween(-2, -0.5),
          color: Math.random() > 0.5 ? '#a78bfa' : '#8b5cf6',
          type: 'spark',
          size: randomBetween(2, 6),
          maxLife: randomBetween(0.4, 1.2),
          trailLength: 6,
        });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;

    const pinchPoints: Array<{ x: number; y: number }> = [];
    for (const hand of hands) {
      const thumb = landmarkToCanvas(hand[4], canvasW, canvasH);
      const index = landmarkToCanvas(hand[8], canvasW, canvasH);
      pinchPoints.push({
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2
      });
    }

    for (const orb of this.orbs) {
      // 1. Draw trail with realistic fade
      if (orb.trail.length > 3) {
        ctx.beginPath();
        ctx.moveTo(orb.trail[0].x, orb.trail[0].y);
        for (let i = 1; i < orb.trail.length; i++) {
          ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
        }
        ctx.strokeStyle = `rgba(139, 92, 246, ${orb.grabbed ? 0.4 : 0.2})`;
        ctx.lineWidth = orb.grabbed ? 8 : 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 2. Realistic Orb Rendering
      const r = orb.grabbed ? 26 : 18;
      const pulse = 0.85 + 0.15 * Math.sin(this.phase * 4 + orb.id);
      
      // Outer glow
      ctx.fillStyle = orb.grabbed ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main core
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * pulse);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, '#c4b5fd');
      orbGrad.addColorStop(0.7, '#8b5cf6');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Hand pinch glows
    for (const pt of pinchPoints) {
      const pinchGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 50);
      pinchGrad.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
      pinchGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.2)');
      pinchGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pinchGrad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 50, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    for (const orb of this.orbs) {
      orb.grabbed = false;
    }
  }
}
