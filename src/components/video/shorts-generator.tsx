'use client';

/**
 * BMAD Phase 4: Feature 6 - Video Shorts Generator UI
 * Generate 60-second UPSC explainer videos
 * AI Providers: 9Router → Groq → Ollama (NOT A4F)
 */

import React, { useState } from 'react';
import { Video, Clock, Sparkles, Download, Share2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ShortsGeneratorProps {
  userId?: string;
  isPremium?: boolean;
}

export function ShortsGenerator({ userId, isPremium }: ShortsGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState<string>('');
  const [style, setStyle] = useState<'educational' | 'entertaining' | 'news'>('educational');
  const [includeManimVisuals, setIncludeManimVisuals] = useState(true);
  const [includeCaptions, setIncludeCaptions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const subjects = [
    { value: 'GS1', label: 'GS1 - History, Geography' },
    { value: 'GS2', label: 'GS2 - Polity, Governance' },
    { value: 'GS3', label: 'GS3 - Economy, Environment' },
    { value: 'GS4', label: 'GS4 - Ethics' },
    { value: 'CSAT', label: 'CSAT - Aptitude' },
    { value: 'Essay', label: 'Essay' },
    { value: 'Prelims', label: 'Prelims' },
    { value: 'Current Affairs', label: 'Current Affairs' },
  ];

  const styles = [
    { value: 'educational', label: '📚 Educational', description: 'Formal, academic tone' },
    { value: 'entertaining', label: '🎬 Entertaining', description: 'Engaging, fun approach' },
    { value: 'news', label: '📰 News Style', description: 'Current affairs format' },
  ];

  // Generate video short
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (!userId) {
      setError('Please login to generate videos');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationStatus('Starting generation...');
    setProgress(10);

    try {
      const response = await fetch('/api/video/shorts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`,
        },
        body: JSON.stringify({
          topic,
          subject: subject as any,
          style,
          includeManimVisuals,
          includeCaptions,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate video');
      }

      setQueueId(data.queueId || '');
      setGenerationStatus('Queued for generation...');
      setProgress(20);

      // Poll for progress
      pollProgress(data.queueId);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video');
      setIsGenerating(false);
    }
  };

  // Poll generation progress
  const pollProgress = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/shorts/generate?queueId=${id}`);
        const data = await response.json();

        if (data.success && data.queue) {
          const queue = data.queue;
          setProgress(queue.progress || 0);
          setGenerationStatus(getStatusMessage(queue.status));

          if (queue.status === 'completed') {
            clearInterval(pollInterval);
            setGenerationStatus('✅ Video ready!');
            setGeneratedVideo(queue);
            setIsGenerating(false);
          } else if (queue.status === 'failed') {
            clearInterval(pollInterval);
            setError(queue.error_message || 'Generation failed');
            setIsGenerating(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const getStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      'pending': '⏳ Waiting in queue...',
      'script_generating': '✍️ Writing script with AI...',
      'script_ready': '✅ Script ready!',
      'audio_generating': '🎤 Generating voiceover...',
      'audio_ready': '✅ Audio ready!',
      'video_rendering': '🎬 Rendering video...',
      'completed': '✅ Video ready!',
      'failed': '❌ Generation failed',
    };
    return messages[status] || status;
  };

  // Quick topic suggestions
  const quickTopics = [
    'Fundamental Rights',
    'Monetary Policy',
    'Climate Change',
    'Judicial Review',
    'GST',
    'Election Commission',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Video className="h-8 w-8 text-blue-600" />
          60-Second Video Shorts
        </h1>
        <p className="text-gray-600">
          Generate snackable UPSC explainer videos for social media and quick revision
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Fundamental Rights, Monetary Policy, Climate Change"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {/* Quick Suggestions */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Quick:</span>
              {quickTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Style
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {styles.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    style === s.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg font-semibold">{s.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeManimVisuals}
                onChange={(e) => setIncludeManimVisuals(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Include Manim Visuals
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCaptions}
                onChange={(e) => setIncludeCaptions(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Include Captions
              </span>
            </label>
          </div>

          {/* Premium Badge */}
          {!isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-semibold text-yellow-800">Premium Feature</p>
                <p className="text-sm text-yellow-700">
                  Free users: 3 shorts/month • Premium: Unlimited generation
                </p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="h-5 w-5" />
                Generate 60-Second Video
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Generation Progress</h3>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{generationStatus}</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className={`p-2 rounded ${progress >= 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              📝 Script
            </div>
            <div className={`p-2 rounded ${progress >= 40 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              ✅ Ready
            </div>
            <div className={`p-2 rounded ${progress >= 60 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              🎬 Render
            </div>
            <div className={`p-2 rounded ${progress >= 80 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              💾 Save
            </div>
            <div className={`p-2 rounded ${progress >= 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
              ✅ Done
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Estimated time: ~3-5 minutes
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Generation Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Video */}
      {generatedVideo && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Video Generated Successfully!</h3>
          </div>

          {/* Video Preview */}
          <div className="aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg overflow-hidden mb-4">
            {generatedVideo.video_url ? (
              <video
                src={generatedVideo.video_url}
                controls
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                Video is being processed. Preview will appear here once ready.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              Download
            </button>
            <button className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>

          {/* SEO Info */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">SEO Optimized</h4>
            <p className="text-sm text-gray-600">
              Title: {generatedVideo.title || 'UPSC Topic in 60 Seconds'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Duration: 60 seconds • Format: MP4 • Resolution: 1080x1920 (Vertical)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
