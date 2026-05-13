import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type PoseLandmarks = Array<{ x: number; y: number; z: number; visibility?: number }>;

export class PoseTracker {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;
  public results: PoseLandmarkerResult | null = null;
  public ready = false;

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.ready = true;
  }

  detect(video: HTMLVideoElement): PoseLandmarkerResult | null {
    if (!this.landmarker || !this.ready) return null;

    const now = performance.now();
    if (video.currentTime === this.lastVideoTime) return this.results;
    this.lastVideoTime = video.currentTime;

    try {
      this.results = this.landmarker.detectForVideo(video, now);
    } catch {
      this.results = null;
    }
    return this.results;
  }

  getPoseLandmarks(): PoseLandmarks {
    if (!this.results?.landmarks?.length) return [];
    return this.results.landmarks[0];
  }

  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }
}

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];
