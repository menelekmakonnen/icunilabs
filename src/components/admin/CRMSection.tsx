import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { ArrowLeft, Plus, Search, X, MessageSquare, FolderOpen, FileText, CheckCircle, Send, Mail, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './crm.css'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl'

const AVATAR_COLORS = ['#00bfff','#8b5cf6','#ff7a00','#10b981','#ef4444','#f59e0b','#ec4899','#06b6d4']
function getAvatarColor(name: string) { let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }
function getInitials(name: string) { return (name||'?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function fmtMoney(v: number) { return `GH₵${(v||0).toLocaleString()}` }
function fmtDate(d: string) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) } catch { return d } }
function healthStatus(c: any) { if (!c.project_count) return 'inactive'; if (c.outstanding > 0) return 'warning'; if (c.active_projects > 0) return 'healthy'; return 'inactive' }

const TAG_STYLES: Record<string, string> = { priority:'priority', vip:'vip', new:'new', returning:'returning' }

const STAGES = [
  { id: 'new_lead', label: 'New Lead', color: '#00bfff' },
  { id: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { id: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { id: 'meeting_scheduled', label: 'Meeting', color: '#ff7a00' },
  { id: 'proposal_sent', label: 'Proposal', color: '#ec4899' },
  { id: 'negotiation', label: 'Negotiation', color: '#ef4444' },
  { id: 'won', label: 'Won', color: '#10b981' },
  { id: 'lost', label: 'Lost', color: '#475569' },
] as const

const EMAIL_TEMPLATES = [
  { id: 'welcome', label: 'Welcome', desc: 'Onboarding welcome' },
  { id: 'project_kickoff', label: 'Project Kickoff', desc: 'Announce project start' },
  { id: 'milestone_update', label: 'Milestone', desc: 'Progress checkpoint' },
  { id: 'invoice_reminder', label: 'Invoice Reminder', desc: 'Payment reminder' },
  { id: 'review_request', label: 'Review Request', desc: 'Demo feedback' },
  { id: 'thank_you', label: 'Thank You', desc: 'Project completion' },
  { id: 'follow_up', label: 'Follow Up', desc: 'General follow-up' },
  { id: 'upsell', label: 'Upsell', desc: 'Growth opportunity' },
  { id: 'check_in', label: 'Check In', desc: 'Periodic check-in' },
  { id: 'custom', label: 'Custom', desc: 'Write your own' },
]

export default function CRMSection() {
  const { clients, loading, activeClient, clientActivity } = useAdminStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', source:'', industry:'', website:'' })
  const [detailTab, setDetailTab] = useState<'overview'|'projects'|'invoices'|'notes'|'activity'|'email'>('overview')
  const [noteText, setNoteText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [viewMode, setViewMode] = useState<'contacts'|'pipeline'>('contacts')
  const [emailTpl, setEmailTpl] = useState('')
  const [emailPreview, setEmailPreview] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { adminActions.loadClients() }, [])

  const filtered = clients.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q)
  })

  const openClient = async (c: any) => {
    setDetailTab('overview')
    await adminActions.getClient(c.client_id)
    adminActions.getClientActivity(c.client_id)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await adminActions.createClient(form)
    if (ok) { setShowAdd(false); setForm({ name:'', email:'', phone:'', company:'', source:'', industry:'', website:'' }) }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !activeClient) return
    await adminActions.addClientNote(activeClient.client_id, noteText)
    setNoteText('')
  }

  const handleAddTag = async () => {
    if (!tagInput.trim() || !activeClient) return
    const existing = activeClient.tags_list || []
    await adminActions.updateClientTags(activeClient.client_id, [...existing, tagInput.trim()])
    setTagInput('')
  }

  const handleAdvanceStage = async (clientId: string, stage: string) => {
    await adminActions.updateClientStatus(clientId, stage)
  }

  const loadEmailPreview = async (tpl: string) => {
    setEmailTpl(tpl)
    if (!activeClient) return
    const res = await adminActions.previewClientEmail(tpl, activeClient.name)
    if (res) { setEmailPreview(res.html || ''); setEmailSubject(res.subject || '') }
  }

  const handleSendEmail = async () => {
    if (!activeClient || !emailTpl) return
    setSending(true)
    await adminActions.sendClientEmail(emailTpl, activeClient.email, activeClient.name, {}, emailPreview, emailSubject)
    setSending(false)
    setEmailTpl(''); setEmailPreview(''); setEmailSubject('')
  }

  const handleRemoveTag = async (tag: string) => {
    if (!activeClient) return
    const updated = (activeClient.tags_list || []).filter((t: string) => t !== tag)
    await adminActions.updateClientTags(activeClient.client_id, updated)
  }

  // ═══ CLIENT DETAIL VIEW ═══
  if (activeClient) {
    const c = activeClient
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'projects', label: `Projects (${c.projects?.length || 0})` },
      { id: 'invoices', label: `Invoices (${c.invoices?.length || 0})` },
      { id: 'notes', label: `Notes (${c.notes_list?.length || 0})` },
      { id: 'activity', label: 'Activity' },
      { id: 'email', label: 'Email' },
    ] as const

    return (
      <div className="crm-slide-in -m-6 flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => adminActions.clearActiveClient()} className="text-neutral-500 hover:text-white cursor-pointer transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <div className="crm-avatar" style={{ background: `linear-gradient(135deg, ${getAvatarColor(c.name)}, ${getAvatarColor(c.name)}88)` }}>
              {getInitials(c.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{c.name}</h2>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                {c.company && <span>{c.company}</span>}
                <span>{c.email}</span>
                {c.phone && <span>{c.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stage Selector */}
            <select value={c.prospect_stage || 'new_lead'} onChange={e => handleAdvanceStage(c.client_id, e.target.value)}
              className="text-xs bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2 py-1 cursor-pointer">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <span className={`crm-health-dot ${healthStatus(c)}`} />
          </div>
        </div>

        {/* Tags Bar */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-neutral-800/50 bg-neutral-950/50">
          {(c.tags_list || []).map((tag: string) => (
            <span key={tag} className={`crm-tag ${TAG_STYLES[tag.toLowerCase()] || 'default'}`}>
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-50 hover:opacity-100 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              className="bg-transparent border-none text-xs text-neutral-500 placeholder-neutral-700 outline-none w-24" placeholder="+ Add tag" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 border-b border-neutral-800 bg-neutral-950/30">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setDetailTab(t.id)} className={`crm-tab ${detailTab === t.id ? 'active' : ''}`}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailTab === 'overview' && (
            <div className="crm-fade-in space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: fmtMoney(c.total_revenue), color: '#10b981' },
                  { label: 'Total Invoiced', value: fmtMoney(c.total_invoiced), color: '#00bfff' },
                  { label: 'Outstanding', value: fmtMoney(c.outstanding), color: c.outstanding > 0 ? '#ef4444' : '#10b981' },
                  { label: 'Active Projects', value: c.active_projects || 0, color: '#8b5cf6' },
                ].map((m, i) => (
                  <div key={i} className="crm-metric">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">{m.label}</p>
                    <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="crm-metric">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Contact Info</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Email:</span>{c.email}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Phone:</span>{c.phone || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Company:</span>{c.company || '—'}</p>
                    {c.website && <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Web:</span><a href={c.website} target="_blank" rel="noreferrer" className="text-[#00bfff] hover:underline">{c.website}</a></p>}
                  </div>
                </div>
                <div className="crm-metric">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Details</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Industry:</span>{c.industry || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Source:</span>{c.source || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Client Since:</span>{fmtDate(c.created_at)}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Last Activity:</span>{fmtDate(c.last_activity)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity Preview */}
              {clientActivity.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Recent Activity</p>
                    <button onClick={() => setDetailTab('activity')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer">View All</button>
                  </div>
                  <div className="crm-timeline">
                    {clientActivity.slice(0, 4).map((a: any, i: number) => (
                      <div key={i} className={`crm-timeline-item ${a.type === 'note' ? 'note' : a.type === 'payment_received' ? 'payment' : a.type === 'invoice_sent' ? 'invoice' : ''}`}>
                        <p className="text-sm text-white font-medium">{a.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{a.detail}</p>
                        <p className="text-[10px] text-neutral-700 mt-1">{fmtDate(a.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {detailTab === 'projects' && (
            <div className="crm-fade-in space-y-3">
              {(c.projects || []).length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-12">No projects yet</p>
              ) : (c.projects || []).map((p: any) => {
                const stepPct = Math.min(((parseFloat(p.step) || 0) / 10) * 100, 100)
                return (
                  <div key={p.project_id} className="crm-card !cursor-default">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white">{p.title}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' : p.status === 'completed' ? 'text-[#8b5cf6] bg-[#8b5cf6]/10' : 'text-neutral-500 bg-neutral-800'}`}>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                      <span>{p.type}</span>
                      <span>{fmtMoney(Number(p.estimated_cost))}</span>
                      <span>Step {p.step}/10</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${stepPct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full" style={{ background: `linear-gradient(90deg, #00bfff, ${stepPct >= 100 ? '#10b981' : '#8b5cf6'})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {detailTab === 'invoices' && (
            <div className="crm-fade-in space-y-3">
              {(c.invoices || []).length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-12">No invoices yet</p>
              ) : (c.invoices || []).map((inv: any) => (
                <div key={inv.invoice_id} className="crm-card !cursor-default flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#ff7a00] font-mono">{inv.invoice_id}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{inv.type} — Due: {fmtDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{fmtMoney(Number(inv.total))}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {detailTab === 'notes' && (
            <div className="crm-fade-in space-y-4">
              {/* Add Note */}
              <div className="flex gap-3">
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="crm-note-input flex-1" placeholder="Write a note about this client..." rows={2} />
                <button onClick={handleAddNote} disabled={!noteText.trim()}
                  className="self-end px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-30 flex items-center gap-2">
                  <Send className="w-4 h-4" />Add
                </button>
              </div>
              {/* Notes List */}
              <div className="crm-timeline">
                {(c.notes_list || []).length === 0 ? (
                  <p className="text-neutral-600 text-sm text-center py-8">No notes yet. Add the first one above.</p>
                ) : (c.notes_list || []).map((n: any, i: number) => (
                  <div key={n.note_id || i} className="crm-timeline-item note" style={{ animationDelay: `${i * 0.05}s` }}>
                    <p className="text-sm text-white">{n.content}</p>
                    <p className="text-[10px] text-neutral-600 mt-1">{n.author} — {fmtDate(n.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailTab === 'activity' && (
            <div className="crm-fade-in">
              {clientActivity.length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-12">No activity recorded yet</p>
              ) : (
                <div className="crm-timeline">
                  {clientActivity.map((a: any, i: number) => (
                    <div key={i} className={`crm-timeline-item ${a.type === 'note' ? 'note' : a.type === 'payment_received' ? 'payment' : a.type === 'invoice_sent' ? 'invoice' : ''}`}
                      style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {a.type === 'note' && <MessageSquare className="w-3.5 h-3.5 text-[#8b5cf6]" />}
                        {a.type === 'project_created' && <FolderOpen className="w-3.5 h-3.5 text-[#00bfff]" />}
                        {a.type === 'invoice_sent' && <FileText className="w-3.5 h-3.5 text-[#ff7a00]" />}
                        {a.type === 'payment_received' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        <p className="text-sm text-white font-medium">{a.title}</p>
                      </div>
                      <p className="text-xs text-neutral-500">{a.detail}</p>
                      <p className="text-[10px] text-neutral-700 mt-1">{fmtDate(a.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === 'email' && (
            <div className="crm-fade-in">
              <div className="grid grid-cols-[240px_1fr] gap-4 h-[calc(100vh-280px)]">
                {/* Template Picker */}
                <div className="space-y-1 overflow-y-auto">
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Templates</p>
                  {EMAIL_TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => loadEmailPreview(t.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-sm cursor-pointer transition-all ${emailTpl === t.id ? 'bg-[#00bfff]/10 border border-[#00bfff]/20 text-white' : 'text-neutral-500 hover:text-white hover:bg-neutral-800/30 border border-transparent'}`}>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-[10px] text-neutral-600">{t.desc}</div>
                    </button>
                  ))}
                </div>
                {/* Preview + Send */}
                <div className="flex flex-col">
                  {!emailTpl ? (
                    <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm">
                      <Mail className="w-8 h-8 mr-3 opacity-30" />Select a template to preview
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-neutral-500">To: <span className="text-white">{c.email}</span></p>
                          <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                            className="bg-transparent text-white text-sm font-medium outline-none mt-0.5 w-full" />
                        </div>
                        <button onClick={handleSendEmail} disabled={sending}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40">
                          <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Email'}
                        </button>
                      </div>
                      <div className="flex-1 bg-white rounded-lg overflow-hidden">
                        <iframe srcDoc={emailPreview} className="w-full h-full border-0" title="Email Preview" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══ CLIENTS LIST VIEW (CRM Home) ═══
  const totalRevenue = clients.reduce((s: number, c: any) => s + Number(c.total_revenue || 0), 0)
  const activeCount = clients.filter((c: any) => c.active_projects > 0).length
  const outstandingTotal = clients.reduce((s: number, c: any) => s + Number(c.outstanding || 0), 0)

  return (
    <div className="crm-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client CRM</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{clients.length} clients — {fmtMoney(totalRevenue)} total revenue</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
            <button onClick={() => setViewMode('contacts')} className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${viewMode === 'contacts' ? 'bg-[#00bfff]/15 text-[#00bfff]' : 'text-neutral-500 hover:text-white'}`}>Contacts</button>
            <button onClick={() => setViewMode('pipeline')} className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${viewMode === 'pipeline' ? 'bg-[#00bfff]/15 text-[#00bfff]' : 'text-neutral-500 hover:text-white'}`}>Pipeline</button>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all">
            <Plus className="w-4 h-4" />Add Client
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Clients', value: clients.length, color: '#00bfff' },
          { label: 'Active Projects', value: activeCount, color: '#8b5cf6' },
          { label: 'Revenue', value: fmtMoney(totalRevenue), color: '#10b981' },
          { label: 'Outstanding', value: fmtMoney(outstandingTotal), color: outstandingTotal > 0 ? '#ef4444' : '#10b981' },
        ].map((s, i) => (
          <div key={i} className="crm-metric">
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="crm-search" placeholder="Search clients by name, email, or company..." />
      </div>

      {/* ═══ PIPELINE VIEW ═══ */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {STAGES.filter(s => s.id !== 'lost').map(stage => {
            const stageClients = filtered.filter((c: any) => (c.prospect_stage || 'new_lead') === stage.id)
            return (
              <div key={stage.id} className="flex-shrink-0 w-64">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stage.label}</span>
                  <span className="text-[10px] text-neutral-600 ml-auto">{stageClients.length}</span>
                </div>
                <div className="space-y-2">
                  {stageClients.map((c: any) => (
                    <div key={c.client_id} onClick={() => openClient(c)}
                      className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 cursor-pointer hover:border-neutral-700 transition-all hover:translate-y-[-1px]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getAvatarColor(c.name) }}>{getInitials(c.name).charAt(0)}</div>
                        <span className="text-sm text-white font-medium truncate">{c.name}</span>
                      </div>
                      <p className="text-[10px] text-neutral-600 truncate">{c.company || c.email}</p>
                      {c.total_revenue > 0 && <p className="text-[10px] text-emerald-500 font-semibold mt-1">{fmtMoney(c.total_revenue)}</p>}
                      {stage.id !== 'won' && (
                        <button onClick={(e) => { e.stopPropagation(); const nextIdx = STAGES.findIndex(s => s.id === stage.id) + 1; if (nextIdx < STAGES.length) handleAdvanceStage(c.client_id, STAGES[nextIdx].id) }}
                          className="mt-2 w-full text-[10px] text-neutral-600 hover:text-[#00bfff] flex items-center justify-center gap-1 cursor-pointer transition-colors">
                          Advance <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {stageClients.length === 0 && <div className="text-center py-6 text-neutral-700 text-xs">Empty</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'contacts' && (<>

      {/* Client Cards Grid */}
      {loading && clients.length === 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="crm-card animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800" />
                <div className="flex-1"><div className="h-3 bg-neutral-800 rounded w-2/3 mb-2" /><div className="h-2 bg-neutral-800/50 rounded w-1/2" /></div>
              </div>
              <div className="h-2 bg-neutral-800/30 rounded w-full mb-2" />
              <div className="h-2 bg-neutral-800/30 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-600 text-sm">{search ? 'No clients match your search' : 'No clients yet'}</p>
        </div>
      ) : (
        <div className="crm-grid">
          <AnimatePresence>
            {filtered.map((c: any, i: number) => (
              <motion.div key={c.client_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }} onClick={() => openClient(c)} className="crm-card">
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="crm-avatar" style={{ background: `linear-gradient(135deg, ${getAvatarColor(c.name)}, ${getAvatarColor(c.name)}88)` }}>
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                    <p className="text-[11px] text-neutral-500 truncate">{c.company || c.email}</p>
                  </div>
                  <span className={`crm-health-dot ${healthStatus(c)}`} />
                </div>

                {/* Tags */}
                {c.tags_list?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3 relative z-10">
                    {c.tags_list.slice(0, 3).map((tag: string) => (
                      <span key={tag} className={`crm-tag ${TAG_STYLES[tag.toLowerCase()] || 'default'}`} style={{ fontSize: '10px', padding: '1px 8px' }}>{tag}</span>
                    ))}
                    {c.tags_list.length > 3 && <span className="text-[10px] text-neutral-600">+{c.tags_list.length - 3}</span>}
                  </div>
                )}

                {/* Stage Badge */}
                {c.prospect_stage && c.prospect_stage !== 'new_lead' && (
                  <div className="mb-2 relative z-10">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ color: STAGES.find(s => s.id === c.prospect_stage)?.color || '#64748b', background: `${STAGES.find(s => s.id === c.prospect_stage)?.color || '#475569'}15` }}>
                      {STAGES.find(s => s.id === c.prospect_stage)?.label || c.prospect_stage}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] text-neutral-600 relative z-10">
                  <span>{c.project_count || 0} project{c.project_count !== 1 ? 's' : ''}</span>
                  <span className={c.total_revenue > 0 ? 'text-emerald-500 font-semibold' : ''}>{c.total_revenue > 0 ? fmtMoney(c.total_revenue) : '—'}</span>
                </div>
                {c.outstanding > 0 && (
                  <div className="flex items-center justify-between text-[10px] mt-1 relative z-10">
                    <span className="text-neutral-700">Outstanding</span>
                    <span className="text-red-400 font-semibold">{fmtMoney(c.outstanding)}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      </>)}

      {/* Add Client Modal */}
      {showAdd && (
        <div className={modalBg} onClick={() => setShowAdd(false)}>
          <div className={`${modalCard} !max-w-lg`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Client</h3>
              <button onClick={() => setShowAdd(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="Full name *" required />
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputCls} placeholder="Email *" required />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} placeholder="Phone" />
                <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className={inputCls} placeholder="Company" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className={inputCls} placeholder="Industry" />
                <input value={form.source} onChange={e => setForm({...form, source: e.target.value})} className={inputCls} placeholder="Source (e.g. Referral)" />
              </div>
              <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className={inputCls} placeholder="Website (optional)" />
              <button type="submit" className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all">
                Create Client
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
