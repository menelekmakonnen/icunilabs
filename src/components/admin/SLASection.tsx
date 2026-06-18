/**
 * SLASection — Rich, live SLA dashboard with countdown cards, urgency colors, and filtering.
 * For Sales/Growth execs: shows Growth Team Performance dashboard instead.
 */
import { useEffect, useState, useMemo } from 'react'
import { useAdminStore, adminActions, useEffectiveUser } from '../../store/useAdminStore'
import { Clock, AlertTriangle, CheckCircle, Shield, ChevronDown, Pause, Eye, BarChart3, Filter, Phone, Users, Target, TrendingUp, Calendar } from 'lucide-react'
import DataTable from './DataTable'

// ── Project Steps (mirrored from Config.js) ──
const PROJECT_STEPS: Record<number, { name: string; owner: string }> = {
  0:   { name: 'Closing Meeting', owner: 'staff' },
  1:   { name: 'Project Created & Invoice Sent', owner: 'staff' },
  1.5: { name: 'Referrer Follow-up', owner: 'referrer' },
  2:   { name: 'Payment Received', owner: 'client' },
  3:   { name: 'Build In Progress', owner: 'staff' },
  4:   { name: 'Demo/Test Ready', owner: 'staff' },
  4.5: { name: 'Iteration Loop', owner: 'staff' },
  5:   { name: 'Final Payments', owner: 'client' },
  6:   { name: 'Training Session', owner: 'staff' },
  7:   { name: 'Final Tailoring', owner: 'staff' },
  8:   { name: 'Additional Costs', owner: 'client' },
  9:   { name: 'Post-Mortem & Reviews', owner: 'staff' },
  10:  { name: 'Upsells & Upgrades', owner: 'staff' },
}

const OWNER_BADGE: Record<string, { label: string; color: string }> = {
  staff:    { label: 'Staff', color: '#00bfff' },
  client:   { label: 'Client', color: '#f59e0b' },
  referrer: { label: 'Referrer', color: '#8b5cf6' },
}

type SLAFilter = 'all' | 'on_track' | 'at_risk' | 'breached'

