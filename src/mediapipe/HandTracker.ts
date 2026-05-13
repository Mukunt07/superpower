import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

export type HandLandmarks = Array<{ x: number; y: number; z: number }>;

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  public results: HandLandmarkerResult | null = null;
  public ready = false;

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.ready = true;
  }

  detect(video: HTMLVideoElement): HandLandmarkerResult | null {
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

  getHandLandmarks(): HandLandmarks[] {
    if (!this.results?.landmarks) return [];
    return this.results.landmarks;
  }

  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }
}
