import type { Editor } from '@tiptap/react'

interface ToolbarProps {
  editor: Editor | null
}

// ─── SVG Icon Buttons ──────────────────────────────────
const Btn = ({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer ${
      active ? 'bg-[#00bfff]/15 text-[#00bfff]' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
    }`}
  >
    {children}
  </button>
)

const Div = () => <div className="w-px h-5 bg-neutral-800 mx-0.5" />

export default function EditorToolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const promptLink = () => {
    const prev = editor.getAttributes('link').href
    const url = window.prompt('URL', prev || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    const url = window.prompt('Image URL', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 rounded-t-xl sticky top-0 z-10">
      {/* Text formatting */}
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M4 2.5h5a3 3 0 010 6H4V2.5z" stroke="currentColor" strokeWidth="1.5"/><path d="M4 8.5h6a3 3 0 010 6H4V8.5z" stroke="currentColor" strokeWidth="1.5"/></svg>
      </Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M10 2.5H6M10 13.5H6M9.5 2.5L6.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M4 2.5v5a4 4 0 008 0v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 14.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M5 4.5c0-1.1 1.3-2 3-2s3 .9 3 2c0 .7-.5 1.3-1.2 1.7M3 8.5h10M11 11.5c0 1.1-1.3 2-3 2s-3-.9-3-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>

      <Div />

      {/* Block types */}
      <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><text x="2" y="13" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="system-ui">H1</text></svg>
      </Btn>
      <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><text x="1" y="13" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="system-ui">H2</text></svg>
      </Btn>
      <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><text x="1" y="13" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="system-ui">H3</text></svg>
      </Btn>
      <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 4h3v4H3zM9 4h3v4H9z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8c0 2-1 3.5-3 4M12 8c0 2-1 3.5-3 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code Block">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Btn>

      <Div />

      {/* Lists */}
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><path d="M6.5 4h7M6.5 8h7M6.5 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><text x="1" y="5.5" fill="currentColor" fontSize="5" fontFamily="system-ui" fontWeight="700">1.</text><text x="1" y="9.5" fill="currentColor" fontSize="5" fontFamily="system-ui" fontWeight="700">2.</text><text x="1" y="13.5" fill="currentColor" fontSize="5" fontFamily="system-ui" fontWeight="700">3.</text><path d="M6.5 4h7M6.5 8h7M6.5 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>

      <Div />

      {/* Alignment */}
      <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6.5h8M2 10h10M2 13.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6.5h8M3 10h10M5 13.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
      <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6.5h8M4 10h10M8 13.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>

      <Div />

      {/* Insert */}
      <Btn active={editor.isActive('link')} onClick={promptLink} title="Insert Link">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8.5 11.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1M7.5 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
      <Btn onClick={insertImage} title="Insert Image">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/><path d="M1.5 11l3.5-4 3 3 2-1.5L14.5 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="8" r="0.8" fill="currentColor"/><circle cx="8" cy="8" r="0.8" fill="currentColor"/><circle cx="11" cy="8" r="0.8" fill="currentColor"/></svg>
      </Btn>

      <Div />

      {/* Undo / Redo */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M4 6l-2.5 2.5L4 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 8.5H10a3.5 3.5 0 010 7H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M12 6l2.5 2.5L12 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5 8.5H6a3.5 3.5 0 000 7H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </Btn>
    </div>
  )
}
