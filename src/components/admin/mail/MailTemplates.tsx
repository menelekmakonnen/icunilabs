import { useState, useRef } from 'react'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import { FileText, Eye, ArrowRight } from 'lucide-react'

type Cat = 'all' | 'careers' | 'referrer' | 'client' | 'team' | 'custom'
const CATS: { id: Cat; label: string; dot: string }[] = [
  { id: 'all', label: 'All', dot: 'bg-white' },
  { id: 'careers', label: 'Careers', dot: 'bg-blue-400' },
  { id: 'client', label: 'Client', dot: 'bg-cyan-400' },
  { id: 'referrer', label: 'Referrer', dot: 'bg-orange-400' },
  { id: 'team', label: 'Team', dot: 'bg-emerald-400' },
  { id: 'custom', label: 'Custom', dot: 'bg-violet-400' },
]

const catColor: Record<string, string> = {
  careers: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  client: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
  referrer: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
  team: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  custom: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
}

export default function MailTemplates({ onUseTemplate }: { onUseTemplate: (id: string) => void }) {
  const { emailTemplates } = useAdminStore()
  const [cat, setCat] = useState<Cat>('all')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const ref = useRef<HTMLIFrameElement>(null)

  const filtered = emailTemplates.filter((t: any) => cat === 'all' || t.category === cat)

  const preview = async (id: string) => {
    setPreviewId(id)
    const r = await adminActions.previewBrandedEmail({ templateId: id, recipientName: 'John Doe' })
    if (r?.html && ref.current) {
      const doc = ref.current.contentDocument
      if (doc) { doc.open(); doc.write(r.html); doc.close() }
    }
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#00bfff]" />Templates
          <span className="text-sm font-normal text-neutral-500 ml-1">({emailTemplates.length})</span>
        </h3>
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${cat === c.id ? 'bg-white/5 text-white border-white/10' : 'text-neutral-600 border-transparent hover:text-neutral-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1 custom-scrollbar">
          {filtered.map((t: any) => (
            <div key={t.id} onClick={() => preview(t.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all group ${previewId === t.id
                ? `bg-gradient-to-br ${catColor[t.category] || catColor.custom}`
                : 'bg-neutral-900/40 border-neutral-800/40 hover:bg-neutral-900/70 hover:border-neutral-700/50'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400`}>{t.category}</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">{t.desc}</p>
              {t.from && <p className="text-[10px] text-neutral-600 mt-1.5">From: {t.from}</p>}
              <div className="flex gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); onUseTemplate(t.id) }}
                  className="text-[11px] text-[#00bfff] font-medium flex items-center gap-1 cursor-pointer hover:text-cyan-300">
                  Use <ArrowRight className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); preview(t.id) }}
                  className="text-[11px] text-neutral-500 flex items-center gap-1 cursor-pointer hover:text-white">
                  <Eye className="w-3 h-3" />Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="sticky top-0">
          {previewId ? (
            <div className="space-y-3">
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-[#00bfff]" />Template Preview
              </div>
              <div className="rounded-2xl overflow-hidden border border-neutral-700/40 shadow-2xl shadow-black/20" style={{ minHeight: 520 }}>
                <iframe ref={ref} className="w-full border-0 bg-white" style={{ minHeight: 520 }} title="Preview" sandbox="allow-same-origin" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-neutral-800/60 text-neutral-600">
              <Eye className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Select a template to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
