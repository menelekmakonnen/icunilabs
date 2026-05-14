import { useState, useRef, useCallback, useEffect } from 'react'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import { Send, Users, Eye, RefreshCw } from 'lucide-react'

const cls = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/40 focus:ring-1 focus:ring-[#00bfff]/20 focus:outline-none transition-all backdrop-blur-sm"

function writeIframe(ref: React.RefObject<HTMLIFrameElement | null>, html: string) {
  if (!ref.current) return
  const doc = ref.current.contentDocument
  if (doc) { doc.open(); doc.write(html); doc.close() }
}

export default function MailCompose() {
  const { emailAliases, emailTemplates, clients, referrers, users: teamUsers } = useAdminStore()
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [from, setFrom] = useState('labs@icuni.org')
  const [tplId, setTplId] = useState('custom')
  const [group, setGroup] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const ref = useRef<HTMLIFrameElement>(null)
  const aliases = Array.isArray(emailAliases) ? emailAliases.filter((a: any) => a.can_send) : []

  const selectTpl = (id: string) => {
    setTplId(id)
    const t = emailTemplates.find((t: any) => t.id === id)
    if (t?.from) setFrom(t.from)
  }

  const loadPreview = useCallback(async () => {
    const data = tplId !== 'custom'
      ? { templateId: tplId, recipientName: 'Recipient' }
      : { subject: subject || 'Preview', body: body || 'Your message here...', recipientName: 'Recipient' }
    const r = await adminActions.previewBrandedEmail(data)
    if (r?.html) writeIframe(ref, r.html)
  }, [tplId, subject, body])

  useEffect(() => { const t = setTimeout(loadPreview, 600); return () => clearTimeout(t) }, [loadPreview])

  const getGroup = (g: string) => {
    if (g === 'clients') return clients.filter((c: any) => c.email && c.status !== 'deleted').map((c: any) => ({ email: c.email, name: c.name || '' }))
    if (g === 'referrers') return referrers.filter((r: any) => r.email).map((r: any) => ({ email: r.email, name: r.name || '' }))
    if (g === 'team') return teamUsers.filter((u: any) => u.email).map((u: any) => ({ email: u.email, name: u.name || '' }))
    return []
  }

  const handleSend = async () => {
    if (tplId === 'custom' && (!subject.trim() || !body.trim())) return
    setSending(true); setResult(null)
    const recipients = group ? getGroup(group) : to ? [{ email: to, name: '' }] : []
    if (!recipients.length) { setSending(false); return }
    const r = await adminActions.sendBrandedEmail({ subject, body, fromAlias: from, recipients, useTemplate: true })
    setResult(r); setSending(false)
  }

  const tpl = emailTemplates.find((t: any) => t.id === tplId)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className={cls}>
              {aliases.map((a: any) => <option key={a.alias} value={a.alias}>{a.name} ({a.alias})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Template</label>
            <select value={tplId} onChange={e => selectTpl(e.target.value)} className={cls}>
              {emailTemplates.map((t: any) => <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Recipients</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {(['clients', 'referrers', 'team'] as const).map(g => (
              <button key={g} onClick={() => setGroup(group === g ? null : g)}
                className={`text-xs px-3.5 py-2 rounded-xl border cursor-pointer transition-all font-medium ${group === g ? 'bg-[#00bfff]/10 text-[#00bfff] border-[#00bfff]/30 shadow-[0_0_10px_rgba(0,191,255,0.1)]' : 'text-neutral-500 border-neutral-700/50 hover:text-white hover:border-neutral-600'}`}>
                <Users className="w-3.5 h-3.5 inline mr-1.5" />All {g.charAt(0).toUpperCase() + g.slice(1)} {group === g && `(${getGroup(g).length})`}
              </button>
            ))}
          </div>
          {!group && <input value={to} onChange={e => setTo(e.target.value)} className={cls} placeholder="recipient@example.com" />}
        </div>

        {tplId === 'custom' ? (
          <>
            <div><label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={cls} placeholder="Email subject..." /></div>
            <div><label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className={`${cls} !min-h-[180px] resize-none`} placeholder="Write your message..." /></div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-800/40 border border-neutral-700/30 rounded-2xl p-4">
            <div className="text-xs text-neutral-500">Using template</div>
            <div className="text-sm font-semibold text-white mt-1">{tpl?.name}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{tpl?.desc}</div>
            <div className="text-[11px] text-[#00bfff] mt-2">Sending from: {from}</div>
          </div>
        )}

        {result && <div className={`text-sm p-3.5 rounded-xl border backdrop-blur-sm ${result.sent > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{result.sent} sent{result.failed > 0 && `, ${result.failed} failed`}</div>}

        <button onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,128,255,0.3)] disabled:opacity-40 transition-all">
          <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2"><Eye className="w-3.5 h-3.5 text-[#00bfff]" />Live Preview</span>
          <button onClick={loadPreview} className="text-[11px] text-neutral-600 hover:text-[#00bfff] cursor-pointer flex items-center gap-1"><RefreshCw className="w-3 h-3" />Refresh</button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-neutral-700/40 shadow-2xl shadow-black/20" style={{ minHeight: 520 }}>
          <iframe ref={ref} className="w-full border-0 bg-white" style={{ minHeight: 520 }} title="Email Preview" sandbox="allow-same-origin" />
        </div>
      </div>
    </div>
  )
}
