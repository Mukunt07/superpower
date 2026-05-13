import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

export class FaceTracker {
  private landmarker: FaceLandmarker | null = null;
  private lastVideoTime = -1;
  public results: FaceLandmarkerResult | null = null;
  public ready = false;

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
    });

    this.ready = true;
  }

  detect(video: HTMLVideoElement): FaceLandmarkerResult | null {
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

  getFaceLandmarks(): Array<{ x: number; y: number; z: number }>[] {
    if (!this.results?.faceLandmarks?.length) return [];
    return this.results.faceLandmarks;
  }

  destroy(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }
}
