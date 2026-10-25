// Web Speech API Voice and Speech Recognition Engine for J.A.R.V.I.S.
// Includes strict MALE voice enforcement, dual-layer SpeechRecognition + MediaRecorder fallback + live audio level analysis

export interface SpeechEngineOptions {
  voiceRate?: number;
  voicePitch?: number;
  autoSpeak?: boolean;
}

const FEMALE_VOICE_NAMES = [
  'female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 'fiona',
  'hazel', 'susan', 'cathy', 'serena', 'tessa', 'moira', 'veena', 'alice',
  'shelley', 'jenny', 'stephanie', 'clara', 'eva', 'lucy', 'amy', 'salli',
  'joanna', 'kendra', 'kimberly', 'ivy', 'nicole', 'emma', 'aria', 'ayanda',
  'helena', 'hedda', 'hortense', 'laura', 'julie', 'alva'
];

function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const nameLower = voice.name.toLowerCase();
  return FEMALE_VOICE_NAMES.some((fn) => nameLower.includes(fn));
}

function calculateMaleScore(voice: SpeechSynthesisVoice): number {
  if (isFemaleVoice(voice)) return -100;

  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  let score = 0;
  // Highest priority: British English male voices (classic J.A.R.V.I.S. Paul Bettany persona)
  if (name.includes('daniel')) score += 120;
  if (name.includes('george')) score += 110;
  if (name.includes('arthur')) score += 105;
  if (name.includes('oliver')) score += 105;
  if (name.includes('google uk english male') || name.includes('uk english male')) score += 100;
  if (name.includes('male') && lang.includes('en-gb')) score += 95;

  // General English male voices
  if (name.includes('david')) score += 75;
  if (name.includes('mark')) score += 70;
  if (name.includes('james')) score += 70;
  if (name.includes('brian')) score += 70;
  if (name.includes('tom')) score += 65;
  if (name.includes('alex')) score += 60;
  if (name.includes('fred')) score += 55;
  if (name.includes('male')) score += 50;

  // English regional preference
  if (lang.startsWith('en-gb')) score += 35;
  else if (lang.startsWith('en')) score += 15;

  return score;
}

class JarvisSpeechService {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  public isSpeaking: boolean = false;
  public autoSpeak: boolean = true;
  public voicePitch: number = 0.90;
  public voiceRate: number = 1.02;
  private onStateChangeListeners: Array<(isSpeaking: boolean) => void> = [];

  public setVoiceRate(rate: number) {
    this.voiceRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setVoicePitch(pitch: number) {
    this.voicePitch = Math.max(0.5, Math.min(1.8, pitch));
  }

  // Audio Context & Analyser for real-time mic volume visualization
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  // Active utterance queue to prevent garbage collection and Chrome speech cutoffs
  private activeUtterances: SpeechSynthesisUtterance[] = [];
  private resumeInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      try {
        this.synth.cancel();
      } catch {}
      this.initVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  public initVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Check if user previously picked a custom male voice in localStorage
    try {
      const savedVoiceName = localStorage.getItem('jarvis_male_voice_name');
      if (savedVoiceName) {
        const found = voices.find((v) => v.name === savedVoiceName && !isFemaleVoice(v));
        if (found) {
          this.voice = found;
          return;
        }
      }
    } catch {}

    // Sort strictly by male voice score
    const maleCandidates = voices
      .filter((v) => !isFemaleVoice(v) && v.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => calculateMaleScore(b) - calculateMaleScore(a));

    if (maleCandidates.length > 0) {
      this.voice = maleCandidates[0];
    } else {
      // Fallback: any voice that isn't female
      const nonFemale = voices.filter((v) => !isFemaleVoice(v));
      this.voice = nonFemale[0] || voices[0] || null;
    }
  }

