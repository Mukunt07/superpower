import { randomBetween } from '../utils/mathUtils';

/**
 * Fractal lightning renderer using recursive subdivision
 */
export class LightningRenderer {
  static drawBolt(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    color: string,
    width = 2,
    depth = 3,
    spread = 0.4
  ): void {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      return;
    }

    const mx = (x1 + x2) / 2 + randomBetween(-spread * 100, spread * 100);
    const my = (y1 + y2) / 2 + randomBetween(-spread * 30, spread * 30);

    LightningRenderer.drawBolt(ctx, x1, y1, mx, my, color, width, depth - 1, spread);
    LightningRenderer.drawBolt(ctx, mx, my, x2, y2, color, width, depth - 1, spread);

    // Branch
    if (depth > 2 && Math.random() > 0.6) {
      const bx = mx + randomBetween(-80, 80);
      const by = my + randomBetween(20, 80);
      LightningRenderer.drawBolt(ctx, mx, my, bx, by, color, width * 0.4, depth - 2, spread * 0.7);
    }
  }

  static drawArc(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    color: string
  ): void {
    const count = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const ex = cx + Math.cos(angle) * radius;
      const ey = cy + Math.sin(angle) * radius;
      LightningRenderer.drawBolt(ctx, cx, cy, ex, ey, color, 1, 3, 0.3);
    }
  }
}

/**
 * Draw glowing Doctor Strange rune ring
 */
export class RuneAnimator {
  private angle = 0;
  private angle2 = 0;

  update(dt: number): void {
    this.angle += dt * 1.8;
    this.angle2 -= dt * 0.9;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    color: string = '#ff6a00'
  ): void {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Outer glow pass
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Rotating rune segments
    ctx.rotate(this.angle);
    this.drawRuneSegments(ctx, radius, color, 8);
    ctx.rotate(-this.angle * 2);
    this.drawRuneSegments(ctx, radius * 0.75, '#ffaa00', 6);

    // Inner glyph
    ctx.rotate(this.angle2);
    this.drawSriYantra(ctx, radius * 0.45, color);

    ctx.restore();
  }

  private drawRuneSegments(
    ctx: CanvasRenderingContext2D,
    r: number, color: string, count: number
  ): void {
    const gap = 0.15;
    for (let i = 0; i < count; i++) {
      const startAngle = (i / count) * Math.PI * 2 + gap;
      const endAngle = ((i + 1) / count) * Math.PI * 2 - gap;

      ctx.beginPath();
      ctx.arc(0, 0, r, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Tick marks
      const midAngle = (startAngle + endAngle) / 2;
      const innerR = r - 10;
      ctx.beginPath();
      ctx.moveTo(Math.cos(midAngle) * r, Math.sin(midAngle) * r);
      ctx.lineTo(Math.cos(midAngle) * innerR, Math.sin(midAngle) * innerR);
      ctx.stroke();
    }
  }

  private drawSriYantra(
    ctx: CanvasRenderingContext2D,
    r: number, color: string
  ): void {
    // Draw triangle pattern
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Upward triangle
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
    ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
    ctx.closePath();
    ctx.stroke();

    // Downward triangle
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6));
    ctx.lineTo(-r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6));
    ctx.closePath();
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/**
 * Glowing body outline renderer
 */
export class GlowRenderer {
  static drawBodyOutline(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number }>,
    connections: [number, number][],
    color: string,
    lineWidth = 3
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    // Fast glow: Draw multiple lines with increasing width and decreasing alpha
    const passes = 3;
    for (let i = passes; i > 0; i--) {
      ctx.globalAlpha = 0.2 / i;
      ctx.lineWidth = lineWidth + (i * 8);
      
      ctx.beginPath();
      for (const [a, b] of connections) {
        if (!landmarks[a] || !landmarks[b]) continue;
        ctx.moveTo(landmarks[a].x, landmarks[a].y);
        ctx.lineTo(landmarks[b].x, landmarks[b].y);
      }
      ctx.stroke();
    }

    // Core line
    ctx.globalAlpha = 1;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (const [a, b] of connections) {
      if (!landmarks[a] || !landmarks[b]) continue;
      ctx.moveTo(landmarks[a].x, landmarks[a].y);
      ctx.lineTo(landmarks[b].x, landmarks[b].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  static drawGlowCircle(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, radius: number,
    color: string, alpha = 1
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 30;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  static drawHexGrid(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, radius: number,
    color: string, rings = 3
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    const hexR = radius / (rings * 2);
    for (let q = -rings; q <= rings; q++) {
      for (let r = -rings; r <= rings; r++) {
        const s = -q - r;
        if (Math.abs(s) > rings) continue;
        const hx = cx + hexR * (3 / 2) * q;
        const hy = cy + hexR * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        if (Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2) > radius) continue;
        this.drawHex(ctx, hx, hy, hexR * 0.9);
      }
    }
    ctx.restore();
  }

  private static drawHex(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, r: number
  ): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = degToRad(60 * i - 30);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
