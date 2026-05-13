import type { PoseLandmarks } from '../mediapipe/PoseTracker';
import { POSE_CONNECTIONS } from '../mediapipe/PoseTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { GlowRenderer } from '../effects/GlowRenderer';
import { landmarkToCanvas, randomBetween } from '../utils/mathUtils';

export class AuraPower {
  private particles = new ParticleSystem();
  private phase = 0;
  private intensity = 0;
  private auraRadius = 0;
  private colorCycle = 0;

  update(dt: number, pose: PoseLandmarks, canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.colorCycle += dt * 0.5;
    this.intensity = Math.min(1, this.intensity + dt * 1.5);
    this.particles.update(dt);

    if (pose.length === 0) return;

    // Body center
    const torso = pose[23] ? landmarkToCanvas(pose[23], canvasW, canvasH) : null;
    const shoulder = pose[11] ? landmarkToCanvas(pose[11], canvasW, canvasH) : null;
    if (!torso || !shoulder) return;

    const cx = torso.x;
    const cy = (torso.y + shoulder.y) / 2;
    this.auraRadius = Math.max(80, Math.min(200, Math.abs(torso.y - shoulder.y) * 2));

    // Floating particles around body
    const colors = ['#00ff88', '#00ffcc', '#00ddff', '#88ff00'];
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = this.auraRadius * randomBetween(0.6, 1.3);
      this.particles.spawn({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: randomBetween(-0.5, 0.5),
        vy: randomBetween(-2, -0.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'star',
        size: randomBetween(2, 5),
        maxLife: randomBetween(0.8, 2),
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: randomBetween(-2, 2),
      });
    }

    // Spawn particles along skeleton joints
    const joints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    for (const j of joints) {
      if (!pose[j]) continue;
      if (Math.random() > 0.85) {
        const lm = landmarkToCanvas(pose[j], canvasW, canvasH);
        this.particles.spawnEnergyOrb(
          lm.x + randomBetween(-10, 10),
          lm.y + randomBetween(-10, 10),
          '#00ff88'
        );
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, pose: PoseLandmarks, canvasW: number, canvasH: number): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;

    if (pose.length > 0) {
      const mappedPose = pose.map((lm) => landmarkToCanvas(lm, canvasW, canvasH));

      // Body outline glow
      GlowRenderer.drawBodyOutline(
        ctx, mappedPose, POSE_CONNECTIONS,
        `hsl(${150 + Math.sin(this.colorCycle) * 40}, 100%, 60%)`,
        25, 4
      );

      // Second glow pass (outer aura)
      GlowRenderer.drawBodyOutline(
        ctx, mappedPose, POSE_CONNECTIONS,
        `hsl(${150 + Math.sin(this.colorCycle + 1) * 40}, 80%, 70%)`,
        50, 2
      );

      // Joint orbs
      const keyJoints = [0, 11, 12, 15, 16, 23, 24];
      for (const j of keyJoints) {
        if (!pose[j] || !mappedPose[j]) continue;
        const pulse = 0.7 + 0.3 * Math.sin(this.phase * 3 + j);
        const r = 8 * pulse;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff88';
        const grad = ctx.createRadialGradient(
          mappedPose[j].x, mappedPose[j].y, 0,
          mappedPose[j].x, mappedPose[j].y, r
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#00ff88');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mappedPose[j].x, mappedPose[j].y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // Body center aura ring
      if (pose[23]) {
        const torso = mappedPose[23];
        for (let ring = 0; ring < 3; ring++) {
          const r = this.auraRadius * (0.7 + ring * 0.2);
          const alpha = (0.5 - ring * 0.15) * (0.7 + 0.3 * Math.sin(this.phase * 2 + ring));
          ctx.beginPath();
          ctx.arc(torso.x, torso.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
          ctx.lineWidth = 2 - ring * 0.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00ff88';
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
  }
}
