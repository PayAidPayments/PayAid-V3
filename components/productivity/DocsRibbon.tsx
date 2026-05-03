'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Undo,
  Redo,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  FileText,
  Home,
  ImagePlus,
  Eye,
  HelpCircle,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'

const tabBtn =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-transparent -mb-px hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors'
const tabBtnActive =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-purple-500 -mb-px bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
const ribBtn =
  'p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50'
const ribGroupLabel =
  'text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1'
const ribGroup = 'flex flex-col border-r border-slate-200 dark:border-slate-600 pr-4 last:border-r-0'

export type DocsRibbonTab = 'file' | 'home' | 'insert' | 'view' | 'help'

export interface DocsRibbonProps {
  editor: Editor | null
  backHref: string
  name: string
  isSaving?: boolean
}

export function DocsRibbon({ editor, backHref, name, isSaving }: DocsRibbonProps) {
  const [activeTab, setActiveTab] = useState<DocsRibbonTab>('home')

  if (!editor) return null

  const RibButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${ribBtn} ${active ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-slate-100' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 shrink-0">
      {/* Quick access + title + tabs row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center min-w-0">
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
            <Link
              href={backHref}
              className={ribBtn}
              title="Back to documents"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <button type="button" disabled className={ribBtn} title="Save">
              <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={ribBtn}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={ribBtn}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate px-3 max-w-[200px]">
            {name || 'Untitled document'}
          </span>
          <nav className="hidden sm:flex items-center gap-0.5 px-2 ml-2">
            {(
              [
                ['file', 'File', FileText],
                ['home', 'Home', Home],
                ['insert', 'Insert', ImagePlus],
                ['view', 'View', Eye],
                ['help', 'Help', HelpCircle],
              ] as const
            ).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? tabBtnActive : tabBtn}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 px-3 flex items-center gap-1 shrink-0">
          <Save className="h-3.5 w-3.5" />
          Auto-saved
        </span>
      </div>

      {/* Ribbon content row (like Microsoft/Google band) */}
      <div className="flex items-start gap-4 px-4 py-3 bg-white dark:bg-slate-900">
        {activeTab === 'home' && (
          <>
            <div className={ribGroup}>
              <span className={ribGroupLabel}>Clipboard</span>
              <div className="flex items-center gap-0.5">
                <RibButton
                  onClick={() => editor.chain().focus().undo().run()}
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().redo().run()}
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </RibButton>
              </div>
            </div>
            <div className={ribGroup}>
              <span className={ribGroupLabel}>Font</span>
              <div className="flex items-center gap-0.5">
                <RibButton
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  active={editor.isActive('bold')}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  active={editor.isActive('italic')}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  active={editor.isActive('strike')}
                  title="Strikethrough"
                >
                  <Strikethrough className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  active={editor.isActive('code')}
                  title="Code"
                >
                  <Code className="h-4 w-4" />
                </RibButton>
              </div>
            </div>
            <div className={ribGroup}>
              <span className={ribGroupLabel}>Paragraph</span>
              <div className="flex items-center gap-0.5 flex-wrap">
                <RibButton
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  active={editor.isActive('heading', { level: 1 })}
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  active={editor.isActive('heading', { level: 2 })}
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  active={editor.isActive('heading', { level: 3 })}
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  active={editor.isActive('bulletList')}
                  title="Bullet list"
                >
                  <List className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  active={editor.isActive('orderedList')}
                  title="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  active={editor.isActive('blockquote')}
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </RibButton>
                <RibButton
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  title="Horizontal rule"
                >
                  <Minus className="h-4 w-4" />
                </RibButton>
              </div>
            </div>
          </>
        )}
        {activeTab === 'file' && (
          <div className={ribGroup}>
            <span className={ribGroupLabel}>Document</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Save and other file options (coming soon).</p>
          </div>
        )}
        {activeTab === 'insert' && (
          <div className={ribGroup}>
            <span className={ribGroupLabel}>Insert</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Images and more (coming soon).</p>
          </div>
        )}
        {activeTab === 'view' && (
          <div className={ribGroup}>
            <span className={ribGroupLabel}>View</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Zoom and view options (coming soon).</p>
          </div>
        )}
        {activeTab === 'help' && (
          <div className={ribGroup}>
            <span className={ribGroupLabel}>Help</span>
            <p className="text-xs text-slate-500 dark:text-slate-400">Shortcuts and help (coming soon).</p>
          </div>
        )}
      </div>
    </div>
  )
}
