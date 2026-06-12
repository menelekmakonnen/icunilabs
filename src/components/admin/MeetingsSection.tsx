import { useEffect, useState, useMemo } from 'react'
import { resolveStaffName } from '../../utils/resolveStaffName'
import { useAdminStore, adminActions, useEffectiveUser } from '../../store/useAdminStore'
import { Calendar, Clock, MapPin, Video, Users, Plus, X, Send, Check, ChevronRight, Trash2, FileText, ArrowLeft, Mail, RotateCcw, Ban } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './meetings.css'

const inputCls = 'w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] text-sm'
const modalBg = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
const modalCard = 'bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl'

const STAGES = [
  { id: 'booked', label: 'Booked', color: '#00bfff' },
  { id: 'confirmed', label: 'Confirmed', color: '#8b5cf6' },
  { id: 'prep', label: 'Prep', color: '#a855f7' },
  { id: 'on_day', label: 'On-Day', color: '#ff7a00' },
  { id: 'post_meeting', label: 'Post-Meeting', color: '#f59e0b' },
  { id: 'qualified', label: 'Qualified', color: '#22c55e' },
] as const

const FOUNDER_EMAIL = 'menelek@icuni.org'
const FOUNDER_NAME = 'Menelek Makonnen'

function fmtDate(d: string) {
  if (!d) return '—'
  try {
    const clean = d.split(' at ')[0].split('T')[0].trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return d
    return new Date(clean + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return d }
}
function fmtTime(t: string) {
  if (!t) return ''
  try {
    const raw = String(t).trim()
    // Google Sheets may return a full ISO date for time-only cells
    // e.g. "1899-12-30T14:00:00.000Z" or "Sat Dec 30 1899 14:00:00 GMT..."
    if (raw.includes('T') || raw.includes('1899') || raw.includes('GMT')) {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) {
        const hr = d.getHours()
        const mn = String(d.getMinutes()).padStart(2, '0')
        return `${hr > 12 ? hr - 12 : hr || 12}:${mn} ${hr >= 12 ? 'PM' : 'AM'}`
      }
    }
    const [h, m] = raw.split(':')
    const hr = parseInt(h)
    if (isNaN(hr)) return raw
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
  } catch { return String(t) }
}

function getInitials(name: string) {
  return (name || '').replace(/[^a-zA-Z\s]/g, '').trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '•'
}
const COLORS = ['#00bfff','#8b5cf6','#ff7a00','#10b981','#ef4444','#f59e0b','#ec4899','#06b6d4']

