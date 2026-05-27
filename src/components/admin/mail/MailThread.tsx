import { useState, useRef, useEffect, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import { ChevronLeft, Reply, Send, Paperclip, Clock, UserPlus, FileText, Eye, X, RefreshCw } from 'lucide-react'
import SafeHtml from '../../shared/SafeHtml'

const cls = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/40 focus:ring-1 focus:ring-[#00bfff]/20 focus:outline-none transition-all backdrop-blur-sm"

function relTime(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 60000) return 'Just now'
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago'
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h ago'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function extractName(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*</)
  return m ? m[1].trim() : from.split('@')[0]
}

function extractEmail(from: string) {
  const m = from.match(/<([^>]+)>/)
  return m ? m[1] : from
}

function avatarColor(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360}, 60%, 45%)`
}

function writeIframe(ref: React.RefObject<HTMLIFrameElement | null>, html: string) {
  if (!ref.current) return
  const doc = ref.current.contentDocument
  if (doc) { doc.open(); doc.write(html); doc.close() }
}

export default function MailThread({ thread, aliases, onClose }: { thread: any; aliases: any[]; onClose: () => void }) {
  const { emailTemplates, jobs } = useAdminStore()
  const [replyBody, setReplyBody] = useState('')
  const [replyFrom, setReplyFrom] = useState(aliases[0]?.alias || 'labs@icuni.org')
  const [replying, setReplying] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  // Template reply
  const [selectedTpl, setSelectedTpl] = useState<string>('freeform')
  const [tplPreview, setTplPreview] = useState('')
  const tplRef = useRef<HTMLIFrameElement>(null)
  // Import as applicant
  const [showImport, setShowImport] = useState(false)
  const [importForm, setImportForm] = useState({ name: '', email: '', phone: '', job_title: '', note: '' })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null)

  // Load templates on mount
  useEffect(() => { adminActions.loadEmailTemplates() }, [])

  const msgs = thread.messages || []

  // Pre-fill import form from first message sender
  const openImport = () => {
    const firstMsg = msgs[0]
    if (firstMsg) {
      const senderName = extractName(firstMsg.from)
      const senderEmail = extractEmail(firstMsg.from)
      // Use plain body as cover letter
      const coverLetter = firstMsg.plainBody?.substring(0, 2000) || ''
      setImportForm({
        name: senderName,
        email: senderEmail,
        phone: '',
        job_title: '',
        note: coverLetter,
      })
    }
    setShowImport(true)
    setImportResult(null)
  }

  const handleImport = async () => {
    if (!importForm.name || !importForm.email) return
    setImporting(true)
    try {
      const firstMsg = msgs[0]
      const ok = await adminActions.importEmailAsApplication({
        threadId: thread.id,
        messageId: firstMsg?.id,
        name: importForm.name,
        email: importForm.email,
        phone: importForm.phone,
        jobTitle: importForm.job_title,
        coverLetterOverride: importForm.note,
      })
      setImportResult(ok ? 'success' : 'error')
      if (ok) setTimeout(() => setShowImport(false), 1500)
    } catch {
      setImportResult('error')
    }
    setImporting(false)
  }

  // Template selection handler
  const handleTplSelect = async (tplId: string) => {
    setSelectedTpl(tplId)
    if (tplId === 'freeform') {
      setTplPreview('')
      return
    }
    // Set the from alias to the template's default if available
    const tpl = emailTemplates.find((t: any) => t.id === tplId)
    if (tpl?.from) setReplyFrom(tpl.from)
    // Preview the template
    const preview = await adminActions.previewBrandedEmail({ templateId: tplId, recipientName: extractName(msgs[0]?.from || 'Recipient') })
    if (preview?.html) {
      setTplPreview(preview.html)
      writeIframe(tplRef, preview.html)
    }
  }

  const handleReply = async () => {
    if (selectedTpl === 'freeform' && !replyBody.trim()) return
    setReplying(true)
    const ok = await adminActions.replyToThread(thread.id, replyBody || '(sent via template)', replyFrom, useTemplate)
    setReplying(false)
    if (ok) { setReplyBody(''); setShowReply(false); setSelectedTpl('freeform'); setTplPreview('') }
  }

  // Detect CV-like attachments
  const allAttachments = msgs.flatMap((m: any) => (m.attachments || []).map((a: any) => ({ ...a, msgFrom: m.from })))
  const cvAttachments = allAttachments.filter((a: any) =>
    /\.(pdf|doc|docx)$/i.test(a.name) && /cv|resume|curriculum/i.test(a.name))
  const otherAttachments = allAttachments.filter((a: any) => !cvAttachments.includes(a))

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={onClose} className="mt-1 p-2 rounded-xl hover:bg-neutral-800/80 text-neutral-500 hover:text-white transition-all cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white leading-tight">{thread.subject}</h2>
          <p className="text-xs text-neutral-500 mt-1">{msgs.length} message{msgs.length !== 1 ? 's' : ''} in thread</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import as Applicant */}
          <button onClick={openImport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Import Applicant</span>
          </button>
          {/* Reply */}
          {!showReply && (
            <button onClick={() => setShowReply(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,128,255,0.25)] transition-all cursor-pointer">
              <Reply className="w-4 h-4" />Reply
            </button>
          )}
        </div>
      </div>

      {/* Import Applicant Modal */}
      {showImport && (
        <div className="bg-neutral-900/80 border border-emerald-500/20 rounded-2xl p-5 space-y-4 backdrop-blur-sm animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />Import as Job Applicant
            </h3>
            <button onClick={() => setShowImport(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          {importResult === 'success' ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-400 font-semibold">Applicant imported successfully!</p>
              <p className="text-[11px] text-neutral-500 mt-1">Check the Careers section for the new application.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Name *</label>
                  <input value={importForm.name} onChange={e => setImportForm({ ...importForm, name: e.target.value })} className={cls} placeholder="Applicant name" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                  <input value={importForm.email} onChange={e => setImportForm({ ...importForm, email: e.target.value })} className={cls} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                  <input value={importForm.phone} onChange={e => setImportForm({ ...importForm, phone: e.target.value })} className={cls} placeholder="+233..." />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Job Title</label>
                  <select value={importForm.job_title} onChange={e => setImportForm({ ...importForm, job_title: e.target.value })} className={cls}>
                    <option value="">Select a role...</option>
                    {(jobs || []).filter((j: any) => j.status === 'active').map((j: any) => (
                      <option key={j.job_id} value={j.title}>{j.title}</option>
                    ))}
                    <option value="Manual Entry">Other (Manual Entry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">Cover Letter (from email body)</label>
                <textarea value={importForm.note} onChange={e => setImportForm({ ...importForm, note: e.target.value })}
                  className={`${cls} !min-h-[100px] resize-none`} placeholder="Email body will be used as cover letter..." />
              </div>

              {/* Detected attachments */}
              {allAttachments.length > 0 && (
                <div>
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block">
                    Detected Attachments ({allAttachments.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allAttachments.map((a: any, i: number) => {
                      const isCV = cvAttachments.includes(a)
                      return (
                        <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isCV ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-neutral-800/60 border-neutral-700/40'}`}>
                          <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="text-xs text-neutral-400">{a.name}</span>
                          {isCV && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">CV</span>}
                          <span className="text-[10px] text-neutral-600">{(a.size / 1024).toFixed(0)}KB</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-1.5">Attachments will be saved to the applicant's Drive folder automatically.</p>
                </div>
              )}

              {importResult === 'error' && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">Import failed. Please try again.</p>
              )}

              <button onClick={handleImport} disabled={importing || !importForm.name || !importForm.email}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40 transition-all">
                <UserPlus className="w-4 h-4" />{importing ? 'Importing...' : 'Import Applicant'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3">
        {msgs.map((msg: any, i: number) => {
          const name = extractName(msg.from)
          const initial = name.charAt(0).toUpperCase()
          const isLast = i === msgs.length - 1
          return (
            <div key={msg.id || i}
              className={`group rounded-2xl border backdrop-blur-sm transition-all ${isLast ? 'bg-neutral-900/80 border-neutral-700/60' : 'bg-neutral-900/40 border-neutral-800/40'}`}>
              {/* Message header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800/30">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: avatarColor(msg.from) }}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-[10px] text-neutral-600 truncate">&lt;{msg.from.match(/<([^>]+)>/)?.[1] || msg.from}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-neutral-500">To: {msg.to?.split(',')[0]}</span>
                    {msg.cc && <span className="text-[10px] text-neutral-600">CC: {msg.cc.split(',')[0]}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                  <Clock className="w-3 h-3" />{relTime(msg.date)}
                </div>
              </div>
              {/* Body */}
              <div className={`px-5 py-4 text-sm text-neutral-300 leading-relaxed ${isLast ? '' : 'max-h-48 overflow-hidden relative'}`}>
                <SafeHtml html={msg.body} className="mail-body [&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-[#00bfff] [&_a]:underline" />
                {!isLast && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-900/80 to-transparent" />}
              </div>
              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {msg.attachments.map((a: any, j: number) => (
                    <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/60 border border-neutral-700/40">
                      <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">{a.name}</span>
                      <span className="text-[10px] text-neutral-600">{(a.size / 1024).toFixed(0)}KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reply composer */}
      {showReply && (
        <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-2xl p-5 space-y-4 backdrop-blur-sm animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Reply className="w-4 h-4 text-[#00bfff]" />Reply</h3>
            <button onClick={() => setShowReply(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer">Cancel</button>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <select value={replyFrom} onChange={e => setReplyFrom(e.target.value)} className={`${cls} !w-auto !py-2`}>
              {aliases.map((a: any) => <option key={a.alias || a} value={a.alias || a}>{a.alias || a}</option>)}
            </select>

            {/* Template selector */}
            <select value={selectedTpl} onChange={e => handleTplSelect(e.target.value)} className={`${cls} !w-auto !py-2`}>
              <option value="freeform">Freeform Reply</option>
              <optgroup label="Templates">
                {(emailTemplates || []).map((t: any) => (
                  <option key={t.id} value={t.id}>[{t.category}] {t.name}</option>
                ))}
              </optgroup>
            </select>

            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
              <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="rounded" />
              Branded wrapper
            </label>
          </div>

          {selectedTpl === 'freeform' ? (
            <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} className={`${cls} !min-h-[120px] resize-none`} placeholder="Write your reply..." autoFocus />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-[#00bfff]" />Template Preview
                </span>
                <button onClick={() => handleTplSelect(selectedTpl)} className="text-[11px] text-neutral-600 hover:text-[#00bfff] cursor-pointer flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />Refresh
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-neutral-700/40 shadow-lg" style={{ minHeight: 300 }}>
                <iframe ref={tplRef} className="w-full border-0 bg-white" style={{ minHeight: 300 }} title="Template Preview" sandbox="allow-same-origin" />
              </div>
              {/* Optional notes alongside template */}
              <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} className={`${cls} !min-h-[60px] resize-none`} placeholder="Add a personal note above the template (optional)..." />
            </div>
          )}

          <button onClick={handleReply} disabled={replying || (selectedTpl === 'freeform' && !replyBody.trim())}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,128,255,0.3)] disabled:opacity-40 transition-all">
            <Send className="w-4 h-4" />{replying ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      )}
    </div>
  )
}
