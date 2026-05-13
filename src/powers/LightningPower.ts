import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { LightningRenderer } from '../effects/GlowRenderer';
import { landmarkToCanvas, randomBetween } from '../utils/mathUtils';

export class LightningPower {
  private particles = new ParticleSystem();
  private phase = 0;
  private intensity = 0;
  private bolts: Array<{ x1: number; y1: number; x2: number; y2: number; alpha: number }> = [];

  update(dt: number, hands: HandLandmarks[], pose: any[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.intensity = Math.min(1, this.intensity + dt * 1.5);
    this.particles.update(dt);

    // Determine lightning origin: raised hand wrist
    let originX = canvasW / 2;
    let originY = canvasH * 0.3;

    if (hands[0]) {
      const wrist = landmarkToCanvas(hands[0][0], canvasW, canvasH);
      originX = wrist.x;
      originY = wrist.y;
    } else if (pose[15]) {
      const lm = landmarkToCanvas(pose[15], canvasW, canvasH);
      originX = lm.x;
      originY = lm.y;
    }

    // Generate new bolts
    if (Math.random() > 0.3) {
      const targetX = originX + randomBetween(-120, 120);
      this.bolts.push({
        x1: originX,
        y1: originY,
        x2: targetX,
        y2: 0,
        alpha: 1,
      });
    }

    // Ground bolts (downward from hand)
    if (Math.random() > 0.6) {
      this.bolts.push({
        x1: originX,
        y1: originY,
        x2: originX + randomBetween(-60, 60),
        y2: canvasH,
        alpha: 0.5,
      });
    }

    // Fade bolts
    this.bolts = this.bolts
      .map((b) => ({ ...b, alpha: b.alpha - dt * 8 }))
      .filter((b) => b.alpha > 0);

    // Electric particles around hand
    if (Math.random() > 0.4) {
      this.particles.spawnElectricArc(originX, originY, '#4fc3f7');
      this.particles.spawnElectricArc(originX, originY, '#87cefa');
    }

    // Blue aura particles
    if (Math.random() > 0.6) {
      this.particles.spawnSparkBurst(originX, originY, 3, '#4fc3f7', 2);
    }
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], pose: any[], canvasW: number, canvasH: number): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;

    // Draw lightning bolts
    for (const bolt of this.bolts) {
      ctx.globalAlpha = bolt.alpha * this.intensity;
      LightningRenderer.drawBolt(
        ctx,
        bolt.x1, bolt.y1,
        bolt.x2, bolt.y2,
        '#4fc3f7',
        2,
        5,
        0.4
      );
      // White core
      LightningRenderer.drawBolt(
        ctx,
        bolt.x1, bolt.y1,
        bolt.x2, bolt.y2,
        '#ffffff',
        0.8,
        4,
        0.3
      );
    }

    ctx.globalAlpha = this.intensity;

    // Hand aura glow
    let ax = canvasW / 2, ay = canvasH * 0.35;
    if (hands[0]) {
      const lm = landmarkToCanvas(hands[0][0], canvasW, canvasH);
      ax = lm.x; ay = lm.y;
    }

    const auraGrad = ctx.createRadialGradient(ax, ay, 0, ax, ay, 80);
    auraGrad.addColorStop(0, 'rgba(79, 195, 247, 0.4)');
    auraGrad.addColorStop(0.5, 'rgba(79, 195, 247, 0.1)');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(ax, ay, 80, 0, Math.PI * 2);
    ctx.fill();

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.bolts = [];
  }
}
