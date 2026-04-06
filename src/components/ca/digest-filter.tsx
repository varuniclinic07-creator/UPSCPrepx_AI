/**
 * Digest Filter Component
 * 
 * Filter bar for Daily Current Affairs with:
 * - Subject filter (GS1, GS2, GS3, GS4, Essay)
 * - Date range picker
 * - Importance filter (1-5 stars)
 * - Category filter
 * - Search by keyword
 * - Bilingual labels (EN+HI)
 * 
 * Master Prompt v8.0 - Feature F2 (READ Mode)
 * Design: Saffron Scholar theme, mobile-first (360px)
 */

'use client';

import React, { useState } from 'react';
import { Filter, Search, Calendar, Star, X, ChevronDown } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

export interface FilterState {
  subject: string | null;
  dateFrom: string;
  dateTo: string;
  importance: number | null;
  category: string | null;
  search: string;
}

interface DigestFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  showHindi?: boolean;
  onToggleLanguage?: () => void;
  className?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUBJECTS = [
  { id: 'GS1', label: 'GS1', labelHindi: 'सामान्य अध्ययन 1' },
  { id: 'GS2', label: 'GS2', labelHindi: 'सामान्य अध्ययन 2' },
  { id: 'GS3', label: 'GS3', labelHindi: 'सामान्य अध्ययन 3' },
  { id: 'GS4', label: 'GS4', labelHindi: 'सामान्य अध्ययन 4' },
  { id: 'Essay', label: 'Essay', labelHindi: 'निबंध' },
];

const CATEGORIES = [
  'Polity',
  'Economy',
  'Environment',
  'Science & Tech',
  'History',
  'Geography',
  'International Relations',
  'Social Issues',
  'Governance',
  'Security',
  'Agriculture',
  'Health',
  'Education',
];

const IMPORTANCE_LEVELS = [1, 2, 3, 4, 5];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Subject Filter Buttons
 */
interface SubjectFilterProps {
  selected: string | null;
  onSelect: (subject: string | null) => void;
  showHindi?: boolean;
}

