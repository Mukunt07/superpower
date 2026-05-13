import type { HandLandmarks } from '../mediapipe/HandTracker';
import type { PoseLandmarks } from '../mediapipe/PoseTracker';
import { dist3D, dist2D } from '../utils/mathUtils';
import type { GestureType, PowerType } from '../store/useStore';

// MediaPipe hand landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const RING_MCP = 13;
const PINKY_MCP = 17;
const INDEX_PIP = 6;
const MIDDLE_PIP = 10;
const RING_PIP = 14;
const PINKY_PIP = 18;

// Circular motion tracker
const CIRCLE_HISTORY_SIZE = 60;

interface CircleMotionTracker {
  points: Array<{ x: number; y: number; t: number }>;
}

export class GestureClassifier {
  private circleTracker: CircleMotionTracker = { points: [] };
  private gestureHistory: GestureType[] = [];
  private readonly HISTORY_SIZE = 8;

  classify(
    hands: HandLandmarks[],
    pose: PoseLandmarks
  ): { gesture: GestureType; power: PowerType; confidence: number } {
    if (hands.length === 0 && pose.length === 0) {
      return { gesture: 'none', power: 'none', confidence: 0 };
    }

    const hand = hands[0] ?? null;

    // Update circle motion tracker
    if (hand) {
      const tip = hand[INDEX_TIP];
      this.circleTracker.points.push({ x: tip.x, y: tip.y, t: Date.now() });
      if (this.circleTracker.points.length > CIRCLE_HISTORY_SIZE) {
        this.circleTracker.points.shift();
      }
    }

    // ── Gesture detection ─────────────────────────────────────────────────────

    let gesture: GestureType = 'none';
    let confidence = 0;

    if (hand) {
      const openPalm = this.detectOpenPalm(hand);
      const fist = this.detectFist(hand);
      const pinch = this.detectPinch(hand);
      const victory = this.detectVictory(hand);
      const circle = this.detectCircleMotion();

      if (circle > 0.7) {
        gesture = 'circle-motion';
        confidence = circle;
      } else if (openPalm > 0.7) {
        gesture = 'open-palm';
        confidence = openPalm;
      } else if (fist > 0.7) {
        gesture = 'fist';
        confidence = fist;
      } else if (pinch > 0.8) {
        gesture = 'pinch';
        confidence = pinch;
      } else if (victory > 0.8) {
        gesture = 'victory';
        confidence = victory;
      }
    }

    if (gesture === 'none' && pose.length > 0) {
      const raiseArm = this.detectRaiseArm(pose);
      const crossArms = this.detectCrossArms(pose);
      const meditation = this.detectMeditation(pose);

      if (raiseArm > 0.7) {
        gesture = 'raise-arm';
        confidence = raiseArm;
      } else if (crossArms > 0.7) {
        gesture = 'cross-arms';
        confidence = crossArms;
      } else if (meditation > 0.7) {
        gesture = 'meditation';
        confidence = meditation;
      }
    }

    // Smooth gesture with history
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > this.HISTORY_SIZE) {
      this.gestureHistory.shift();
    }
    const smoothedGesture = this.smoothGesture();
    const power = this.gestureToPower(smoothedGesture);

