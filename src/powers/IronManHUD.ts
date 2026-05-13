import type { PoseLandmarks } from '../mediapipe/PoseTracker';
import { landmarkToCanvas } from '../utils/mathUtils';

interface HUDModule {
  label: string;
  value: string | number;
  x: number;
  y: number;
  color: string;
}

export class IronManHUD {
  private phase = 0;
  private intensity = 0;
  private fps = 0;
  private scanAngle = 0;
  private threatLevel = 0;

  constructor() {
    this.threatLevel = Math.floor(Math.random() * 30) + 10;
  }

  update(dt: number, fps: number): void {
    this.phase += dt;
    this.scanAngle += dt * 2;
    this.intensity = Math.min(1, this.intensity + dt * 3);
    this.fps = fps;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    face: Array<{ x: number; y: number; z: number }>[] | null,
    canvasW: number, canvasH: number
  ): void {
    ctx.save();
    ctx.globalAlpha = this.intensity;
    ctx.font = '11px "Orbitron", monospace';

    const W = canvasW;
    const H = canvasH;
    const cyan = '#00d4ff';
    const red = '#ff2244';
    const gold = '#ffd700';

    // ── Scan line ──────────────────────────────────────────────────────────
    const scanY = (Math.sin(this.phase * 1.5) * 0.5 + 0.5) * H;
    const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.5, 'rgba(0, 212, 255, 0.3)');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 4, W, 8);

    // ── Corner brackets ────────────────────────────────────────────────────
    this.drawCornerBracket(ctx, 20, 20, 30, cyan);
    this.drawCornerBracket(ctx, W - 20, 20, 30, cyan, true, false);
    this.drawCornerBracket(ctx, 20, H - 20, 30, cyan, false, true);
    this.drawCornerBracket(ctx, W - 20, H - 20, 30, cyan, true, true);

    // ── Left data panel ────────────────────────────────────────────────────
    const leftModules: HUDModule[] = [
      { label: 'SYSTEM STATUS', value: 'ONLINE', x: 25, y: 80, color: '#00ff88' },
      { label: 'POWER LEVEL', value: '94%', x: 25, y: 110, color: cyan },
      { label: 'SHIELD INTEGRITY', value: '87%', x: 25, y: 140, color: cyan },
      { label: 'FPS', value: Math.round(this.fps).toString(), x: 25, y: 170, color: gold },
      { label: 'THREAT LEVEL', value: `${this.threatLevel}%`, x: 25, y: 200, color: this.threatLevel > 50 ? red : cyan },
      { label: 'ALTITUDE', value: '0.0m', x: 25, y: 230, color: cyan },
      { label: 'SPEED', value: '0 km/h', x: 25, y: 260, color: cyan },
    ];

    this.drawPanel(ctx, 15, 65, 200, 215, cyan);
    for (const m of leftModules) {
      this.drawDataLine(ctx, m.x, m.y, m.label, String(m.value), m.color);
    }

    // ── Right data panel ───────────────────────────────────────────────────
    const rightModules: HUDModule[] = [
      { label: 'TARGETS', value: face?.length ?? 0, x: W - 225, y: 80, color: red },
      { label: 'AMMO', value: '∞', x: W - 225, y: 110, color: gold },
      { label: 'REPULSORS', value: 'CHARGED', x: W - 225, y: 140, color: cyan },
      { label: 'J.A.R.V.I.S.', value: 'ACTIVE', x: W - 225, y: 170, color: '#00ff88' },
      { label: 'WEAPON SYS', value: 'ARMED', x: W - 225, y: 200, color: red },
      { label: 'FLIGHT MODE', value: 'READY', x: W - 225, y: 230, color: cyan },
    ];

    this.drawPanel(ctx, W - 215, 65, 200, 185, cyan);
    for (const m of rightModules) {
      this.drawDataLine(ctx, m.x, m.y, m.label, String(m.value), m.color);
    }

    // ── Center targeting reticle ───────────────────────────────────────────
    const cx = W / 2;
    const cy = H / 2;

    // Main targeting circle
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 212, 255, 0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rotating targeting segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.scanAngle);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, 60, a + 0.1, a + Math.PI / 2 - 0.1);
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = cyan;
      ctx.stroke();
    }
    ctx.restore();

    // Crosshair
    ctx.strokeStyle = `rgba(0, 212, 255, 0.6)`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy); ctx.lineTo(cx - 65, cy);
    ctx.moveTo(cx + 65, cy); ctx.lineTo(cx + 80, cy);
    ctx.moveTo(cx, cy - 80); ctx.lineTo(cx, cy - 65);
    ctx.moveTo(cx, cy + 65); ctx.lineTo(cx, cy + 80);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = cyan;
    ctx.shadowBlur = 10;
    ctx.shadowColor = cyan;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Face tracking box ──────────────────────────────────────────────────
    if (face?.length) {
      const fl = face[0];
      // Get bounding box of face landmarks
      const xs = fl.map((p) => (1 - p.x) * canvasW);
      const ys = fl.map((p) => p.y * canvasH);
      const minX = Math.min(...xs) - 20;
      const maxX = Math.max(...xs) + 20;
      const minY = Math.min(...ys) - 20;
      const maxY = Math.max(...ys) + 20;
      const fw = maxX - minX;
      const fh = maxY - minY;

      ctx.strokeStyle = red;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = red;
      this.drawCornerBracket(ctx, minX, minY, 20, red);
      this.drawCornerBracket(ctx, maxX, minY, 20, red, true, false);
      this.drawCornerBracket(ctx, minX, maxY, 20, red, false, true);
      this.drawCornerBracket(ctx, maxX, maxY, 20, red, true, true);

      ctx.font = '9px "Orbitron", monospace';
      ctx.fillStyle = red;
      ctx.fillText('TARGET LOCKED', minX, minY - 8);
      ctx.shadowBlur = 0;
    }

    // ── Bottom status bar ──────────────────────────────────────────────────
    ctx.font = '10px "Orbitron", monospace';
    const timeStr = new Date().toLocaleTimeString();
    ctx.fillStyle = `rgba(0, 212, 255, 0.7)`;
    ctx.fillText(`STARK INDUSTRIES // MARK L // ${timeStr}`, cx - 150, H - 25);

    // Progress bars
    this.drawProgressBar(ctx, 25, H - 50, 120, 6, 0.94, '#00ff88', 'POWER');
    this.drawProgressBar(ctx, 25, H - 35, 120, 6, 0.87, cyan, 'SHIELD');

    ctx.restore();
  }

  private drawCornerBracket(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number, color: string,
    flipX = false, flipY = false
  ): void {
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(x + sx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * size);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  private drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, color: string
  ): void {
    ctx.strokeStyle = `rgba(0, 212, 255, 0.2)`;
    ctx.fillStyle = 'rgba(0, 20, 50, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();
  }

  private drawDataLine(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    label: string, value: string, color: string
  ): void {
    ctx.font = '9px "Rajdhani", sans-serif';
    ctx.fillStyle = 'rgba(180, 200, 255, 0.5)';
    ctx.fillText(label, x, y);
    ctx.font = '11px "Orbitron", monospace';
    ctx.fillStyle = color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = color;
    ctx.fillText(value, x + 130, y);
    ctx.shadowBlur = 0;
  }

  private drawProgressBar(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    ratio: number, color: string, label: string
  ): void {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.shadowBlur = 0;
    ctx.font = '8px "Orbitron", monospace';
    ctx.fillStyle = color;
    ctx.fillText(label, x + w + 5, y + h);
  }

  reset(): void {
    this.intensity = 0;
  }
}
