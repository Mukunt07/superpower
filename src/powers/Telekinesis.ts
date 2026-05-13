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

    const hand = hands[0];
    let pinchX = canvasW / 2;
    let pinchY = canvasH / 2;

    if (hand) {
      const thumb = landmarkToCanvas(hand[4], canvasW, canvasH);
      const index = landmarkToCanvas(hand[8], canvasW, canvasH);
      pinchX = (thumb.x + index.x) / 2;
      pinchY = (thumb.y + index.y) / 2;
    }

    for (const orb of this.orbs) {
      // Update trail
      orb.trail.unshift({ x: orb.x, y: orb.y });
      if (orb.trail.length > 12) orb.trail.pop();

      const dToPinch = dist2D({ x: orb.x, y: orb.y }, { x: pinchX, y: pinchY });

      // Grab nearest orb
      if (dToPinch < 80) {
        orb.grabbed = true;
      }

      if (orb.grabbed) {
        // Spring to pinch point
        const fx = (pinchX - orb.x) * 0.15;
        const fy = (pinchY - orb.y) * 0.15;
        orb.vx = lerp(orb.vx, fx, 0.2);
        orb.vy = lerp(orb.vy, fy, 0.2);
      } else {
        // Float around
        orb.vx += Math.sin(this.phase + orb.id) * 0.05;
        orb.vy += Math.cos(this.phase * 0.7 + orb.id) * 0.05;
        orb.vx *= 0.97;
        orb.vy *= 0.97;
      }

      orb.x += orb.vx;
      orb.y += orb.vy;

      // Boundary bounce
      if (orb.x < 20 || orb.x > canvasW - 20) orb.vx *= -0.8;
      if (orb.y < 20 || orb.y > canvasH - 20) orb.vy *= -0.8;
      orb.x = Math.max(20, Math.min(canvasW - 20, orb.x));
      orb.y = Math.max(20, Math.min(canvasH - 20, orb.y));

      // Purple energy particles from grabbed orbs
      if (orb.grabbed && Math.random() > 0.5) {
        this.particles.spawn({
          x: orb.x + randomBetween(-15, 15),
          y: orb.y + randomBetween(-15, 15),
          vx: randomBetween(-1, 1),
          vy: randomBetween(-2, -0.5),
          color: Math.random() > 0.5 ? '#8b5cf6' : '#a78bfa',
          type: 'spark',
          size: randomBetween(2, 5),
          maxLife: randomBetween(0.3, 0.8),
          trailLength: 5,
        });
      }

      // Connection beam to hand
      if (orb.grabbed && Math.random() > 0.7) {
        const t = Math.random();
        this.particles.spawn({
          x: lerp(orb.x, pinchX, t),
          y: lerp(orb.y, pinchY, t),
          vx: randomBetween(-0.5, 0.5),
          vy: randomBetween(-0.5, 0.5),
          color: '#8b5cf6',
          type: 'energy',
          size: randomBetween(1.5, 3),
          maxLife: 0.15,
        });
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;

    let pinchX = canvasW / 2;
    let pinchY = canvasH / 2;
    if (hands[0]) {
      const thumb = landmarkToCanvas(hands[0][4], canvasW, canvasH);
      const index = landmarkToCanvas(hands[0][8], canvasW, canvasH);
      pinchX = (thumb.x + index.x) / 2;
      pinchY = (thumb.y + index.y) / 2;
    }

    for (const orb of this.orbs) {
      // Draw trail
      if (orb.trail.length > 2) {
        ctx.beginPath();
        ctx.moveTo(orb.trail[0].x, orb.trail[0].y);
        for (let i = 1; i < orb.trail.length; i++) {
          ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Draw connection line to hand
      if (orb.grabbed) {
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(orb.x, orb.y);
        ctx.lineTo(pinchX, pinchY);
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Orb glow
      const r = orb.grabbed ? 22 : 15;
      const pulse = 0.8 + 0.2 * Math.sin(this.phase * 3 + orb.id);
      const orbGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * pulse);
      orbGrad.addColorStop(0, orb.grabbed ? '#ffffff' : '#c4b5fd');
      orbGrad.addColorStop(0.4, orb.grabbed ? '#8b5cf6' : '#7c3aed');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.shadowBlur = orb.grabbed ? 30 : 15;
      ctx.shadowColor = '#8b5cf6';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // Hand pinch glow
    const pinchGrad = ctx.createRadialGradient(pinchX, pinchY, 0, pinchX, pinchY, 30);
    pinchGrad.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
    pinchGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = pinchGrad;
    ctx.beginPath();
    ctx.arc(pinchX, pinchY, 30, 0, Math.PI * 2);
    ctx.fill();

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
