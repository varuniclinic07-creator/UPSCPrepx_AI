/**
 * DoubtInput Component
 * 
 * Master Prompt v8.0 - Feature F5 (READ Mode)
 * - Multi-modal input (text, image, voice)
 * - Subject selector dropdown
 * - Character counter
 * - Attachment preview
 * - Bilingual support (EN+HI)
 * - Saffron theme design
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ImageUpload } from './image-upload';
import { VoiceRecorder } from './voice-recorder';
import { BookOpen, Mic, Image, Send, Loader2, Languages, X } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DoubtInputProps {
  onSubmit: (data: {
    title: { en: string; hi?: string };
    subject: 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'CSAT' | 'General';
    topic?: string;
    question: string;
    attachments?: Array<{ type: 'image' | 'audio'; url: string }>;
    language: 'en' | 'hi' | 'bilingual';
  }) => Promise<void>;
  isLoading?: boolean;
  showHindi?: boolean;
}

export interface Attachment {
  type: 'image' | 'audio';
  url: string;
  file?: File;
  preview?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUBJECTS = [
  { value: 'GS1', label: 'GS1 - History, Geography, Society' },
  { value: 'GS2', label: 'GS2 - Polity, Governance, IR' },
  { value: 'GS3', label: 'GS3 - Economy, Environment, Security' },
  { value: 'GS4', label: 'GS4 - Ethics, Integrity' },
  { value: 'Essay', label: 'Essay' },
  { value: 'Optional', label: 'Optional Subject' },
  { value: 'CSAT', label: 'CSAT' },
  { value: 'General', label: 'General' },
] as const;

const MAX_QUESTION_LENGTH = 2000;
const MIN_QUESTION_LENGTH = 10;
const MAX_ATTACHMENTS = 3;

// ============================================================================
// DOUBT INPUT COMPONENT
// ============================================================================

export function DoubtInput({ onSubmit, isLoading = false, showHindi = false }: DoubtInputProps) {
  // Form state
  const [subject, setSubject] = useState<'GS1' | 'GS2' | 'GS3' | 'GS4' | 'Essay' | 'Optional' | 'CSAT' | 'General'>('GS1');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bilingual'>('bilingual');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate character count
  const charCount = question.length;
  const remainingChars = MAX_QUESTION_LENGTH - charCount;
  const isOverLimit = charCount > MAX_QUESTION_LENGTH;
  const isUnderMin = charCount > 0 && charCount < MIN_QUESTION_LENGTH;

  // Handle file upload
  const handleFileUpload = useCallback((files: File[]) => {
    setAttachments(prev => {
      const newAttachments: Attachment[] = files.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 'audio',
        url: URL.createObjectURL(file),
        file,
      }));
      
      const combined = [...prev, ...newAttachments];
      return combined.slice(0, MAX_ATTACHMENTS);
    });
  }, []);

  // Handle voice recording
  const handleVoiceRecording = useCallback((audioUrl: string, audioBlob: Blob) => {
    setAttachments(prev => {
      const newAttachment: Attachment = {
        type: 'audio',
        url: audioUrl,
        file: new File([audioBlob], 'recording.webm', { type: 'audio/webm' }),
      };
      
      const combined = [...prev, newAttachment];
      return combined.slice(0, MAX_ATTACHMENTS);
    });
  }, []);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => {
      const removed = prev[index];
      if (removed?.url && removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError(showHindi ? 'शीर्षक आवश्यक है' : 'Title is required');
      return;
    }

    if (charCount < MIN_QUESTION_LENGTH) {
      setError(
        showHindi 
          ? `कम से कम ${MIN_QUESTION_LENGTH} शब्द आवश्यक हैं`
          : `Minimum ${MIN_QUESTION_LENGTH} characters required`
      );
      return;
    }

    if (isOverLimit) {
      setError(
        showHindi
          ? `अधिकतम ${MAX_QUESTION_LENGTH} शब्द अनुमति हैं`
          : `Maximum ${MAX_QUESTION_LENGTH} characters allowed`
      );
      return;
    }

    // Prepare submission data
    const submissionData = {
      title: {
        en: title,
        hi: language === 'hi' || language === 'bilingual' ? title : undefined,
      },
      subject,
      topic: topic || undefined,
      question,
      attachments: attachments.length > 0 ? attachments.map(a => ({ type: a.type, url: a.url })) : undefined,
      language,
    };

    try {
      await onSubmit(submissionData);
      
      // Reset form on success
      setTitle('');
      setQuestion('');
      setTopic('');
      setAttachments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : showHindi ? 'प्रश्न जमा करने में विफल' : 'Failed to submit doubt');
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 300)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-saffron-100 rounded-lg">
          <BookOpen className="w-5 h-5 text-saffron-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {showHindi ? 'अपना संदेह पूछें' : 'Ask Your Doubt'}
          </h2>
          <p className="text-sm text-gray-500">
            {showHindi ? 'टेक्स्ट, छवि या आवाज़ का उपयोग करें' : 'Use text, image, or voice'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {showHindi ? 'शीर्षक' : 'Title'} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={showHindi ? 'उदाहरण: संघीयता क्या है?' : 'e.g., What is Fiscal Federalism?'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
          maxLength={200}
        />
      </div>

      {/* Subject & Topic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {showHindi ? 'विषय' : 'Subject'} *
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
          >
            {SUBJECTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {showHindi ? 'विषय/टॉपिक' : 'Topic (Optional)'}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={showHindi ? 'उदाहरण: भारतीय संविधान' : 'e.g., Indian Constitution'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
            maxLength={100}
          />
        </div>
      </div>

      {/* Question Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {showHindi ? 'आपका प्रश्न' : 'Your Question'} *
        </label>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={handleTextareaChange}
          placeholder={
            showHindi
              ? 'अपना प्रश्न विस्तार से लिखें...'
              : 'Describe your doubt in detail...'
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500 resize-none"
          maxLength={MAX_QUESTION_LENGTH + 1}
          disabled={isLoading}
        />
        
        {/* Character Counter */}
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${
            isOverLimit ? 'text-red-600' : isUnderMin ? 'text-amber-600' : 'text-gray-500'
          }`}>
            {charCount} / {MAX_QUESTION_LENGTH}
          </span>
          {isUnderMin && (
            <span className="text-xs text-amber-600">
              {showHindi ? `कम से कम ${MIN_QUESTION_LENGTH} शब्द` : `Min ${MIN_QUESTION_LENGTH} chars`}
            </span>
          )}
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {showHindi ? 'अनुलग्नक' : 'Attachments'} ({attachments.length}/{MAX_ATTACHMENTS})
          </label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, index) => (
              <div key={index} className="relative group">
                {att.type === 'image' ? (
                  <img
                    src={att.preview || att.url}
                    alt="Attachment"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-saffron-50 rounded-lg border border-gray-200 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-saffron-600" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Upload & Voice Recorder */}
      <div className="flex flex-wrap gap-3">
        <ImageUpload
          onUpload={handleFileUpload}
          maxFiles={MAX_ATTACHMENTS - attachments.length}
          showHindi={showHindi}
        />
        
        <VoiceRecorder
          onRecordingComplete={handleVoiceRecording}
          isRecording={isRecording}
          onRecordingChange={setIsRecording}
          showHindi={showHindi}
        />
      </div>

      {/* Language Selection */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <Languages className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {showHindi ? 'भाषा:' : 'Language:'}
        </span>
        <div className="flex gap-1">
          {(['en', 'hi', 'bilingual'] as const).map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                language === lang
                  ? 'bg-saffron-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || charCount < MIN_QUESTION_LENGTH || isOverLimit}
        className="w-full py-3 bg-saffron-600 text-white rounded-lg font-medium hover:bg-saffron-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {showHindi ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            {showHindi ? 'प्रश्न पूछें' : 'Ask Question'}
          </>
        )}
      </button>
    </form>
  );
}
