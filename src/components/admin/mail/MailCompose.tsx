import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAdminStore, adminActions } from '../../../store/useAdminStore'
import { Send, Users, Eye, RefreshCw, X, Edit3, RotateCcw, Calendar, Video, FileText, Milestone, ChevronDown, Globe, Link as LinkIcon } from 'lucide-react'

const clsSm = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-[#00bfff]/40 focus:ring-1 focus:ring-[#00bfff]/20 focus:outline-none transition-all"
const lbl = "text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block"

// ── Template groups for the card selector ────────────────────
const TEMPLATE_GROUPS: { key: string; label: string; color: string }[] = [
  { key: 'prospect', label: 'Prospect', color: '#ff7a00' },
  { key: 'client', label: 'Client', color: '#10b981' },
  { key: 'referrer', label: 'Referrer', color: '#ff7a00' },
  { key: 'careers', label: 'Careers', color: '#8b5cf6' },
  { key: 'team', label: 'Team', color: '#00bfff' },
  { key: 'custom', label: 'Custom', color: '#94a3b8' },
]

// All @icuni.org send aliases (always available regardless of API)
const ICUNI_ALIASES = [
  { alias: 'labs@icuni.org', name: 'ICUNI Labs', can_send: true },
  { alias: 'hello@icuni.org', name: 'ICUNI Hello', can_send: true },
  { alias: 'donotreply@icuni.org', name: 'Do Not Reply', can_send: true },
  { alias: 'feedback@icuni.org', name: 'Feedback', can_send: true },
  { alias: 'jobs@icuni.org', name: 'ICUNI Jobs', can_send: true },
  { alias: 'tech.issue@icuni.org', name: 'Tech Issues', can_send: true },
  { alias: 'menelek@icuni.org', name: 'Menelek', can_send: true },
  { alias: 'josephine.johnson@icuni.org', name: 'Josephine Johnson', can_send: true },
  { alias: 'doreen.ahiafor@icuni.org', name: 'Doreen Ahiafor', can_send: true },
]

interface Props {
  initialTemplateId?: string | null
  onTemplateConsumed?: () => void
}

export default function MailCompose({ initialTemplateId, onTemplateConsumed }: Props) {
  const { emailAliases, emailTemplates, clients, referrers, users: teamUsers } = useAdminStore()
  const [to, setTo] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [from, setFrom] = useState('labs@icuni.org')
  const [tplId, setTplId] = useState('custom')
  const [group, setGroup] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recipientName, setRecipientName] = useState('')

  // Custom email fields
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customCtaText, setCustomCtaText] = useState('')
  const [customCtaLink, setCustomCtaLink] = useState('')

  // Dynamic template fields
  const [extras, setExtras] = useState<Record<string, any>>({})

  // Preview state
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [emailEdited, setEmailEdited] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Interview date options (special array field)
  const [dateOptions, setDateOptions] = useState<{ date: string; time: string }[]>([{ date: '', time: '' }])

  // Ensure aliases are loaded eagerly
  useEffect(() => {
    adminActions.loadEmailAliases()
  }, [])

  const aliases = useMemo(() => {
    const loaded = Array.isArray(emailAliases) ? emailAliases.filter((a: any) => a.can_send) : []
    // Merge API-loaded aliases with hardcoded ICUNI aliases (deduplicate by alias)
    const seen = new Set<string>()
    const merged: any[] = []
    for (const a of [...ICUNI_ALIASES, ...loaded]) {
      if (!seen.has(a.alias)) { seen.add(a.alias); merged.push(a) }
    }
    return merged
  }, [emailAliases])

  // Handle initialTemplateId from parent
  useEffect(() => {
    if (initialTemplateId) {
      selectTpl(initialTemplateId)
      onTemplateConsumed?.()
    }
  }, [initialTemplateId])

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const g of TEMPLATE_GROUPS) groups[g.key] = []
    for (const t of emailTemplates || []) {
      const cat = t.category || 'custom'
      if (groups[cat]) groups[cat].push(t)
      else if (groups.custom) groups.custom.push(t)
    }
    return groups
  }, [emailTemplates])


  // ── Template selection ──
  const selectTpl = (id: string) => {
    setTplId(id)
    setEmailEdited(false)
    setExtras({})
    setDateOptions([{ date: '', time: '' }])
    const t = (emailTemplates || []).find((t: any) => t.id === id)
    if (t?.from) setFrom(t.from)
  }

  const setExtra = (key: string, value: any) => {
    setExtras(prev => ({ ...prev, [key]: value }))
  }

  // ── Auto-BCC: if CC/To contains @icuni.org, auto-BCC login email ──
  const computeAutoBcc = useCallback((): string => {
    const allEmails = [to, cc].join(',').split(',').map(e => e.trim()).filter(Boolean)
    const icuniEmails = allEmails.filter(e => e.endsWith('@icuni.org'))
    if (icuniEmails.length === 0) return bcc

    // Find login emails for @icuni.org staff
    const autoBccEmails: string[] = []
    for (const icuniEmail of icuniEmails) {
      const staff = (teamUsers || []).find((u: any) => u.email === icuniEmail || u.company_email === icuniEmail)
      if (staff?.email && staff.email !== icuniEmail && !allEmails.includes(staff.email)) {
        autoBccEmails.push(staff.email)
      }
    }

    if (autoBccEmails.length === 0) return bcc
    // Merge with existing BCC, avoiding duplicates
    const existingBcc = bcc.split(',').map(e => e.trim()).filter(Boolean)
    const merged = [...new Set([...existingBcc, ...autoBccEmails])]
    return merged.join(', ')
  }, [to, cc, bcc, teamUsers])

  // ── Determine backend route ──
  const getTemplateCategory = () => {
    if (!tplId || tplId === 'custom') return 'custom'
    const parts = tplId.split(':')
    return parts[0] || 'custom'
  }

  // ── Build extras payload for the backend ──
  const buildExtras = (): Record<string, any> => {
    if (tplId === 'custom') {
      return { subject: subject || 'A Message from ICUNI Labs', title: customTitle || subject, body, ctaText: customCtaText, ctaLink: customCtaLink }
    }
    if (tplId === 'applicant:interview_selected') {
      return { dateOptions: dateOptions.filter(d => d.date && d.time).map(d => ({ date: fmtDate(d.date), time: fmtTime(d.time) })) }
    }
    if (tplId === 'applicant:interview_confirmed') {
      return { confirmedDate: fmtDate(extras.confirmedDate), confirmedTime: fmtTime(extras.confirmedTime), meetingLink: extras.meetingLink || '' }
    }
    if (tplId === 'client:meeting_confirmation') {
      return {
        date: fmtDate(extras.date), time: fmtTime(extras.time),
        type: extras.meetingType || 'online',
        link: extras.meetLink || '', meetLink: extras.meetLink || '',
        location: extras.location || ''
      }
    }
    if (tplId === 'client:demo_link') {
      return { projectName: extras.projectName || '', demoLink: extras.demoLink || '', notes: extras.notes || '' }
    }
    if (tplId === 'client:demo_meeting') {
      return {
        date: fmtDate(extras.date), time: fmtTime(extras.time),
        type: extras.meetingType || 'online',
        link: extras.meetLink || '', meetLink: extras.meetLink || '',
        location: extras.location || '',
        projectName: extras.projectName || ''
      }
    }
    if (tplId === 'client:business_info_premium' || tplId === 'client:prospect_thankyou_info') {
      return { note: extras.note || '' }
    }
    if (tplId === 'client:prospect_demo_general') {
      return {
        date: fmtDate(extras.date), time: fmtTime(extras.time),
        type: extras.meetingType || 'online',
        meetLink: extras.meetLink || '',
        location: extras.location || ''
      }
    }
    if (tplId === 'client:prospect_custom_demo') {
      return {
        date: fmtDate(extras.date), time: fmtTime(extras.time),
        type: extras.meetingType || 'online',
        meetLink: extras.meetLink || '',
        location: extras.location || '',
        projectName: extras.projectName || ''
      }
    }
    if (tplId === 'client:prospect_thankyou_demos') {
      return { meetingDate: extras.meetingDate || '', summary: extras.summary || '' }
    }
    if (tplId === 'client:post_meeting_thankyou') {
      return { meetingDate: extras.meetingDate || '', summary: extras.summary || '', nextSteps: extras.nextSteps || '' }
    }
    if (tplId === 'client:prospect_demo_site') {
      return { demoLink: extras.demoLink || '', note: extras.note || '' }
    }
    return { ...extras }
  }

  // ── Preview ──
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const cat = getTemplateCategory()
      const templateKey = tplId.includes(':') ? tplId.split(':')[1] : tplId
      const name = recipientName || 'Recipient'
      const ex = buildExtras()

      let r: any
      if (tplId === 'custom') {
        r = await adminActions.previewBrandedEmail({ subject: subject || 'Preview', body: body || 'Your message here...', recipientName: name, opts: ex })
      } else if (cat === 'applicant') {
        r = await adminActions.previewApplicantEmail(templateKey, name, ex)
      } else if (cat === 'client') {
        r = await adminActions.previewClientEmail(templateKey, name, ex)
      } else if (cat === 'prospect') {
        // Prospect templates use the client builder backend
        r = await adminActions.previewClientEmail(templateKey, name, ex)
      } else if (cat === 'referrer') {
        r = await adminActions.previewReferrerEmail?.(templateKey, name, ex)
        if (!r) r = await adminActions.previewBrandedEmail({ templateId: tplId, recipientName: name, extras: ex })
      } else {
        r = await adminActions.previewBrandedEmail({ templateId: tplId, recipientName: name, extras: ex })
      }

      if (r?.html) {
        setPreviewHtml(r.html)
        setEmailEdited(false)
      }
    } catch (e) {
      console.warn('Preview failed:', e)
    }
    setPreviewLoading(false)
  }, [tplId, subject, body, extras, dateOptions, recipientName, customTitle, customCtaText, customCtaLink])

  // Auto-preview on changes (debounced)
  useEffect(() => { const t = setTimeout(loadPreview, 700); return () => clearTimeout(t) }, [loadPreview])

  // Enable designMode on iframe load for inline editing
  const handleIframeLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      if (doc) {
        doc.designMode = 'on'
        doc.addEventListener('input', () => setEmailEdited(true))
      }
    } catch { /* cross-origin sandbox */ }
  }, [])

  // Extract edited HTML from iframe
  const getIframeHtml = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument
      if (doc) return '<!DOCTYPE html>' + doc.documentElement.outerHTML
    } catch { /* */ }
    return null
  }, [])

  const resetPreview = () => {
    setEmailEdited(false)
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) { doc.open(); doc.write(previewHtml); doc.close(); setTimeout(handleIframeLoad, 50) }
    }
  }

  // ── Recipients ──
  const getGroup = (g: string) => {
    if (g === 'clients') return clients.filter((c: any) => c.email && c.status !== 'deleted').map((c: any) => ({ email: c.email, name: c.name || '' }))
    if (g === 'referrers') return referrers.filter((r: any) => r.email).map((r: any) => ({ email: r.email, name: r.name || '' }))
    if (g === 'team') return teamUsers.filter((u: any) => u.email).map((u: any) => ({ email: u.email, name: u.name || '' }))
    return []
  }

  // ── Send ──
  const handleSend = async () => {
    setSending(true); setResult(null)
    const recipients = group ? getGroup(group) : to ? to.split(',').map(e => ({ email: e.trim(), name: '' })) : []
    if (!recipients.length) { setSending(false); return }

    const editedHtml = emailEdited ? getIframeHtml() : null
    const cat = getTemplateCategory()
    const templateKey = tplId.includes(':') ? tplId.split(':')[1] : tplId
    const ex = buildExtras()

    // Compute final BCC with auto-BCC logic
    const finalBcc = computeAutoBcc()

    try {
      let r: any
      if (tplId === 'custom') {
        if (!subject.trim() || !body.trim()) { setSending(false); return }
        r = await adminActions.sendBrandedEmail({
          subject, body, fromAlias: from, recipients, useTemplate: true,
          cc: cc || undefined,
          bcc: finalBcc || undefined,
          ...(editedHtml ? { rawHtml: editedHtml } : {})
        })
      } else if (cat === 'applicant') {
        // Careers templates send via applicant email handler
        const editedSubject = emailEdited ? undefined : undefined
        r = await adminActions.sendApplicantEmail(templateKey, recipients, ex, editedHtml || undefined, editedSubject)
      } else if (cat === 'client') {
        // Client templates - send individually to each recipient
        let sent = 0, failed = 0
        for (const rec of recipients) {
          try {
            await adminActions.sendClientEmail(templateKey, rec.email, rec.name || recipientName, ex, editedHtml || undefined)
            sent++
          } catch { failed++ }
        }
        r = { sent, failed }
      } else if (cat === 'prospect') {
        // Prospect templates use the client email builder
        let sent = 0, failed = 0
        for (const rec of recipients) {
          try {
            await adminActions.sendClientEmail(templateKey, rec.email, rec.name || recipientName, ex, editedHtml || undefined)
            sent++
          } catch { failed++ }
        }
        r = { sent, failed }
      } else if (cat === 'referrer') {
        // Referrer templates - batch send via referrer email handler
        r = await adminActions.sendReferrerEmail?.(templateKey, recipients, ex) || { sent: 0, failed: recipients.length }
      } else {
        r = await adminActions.sendBrandedEmail({
          subject, body, fromAlias: from, recipients, useTemplate: true,
          cc: cc || undefined,
          bcc: finalBcc || undefined,
          ...(editedHtml ? { rawHtml: editedHtml } : {})
        })
      }
      setResult(r)
    } catch (e: any) {
      setResult({ sent: 0, failed: 1, errors: [e.message] })
    }
    setSending(false)
  }

  // ── Helpers ──
  const fmtDate = (d: string) => { if (!d) return 'TBD'; try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d } }
  const fmtTime = (t: string) => { if (!t) return 'TBD'; try { const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` } catch { return t } }


  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" style={{ minHeight: 600 }}>
      {/* ── Left: Template + Fields ── */}
      <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>

        {/* Template Card Selector */}
        <div>
          <label className={lbl}>Template</label>
          <div className="space-y-3">
            {/* Custom option */}
            <button onClick={() => selectTpl('custom')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all text-xs cursor-pointer ${tplId === 'custom' ? 'bg-neutral-500/10 border-neutral-400/30 text-white' : 'border-neutral-700/40 text-neutral-500 hover:text-white hover:border-neutral-600'}`}>
              <div className="font-semibold">Custom Email</div>
              <div className="text-[10px] opacity-60 mt-0.5">Write your own branded email from scratch</div>
            </button>

            {/* Grouped templates */}
            {TEMPLATE_GROUPS.filter(g => g.key !== 'custom' && (groupedTemplates[g.key]?.length || 0) > 0).map(g => (
              <div key={g.key}>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 pl-1" style={{ color: g.color }}>{g.label}</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {groupedTemplates[g.key]?.map((t: any) => (
                    <button key={t.id} onClick={() => selectTpl(t.id)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl border transition-all text-xs cursor-pointer ${tplId === t.id
                        ? 'border-[#00bfff]/40 bg-[#00bfff]/5 text-white shadow-[0_0_10px_rgba(0,191,255,0.08)]'
                        : 'border-neutral-700/40 text-neutral-400 hover:text-white hover:border-neutral-600'}`}>
                      <div className="font-semibold">{t.name}</div>
                      {t.desc && <div className="text-[10px] opacity-50 mt-0.5 line-clamp-1">{t.desc}</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* From + Recipients */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className={clsSm}>
              {aliases.map((a: any) => <option key={a.alias} value={a.alias}>{a.name} ({a.alias})</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Recipient Name</label>
            <input value={recipientName} onChange={e => setRecipientName(e.target.value)} className={clsSm} placeholder="Client name (for greeting)" />
          </div>
        </div>

        <div>
          <label className={lbl}>Recipients</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {(['clients', 'referrers', 'team'] as const).map(g => (
              <button key={g} onClick={() => setGroup(group === g ? null : g)}
                className={`text-xs px-3 py-1.5 rounded-xl border cursor-pointer transition-all font-medium ${group === g ? 'bg-[#00bfff]/10 text-[#00bfff] border-[#00bfff]/30' : 'text-neutral-500 border-neutral-700/50 hover:text-white hover:border-neutral-600'}`}>
                <Users className="w-3 h-3 inline mr-1" />All {g.charAt(0).toUpperCase() + g.slice(1)} {group === g && `(${getGroup(g).length})`}
              </button>
            ))}
          </div>
          {!group && <input value={to} onChange={e => setTo(e.target.value)} className={clsSm} placeholder="email@example.com (comma-separate for multiple)" />}
        </div>

        {/* CC / BCC toggle + fields */}
        <div>
          {!showCcBcc && (
            <button onClick={() => setShowCcBcc(true)} className="text-[11px] text-neutral-500 hover:text-[#00bfff] cursor-pointer flex items-center gap-1 transition-colors">
              <ChevronDown className="w-3 h-3" /> Add CC / BCC
            </button>
          )}
          {showCcBcc && (
            <div className="space-y-2 border-t border-neutral-800/50 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">CC / BCC</span>
                <button onClick={() => { setShowCcBcc(false); setCc(''); setBcc('') }} className="text-neutral-600 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div>
                <label className={lbl}>CC</label>
                <input value={cc} onChange={e => setCc(e.target.value)} className={clsSm} placeholder="email@example.com (comma-separate)" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ICUNI_ALIASES.map(a => (
                    <button key={'cc-' + a.alias} type="button"
                      onClick={() => {
                        const existing = cc.split(',').map(e => e.trim()).filter(Boolean)
                        if (!existing.includes(a.alias)) setCc([...existing, a.alias].join(', '))
                      }}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-500 hover:text-[#00bfff] hover:bg-neutral-800 border border-neutral-700/40 cursor-pointer transition-colors"
                    >{a.alias.replace('@icuni.org', '')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>BCC</label>
                <input value={bcc} onChange={e => setBcc(e.target.value)} className={clsSm} placeholder="email@example.com (comma-separate)" />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {ICUNI_ALIASES.map(a => (
                    <button key={'bcc-' + a.alias} type="button"
                      onClick={() => {
                        const existing = bcc.split(',').map(e => e.trim()).filter(Boolean)
                        if (!existing.includes(a.alias)) setBcc([...existing, a.alias].join(', '))
                      }}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-neutral-800/60 text-neutral-500 hover:text-[#00bfff] hover:bg-neutral-800 border border-neutral-700/40 cursor-pointer transition-colors"
                    >{a.alias.replace('@icuni.org', '')}</button>
                  ))}
                </div>
                <p className="text-[9px] text-neutral-600 mt-1">Tip: CC/mailing an @icuni.org address will auto-BCC their personal login email.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Dynamic Fields Per Template ── */}
        {tplId === 'custom' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div><label className={lbl}>Subject</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={clsSm} placeholder="Email subject..." /></div>
            <div><label className={lbl}>Title (optional)</label>
              <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} className={clsSm} placeholder="Banner title — defaults to subject" /></div>
            <div><label className={lbl}>Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className={`${clsSm} !min-h-[120px] resize-none`} placeholder="Write your message..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>CTA Button Text</label>
                <input value={customCtaText} onChange={e => setCustomCtaText(e.target.value)} className={clsSm} placeholder="Visit ICUNI Labs" /></div>
              <div><label className={lbl}>CTA Link</label>
                <input value={customCtaLink} onChange={e => setCustomCtaLink(e.target.value)} className={clsSm} placeholder="https://..." /></div>
            </div>
          </div>
        )}

        {/* Meeting Confirmation fields */}
        {tplId === 'client:meeting_confirmation' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" />Meeting Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.date || ''} onChange={e => setExtra('date', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.time || ''} onChange={e => setExtra('time', e.target.value)} className={clsSm} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Type</label>
                <select value={extras.meetingType || 'online'} onChange={e => setExtra('meetingType', e.target.value)} className={clsSm}>
                  <option value="online">Online (Google Meet)</option>
                  <option value="in_person">In-Person</option>
                </select></div>
              <div><label className={lbl}>{extras.meetingType === 'in_person' ? 'Location' : 'Google Meet Link'}</label>
                <input value={extras.meetingType === 'in_person' ? (extras.location || '') : (extras.meetLink || '')}
                  onChange={e => setExtra(extras.meetingType === 'in_person' ? 'location' : 'meetLink', e.target.value)}
                  className={clsSm} placeholder={extras.meetingType === 'in_person' ? 'Office address...' : 'https://meet.google.com/...'} /></div>
            </div>
          </div>
        )}

        {/* Demo Link fields */}
        {tplId === 'client:demo_link' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00bfff] flex items-center gap-1.5"><LinkIcon className="w-3 h-3" />Demo Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Project / Demo Name</label>
                <input value={extras.projectName || ''} onChange={e => setExtra('projectName', e.target.value)} className={clsSm} placeholder="Inventory Management System" /></div>
              <div><label className={lbl}>Demo Link</label>
                <input value={extras.demoLink || ''} onChange={e => setExtra('demoLink', e.target.value)} className={clsSm} placeholder="https://demo.icuni.org/..." /></div>
            </div>
            <div><label className={lbl}>Notes (optional)</label>
              <textarea value={extras.notes || ''} onChange={e => setExtra('notes', e.target.value)} className={`${clsSm} !min-h-[60px] resize-none`} placeholder="Things to look out for, login credentials, etc." /></div>
          </div>
        )}

        {/* Demo Meeting Confirmation fields */}
        {tplId === 'client:demo_meeting' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5"><Video className="w-3 h-3" />Demo Session Details</div>
            <div><label className={lbl}>Project / Demo Name</label>
              <input value={extras.projectName || ''} onChange={e => setExtra('projectName', e.target.value)} className={clsSm} placeholder="Inventory Management System" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.date || ''} onChange={e => setExtra('date', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.time || ''} onChange={e => setExtra('time', e.target.value)} className={clsSm} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Type</label>
                <select value={extras.meetingType || 'online'} onChange={e => setExtra('meetingType', e.target.value)} className={clsSm}>
                  <option value="online">Online (Google Meet)</option>
                  <option value="in_person">In-Person</option>
                </select></div>
              <div><label className={lbl}>{extras.meetingType === 'in_person' ? 'Location' : 'Google Meet Link'}</label>
                <input value={extras.meetingType === 'in_person' ? (extras.location || '') : (extras.meetLink || '')}
                  onChange={e => setExtra(extras.meetingType === 'in_person' ? 'location' : 'meetLink', e.target.value)}
                  className={clsSm} placeholder={extras.meetingType === 'in_person' ? 'Office address...' : 'https://meet.google.com/...'} /></div>
            </div>
          </div>
        )}

        {/* Business Info Premium fields */}
        {tplId === 'client:business_info_premium' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5"><Globe className="w-3 h-3" />Business Info</div>
            <div><label className={lbl}>Personal Note (optional)</label>
              <textarea value={extras.note || ''} onChange={e => setExtra('note', e.target.value)} className={`${clsSm} !min-h-[80px] resize-none`} placeholder={"Add a personal note to the top of the email...\ne.g. It was great speaking with you today. As promised, here's everything about ICUNI Labs."} /></div>
          </div>
        )}

        {/* Project Kickoff */}
        {tplId === 'client:project_kickoff' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><FileText className="w-3 h-3" />Project Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Project Name</label>
                <input value={extras.projectName || ''} onChange={e => setExtra('projectName', e.target.value)} className={clsSm} placeholder="My App" /></div>
              <div><label className={lbl}>Est. Timeline</label>
                <input value={extras.timeline || ''} onChange={e => setExtra('timeline', e.target.value)} className={clsSm} placeholder="4-6 weeks" /></div>
            </div>
          </div>
        )}

        {/* Milestone Update */}
        {tplId === 'client:milestone_update' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00bfff] flex items-center gap-1.5"><Milestone className="w-3 h-3" />Milestone</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Milestone Name</label>
                <input value={extras.milestone || ''} onChange={e => setExtra('milestone', e.target.value)} className={clsSm} placeholder="UI Design Complete" /></div>
              <div><label className={lbl}>Step (1-10)</label>
                <input type="number" min="1" max="10" value={extras.step || '5'} onChange={e => setExtra('step', e.target.value)} className={clsSm} /></div>
            </div>
            <div><label className={lbl}>Details (optional)</label>
              <textarea value={extras.details || ''} onChange={e => setExtra('details', e.target.value)} className={`${clsSm} !min-h-[60px] resize-none`} placeholder="Progress notes..." /></div>
          </div>
        )}

        {/* Invoice Reminder */}
        {tplId === 'client:invoice_reminder' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5"><FileText className="w-3 h-3" />Invoice Details</div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Invoice No.</label>
                <input value={extras.invoiceId || ''} onChange={e => setExtra('invoiceId', e.target.value)} className={clsSm} placeholder="INV-001" /></div>
              <div><label className={lbl}>Amount (GH&#8373;)</label>
                <input value={extras.amount || ''} onChange={e => setExtra('amount', e.target.value)} className={clsSm} placeholder="5,000" /></div>
              <div><label className={lbl}>Due Date</label>
                <input type="date" value={extras.dueDate || ''} onChange={e => setExtra('dueDate', e.target.value)} className={clsSm} /></div>
            </div>
          </div>
        )}

        {/* Review Request */}
        {tplId === 'client:review_request' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Project Name</label>
                <input value={extras.projectName || ''} onChange={e => setExtra('projectName', e.target.value)} className={clsSm} placeholder="My App" /></div>
              <div><label className={lbl}>Demo Link</label>
                <input value={extras.demoLink || ''} onChange={e => setExtra('demoLink', e.target.value)} className={clsSm} placeholder="https://demo.example.com" /></div>
            </div>
          </div>
        )}

        {/* Follow-Up */}
        {tplId === 'client:follow_up' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div><label className={lbl}>Days Since Last Contact</label>
              <input value={extras.daysSince || ''} onChange={e => setExtra('daysSince', e.target.value)} className={clsSm} placeholder="2 weeks" /></div>
          </div>
        )}

        {/* Upsell */}
        {tplId === 'client:upsell' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div><label className={lbl}>Offer Title</label>
              <input value={extras.offerTitle || ''} onChange={e => setExtra('offerTitle', e.target.value)} className={clsSm} placeholder="Mobile App Add-On" /></div>
            <div><label className={lbl}>Offer Description</label>
              <textarea value={extras.offerDescription || ''} onChange={e => setExtra('offerDescription', e.target.value)} className={`${clsSm} !min-h-[60px] resize-none`} placeholder="Details..." /></div>
          </div>
        )}

        {/* Post-Meeting Thank You */}
        {tplId === 'client:post_meeting_thankyou' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">Thank You Details</div>
            <div><label className={lbl}>Meeting Date (for greeting)</label>
              <input type="date" value={extras.meetingDate || ''} onChange={e => setExtra('meetingDate', fmtDate(e.target.value))} className={clsSm} /></div>
            <div><label className={lbl}>Discussion Summary</label>
              <textarea value={extras.summary || ''} onChange={e => setExtra('summary', e.target.value)}
                className={`${clsSm} !min-h-[100px]`} placeholder={"Briefly summarise what was discussed in the meeting...\ne.g. We discussed the mobile app redesign, timeline expectations, and integration requirements."} /></div>
            <div><label className={lbl}>Next Steps</label>
              <textarea value={extras.nextSteps || ''} onChange={e => setExtra('nextSteps', e.target.value)}
                className={`${clsSm} !min-h-[80px]`} placeholder={"What happens next?\ne.g. 1. We'll send a detailed proposal by Friday\n2. Design mockups will be ready within 2 weeks\n3. Follow-up call scheduled for next Tuesday"} /></div>
          </div>
        )}

        {/* ── PROSPECT TEMPLATES ── */}

        {/* Prospect: General Demo Meeting */}
        {tplId === 'client:prospect_demo_general' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#ff7a00] flex items-center gap-1.5"><Calendar className="w-3 h-3" />General Demo Meeting</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.date || ''} onChange={e => setExtra('date', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.time || ''} onChange={e => setExtra('time', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Format</label>
                <select value={extras.meetingType || 'online'} onChange={e => setExtra('meetingType', e.target.value)} className={clsSm}>
                  <option value="online">Online</option>
                  <option value="in_person">In-Person</option>
                </select></div>
              <div><label className={lbl}>{extras.meetingType === 'in_person' ? 'Location' : 'Google Meet Link'}</label>
                <input value={extras.meetingType === 'in_person' ? (extras.location || '') : (extras.meetLink || '')}
                  onChange={e => setExtra(extras.meetingType === 'in_person' ? 'location' : 'meetLink', e.target.value)}
                  className={clsSm} placeholder={extras.meetingType === 'in_person' ? 'Office address...' : 'https://meet.google.com/...'} /></div>
            </div>
          </div>
        )}

        {/* Prospect: Custom Demo Meeting */}
        {tplId === 'client:prospect_custom_demo' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00bfff] flex items-center gap-1.5"><Calendar className="w-3 h-3" />Custom Demo Meeting</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.date || ''} onChange={e => setExtra('date', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.time || ''} onChange={e => setExtra('time', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Project Name</label>
                <input value={extras.projectName || ''} onChange={e => setExtra('projectName', e.target.value)} className={clsSm} placeholder="Their CRM / Portal / etc." /></div>
              <div><label className={lbl}>Format</label>
                <select value={extras.meetingType || 'online'} onChange={e => setExtra('meetingType', e.target.value)} className={clsSm}>
                  <option value="online">Online</option>
                  <option value="in_person">In-Person</option>
                </select></div>
              <div className="col-span-2"><label className={lbl}>{extras.meetingType === 'in_person' ? 'Location' : 'Google Meet Link'}</label>
                <input value={extras.meetingType === 'in_person' ? (extras.location || '') : (extras.meetLink || '')}
                  onChange={e => setExtra(extras.meetingType === 'in_person' ? 'location' : 'meetLink', e.target.value)}
                  className={clsSm} placeholder={extras.meetingType === 'in_person' ? 'Office address...' : 'https://meet.google.com/...'} /></div>
            </div>
          </div>
        )}

        {/* Prospect: Thank You + Demo Links */}
        {tplId === 'client:prospect_thankyou_demos' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">Thank You + Demos</div>
            <div><label className={lbl}>Meeting Date (for greeting)</label>
              <input type="date" value={extras.meetingDate || ''} onChange={e => setExtra('meetingDate', fmtDate(e.target.value))} className={clsSm} /></div>
            <div><label className={lbl}>Discussion Summary (optional)</label>
              <textarea value={extras.summary || ''} onChange={e => setExtra('summary', e.target.value)}
                className={`${clsSm} !min-h-[80px]`} placeholder={"Briefly summarise the meeting...\nThe email will include links to our demo gallery and portfolio."} /></div>
          </div>
        )}

        {/* Prospect: Thank You + About Us */}
        {tplId === 'client:prospect_thankyou_info' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><Globe className="w-3 h-3" />Thank You + Company Info</div>
            <div><label className={lbl}>Personal Note (optional)</label>
              <textarea value={extras.note || ''} onChange={e => setExtra('note', e.target.value)} className={`${clsSm} !min-h-[80px] resize-none`} placeholder={"Add a personal note...\ne.g. It was great speaking with you today. As promised, here's more about ICUNI Labs and what we can do for your business."} /></div>
          </div>
        )}

        {/* Prospect: Thank You + Demo Site Link */}
        {tplId === 'client:prospect_demo_site' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#00bfff] flex items-center gap-1.5"><Globe className="w-3 h-3" />Demo Site Link</div>
            <div><label className={lbl}>Demo Site URL</label>
              <input value={extras.demoLink || ''} onChange={e => setExtra('demoLink', e.target.value)} className={clsSm} placeholder="https://demo.example.com" /></div>
            <div><label className={lbl}>Personal Note (optional)</label>
              <textarea value={extras.note || ''} onChange={e => setExtra('note', e.target.value)} className={`${clsSm} !min-h-[80px] resize-none`} placeholder={"Add a personal note...\ne.g. It was great walking you through the system today."} /></div>
          </div>
        )}

        {/* Referrer Stage Update */}
        {tplId === 'referrer:stage_update' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Stage Name</label>
                <input value={extras.stageName || ''} onChange={e => setExtra('stageName', e.target.value)} className={clsSm} placeholder="Meeting Booked" /></div>
              <div><label className={lbl}>Prospect Name</label>
                <input value={extras.prospectName || ''} onChange={e => setExtra('prospectName', e.target.value)} className={clsSm} placeholder="Acme Corp" /></div>
            </div>
          </div>
        )}

        {/* Referrer Payment Sent */}
        {tplId === 'referrer:payment_sent' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Amount (GH&#8373;)</label>
                <input value={extras.amount || ''} onChange={e => setExtra('amount', e.target.value)} className={clsSm} placeholder="1,000" /></div>
              <div><label className={lbl}>Payment Method</label>
                <input value={extras.method || ''} onChange={e => setExtra('method', e.target.value)} className={clsSm} placeholder="Mobile Money" /></div>
            </div>
          </div>
        )}

        {/* Referrer Meeting Reminder */}
        {tplId === 'referrer:meeting_reminder' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.meetingDate || ''} onChange={e => setExtra('meetingDate', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.meetingTime || ''} onChange={e => setExtra('meetingTime', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Prospect</label>
                <input value={extras.prospectName || ''} onChange={e => setExtra('prospectName', e.target.value)} className={clsSm} placeholder="Acme Corp" /></div>
            </div>
          </div>
        )}

        {/* Referrer New Material */}
        {tplId === 'referrer:new_material' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div><label className={lbl}>Material Title</label>
              <input value={extras.materialTitle || ''} onChange={e => setExtra('materialTitle', e.target.value)} className={clsSm} placeholder="Portfolio Deck v3" /></div>
            <div><label className={lbl}>Description</label>
              <textarea value={extras.materialDescription || ''} onChange={e => setExtra('materialDescription', e.target.value)} className={`${clsSm} !min-h-[60px] resize-none`} placeholder="What's new..." /></div>
          </div>
        )}

        {/* Interview Selected — Date Options */}
        {tplId === 'applicant:interview_selected' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5"><Calendar className="w-3 h-3" />Date Options for Candidate</div>
            {dateOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1"><label className={lbl}>Date {i + 1}</label>
                  <input type="date" value={opt.date} onChange={e => { const d = [...dateOptions]; d[i].date = e.target.value; setDateOptions(d) }} className={clsSm} /></div>
                <div className="flex-1"><label className={lbl}>Time</label>
                  <input type="time" value={opt.time} onChange={e => { const d = [...dateOptions]; d[i].time = e.target.value; setDateOptions(d) }} className={clsSm} /></div>
                {dateOptions.length > 1 && <button onClick={() => setDateOptions(dateOptions.filter((_, j) => j !== i))} className="text-red-400/60 hover:text-red-400 cursor-pointer p-1"><X className="w-3.5 h-3.5" /></button>}
              </div>
            ))}
            <button onClick={() => setDateOptions([...dateOptions, { date: '', time: '' }])} className="text-[11px] text-[#00bfff] hover:underline cursor-pointer">+ Add another slot</button>
          </div>
        )}

        {/* Interview Confirmed */}
        {tplId === 'applicant:interview_confirmed' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5"><Video className="w-3 h-3" />Confirmed Interview</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Date</label>
                <input type="date" value={extras.confirmedDate || ''} onChange={e => setExtra('confirmedDate', e.target.value)} className={clsSm} /></div>
              <div><label className={lbl}>Time</label>
                <input type="time" value={extras.confirmedTime || ''} onChange={e => setExtra('confirmedTime', e.target.value)} className={clsSm} /></div>
            </div>
            <div><label className={lbl}>Google Meet Link</label>
              <input value={extras.meetingLink || ''} onChange={e => setExtra('meetingLink', e.target.value)} className={clsSm} placeholder="https://meet.google.com/..." /></div>
          </div>
        )}

        {/* Trial Invitation */}
        {tplId === 'applicant:trial_invitation' && (
          <div className="space-y-3 border-t border-neutral-800/50 pt-3">
            <div><label className={lbl}>Weekly Rate (GH&#8373;)</label>
              <input value={extras.weeklyRate || '700'} onChange={e => setExtra('weeklyRate', e.target.value)} className={clsSm} placeholder="700" /></div>
          </div>
        )}

        {/* Result */}
        {result && <div className={`text-sm p-3 rounded-xl border backdrop-blur-sm ${result.sent > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{result.sent} sent{result.failed > 0 && `, ${result.failed} failed`}</div>}

        {/* Send */}
        <button onClick={handleSend} disabled={sending}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,128,255,0.3)] disabled:opacity-40 transition-all w-full justify-center">
          <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>

      {/* ── Right: Editable Preview ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#00bfff]" />
            {previewLoading ? 'Loading...' : 'Live Preview'}
            {emailEdited && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold tracking-wider flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5" />EDITED
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            {emailEdited && (
              <button onClick={resetPreview} className="text-[11px] text-amber-400/70 hover:text-amber-400 cursor-pointer flex items-center gap-1">
                <RotateCcw className="w-3 h-3" />Reset
              </button>
            )}
            <button onClick={loadPreview} className="text-[11px] text-neutral-600 hover:text-[#00bfff] cursor-pointer flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />Refresh
            </button>
          </div>
        </div>
        <div className="text-[10px] text-neutral-600 mb-1">Click inside the preview to edit the email directly before sending</div>
        <div className="rounded-2xl overflow-hidden border border-neutral-700/40 shadow-2xl shadow-black/20" style={{ minHeight: 520 }}>
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml || '<html><body style="background:#111;color:#555;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div>Select a template to preview</div></body></html>'}
            className="w-full border-0 bg-white"
            style={{ minHeight: 520 }}
            title="Email Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  )
}
