'use client'

import { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  DocsRibbon,
} from '@/components/productivity/DocsRibbon'

const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Start typing...' }],
    },
  ],
}

export type DocContent = typeof DEFAULT_CONTENT

interface PayAidDocEditorProps {
  documentId: string
  name: string
  initialContent: DocContent | null
  token: string
  backHref: string
  onSave?: (name: string, content: DocContent) => void
}

const SAVE_DEBOUNCE_MS = 1500

export function PayAidDocEditor({
  documentId,
  name,
  initialContent,
  token,
  backHref,
  onSave,
}: PayAidDocEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<DocContent | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const content = useMemo(
    () => (initialContent && initialContent.type === 'doc' ? initialContent : DEFAULT_CONTENT),
    [initialContent]
  )

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content,
      editorProps: {
        attributes: {
          class:
            'prose prose-slate dark:prose-invert max-w-none min-h-[360px] px-5 py-4 focus:outline-none text-slate-900 dark:text-slate-100',
        },
      },
      immediatelyRender: false,
    },
    [content]
  )

  const saveToApi = useCallback(
    async (json: DocContent) => {
      if (lastSavedRef.current === json) return
      setIsSaving(true)
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: json }),
        })
        if (res.ok) {
          lastSavedRef.current = json
          onSave?.(name, json)
        }
      } catch (e) {
        console.error('Save document failed:', e)
      } finally {
        setIsSaving(false)
      }
    },
    [documentId, token, name, onSave]
  )

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      const json = editor.getJSON() as DocContent
      saveTimeoutRef.current = setTimeout(() => {
        saveToApi(json)
        saveTimeoutRef.current = null
      }, SAVE_DEBOUNCE_MS)
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [editor, saveToApi])

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-slate-500 dark:text-slate-400">
        Loading editor...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Ribbon band (like Microsoft Word / Google Docs / Sheets) */}
      <DocsRibbon
        editor={editor}
        backHref={backHref}
        name={name || 'Untitled document'}
        isSaving={isSaving}
      />

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
