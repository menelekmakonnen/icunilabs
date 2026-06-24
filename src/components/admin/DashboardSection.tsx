import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions, useEffectiveUser } from '../../store/useAdminStore'
import {
  Users, FolderOpen, FileText, AlertTriangle, TrendingUp, Flame,
  Phone, Target, Clock, Calendar, CheckCircle, BarChart3, Download,
  X, CalendarClock, ArrowUpRight, MoreHorizontal
} from 'lucide-react'

const card = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5'

// ═══════════════════════════════════════════════════════════
// ── GROWTH COMMAND CENTER  (Sales / Admin / SuperAdmin / Godmode) ──
// ═══════════════════════════════════════════════════════════

function fmtDuration(s: number) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function fmtCountdown(target: string) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return 'Now'
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const OUTCOME_COLORS: Record<string, string> = {
  meeting_booked: '#22c55e', callback_scheduled: '#00bfff',
  interested_will_revert: '#8b5cf6', no_interest: '#6b7280',
  needs_follow_up: '#f59e0b', voicemail: '#64748b', wrong_number: '#ef4444',
}
const OUTCOME_LABELS: Record<string, string> = {
  meeting_booked: 'Meeting', callback_scheduled: 'Callback',
  interested_will_revert: 'Interested', no_interest: 'No Interest',
  needs_follow_up: 'Follow-Up', voicemail: 'Voicemail', wrong_number: 'Wrong #',
}

// ── Pipeline stages (mirrors CRM) ──
const PIPELINE_STAGES = [
  { id: 'disqualified', label: 'Disqualified' },
  { id: 'prospect', label: 'Prospect' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'meeting_scheduled', label: 'Meeting' },
  { id: 'won', label: 'Won' },
]

