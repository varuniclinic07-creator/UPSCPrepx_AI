/**
 * Editor Toolbar - User Content Studio (Feature F4)
 * 
 * Formatting toolbar for TipTap editor
 * Master Prompt v8.0 - READ Mode
 * 
 * Features:
 * - All formatting options (bold, italic, underline, etc.)
 * - Headings (H1-H4)
 * - Lists (bullet, ordered, task)
 * - Tables, images, links
 * - Text alignment
 * - Highlight, code block
 * - Export menu integration
 * - Template selector
 * 
 * AI Provider: 9Router → Groq → Ollama
 */

'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListTodo,
  Table,
  Image,
  Link,
  Highlighter,
  Code,
  Quote,
  Minus,
  Undo,
  Redo,
  Eraser,
  FileDown,
  FileText,
  ChevronDown,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface EditorToolbarProps {
  editor: Editor;
  showHindi?: boolean;
  onAddImage?: () => void;
  onAddTable?: () => void;
  onAddTaskList?: () => void;
  onClearFormatting?: () => void;
  onExport?: (format: 'pdf' | 'docx' | 'md') => void;
}

// ============================================================================
// TOOLBAR BUTTON COMPONENT
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  shortcut?: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  shortcut,
}: ToolbarButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`
        p-2 rounded-lg transition-colors
        ${isActive ? 'bg-saffron-100 text-saffron-600' : 'hover:bg-gray-100 text-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

// ============================================================================
// DROPDOWN COMPONENT
// ============================================================================

interface ToolbarDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

function ToolbarDropdown({
  trigger,
  children,
}: ToolbarDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditorToolbar({
  editor,
  showHindi = false,
  onAddImage,
  onAddTable,
  onAddTaskList,
  onClearFormatting,
  onExport,
}: EditorToolbarProps): JSX.Element {
  // Export menu state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Translations
  const t = {
    bold: showHindi ? 'मोटा' : 'Bold',
    italic: showHindi ? 'तिरछा' : 'Italic',
    underline: showHindi ? 'रेखांकित' : 'Underline',
    strike: showHindi ? 'कटा हुआ' : 'Strikethrough',
    alignLeft: showHindi ? 'बाएँ संरेखित' : 'Align Left',
    alignCenter: showHindi ? 'केंद्रित' : 'Align Center',
    alignRight: showHindi ? 'दाएँ संरेखित' : 'Align Right',
    alignJustify: showHindi ? 'समानुभूति' : 'Justify',
    bulletList: showHindi ? 'बुलेट सूची' : 'Bullet List',
    orderedList: showHindi ? 'क्रमबद्ध सूची' : 'Ordered List',
    taskList: showHindi ? 'कार्य सूची' : 'Task List',
    table: showHindi ? 'तालिका' : 'Table',
    image: showHindi ? 'छवि' : 'Image',
    link: showHindi ? 'लिंक' : 'Link',
    highlight: showHindi ? 'हाइलाइट' : 'Highlight',
    code: showHindi ? 'कोड' : 'Code',
    quote: showHindi ? 'उद्धरण' : 'Quote',
    divider: showHindi ? 'विभाजक' : 'Divider',
    undo: showHindi ? 'पूर्ववत करें' : 'Undo',
    redo: showHindi ? 'फिर से करें' : 'Redo',
    clearFormat: showHindi ? 'फ़ॉर्मेट साफ़ करें' : 'Clear Format',
    export: showHindi ? 'निर्यात' : 'Export',
    exportPdf: showHindi ? 'PDF के रूप में' : 'As PDF',
    exportWord: showHindi ? 'Word के रूप में' : 'As Word',
    exportMd: showHindi ? 'Markdown के रूप में' : 'As Markdown',
    heading: showHindi ? 'शीर्षक' : 'Heading',
    h1: 'H1',
    h2: 'H2',
    h3: 'H3',
    h4: 'H4',
    paragraph: showHindi ? 'अनुच्छेद' : 'Paragraph',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 mb-4">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title={t.undo}
          shortcut="Ctrl+Z"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title={t.redo}
          shortcut="Ctrl+Y"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Headings */}
        <ToolbarDropdown
          trigger={
            <ToolbarButton
              onClick={() => {}}
              title={t.heading}
            >
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm">¶</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </ToolbarButton>
          }
        >
          <div className="p-1">
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setShowExportMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            >
              <span className="font-bold text-lg">{t.h1}</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setShowExportMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            >
              <span className="font-bold">{t.h2}</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setShowExportMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            >
              <span className="font-semibold">{t.h3}</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 4 }).run();
                setShowExportMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${editor.isActive('heading', { level: 4 }) ? 'bg-saffron-100 text-saffron-600' : ''}`}
            >
              <span>{t.h4}</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setParagraph().run();
                setShowExportMenu(false);
              }}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${editor.isActive('paragraph') ? 'bg-saffron-100 text-saffron-600' : ''}`}
            >
              {t.paragraph}
            </button>
          </div>
        </ToolbarDropdown>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Basic Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title={t.bold}
          shortcut="Ctrl+B"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title={t.italic}
          shortcut="Ctrl+I"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title={t.underline}
          shortcut="Ctrl+U"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title={t.strike}
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title={t.alignLeft}
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title={t.alignCenter}
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title={t.alignRight}
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title={t.alignJustify}
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title={t.bulletList}
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title={t.orderedList}
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (onAddTaskList) onAddTaskList();
            else editor.chain().focus().toggleTaskList().run();
          }}
          isActive={editor.isActive('taskList')}
          title={t.taskList}
        >
          <ListTodo className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Insert Elements */}
        <ToolbarButton
          onClick={() => {
            if (onAddTable) onAddTable();
            else editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }}
          isActive={editor.isActive('table')}
          title={t.table}
        >
          <Table className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (onAddImage) onAddImage();
            else {
              const url = window.prompt('Enter image URL:');
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title={t.image}
        >
          <Image className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter link URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          isActive={editor.isActive('link')}
          title={t.link}
        >
          <Link className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title={t.highlight}
        >
          <Highlighter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title={t.code}
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title={t.quote}
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title={t.divider}
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Clear Formatting */}
        <ToolbarButton
          onClick={() => {
            if (onClearFormatting) onClearFormatting();
            else editor.chain().focus().clearNodes().unsetAllMarks().run();
          }}
          title={t.clearFormat}
        >
          <Eraser className="w-4 h-4" />
        </ToolbarButton>

        {/* Export Menu */}
        {onExport && (
          <ToolbarDropdown
            trigger={
              <ToolbarButton
                onClick={() => setShowExportMenu(!showExportMenu)}
                title={t.export}
              >
                <div className="flex items-center gap-1">
                  <FileDown className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </div>
              </ToolbarButton>
            }
          >
            <div className="p-1">
              <button
                onClick={() => {
                  onExport('pdf');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t.exportPdf}
              </button>
              <button
                onClick={() => {
                  onExport('docx');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t.exportWord}
              </button>
              <button
                onClick={() => {
                  onExport('md');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t.exportMd}
              </button>
            </div>
          </ToolbarDropdown>
        )}
      </div>
    </div>
  );
}
