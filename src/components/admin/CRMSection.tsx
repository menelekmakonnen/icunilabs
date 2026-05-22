import { useEffect, useState, useRef } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { ArrowLeft, Search, X, MessageSquare, FolderOpen, FileText, CheckCircle, Send, Mail, ChevronRight, ChevronLeft, ChevronDown, Pencil, Trash2, Save, MapPin, Globe, Lock, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { personas } from '../../data/personaData'
import { FormButton } from './ActionButton'
import CallGuide from './CallGuide'
import './crm.css'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl'

const AVATAR_COLORS = ['#00bfff','#8b5cf6','#ff7a00','#10b981','#ef4444','#f59e0b','#ec4899','#06b6d4']
function getAvatarColor(name: string) { let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] }
function getInitials(name: string) { const clean = (name || '').replace(/[^a-zA-Z\s]/g, '').trim(); if (!clean) return '\u2022'; return clean.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function fmtMoney(v: number) { return `GH₵${(v||0).toLocaleString()}` }
function fmtDate(d: string) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) } catch { return d } }
function healthStatus(c: any) { if (!c.project_count) return 'inactive'; if (c.outstanding > 0) return 'warning'; if (c.active_projects > 0) return 'healthy'; return 'inactive' }

const TAG_STYLES: Record<string, string> = { priority:'priority', vip:'vip', new:'new', returning:'returning' }

function stageClass(stage: string): string {
  if (stage === 'prospect') return 'stage-prospect'
  if (stage === 'won') return 'stage-won'
  if (stage === 'lost') return 'stage-lost'
  if (['new_lead','contacted','qualified'].includes(stage)) return 'stage-lead'
  return ''
}

/** Procedural person silhouette SVG — unique hue per name */
function PersonAvatar({ name, size = 80 }: { name: string; size?: number }) {
  const color = getAvatarColor(name)
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill={color} opacity="0.15" />
      <circle cx="40" cy="40" r="38" stroke={color} strokeWidth="1.5" opacity="0.25" />
      <circle cx="40" cy="28" r="13" fill={color} opacity="0.7" />
      <path d="M14 72c0-14.36 11.64-26 26-26s26 11.64 26 26" fill={color} opacity="0.5" />
      <circle cx="40" cy="28" r="11" fill={color} opacity="0.3" />
      <text x="40" y="33" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui">{getInitials(name).charAt(0)}</text>
    </svg>
  )
}

