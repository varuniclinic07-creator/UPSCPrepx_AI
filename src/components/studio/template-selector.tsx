/**
 * Template Selector - User Content Studio (Feature F4)
 * 
 * Template browser and selector for answer writing
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - Template categories (GS1-4, Essay, Optional)
 * - Search and filter
 * - Preview templates
 * - Rating and usage stats
 * - Quick insert
 * - Bilingual support (EN+HI)
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Star,
  Users,
  ChevronRight,
  X,
  Eye,
  Plus,
  Filter,
  Grid,
  List,
  Bookmark,
  Clock,
  TrendingUp,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateSelectorProps {
  templates: TemplateItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  showHindi?: boolean;
  category?: string;
}

export interface TemplateItem {
  id: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  category: string;
  subcategory?: string;
  tags: string[];
  wordLimit: number;
  timeLimit: number;
  rating: number;
  usageCount: number;
  isSystem: boolean;
  isPremium: boolean;
  structure: TemplateStructure;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  introduction: SectionGuideline;
  body: SectionGuideline[];
  conclusion: SectionGuideline;
}

export interface TemplateSection {
  id: string;
  title: { en: string; hi: string };
  order: number;
  guideline: { en: string; hi: string };
  placeholder: string;
  minWords: number;
  maxWords: number;
}

export interface SectionGuideline {
  guideline: { en: string; hi: string };
  keyPoints: string[];
  examples: string[];
}

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: TemplateItem;
  view: 'grid' | 'list';
  showHindi?: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplateCard({
  template,
  view,
  showHindi = false,
  onSelect,
  onPreview,
}: TemplateCardProps): JSX.Element {
  const isGrid = view === 'grid';

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all
        ${isGrid ? 'p-4' : 'p-3 flex gap-4'}
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${isGrid ? 'mb-3' : ''}`}>
        <div className="w-12 h-12 bg-saffron-100 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-saffron-600" />
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${isGrid ? '' : 'flex flex-col justify-center'}`}>
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-1">
          {showHindi && template.title.hi ? template.title.hi : template.title.en}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {showHindi && template.description.hi ? template.description.hi : template.description.en}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {/* Category */}
          <span className="px-2 py-1 bg-saffron-50 text-saffron-700 rounded-full font-medium">
            {template.category}
          </span>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-medium">{template.rating.toFixed(1)}</span>
          </div>

          {/* Usage */}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{template.usageCount}</span>
          </div>

          {/* Word Limit */}
          <span>{template.wordLimit} {showHindi ? 'शब्द' : 'words'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex gap-2 ${isGrid ? 'mt-3' : 'flex-col justify-center'}`}>
        <button
          onClick={onPreview}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          title={showHindi ? 'पूर्वावलोकन' : 'Preview'}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onSelect}
          className="p-2 text-saffron-600 hover:bg-saffron-50 rounded-lg transition-colors"
          title={showHindi ? 'चुनें' : 'Select'}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE PREVIEW COMPONENT
// ============================================================================

interface TemplatePreviewProps {
  template: TemplateItem;
  showHindi?: boolean;
  onClose: () => void;
  onSelect: () => void;
}

function TemplatePreview({
  template,
  showHindi = false,
  onClose,
  onSelect,
}: TemplatePreviewProps): JSX.Element {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {showHindi && template.title.hi ? template.title.hi : template.title.en}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {template.category} • {template.wordLimit} {showHindi ? 'शब्द' : 'words'} • {Math.floor(template.timeLimit / 60)} {showHindi ? 'मिनट' : 'min'}
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
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {showHindi ? 'विवरण' : 'Description'}
              </h3>
              <p className="text-gray-600">
                {showHindi && template.description.hi ? template.description.hi : template.description.en}
              </p>
            </div>

            {/* Structure */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {showHindi ? 'संरचना' : 'Structure'}
              </h3>
              <div className="space-y-3">
                {/* Introduction */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-saffron-100 text-saffron-700 text-xs font-semibold rounded">
                      {showHindi ? 'परिचय' : 'Introduction'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {showHindi
                      ? template.structure.introduction.guideline.hi
                      : template.structure.introduction.guideline.en}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.structure.introduction.keyPoints.map((point, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-gray-200 text-xs rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Body Sections */}
                {template.structure.body.map((section, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-saffron-100 text-saffron-700 text-xs font-semibold rounded">
                        {showHindi ? `मुख्य भाग ${i + 1}` : `Body ${i + 1}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {showHindi ? section.guideline.hi : section.guideline.en}
                    </p>
                  </div>
                ))}

                {/* Conclusion */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-saffron-100 text-saffron-700 text-xs font-semibold rounded">
                      {showHindi ? 'निष्कर्ष' : 'Conclusion'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {showHindi
                      ? template.structure.conclusion.guideline.hi
                      : template.structure.conclusion.guideline.en}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.structure.conclusion.keyPoints.map((point, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border border-gray-200 text-xs rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  {showHindi ? 'टैग्स' : 'Tags'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showHindi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              onClick={onSelect}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-saffron-600 hover:bg-saffron-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {showHindi ? 'टेम्पलेट उपयोग करें' : 'Use Template'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TemplateSelector({
  templates,
  isOpen,
  onClose,
  onSelect,
  showHindi = false,
  category,
}: TemplateSelectorProps): JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return ['all', ...Array.from(cats)];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.title.en.toLowerCase().includes(query) ||
          template.title.hi?.toLowerCase().includes(query) ||
          template.description.en.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Translations
  const t = {
    selectTemplate: showHindi ? 'टेम्पलेट चुनें' : 'Select Template',
    search: showHindi ? 'खोजें...' : 'Search...',
    allCategories: showHindi ? 'सभी श्रेणियाँ' : 'All Categories',
    noTemplates: showHindi ? 'कोई टेम्पलेट नहीं मिला' : 'No templates found',
    preview: showHindi ? 'पूर्वावलोकन' : 'Preview',
    useTemplate: showHindi ? 'टेम्पलेट उपयोग करें' : 'Use Template',
    systemTemplate: showHindi ? 'सिस्टम टेम्पलेट' : 'System Template',
    premium: showHindi ? 'प्रीमियम' : 'Premium',
  };

  // Don't render if closed
  if (!isOpen) return null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {t.selectTemplate}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.search}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-saffron-100 text-saffron-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {cat === 'all' ? t.allCategories : cat}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg ${
                    view === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg ${
                    view === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length > 0 ? (
              <div
                className={
                  view === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    view={view}
                    showHindi={showHindi}
                    onSelect={() => onSelect(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t.noTemplates}</p>
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {filteredTemplates.length} {showHindi ? 'टेम्पलेट्स' : 'templates'}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  {showHindi ? 'रेटेड' : 'Rated'}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {showHindi ? 'लोकप्रिय' : 'Popular'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          showHindi={showHindi}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            onSelect(previewTemplate.id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </>
  );
}