  // Get list of all available male English voices on the current device
  public getAvailableMaleVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    const voices = this.synth.getVoices();
    return voices
      .filter((v) => !isFemaleVoice(v) && v.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => calculateMaleScore(b) - calculateMaleScore(a));
  }

  // Select a specific voice by name
  public setVoiceByName(voiceName: string): boolean {
    if (!this.synth) return false;
    const voices = this.synth.getVoices();
    const found = voices.find((v) => v.name === voiceName);
    if (found) {
      this.voice = found;
      try {
        localStorage.setItem('jarvis_male_voice_name', voiceName);
      } catch {}
      return true;
    }
    return false;
  }

  // Return formatted name of active male voice
  public getVoiceName(): string {
    if (!this.voice) return 'British Male (Daniel / UK Male)';
    const n = this.voice.name;
    if (n.toLowerCase().includes('daniel')) return 'Daniel (British Male)';
    if (n.toLowerCase().includes('george')) return 'George (British Male)';
    if (n.toLowerCase().includes('oliver')) return 'Oliver (British Male)';
    if (n.toLowerCase().includes('google uk english male')) return 'Google UK (Male)';
    if (n.toLowerCase().includes('david')) return 'David (US Male)';
    if (n.toLowerCase().includes('alex')) return 'Alex (Male)';
    return n.length > 25 ? n.slice(0, 25) + '...' : n;
  }

  public subscribeState(listener: (isSpeaking: boolean) => void) {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyState(isSpeaking: boolean) {
    this.isSpeaking = isSpeaking;
    this.onStateChangeListeners.forEach((l) => l(isSpeaking));
  }

  // Extract the conversational speech portion from Hospital / Clinical Assistant output or raw text
  public extractVocalBriefing(rawText: string): string {
    if (!rawText) return '';

    // 1. Look for explicit audio comm-link or hospital voice delimiter
    const commLinkMatch = rawText.match(/◈\s*(?:AUDIO|CLINICAL|HOSPITAL|VOICE)[^:]*:\s*(?:["'“”]?)([\s\S]*?)(?:["'“”]?)(?=(\*{2,3}|###|---|◈|\n\n\n|┌|\[SYSTEM|\[HOSPITAL|$))/i);
    let spokenText = '';
    if (commLinkMatch && commLinkMatch[1]) {
      spokenText = commLinkMatch[1].replace(/["'“”]/g, '').trim();
    } else {
      // 2. Clean out ASCII HUD boxes, code blocks, and markdown
      spokenText = rawText
        .replace(/\[SYSTEM RUNTIME[\s\S]*?└─*┘/g, '')
        .replace(/\[HOSPITAL CLINICAL[\s\S]*?└─*┘/g, '')
        .replace(/┌[\s\S]*?└─*┘/g, '')
        .replace(/```[\s\S]*?```/g, 'I have detailed the directions and clinical instructions on your screen.')
        .replace(/◈\s*ACTIVE SUBSYSTEMS[\s\S]*?OPTIMIZED/g, '')
        .replace(/◈\s*HOSPITAL DIRECTORY[\s\S]*?(?=◈|$)/gi, '')
        .replace(/◈\s*DOCTOR EMERGENCY[\s\S]*?(?=◈|$)/gi, '')
        .replace(/◈\s*ACTION DIRECTIVES[\s\S]*/g, '')
        .trim();
    }

    // Clean remaining markdown artifacts for smooth, natural speech
    spokenText = spokenText
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1')     // Italics
      .replace(/`([^`]+)`/g, '$1')       // Inline code
      .replace(/#{1,6}\s+/g, '')         // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/https?:\/\/\S+/g, 'link') // URLs
      .replace(/[-*•]\s+/g, '')          // Bullets
      .replace(/[◈◉★▶◆■▲●✓🚨🚑💊♿🩺🔬]/g, '') // Symbols
      .trim();

    return spokenText || 'Your request has been processed. The hospital location and emergency clinical team have been updated on your screen.';
  }

  // Speak verbally with male British timbre and sequential sentence chunking
  public speak(text: string, onEndCallback?: () => void, force = true) {
    if (!this.synth || (!this.autoSpeak && !force)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    this.stop();

    const cleanText = this.extractVocalBriefing(text);
    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Split text into natural sentence chunks to prevent browser Web Speech cutoff bugs
    const sentences = cleanText
      .split(/(?<=[.?!;])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length === 0) {
      if (onEndCallback) onEndCallback();
      return;
    }

    this.notifyState(true);

    // Keep Chrome from freezing long utterances by calling resume periodically
    if (this.resumeInterval) clearInterval(this.resumeInterval);
    this.resumeInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);

    this.activeUtterances = [];

    sentences.forEach((sentence, index) => {
      const utterance = new SpeechSynthesisUtterance(sentence);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      // Male voice modulation: Lower pitch gives deep masculine British resonance
      utterance.pitch = this.voicePitch;
      utterance.rate = this.voiceRate;

      const isLast = index === sentences.length - 1;

      utterance.onend = () => {
        if (isLast) {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
          }
          this.activeUtterances = [];
          this.notifyState(false);
          if (onEndCallback) onEndCallback();
        }
      };

      utterance.onerror = () => {
        if (isLast) {
          if (this.resumeInterval) {
            clearInterval(this.resumeInterval);
            this.resumeInterval = null;
          }
          this.activeUtterances = [];
          this.notifyState(false);
          if (onEndCallback) onEndCallback();
        }
      };

      this.activeUtterances.push(utterance);
      this.synth?.speak(utterance);
    });
  }

  public testVoiceSample() {
    this.speak(
      'At your service, Sir. Male voice synthesizers calibrated to masculine British resonance. How may I assist you today?'
    );
  }

  public stop() {
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }
    this.activeUtterances = [];
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.notifyState(false);
    }
  }

  // Request explicit microphone permission and setup audio meter
  public async setupMicrophoneStream(
    onVolumeChange?: (volume: number) => void
  ): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { success: false, error: 'MediaDevices API not supported in this browser environment.' };
    }

    try {
      this.cleanupMicrophone();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const vol = Math.min(100, Math.round((avg / 128) * 100));
          if (onVolumeChange) {
            onVolumeChange(vol);
          }
          this.animFrameId = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      }

      return { success: true, stream };
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      let errorMsg = 'Microphone permission denied. Please allow microphone access in your browser.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device found on your system.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission blocked. Please enable microphone permissions in your browser URL bar.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Start MediaRecorder fallback capture
  public startMediaRecorderCapture() {
    if (!this.mediaStream) return;
    try {
      this.audioChunks = [];
      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4' }
        : undefined;

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(250);
    } catch (e) {
      console.warn('MediaRecorder start error:', e);
    }
  }

  // Stop MediaRecorder and return base64 audio
  public async stopMediaRecorderCapture(): Promise<{ base64: string; mimeType: string } | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length === 0) {
          resolve(null);
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || '';
          resolve({ base64, mimeType });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        resolve(null);
      }
    });
  }

  public cleanupMicrophone() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }

  // Enhanced Voice Recognition Controller
  public createAdvancedRecognition(
    callbacks: {
      onInterim?: (interimText: string) => void;
      onFinal: (finalText: string) => void;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    },
    continuous = false
  ) {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (callbacks.onStart) callbacks.onStart();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript && callbacks.onInterim) {
          callbacks.onInterim(interimTranscript);
        }

        if (finalTranscript.trim()) {
          callbacks.onFinal(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (callbacks.onError) {
          if (event.error === 'not-allowed') {
            callbacks.onError('Microphone permission blocked. Click "Grant Permission" or enable in browser settings.');
          } else if (event.error === 'no-speech') {
            // normal pause in speech
          } else if (event.error === 'network') {
            callbacks.onError('Network connection required for browser speech recognition.');
          } else {
            callbacks.onError(`Mic notice: ${event.error}`);
          }
        }
      };

      recognition.onend = () => {
        if (callbacks.onEnd) callbacks.onEnd();
      };

      return recognition;
    } catch (err: any) {
      if (callbacks.onError) callbacks.onError(err?.message || 'Failed to initialize speech recognition');
      return null;
    }
  }

  // Voice transcription fallback to Gemini API
  public async transcribeAudioViaGemini(base64Audio: string, mimeType: string): Promise<string | null> {
    try {
      const res = await fetch('/api/jarvis/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64Audio, mimeType }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.transcript || null;
    } catch (err) {
      console.warn('Gemini transcription API call error:', err);
      return null;
    }
  }
}

export const jarvisVoice = new JarvisSpeechService();
