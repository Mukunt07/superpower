// ─── Math & Vector Utilities ───────────────────────────────────────────────

export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });
export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export function dist2D(a: Vec2, b: Vec2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function dist3D(a: Vec3, b: Vec3): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function normalize2D(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function dot2D(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function angle2D(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function midpoint2D(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function mapRange(
  v: number, inMin: number, inMax: number,
  outMin: number, outMax: number
): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomSign(): number {
  return Math.random() < 0.5 ? 1 : -1;
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Landmark to canvas pixel coordinate
export function landmarkToCanvas(
  lm: { x: number; y: number },
  canvasW: number,
  canvasH: number,
  flipX = true
): Vec2 {
  return {
    x: flipX ? canvasW - lm.x * canvasW : lm.x * canvasW,
    y: lm.y * canvasH,
  };
}
