import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import EditorToolbar from './EditorToolbar'

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  label?: string
  hint?: string
}

export default function RichEditor({ value, onChange, placeholder, minHeight = '200px', label, hint }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-editor outline-none',
        style: `min-height: ${minHeight}; padding: 16px; color: #e5e5e5; font-size: 14px; line-height: 1.7;`,
      },
    },
  })

  return (
    <div>
      {label && (
        <div className="mb-1.5">
          <label className="text-xs text-neutral-500 font-medium">{label}</label>
          {hint && <span className="text-xs text-neutral-700 ml-2">{hint}</span>}
        </div>
      )}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/50 focus-within:border-[#00bfff]/40 transition-colors">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
