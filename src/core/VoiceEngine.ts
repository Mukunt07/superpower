import type { PowerType } from '../store/useStore';
import type { GestureClassifier } from './GestureClassifier';

type SpeechRecognitionType = typeof window & {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
};

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

export class VoiceEngine {
  private recognition: SpeechRecognition | null = null;
  private active = false;
  private classifier: GestureClassifier;
  public onCommand: ((power: PowerType, transcript: string) => void) | null = null;
  public onTranscript: ((text: string) => void) | null = null;
  public supported = false;

  constructor(classifier: GestureClassifier) {
    this.classifier = classifier;
  }

  init(): boolean {
    const w = window as SpeechRecognitionType;
    const SpeechRec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRec) {
      this.supported = false;
      return false;
    }

    this.recognition = new SpeechRec();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.trim();
      this.onTranscript?.(transcript);

      if (last.isFinal) {
        const power = this.classifier.voiceCommandToPower(transcript);
        if (power !== null) {
          this.onCommand?.(power, transcript);
        }
      }
    };

    this.recognition.onend = () => {
      if (this.active) {
        // Restart automatically
        try { this.recognition?.start(); } catch { /* ignore */ }
      }
    };

    this.recognition.onerror = () => {
      // Silently ignore errors
    };

    this.supported = true;
    return true;
  }

  start(): void {
    if (!this.recognition || this.active) return;
    this.active = true;
    try { this.recognition.start(); } catch { /* already started */ }
  }

  stop(): void {
    if (!this.recognition) return;
    this.active = false;
    try { this.recognition.stop(); } catch { /* ignore */ }
  }

  get isListening(): boolean { return this.active; }
}
