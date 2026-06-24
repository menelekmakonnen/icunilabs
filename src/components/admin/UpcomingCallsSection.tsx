import { useEffect, useMemo, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { PhoneCall, Clock, AlertTriangle, Check, CalendarClock, ArrowUpRight, RotateCcw, Search } from 'lucide-react'

const inputCls = 'px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-[#00bfff]'

const OUTCOME_LABELS: Record<string, string> = {
  callback_scheduled: 'Callback', needs_follow_up: 'Follow-Up', meeting_booked: 'Meeting',
  interested_will_revert: 'Interested', warm_lead: 'Warm Lead',
}
const OUTCOME_COLORS: Record<string, string> = {
  callback_scheduled: '#00bfff', needs_follow_up: '#f59e0b', meeting_booked: '#22c55e',
  interested_will_revert: '#8b5cf6', warm_lead: '#10b981',
}

function parseDue(s: any): { date: string; time: string; ts: number } {
  const raw = String(s || '')
  const datePart = raw.split(' at ')[0].split('T')[0].trim()
  const timePart = raw.split(' at ')[1] || ''
  const time = timePart ? timePart.trim().slice(0, 5) : ''
  let ts = 0
  try { ts = new Date(datePart + (time ? `T${time}` : 'T09:00')).getTime() } catch { ts = 0 }
  return { date: datePart, time, ts }
}
function fmtTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':'); const hr = parseInt(h)
  if (isNaN(hr)) return t
  return `${hr % 12 || 12}:${m || '00'} ${hr >= 12 ? 'PM' : 'AM'}`
}
function fmtDate(ds: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) return ds || 'No date'
  try { return new Date(ds + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) } catch { return ds }
}

