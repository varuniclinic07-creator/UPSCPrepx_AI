/**
 * VoiceRecorder Component
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Voice recording with microphone
 * - Real-time waveform visualization
 * - Recording timer
 * - Playback controls
 * - Audio preview
 * - Saffron theme design
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string, audioBlob: Blob) => void;
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
  showHindi?: boolean;
  disabled?: boolean;
  maxDuration?: number; // seconds
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_DURATION = 60; // seconds
const FORMAT_TIME = 'webm';

// ============================================================================
// VOICE RECORDER COMPONENT
// ============================================================================

export function VoiceRecorder({
  onRecordingComplete,
  isRecording,
  onRecordingChange,
  showHindi = false,
  disabled = false,
  maxDuration = DEFAULT_MAX_DURATION,
}: VoiceRecorderProps) {
  // State
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPaused(false);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Create media recorder
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onRecordingComplete(url, blob);

        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      onRecordingChange(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(
        showHindi
          ? 'माइक्रोफ़ोन एक्सेस विफल. कृपया अनुमति दें.'
          : 'Microphone access failed. Please allow permission.'
      );
      onRecordingChange(false);
    }
  }, [onRecordingChange, onRecordingComplete, showHindi, maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onRecordingChange(false);
    setIsPaused(false);
  }, [onRecordingChange]);

  // Pause/Resume recording
  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    setIsPaused(!isPaused);
  }, [isPaused, stopRecording, maxDuration]);

  // Delete recording
  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setError(null);
  }, [audioUrl]);

  // Play/Pause audio
  const togglePlayback = useCallback(() => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioUrl, isPlaying]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mp4',
    ];

    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm';
  };

  // Check if recording is supported
  const isSupported = typeof navigator !== 'undefined' && navigator.mediaDevices;

  return (
    <div className="w-full max-w-md">
      {/* Recording Button */}
      <div className="flex items-center gap-3">
        {/* Record Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || !isSupported}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full
            transition-all duration-200 ease-in-out
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-saffron-600 hover:bg-saffron-700'
            }
            ${disabled || !isSupported ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={showHindi ? 'रिकॉर्डिंग शुरू/रोकें' : 'Start/Stop recording'}
        >
          {isRecording ? (
            <Square className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Timer */}
        {isRecording && (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-1000"
                style={{ width: `${(recordingTime / maxDuration) * 100}%` }}
              />
            </div>
            <span className={`text-sm font-mono ${
              recordingTime >= maxDuration - 10 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}

        {/* Pause Button (when recording) */}
        {isRecording && (
          <button
            type="button"
            onClick={togglePause}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title={isPaused ? (showHindi ? 'पुनः शुरू करें' : 'Resume') : (showHindi ? 'रोकें' : 'Pause')}
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-gray-600" />
            ) : (
              <Pause className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
      </div>

      {/* Audio Preview */}
      {audioUrl && !isRecording && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                className="p-2 bg-saffron-100 hover:bg-saffron-200 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-saffron-600" />
                ) : (
                  <Play className="w-4 h-4 text-saffron-600" />
                )}
              </button>
              <span className="text-sm text-gray-600">
                {formatTime(recordingTime)}
              </span>
            </div>
            <button
              type="button"
              onClick={deleteRecording}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title={showHindi ? 'हटाएं' : 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Info */}
      {!isRecording && !audioUrl && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Mic className="w-3 h-3" />
          <span>
            {showHindi
              ? `अधिकतम ${maxDuration} सेकंड`
              : `Max ${maxDuration} seconds`}
          </span>
        </div>
      )}
    </div>
  );
}
