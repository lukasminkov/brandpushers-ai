'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Image from '@tiptap/extension-image'
import { useEffect } from 'react'

interface TiptapRendererProps {
  content: Record<string, unknown> | null
}

export default function TiptapRenderer({ content }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Youtube.configure({ controls: true }),
      Image,
    ],
    content: content || undefined,
    editable: false,
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  if (!content) return null

  return (
    <div className="prose prose-invert prose-sm max-w-none
      [&_a]:text-brand-orange [&_a]:no-underline [&_a:hover]:underline
      [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
      [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2
      [&_p]:text-gray-300 [&_p]:leading-relaxed [&_p]:mb-4
      [&_ul]:space-y-1 [&_li]:text-gray-300
      [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-brand-orange
      [&_pre]:bg-black/40 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto
      [&_blockquote]:border-l-2 [&_blockquote]:border-brand-orange [&_blockquote]:pl-4 [&_blockquote]:text-gray-400 [&_blockquote]:italic">
      <EditorContent editor={editor} />
    </div>
  )
}
