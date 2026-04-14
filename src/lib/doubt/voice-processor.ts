/**
 * Voice Processor Service
 *
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Speech-to-text for voice-based doubts
 * - Web Speech API integration
 * - Audio recording and playback
 * - Hindi and English language support
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VoiceRecording {
  audioBlob: Blob;
  audioUrl: string;
  duration: number; // seconds
  format: 'webm' | 'wav' | 'mp3';
}

export interface TranscriptionResult {
  success: boolean;
  text: string;
  language: 'en-IN' | 'hi-IN';
  confidence: number;
  duration: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
  error?: string;
}

export interface RecordingConfig {
  language?: 'en-IN' | 'hi-IN';
  maxDuration?: number; // seconds
  sampleRate?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_DURATION = 60; // seconds
const DEFAULT_SAMPLE_RATE = 44100;
const SUPPORTED_LANGUAGES = ['en-IN', 'hi-IN', 'en-US', 'hi-IN'];

// ============================================================================
// VOICE PROCESSOR SERVICE
// ============================================================================

export class VoiceProcessorService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingStartTime: number = 0;
  private recognition: any = null;

  /**
   * Check if browser supports speech recognition
   */
  isSpeechRecognitionSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  /**
   * Check if browser supports media recording
   */
  isMediaRecordingSupported(): boolean {
    return !!(navigator as any).mediaDevices && !!(navigator as any).mediaDevices.getUserMedia;
  }

  /**
   * Get supported languages for speech recognition
   */
  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Start recording audio
   */
  async startRecording(config: RecordingConfig = {}): Promise<void> {
    const maxDuration = config.maxDuration || DEFAULT_MAX_DURATION;

    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: config.echoCancellation !== false,
          noiseSuppression: config.noiseSuppression !== false,
          sampleRate: config.sampleRate || DEFAULT_SAMPLE_RATE,
        },
      });

      // Create media recorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      // Reset chunks
      this.audioChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.recordingStartTime = Date.now();

      // Auto-stop at max duration
      setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.stopRecording();
        }
      }, maxDuration * 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error(
        error instanceof Error
          ? `Microphone access failed: ${error.message}`
          : 'Microphone access failed'
      );
    }
  }

  /**
   * Stop recording and get audio blob
   */
  async stopRecording(): Promise<VoiceRecording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.stream) {
        reject(new Error('No active recording'));
        return;
      }

      const mimeType = this.getSupportedMimeType();
      const format = mimeType.includes('webm') ? 'webm' : mimeType.includes('wav') ? 'wav' : 'mp3';

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = (Date.now() - this.recordingStartTime) / 1000;

        // Cleanup
        this.stream!.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.mediaRecorder = null;

        resolve({
          audioBlob,
          audioUrl,
          duration,
          format,
        });
      };

      this.mediaRecorder.onerror = (event) => {
        reject(new Error('Recording error'));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  }

  /**
   * Transcribe audio using Web Speech API (real-time)
   */
  async transcribeRealtime(language: 'en-IN' | 'hi-IN' = 'en-IN'): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      if (!this.isSpeechRecognitionSupported()) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 3;

      let finalTranscript = '';
      const words: TranscriptionResult['words'] = [];
      const startTime = Date.now();

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript + ' ';
            words.push({
              word: transcript,
              startTime: 0,
              endTime: 0,
              confidence,
            });
          } else {
            interimTranscript += transcript;
          }
        }

        console.debug('Interim:', finalTranscript + interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        const duration = (Date.now() - startTime) / 1000;

        resolve({
          success: true,
          text: finalTranscript.trim(),
          language,
          confidence:
            words.length > 0 ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length : 0,
          duration,
          words,
        });
      };

      this.recognition.start();
    });
  }

  /**
   * Stop real-time transcription
   */
  stopTranscription(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  /**
   * Transcribe audio file (post-processing)
   * Note: For production, use a server-side service like Whisper, Google Speech-to-Text
   */
  async transcribeAudioFile(
    audioBlob: Blob,
    language: 'en-IN' | 'hi-IN' = 'en-IN'
  ): Promise<TranscriptionResult> {
    try {
      // For client-side, we'll use Web Speech API with audio playback
      // In production, this should call a server endpoint with Whisper or similar

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // Create audio context for analysis
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());

      // Get duration
      const duration = audioBuffer.duration;

      // For actual transcription, we need server-side processing
      // This is a placeholder that returns audio metadata

      URL.revokeObjectURL(audioUrl);

      return {
        success: false,
        text: '',
        language,
        confidence: 0,
        duration,
        words: [],
        error:
          'Server-side transcription service required. Use Whisper API or Google Speech-to-Text.',
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        language,
        confidence: 0,
        duration: 0,
        words: [],
        error: error instanceof Error ? error.message : 'Transcription failed',
      };
    }
  }

  /**
   * Upload audio file to server for transcription
   */
  async uploadAndTranscribe(
    audioBlob: Blob,
    uploadEndpoint: string,
    language: 'en-IN' | 'hi-IN' = 'en-IN'
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        text: data.text || '',
        language,
        confidence: data.confidence || 0,
        duration: data.duration || 0,
        words: data.words || [],
        error: data.error,
      };
    } catch (error) {
      return {
        success: false,
        text: '',
        language,
        confidence: 0,
        duration: 0,
        words: [],
        error: error instanceof Error ? error.message : 'Upload and transcription failed',
      };
    }
  }

  /**
   * Play audio recording
   */
  playAudio(audioUrl: string): HTMLAudioElement {
    const audio = new Audio(audioUrl);
    audio.play();
    return audio;
  }

  /**
   * Stop audio playback
   */
  stopPlayback(audio: HTMLAudioElement): void {
    audio.pause();
    audio.currentTime = 0;
  }

  /**
   * Convert audio blob to different format
   */
  async convertAudioFormat(audioBlob: Blob, targetFormat: 'wav' | 'mp3' | 'webm'): Promise<Blob> {
    // For production, use ffmpeg.wasm or server-side conversion
    // This is a placeholder
    console.warn('Audio format conversion requires ffmpeg.wasm or server-side processing');
    return audioBlob;
  }

  /**
   * Get audio duration
   */
  async getAudioDuration(audioBlob: Blob): Promise<number> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.duration;
  }

  /**
   * Detect silence in audio
   */
  async detectSilence(
    audioBlob: Blob,
    threshold: number = 0.01
  ): Promise<Array<{ start: number; end: number }>> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const silenceThreshold = threshold;
    const minSilenceDuration = 0.5; // seconds

    const silences: Array<{ start: number; end: number }> = [];
    let silenceStart: number | null = null;

    for (let i = 0; i < channelData.length; i++) {
      const amplitude = Math.abs(channelData[i]);
      const time = i / sampleRate;

      if (amplitude < silenceThreshold) {
        if (silenceStart === null) {
          silenceStart = time;
        }
      } else {
        if (silenceStart !== null) {
          const silenceDuration = time - silenceStart;
          if (silenceDuration >= minSilenceDuration) {
            silences.push({ start: silenceStart, end: time });
          }
          silenceStart = null;
        }
      }
    }

    return silences;
  }

  /**
   * Trim silence from audio
   */
  async trimSilence(audioBlob: Blob): Promise<Blob> {
    // Placeholder - would require audio processing library
    console.warn('Silence trimming requires audio processing library');
    return audioBlob;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const voiceProcessor = new VoiceProcessorService();
