import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import {
  Users, FolderOpen, FileText, AlertTriangle, TrendingUp, Flame,
  Phone, Target, Clock, Calendar, CheckCircle, BarChart3
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

interface GrowthDashProps {
  role: string
  userEmail: string
  userName: string
}

function GrowthCommandCenter({ role, userEmail, userName }: GrowthDashProps) {
  const { callLogs, clients } = useAdminStore()
  const [_tick, setTick] = useState(0)

  useEffect(() => {
    adminActions.loadCallLogs({ page_size: 500 })
    adminActions.loadClients()
    if (['Godmode', 'SuperAdmin'].includes(role)) adminActions.loadUsers()
  }, [])

  // Live countdown refresh
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const now = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekAgo = now - 7 * 86400000
  const monthAgo = now - 30 * 86400000

  // ── Scope logic ──
  // Sales/Admin: "My Calls" primary, "My Team Average" secondary
  // SuperAdmin: "My Calls" primary, "My Team's Calls" secondary (all calls)
  // Godmode: "All Calls" primary, "My Calls" secondary
  const isGodmode = role === 'Godmode'
  const isSuperAdmin = role === 'SuperAdmin'

  const myCalls = useMemo(() =>
    (callLogs || []).filter((l: any) => l.caller_email === userEmail),
    [callLogs, userEmail])

  const allCalls = callLogs || []

  const primaryCalls = isGodmode ? allCalls : myCalls
  const primaryLabel = isGodmode ? 'All Calls' : 'My Calls'

  // ── Primary metrics ──
  const primaryMetrics = useMemo(() => {
    const today = primaryCalls.filter((l: any) => new Date(l.call_start).getTime() >= todayStart.getTime())
    const week = primaryCalls.filter((l: any) => new Date(l.call_start).getTime() >= weekAgo)
    const month = primaryCalls.filter((l: any) => new Date(l.call_start).getTime() >= monthAgo)
    const meetingsWeek = week.filter((l: any) => l.outcome === 'meeting_booked')
    const totalDurWeek = week.reduce((s: number, l: any) => s + Number(l.duration_seconds || 0), 0)
    const avgDur = week.length > 0 ? Math.round(totalDurWeek / week.length) : 0
    const convRate = week.length > 0 ? Math.round((meetingsWeek.length / week.length) * 100) : 0
    // Overdue follow-ups
    const overdue = primaryCalls.filter((l: any) =>
      l.next_action_date && new Date(l.next_action_date).getTime() < now &&
      ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(l.outcome)
    ).length
    return {
      today: today.length, week: week.length, month: month.length,
      meetingsWeek: meetingsWeek.length, convRate, avgDur, overdue,
    }
  }, [primaryCalls, _tick])

  // ── Secondary scope (team avg or team calls) ──
  const secondaryLabel = isGodmode ? 'My Calls' : isSuperAdmin ? "Team's Calls" : 'Team Average'
  const secondaryCalls = isGodmode ? myCalls : allCalls

  const secondaryMetrics = useMemo(() => {
    const week = secondaryCalls.filter((l: any) => new Date(l.call_start).getTime() >= weekAgo)
    const meetingsWeek = week.filter((l: any) => l.outcome === 'meeting_booked')

    if (isGodmode) {
      // For Godmode secondary = my calls
      return { week: week.length, meetingsWeek: meetingsWeek.length, convRate: week.length > 0 ? Math.round((meetingsWeek.length / week.length) * 100) : 0 }
    }
    if (isSuperAdmin) {
      // SuperAdmin sees team totals
      return { week: week.length, meetingsWeek: meetingsWeek.length, convRate: week.length > 0 ? Math.round((meetingsWeek.length / week.length) * 100) : 0 }
    }
    // Admin/Sales: team average
    const execs = new Set((week).map((l: any) => l.caller_email))
    const execCount = Math.max(execs.size, 1)
    return {
      week: Math.round(week.length / execCount),
      meetingsWeek: Math.round(meetingsWeek.length / execCount),
      convRate: week.length > 0 ? Math.round((meetingsWeek.length / week.length) * 100) : 0,
    }
  }, [secondaryCalls, _tick])

  // ── Today's schedule (upcoming callbacks/meetings + OVERDUE backlog) ──
  const upcomingActions = useMemo(() => {
    const source = isGodmode ? allCalls : myCalls
    const withAction = source.filter((l: any) => {
      if (!l.next_action_date) return false
      // Include both future AND past-due follow-ups that need actioning
      return ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(l.outcome)
    })
    // Sort: overdue items first (most overdue at top), then future by soonest
    return withAction.sort((a: any, b: any) => {
      const aTime = new Date(a.next_action_date).getTime()
      const bTime = new Date(b.next_action_date).getTime()
      const aOverdue = aTime < now
      const bOverdue = bTime < now
      // Overdue items come first
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      // Among overdue: most overdue first (smallest time = oldest)
      if (aOverdue && bOverdue) return aTime - bTime
      // Among future: soonest first
      return aTime - bTime
    }).slice(0, 15)
  }, [myCalls, allCalls, _tick])

  // ── Outcome distribution this week ──
  const outcomeDist = useMemo(() => {
    const week = primaryCalls.filter((l: any) => new Date(l.call_start).getTime() >= weekAgo)
    const map: Record<string, number> = {}
    week.forEach((l: any) => {
      const o = l.outcome || 'unknown'
      map[o] = (map[o] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [primaryCalls, _tick])

  // ── Recent calls ──
  const recentCalls = useMemo(() =>
    primaryCalls
      .sort((a: any, b: any) => new Date(b.call_start).getTime() - new Date(a.call_start).getTime())
      .slice(0, 10),
    [primaryCalls])

  // ── Pipeline summary ──
  const pipeline = useMemo(() => {
    const stages: Record<string, number> = {}
    const src = isGodmode ? clients : clients.filter((c: any) => c.added_by === userEmail)
    src.forEach((c: any) => {
      const st = c.prospect_stage || 'new_lead'
      if (st !== 'won' && st !== 'lost' && st !== 'disqualified') stages[st] = (stages[st] || 0) + 1
    })
    return stages
  }, [clients, userEmail])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">Growth Command Center</h2>
        <p className="text-sm text-neutral-500 mt-1">Welcome back, {userName} — here's your call performance</p>
      </div>

      {/* ── Primary Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `Today (${primaryLabel})`, value: primaryMetrics.today, sub: `${primaryMetrics.week} this week`, icon: Phone, color: '#00bfff', nav: 'calls' },
          { label: 'Meetings Booked', value: primaryMetrics.meetingsWeek, sub: `${primaryMetrics.convRate}% conversion`, icon: Target, color: '#22c55e', nav: 'calls' },
          { label: 'Avg Call Duration', value: fmtDuration(primaryMetrics.avgDur), sub: 'this week', icon: Clock, color: '#8b5cf6', nav: 'calls' },
          { label: 'Overdue Follow-Ups', value: primaryMetrics.overdue, sub: primaryMetrics.overdue === 0 ? 'All caught up!' : 'Need attention', icon: primaryMetrics.overdue > 0 ? AlertTriangle : CheckCircle, color: primaryMetrics.overdue > 0 ? '#ef4444' : '#22c55e', nav: 'sla' },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => adminActions.setSection(m.nav)}
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
            <p className="text-[10px] text-neutral-600">This week comparison</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{secondaryMetrics.week}</p>
            <p className="text-[9px] text-neutral-600 uppercase">Calls</p>
          </div>
          <div className="text-center">
            <p className="text-emerald-400 font-bold text-lg">{secondaryMetrics.meetingsWeek}</p>
            <p className="text-[9px] text-neutral-600 uppercase">Meetings</p>
          </div>
          <div className="text-center">
            <p className={`font-bold text-lg ${secondaryMetrics.convRate >= 15 ? 'text-emerald-400' : secondaryMetrics.convRate >= 8 ? 'text-amber-400' : 'text-red-400'}`}>{secondaryMetrics.convRate}%</p>
            <p className="text-[9px] text-neutral-600 uppercase">Conv. Rate</p>
          </div>
        </div>
      </motion.div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#00bfff]" /> Upcoming Actions
            </h3>
            <button onClick={() => adminActions.setSection('calls')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">
              View All
            </button>
          </div>
          {upcomingActions.length === 0 ? (
            <p className="text-sm text-neutral-600 py-4 text-center">No upcoming callbacks or meetings</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {upcomingActions.map((l: any, i: number) => {
                const clientName = clients.find((c: any) => c.client_id === l.client_id)?.name || 'Unknown'
                const actionTime = new Date(l.next_action_date).getTime()
                const isOverdue = actionTime < now
                const isToday = new Date(l.next_action_date).toDateString() === new Date().toDateString()
                const overdueMs = isOverdue ? now - actionTime : 0
                const overdueHours = Math.floor(overdueMs / 3600000)
                const overdueMins = Math.floor((overdueMs % 3600000) / 60000)
                const overdueStr = overdueHours > 24
                  ? `${Math.floor(overdueHours / 24)}d ${overdueHours % 24}h`
                  : overdueHours > 0 ? `${overdueHours}h ${overdueMins}m` : `${overdueMins}m`
                return (
                  <div key={l.call_id || i}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-neutral-800/30 ${
                      isOverdue ? 'border-red-500/30 bg-red-500/[0.04]' : isToday ? 'border-[#00bfff]/20 bg-[#00bfff]/[0.03]' : 'border-transparent'
                    }`}
                    onClick={() => {
                      const client = clients.find((c: any) => c.client_id === l.client_id)
                      if (client) adminActions.setActiveClientOptimistic(client)
                      adminActions.setSection('clients')
                    }}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? 'animate-pulse' : ''}`}
                      style={{ background: isOverdue ? 'rgba(239,68,68,0.15)' : `${OUTCOME_COLORS[l.outcome] || '#6b7280'}15` }}>
                      {isOverdue
                        ? <AlertTriangle className="w-4 h-4 text-red-400" />
                        : <Phone className="w-4 h-4" style={{ color: OUTCOME_COLORS[l.outcome] || '#6b7280' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{clientName}</p>
                        {isOverdue && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 flex-shrink-0">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500">{OUTCOME_LABELS[l.outcome] || l.outcome} — {l.next_action || 'Follow up'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {isOverdue ? (
                        <>
                          <p className="text-xs font-bold text-red-400">{overdueStr} ago</p>
                          <p className="text-[9px] text-red-500/60">was {new Date(l.next_action_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        </>
                      ) : (
                        <>
                          <p className={`text-xs font-bold ${isToday ? 'text-[#00bfff]' : 'text-neutral-400'}`}>{fmtCountdown(l.next_action_date)}</p>
                          <p className="text-[9px] text-neutral-600">{new Date(l.next_action_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Outcome Distribution */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#ff7a00]" /> Outcomes This Week
          </h3>
          {outcomeDist.length === 0 ? (
            <p className="text-sm text-neutral-600 py-4 text-center">No calls this week</p>
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
            <button onClick={() => adminActions.setSection('calls')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors">View Logs</button>
          </div>
          <div className="space-y-1 max-h-[260px] overflow-y-auto">
            {recentCalls.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No recent calls</p>}
            {recentCalls.map((l: any, i: number) => {
              const clientName = clients.find((c: any) => c.client_id === l.client_id)?.name || 'Unknown'
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

  const activeProjects = s.projects.filter((p: any) => p.status === 'active').length
  const pendingInvoices = s.invoices.filter((i: any) => i.status === 'pending' || i.status === 'partial').length
  const totalRevenue = s.invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
  const breached = s.slaStatuses.filter((st: any) => st.breached).length
  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], [])

  const projectTypes = useMemo(() => {
    const map = new Map<string, number>()
    s.projects.forEach((p: any) => { const t = p.type || 'Other'; map.set(t, (map.get(t) || 0) + 1) })
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
    s.clients.filter((c: any) => { const stage = c.prospect_stage || 'new_lead'; return stage !== 'won' && stage !== 'lost' })
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

  const allContacts = s.clients.filter((c: any) => (c.status || '').toLowerCase() !== 'deleted')
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
            const prospects = s.clients.filter((c: any) => {
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
            const contacted = s.clients.filter((c: any) => {
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
            {s.slaStatuses.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No active SLAs</p>}
            {s.slaStatuses.slice(0, 8).map((sla: any, i: number) => {
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
          {s.logs.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No recent activity</p>}
          {s.logs.slice(0, 20).map((log: any, i: number) => (
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
  const role = user?.role || ''
  const showGrowthDash = ['Sales', 'Admin', 'SuperAdmin', 'Godmode'].includes(role)

  return (
    <div className="space-y-6">
      {showGrowthDash ? (
        <GrowthCommandCenter role={role} userEmail={user?.email || ''} userName={user?.name || 'there'} />
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