// Normalize time to HH:MM for <input type="time">
function normalizeTime(t: any): string {
  if (!t) return ''
  const s = String(t).trim()
  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}/.test(s)) return s.slice(0, 5)
  // ISO date or Sheets date object ("1899-12-30T14:00:00")
  if (s.includes('T') || s.includes('1899') || s.includes('GMT')) {
    try {
      const d = new Date(s)
      if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    } catch { /* ignored */ }
  }
  return s
}
function getColor(name: string) { let h = 0; for (let i = 0; i < (name||'').length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }

export default function MeetingsSection() {
  const { meetings, clients, users, callLogs } = useAdminStore()
  const effectiveUser = useEffectiveUser()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'calendar'>('pipeline')
  const [activeMeeting, setActiveMeeting] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  // Sort preference (persisted)
  type SortKey = 'default' | 'meeting_date' | 'date_called' | 'company' | 'contact'
  const SORT_OPTIONS: { id: SortKey; label: string }[] = [
    { id: 'default', label: 'Default' },
    { id: 'meeting_date', label: 'Meeting Date' },
    { id: 'date_called', label: 'Date Called' },
    { id: 'company', label: 'Company' },
    { id: 'contact', label: 'Contact Name' },
  ]
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    try { return (localStorage.getItem('icuni_mtg_sort') as SortKey) || 'default' } catch { return 'default' }
  })
  useEffect(() => { try { localStorage.setItem('icuni_mtg_sort', sortKey) } catch { /* ignored */ } }, [sortKey])

  useEffect(() => {
    adminActions.loadMeetings()
    adminActions.loadClients()
    adminActions.loadUsers()
    // Only load recent call logs for inferred meetings if not already loaded
    if (!callLogs || callLogs.length === 0) {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
      adminActions.loadCallLogs({ page_size: 50, from_date: weekAgo })
    }
  }, [])

  // Build client lookup
  const clientMap = useMemo(() => {
    const m: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { m[c.client_id] = c })
    return m
  }, [clients])

  // Derive "inferred" meetings from call logs with outcome=meeting_booked
  // that don't have a formal meeting entry
  const inferredMeetings = useMemo(() => {
    const formalClientIds = new Set((meetings || []).map((m: any) => m.client_id))
    const weekAgo = Date.now() - 7 * 86400000
    const seenClients = new Set<string>() // deduplicate multiple calls for same client
    return (callLogs || [])
      .filter((l: any) =>
        l.outcome === 'meeting_booked' &&
        !formalClientIds.has(l.client_id) &&
        new Date(l.call_start || l.created_at || 0).getTime() >= weekAgo
      )
      .sort((a: any, b: any) => new Date(b.call_start || b.created_at || 0).getTime() - new Date(a.call_start || a.created_at || 0).getTime()) // newest first
      .filter((l: any) => {
        // Only keep the most recent call per client
        if (seenClients.has(l.client_id)) return false
        seenClients.add(l.client_id)
        return true
      })
      .map((l: any) => {
        const client = clientMap[l.client_id] || {}
        const rawDate = l.next_action_date || ''
        let parsedDate = ''
        let parsedTime = ''
        if (rawDate.includes(' at ')) {
          const parts = rawDate.split(' at ')
          parsedDate = parts[0].trim()
          parsedTime = parts[1]?.trim() || ''
        } else {
          parsedDate = rawDate.split('T')[0] || ''
        }
        return {
          meeting_id: `call-${l.call_id}`,
          client_id: l.client_id,
          client_name: client.name || l.client_name || 'Unknown',
          client_company: client.company || l.client_company || '',
          date: parsedDate,
          time: parsedTime,
          type: 'online',
          location_or_link: '',
          booked_by: l.caller_email || '',
          stage: 'booked',
          _inferred: true, // flag so we know it's from a call log
          attendees: [],
          created_at: l.call_start || l.created_at,
        }
      })
  }, [callLogs, meetings, clientMap])

  // Group meetings by stage (including inferred) — exclude regressed/cancelled, deduplicate by meeting_id
  const allMeetings = useMemo(() => {
    const combined = [...(meetings || []), ...inferredMeetings]
    const seen = new Set<string>()
    return combined
      .filter((m: any) => m.stage !== 'regressed' && m.stage !== 'cancelled')
      .filter((m: any) => {
        const key = m.meeting_id || m.client_id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [meetings, inferredMeetings])

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    STAGES.forEach(s => { map[s.id] = [] })
    allMeetings.forEach((m: any) => {
      const stage = m.stage || 'booked'
      if (map[stage]) map[stage].push(m)
      else map.booked.push(m)
    })
    // Apply sort to each column
    const sortFn = (a: any, b: any): number => {
      switch (sortKey) {
        case 'meeting_date': {
          const da = a.date ? new Date(a.date).getTime() : Infinity
          const db = b.date ? new Date(b.date).getTime() : Infinity
          return da - db // soonest first
        }
        case 'date_called': {
          const ca = new Date(a.created_at || 0).getTime()
          const cb = new Date(b.created_at || 0).getTime()
          return cb - ca // newest first
        }
        case 'company': {
          const compA = (a.client_company || '').toLowerCase()
          const compB = (b.client_company || '').toLowerCase()
          return compA.localeCompare(compB)
        }
        case 'contact': {
          const nameA = (a.client_name || a.contact_name || '').toLowerCase()
          const nameB = (b.client_name || b.contact_name || '').toLowerCase()
          return nameA.localeCompare(nameB)
        }
        default:
          return 0 // preserve insertion order
      }
    }
    if (sortKey !== 'default') {
      Object.keys(map).forEach(k => map[k].sort(sortFn))
    }
    return map
  }, [allMeetings, sortKey])


  // ─── CREATE MEETING MODAL ───
  const [form, setForm] = useState({ client_id: '', client_email: '', date: '', time: '', type: 'online' as 'online' | 'in_person', location_or_link: '', attendees: [] as { name: string; email: string; role: string }[] })

  const openCreate = () => {
    // Pre-populate with founder
    const founderUser = (users || []).find((u: any) => u.email === FOUNDER_EMAIL)
    const defaultAttendees = [
      { name: founderUser?.name || FOUNDER_NAME, email: FOUNDER_EMAIL, role: 'Founder' },
      ...((users || []).filter((u: any) => u.role === 'Product' && u.email !== FOUNDER_EMAIL).slice(0, 1).map((u: any) => ({ name: u.name, email: u.email, role: 'Developer' })))
    ]
    setForm({ client_id: '', client_email: '', date: '', time: '', type: 'online', location_or_link: '', attendees: defaultAttendees })
    setShowCreate(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.date || !form.time) return
    setBusy(true)
    await adminActions.createMeeting(form)
    setBusy(false)
    setShowCreate(false)
  }

  const addAttendee = () => setForm(f => ({ ...f, attendees: [...f.attendees, { name: '', email: '', role: '' }] }))
  const removeAttendee = (i: number) => setForm(f => ({ ...f, attendees: f.attendees.filter((_, idx) => idx !== i) }))
  const updateAttendee = (i: number, field: string, val: string) => {
    setForm(f => {
      const att = [...f.attendees]
      att[i] = { ...att[i], [field]: val }
      return { ...f, attendees: att }
    })
  }
  const selectTeamMember = (i: number, email: string) => {
    const u = (users || []).find((u: any) => u.email === email)
    if (u) updateAttendee(i, 'name', u.name)
    updateAttendee(i, 'email', email)
  }

  // Auto-fill email when client is selected in create form
  const handleClientSelect = (clientId: string) => {
    const c = clientMap[clientId]
    setForm(f => ({ ...f, client_id: clientId, client_email: c?.email || c?.contact_email || '' }))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Meetings</h2>
          <div className="flex items-center gap-1 mt-2">
            <button onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                activeTab === 'pipeline' ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20' : 'text-neutral-500 hover:text-white border border-transparent'
              }`}>Pipeline</button>
            <button onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                activeTab === 'calendar' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20' : 'text-neutral-500 hover:text-white border border-transparent'
              }`}>Calendar Sync</button>
          </div>
        </div>
        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Sort</span>
              <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                className="bg-neutral-900/80 border border-neutral-700/50 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer focus:border-[#00bfff]/40 focus:outline-none transition-colors">
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <button onClick={openCreate} className="mtg-btn mtg-btn--primary">
              <Plus className="w-4 h-4" /> Book Meeting
            </button>
          </div>
        )}
      </div>

      {/* ═══ PIPELINE TAB ═══ */}
      {activeTab === 'pipeline' && (
        <>
      {/* Kanban Board */}
      <div className="mtg-board">
        {STAGES.map(stage => (
          <div key={stage.id} className="mtg-column">
            <div className="mtg-col-header">
              <div className="flex items-center">
                <div className="mtg-col-header__dot" style={{ background: stage.color }} />
                <span className="mtg-col-header__label">{stage.label}</span>
              </div>
              <span className="mtg-col-header__count">{grouped[stage.id]?.length || 0}</span>
            </div>
            <div className="mtg-col-body">
              <AnimatePresence>
                {(grouped[stage.id] || []).map((m: any) => {
                  const mClient = clientMap[m.client_id]
                  const mEmail = m.client_email || mClient?.email || mClient?.contact_email || ''
                  return (
                  <motion.div key={m.meeting_id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="mtg-card" onClick={() => setActiveMeeting(m)}>
                    {m.attendance && m.attendance !== 'pending' && <div className={`mtg-card__attendance mtg-card__attendance--${m.attendance}`} />}
                    {m._inferred && <div className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mb-1.5 w-fit uppercase tracking-wider">From Call</div>}
                    <div className="mtg-card__client">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                        style={{ background: `${getColor(m.client_name || '')}20`, color: getColor(m.client_name || '') }}>
                        {getInitials(m.client_name || '').charAt(0)}
                      </div>
                      {m.client_name || 'Unknown'}
                    </div>
                    {m.client_company && <div className="mtg-card__company">{m.client_company}</div>}
                    {mEmail && (
                      <div className="mtg-card__row" style={{ color: '#8b5cf6' }}>
                        <Mail className="w-3 h-3" /> <span className="truncate text-[10px]">{mEmail}</span>
                      </div>
                    )}
                    <div className="mtg-card__row">
                      <Calendar /> {m.date ? fmtDate(m.date) : <span className="text-neutral-600 italic">TBD</span>}
                    </div>
                    <div className="mtg-card__row">
                      <Clock /> {m.time ? fmtTime(m.time) : <span className="text-neutral-600 italic">TBD</span>}
                    </div>
                    <div className="mt-2">
                      <span className={`mtg-card__type mtg-card__type--${m.type}`}>
                        {m.type === 'online' ? <><Video className="w-3 h-3" /> Online</> : <><MapPin className="w-3 h-3" /> In-Person</>}
                      </span>
                    </div>
                    <div className="mtg-card__booker">
                      Booked by {resolveStaffName(m.booked_by || '')}
                    </div>
                  </motion.div>
                  )
                })}
              </AnimatePresence>
              {(!grouped[stage.id] || grouped[stage.id].length === 0) && (
                <div className="mtg-empty">
                  <Calendar />
                  <span>No meetings</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {activeMeeting && (
          <MeetingDrawer meeting={activeMeeting} onClose={() => setActiveMeeting(null)} users={users} effectiveUser={effectiveUser} clientMap={clientMap} />
        )}
      </AnimatePresence>
        </>
      )}

      {/* ═══ CALENDAR SYNC TAB ═══ */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google Calendar Integration</h3>
                <p className="text-[10px] text-neutral-500">Sync confirmed meetings with the ICUNI Labs team calendar</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-neutral-300 flex-1">Connected to ICUNI Labs shared calendar</span>
                <span className="text-[10px] text-emerald-400 font-bold">Active</span>
              </div>

              <div className="p-4 rounded-xl bg-[#00bfff]/5 border border-[#00bfff]/10">
                <p className="text-xs text-[#00bfff] font-bold mb-2">How it works</p>
                <ul className="space-y-2">
                  <li className="text-xs text-neutral-400 flex items-start gap-2">
                    <span className="text-[#00bfff] font-bold mt-0.5">1.</span>
                    When a salesperson books a meeting on a call, it's added to the <strong className="text-white">ICUNI Labs calendar only</strong>.
                  </li>
                  <li className="text-xs text-neutral-400 flex items-start gap-2">
                    <span className="text-[#00bfff] font-bold mt-0.5">2.</span>
                    When the meeting moves to <strong className="text-white">Confirmed</strong>, an invite is sent to <strong className="text-white">both parties</strong>.
                  </li>
                  <li className="text-xs text-neutral-400 flex items-start gap-2">
                    <span className="text-[#00bfff] font-bold mt-0.5">3.</span>
                    For online meetings, a <strong className="text-white">Google Meet link</strong> is auto-created and sent to everyone.
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">In-Person Slots</p>
                  <p className="text-xs text-white font-bold">11:30 AM — 5:00 PM</p>
                </div>
                <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Online Slots</p>
                  <p className="text-xs text-white font-bold">11:00 AM — 3:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreate && (
        <div className={modalBg} onClick={() => setShowCreate(false)}>
          <div className={modalCard + ' max-w-xl'} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Book a Meeting</h3>
              <button onClick={() => setShowCreate(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {/* Client */}
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Client *</label>
                <select value={form.client_id} onChange={e => handleClientSelect(e.target.value)} className={inputCls} required>
                  <option value="">— Select client —</option>
                  {(clients || []).filter((c: any) => c.status !== 'deleted').map((c: any) => (
                    <option key={c.client_id} value={c.client_id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </div>
              {/* Client Email */}
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Client Email <span className="text-neutral-600">(optional)</span></label>
                <input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} className={inputCls}
                  placeholder="client@example.com" />
              </div>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} required />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Time *</label>
                  <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={inputCls} required />
                </div>
              </div>
              {/* Type & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className={inputCls}>
                    <option value="online">Online</option>
                    <option value="in_person">In-Person</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">{form.type === 'online' ? 'Meeting Link' : 'Location'}</label>
                  <input value={form.location_or_link} onChange={e => setForm({ ...form, location_or_link: e.target.value })} className={inputCls}
                    placeholder={form.type === 'online' ? 'https://meet.google.com/...' : 'Office address'} />
                </div>
              </div>
              {/* Attendees */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-neutral-500">Attendees</label>
                  <button type="button" onClick={addAttendee} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer">+ Add</button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {form.attendees.map((att, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select value={att.email} onChange={e => selectTeamMember(i, e.target.value)} className={inputCls + ' flex-1'}>
                        <option value="">— Team member —</option>
                        {(users || []).filter((u: any) => u.status === 'Active').map((u: any) => (
                          <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <input value={att.role} onChange={e => updateAttendee(i, 'role', e.target.value)} className={inputCls + ' w-24'} placeholder="Role" />
                      <button type="button" onClick={() => removeAttendee(i)} className="text-neutral-600 hover:text-red-400 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={busy} className="mtg-btn mtg-btn--primary w-full justify-center">
                {busy ? 'Booking...' : 'Book Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════
// THANK YOU EMAIL SECTION (used inside MeetingDrawer)
// ════════════════════════════════════════════════════════
const inputClsTy = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-violet-400/40 focus:ring-1 focus:ring-violet-400/20 focus:outline-none transition-all"

function ThankYouSection({ meeting, clientMap, busy: parentBusy, setBusy, setSyncWarning }: {
  meeting: any; clientMap: Record<string, any>; busy: boolean;
  setBusy: (b: boolean) => void; setSyncWarning: (w: string | null) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [summary, setSummary] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const client = clientMap?.[meeting.client_id]
  const clientEmail = meeting.client_email || client?.email || client?.contact_email || ''
  const clientName = meeting.client_name || client?.name || 'Client'

  // Format meeting date for the email
  const fmtDate = (d: string) => {
    if (!d) return ''
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  const handleSend = async () => {
    if (!clientEmail) {
      setSyncWarning('No email address for this client. Cannot send thank you.')
      return
    }
    setSending(true)
    setBusy(true)
    try {
      const ok = await adminActions.sendClientEmail(
        'post_meeting_thankyou',
        clientEmail,
        clientName,
        {
          meetingDate: fmtDate(meeting.date) || 'our recent meeting',
          summary: summary.trim() || undefined,
          nextSteps: nextSteps.trim() || undefined
        }
      )
      if (ok) {
        setSent(true)
      } else {
        setSyncWarning('Thank you email failed to send. Please try again or use Mail Hub.')
      }
    } catch {
      setSyncWarning('Thank you email failed to send.')
    }
    setSending(false)
    setBusy(false)
  }

  if (sent) {
    return (
      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/15 mb-4">
        <p className="text-xs text-violet-400 font-bold flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> ✓ Thank You Email Sent
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">Sent to {clientEmail}</p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-violet-400 font-bold flex items-center gap-1.5">
          🙏 Send Thank You Email
        </p>
        <button onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-violet-400/70 hover:text-violet-400 cursor-pointer transition-colors">
          {expanded ? 'Collapse' : 'Customise'}
        </button>
      </div>
      <p className="text-[11px] text-neutral-500 mb-3">
        Send a branded thank you to <strong className="text-neutral-300">{clientName}</strong> ({clientEmail || 'no email'})
      </p>

      {expanded && (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1 block">Discussion Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)}
              className={inputClsTy + ' min-h-[80px]'} placeholder="What was discussed in the meeting..." />
          </div>
          <div>
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1 block">Next Steps</label>
            <textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)}
              className={inputClsTy + ' min-h-[60px]'} placeholder="1. Send proposal by Friday&#10;2. Design mockups in 2 weeks&#10;3. Follow-up call next Tuesday" />
          </div>
        </div>
      )}

      <button onClick={handleSend} disabled={parentBusy || sending || !clientEmail}
        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500/80 to-purple-500/80 text-white rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] disabled:opacity-40 transition-all">
        <Send className="w-3 h-3" />
        {sending ? 'Sending...' : expanded ? 'Send Customised Thank You' : 'Send Thank You'}
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════
// MEETING DETAIL DRAWER
// ════════════════════════════════════════════════════════
function MeetingDrawer({ meeting, onClose, users, effectiveUser, clientMap }: { meeting: any; onClose: () => void; users: any[]; effectiveUser: any; clientMap: Record<string, any> }) {
  void users; void effectiveUser
  const [m, setM] = useState(meeting)
  const [busy, setBusy] = useState(false)
  const [prepNotes, setPrepNotes] = useState(meeting.prep_notes || '')
  const [postNotes, setPostNotes] = useState(meeting.post_meeting_notes || '')
  const [editDate, setEditDate] = useState(meeting.date || '')
  const [editTime, setEditTime] = useState(normalizeTime(meeting.time))
  const [dateTimeDirty, setDateTimeDirty] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const [checklist, setChecklist] = useState<{ item: string; checked: boolean }[]>(() => {
    try { return meeting.demo_checklist?.length ? meeting.demo_checklist : [
      { item: 'Introduction & rapport', checked: false },
      { item: 'Pain point recap', checked: false },
      { item: 'Solution demo', checked: false },
      { item: 'Pricing discussion', checked: false },
      { item: 'Next steps & timeline', checked: false },
    ] } catch { return [] }
  })
  const [newCheckItem, setNewCheckItem] = useState('')
  const [showRegress, setShowRegress] = useState(false)
  const [regressTarget, setRegressTarget] = useState('contacted')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [syncWarning, setSyncWarning] = useState<string | null>(null)

  // Refresh meeting data when prop changes
  useEffect(() => {
    setM(meeting)
    setPrepNotes(meeting.prep_notes || '')
    setPostNotes(meeting.post_meeting_notes || '')
    setEditDate(meeting.date || '')
    setEditTime(normalizeTime(meeting.time))
    setDateTimeDirty(false)
    setConfirmSent(false)
    setSyncWarning(null)
    try { if (meeting.demo_checklist?.length) setChecklist(meeting.demo_checklist) } catch { /* ignored */ }
  }, [meeting])

  const stageIdx = STAGES.findIndex(s => s.id === (m.stage || 'booked'))

  const advanceStage = async (targetStage: string) => {
    setBusy(true)
    await adminActions.updateMeeting(m.meeting_id, { stage: targetStage })

    // Trigger calendar event on confirmation
    if (targetStage === 'confirmed') {
      setSyncWarning(null)
      const client = clientMap?.[m.client_id]
      const clientEmail = m.client_email || client?.email || client?.contact_email || ''
      try {
        const result = await adminActions.confirmCalendarEvent({
          meeting_id: m.meeting_id,
          client_name: m.client_name || client?.name || 'Client',
          client_email: clientEmail,
          date: editDate || m.date,
          time: editTime || m.time,
          type: m.type || 'online',
          location_or_link: m.location_or_link || '',
          event_id: m.calendar_event_id || '',
          booked_by_email: m.booked_by || '',
        })
        if (result?.meet_link) {
          // Update meeting with the Meet link
          await adminActions.updateMeeting(m.meeting_id, { location_or_link: result.meet_link, calendar_event_id: result.event_id })
          setM((prev: any) => ({ ...prev, location_or_link: result.meet_link, calendar_event_id: result.event_id, stage: targetStage }))
          setBusy(false)
          return
        }
        if (result?.event_id) {
          await adminActions.updateMeeting(m.meeting_id, { calendar_event_id: result.event_id })
        }
      } catch (e) {
        // Calendar sync is best-effort, don't block stage advancement
        console.warn('Calendar sync failed:', e)
        setSyncWarning('Google Calendar sync failed — the meeting was confirmed, but no calendar invite was created. Check the connection and try re-confirming, or create the event manually.')
      }
    }

    setM((prev: any) => ({ ...prev, stage: targetStage }))
    setBusy(false)
  }

  const saveDateTime = async () => {
    setBusy(true)
    await adminActions.updateMeeting(m.meeting_id, { date: editDate, time: editTime })
    setM((prev: any) => ({ ...prev, date: editDate, time: editTime }))
    setDateTimeDirty(false)
    await adminActions.loadMeetings() // Refresh Kanban cards
    setBusy(false)
  }

  const sendConfirmation = async () => {
    setBusy(true)
    setSyncWarning(null)
    // Always save any pending date/time changes first
    if (dateTimeDirty) {
      await adminActions.updateMeeting(m.meeting_id, { date: editDate, time: editTime })
      setM((prev: any) => ({ ...prev, date: editDate, time: editTime }))
      setDateTimeDirty(false)
    }
    // Pass full context so backend can send even for inferred meetings
    const client = clientMap?.[m.client_id]
    const clientEmail = m.client_email || client?.email || client?.contact_email || ''
    const result = await adminActions.sendMeetingConfirmation(m.meeting_id, {
      client_name: m.client_name || client?.name || 'Client',
      client_email: clientEmail,
      date: editDate || m.date,
      time: editTime || m.time,
      type: m.type || 'online',
      location_or_link: m.location_or_link || '',
      attendees: m.attendees || [],
    })
    if (result && result.email_sent === false) {
      setSyncWarning('Meeting confirmed but the confirmation email failed to send: ' + (result.email_error || 'unknown error') + '. Try sending via Mail Hub or re-confirm.')
    }
    setM((prev: any) => ({ ...prev, confirmation_sent: true }))
    setConfirmSent(true)
    await adminActions.loadMeetings() // Refresh Kanban cards
    setBusy(false)
  }

  const savePrepNotes = async () => {
    setBusy(true)
    await adminActions.updateMeeting(m.meeting_id, { prep_notes: prepNotes, demo_checklist: checklist })
    setBusy(false)
  }

  const markAttendance = async (attendance: string) => {
    setBusy(true)
    await adminActions.updateMeeting(m.meeting_id, { attendance, stage: 'post_meeting' })
    setM((prev: any) => ({ ...prev, attendance, stage: 'post_meeting' }))
    setBusy(false)
  }

  const qualify = async (result: string) => {
    setBusy(true)
    await adminActions.qualifyMeeting(m.meeting_id, result, postNotes)
    setM((prev: any) => ({ ...prev, qualification_result: result, stage: 'qualified' }))
    setBusy(false)
  }

  const savePostNotes = async () => {
    setBusy(true)
    await adminActions.updateMeeting(m.meeting_id, { post_meeting_notes: postNotes })
    setBusy(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this meeting?')) return
    setBusy(true)
    await adminActions.deleteMeeting(m.meeting_id)
    setBusy(false)
    onClose()
  }

  const handleRegress = async () => {
    if (!confirm(`Regress this meeting? The client will return to "${regressTarget}" in the pipeline.`)) return
    setBusy(true)
    await adminActions.regressMeeting(m.meeting_id, regressTarget)
    setBusy(false)
    onClose()
  }

  const handleCancel = async () => {
    if (!confirm('Cancel this meeting? This is different from regression — it marks the meeting as deliberately cancelled.')) return
    setBusy(true)
    await adminActions.cancelMeeting(m.meeting_id, cancelReason)
    setBusy(false)
    onClose()
  }

  const toggleCheckItem = (i: number) => {
    setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, checked: !item.checked } : item))
  }
  const addCheckItem = () => {
    if (!newCheckItem.trim()) return
    setChecklist(prev => [...prev, { item: newCheckItem.trim(), checked: false }])
    setNewCheckItem('')
  }

  return (
    <div className="mtg-drawer-bg" onClick={onClose}>
      <motion.div className="mtg-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mtg-drawer__header">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{m.client_name || 'Meeting'}</h3>
              <p className="text-[10px] text-neutral-600">{m.meeting_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`mtg-card__type mtg-card__type--${m.type}`}>
              {m.type === 'online' ? 'Online' : 'In-Person'}
            </span>
            <button onClick={handleDelete} className="text-neutral-600 hover:text-red-400 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Stage Bar */}
        <div className="px-5 py-3 border-b border-neutral-800/50">
          <div className="mtg-stage-bar">
            {STAGES.map((s, i, arr) => (
              <div key={s.id} className="flex items-center" style={{ flex: i < arr.length - 1 ? 1 : 0 }}>
                <div className="mtg-stage-node">
                  <div className={`mtg-stage-dot ${i === stageIdx ? 'mtg-stage-dot--active' : ''} ${i < stageIdx ? 'mtg-stage-dot--past' : ''}`}
                    style={{
                      borderColor: i <= stageIdx ? s.color : undefined,
                      background: i < stageIdx ? s.color : i === stageIdx ? `${s.color}30` : undefined,
                      boxShadow: i === stageIdx ? `0 0 8px ${s.color}40` : undefined,
                    }} />
                  <span className={`mtg-stage-label ${i === stageIdx ? 'mtg-stage-label--active' : ''}`}>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`mtg-stage-connector ${i < stageIdx ? 'mtg-stage-connector--past' : ''}`}
                    style={i < stageIdx ? { background: `linear-gradient(90deg, ${s.color}, ${arr[i + 1].color})` } : undefined} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="mtg-drawer__body">
          {/* Calendar sync warning */}
          {syncWarning && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <span className="text-xs text-amber-400 flex-1">{syncWarning}</span>
              <button onClick={() => setSyncWarning(null)} className="text-amber-400/60 hover:text-amber-400 cursor-pointer flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Client Contact Info */}
          {(() => {
            const client = clientMap?.[m.client_id]
            const email = m.client_email || client?.email || client?.contact_email || ''
            return (
              <div className="mb-4">
                <div className="mtg-field-label flex items-center gap-1.5 mb-1">
                  <Mail className="w-3 h-3 text-[#8b5cf6]" /> Client Email
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    defaultValue={email}
                    placeholder="Enter client email…"
                    className={inputCls + ' text-xs flex-1'}
                    onBlur={async (e) => {
                      const newEmail = e.target.value.trim()
                      if (newEmail && newEmail !== email) {
                        setBusy(true)
                        // Save to meeting
                        await adminActions.updateMeeting(m.meeting_id, { client_email: newEmail })
                        // Also update the client record if this client exists
                        if (m.client_id && !m.client_id.startsWith('call-')) {
                          await adminActions.updateClient(m.client_id, { email: newEmail })
                        }
                        setM((prev: any) => ({ ...prev, client_email: newEmail }))
                        setBusy(false)
                      }
                    }}
                  />
                  {email && (
                    <a href={`mailto:${email}`} className="px-2 py-1.5 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-colors flex items-center">
                      <Send className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })()}
          {/* Meeting Info — Editable Date/Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="mtg-field-group">
              <div className="mtg-field-label">Date</div>
              <input type="date" value={editDate}
                onChange={e => { setEditDate(e.target.value); setDateTimeDirty(true) }}
                className={inputCls + ' text-xs'} />
            </div>
            <div className="mtg-field-group">
              <div className="mtg-field-label">Time</div>
              <input type="time" value={editTime}
                onChange={e => { setEditTime(e.target.value); setDateTimeDirty(true) }}
                className={inputCls + ' text-xs'} />
            </div>
            <div className="mtg-field-group">
              <div className="mtg-field-label">Type</div>
              <div className="flex gap-1.5">
                <button onClick={async () => { await adminActions.updateMeeting(m.meeting_id, { type: 'online' }); setM((p: any) => ({ ...p, type: 'online' })) }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    m.type === 'online' ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20' : 'bg-neutral-900/50 text-neutral-500 border border-neutral-800 hover:text-white'
                  }`}><Video className="w-3 h-3" /> Online</button>
                <button onClick={async () => { await adminActions.updateMeeting(m.meeting_id, { type: 'in_person' }); setM((p: any) => ({ ...p, type: 'in_person' })) }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                    m.type === 'in_person' ? 'bg-[#ff7a00]/10 text-[#ff7a00] border border-[#ff7a00]/20' : 'bg-neutral-900/50 text-neutral-500 border border-neutral-800 hover:text-white'
                  }`}><MapPin className="w-3 h-3" /> In-Person</button>
              </div>
            </div>
            <div className="mtg-field-group">
              <div className="mtg-field-label">{m.type === 'online' ? 'Meeting Link' : 'Address'}</div>
              <div className="mtg-field-value">
                {m.location_or_link
                  ? m.type === 'online'
                    ? <a href={m.location_or_link} target="_blank" rel="noreferrer" className="text-[#00bfff] hover:underline text-xs break-all">{m.location_or_link}</a>
                    : <span className="text-xs">{m.location_or_link}</span>
                  : <span className="text-neutral-600 text-xs italic">Not set</span>}
              </div>
            </div>
            <div className="mtg-field-group">
              <div className="mtg-field-label">Booked By</div>
              <div className="mtg-field-value text-xs">{resolveStaffName(m.booked_by || '')}</div>
            </div>
          </div>

          {/* Save date/time + Send Confirmation */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {dateTimeDirty && (
              <button onClick={saveDateTime} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs">
                {busy ? 'Saving...' : 'Save Date/Time'}
              </button>
            )}
            <button onClick={sendConfirmation} disabled={busy || (!editDate && !editTime)} className="mtg-btn mtg-btn--primary text-xs">
              <Send className="w-3.5 h-3.5" /> {busy ? 'Sending...' : confirmSent || m.confirmation_sent
                ? 'Resend Confirmation'
                : dateTimeDirty
                  ? 'Update & Send Email'
                  : 'Send Confirmation Email'}
            </button>
            {(confirmSent || m.confirmation_sent) && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Sent from labs@icuni.org</span>
            )}
          </div>

          {/* Attendees */}
          <div className="mtg-field-group mb-6">
            <div className="mtg-field-label flex items-center gap-2"><Users className="w-3 h-3" /> Attendees</div>
            <div className="space-y-1.5">
              {(m.attendees || []).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-neutral-900/50">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ background: `${getColor(a.name)}15`, color: getColor(a.name) }}>
                    {getInitials(a.name).charAt(0)}
                  </div>
                  <span className="text-xs text-white font-medium flex-1">{a.name || a.email}</span>
                  {a.role && <span className="text-[10px] text-neutral-500">{a.role}</span>}
                </div>
              ))}
              {(!m.attendees || m.attendees.length === 0) && <p className="text-xs text-neutral-600 italic">No attendees set</p>}
            </div>
          </div>

          {/* ── STAGE-SPECIFIC CONTENT ── */}

          {/* BOOKED: Advance to confirmed */}
          {m.stage === 'booked' && (
            <div className="p-4 rounded-xl bg-[#00bfff]/5 border border-[#00bfff]/10 mb-4">
              <p className="text-xs text-[#00bfff] font-bold mb-2">Next Step</p>
              <p className="text-xs text-neutral-400 mb-3">Once confirmed with the client, advance this meeting to the next stage.</p>
              <button onClick={() => advanceStage('confirmed')} disabled={busy} className="mtg-btn mtg-btn--primary text-xs">
                Mark as Confirmed
              </button>
            </div>
          )}

          {/* CONFIRMED: Prep notes + checklist */}
          {(m.stage === 'confirmed' || m.stage === 'prep') && (
            <>
              <div className="mtg-field-group mb-4">
                <div className="mtg-field-label flex items-center gap-2"><FileText className="w-3 h-3" /> Prep Notes</div>
                <textarea value={prepNotes} onChange={e => setPrepNotes(e.target.value)} className={inputCls + ' min-h-[100px]'} placeholder="Meeting prep notes, talking points, background research..." />
              </div>
              <div className="mtg-field-group mb-4">
                <div className="mtg-field-label mb-2">Demo Checklist</div>
                <ul className="mtg-checklist">
                  {checklist.map((item, i) => (
                    <li key={i}>
                      <div className={`mtg-check ${item.checked ? 'mtg-check--checked' : ''}`} onClick={() => toggleCheckItem(i)}>
                        {item.checked && <Check />}
                      </div>
                      <span className={item.checked ? 'line-through opacity-50' : ''}>{item.item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 mt-2">
                  <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                    className={inputCls + ' text-xs'} placeholder="+ Add checklist item" />
                  <button onClick={addCheckItem} className="text-xs text-[#00bfff] hover:text-white cursor-pointer whitespace-nowrap">Add</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={savePrepNotes} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs">
                  {busy ? 'Saving...' : 'Save Prep'}
                </button>
                {m.stage === 'confirmed' && (
                  <button onClick={() => advanceStage('prep')} disabled={busy} className="mtg-btn mtg-btn--primary text-xs">
                    <ChevronRight className="w-3.5 h-3.5" /> Mark Prep Complete
                  </button>
                )}
                {m.stage === 'prep' && (
                  <button onClick={() => advanceStage('on_day')} disabled={busy} className="mtg-btn mtg-btn--primary text-xs">
                    <ChevronRight className="w-3.5 h-3.5" /> Move to On-Day
                  </button>
                )}
              </div>
            </>
          )}

          {/* ON-DAY: Mark attendance */}
          {m.stage === 'on_day' && (
            <div className="p-4 rounded-xl bg-[#ff7a00]/5 border border-[#ff7a00]/10 mb-4">
              <p className="text-xs text-[#ff7a00] font-bold mb-3">📍 Meeting Day — Mark Attendance</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => markAttendance('attended')} disabled={busy} className="mtg-btn mtg-btn--won text-xs">
                  <Check className="w-3.5 h-3.5" /> Attended
                </button>
                <button onClick={() => markAttendance('no_show')} disabled={busy} className="mtg-btn mtg-btn--danger text-xs">
                  <X className="w-3.5 h-3.5" /> No-Show
                </button>
                <button onClick={() => markAttendance('rescheduled')} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs">
                  <Calendar className="w-3.5 h-3.5" /> Rescheduled
                </button>
              </div>
            </div>
          )}

          {/* POST-MEETING: Notes + qualification */}
          {m.stage === 'post_meeting' && (
            <>
              <div className="p-3 rounded-lg bg-neutral-900/50 mb-4">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Attendance</p>
                <span className={`text-xs font-bold ${m.attendance === 'attended' ? 'text-emerald-400' : m.attendance === 'no_show' ? 'text-red-400' : 'text-amber-400'}`}>
                  {m.attendance === 'attended' ? '✓ Attended' : m.attendance === 'no_show' ? '✗ No-Show' : '↻ Rescheduled'}
                </span>
              </div>
              <div className="mtg-field-group mb-4">
                <div className="mtg-field-label">Post-Meeting Notes</div>
                <textarea value={postNotes} onChange={e => setPostNotes(e.target.value)} className={inputCls + ' min-h-[100px]'} placeholder="Meeting outcome, key takeaways, agreed next steps..." />
                <button onClick={savePostNotes} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs mt-2">
                  {busy ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Send Thank You Email */}
              {m.attendance === 'attended' && (
                <ThankYouSection meeting={m} clientMap={clientMap} busy={busy} setBusy={setBusy} setSyncWarning={setSyncWarning} />
              )}

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-emerald-400 font-bold mb-3">🎯 Qualify this Meeting</p>
                <p className="text-xs text-neutral-400 mb-3">Mark as Won to advance this client to Won stage in the pipeline.</p>
                <div className="flex gap-2">
                  <button onClick={() => qualify('won')} disabled={busy} className="mtg-btn mtg-btn--won text-xs">
                    <Check className="w-3.5 h-3.5" /> Won — Deal Closed
                  </button>
                  <button onClick={() => qualify('not_won')} disabled={busy} className="mtg-btn mtg-btn--lost text-xs">
                    <X className="w-3.5 h-3.5" /> Not Won
                  </button>
                </div>
              </div>
            </>
          )}

          {/* QUALIFIED: Show result */}
          {m.stage === 'qualified' && (
            <div className={`p-4 rounded-xl border mb-4 ${m.qualification_result === 'won' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-red-500/5 border-red-500/10'}`}>
              <p className={`text-sm font-bold mb-1 ${m.qualification_result === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.qualification_result === 'won' ? '🏆 Deal Won' : '❌ Not Won'}
              </p>
              <p className="text-xs text-neutral-400">
                {m.qualification_result === 'won'
                  ? 'This client has been advanced to Won in the pipeline.'
                  : 'This meeting did not result in a deal.'}
              </p>
              {m.post_meeting_notes && (
                <div className="mt-3 p-3 rounded-lg bg-neutral-900/50">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Post-Meeting Notes</p>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap">{m.post_meeting_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!['qualified', 'regressed', 'cancelled'].includes(m.stage) && (
          <div className="mtg-action-bar">
            <div className="flex items-center gap-2 flex-wrap">
              {m.stage === 'booked' && !m.confirmation_sent && (
                <button onClick={() => advanceStage('confirmed')} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs">
                  Skip confirmation →
                </button>
              )}

              {/* Regress */}
              {!showRegress ? (
                <button onClick={() => setShowRegress(true)} className="mtg-btn text-xs text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Regress
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <select value={regressTarget} onChange={e => setRegressTarget(e.target.value)} className={inputCls + ' text-xs w-36'}>
                    <option value="prospect">Prospect</option>
                    <option value="new_lead">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                  </select>
                  <button onClick={handleRegress} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs text-amber-400">
                    {busy ? '...' : 'Confirm'}
                  </button>
                  <button onClick={() => setShowRegress(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}

              {/* Cancel */}
              {!showCancel ? (
                <button onClick={() => setShowCancel(true)} className="mtg-btn text-xs text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 cursor-pointer">
                  <Ban className="w-3.5 h-3.5" /> Cancel Meeting
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                  <input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason (optional)" className={inputCls + ' text-xs w-40'} />
                  <button onClick={handleCancel} disabled={busy} className="mtg-btn mtg-btn--ghost text-xs text-red-400">
                    {busy ? '...' : 'Confirm Cancel'}
                  </button>
                  <button onClick={() => setShowCancel(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regressed/Cancelled status */}
        {m.stage === 'regressed' && (
          <div className="mtg-action-bar">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <p className="text-xs text-amber-400">Meeting regressed — client returned to call pipeline.</p>
            </div>
          </div>
        )}
        {m.stage === 'cancelled' && (
          <div className="mtg-action-bar">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <Ban className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400">Meeting cancelled{m.result_notes ? `: ${m.result_notes}` : ''}.</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