export default function UpcomingCallsSection() {
  const { callFollowUpSLA, clients, user } = useAdminStore()
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<'mine' | 'all'>('mine')
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [rDate, setRDate] = useState('')
  const [rTime, setRTime] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = async () => { setLoading(true); await adminActions.loadCallFollowUpSLA(); setLoading(false) }
  useEffect(() => { adminActions.loadClients(); refresh() }, [])

  const clientMap = useMemo(() => {
    const m: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { m[c.client_id] = c })
    return m
  }, [clients])

  const items = useMemo(() => {
    const now = Date.now()
    return (callFollowUpSLA || [])
      .filter((s: any) => s.status === 'active' || s.status === 'postponed')
      .filter((s: any) => scope === 'all' || s.caller_email === user?.email)
      .map((s: any) => {
        const due = parseDue(s.postponed_until || s.due_date)
        const cl = clientMap[s.client_id] || {}
        return {
          ...s,
          _due: due,
          _overdue: due.ts > 0 && due.ts < now,
          _company: cl.company || '',
          _name: cl.name || s.client_name || 'Unknown',
          _client: cl,
        }
      })
      .filter((s: any) => {
        if (!search) return true
        const q = search.toLowerCase()
        return [s._name, s._company, s.outcome, s.caller_name].some(v => String(v ?? '').toLowerCase().includes(q))
      })
      .sort((a: any, b: any) => (a._due.ts || Infinity) - (b._due.ts || Infinity))
  }, [callFollowUpSLA, clientMap, scope, user, search])

  const buckets = useMemo(() => {
    const now = new Date()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime()
    const weekEnd = todayEnd + 6 * 86400000
    const out: { key: string; label: string; color: string; items: any[] }[] = [
      { key: 'overdue', label: 'Overdue', color: '#ef4444', items: [] },
      { key: 'today', label: 'Today', color: '#ff7a00', items: [] },
      { key: 'week', label: 'This Week', color: '#00bfff', items: [] },
      { key: 'later', label: 'Later', color: '#8b5cf6', items: [] },
    ]
    items.forEach((s: any) => {
      const ts = s._due.ts
      if (s._overdue || ts === 0) out[0].items.push(s)
      else if (ts <= todayEnd) out[1].items.push(s)
      else if (ts <= weekEnd) out[2].items.push(s)
      else out[3].items.push(s)
    })
    return out.filter(b => b.items.length > 0)
  }, [items])

  const stats = useMemo(() => ({
    total: items.length,
    overdue: items.filter((s: any) => s._overdue || s._due.ts === 0).length,
    today: items.filter((s: any) => { const e = new Date(); const end = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59).getTime(); return !s._overdue && s._due.ts > 0 && s._due.ts <= end }).length,
  }), [items])

  const openClient = (cl: any) => { if (cl?.client_id) { adminActions.setActiveClientOptimistic(cl); adminActions.setSection('clients') } }

  const doReschedule = async (s: any) => {
    if (!rDate) return
    setBusyId(s.sla_id)
    try {
      const due = rTime ? `${rDate} at ${rTime}` : rDate
      await adminActions.postponeFollowUp(s.sla_id, due)
      setRescheduleId(null); setRDate(''); setRTime('')
    } finally {
      setBusyId(null)
    }
  }
  const doComplete = async (s: any) => {
    setBusyId(s.sla_id)
    try {
      await adminActions.completeFollowUp(s.sla_id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ff7a00]/10 border border-[#ff7a00]/20 flex items-center justify-center"><PhoneCall className="w-5 h-5 text-[#ff7a00]" /></div>
          <div>
            <h2 className="text-lg font-bold text-white">Upcoming Calls</h2>
            <p className="text-[11px] text-neutral-500">Your callback &amp; follow-up queue — reschedule, complete, or jump in.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-900/60 border border-neutral-800 rounded-lg overflow-hidden">
            {(['mine', 'all'] as const).map(v => (
              <button key={v} onClick={() => setScope(v)} className={`px-3 py-1.5 text-xs font-bold capitalize cursor-pointer transition-all ${scope === v ? 'bg-[#ff7a00]/20 text-[#ff7a00]' : 'text-neutral-500 hover:text-white'}`}>{v === 'mine' ? 'Mine' : 'All'}</button>
            ))}
          </div>
          <button onClick={refresh} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 hover:text-white cursor-pointer transition-all disabled:opacity-50"><RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[{ label: 'Upcoming', value: stats.total, color: '#00bfff' }, { label: 'Overdue', value: stats.overdue, color: '#ef4444' }, { label: 'Today', value: stats.today, color: '#ff7a00' }].map((s, i) => (
          <div key={i} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search calls…" className="w-full pl-9 pr-3 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#00bfff]" />
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-neutral-600 text-center py-12">Loading…</p>
      ) : buckets.length === 0 ? (
        <div className="text-center py-16">
          <Check className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">No upcoming calls{scope === 'mine' ? ' for you' : ''} — all caught up.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {buckets.map(bucket => (
            <div key={bucket.key}>
              <div className="flex items-center gap-2 mb-2">
                {bucket.key === 'overdue' ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: bucket.color }} /> : <Clock className="w-3.5 h-3.5" style={{ color: bucket.color }} />}
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: bucket.color }}>{bucket.label}</h3>
                <span className="text-[10px] text-neutral-600">{bucket.items.length}</span>
              </div>
              <div className="space-y-2">
                {bucket.items.map((s: any) => (
                  <div key={s.sla_id} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3" style={s._overdue ? { borderColor: 'rgba(239,68,68,0.25)' } : undefined}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{s._name}</p>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0" style={{ color: OUTCOME_COLORS[s.outcome] || '#64748b', background: `${OUTCOME_COLORS[s.outcome] || '#64748b'}15` }}>{OUTCOME_LABELS[s.outcome] || s.outcome}</span>
                        </div>
                        {s._company && <p className="text-[11px] text-neutral-500 truncate">{s._company}</p>}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                          <span className="flex items-center gap-1" style={{ color: s._overdue ? '#ef4444' : '#94a3b8' }}><CalendarClock className="w-3 h-3" /> {fmtDate(s._due.date)}{s._due.time ? ` · ${fmtTime12(s._due.time)}` : ''}</span>
                          {scope === 'all' && s.caller_name && <span className="text-neutral-600">· {s.caller_name}</span>}
                          {s.status === 'postponed' && <span className="text-amber-500/70">· rescheduled</span>}
                        </div>
                      </div>
                      <button onClick={() => openClient(s._client)} title="Open client / start call" className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#00bfff]/10 text-[#00bfff] rounded-lg text-[10px] font-bold cursor-pointer hover:bg-[#00bfff]/20 transition-all"><PhoneCall className="w-3 h-3" /> Call</button>
                    </div>
                    {rescheduleId === s.sla_id ? (
                      <div className="flex flex-wrap items-end gap-2 mt-2.5 pt-2.5 border-t border-neutral-800">
                        <div><label className="text-[9px] text-neutral-500 uppercase block mb-0.5">Date</label><input type="date" value={rDate} onChange={e => setRDate(e.target.value)} className={inputCls} /></div>
                        <div><label className="text-[9px] text-neutral-500 uppercase block mb-0.5">Time</label><input type="time" value={rTime} onChange={e => setRTime(e.target.value)} className={inputCls} /></div>
                        <button onClick={() => doReschedule(s)} disabled={busyId === s.sla_id || !rDate} className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-40">Save</button>
                        <button onClick={() => setRescheduleId(null)} className="px-2 py-1.5 text-xs text-neutral-500 hover:text-white cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-neutral-800">
                        <button onClick={() => { setRescheduleId(s.sla_id); setRDate(s._due.date || ''); setRTime(s._due.time || '') }} className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 cursor-pointer transition-colors"><CalendarClock className="w-3.5 h-3.5" /> Reschedule</button>
                        <button onClick={() => doComplete(s)} disabled={busyId === s.sla_id} className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 cursor-pointer transition-colors disabled:opacity-40"><Check className="w-3.5 h-3.5" /> Mark done</button>
                        <button onClick={() => openClient(s._client)} className="ml-auto flex items-center gap-0.5 text-[11px] text-neutral-500 hover:text-[#00bfff] cursor-pointer transition-colors">Open client <ArrowUpRight className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