    return { gesture: smoothedGesture, power, confidence };
  }

  // ── Individual gesture detectors ──────────────────────────────────────────

  private detectOpenPalm(lm: HandLandmarks): number {
    if (lm.length < 21) return 0;
    // Check all 4 fingers extended
    const wrist = lm[WRIST];
    const fingers = [
      { tip: lm[INDEX_TIP], pip: lm[INDEX_PIP], mcp: lm[INDEX_MCP] },
      { tip: lm[MIDDLE_TIP], pip: lm[MIDDLE_PIP], mcp: lm[MIDDLE_MCP] },
      { tip: lm[RING_TIP], pip: lm[RING_PIP], mcp: lm[RING_MCP] },
      { tip: lm[PINKY_TIP], pip: lm[PINKY_PIP], mcp: lm[PINKY_MCP] },
    ];

    let extended = 0;
    for (const f of fingers) {
      // Tip should be farther from wrist than PIP
      const tipDist = dist3D(f.tip, wrist);
      const pipDist = dist3D(f.pip, wrist);
      if (tipDist > pipDist * 1.1) extended++;
    }

    // Thumb check
    const thumbDist = dist3D(lm[THUMB_TIP], lm[INDEX_MCP]);
    const thumbExtended = thumbDist > 0.05 ? 1 : 0;

    return (extended + thumbExtended) / 5;
  }

  private detectFist(lm: HandLandmarks): number {
    if (lm.length < 21) return 0;
    const wrist = lm[WRIST];
    const fingers = [
      { tip: lm[INDEX_TIP], pip: lm[INDEX_PIP] },
      { tip: lm[MIDDLE_TIP], pip: lm[MIDDLE_PIP] },
      { tip: lm[RING_TIP], pip: lm[RING_PIP] },
      { tip: lm[PINKY_TIP], pip: lm[PINKY_PIP] },
    ];

    let curled = 0;
    for (const f of fingers) {
      const tipDist = dist3D(f.tip, wrist);
      const pipDist = dist3D(f.pip, wrist);
      if (tipDist < pipDist * 1.05) curled++;
    }
    return curled / 4;
  }

  private detectPinch(lm: HandLandmarks): number {
    if (lm.length < 21) return 0;
    const d = dist3D(lm[THUMB_TIP], lm[INDEX_TIP]);
    // Pinch when thumb and index are very close
    const pinchScore = Math.max(0, 1 - d / 0.07);
    return pinchScore;
  }

  private detectVictory(lm: HandLandmarks): number {
    if (lm.length < 21) return 0;
    const wrist = lm[WRIST];

    const indexExtended =
      dist3D(lm[INDEX_TIP], wrist) > dist3D(lm[INDEX_PIP], wrist) * 1.1;
    const middleExtended =
      dist3D(lm[MIDDLE_TIP], wrist) > dist3D(lm[MIDDLE_PIP], wrist) * 1.1;
    const ringCurled =
      dist3D(lm[RING_TIP], wrist) < dist3D(lm[RING_PIP], wrist) * 1.05;
    const pinkyCurled =
      dist3D(lm[PINKY_TIP], wrist) < dist3D(lm[PINKY_PIP], wrist) * 1.05;

    let score = 0;
    if (indexExtended) score += 0.3;
    if (middleExtended) score += 0.3;
    if (ringCurled) score += 0.2;
    if (pinkyCurled) score += 0.2;
    return score;
  }

  private detectCircleMotion(): number {
    const pts = this.circleTracker.points;
    if (pts.length < 20) return 0;

    // Check if recent points form a roughly circular path
    const recent = pts.slice(-30);
    const cx = recent.reduce((s, p) => s + p.x, 0) / recent.length;
    const cy = recent.reduce((s, p) => s + p.y, 0) / recent.length;

    const radii = recent.map((p) =>
      dist2D({ x: p.x, y: p.y }, { x: cx, y: cy })
    );
    const avgR = radii.reduce((s, r) => s + r, 0) / radii.length;
    const variance = radii.reduce((s, r) => s + Math.abs(r - avgR), 0) / radii.length;

    if (avgR < 0.04) return 0; // Too small
    const circularity = Math.max(0, 1 - variance / avgR);

    // Check for angular sweep
    const angles = recent.map((p) => Math.atan2(p.y - cy, p.x - cx));
    let totalSweep = 0;
    for (let i = 1; i < angles.length; i++) {
      let da = angles[i] - angles[i - 1];
      if (da > Math.PI) da -= Math.PI * 2;
      if (da < -Math.PI) da += Math.PI * 2;
      totalSweep += Math.abs(da);
    }

    const swept = Math.min(1, totalSweep / (Math.PI * 1.5));
    return circularity * swept;
  }

  // ── Pose-based gestures ────────────────────────────────────────────────────

  private detectRaiseArm(pose: PoseLandmarks): number {
    if (pose.length < 17) return 0;
    const leftWrist = pose[15];
    const rightWrist = pose[16];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];

    const leftRaised = leftWrist && leftShoulder
      ? leftWrist.y < leftShoulder.y - 0.15
      : false;
    const rightRaised = rightWrist && rightShoulder
      ? rightWrist.y < rightShoulder.y - 0.15
      : false;

    if (leftRaised || rightRaised) return 0.9;
    return 0;
  }

  private detectCrossArms(pose: PoseLandmarks): number {
    if (pose.length < 17) return 0;
    const leftWrist = pose[15];
    const rightWrist = pose[16];
    const leftShoulder = pose[11];
    const rightShoulder = pose[12];

    if (!leftWrist || !rightWrist || !leftShoulder || !rightShoulder) return 0;

    // Wrists should be crossing the center line
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const leftCrossed = leftWrist.x > centerX;
    const rightCrossed = rightWrist.x < centerX;

    // Arms at chest level
    const chestY = (leftShoulder.y + rightShoulder.y) / 2 + 0.1;
    const atChest = leftWrist.y > chestY - 0.15 && leftWrist.y < chestY + 0.2;

    if (leftCrossed && rightCrossed && atChest) return 0.9;
    return 0;
  }

  private detectMeditation(pose: PoseLandmarks): number {
    if (pose.length < 25) return 0;
    const leftWrist = pose[15];
    const rightWrist = pose[16];
    const leftHip = pose[23];
    const rightHip = pose[24];

    if (!leftWrist || !rightWrist || !leftHip || !rightHip) return 0;

    // Hands near the lap area (meditation)
    const lapY = (leftHip.y + rightHip.y) / 2;
    const handsLow = leftWrist.y > lapY - 0.15 && rightWrist.y > lapY - 0.15;

    // Hands roughly in center
    const centerX = (leftHip.x + rightHip.x) / 2;
    const handsCenter =
      Math.abs(leftWrist.x - centerX) < 0.25 &&
      Math.abs(rightWrist.x - centerX) < 0.25;

    if (handsLow && handsCenter) return 0.85;
    return 0;
  }

  // ── Gesture smoothing ─────────────────────────────────────────────────────

  private smoothGesture(): GestureType {
    if (this.gestureHistory.length === 0) return 'none';
    const counts: Partial<Record<GestureType, number>> = {};
    for (const g of this.gestureHistory) {
      counts[g] = (counts[g] ?? 0) + 1;
    }
    let best: GestureType = 'none';
    let bestCount = 0;
    for (const [g, c] of Object.entries(counts) as [GestureType, number][]) {
      if (c > bestCount) { best = g; bestCount = c; }
    }
    return best;
  }

  // ── Gesture → Power mapping ───────────────────────────────────────────────

  gestureToPower(gesture: GestureType): PowerType {
    const map: Partial<Record<GestureType, PowerType>> = {
      'open-palm': 'strange-shield',
      'circle-motion': 'strange-portal',
      'fist': 'energy-blast',
      'cross-arms': 'super-shield',
      'raise-arm': 'lightning',
      'pinch': 'telekinesis',
      'meditation': 'aura',
      'victory': 'ironman-hud',
    };
    return map[gesture] ?? 'none';
  }

  voiceCommandToPower(command: string): PowerType | null {
    const lower = command.toLowerCase();
    if (lower.includes('shield') && !lower.includes('super')) return 'strange-shield';
    if (lower.includes('portal')) return 'strange-portal';
    if (lower.includes('hud') || lower.includes('iron man') || lower.includes('ironman')) return 'ironman-hud';
    if (lower.includes('blast') || lower.includes('energy')) return 'energy-blast';
    if (lower.includes('lightning') || lower.includes('thor')) return 'lightning';
    if (lower.includes('telekin')) return 'telekinesis';
    if (lower.includes('aura')) return 'aura';
    if (lower.includes('super shield') || lower.includes('dome')) return 'super-shield';
    if (lower.includes('off') || lower.includes('stop') || lower.includes('deactivate')) return 'none';
    return null;
  }

  resetCircleTracker(): void {
    this.circleTracker.points = [];
  }
}
