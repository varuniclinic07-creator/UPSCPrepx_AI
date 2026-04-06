/**
 * Export Menu - User Content Studio (Feature F4)
 * 
 * Export dialog for PDF, Word, Markdown formats
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - Multiple export formats
 * - Export settings
 * - Progress tracking
 * - Download history
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState } from 'react';
import {
  FileDown,
  FileText,
  Download,
  X,
  Settings,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  FolderOpen,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportMenuProps {
  noteId: string;
  noteTitle: { en: string; hi: string };
  isOpen: boolean;
  onClose: () => void;
  showHindi?: boolean;
  onExport?: (format: 'pdf' | 'docx' | 'md', options: ExportOptions) => void;
}

export interface ExportOptions {
  includeMetadata: boolean;
  includeTimestamp: boolean;
  pageSize: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
}

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  format: string;
  exportedAt: string;
  fileSize?: number;
  downloadCount: number;
}

// ============================================================================
// EXPORT FORMAT CARD
// ============================================================================

interface ExportFormatCardProps {
  format: 'pdf' | 'docx' | 'md';
  isSelected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  showHindi?: boolean;
}

function ExportFormatCard({
  format,
  isSelected,
  onSelect,
  icon,
  title,
  description,
  showHindi = false,
}: ExportFormatCardProps): JSX.Element {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full p-4 rounded-xl border-2 transition-all
        ${isSelected
          ? 'border-saffron-500 bg-saffron-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-saffron-100 text-saffron-600' : 'bg-gray-100 text-gray-600'}`}>
          {icon}
        </div>
        <div className="text-left flex-1">
          <p className={`font-semibold ${isSelected ? 'text-saffron-900' : 'text-gray-900'}`}>
            {title}
          </p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {isSelected && (
          <Check className="w-5 h-5 text-saffron-600" />
        )}
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExportMenu({
  noteId,
  noteTitle,
  isOpen,
  onClose,
  showHindi = false,
  onExport,
}: ExportMenuProps): JSX.Element | null {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'md'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Export options
  const [options, setOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeTimestamp: true,
    pageSize: 'a4',
    orientation: 'portrait',
  });

  // Translations
  const t = {
    export: showHindi ? 'निर्यात' : 'Export',
    exportNote: showHindi ? 'नोट निर्यात करें' : 'Export Note',
    selectFormat: showHindi ? 'फ़ॉर्मेट चुनें' : 'Select Format',
    pdf: 'PDF',
    pdfDesc: showHindi ? 'सबसे अच्छा प्रिंटिंग और शेयरिंग के लिए' : 'Best for printing and sharing',
    word: 'Word',
    wordDesc: showHindi ? 'संपादन और सहयोग के लिए' : 'For editing and collaboration',
    markdown: 'Markdown',
    markdownDesc: showHindi ? 'डेवलपर्स और वेब के लिए' : 'For developers and web',
    options: showHindi ? 'विकल्प' : 'Options',
    includeMetadata: showHindi ? 'मेटाडेटा शामिल करें' : 'Include metadata',
    includeTimestamp: showHindi ? 'टाइमस्टैम्प शामिल करें' : 'Include timestamp',
    pageSize: showHindi ? 'पेज आकार' : 'Page size',
    orientation: showHindi ? 'ओरिएंटेशन' : 'Orientation',
    portrait: showHindi ? 'पोर्ट्रेट' : 'Portrait',
    landscape: showHindi ? 'लैंडस्केप' : 'Landscape',
    exportBtn: showHindi ? 'निर्यात करें' : 'Export',
    cancel: showHindi ? 'रद्द करें' : 'Cancel',
    exporting: showHindi ? 'निर्यात हो रहा है...' : 'Exporting...',
    exportSuccess: showHindi ? 'निर्यात सफल!' : 'Export successful!',
    exportError: showHindi ? 'निर्यात विफल' : 'Export failed',
    download: showHindi ? 'डाउनलोड' : 'Download',
    history: showHindi ? 'इतिहास' : 'History',
    noHistory: showHindi ? 'कोई निर्यात इतिहास नहीं' : 'No export history',
  };

  // Handle export
  const handleExport = async () => {
    if (!onExport) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onExport(selectedFormat, options);

      clearInterval(progressInterval);
      setExportProgress(100);

      // Close after success
      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Don't render if closed
  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.exportNote}
              </h2>
              <p className="text-sm text-gray-500 truncate mt-1">
                {showHindi && noteTitle.hi ? noteTitle.hi : noteTitle.en}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {!showHistory ? (
              <>
                {/* Format Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t.selectFormat}
                  </h3>
                  <div className="space-y-3">
                    <ExportFormatCard
                      format="pdf"
                      isSelected={selectedFormat === 'pdf'}
                      onSelect={() => setSelectedFormat('pdf')}
                      icon={<FileText className="w-5 h-5" />}
                      title={t.pdf}
                      description={t.pdfDesc}
                      showHindi={showHindi}
                    />
                    <ExportFormatCard
                      format="docx"
                      isSelected={selectedFormat === 'docx'}
                      onSelect={() => setSelectedFormat('docx')}
                      icon={<FileText className="w-5 h-5" />}
                      title={t.word}
                      description={t.wordDesc}
                      showHindi={showHindi}
                    />
                    <ExportFormatCard
                      format="md"
                      isSelected={selectedFormat === 'md'}
                      onSelect={() => setSelectedFormat('md')}
                      icon={<FileText className="w-5 h-5" />}
                      title={t.markdown}
                      description={t.markdownDesc}
                      showHindi={showHindi}
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {t.options}
                  </h3>
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                    {/* Metadata */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeMetadata}
                        onChange={(e) =>
                          setOptions({ ...options, includeMetadata: e.target.checked })
                        }
                        className="w-4 h-4 text-saffron-600 rounded focus:ring-saffron-500"
                      />
                      <span className="text-sm text-gray-700">{t.includeMetadata}</span>
                    </label>

                    {/* Timestamp */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeTimestamp}
                        onChange={(e) =>
                          setOptions({ ...options, includeTimestamp: e.target.checked })
                        }
                        className="w-4 h-4 text-saffron-600 rounded focus:ring-saffron-500"
                      />
                      <span className="text-sm text-gray-700">{t.includeTimestamp}</span>
                    </label>

                    {/* Page Size */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">{t.pageSize}:</span>
                      <select
                        value={options.pageSize}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            pageSize: e.target.value as 'a4' | 'letter',
                          })
                        }
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-saffron-500"
                      >
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                      </select>
                    </div>

                    {/* Orientation */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">{t.orientation}:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setOptions({ ...options, orientation: 'portrait' })
                          }
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            options.orientation === 'portrait'
                              ? 'bg-saffron-100 text-saffron-700'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {t.portrait}
                        </button>
                        <button
                          onClick={() =>
                            setOptions({ ...options, orientation: 'landscape' })
                          }
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            options.orientation === 'landscape'
                              ? 'bg-saffron-100 text-saffron-700'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {t.landscape}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Progress */}
                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.exporting}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-saffron-500 transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      {exportProgress}%
                    </p>
                  </div>
                )}

                {/* Error */}
                {exportError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{t.exportError}: {exportError}</span>
                  </div>
                )}
              </>
            ) : (
              /* Export History */
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.history}
                </h3>
                <div className="space-y-2">
                  {/* Mock history - would be fetched from API */}
                  <p className="text-sm text-gray-500 text-center py-8">
                    {t.noHistory}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!showHistory && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
              <div className="flex items-center justify-between gap-3">
                {/* History button */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  {t.history}
                </button>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isExporting ? t.exporting : t.exportBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MINI EXPORT BUTTON
// ============================================================================

export interface MiniExportButtonProps {
  onClick: () => void;
  showHindi?: boolean;
}

export function MiniExportButton({
  onClick,
  showHindi = false,
}: MiniExportButtonProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-saffron-600 bg-saffron-50 hover:bg-saffron-100 rounded-lg transition-colors"
    >
      <FileDown className="w-4 h-4" />
      {showHindi ? 'निर्यात' : 'Export'}
    </button>
  );
}