function fmtElapsed(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  if (h < 24) return `${h}h ${Math.round(minutes % 60)}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

function SLABadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    breached: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Breached' },
    active:   { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'On Track' },
    snoozed:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Snoozed' },
  }
  const s = map[status] || map.active
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: s.bg, color: s.text }}>{s.label}</span>
}

// ═══════════════════════════════════════════════════════════
// ──  GROWTH PERFORMANCE DASHBOARD  (Sales role)  ──────────
// ═══════════════════════════════════════════════════════════


function GrowthPerformanceDashboard() {
  const { callLogs, clients, users, loading } = useAdminStore()
  const [_tick, setTick] = useState(0)

  useEffect(() => {
    adminActions.loadCallLogs({ page_size: 500 })
    adminActions.loadClients()
    adminActions.loadUsers()
  }, [])

  // Tick for live countdowns
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // Find all active Growth execs (Sales role, Active status)
  const growthExecs = useMemo(() => {
    return (users || []).filter((u: any) => u.role === 'Sales' && u.status === 'Active')
  }, [users])

  // ── Per-exec performance from call logs ──
  const execPerf = useMemo(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 86400000
    const monthAgo = now - 30 * 86400000

    // Build caller map
    const byExec: Record<string, {
      email: string; name: string; callsWeek: number; callsMonth: number; callsAll: number;
      meetingsWeek: number; meetingsMonth: number; meetingsAll: number;
      totalDurationWeek: number; totalDurationAll: number;
      overdueFollowUps: number; upcomingFollowUps: number;
      outcomes: Record<string, number>; lastCall: string;
    }> = {}

    // Seed from known execs so they show even with 0 calls
    growthExecs.forEach((u: any) => {
      byExec[u.email] = {
        email: u.email, name: u.name, callsWeek: 0, callsMonth: 0, callsAll: 0,
        meetingsWeek: 0, meetingsMonth: 0, meetingsAll: 0,
        totalDurationWeek: 0, totalDurationAll: 0,
        overdueFollowUps: 0, upcomingFollowUps: 0,
        outcomes: {}, lastCall: '',
      }
    })

    ;(callLogs || []).forEach((log: any) => {
      const callerEmail = log.caller_email
      if (!callerEmail) return
      // Only count Growth execs
      if (!byExec[callerEmail] && !growthExecs.some((u: any) => u.email === callerEmail)) return
      if (!byExec[callerEmail]) {
        byExec[callerEmail] = {
          email: callerEmail, name: log.caller_name || callerEmail,
          callsWeek: 0, callsMonth: 0, callsAll: 0,
          meetingsWeek: 0, meetingsMonth: 0, meetingsAll: 0,
          totalDurationWeek: 0, totalDurationAll: 0,
          overdueFollowUps: 0, upcomingFollowUps: 0,
          outcomes: {}, lastCall: '',
        }
      }
      const e = byExec[callerEmail]
      const callDate = new Date(log.call_start).getTime()
      const dur = Number(log.duration_seconds || 0)

      e.callsAll++
      e.totalDurationAll += dur
      if (callDate >= weekAgo) { e.callsWeek++; e.totalDurationWeek += dur }
      if (callDate >= monthAgo) e.callsMonth++
      if (log.outcome === 'meeting_booked') {
        e.meetingsAll++
        if (callDate >= weekAgo) e.meetingsWeek++
        if (callDate >= monthAgo) e.meetingsMonth++
      }
      const out = log.outcome || 'unknown'
      e.outcomes[out] = (e.outcomes[out] || 0) + 1
      if (!e.lastCall || callDate > new Date(e.lastCall).getTime()) e.lastCall = log.call_start

      // Track follow-up compliance
      if (log.next_action_date && ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].includes(log.outcome)) {
        const nextDate = new Date(log.next_action_date).getTime()
        if (nextDate < now) e.overdueFollowUps++
        else e.upcomingFollowUps++
      }
    })

    return Object.values(byExec).sort((a, b) => b.meetingsWeek - a.meetingsWeek || b.callsWeek - a.callsWeek)
  }, [callLogs, growthExecs, _tick])

  // ── Team-wide summary ──
  const teamSummary = useMemo(() => {
    const totals = {
      callsWeek: 0, callsMonth: 0, meetingsWeek: 0, meetingsMonth: 0,
      totalDurationWeek: 0, overdueFollowUps: 0, upcomingFollowUps: 0,
      activeExecs: execPerf.length,
    }
    execPerf.forEach(e => {
      totals.callsWeek += e.callsWeek
      totals.callsMonth += e.callsMonth
      totals.meetingsWeek += e.meetingsWeek
      totals.meetingsMonth += e.meetingsMonth
      totals.totalDurationWeek += e.totalDurationWeek
      totals.overdueFollowUps += e.overdueFollowUps
      totals.upcomingFollowUps += e.upcomingFollowUps
    })
    return totals
  }, [execPerf])

  // ── Pipeline stage distribution ──
  const pipelineSummary = useMemo(() => {
    const stages: Record<string, number> = {}
    ;(clients || []).forEach((c: any) => {
      const stage = c.prospect_stage || 'unknown'
      stages[stage] = (stages[stage] || 0) + 1
    })
    return stages
  }, [clients])

  const conversionRate = teamSummary.callsWeek > 0
    ? Math.round((teamSummary.meetingsWeek / teamSummary.callsWeek) * 100) : 0
  const avgCallDuration = teamSummary.callsWeek > 0
    ? Math.round(teamSummary.totalDurationWeek / teamSummary.callsWeek) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Growth Performance</h2>
        <p className="text-sm text-neutral-500 mt-1">Team-wide metrics for all active Growth executives</p>
      </div>

      {loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading performance data...</div>}

      {/* ── Team Summary Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Calls This Week', value: teamSummary.callsWeek, sub: `${teamSummary.callsMonth} this month`, icon: Phone, color: '#00bfff' },
          { label: 'Meetings Booked', value: teamSummary.meetingsWeek, sub: `${conversionRate}% conversion`, icon: Target, color: '#22c55e' },
          { label: 'Avg Call Duration', value: `${Math.floor(avgCallDuration / 60)}:${String(avgCallDuration % 60).padStart(2, '0')}`, sub: 'minutes this week', icon: Clock, color: '#8b5cf6' },
          { label: 'Follow-Up SLA', value: teamSummary.overdueFollowUps, sub: `${teamSummary.upcomingFollowUps} upcoming`, icon: teamSummary.overdueFollowUps > 0 ? AlertTriangle : CheckCircle, color: teamSummary.overdueFollowUps > 0 ? '#ef4444' : '#22c55e' },
        ].map((m, i) => (
          <div key={i} className="relative bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 overflow-hidden group">
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
          </div>
        ))}
      </div>

      {/* ── Exec Leaderboard ── */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#00bfff]" />
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Growth Exec Leaderboard</h3>
          <span className="text-[10px] bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full ml-auto">{execPerf.length} active</span>
        </div>

        {execPerf.length === 0 ? (
          <div className="px-5 py-8 text-center text-neutral-600 text-sm">No active Growth executives found.</div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {execPerf.map((exec, idx) => {
              const rate = exec.callsWeek > 0 ? Math.round((exec.meetingsWeek / exec.callsWeek) * 100) : 0
              const hasOverdue = exec.overdueFollowUps > 0
              const avgDur = exec.callsWeek > 0 ? Math.round(exec.totalDurationWeek / exec.callsWeek) : 0

              return (
                <div key={exec.email} className="px-5 py-4 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black ${
                      idx === 0 ? 'bg-amber-500/15 text-amber-400' :
                      idx === 1 ? 'bg-neutral-700/30 text-neutral-300' :
                      idx === 2 ? 'bg-orange-900/20 text-orange-400' :
                      'bg-neutral-800 text-neutral-600'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{exec.name}</p>
                      <p className="text-[10px] text-neutral-600 truncate">{exec.email}</p>
                    </div>

                    {/* This Week Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-xs">
                      <div className="text-center">
                        <p className="text-white font-bold">{exec.callsWeek}</p>
                        <p className="text-[9px] text-neutral-600 uppercase">Calls</p>
                      </div>
                      <div className="text-center">
                        <p className="text-emerald-400 font-bold">{exec.meetingsWeek}</p>
                        <p className="text-[9px] text-neutral-600 uppercase">Meetings</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-bold ${rate >= 20 ? 'text-emerald-400' : rate >= 10 ? 'text-amber-400' : 'text-red-400'}`}>{rate}%</p>
                        <p className="text-[9px] text-neutral-600 uppercase">Conv.</p>
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-300 font-bold font-mono">{Math.floor(avgDur / 60)}:{String(avgDur % 60).padStart(2, '0')}</p>
                        <p className="text-[9px] text-neutral-600 uppercase">Avg Dur</p>
                      </div>
                    </div>

                    {/* Follow-up SLA */}
                    <div className="flex-shrink-0">
                      {hasOverdue ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> {exec.overdueFollowUps} overdue
                        </span>
                      ) : exec.upcomingFollowUps > 0 ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          <Calendar className="w-3 h-3" /> {exec.upcomingFollowUps} upcoming
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-700">No follow-ups</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile stats row */}
                  <div className="sm:hidden flex items-center gap-4 mt-2 ml-12 text-[10px]">
                    <span className="text-neutral-400"><span className="text-white font-bold">{exec.callsWeek}</span> calls</span>
                    <span className="text-neutral-400"><span className="text-emerald-400 font-bold">{exec.meetingsWeek}</span> meetings</span>
                    <span className={`font-bold ${rate >= 20 ? 'text-emerald-400' : rate >= 10 ? 'text-amber-400' : 'text-red-400'}`}>{rate}% conv.</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pipeline Health ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pipeline Stage Distribution */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#ff7a00]" />
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pipeline Stages</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(pipelineSummary)
              .filter(([stage]) => stage !== 'unknown')
              .sort((a, b) => b[1] - a[1])
              .map(([stage, count]) => {
                const total = Object.values(pipelineSummary).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                const stageColors: Record<string, string> = {
                  new_lead: '#00bfff', contacted: '#8b5cf6', discovery: '#6366f1',
                  proposal: '#f59e0b', negotiation: '#ff7a00', won: '#22c55e',
                  disqualified: '#6b7280', lost: '#6b7280',
                }
                const color = stageColors[stage] || '#6b7280'
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-500 uppercase w-24 truncate font-medium">{stage.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="text-xs text-white font-bold w-8 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Follow-Up Compliance Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#8b5cf6]" />
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Follow-Up Compliance</h3>
          </div>
          <div className="space-y-4">
            {execPerf.map(exec => {
              const total = exec.overdueFollowUps + exec.upcomingFollowUps
              if (total === 0) return null
              const compliancePct = total > 0 ? Math.round((exec.upcomingFollowUps / total) * 100) : 100
              const barColor = compliancePct >= 80 ? '#22c55e' : compliancePct >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={exec.email}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium truncate max-w-[120px]">{exec.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: barColor }}>{compliancePct}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${compliancePct}%`, background: barColor }} />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-neutral-600">{exec.overdueFollowUps} overdue</span>
                    <span className="text-[9px] text-neutral-600">{exec.upcomingFollowUps} on time</span>
                  </div>
                </div>
              )
            }).filter(Boolean)}
            {execPerf.every(e => e.overdueFollowUps + e.upcomingFollowUps === 0) && (
              <p className="text-neutral-600 text-sm text-center py-4">No follow-ups tracked yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// ──  MAIN SLA SECTION  (project-based for Admin+)  ────────
// ═══════════════════════════════════════════════════════════

export default function SLASection() {
  const { slaStatuses, slaCosts, callFollowUpSLA, loading, user } = useAdminStore()
  const [tab, setTab] = useState<'status' | 'costs' | 'follow_ups'>('status')
  const [filter, setFilter] = useState<SLAFilter>('all')
  const [groupByStep, setGroupByStep] = useState(false)
  const [_tick, setTick] = useState(0)

  const effectiveUser = useEffectiveUser()
  const role = effectiveUser?.role || ''
  const isSales = role === 'Sales'
  const canSnooze = ['Godmode', 'SuperAdmin', 'Admin'].includes(user?.role || '') // real user for write perms

  useEffect(() => {
    if (!isSales) {
      adminActions.loadSLA()
      adminActions.loadSlaCosts()
      adminActions.loadCallFollowUpSLA()
    }
  }, [isSales])

  // Live ticker: re-render every 30s for countdown freshness
  useEffect(() => {
    if (isSales) return
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [isSales])

  // ── Filtered statuses ──
  const filtered = useMemo(() => {
    if (isSales || !slaStatuses) return []
    return slaStatuses.filter((s: any) => {
      if (filter === 'on_track') return !s.breached && s.severity < 0.75
      if (filter === 'at_risk') return !s.breached && s.severity >= 0.75
      if (filter === 'breached') return s.breached
      return true
    })
  }, [slaStatuses, filter, _tick, isSales])

  // ── Summary metrics ──
  const summary = useMemo(() => {
    const all = slaStatuses || []
    return {
      total: all.length,
      onTrack: all.filter((s: any) => !s.breached && s.severity < 0.75).length,
      atRisk: all.filter((s: any) => !s.breached && s.severity >= 0.75).length,
      breached: all.filter((s: any) => s.breached).length,
    }
  }, [slaStatuses])

  // ── Grouped by step ──
  const grouped = useMemo(() => {
    if (isSales || !groupByStep) return null
    const map: Record<string, any[]> = {}
    filtered.forEach((s: any) => {
      const key = `${s.step} — ${s.step_name}`
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, groupByStep, isSales])

  // ── Growth execs see the Growth Performance dashboard ──
  if (isSales) return <GrowthPerformanceDashboard />

  // ── Costs Tab ──
  if (tab === 'costs') {
    return (
      <div>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('status')} className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors font-medium">SLA Dashboard</button>
          <button className="px-4 py-2 rounded-lg text-sm bg-neutral-800 text-white font-bold">Costs ({slaCosts.length})</button>
        </div>
        <DataTable title="SLA Costs" subtitle="Financial impact of SLA breaches" loading={loading} data={slaCosts}
          columns={[
            { key: 'project_id', label: 'Project', width: '120px' },
            { key: 'step', label: 'Step' },
            { key: 'overdue_minutes', label: 'Overdue', render: (v: any) => fmtElapsed(v) },
            { key: 'total_cost', label: 'Cost', render: (v: any) => <span className="text-red-400 font-bold">GH₵{Number(v || 0).toFixed(2)}</span> },
            { key: 'breach_date', label: 'Breach Date' },
          ]}
        />
      </div>
    )
  }

  // ── Follow-Ups Tab ──
  if (tab === 'follow_ups') {
    const activeSLAs = (callFollowUpSLA || []).filter((s: any) => s.status === 'active' || s.status === 'postponed')
    const completedSLAs = (callFollowUpSLA || []).filter((s: any) => s.status === 'completed')

    // Per-person summary
    const personMap: Record<string, { name: string; email: string; active: number; totalFee: number; escalated: number; completed: number }> = {}
    ;(callFollowUpSLA || []).forEach((s: any) => {
      const key = s.caller_email || 'unknown'
      if (!personMap[key]) personMap[key] = { name: s.caller_name || key, email: key, active: 0, totalFee: 0, escalated: 0, completed: 0 }
      if (s.status === 'active' || s.status === 'postponed') {
        personMap[key].active++
        personMap[key].totalFee += parseFloat(s.live_fee || s.accrued_fee || 0)
        if (s.escalated === 'true') personMap[key].escalated++
      } else if (s.status === 'completed') {
        personMap[key].completed++
      }
    })
    const personSummary = Object.values(personMap).sort((a, b) => b.totalFee - a.totalFee)
    const totalActiveFees = activeSLAs.reduce((s: number, a: any) => s + parseFloat(a.live_fee || a.accrued_fee || 0), 0)

    return (
      <div className="space-y-6">
        {/* Tab Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">SLA Tracker</h2>
            <p className="text-sm text-neutral-500 mt-1">Call follow-up penalties &amp; compliance</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('status')} className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors font-medium">Dashboard</button>
            <button className="px-4 py-2 rounded-lg text-sm bg-neutral-800 text-white font-bold">Follow-Ups ({activeSLAs.length})</button>
            <button onClick={() => setTab('costs')} className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors font-medium">Costs ({slaCosts.length})</button>
          </div>
        </div>

        {loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading follow-up data...</div>}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Follow-Ups', value: activeSLAs.length, icon: Clock, color: '#f59e0b' },
            { label: 'Total Accrued', value: `GH₵${totalActiveFees.toFixed(2)}`, icon: AlertTriangle, color: '#ef4444' },
            { label: 'Escalated', value: activeSLAs.filter((s: any) => s.escalated === 'true').length, icon: Users, color: '#dc2626' },
            { label: 'Completed', value: completedSLAs.length, icon: CheckCircle, color: '#22c55e' },
          ].map((m, i) => (
            <div key={i} className="relative bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, ${m.color} 0%, transparent 100%)` }} />
              <div className="relative z-[1]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">{m.label}</span>
                </div>
                <p className="text-2xl font-black text-white">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Per-Person Summary */}
        {personSummary.length > 0 && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00bfff]" /> Per-Person Breakdown
            </h3>
            <div className="space-y-3">
              {personSummary.map(p => (
                <div key={p.email} className="flex items-center gap-4 p-3 rounded-xl border border-neutral-800/50 hover:bg-neutral-800/30 transition-all">
                  <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-black text-white">
                    {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-neutral-500">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className={`font-bold ${p.active > 0 ? 'text-amber-400' : 'text-neutral-600'}`}>{p.active}</p>
                      <p className="text-[9px] text-neutral-600">Active</p>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold ${p.totalFee > 0 ? 'text-red-400' : 'text-neutral-600'}`}>GH₵{p.totalFee.toFixed(2)}</p>
                      <p className="text-[9px] text-neutral-600">Fee</p>
                    </div>
                    {p.escalated > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/15 text-red-400">
                        {p.escalated} escalated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active SLA Cards */}
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Active Follow-Up SLAs</h3>
          {activeSLAs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
              <p className="text-neutral-500 text-sm">No overdue follow-ups — great work!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSLAs.map((s: any) => {
                const fee = parseFloat(s.live_fee || s.accrued_fee || 0)
                const hoursOverdue = s.business_hours_overdue || 0
                const isEscalated = s.escalated === 'true'
                const isPostponed = s.status === 'postponed'
                const severity = hoursOverdue >= 4 ? 'critical' : hoursOverdue >= 2 ? 'high' : hoursOverdue > 0 ? 'medium' : 'ok'
                const borderColor = severity === 'critical' ? 'border-red-500/40' : severity === 'high' ? 'border-red-500/20' : severity === 'medium' ? 'border-amber-500/20' : 'border-neutral-800'

                return (
                  <div key={s.sla_id}
                    className={`relative bg-neutral-900/50 border rounded-xl p-4 overflow-hidden transition-all hover:border-neutral-600 ${borderColor} ${severity === 'critical' ? 'animate-pulse' : ''}`}>
                    {/* Severity glow */}
                    {hoursOverdue > 0 && (
                      <div className="absolute inset-0 opacity-5" style={{ background: `linear-gradient(135deg, #ef4444 0%, transparent 70%)` }} />
                    )}
                    <div className="relative z-[1]">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white truncate max-w-[140px]">{s.client_name || 'Unknown'}</span>
                          {isEscalated && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/15 text-red-400">Escalated</span>
                          )}
                          {isPostponed && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/15 text-amber-400">Postponed</span>
                          )}
                        </div>
                        <span className={`text-lg font-black ${fee > 0 ? 'text-red-400' : 'text-neutral-600'}`}>GH₵{fee.toFixed(2)}</span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Assigned to</span>
                          <span className="text-neutral-300 font-medium">{s.caller_name || s.caller_email}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Due</span>
                          <span className="text-neutral-300">{new Date(s.due_date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Overdue (business hrs)</span>
                          <span className={`font-bold ${hoursOverdue >= 2 ? 'text-red-400' : hoursOverdue > 0 ? 'text-amber-400' : 'text-neutral-600'}`}>
                            {hoursOverdue > 0 ? `${hoursOverdue.toFixed(1)}h` : 'Not yet'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Outcome</span>
                          <span className="text-neutral-300 capitalize">{(s.outcome || '').replace(/_/g, ' ')}</span>
                        </div>
                        {isPostponed && s.postponed_until && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-neutral-500">Postponed until</span>
                            <span className="text-amber-400">{new Date(s.postponed_until).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const postponeTo = new Date()
                            postponeTo.setHours(postponeTo.getHours() + 2)
                            adminActions.postponeFollowUp(s.sla_id, postponeTo.toISOString())
                          }}
                          className="flex-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-all"
                        >
                          <Pause className="w-3 h-3 inline mr-1" />Postpone 2h
                        </button>
                        <button
                          onClick={() => adminActions.completeFollowUp(s.sla_id)}
                          className="flex-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-all"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" />Complete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recently Completed */}
        {completedSLAs.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">Recently Completed</h3>
            <div className="space-y-1">
              {completedSLAs.slice(0, 10).map((s: any) => (
                <div key={s.sla_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/30 transition-all text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500/50 flex-shrink-0" />
                  <span className="text-neutral-400 truncate flex-1">{s.client_name}</span>
                  <span className="text-neutral-500">{s.caller_name}</span>
                  <span className="text-neutral-600">{s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                  <span className={`font-bold ${parseFloat(s.accrued_fee || 0) > 0 ? 'text-red-400/60' : 'text-neutral-600'}`}>
                    GH₵{parseFloat(s.accrued_fee || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Card Renderer ──
  const renderCard = (s: any) => {
    const pct = Math.min(Math.round((s.severity || 0) * 100), 150)
    const barColor = pct >= 100 ? '#ef4444' : pct >= 75 ? '#d97706' : pct >= 50 ? '#f59e0b' : '#22c55e'
    const stepInfo = PROJECT_STEPS[s.step] || { name: s.step_name || `Step ${s.step}`, owner: 'staff' }
    const ownerInfo = OWNER_BADGE[stepInfo.owner] || OWNER_BADGE.staff

    const deadlineMinutes = s.deadline || 0
    const remainingMinutes = Math.max(0, deadlineMinutes - (s.elapsed || 0))
    const overdueMinutes = Math.max(0, (s.elapsed || 0) - deadlineMinutes)

    return (
      <div
        key={s.project_id + '-' + s.step}
        className={`relative bg-neutral-900/50 border rounded-xl p-4 transition-all hover:border-neutral-600 overflow-hidden ${
          s.breached ? 'border-red-500/30' : pct >= 75 ? 'border-amber-500/20' : 'border-neutral-800'
        }`}
      >
        {/* Urgency glow */}
        {s.breached && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
        )}
        {pct >= 75 && !s.breached && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 to-transparent pointer-events-none" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative z-[1]">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{s.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-neutral-500">Step {s.step}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${ownerInfo.color}15`, color: ownerInfo.color }}>
                {ownerInfo.label}
              </span>
            </div>
          </div>
          <SLABadge status={s.snoozed ? 'snoozed' : s.breached ? 'breached' : 'active'} />
        </div>

        {/* Step name */}
        <p className="text-xs text-neutral-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {stepInfo.name}
        </p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
            />
          </div>
        </div>

        {/* Time info */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-neutral-500">
            {fmtElapsed(s.elapsed || 0)} elapsed
          </span>
          {s.breached ? (
            <span className="text-red-400 font-bold">
              OVERDUE: {fmtElapsed(overdueMinutes)} overdue
            </span>
          ) : (
            <span style={{ color: barColor }} className="font-bold">
              {fmtElapsed(remainingMinutes)} remaining
            </span>
          )}
        </div>
        <div className="text-right text-[10px] text-neutral-600 mt-0.5">
          Deadline: {fmtElapsed(deadlineMinutes)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800/50">
          {canSnooze && !s.snoozed && (
            <button
              onClick={() => adminActions.snoozeSla(s.project_id, 60)}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer transition-colors font-bold px-2 py-1 rounded hover:bg-amber-500/10"
            >
              <Pause className="w-3 h-3" /> Snooze 1h
            </button>
          )}
          {s.snoozed && (
            <span className="text-[10px] text-neutral-600 italic flex items-center gap-1">
              <Pause className="w-3 h-3" /> Snoozed
            </span>
          )}
          <button
            onClick={() => adminActions.setSection('projects')}
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-white cursor-pointer transition-colors ml-auto px-2 py-1 rounded hover:bg-neutral-800"
          >
            <Eye className="w-3 h-3" /> View Project
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">SLA Tracker</h2>
          <p className="text-sm text-neutral-500 mt-1">Real-time project deadline monitoring</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-sm bg-neutral-800 text-white font-bold">Dashboard</button>
          <button onClick={() => setTab('follow_ups')} className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors font-medium">
            Follow-Ups ({(callFollowUpSLA || []).filter((s: any) => s.status === 'active' || s.status === 'postponed').length})
          </button>
          <button onClick={() => setTab('costs')} className="px-4 py-2 rounded-lg text-sm text-neutral-500 hover:text-white cursor-pointer transition-colors font-medium">
            Costs ({slaCosts.length})
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading SLA data...</div>}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'all' as SLAFilter, label: 'Total Active', value: summary.total, icon: Shield, color: '#00bfff' },
          { id: 'on_track' as SLAFilter, label: 'On Track', value: summary.onTrack, icon: CheckCircle, color: '#22c55e' },
          { id: 'at_risk' as SLAFilter, label: 'At Risk', value: summary.atRisk, icon: Clock, color: '#f59e0b' },
          { id: 'breached' as SLAFilter, label: 'Breached', value: summary.breached, icon: AlertTriangle, color: '#ef4444' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setFilter(filter === m.id ? 'all' : m.id)}
            className={`text-left bg-neutral-900/50 border rounded-xl p-4 transition-all group relative overflow-hidden cursor-pointer ${
              filter === m.id
                ? 'border-neutral-600 shadow-lg'
                : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `linear-gradient(135deg, ${m.color} 0%, transparent 100%)` }} />
            <div className="relative z-[1]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${m.color}15` }}>
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{m.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-600" />
          <span className="text-xs text-neutral-500">{filtered.length} projects</span>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer transition-colors font-bold ml-2">
              Clear filter
            </button>
          )}
        </div>
        <button
          onClick={() => setGroupByStep(!groupByStep)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-all font-bold ${
            groupByStep
              ? 'bg-[#00bfff]/10 border-[#00bfff]/30 text-[#00bfff]'
              : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Group by Step
        </button>
      </div>

      {/* Cards Grid */}
      {!loading && filtered.length === 0 && (
        <div className="crm-metric text-center py-12">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-neutral-700" />
          </div>
          <p className="text-neutral-500 text-sm">No active SLAs {filter !== 'all' ? 'matching this filter' : 'found'}.</p>
          {filter !== 'all' && <p className="text-neutral-700 text-xs mt-1 cursor-pointer hover:text-white transition-colors" onClick={() => setFilter('all')}>View all</p>}
        </div>
      )}

      {grouped ? (
        // Grouped view
        <div className="space-y-6">
          {grouped.map(([stepLabel, items]) => (
            <div key={stepLabel}>
              <div className="flex items-center gap-2 mb-3">
                <ChevronDown className="w-4 h-4 text-neutral-600" />
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stepLabel}</h3>
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(renderCard)}
        </div>
      )}
    </div>
  )
}