function SubjectFilter({ selected, onSelect, showHindi = false }: SubjectFilterProps) {
  const colors: Record<string, string> = {
    GS1: 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100',
    GS2: 'bg-green-50 text-green-800 border-green-300 hover:bg-green-100',
    GS3: 'bg-orange-50 text-orange-800 border-orange-300 hover:bg-orange-100',
    GS4: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
    Essay: 'bg-pink-50 text-pink-800 border-pink-300 hover:bg-pink-100',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* All Button */}
      <button
        onClick={() => onSelect(null)}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200
          ${
            selected === null
              ? 'bg-saffron-600 text-white border-saffron-600 shadow-md'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        {showHindi ? 'सभी' : 'All'}
      </button>

      {/* Subject Buttons */}
      {SUBJECTS.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject.id)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200
            ${
              selected === subject.id
                ? `${colors[subject.id]} shadow-md ring-2 ring-offset-1 ring-saffron-300`
                : colors[subject.id]
            }
          `}
        >
          {showHindi ? subject.labelHindi : subject.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Importance Filter (Star Rating)
 */
interface ImportanceFilterProps {
  selected: number | null;
  onSelect: (importance: number | null) => void;
  showHindi?: boolean;
}

function ImportanceFilter({ selected, onSelect, showHindi = false }: ImportanceFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        {showHindi ? 'महत्व' : 'Importance'}:
      </span>
      
      <div className="flex items-center gap-1">
        {/* All Button */}
        <button
          onClick={() => onSelect(null)}
          className={`
            px-2 py-1 text-xs rounded transition-colors
            ${
              selected === null
                ? 'bg-saffron-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {showHindi ? 'सभी' : 'All'}
        </button>

        {/* Star Buttons */}
        {IMPORTANCE_LEVELS.map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`
              px-2 py-1 text-sm rounded transition-colors
              ${
                selected === level
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <div className="flex items-center gap-0.5">
              {[...Array(level)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Category Dropdown
 */
interface CategoryDropdownProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  showHindi?: boolean;
}

function CategoryDropdown({ selected, onSelect, showHindi = false }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700">
          {selected || (showHindi ? 'श्रेणी' : 'Category')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {/* All Option */}
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2 text-left text-sm transition-colors
                ${
                  selected === null
                    ? 'bg-saffron-50 text-saffron-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {showHindi ? 'सभी श्रेणियाँ' : 'All Categories'}
            </button>

            {/* Category Options */}
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onSelect(category);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2 text-left text-sm transition-colors
                  ${
                    selected === category
                      ? 'bg-saffron-50 text-saffron-800'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Date Range Picker
 */
interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
  showHindi?: boolean;
}

function DateRangePicker({ dateFrom, dateTo, onChange, showHindi = false }: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const handleQuickSelect = (from: string, to: string) => {
    onChange(from, to);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">
          {showHindi ? 'दिनांक सीमा' : 'Date Range'}
        </span>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleQuickSelect(lastWeek, today)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {showHindi ? 'पिछले 7 दिन' : 'Last 7 Days'}
        </button>
        <button
          onClick={() => handleQuickSelect(lastMonth, today)}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          {showHindi ? 'पिछले 30 दिन' : 'Last 30 Days'}
        </button>
      </div>

      {/* Date Inputs */}
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChange(e.target.value, dateTo)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
        />
        <span className="text-gray-500">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChange(dateFrom, e.target.value)}
          max={today}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
        />
      </div>
    </div>
  );
}

/**
 * Search Input
 */
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  showHindi?: boolean;
}

function SearchInput({ value, onChange, onClear, showHindi = false }: SearchInputProps) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={showHindi ? 'खोजें...' : 'Search topics, keywords...'}
        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-saffron-500 focus:border-saffron-500"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DigestFilter({
  filters,
  onFilterChange,
  showHindi = false,
  onToggleLanguage,
  className = '',
}: DigestFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFilterChange({
      subject: null,
      dateFrom: '',
      dateTo: '',
      importance: null,
      category: null,
      search: '',
    });
  };

  const hasActiveFilters = 
    filters.subject || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.importance || 
    filters.category || 
    filters.search;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {showHindi ? 'फ़िल्टर' : 'Filters'}
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-saffron-600 hover:text-saffron-700 font-medium"
            >
              {showHindi ? 'सभी साफ़ करें' : 'Clear All'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {showHindi ? 'English' : 'हिंदी'}
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">
              {showAdvanced 
                ? (showHindi ? 'कम' : 'Less') 
                : (showHindi ? 'अधिक' : 'More')}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={filters.search}
          onChange={(value) => updateFilter('search', value)}
          onClear={() => updateFilter('search', '')}
          showHindi={showHindi}
        />
      </div>

      {/* Subject Filter (Always Visible) */}
      <div>
        <SubjectFilter
          selected={filters.subject}
          onSelect={(subject) => updateFilter('subject', subject)}
          showHindi={showHindi}
        />
      </div>

      {/* Advanced Filters (Collapsible) */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Importance Filter */}
          <ImportanceFilter
            selected={filters.importance}
            onSelect={(importance) => updateFilter('importance', importance)}
            showHindi={showHindi}
          />

          {/* Category Filter */}
          <div>
            <CategoryDropdown
              selected={filters.category}
              onSelect={(category) => updateFilter('category', category)}
              showHindi={showHindi}
            />
          </div>

          {/* Date Range Filter */}
          <DateRangePicker
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            onChange={(from, to) => {
              updateFilter('dateFrom', from);
              updateFilter('dateTo', to);
            }}
            showHindi={showHindi}
          />
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            {showHindi ? 'सक्रिय फ़िल्टर:' : 'Active Filters:'}
          </span>
          
          {filters.subject && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-saffron-100 text-saffron-800 rounded">
              {filters.subject}
              <button onClick={() => updateFilter('subject', null)} className="hover:text-saffron-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.importance && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
              <Star className="w-3 h-3 fill-current" />
              {filters.importance}+
              <button onClick={() => updateFilter('importance', null)} className="hover:text-amber-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              {filters.category}
              <button onClick={() => updateFilter('category', null)} className="hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              <Calendar className="w-3 h-3" />
              {filters.dateFrom || '...'} → {filters.dateTo || '...'}
              <button onClick={() => {
                updateFilter('dateFrom', '');
                updateFilter('dateTo', '');
              }} className="hover:text-gray-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DigestFilter;
