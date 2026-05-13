import { HandTracker } from '../mediapipe/HandTracker';
import { PoseTracker } from '../mediapipe/PoseTracker';
import { FaceTracker } from '../mediapipe/FaceTracker';
import { GestureClassifier } from '../core/GestureClassifier';
import { StrangeShield } from '../powers/StrangeShield';
import { StrangePortal } from '../powers/StrangePortal';
import { IronManHUD } from '../powers/IronManHUD';
import { EnergyBlast } from '../powers/EnergyBlast';
import { LightningPower } from '../powers/LightningPower';
import { Telekinesis } from '../powers/Telekinesis';
import { AuraPower } from '../powers/AuraPower';
import { SuperShield } from '../powers/SuperShield';
import type { PowerType } from '../store/useStore';

export interface EngineCallbacks {
  onGestureChange: (gesture: string, power: PowerType, confidence: number) => void;
  onHandLandmarks: (landmarks: any[][]) => void;
  onPoseLandmarks: (landmarks: any[]) => void;
  onFaceLandmarks: (landmarks: any[][]) => void;
  onFpsUpdate: (fps: number) => void;
}

export class CameraEngine {
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  private handTracker = new HandTracker();
  private poseTracker = new PoseTracker();
  private faceTracker = new FaceTracker();
  private gestureClassifier = new GestureClassifier();

  // Powers
  private shield!: StrangeShield;
  private portal!: StrangePortal;
  private hud!: IronManHUD;
  private blast!: EnergyBlast;
  private lightning!: LightningPower;
  private telekinesis!: Telekinesis;
  private aura!: AuraPower;
  private superShield!: SuperShield;

  private activePower: PowerType = 'none';
  private running = false;
  private animFrameId = 0;
  private lastTime = 0;
  private frameCount = 0;
  private fpsTimer = 0;
  private fps = 0;

  private callbacks!: EngineCallbacks;

  async init(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    callbacks: EngineCallbacks
  ): Promise<void> {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    // Init powers
    this.shield = new StrangeShield();
    this.portal = new StrangePortal(canvas.width / 2, canvas.height / 2);
    this.hud = new IronManHUD();
    this.blast = new EnergyBlast();
    this.lightning = new LightningPower();
    this.telekinesis = new Telekinesis(canvas.width, canvas.height);
    this.aura = new AuraPower();
    this.superShield = new SuperShield();

    // Init MediaPipe in parallel
    await Promise.all([
      this.handTracker.init(),
      this.poseTracker.init(),
      this.faceTracker.init(),
    ]);
  }

  async startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false,
    });
    this.video.srcObject = stream;
    await new Promise<void>((resolve) => {
      this.video.onloadedmetadata = () => {
        this.video.play();
        resolve();
      };
    });
    this.syncCanvasSize();
    this.running = true;
    this.loop(0);
  }

  private syncCanvasSize(): void {
    const { videoWidth, videoHeight } = this.video;
    if (videoWidth && videoHeight) {
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return;

    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // FPS counter
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.callbacks.onFpsUpdate(this.fps);
    }

    this.syncCanvasSize();
    this.processFrame(dt);
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private processFrame(dt: number): void {
    const { ctx, canvas, video } = this;
    const W = canvas.width;
    const H = canvas.height;

    if (video.readyState < 2) return;

    // Draw mirrored video
    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    ctx.restore();

    // Run detection
    const handResult = this.handTracker.detect(video);
    const poseResult = this.poseTracker.detect(video);
    const faceResult = this.faceTracker.detect(video);

    const hands = this.handTracker.getHandLandmarks();
    const pose = this.poseTracker.getPoseLandmarks();
    const face = this.faceTracker.getFaceLandmarks();

    this.callbacks.onHandLandmarks(hands);
    this.callbacks.onPoseLandmarks(pose);
    this.callbacks.onFaceLandmarks(face);

    // Classify gesture
    const { gesture, power, confidence } = this.gestureClassifier.classify(hands, pose);
    this.callbacks.onGestureChange(gesture, power, confidence);

    // Draw active power
    this.renderPower(dt, hands, pose, face, W, H);

    // Draw landmark debug (optional)
    if (this.showLandmarks) {
      this.drawLandmarks(ctx, hands, pose, W, H);
    }
  }

  private renderPower(
    dt: number,
    hands: any[][],
    pose: any[],
    face: any[][],
    W: number, H: number
  ): void {
    const p = this.activePower;

    switch (p) {
      case 'strange-shield':
        this.shield.update(dt, hands, W, H);
        this.shield.draw(this.ctx, hands, W, H);
        break;

      case 'strange-portal':
        this.portal.setCenter(W / 2, H / 2);
        this.portal.update(dt);
        this.portal.draw(this.ctx);
        break;

      case 'ironman-hud':
        this.hud.update(dt, this.fps);
        this.hud.draw(this.ctx, face.length ? face : null, W, H);
        break;

      case 'energy-blast':
        this.blast.update(dt, hands, W, H);
        this.blast.draw(this.ctx, hands, W, H);
        break;

      case 'lightning':
        this.lightning.update(dt, hands, pose, W, H);
        this.lightning.draw(this.ctx, hands, pose, W, H);
        break;

      case 'telekinesis':
        this.telekinesis.update(dt, hands, W, H);
        this.telekinesis.draw(this.ctx, hands, W, H);
        break;

      case 'aura':
        this.aura.update(dt, pose, W, H);
        this.aura.draw(this.ctx, pose, W, H);
        break;

      case 'super-shield':
        this.superShield.update(dt, pose, W, H);
        this.superShield.draw(this.ctx, pose, W, H);
        break;
    }
  }

  private drawLandmarks(
    ctx: CanvasRenderingContext2D,
    hands: any[][], pose: any[],
    W: number, H: number
  ): void {
    // Hand landmarks
    for (const hand of hands) {
      for (const lm of hand) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc((1 - lm.x) * W, lm.y * H, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Pose landmarks
    if (pose.length) {
      for (const lm of pose) {
        if ((lm.visibility ?? 1) < 0.5) continue;
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.beginPath();
        ctx.arc((1 - lm.x) * W, lm.y * H, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  setPower(power: PowerType): void {
    // Reset previous
    if (power !== this.activePower) {
      this.resetAllPowers();
    }
    this.activePower = power;
    // Re-init portal center on switch
    if (power === 'strange-portal') {
      this.portal.reset();
    }
  }

  private resetAllPowers(): void {
    this.shield.reset();
    this.portal.reset();
    this.hud.reset();
    this.blast.reset();
    this.lightning.reset();
    this.telekinesis.reset();
    this.aura.reset();
    this.superShield.reset();
  }

  showLandmarks = false;

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    const stream = this.video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    this.handTracker.destroy();
    this.poseTracker.destroy();
    this.faceTracker.destroy();
  }

  get gestureClassifierRef(): GestureClassifier {
    return this.gestureClassifier;
  }
}