// ═══════════════════════════════════════════════════════════
// ── UPCOMING ACTIONS CARD (with quick commands) ──────────
// ═══════════════════════════════════════════════════════════
function UpcomingActionsCard({ upcomingActions, clients, now }: { upcomingActions: any[]; clients: any[]; now: number }) {
  const [activeAction, setActiveAction] = useState<string | null>(null) // call_id of item with open menu
  const [actionMode, setActionMode] = useState<'defer' | 'stage' | null>(null)
  const [deferDate, setDeferDate] = useState('')
  const [newStage, setNewStage] = useState('')
  const [busy, setBusy] = useState(false)

  const closeMenu = () => { setActiveAction(null); setActionMode(null); setDeferDate(''); setNewStage('') }

  const handleDefer = async (l: any) => {
    if (!deferDate) return
    setBusy(true)
    try {
      await adminActions.saveCallLog({
        call_id: l.call_id,
        client_id: l.client_id,
        outcome: l.outcome,
        next_action_date: deferDate,
        next_action: l.next_action || 'Follow up',
        next_action_notes: `Deferred from ${new Date(l.next_action_date).toLocaleDateString('en-GB')}`,
      })
      await adminActions.loadCallLogs({ page_size: 500 })
    } catch { /* handled by store */ }
    setBusy(false)
    closeMenu()
  }

  const handleStageChange = async (l: any) => {
    if (!newStage || !l.client_id) return
    setBusy(true)
    try {
      await adminActions.updateClientStatus(l.client_id, newStage)
      // If moving to a stage that doesn't need a callback, clear it
      if (['disqualified', 'won'].includes(newStage)) {
        await adminActions.saveCallLog({
          call_id: l.call_id,
          client_id: l.client_id,
          outcome: newStage === 'disqualified' ? 'no_interest' : l.outcome,
          next_action_date: '',
          next_action: '',
        })
      }
      await adminActions.loadCallLogs({ page_size: 500 })
    } catch { /* handled by store */ }
    setBusy(false)
    closeMenu()
  }

  const handleDismiss = async (l: any) => {
    setBusy(true)
    try {
      await adminActions.saveCallLog({
        call_id: l.call_id,
        client_id: l.client_id,
        outcome: l.outcome,
        next_action_date: '',
        next_action: '',
        next_action_notes: 'Cleared from dashboard',
      })
      await adminActions.loadCallLogs({ page_size: 500 })
    } catch { /* handled by store */ }
    setBusy(false)
    closeMenu()
  }

  // Split into overdue vs upcoming
  const overdue = upcomingActions.filter((l: any) => new Date(l.next_action_date).getTime() < now)
  const upcoming = upcomingActions.filter((l: any) => new Date(l.next_action_date).getTime() >= now)

  const renderItem = (l: any, i: number) => {
    const clientName = clients.find((c: any) => c.client_id === l.client_id)?.name || l.client_name || l.caller_name || 'Unknown'
    const actionTime = new Date(l.next_action_date).getTime()
    const isOverdue = actionTime < now
    const isToday = new Date(l.next_action_date).toDateString() === new Date().toDateString()
    const overdueMs = isOverdue ? now - actionTime : 0
    const overdueHours = Math.floor(overdueMs / 3600000)
    const overdueDays = Math.floor(overdueHours / 24)
    const isMenuOpen = activeAction === (l.call_id || `idx-${i}`)
    const itemKey = l.call_id || `idx-${i}`

    return (
      <div key={itemKey} className="relative">
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          isOverdue
            ? 'border-amber-500/20 bg-amber-500/[0.03]'
            : isToday ? 'border-[#00bfff]/20 bg-[#00bfff]/[0.03]' : 'border-neutral-800/50 hover:border-neutral-700/50'
        }`}>
          {/* Icon */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isOverdue ? 'rgba(245,158,11,0.12)' : `${OUTCOME_COLORS[l.outcome] || '#6b7280'}12` }}>
            {isOverdue
              ? <CalendarClock className="w-4 h-4 text-amber-400" />
              : <Phone className="w-4 h-4" style={{ color: OUTCOME_COLORS[l.outcome] || '#6b7280' }} />
            }
          </div>
          {/* Info — clickable to go to client */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
            const client = clients.find((c: any) => c.client_id === l.client_id)
            if (client) adminActions.setActiveClientOptimistic(client)
            adminActions.setSection('clients')
          }}>
            <p className="text-sm font-medium text-white truncate">{clientName}</p>
            <p className="text-[10px] text-neutral-500">{OUTCOME_LABELS[l.outcome] || l.outcome} · {l.next_action || 'Follow up'}</p>
          </div>
          {/* Time info */}
          <div className="text-right flex-shrink-0 mr-1">
            {isOverdue ? (
              <p className="text-[11px] font-semibold text-amber-400">
                {overdueDays > 0 ? `${overdueDays}d` : `${overdueHours}h`} ago
              </p>
            ) : (
              <p className={`text-[11px] font-semibold ${isToday ? 'text-[#00bfff]' : 'text-neutral-400'}`}>
                {fmtCountdown(l.next_action_date)}
              </p>
            )}
            <p className="text-[9px] text-neutral-600">{new Date(l.next_action_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
          </div>
          {/* Quick actions trigger */}
          <button onClick={(e) => { e.stopPropagation(); isMenuOpen ? closeMenu() : (setActiveAction(itemKey), setActionMode(null)) }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
              isMenuOpen ? 'bg-[#00bfff]/15 text-[#00bfff]' : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'
            }`}>
            {isMenuOpen ? <X className="w-3.5 h-3.5" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── Inline action panel ── */}
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden">

            {/* Action buttons row */}
            {!actionMode && (
              <div className="flex items-center gap-1.5 p-2.5">
                <button onClick={() => { setActionMode('defer'); setDeferDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10)) }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer">
                  <CalendarClock className="w-3.5 h-3.5" /> Defer
                </button>
                <button onClick={() => { setActionMode('stage'); setNewStage('') }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-colors cursor-pointer">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Move Stage
                </button>
                <button onClick={() => handleDismiss(l)} disabled={busy}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                  <X className="w-3.5 h-3.5" /> {busy ? '...' : 'Dismiss'}
                </button>
              </div>
            )}

            {/* Defer panel */}
            {actionMode === 'defer' && (
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Reschedule callback</p>
                <div className="flex items-center gap-2">
                  <input type="date" value={deferDate} onChange={e => setDeferDate(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none" />
                  <button onClick={() => handleDefer(l)} disabled={busy || !deferDate}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors cursor-pointer disabled:opacity-50">
                    {busy ? 'Saving...' : 'Defer'}
                  </button>
                  <button onClick={() => setActionMode(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                {/* Quick presets */}
                <div className="flex gap-1.5">
                  {[
                    { label: 'Tomorrow', days: 1 },
                    { label: 'In 3 days', days: 3 },
                    { label: 'Next week', days: 7 },
                    { label: 'In 2 weeks', days: 14 },
                  ].map(p => (
                    <button key={p.label} onClick={() => setDeferDate(new Date(Date.now() + p.days * 86400000).toISOString().slice(0, 10))}
                      className="px-2 py-1 rounded text-[10px] text-neutral-400 bg-neutral-800 hover:bg-neutral-700 hover:text-white transition-colors cursor-pointer">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stage change panel */}
            {actionMode === 'stage' && (
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Move to pipeline stage</p>
                <div className="flex items-center gap-2">
                  <select value={newStage} onChange={e => setNewStage(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#8b5cf6]/50 focus:outline-none cursor-pointer">
                    <option value="">Select stage...</option>
                    {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button onClick={() => handleStageChange(l)} disabled={busy || !newStage}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#8b5cf6]/15 text-[#8b5cf6] hover:bg-[#8b5cf6]/25 transition-colors cursor-pointer disabled:opacity-50">
                    {busy ? 'Saving...' : 'Move'}
                  </button>
                  <button onClick={() => setActionMode(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00bfff]" /> Action Queue
        </h3>
        <button onClick={() => adminActions.setSection('calls')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">
          View All
        </button>
      </div>

      {upcomingActions.length === 0 ? (
        <p className="text-sm text-neutral-600 py-4 text-center">No pending callbacks or follow-ups</p>
      ) : (
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
          {/* Overdue section */}
          {overdue.length > 0 && (
            <>
              <div className="flex items-center gap-2 py-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                  Needs attention · {overdue.length}
                </span>
              </div>
              {overdue.map(renderItem)}
            </>
          )}

          {/* Upcoming section */}
          {upcoming.length > 0 && (
            <>
              {overdue.length > 0 && <div className="border-t border-neutral-800/50 my-2" />}
              <div className="flex items-center gap-2 py-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00bfff]" />
                <span className="text-[10px] font-bold text-[#00bfff]/70 uppercase tracking-wider">
                  Upcoming · {upcoming.length}
                </span>
              </div>
              {upcoming.map(renderItem)}
            </>
          )}
        </div>
      )}
    </>
  )
}

interface GrowthDashProps {
  role: string
  userEmail: string
  userName: string
}

function GrowthCommandCenter({ role, userEmail, userName }: GrowthDashProps) {
  const { callLogs, clients, meetings } = useAdminStore()
  const [_tick, setTick] = useState(0)
  const [drill, setDrill] = useState<null | 'calls' | 'meetings'>(null)

  // ── Persistent date filter ──
  type DateFilter = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year'
  const DATE_FILTER_OPTIONS: { id: DateFilter; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'last_year', label: 'Last Year' },
  ]

  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    try { return (localStorage.getItem('icuni_dash_date_filter') as DateFilter) || 'this_week' } catch { return 'this_week' }
  })

  // Persist filter selection
  useEffect(() => {
    try { localStorage.setItem('icuni_dash_date_filter', dateFilter) } catch { /* ignored */ }
  }, [dateFilter])

  useEffect(() => {
    adminActions.loadCallLogs({ page_size: 500 })
    adminActions.loadClients()
    adminActions.loadMeetings()
    if (['Godmode', 'SuperAdmin'].includes(role)) adminActions.loadUsers()
  }, [])

  // Live countdown refresh
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const now = Date.now()

  // ── Date range computation ──
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Mon=1
    let start: Date, end: Date, label: string

    switch (dateFilter) {
      case 'today':
        start = new Date(today); end = new Date(today); end.setHours(23, 59, 59, 999)
        label = 'Today'; break
      case 'yesterday': {
        start = new Date(today); start.setDate(start.getDate() - 1)
        end = new Date(start); end.setHours(23, 59, 59, 999)
        label = 'Yesterday'; break
      }
      case 'this_week': {
        start = new Date(today); start.setDate(start.getDate() - (dayOfWeek - 1))
        end = new Date(today); end.setHours(23, 59, 59, 999)
        label = 'This Week'; break
      }
      case 'last_week': {
        start = new Date(today); start.setDate(start.getDate() - (dayOfWeek - 1) - 7)
        end = new Date(start); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999)
        label = 'Last Week'; break
      }
      case 'this_month': {
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today); end.setHours(23, 59, 59, 999)
        label = 'This Month'; break
      }
      case 'last_month': {
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0); end.setHours(23, 59, 59, 999)
        label = 'Last Month'; break
      }
      case 'this_year': {
        start = new Date(today.getFullYear(), 0, 1)
        end = new Date(today); end.setHours(23, 59, 59, 999)
        label = 'This Year'; break
      }
      case 'last_year': {
        start = new Date(today.getFullYear() - 1, 0, 1)
        end = new Date(today.getFullYear() - 1, 11, 31); end.setHours(23, 59, 59, 999)
        label = 'Last Year'; break
      }
      default:
        start = new Date(today); start.setDate(start.getDate() - (dayOfWeek - 1))
        end = new Date(today); end.setHours(23, 59, 59, 999)
        label = 'This Week'
    }
    return { rangeStart: start.getTime(), rangeEnd: end.getTime(), rangeLabel: label }
  }, [dateFilter])

  // ── Scope logic ──
  const isGodmode = role === 'Godmode'
  const isSuperAdmin = role === 'SuperAdmin'
  const isSales = role === 'Sales'

  const myCalls = useMemo(() =>
    (callLogs || []).filter((l: any) => l.caller_email === userEmail),
    [callLogs, userEmail])

  const allCalls = callLogs || []

  const primaryCalls = isGodmode ? allCalls : myCalls
  const primaryLabel = isGodmode ? 'All Calls' : 'My Calls'

  // ── Filter calls by selected date range ──
  const filteredPrimary = useMemo(() =>
    primaryCalls.filter((l: any) => {
      const t = new Date(l.call_start).getTime()
      return t >= rangeStart && t <= rangeEnd
    }), [primaryCalls, rangeStart, rangeEnd])

  // ── Primary metrics (based on selected date range) ──
  const primaryMetrics = useMemo(() => {
    const calls = filteredPrimary
    const meetings = calls.filter((l: any) => l.outcome === 'meeting_booked')
    const totalDur = calls.reduce((s: number, l: any) => s + Number(l.duration_seconds || 0), 0)
    const avgDur = calls.length > 0 ? Math.round(totalDur / calls.length) : 0
    const convRate = calls.length > 0 ? Math.round((meetings.length / calls.length) * 100) : 0
    // Overdue follow-ups (always real-time, not range-dependent)
    const overdue = primaryCalls.filter((l: any) =>
      l.next_action_date && new Date(l.next_action_date).getTime() < now &&
      ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(l.outcome)
    ).length
    return {
      calls: calls.length, meetings: meetings.length, convRate, avgDur, overdue,
    }
  }, [filteredPrimary, primaryCalls, _tick])

  // ── P4: drill-down lists (clients called / met in range) + recent meetings ──
  const clientById = useMemo(() => {
    const m: Record<string, any> = {}
    ;(clients || []).forEach((c: any) => { m[c.client_id] = c })
    return m
  }, [clients])

  const groupByClient = (logs: any[]) => {
    const byClient: Record<string, any> = {}
    logs.forEach((l: any) => {
      const id = l.client_id || l.client_name || 'unknown'
      if (!byClient[id]) byClient[id] = {
        client_id: l.client_id,
        name: l.client_name || clientById[l.client_id]?.name || 'Unknown',
        company: l.client_company || clientById[l.client_id]?.company || '',
        count: 0, lastOutcome: '', lastTime: 0,
      }
      byClient[id].count++
      const t = new Date(l.call_start || 0).getTime()
      if (t >= byClient[id].lastTime) { byClient[id].lastTime = t; byClient[id].lastOutcome = l.outcome || '' }
    })
    return Object.values(byClient).sort((a: any, b: any) => b.lastTime - a.lastTime)
  }

  const callsDrill = useMemo(() => groupByClient(filteredPrimary), [filteredPrimary, clientById])
  const meetingsDrill = useMemo(
    () => groupByClient(filteredPrimary.filter((l: any) => l.outcome === 'meeting_booked')),
    [filteredPrimary, clientById]
  )

  // Recent meetings = formal meetings (any stage incl. just-booked) PLUS
  // call-derived booked meetings that don't have a formal row yet, so the
  // dashboard shows booked meetings, not only confirmed ones.
  const recentMeetings = useMemo(() => {
    const formal = (meetings || []).filter((mm: any) => mm.stage !== 'cancelled' && mm.stage !== 'regressed')
    const formalClientIds = new Set(formal.map((m: any) => m.client_id))
    const seen = new Set<string>()
    const inferred = (callLogs || [])
      .filter((l: any) => l.outcome === 'meeting_booked' && l.client_id && !formalClientIds.has(l.client_id))
      .filter((l: any) => { if (seen.has(l.client_id)) return false; seen.add(l.client_id); return true })
      .map((l: any) => {
        const datePart = String(l.next_action_date || '').split(' at ')[0].split('T')[0].trim()
        return {
          meeting_id: `call-${l.call_id}`,
          client_id: l.client_id,
          client_name: l.client_name || clientById[l.client_id]?.name || 'Unknown',
          client_company: l.client_company || clientById[l.client_id]?.company || '',
          date: /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '',
          stage: 'booked',
        }
      })
    return [...formal, ...inferred]
      .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 6)
  }, [meetings, callLogs, clientById])

  const openClientFromDash = (clientId: string) => {
    const client = (clients || []).find((c: any) => c.client_id === clientId)
    if (client) adminActions.setActiveClientOptimistic(client)
    adminActions.setSection('clients')
    setDrill(null)
  }

  // ── Secondary scope (team avg or team calls) ──
  const secondaryLabel = isGodmode ? 'My Calls' : isSuperAdmin ? "Team's Calls" : 'Team Average'
  const secondaryCalls = isGodmode ? myCalls : allCalls

  const filteredSecondary = useMemo(() =>
    secondaryCalls.filter((l: any) => {
      const t = new Date(l.call_start).getTime()
      return t >= rangeStart && t <= rangeEnd
    }), [secondaryCalls, rangeStart, rangeEnd])

  const secondaryMetrics = useMemo(() => {
    const calls = filteredSecondary
    const meetings = calls.filter((l: any) => l.outcome === 'meeting_booked')

    if (isGodmode || isSuperAdmin) {
      return { calls: calls.length, meetings: meetings.length, convRate: calls.length > 0 ? Math.round((meetings.length / calls.length) * 100) : 0 }
    }
    // Admin/Sales: team average
    const execs = new Set(calls.map((l: any) => l.caller_email))
    const execCount = Math.max(execs.size, 1)
    return {
      calls: Math.round(calls.length / execCount),
      meetings: Math.round(meetings.length / execCount),
      convRate: calls.length > 0 ? Math.round((meetings.length / calls.length) * 100) : 0,
    }
  }, [filteredSecondary, _tick])

  // ── Today's schedule (upcoming callbacks/meetings + OVERDUE backlog) ──
  const upcomingActions = useMemo(() => {
    const source = isGodmode ? allCalls : myCalls
    const withAction = source.filter((l: any) => {
      if (!l.next_action_date) return false
      return ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(l.outcome)
    })
    return withAction.sort((a: any, b: any) => {
      const aTime = new Date(a.next_action_date).getTime()
      const bTime = new Date(b.next_action_date).getTime()
      const aOverdue = aTime < now
      const bOverdue = bTime < now
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      if (aOverdue && bOverdue) return aTime - bTime
      return aTime - bTime
    }).slice(0, 15)
  }, [myCalls, allCalls, _tick])

  // ── Outcome distribution for selected range ──
  const outcomeDist = useMemo(() => {
    const map: Record<string, number> = {}
    filteredPrimary.forEach((l: any) => {
      const o = l.outcome || 'unknown'
      map[o] = (map[o] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [filteredPrimary])

  // ── Recent calls (from selected range) ──
  const recentCalls = useMemo(() =>
    filteredPrimary
      .sort((a: any, b: any) => new Date(b.call_start).getTime() - new Date(a.call_start).getTime())
      .slice(0, 10),
    [filteredPrimary])

  // ── CSV Export for selected date range ──
  const handleExportCalls = () => {
    if (!filteredPrimary.length) return
    const headers = ['Date', 'Client', 'Caller', 'Outcome', 'Duration (s)', 'Notes']
    const csv = [
      headers.join(','),
      ...filteredPrimary.map((log: any) => {
        const clientName = (clients || []).find((c: any) => c.client_id === log.client_id)?.name || log.client_name || ''
        return [
          `"${new Date(log.call_start).toISOString()}"`,
          `"${clientName.replace(/"/g, '""')}"`,
          `"${(log.caller_name || log.caller_email || '').replace(/"/g, '""')}"`,
          `"${(OUTCOME_LABELS[log.outcome] || log.outcome || '').replace(/"/g, '""')}"`,
          log.duration_seconds || 0,
          `"${(log.call_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ].join(',')
      })
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `icuni_calls_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // ── Pipeline summary ──
  const pipeline = useMemo(() => {
    const stages: Record<string, number> = {}
    const src = isGodmode ? (clients || []) : (clients || []).filter((c: any) => c.added_by === userEmail)
    src.forEach((c: any) => {
      const st = c.prospect_stage || 'new_lead'
      if (st !== 'won' && st !== 'lost' && st !== 'disqualified') stages[st] = (stages[st] || 0) + 1
    })
    return stages
  }, [clients, userEmail])

  // Role-aware greeting
  const greeting = isGodmode
    ? `Welcome back, ${userName} — here's the team's call performance`
    : isSales
    ? `Welcome back, ${userName} — here's your call performance`
    : `Welcome back, ${userName} — here's your call performance`

  return (
    <div className="space-y-6">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Growth Command Center</h2>
          <p className="text-sm text-neutral-500 mt-1">{greeting}</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-900/60 border border-neutral-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {DATE_FILTER_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setDateFilter(opt.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                dateFilter === opt.id
                  ? 'bg-[#00bfff] text-white shadow-[0_0_12px_rgba(0,191,255,0.3)]'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Primary Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `${primaryLabel} (${rangeLabel})`, value: primaryMetrics.calls, sub: `${primaryMetrics.meetings} meeting${primaryMetrics.meetings !== 1 ? 's' : ''} booked`, icon: Phone, color: '#00bfff', nav: 'calls', drill: 'calls' as const },
          { label: 'Meetings Booked', value: primaryMetrics.meetings, sub: `${primaryMetrics.convRate}% conversion`, icon: Target, color: '#22c55e', nav: 'meetings', drill: 'meetings' as const },
          { label: 'Avg Call Duration', value: fmtDuration(primaryMetrics.avgDur), sub: rangeLabel.toLowerCase(), icon: Clock, color: '#8b5cf6', nav: 'calls', drill: null },
          { label: 'Overdue Follow-Ups', value: primaryMetrics.overdue, sub: primaryMetrics.overdue === 0 ? 'All caught up!' : 'Need attention', icon: primaryMetrics.overdue > 0 ? AlertTriangle : CheckCircle, color: primaryMetrics.overdue > 0 ? '#ef4444' : '#22c55e', nav: 'sla', drill: null },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => m.drill ? setDrill(m.drill) : adminActions.setSection(m.nav)}
            title={m.drill ? 'Click to see who' : undefined}
            className="relative bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 overflow-hidden group hover:border-neutral-700 transition-all cursor-pointer">
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: `linear-gradient(135deg, ${m.color} 0%, transparent 100%)` }} />
            <div className="relative z-[1]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{m.value}</p>
              <p className="text-[10px] text-neutral-600 mt-1">{m.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Secondary Scope Banner ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[#ff7a00]" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{secondaryLabel}</span>
            <p className="text-[10px] text-neutral-600">{rangeLabel} comparison</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{secondaryMetrics.calls}</p>
            <p className="text-[9px] text-neutral-600 uppercase">Calls</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-400 font-bold text-lg">{secondaryMetrics.meetings}</p>
            <p className="text-[9px] text-neutral-600 uppercase">Meetings</p>
          </div>
          <div className="text-center">
            <p className={`font-bold text-lg ${secondaryMetrics.convRate >= 15 ? 'text-emerald-400' : secondaryMetrics.convRate >= 8 ? 'text-amber-400' : 'text-red-400'}`}>{secondaryMetrics.convRate}%</p>
            <p className="text-[9px] text-neutral-600 uppercase">Conv. Rate</p>
          </div>
        </div>
      </motion.div>

      {/* ── Recent Meetings subgroup ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8b5cf6]" /> Recent Meetings
          </span>
          <button onClick={() => adminActions.setSection('meetings')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">View all</button>
        </div>
        {recentMeetings.length === 0 ? (
          <p className="text-xs text-neutral-600 py-3 text-center">No meetings yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {recentMeetings.map((mm: any) => (
              <button key={mm.meeting_id} onClick={() => adminActions.setSection('meetings')}
                className="w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg hover:border-[#8b5cf6]/40 transition-all cursor-pointer">
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate">{mm.client_name || mm.client_company || 'Meeting'}</p>
                  {mm.client_company && <p className="text-[10px] text-neutral-500 truncate">{mm.client_company}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-neutral-300">{mm.date ? new Date(mm.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}</p>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#8b5cf6]">{mm.stage || 'booked'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Drill-down modal: clients called / met in range ── */}
      {drill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDrill(null)}>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-white">{drill === 'calls' ? 'Clients Called' : 'Meetings Booked'} — {rangeLabel}</h3>
                <p className="text-[10px] text-neutral-500">{(drill === 'calls' ? callsDrill : meetingsDrill).length} {drill === 'calls' ? 'contacts' : 'with meetings'}</p>
              </div>
              <button onClick={() => setDrill(null)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {(drill === 'calls' ? callsDrill : meetingsDrill).length === 0 ? (
                <p className="text-xs text-neutral-600 py-8 text-center">Nothing in this range</p>
              ) : (drill === 'calls' ? callsDrill : meetingsDrill).map((c: any, i: number) => (
                <button key={c.client_id || i} onClick={() => c.client_id && openClientFromDash(c.client_id)}
                  className="w-full flex items-center justify-between gap-2 text-left px-3 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-lg hover:border-[#00bfff]/40 transition-all cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-xs text-white font-medium truncate">{c.name}</p>
                    {c.company && <p className="text-[10px] text-neutral-500 truncate">{c.company}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-neutral-400">{c.count} call{c.count !== 1 ? 's' : ''}</p>
                    {c.lastOutcome && <span className="text-[9px] uppercase tracking-wider text-neutral-600">{String(c.lastOutcome).replace(/_/g, ' ')}</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-neutral-800">
              <button onClick={() => { adminActions.setSection(drill === 'calls' ? 'calls' : 'meetings'); setDrill(null) }}
                className="w-full py-2 text-xs font-bold text-[#00bfff] hover:text-white bg-[#00bfff]/10 hover:bg-[#00bfff]/20 rounded-lg cursor-pointer transition-all">
                Open {drill === 'calls' ? 'Call Logs' : 'Meetings'} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
          <UpcomingActionsCard
            upcomingActions={upcomingActions}
            clients={clients}
            now={now}
          />
        </motion.div>

        {/* Outcome Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ff7a00]" /> Outcomes — {rangeLabel}
          </h3>
          {outcomeDist.length === 0 ? (
            <p className="text-sm text-neutral-600 py-4 text-center">No calls in this period</p>
          ) : (
            <div className="space-y-2.5">
              {outcomeDist.map(([outcome, count]) => {
                const total = outcomeDist.reduce((s, [, c]) => s + c, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const color = OUTCOME_COLORS[outcome] || '#6b7280'
                return (
                  <div key={outcome}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-400 capitalize">{OUTCOME_LABELS[outcome] || outcome.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold text-white">{count} <span className="text-neutral-600 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full rounded-full" style={{ background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom Row: Pipeline + Recent Calls ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#ff7a00]" /> {isGodmode ? 'All' : 'My'} Pipeline
            </h3>
            <button onClick={() => adminActions.setSection('clients')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Open CRM</button>
          </div>
          {Object.keys(pipeline).length === 0 ? (
            <p className="text-sm text-neutral-600 py-4 text-center">No active prospects</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(pipeline).sort((a, b) => b[1] - a[1]).map(([stage, count]) => {
                const stageColors: Record<string, string> = {
                  new_lead: '#00bfff', contacted: '#8b5cf6', qualified: '#f59e0b',
                  meeting_scheduled: '#ff7a00', proposal_sent: '#ec4899', negotiation: '#ef4444',
                  discovery: '#6366f1', prospect: '#64748b',
                }
                const color = stageColors[stage] || '#6b7280'
                return (
                  <div key={stage} className="text-center p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/50 hover:border-neutral-700 transition-colors cursor-pointer"
                    onClick={() => adminActions.setSection('clients')}>
                    <div className="text-xl font-black" style={{ color }}>{count}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider mt-1 capitalize">{stage.replace(/_/g, ' ')}</div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Calls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#00bfff]" /> Recent Calls
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => adminActions.setSection('calls')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">View Logs</button>
              <button onClick={handleExportCalls} title={`Export ${rangeLabel.toLowerCase()} calls as CSV`} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white cursor-pointer transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-[260px] overflow-y-auto">
            {recentCalls.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No calls in this period</p>}
            {recentCalls.map((l: any, i: number) => {
              const clientName = clients.find((c: any) => c.client_id === l.client_id)?.name || l.client_name || l.caller_name || 'Unknown'
              const color = OUTCOME_COLORS[l.outcome] || '#6b7280'
              return (
                <div key={l.call_id || i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  onClick={() => {
                    const client = clients.find((c: any) => c.client_id === l.client_id)
                    if (client) adminActions.setActiveClientOptimistic(client)
                    adminActions.setSection('clients')
                  }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-sm text-neutral-300 truncate flex-1">{clientName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ color, background: `${color}15` }}>
                    {OUTCOME_LABELS[l.outcome] || l.outcome || '—'}
                  </span>
                  <span className="text-[10px] text-neutral-600 flex-shrink-0 font-mono">{fmtDuration(Number(l.duration_seconds || 0))}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// ── ADMIN OVERVIEW DASHBOARD  (existing, for non-call views) ──
// ═══════════════════════════════════════════════════════════

function AdminOverviewDashboard() {
  const s = useAdminStore()
  useEffect(() => { adminActions.loadDashboard() }, [])

  const activeProjects = (s.projects || []).filter((p: any) => p.status === 'active').length
  const pendingInvoices = (s.invoices || []).filter((i: any) => i.status === 'pending' || i.status === 'partial').length
  const totalRevenue = (s.invoices || []).filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
  const breached = (s.slaStatuses || []).filter((st: any) => st.breached).length
  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], [])

  const projectTypes = useMemo(() => {
    const map = new Map<string, number>()
    ;(s.projects || []).forEach((p: any) => { const t = p.type || 'Other'; map.set(t, (map.get(t) || 0) + 1) })
    return Array.from(map.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
  }, [s.projects])

  const typeTotal = projectTypes.reduce((s, t) => s + t.count, 0) || 1
  const TYPE_COLORS = ['#00bfff', '#8b5cf6', '#ff7a00', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4']
  let arcOffset = 0
  const typeArcs = projectTypes.map((item, i) => {
    const pct = item.count / typeTotal; const dash = pct * 251.2; const gap = 251.2 - dash; const offset = arcOffset; arcOffset += dash
    return { ...item, dash, gap, offset, color: TYPE_COLORS[i % TYPE_COLORS.length] }
  })

  const recentProspects = useMemo(() =>
    (s.clients || []).filter((c: any) => { const stage = c.prospect_stage || 'new_lead'; return stage !== 'won' && stage !== 'lost' })
      .sort((a: any, b: any) => new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime())
      .slice(0, 5), [s.clients])

  const STAGE_LABELS: Record<string, string> = {
    new_lead: 'New Lead', contacted: 'Contacted', qualified: 'Qualified',
    meeting_scheduled: 'Meeting', proposal_sent: 'Proposal', negotiation: 'Negotiation',
    won: 'Won', lost: 'Lost'
  }
  const STAGE_COLORS: Record<string, string> = {
    new_lead: '#00bfff', contacted: '#8b5cf6', qualified: '#f59e0b',
    meeting_scheduled: '#ff7a00', proposal_sent: '#ec4899', negotiation: '#ef4444',
    won: '#10b981', lost: '#475569'
  }

  const allContacts = (s.clients || []).filter((c: any) => (c.status || '').toLowerCase() !== 'deleted')
  const payingClients = allContacts.filter((c: any) => ['won', 'client'].includes((c.prospect_stage || '').toLowerCase())).length
  const pipelineCount = allContacts.length - payingClients

  const stats = [
    { label: 'Paying Clients', value: payingClients, icon: Users, color: '#10b981', nav: 'clients' },
    { label: 'In Pipeline', value: pipelineCount, icon: TrendingUp, color: '#00bfff', nav: 'clients' },
    { label: 'Active Projects', value: activeProjects, icon: FolderOpen, color: '#ff7a00', nav: 'projects' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: '#d97706', nav: 'invoices' },
    { label: 'Total Revenue', value: `GH\u20B5${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#10b981', nav: 'invoices' },
    { label: 'SLA Breaches', value: breached, icon: AlertTriangle, color: breached > 0 ? '#ef4444' : '#22c55e', nav: 'sla' },
  ]

  return (
    <>
      {s.loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading dashboard data...</div>}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((st, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => adminActions.setSection(st.nav)}
            className={`${card} hover:border-neutral-700 transition-colors cursor-pointer`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${st.color}15` }}>
                <st.icon className="w-4.5 h-4.5" style={{ color: st.color }} />
              </div>
              <span className="text-xs text-neutral-500 font-medium">{st.label}</span>
            </div>
            <div className="text-2xl font-black text-white">{st.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {typeArcs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Project Types</h3>
            <div className="flex items-center gap-6">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                {typeArcs.map((arc) => (
                  <circle key={arc.type} cx="50" cy="50" r="40" fill="none" stroke={arc.color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${arc.dash} ${arc.gap}`} strokeDashoffset={-arc.offset} transform="rotate(-90 50 50)"
                    style={{ transition: 'all 0.5s' }} />
                ))}
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="16" fontWeight="800">{typeTotal}</text>
              </svg>
              <div className="flex-1 space-y-1.5">
                {typeArcs.map(arc => (
                  <div key={arc.type} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: arc.color }} />
                    <span className="text-neutral-400 flex-1 capitalize">{arc.type}</span>
                    <span className="text-white font-semibold">{arc.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff7a00]" /> Ops Pipeline
            </h3>
            <button onClick={() => adminActions.setSection('clients')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">Open CRM</button>
          </div>
          {(() => {
            const prospects = (s.clients || []).filter((c: any) => {
              const stage = c.prospect_stage || 'new_lead'
              return ['prospect', 'new_lead', 'contacted', 'qualified'].includes(stage)
            })
            const addedThisWeek = prospects.filter((c: any) => (c.created_at || '') >= weekAgo).length
            const awaitingContact = prospects.filter((c: any) => (c.prospect_stage || 'new_lead') === 'prospect').length
            const qualified = prospects.filter((c: any) => (c.prospect_stage || 'new_lead') === 'qualified').length
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Total', value: prospects.length, color: '#00bfff' },
                  { label: 'This Week', value: addedThisWeek, color: '#ff7a00' },
                  { label: 'Awaiting', value: awaitingContact, color: '#64748b' },
                  { label: 'Qualified', value: qualified, color: '#f59e0b' },
                ].map((m, i) => (
                  <div key={i} className="text-center p-2 bg-neutral-900/50 rounded-lg border border-neutral-800/50 cursor-pointer hover:border-neutral-700 transition-colors"
                    onClick={() => adminActions.setSection('clients')}>
                    <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">{m.label}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" /> Challenge Hit Rate
          </h3>
          {(() => {
            const contacted = (s.clients || []).filter((c: any) => {
              const stage = c.prospect_stage || 'new_lead'
              return !['prospect', 'new_lead'].includes(stage) && stage !== 'lost'
            })
            const withChallenge = contacted.filter((c: any) => c.challenge_statement || c.pain_category)
            const rate = contacted.length > 0 ? Math.round((withChallenge.length / contacted.length) * 100) : 0
            const barColor = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'
            return (
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-black" style={{ color: barColor }}>{rate}%</div>
                  <div className="text-xs text-neutral-500 pb-1">{withChallenge.length} of {contacted.length} contacted prospects have challenge data</div>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.8 }}
                    className="h-full rounded-full" style={{ background: barColor }} />
                </div>
                <p className="text-[10px] text-neutral-600 italic">Target: capture the &quot;most expensive problem&quot; for every contacted prospect.</p>
              </div>
            )
          })()}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Prospect Pipeline</h3>
            <button onClick={() => adminActions.setSection('clients')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">View CRM</button>
          </div>
          {recentProspects.length === 0 ? (
            <p className="text-sm text-neutral-600 py-4 text-center">No active prospects</p>
          ) : (
            <div className="space-y-2">
              {recentProspects.map((c: any) => (
                <div key={c.client_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  onClick={() => {
                    adminActions.setActiveClientOptimistic(c)
                    adminActions.setSection('clients')
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: STAGE_COLORS[c.prospect_stage] || '#475569' }}>
                    {((c.name || c.company || 'U').match(/[a-zA-Z]/) || ['•'])[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-neutral-500">{c.company || c.email}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ color: STAGE_COLORS[c.prospect_stage] || '#64748b', background: `${STAGE_COLORS[c.prospect_stage] || '#475569'}15` }}>
                    {STAGE_LABELS[c.prospect_stage] || c.prospect_stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">SLA Health</h3>
            <button onClick={() => adminActions.setSection('sla')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">View All</button>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(s.slaStatuses || []).length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No active SLAs</p>}
            {(s.slaStatuses || []).slice(0, 8).map((sla: any, i: number) => {
              const pct = Math.min(Math.round((sla.severity || 0) * 100), 150)
              const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#d97706' : '#22c55e'
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  onClick={() => adminActions.setSection('sla')}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{sla.title}</div>
                    <div className="text-xs text-neutral-500">{sla.step_name} — {Math.round(sla.elapsed / 60)}h elapsed</div>
                  </div>
                  <div className="w-16 sm:w-24">
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-0.5 text-right">{pct}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Recent Activity</h3>
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {(s.logs || []).length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No recent activity</p>}
          {(s.logs || []).slice(0, 20).map((log: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-neutral-800/30 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00bfff] shrink-0" />
              <span className="text-neutral-400 truncate flex-1">{log.user_name || 'System'}: {log.detail || log.action}</span>
              <span className="text-xs text-neutral-600 shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════
// ── MAIN DASHBOARD SECTION  ───────────────────────────────
// ═══════════════════════════════════════════════════════════

export default function DashboardSection() {
  const { user } = useAdminStore()
  const effectiveUser = useEffectiveUser()
  const role = effectiveUser?.role || ''
  const showGrowthDash = ['Sales', 'Admin', 'SuperAdmin', 'Godmode'].includes(role)

  return (
    <div className="space-y-6">
      {showGrowthDash ? (
        <GrowthCommandCenter role={role} userEmail={effectiveUser?.email || ''} userName={effectiveUser?.name || 'there'} />
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-black text-white">Dashboard</h2>
            <p className="text-sm text-neutral-500 mt-1">Welcome back, {user?.name}</p>
          </div>
          <AdminOverviewDashboard />
        </>
      )}

      {/* For elevated roles, also show the admin overview below the Growth dashboard */}
      {showGrowthDash && ['Godmode', 'SuperAdmin'].includes(role) && (
        <div className="pt-6 border-t border-neutral-800/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#ff7a00]" /> Operations Overview
          </h3>
          <AdminOverviewDashboard />
        </div>
      )}
    </div>
  )
}
