'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Link2, Youtube as YoutubeIcon, List, ListOrdered, Code, Heading2, Heading3, Undo, Redo } from 'lucide-react'
import { useCallback } from 'react'

interface TiptapEditorProps {
  content: Record<string, unknown> | null
  onChange: (json: Record<string, unknown>) => void
  placeholder?: string
}

export default function TiptapEditor({ content, onChange, placeholder = 'Write step content...' }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ controls: true }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>)
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter URL:')
    if (!url) { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const addYoutube = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter YouTube URL:')
    if (!url) return
    editor.commands.setYoutubeVideo({ src: url })
  }, [editor])

  if (!editor) return null

  const btn = (action: () => boolean | void, isActive: boolean, title: string, icon: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={() => action()}
      className={`p-1.5 rounded transition ${isActive ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-dark-700">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
        {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Bold', <Bold size={14} />)}
        {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Italic', <Italic size={14} />)}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'Heading 2', <Heading2 size={14} />)}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'Heading 3', <Heading3 size={14} />)}
        <div className="w-px h-4 bg-white/20 mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), 'Bullet List', <List size={14} />)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), 'Numbered List', <ListOrdered size={14} />)}
        {btn(() => editor.chain().focus().toggleCodeBlock().run(), editor.isActive('codeBlock'), 'Code Block', <Code size={14} />)}
        <div className="w-px h-4 bg-white/20 mx-1" />
        {btn(setLink, editor.isActive('link'), 'Add Link', <Link2 size={14} />)}
        {btn(addYoutube, false, 'Add YouTube', <YoutubeIcon size={14} />)}
        <div className="w-px h-4 bg-white/20 mx-1" />
        {btn(() => editor.chain().focus().undo().run(), false, 'Undo', <Undo size={14} />)}
        {btn(() => editor.chain().focus().redo().run(), false, 'Redo', <Redo size={14} />)}
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-invert prose-sm max-w-none p-4 min-h-[200px] focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[180px]"
      />
    </div>
  )
}
