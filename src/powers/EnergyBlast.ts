import type { HandLandmarks } from '../mediapipe/HandTracker';
import { ParticleSystem } from '../effects/ParticleSystem';
import { landmarkToCanvas, randomBetween } from '../utils/mathUtils';

export class EnergyBlast {
  private particles = new ParticleSystem();
  private phase = 0;
  private beamLength = 0;
  private intensity = 0;
  private shakeX = 0;
  private shakeY = 0;

  update(dt: number, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    this.phase += dt;
    this.intensity = Math.min(1, this.intensity + dt * 3);
    this.beamLength = Math.min(canvasW * 0.7, this.beamLength + dt * 500);

    // Camera shake simulation
    this.shakeX = (Math.random() - 0.5) * 8 * this.intensity;
    this.shakeY = (Math.random() - 0.5) * 8 * this.intensity;

    const hand = hands[0];
    if (!hand) { this.particles.update(dt); return; }

    const fist = landmarkToCanvas(hand[9], canvasW, canvasH);
    const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);

    // Beam direction (fist to left = energy goes right)
    const dx = fist.x - wrist.x;
    const dy = fist.y - wrist.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ndx = dx / len;
    const ndy = dy / len;

    // Core beam particles
    for (let d = 0; d < this.beamLength; d += 20) {
      if (Math.random() > 0.4) {
        this.particles.spawn({
          x: fist.x + ndx * d + randomBetween(-8, 8),
          y: fist.y + ndy * d + randomBetween(-8, 8),
          vx: ndx * randomBetween(2, 5),
          vy: ndy * randomBetween(2, 5),
          color: Math.random() > 0.5 ? '#00d4ff' : '#ffffff',
          type: 'spark',
          size: randomBetween(3, 8),
          maxLife: randomBetween(0.1, 0.3),
          trailLength: 4,
        });
      }
    }

    // Impact burst at end
    if (Math.random() > 0.5) {
      const ix = fist.x + ndx * this.beamLength;
      const iy = fist.y + ndy * this.beamLength;
      this.particles.spawnSparkBurst(ix, iy, 5, '#00d4ff', 5);
      this.particles.spawnEnergyOrb(ix, iy, '#ffffff');
    }

    this.particles.update(dt);
  }

  draw(ctx: CanvasRenderingContext2D, hands: HandLandmarks[], canvasW: number, canvasH: number): void {
    if (!hands[0]) return;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    ctx.globalAlpha = this.intensity;

    const hand = hands[0];
    const fist = landmarkToCanvas(hand[9], canvasW, canvasH);
    const wrist = landmarkToCanvas(hand[0], canvasW, canvasH);
    const dx = fist.x - wrist.x;
    const dy = fist.y - wrist.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ndx = dx / len;
    const ndy = dy / len;
    const endX = fist.x + ndx * this.beamLength;
    const endY = fist.y + ndy * this.beamLength;

    // Wide outer beam
    ctx.beginPath();
    ctx.moveTo(fist.x, fist.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    ctx.lineWidth = 40;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#00d4ff';
    ctx.stroke();

    // Mid beam
    ctx.beginPath();
    ctx.moveTo(fist.x, fist.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 12;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Core white beam
    ctx.beginPath();
    ctx.moveTo(fist.x, fist.y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fist charge glow
    const chargeGrad = ctx.createRadialGradient(fist.x, fist.y, 0, fist.x, fist.y, 40);
    chargeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    chargeGrad.addColorStop(0.5, 'rgba(0, 212, 255, 0.4)');
    chargeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = chargeGrad;
    ctx.beginPath();
    ctx.arc(fist.x, fist.y, 40, 0, Math.PI * 2);
    ctx.fill();

    this.particles.render(ctx);
    ctx.restore();
  }

  reset(): void {
    this.intensity = 0;
    this.beamLength = 0;
  }
}