const STAGES = [
  { id: 'prospect', label: 'Prospect', color: '#64748b' },
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
  const { clients, loading, error, activeClient, clientActivity, user } = useAdminStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showAddProspect, setShowAddProspect] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', source:'', industry:'', website:'' })
  const [prospectForm, setProspectForm] = useState({ name:'', email:'', phone:'', company:'', source:'', location:'', buyer_profile:'', first_contact_date:'' })
  const [batchMode, setBatchMode] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [batchLocation, setBatchLocation] = useState('')
  const [detailTab, setDetailTab] = useState<'overview'|'projects'|'invoices'|'notes'|'activity'|'email'>('overview')
  const [noteText, setNoteText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [viewMode, setViewMode] = useState<'contacts'|'pipeline'>('contacts')
  const [callGuideClient, setCallGuideClient] = useState<any>(null)
  const [showCallPicker, setShowCallPicker] = useState(false)
  const callPickerRef = useRef<HTMLDivElement>(null)
  const [emailTpl, setEmailTpl] = useState('')
  const [emailPreview, setEmailPreview] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [stagePopup, setStagePopup] = useState<{ clientId: string; stage: string; direction: 'advance'|'regress' } | null>(null)
  const [stageNote, setStageNote] = useState('')
  // Per-action busy states for spinner feedback
  const [busyAdd, setBusyAdd] = useState(false)
  const [busyProspect, setBusyProspect] = useState(false)
  const [busyBatch, setBusyBatch] = useState(false)
  const [busyNote, setBusyNote] = useState(false)
  const [busySave, setBusySave] = useState(false)
  const [busyDelete, setBusyDelete] = useState(false)
  const [busyStage, setBusyStage] = useState(false)
  const [busyOpen, setBusyOpen] = useState<string | null>(null)
  const [showHistoric, setShowHistoric] = useState(false)
  const [historicForm, setHistoricForm] = useState({ name:'', email:'', phone:'', company:'', industry:'', created_at_override:'', project_title:'', project_type:'Website', estimated_cost:'', start_date:'', completion_date:'', notes:'' })
  const [historicPayments, setHistoricPayments] = useState<{amount:string, method:string, paid_at:string}[]>([])
  const [busyHistoric, setBusyHistoric] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [projectForm, setProjectForm] = useState({ title:'', type:'Website', estimated_cost:'', description:'', est_completion:'' })
  const [busyProject, setBusyProject] = useState(false)

  const isGodmode = user?.role === 'Godmode'

  useEffect(() => { adminActions.loadClients() }, [])

  // Close call picker on click outside
  useEffect(() => {
    if (!showCallPicker) return
    const handler = (e: MouseEvent) => {
      if (callPickerRef.current && !callPickerRef.current.contains(e.target as Node)) setShowCallPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showCallPicker])


  const activeClients = clients.filter((c: any) => (c.status || '').toLowerCase() !== 'deleted')

  const filtered = activeClients.filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q)
  })

  const openClient = async (c: any) => {
    setDetailTab('overview')
    setEditing(false)
    // Show the client immediately from local data (optimistic)
    adminActions.setActiveClientOptimistic(c)
    setBusyOpen(c.client_id)
    try {
      // Fetch fresh data in background
      adminActions.getClient(c.client_id).then(() => setBusyOpen(null))
      adminActions.getClientActivity(c.client_id)
    } catch (err) {
      console.error('Failed to open client:', err)
      setBusyOpen(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusyAdd(true)
    try {
      const ok = await adminActions.createClient(form)
      if (ok) { setShowAdd(false); setForm({ name:'', email:'', phone:'', company:'', source:'', industry:'', website:'' }) }
    } finally { setBusyAdd(false) }
  }

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusyProspect(true)
    try {
      const payload: any = { ...prospectForm, prospect_stage: 'prospect' }
      if (prospectForm.location) payload.address = prospectForm.location
      const ok = await adminActions.createClient(payload)
      if (ok) { setShowAddProspect(false); setProspectForm({ name:'', email:'', phone:'', company:'', source:'', location:'', buyer_profile:'', first_contact_date:'' }) }
    } finally { setBusyProspect(false) }
  }

  const handleBatchAdd = async () => {
    if (!batchName.trim()) return
    setBusyBatch(true)
    try {
      const payload: any = { name: batchName.trim(), source: 'Google Maps', prospect_stage: 'prospect' }
      if (batchLocation.trim()) payload.address = batchLocation.trim()
      const ok = await adminActions.createClient(payload)
      if (ok) setBatchName('')
    } finally { setBusyBatch(false) }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !activeClient) return
    setBusyNote(true)
    try {
      await adminActions.addClientNote(activeClient.client_id, noteText)
      setNoteText('')
    } finally { setBusyNote(false) }
  }

  const handleAdvanceStage = async (clientId: string, stage: string, note?: string) => {
    setBusyStage(true)
    try {
      await adminActions.updateClientStatus(clientId, stage, note || `Stage changed to ${stage}`)
      setStagePopup(null)
      setStageNote('')
    } finally { setBusyStage(false) }
  }

  const openStagePopup = (clientId: string, stage: string, _direction: 'advance'|'regress') => {
    // Instant stage change — no popup required
    handleAdvanceStage(clientId, stage)
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

  const startEditing = () => {
    if (!activeClient) return
    const c = activeClient
    setEditForm({ name: c.name||'', email: c.email||'', phone: c.phone||'', company: c.company||'', industry: c.industry||'', source: c.source||'', website: c.website||'', address: c.address||'', notes: c.notes||'' })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!activeClient) return
    setBusySave(true)
    try {
      const ok = await adminActions.updateClient(activeClient.client_id, editForm)
      if (ok) setEditing(false)
    } finally { setBusySave(false) }
  }

  const handleDeleteClient = async () => {
    if (!activeClient) return
    setBusyDelete(true)
    try {
      await adminActions.deleteClient(activeClient.client_id)
      setShowDeleteConfirm(false)
    } finally { setBusyDelete(false) }
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
            <PersonAvatar name={c.name || c.company || c.email || ''} size={42} />
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
            {/* Start Call */}
            <button onClick={() => setCallGuideClient(c)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-500/20 transition-all" title="Start call guide">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            {/* Stage Selector */}
            <select value={c.prospect_stage || 'new_lead'} onChange={e => handleAdvanceStage(c.client_id, e.target.value)}
              className="text-xs bg-neutral-900 border border-neutral-700 text-white rounded-lg px-2 py-1 cursor-pointer">
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button onClick={startEditing} className="text-neutral-500 hover:text-[#00bfff] cursor-pointer transition-colors" title="Edit client">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="text-neutral-500 hover:text-red-400 cursor-pointer transition-colors" title="Delete client">
              <Trash2 className="w-4 h-4" />
            </button>
            {/* Visibility Toggle */}
            {(() => {
              const isGod = user?.role === 'Godmode'
              const isOwner = c.added_by === user?.email
              const canToggle = isGod || isOwner
              const isPublic = c.visibility === 'public' || !c.added_by // legacy = public
              return canToggle ? (
                <button
                  onClick={async () => {
                    const newVis = isPublic ? 'private' : 'public'
                    await adminActions.updateClient(c.client_id, { visibility: newVis })
                    adminActions.loadClients()
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${isPublic ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' : 'text-neutral-500 bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800'}`}
                  title={isPublic ? 'Visible to all staff — click to make private' : 'Only visible to you — click to make public'}
                >
                  {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isPublic ? 'Public' : 'Private'}
                </button>
              ) : (
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${isPublic ? 'text-emerald-400/60 bg-emerald-500/5 border-emerald-500/10' : 'text-neutral-600 bg-neutral-800/30 border-neutral-800/30'}`}>
                  {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isPublic ? 'Public' : 'Private'}
                </span>
              )
            })()}
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
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={async e => { if (e.key === 'Enter' && tagInput.trim() && activeClient) { const existing = activeClient.tags_list || []; await adminActions.updateClientTags(activeClient.client_id, [...existing, tagInput.trim()]); setTagInput('') } }}
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
              {/* Edit Mode */}
              {editing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Edit Client</p>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-white cursor-pointer transition-colors">Cancel</button>
                      <button onClick={handleSaveEdit} disabled={busySave} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40">
                        {busySave ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Saving...</> : <><Save className="w-3.5 h-3.5" />Save Changes</>}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Name</label><input value={editForm.name||''} onChange={e => setEditForm({...editForm, name: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Email</label><input value={editForm.email||''} onChange={e => setEditForm({...editForm, email: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Phone</label><input value={editForm.phone||''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Company</label><input value={editForm.company||''} onChange={e => setEditForm({...editForm, company: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Industry</label><input value={editForm.industry||''} onChange={e => setEditForm({...editForm, industry: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Source</label><input value={editForm.source||''} onChange={e => setEditForm({...editForm, source: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Website</label><input value={editForm.website||''} onChange={e => setEditForm({...editForm, website: e.target.value})} className={inputCls} /></div>
                    <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Address</label><input value={editForm.address||''} onChange={e => setEditForm({...editForm, address: e.target.value})} className={inputCls} /></div>
                  </div>
                  <div><label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Notes</label><textarea value={editForm.notes||''} onChange={e => setEditForm({...editForm, notes: e.target.value})} className={`${inputCls} min-h-[80px]`} rows={3} /></div>
                </div>
              ) : (
              <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                {[
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

              {/* Pipeline Journey Tracker */}
              <div className="crm-metric !py-4 !px-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Pipeline Journey</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const curIdx = STAGES.findIndex(s => s.id === (c.prospect_stage || 'new_lead'))
                      const prevStage = curIdx > 0 ? STAGES[curIdx - 1] : null
                      const nextStage = curIdx < STAGES.length - 2 ? STAGES[curIdx + 1] : null
                      return (<>
                        {prevStage && (
                          <button onClick={() => openStagePopup(c.client_id, prevStage.id, 'regress')}
                            className="text-[10px] text-neutral-600 hover:text-red-400 flex items-center gap-0.5 cursor-pointer transition-colors">
                            <ChevronLeft className="w-3 h-3" /> Regress
                          </button>
                        )}
                        {nextStage && (
                          <button onClick={() => openStagePopup(c.client_id, nextStage.id, 'advance')}
                            className="text-[10px] text-neutral-600 hover:text-[#00bfff] flex items-center gap-0.5 cursor-pointer transition-colors">
                            Advance <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </>)
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-0">
                  {STAGES.filter(s => s.id !== 'lost').map((s, i, arr) => {
                    const currentIdx = arr.findIndex(st => st.id === (c.prospect_stage || 'new_lead'))
                    const isActive = i === currentIdx
                    const isPast = i < currentIdx
                    return (
                      <div key={s.id} className="flex items-center" style={{ flex: i < arr.length - 1 ? 1 : 0 }}>
                        <div className="relative flex flex-col items-center" style={{ minWidth: 18 }}>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                            isActive ? 'scale-125' : ''
                          }`} style={{
                            borderColor: isPast || isActive ? s.color : 'rgba(255,255,255,0.1)',
                            background: isPast ? s.color : isActive ? `${s.color}30` : 'transparent',
                            boxShadow: isActive ? `0 0 8px ${s.color}40` : 'none'
                          }} />
                          <span className={`absolute top-5 text-[8px] whitespace-nowrap ${isActive ? 'text-white font-bold' : isPast ? 'text-neutral-500' : 'text-neutral-700'}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="flex-1 h-0.5 mx-0.5" style={{
                            background: isPast ? `linear-gradient(90deg, ${s.color}, ${arr[i+1].color})` : 'rgba(255,255,255,0.06)'
                          }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="crm-metric">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Contact Info</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Email:</span>{c.email}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Phone:</span>{c.phone || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Company:</span>{c.company || '—'}</p>
                    {c.address && <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Location:</span>{c.address}</p>}
                    {c.website && <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Web:</span><a href={c.website} target="_blank" rel="noreferrer" className="text-[#00bfff] hover:underline">{c.website}</a></p>}
                  </div>
                </div>
                <div className="crm-metric">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Details</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Industry:</span>{c.industry || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Source:</span>{c.source || '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Profile:</span>{c.buyer_profile ? personas.find(p => p.id === c.buyer_profile)?.title || c.buyer_profile : '—'}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Added By:</span>{c.added_by ? c.added_by.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : <span className="text-neutral-700 italic">Legacy entry</span>}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Client Since:</span>{fmtDate(c.created_at)}</p>
                    <p className="text-neutral-300"><span className="text-neutral-600 mr-2">Last Activity:</span>{fmtDate(c.last_activity)}</p>
                  </div>
                </div>
              </div>

              {/* Challenge Intelligence */}
              <div className="crm-metric !py-4 !px-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Discovery Intelligence
                  </p>
                  <span className="text-[9px] text-neutral-700 italic">Challenge, Don't Sell</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[9px] text-neutral-700 uppercase tracking-wider mb-1">Pain Category</p>
                    <p className="text-sm text-neutral-300 font-medium">{c.pain_category || <span className="text-neutral-700 italic">Not captured</span>}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-neutral-700 uppercase tracking-wider mb-1">Their Most Expensive Problem</p>
                    <p className="text-sm text-neutral-300">{c.challenge_statement || <span className="text-neutral-700 italic">Ask: &quot;What is your most expensive problem?&quot;</span>}</p>
                  </div>
                </div>
                {c.laugh_factor && (
                  <div className="mt-2 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    <span className="text-[10px] text-amber-500/80 font-bold">Laugh Factor</span>
                    <span className="text-[10px] text-neutral-500">They laughed when describing it — high-value signal</span>
                  </div>
                )}
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
              </>)}
            </div>
          )}

          {detailTab === 'projects' && (
            <div className="crm-fade-in space-y-3">
              {/* Add Project Button */}
              <button onClick={() => setShowAddProject(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 border border-dashed border-neutral-700 rounded-xl text-sm font-bold text-neutral-400 cursor-pointer hover:border-[#00bfff]/40 hover:text-[#00bfff] transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><line x1="12" y1="7" x2="12" y2="13" /><line x1="9" y1="10" x2="15" y2="10" /></svg>
                Add Project
              </button>

              {(c.projects || []).length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-8">No projects yet — add one above</p>
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

              {/* Add Project Modal */}
              {showAddProject && (
                <div className={modalBg} onClick={() => setShowAddProject(false)}>
                  <div className={modalCard} onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-white mb-1">Add Project</h3>
                    <p className="text-xs text-neutral-500 mb-4">Create a new project for {c.name}</p>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      setBusyProject(true)
                      try {
                        const ok = await adminActions.createProject({
                          client_id: c.client_id,
                          title: projectForm.title,
                          type: projectForm.type,
                          estimated_cost: parseFloat(projectForm.estimated_cost) || 0,
                          description: projectForm.description || undefined,
                          est_completion: projectForm.est_completion || undefined,
                        })
                        if (ok) {
                          setShowAddProject(false)
                          setProjectForm({ title:'', type:'Website', estimated_cost:'', description:'', est_completion:'' })
                          // Refresh client data to show new project
                          adminActions.getClient(c.client_id)
                        }
                      } finally { setBusyProject(false) }
                    }} className="space-y-3">
                      <input value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})}
                        className={inputCls} placeholder="Project title *" required />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={projectForm.type} onChange={e => setProjectForm({...projectForm, type: e.target.value})}
                          className={inputCls}>
                          <option value="Website">Website</option>
                          <option value="Web App">Web App</option>
                          <option value="Mobile App">Mobile App</option>
                          <option value="Branding">Branding</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Training">Training</option>
                          <option value="Other">Other</option>
                        </select>
                        <input value={projectForm.estimated_cost} onChange={e => setProjectForm({...projectForm, estimated_cost: e.target.value})}
                          className={inputCls} placeholder="Est. cost (GH₵) *" type="number" step="0.01" required />
                      </div>
                      <input value={projectForm.est_completion} onChange={e => setProjectForm({...projectForm, est_completion: e.target.value})}
                        className={inputCls} placeholder="Est. completion date" type="date" />
                      <textarea value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                        className={inputCls + ' min-h-[60px]'} placeholder="Description (optional)" rows={2} />
                      <FormButton busy={busyProject} className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white">
                        Create Project
                      </FormButton>
                    </form>
                  </div>
                </div>
              )}
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
                <button onClick={handleAddNote} disabled={!noteText.trim() || busyNote}
                  className="self-end px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-30 flex items-center gap-2">
                  {busyNote ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> : <Send className="w-4 h-4" />}{busyNote ? '' : 'Add'}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className={modalBg} onClick={() => setShowDeleteConfirm(false)}>
            <div className={modalCard} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">Delete Client</h3>
              <p className="text-sm text-neutral-400 mb-4">Are you sure you want to delete <strong className="text-white">{c.name}</strong>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors">Cancel</button>
                <button onClick={handleDeleteClient} disabled={busyDelete} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold cursor-pointer hover:bg-red-500/30 transition-all disabled:opacity-40 flex items-center gap-2">{busyDelete ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Deleting...</> : 'Delete Client'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══ CLIENTS LIST VIEW (CRM Home) ═══
  const outstandingTotal = activeClients.reduce((s: number, c: any) => s + Number(c.outstanding || 0), 0)

  return (
    <div className="crm-fade-in">
      {/* Header */}
      <div className="mb-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Client CRM</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{activeClients.length} contacts in pipeline</p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex border-b border-neutral-800 mb-4">
          <button onClick={() => setViewMode('contacts')}
            className={`crm-view-tab ${viewMode === 'contacts' ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Contacts
          </button>
          <button onClick={() => setViewMode('pipeline')}
            className={`crm-view-tab ${viewMode === 'pipeline' ? 'active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="6" height="18" rx="1" /><rect x="9" y="8" width="6" height="13" rx="1" /><rect x="17" y="5" width="6" height="16" rx="1" />
            </svg>
            Pipeline
          </button>
        </div>

        {/* Action Row: Start Call + Add buttons */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={callPickerRef}>
            <button
              onClick={() => setShowCallPicker(!showCallPicker)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-sm font-bold cursor-pointer hover:bg-emerald-500/15 hover:border-emerald-400/40 transition-all"
            >
              <Phone className="w-4 h-4" />
              Start Call
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            </button>
            {showCallPicker && (
              <div className="absolute top-full left-0 mt-2 w-80 max-h-72 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 py-1"
                style={{ scrollbarWidth: 'thin' }}>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Select a contact</p>
                {activeClients.length === 0 && (
                  <p className="px-3 py-4 text-xs text-neutral-500 text-center">No contacts yet</p>
                )}
                {activeClients.map((cl: any) => (
                  <button key={cl.client_id}
                    onClick={() => { setCallGuideClient(cl); setShowCallPicker(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-neutral-800/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(cl.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{cl.name || 'Unnamed'}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{cl.company || 'No company'} · {cl.phone || 'No phone'}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0" style={{
                      color: cl.prospect_stage === 'client' ? '#10b981' : cl.prospect_stage === 'qualified' ? '#00bfff' : '#64748b',
                      borderColor: cl.prospect_stage === 'client' ? '#10b98140' : cl.prospect_stage === 'qualified' ? '#00bfff40' : '#64748b30',
                      background: cl.prospect_stage === 'client' ? '#10b98110' : cl.prospect_stage === 'qualified' ? '#00bfff10' : '#64748b08',
                    }}>{(cl.prospect_stage || 'new_lead').replace(/_/g, ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-6 bg-neutral-800" />
          <button onClick={() => setShowAddProspect(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-xl text-sm font-bold cursor-pointer hover:border-neutral-500 hover:text-white transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Prospect
          </button>
          {isGodmode && (
            <button onClick={() => setShowHistoric(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-amber-700/40 text-amber-400 rounded-xl text-sm font-bold cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" />
              </svg>
              Historic
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" />
            </svg>
            Client
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Contacts', value: activeClients.length, color: '#00bfff' },
          { label: 'Paying Clients', value: activeClients.filter((c: any) => ['won', 'client'].includes((c.prospect_stage || '').toLowerCase())).length, color: '#10b981' },
          { label: 'In Pipeline', value: activeClients.filter((c: any) => !['won', 'lost'].includes(c.prospect_stage || '')).length, color: '#f59e0b' },
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
        <div className="flex gap-3 overflow-x-auto overflow-y-auto pb-4" style={{ maxHeight: 'calc(100vh - 320px)', minHeight: 300 }}>
          {STAGES.filter(s => s.id !== 'lost').map((stage) => {
            const stageClients = filtered.filter((c: any) => (c.prospect_stage || 'new_lead') === stage.id)
            const showBoundary = stage.id === 'meeting_scheduled'
            return (
              <div key={stage.id} className="flex-shrink-0 flex">
                {showBoundary && (
                  <div className="flex flex-col items-center justify-start mr-3 pt-1" style={{ width: 32 }}>
                    <div className="w-px flex-1 bg-gradient-to-b from-[#ff7a00]/60 via-[#ff7a00]/20 to-transparent" />
                    <span className="text-[8px] text-[#ff7a00]/60 font-bold uppercase tracking-wider whitespace-nowrap" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', marginTop: 8 }}>Handoff to Founder</span>
                  </div>
                )}
              <div className="w-64">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stage.label}</span>
                  <span className="text-[10px] text-neutral-600 ml-auto">{stageClients.length}</span>
                </div>
                <div className="space-y-2">
                  {stageClients.map((c: any) => (
                    <div key={c.client_id} onClick={() => openClient(c)}
                      className={`bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 cursor-pointer hover:border-neutral-700 transition-all hover:translate-y-[-1px] ${busyOpen === c.client_id ? 'opacity-60 pointer-events-none' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {busyOpen === c.client_id ? <svg className="animate-spin w-6 h-6 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> : <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: getAvatarColor(c.name || c.company || '') }}>{getInitials(c.name || c.company || c.email || '?').charAt(0)}</div>}
                        <span className="text-sm text-white font-medium truncate">{c.name || c.company || c.email || 'Unnamed'}</span>
                      </div>
                      <p className="text-[10px] text-neutral-600 truncate">{c.company || c.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {c.visibility === 'public' && <Globe className="w-3 h-3 text-emerald-500/50" />}
                        {c.added_by && c.visibility !== 'public' && <Lock className="w-3 h-3 text-neutral-700" />}
                      </div>
                      {c.added_by && (
                        <p className="text-[9px] text-neutral-700 mt-1 truncate">
                          Added by {c.added_by.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setCallGuideClient(c) }}
                          className="text-[10px] text-emerald-500/60 hover:text-emerald-400 flex items-center justify-center gap-0.5 cursor-pointer transition-colors px-1" title="Start Call">
                          <Phone className="w-3 h-3" />
                        </button>
                        {(() => { const curIdx = STAGES.findIndex(s => s.id === stage.id); return curIdx > 0 ? (
                          <button onClick={(e) => { e.stopPropagation(); openStagePopup(c.client_id, STAGES[curIdx - 1].id, 'regress') }}
                            className="flex-1 text-[10px] text-neutral-600 hover:text-[#ef4444] flex items-center justify-center gap-0.5 cursor-pointer transition-colors">
                            <ChevronLeft className="w-3 h-3" /> Regress
                          </button>
                        ) : null })()}
                        {stage.id !== 'won' && (() => { const nextIdx = STAGES.findIndex(s => s.id === stage.id) + 1; return nextIdx < STAGES.length ? (
                          <button onClick={(e) => { e.stopPropagation(); openStagePopup(c.client_id, STAGES[nextIdx].id, 'advance') }}
                            className="flex-1 text-[10px] text-neutral-600 hover:text-[#00bfff] flex items-center justify-center gap-0.5 cursor-pointer transition-colors">
                            Advance <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : null })()}
                      </div>
                    </div>
                  ))}
                  {stageClients.length === 0 && <div className="text-center py-6 text-neutral-700 text-xs">Empty</div>}
                </div>
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
            {filtered.map((c: any, i: number) => {
              const displayName = c.name || c.company || c.email || 'Unnamed'
              const stage = c.prospect_stage || 'new_lead'
              const stageInfo = STAGES.find(s => s.id === stage)
              const addedByName = c.added_by ? c.added_by.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : ''

              return (
                <motion.div key={c.client_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.3 }} onClick={() => openClient(c)}
                  className={`crm-card ${stageClass(stage)} ${busyOpen === c.client_id ? 'opacity-60 pointer-events-none' : ''}`}>

                  {/* SVG Profile Avatar */}
                  <div className="crm-profile-avatar">
                    {busyOpen === c.client_id
                      ? <svg className="animate-spin w-12 h-12 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                      : <PersonAvatar name={displayName} />
                    }
                  </div>

                  {/* Name + Company */}
                  <h3 className="text-sm font-bold text-white truncate w-full relative z-10">{displayName}</h3>
                  {c.company && c.company !== displayName && (
                    <p className="text-[11px] text-neutral-500 truncate w-full relative z-10 mt-0.5">{c.company}</p>
                  )}

                  {/* Stage Badge */}
                  <div className="mt-2 mb-1 relative z-10">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                      style={{ color: stageInfo?.color || '#64748b', background: `${stageInfo?.color || '#475569'}15` }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageInfo?.color || '#64748b' }} />
                      {stageInfo?.label || stage}
                    </span>
                  </div>

                  {/* Outstanding */}
                  {c.outstanding > 0 && (
                    <p className="text-[10px] text-red-400/80 mt-1 relative z-10">Owes {fmtMoney(c.outstanding)}</p>
                  )}

                  {/* Tags */}
                  {c.tags_list?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-center relative z-10">
                      {c.tags_list.slice(0, 2).map((tag: string) => (
                        <span key={tag} className={`crm-tag ${TAG_STYLES[tag.toLowerCase()] || 'default'}`} style={{ fontSize: '9px', padding: '1px 6px' }}>{tag}</span>
                      ))}
                      {c.tags_list.length > 2 && <span className="text-[9px] text-neutral-600">+{c.tags_list.length - 2}</span>}
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="crm-meta relative z-10">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-600">
                      {c.visibility === 'public' ? <Globe className="w-3 h-3 text-emerald-500/50" /> : c.added_by ? <Lock className="w-3 h-3 text-neutral-700" /> : null}
                      <span className="truncate">{addedByName ? `Added by ${addedByName}` : 'Legacy'}</span>
                    </div>
                    <p className="text-[10px] text-neutral-700 mt-0.5">{fmtDate(c.created_at)}</p>
                  </div>
                </motion.div>
              )
            })}
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
              <FormButton busy={busyAdd} busyText="Creating..." className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all">
                Create Client
              </FormButton>
            </form>
          </div>
        </div>
      )}

      {/* Add Prospect Modal — enriched with phone, location, buyer profile, SLA seed */}
      {showAddProspect && (
        <div className={modalBg} onClick={() => { setShowAddProspect(false); setBatchMode(false) }}>
          <div className={`${modalCard} !max-w-md`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{batchMode ? 'Maps Batch Prospecting' : 'Add Prospect'}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{batchMode ? 'Rapid-fire: add prospects from Google Maps.' : 'Fill in any details you have. At least one identifier needed.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setBatchMode(!batchMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${batchMode ? 'bg-[#ff7a00]/10 border-[#ff7a00]/30 text-[#ff7a00]' : 'border-neutral-700 text-neutral-500 hover:text-white'}`}>
                  <MapPin className="w-3 h-3" />{batchMode ? 'Detail Mode' : 'Maps Mode'}
                </button>
                <button onClick={() => { setShowAddProspect(false); setBatchMode(false) }} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {batchMode ? (
              /* ── Maps Batch Mode ── */
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Location / Area</label>
                  <input value={batchLocation} onChange={e => setBatchLocation(e.target.value)} className={inputCls} placeholder="e.g. Print shops near Newtown" />
                </div>
                <div className="flex gap-2">
                  <input value={batchName} onChange={e => setBatchName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBatchAdd() } }}
                    className={`${inputCls} flex-1`} placeholder="Business name" autoFocus />
                  <button onClick={handleBatchAdd} disabled={!batchName.trim() || busyBatch}
                    className="px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-neutral-700 transition-all disabled:opacity-30 flex items-center gap-1.5">
                    {busyBatch ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> : 'Add'}
                  </button>
                </div>
                <p className="text-[10px] text-neutral-600 text-center">Press Enter or click Add — then type the next name. Source auto-set to "Google Maps".</p>
              </div>
            ) : (
              /* ── Detail Mode ── */
              <form onSubmit={handleAddProspect} className="space-y-3">
                <input value={prospectForm.name} onChange={e => setProspectForm({...prospectForm, name: e.target.value})} className={inputCls} placeholder="Contact name" />
                <input value={prospectForm.company} onChange={e => setProspectForm({...prospectForm, company: e.target.value})} className={inputCls} placeholder="Company name" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={prospectForm.phone} onChange={e => setProspectForm({...prospectForm, phone: e.target.value})} className={inputCls} placeholder="Phone number" />
                  <input type="email" value={prospectForm.email} onChange={e => setProspectForm({...prospectForm, email: e.target.value})} className={inputCls} placeholder="Email" />
                </div>
                <input value={prospectForm.location} onChange={e => setProspectForm({...prospectForm, location: e.target.value})} className={inputCls} placeholder="Location / Area (e.g. Newtown, Accra)" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={prospectForm.source} onChange={e => setProspectForm({...prospectForm, source: e.target.value})} className={inputCls} placeholder="Source (Google Maps, Referral...)" />
                  <select value={prospectForm.buyer_profile} onChange={e => setProspectForm({...prospectForm, buyer_profile: e.target.value})} className={inputCls}>
                    <option value="">— Buyer Profile —</option>
                    {personas.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">Expected First Contact</label>
                  <input type="datetime-local" value={prospectForm.first_contact_date} onChange={e => setProspectForm({...prospectForm, first_contact_date: e.target.value})} className={inputCls} />
                </div>
                <FormButton busy={busyProspect} busyText="Adding..."
                  disabled={!prospectForm.name && !prospectForm.email && !prospectForm.company}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 text-white rounded-lg text-sm font-bold cursor-pointer hover:bg-neutral-700 transition-all disabled:cursor-not-allowed">
                  Add as Prospect
                </FormButton>
                {!prospectForm.name && !prospectForm.email && !prospectForm.company && (
                  <p className="text-[10px] text-neutral-600 text-center">Enter at least a name, email, or company</p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Stage Change Note Popup */}
      {stagePopup && (
        <div className={modalBg} onClick={() => { setStagePopup(null); setStageNote('') }}>
          <div className={`${modalCard} !max-w-sm`} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-1">
              {stagePopup.direction === 'advance' ? 'Advance' : 'Regress'} Stage
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Moving to <span className="font-bold" style={{ color: STAGES.find(s => s.id === stagePopup.stage)?.color || '#fff' }}>
                {STAGES.find(s => s.id === stagePopup.stage)?.label}
              </span>
            </p>
            <textarea value={stageNote} onChange={e => setStageNote(e.target.value)}
              className="crm-note-input mb-4" placeholder="Add a note about this stage change (optional)..." rows={3} />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setStagePopup(null); setStageNote('') }}
                className="px-4 py-2 text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors">Cancel</button>
              <button onClick={() => handleAdvanceStage(stagePopup.clientId, stagePopup.stage)}
                disabled={busyStage}
                className={`px-5 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center gap-2 disabled:opacity-40 ${
                  stagePopup.direction === 'advance'
                    ? 'bg-[#00bfff]/15 text-[#00bfff] border border-[#00bfff]/30 hover:bg-[#00bfff]/25'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                }`}>
                {busyStage ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg> : null}
                {busyStage ? 'Working...' : stagePopup.direction === 'advance' ? 'Advance' : 'Regress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historic Client Modal (Godmode only) */}
      {showHistoric && (
        <div className={modalBg} onClick={() => setShowHistoric(false)}>
          <div className={`${modalCard} !max-w-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-amber-400">Add Historic Client</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Record a past client with their project and payment history.</p>
              </div>
              <button onClick={() => setShowHistoric(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              setBusyHistoric(true)
              try {
                // Step 1: Create the client
                const clientOk = await adminActions.createClient({
                  name: historicForm.name,
                  email: historicForm.email,
                  phone: historicForm.phone,
                  company: historicForm.company,
                  industry: historicForm.industry,
                  notes: historicForm.notes,
                  created_at_override: historicForm.created_at_override,
                  prospect_stage: 'won',
                })
                if (!clientOk) return

                // Step 2: If project info provided, add historic project
                if (historicForm.project_title.trim()) {
                  // Find the newly created client from the refreshed store
                  const freshClients = clients
                  const newClient = freshClients.find((c: any) => c.email === historicForm.email || c.name === historicForm.name)
                  if (newClient) {
                    await adminActions.addHistoricProject({
                      client_id: newClient.client_id,
                      title: historicForm.project_title,
                      type: historicForm.project_type,
                      estimated_cost: historicForm.estimated_cost,
                      start_date: historicForm.start_date,
                      completion_date: historicForm.completion_date,
                      payments: historicPayments.filter(p => p.amount && Number(p.amount) > 0),
                    })
                  }
                }

                setShowHistoric(false)
                setHistoricForm({ name:'', email:'', phone:'', company:'', industry:'', created_at_override:'', project_title:'', project_type:'Website', estimated_cost:'', start_date:'', completion_date:'', notes:'' })
                setHistoricPayments([])
              } finally { setBusyHistoric(false) }
            }} className="space-y-4">

              {/* Client Section */}
              <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Client Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input value={historicForm.name} onChange={e => setHistoricForm({...historicForm, name: e.target.value})} className={inputCls} placeholder="Full name *" required />
                  <input type="email" value={historicForm.email} onChange={e => setHistoricForm({...historicForm, email: e.target.value})} className={inputCls} placeholder="Email *" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={historicForm.phone} onChange={e => setHistoricForm({...historicForm, phone: e.target.value})} className={inputCls} placeholder="Phone" />
                  <input value={historicForm.company} onChange={e => setHistoricForm({...historicForm, company: e.target.value})} className={inputCls} placeholder="Company" />
                  <input value={historicForm.industry} onChange={e => setHistoricForm({...historicForm, industry: e.target.value})} className={inputCls} placeholder="Industry" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-600 mb-1 block">Client Since (backdated)</label>
                    <input type="date" value={historicForm.created_at_override} onChange={e => setHistoricForm({...historicForm, created_at_override: e.target.value})} className={inputCls} />
                  </div>
                  <textarea value={historicForm.notes} onChange={e => setHistoricForm({...historicForm, notes: e.target.value})} className={`${inputCls} !min-h-[40px]`} placeholder="Notes" rows={1} />
                </div>
              </div>

              {/* Project Section */}
              <div className="border border-neutral-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Project (Optional)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input value={historicForm.project_title} onChange={e => setHistoricForm({...historicForm, project_title: e.target.value})} className={inputCls} placeholder="Project title" />
                  <select value={historicForm.project_type} onChange={e => setHistoricForm({...historicForm, project_type: e.target.value})} className={inputCls}>
                    <option>Website</option><option>Branding</option><option>Design</option><option>Social Media</option><option>Marketing</option><option>Consulting</option><option>Print</option><option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-600 mb-1 block">Project Cost (GH₵)</label>
                    <input type="number" value={historicForm.estimated_cost} onChange={e => setHistoricForm({...historicForm, estimated_cost: e.target.value})} className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-600 mb-1 block">Start Date</label>
                    <input type="date" value={historicForm.start_date} onChange={e => setHistoricForm({...historicForm, start_date: e.target.value})} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-600 mb-1 block">Completion Date</label>
                    <input type="date" value={historicForm.completion_date} onChange={e => setHistoricForm({...historicForm, completion_date: e.target.value})} className={inputCls} />
                  </div>
                </div>

                {/* Payment Records */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Payment Records</h5>
                    <button type="button" onClick={() => setHistoricPayments([...historicPayments, { amount:'', method:'MoMo', paid_at:'' }])}
                      className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer transition-colors">+ Add Payment</button>
                  </div>
                  {historicPayments.map((p, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
                      <input type="number" value={p.amount} onChange={e => { const u = [...historicPayments]; u[idx].amount = e.target.value; setHistoricPayments(u) }} className={inputCls} placeholder="Amount" />
                      <select value={p.method} onChange={e => { const u = [...historicPayments]; u[idx].method = e.target.value; setHistoricPayments(u) }} className={inputCls}>
                        <option>MoMo</option><option>Bank Transfer</option><option>Cash</option><option>Cheque</option>
                      </select>
                      <input type="date" value={p.paid_at} onChange={e => { const u = [...historicPayments]; u[idx].paid_at = e.target.value; setHistoricPayments(u) }} className={inputCls} />
                      <button type="button" onClick={() => setHistoricPayments(historicPayments.filter((_, j) => j !== idx))} className="text-red-400 hover:text-red-300 text-xs cursor-pointer">Remove</button>
                    </div>
                  ))}
                  {historicPayments.length === 0 && <p className="text-[10px] text-neutral-700">No payments recorded yet.</p>}
                </div>
              </div>

              <FormButton busy={busyHistoric} busyText="Saving..." className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
                Add Historic Client
              </FormButton>
            </form>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-3 rounded-xl text-sm max-w-md backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => adminActions.clearError()} className="text-red-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {/* Call Guide Overlay */}
      {callGuideClient && (
        <CallGuide client={callGuideClient} onClose={() => setCallGuideClient(null)} />
      )}
    </div>
  )
}
