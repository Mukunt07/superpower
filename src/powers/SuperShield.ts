import type { PoseLandmarks } from '../mediapipe/PoseTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { GlowRenderer } from '../effects/GlowRenderer';
import { LightningRenderer } from '../effects/GlowRenderer';
import { landmarkToCanvas } from '../utils/mathUtils';

export class SuperShield {
  private particles = new ParticleSystem();
  private phase = 0;
  private intensity = 0;
  private shieldRadius = 0;
  private hexAngle = 0;

  update(dt: number, pose: PoseLandmarks, canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.hexAngle += dt * 0.3;
    this.intensity = Math.min(1, this.intensity + dt * 2);
    this.particles.update(dt);

    const cx = canvasW / 2;
    const cy = canvasH * 0.5;

    if (pose.length > 11) {
      const shoulderL = landmarkToCanvas(pose[11], canvasW, canvasH);
      const shoulderR = landmarkToCanvas(pose[12], canvasW, canvasH);
      const shoulders = Math.abs(shoulderL.x - shoulderR.x);
      this.shieldRadius = Math.max(100, Math.min(250, shoulders * 1.8));
    } else {
      this.shieldRadius = Math.min(200, this.shieldRadius + dt * 100);
    }

    // Electric particles on shield edge
    if (Math.random() > 0.4) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.spawnElectricArc(
        cx + Math.cos(angle) * this.shieldRadius,
        cy + Math.sin(angle) * this.shieldRadius,
        '#3b82f6'
      );
    }
  }

  draw(ctx: CanvasRenderingContext2D, pose: PoseLandmarks, canvasW: number, canvasH: number): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;

    let cx = canvasW / 2;
    let cy = canvasH * 0.5;

    if (pose.length > 24) {
      const torsoL = landmarkToCanvas(pose[23], canvasW, canvasH);
      const torsoR = landmarkToCanvas(pose[24], canvasW, canvasH);
      const shoulderL = landmarkToCanvas(pose[11], canvasW, canvasH);
      cx = (torsoL.x + torsoR.x) / 2;
      cy = (torsoL.y + shoulderL.y) / 2;
    }

    const r = this.shieldRadius;

    // Hex grid shield face
    GlowRenderer.drawHexGrid(ctx, cx, cy, r * 0.9, '#3b82f6', 4);

    // Shield fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(59, 130, 246, ${0.8 + 0.2 * Math.sin(this.phase * 4)})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner ring
    const pulse = 0.7 + 0.3 * Math.sin(this.phase * 3);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Electric arcs on edge
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.hexAngle);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;
      const ex = Math.cos(angle + 0.5) * r;
      const ey = Math.sin(angle + 0.5) * r;
      LightningRenderer.drawBolt(ctx, sx, sy, ex, ey, '#93c5fd', 1.5, 3, 0.2);
    }
    ctx.restore();

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.shieldRadius = 0;
  }
}
