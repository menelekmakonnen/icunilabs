import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Users, FolderOpen, FileText, AlertTriangle, TrendingUp, Clock, Flame, Trophy, Star } from 'lucide-react'

const card = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-5'

// ── Heatmap helpers ──
function buildHeatmap(logs: any[], days: number) {
  const map = new Map<string, number>()
  logs.forEach((l: any) => {
    if (!l.timestamp) return
    const d = new Date(l.timestamp).toISOString().split('T')[0]
    map.set(d, (map.get(d) || 0) + 1)
  })
  const cells: { date: string; count: number; level: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const count = map.get(ds) || 0
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 10 ? 3 : 4
    cells.push({ date: ds, count, level })
  }
  return cells
}

function buildWeeks(cells: { date: string; count: number; level: number }[]) {
  const w: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
  return w
}

const LEVEL_COLORS = ['rgba(255,255,255,0.03)', 'rgba(0,191,255,0.2)', 'rgba(0,191,255,0.4)', 'rgba(0,191,255,0.6)', 'rgba(0,191,255,0.85)']

export default function DashboardSection() {
  const s = useAdminStore()
  useEffect(() => { adminActions.loadDashboard() }, [])

  const activeProjects = s.projects.filter((p: any) => p.status === 'active').length
  const pendingInvoices = s.invoices.filter((i: any) => i.status === 'pending' || i.status === 'partial').length
  const totalRevenue = s.invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
  const breached = s.slaStatuses.filter((st: any) => st.breached).length

  // Heatmap from activity logs
  const heatmapCells = useMemo(() => buildHeatmap(s.logs, 365), [s.logs])
  const weeks = useMemo(() => buildWeeks(heatmapCells), [heatmapCells])
  const activeDays = heatmapCells.filter(c => c.count > 0).length
  const currentStreak = useMemo(() => {
    let streak = 0
    for (let i = heatmapCells.length - 1; i >= 0; i--) {
      if (heatmapCells[i].count > 0) streak++; else break
    }
    return streak
  }, [heatmapCells])
  const busiestDay = heatmapCells.reduce((best, c) => c.count > (best?.count || 0) ? c : best, heatmapCells[0])
  const totalActions = heatmapCells.reduce((s, c) => s + c.count, 0)

  // Analytics: Project type breakdown
  const projectTypes = useMemo(() => {
    const map = new Map<string, number>()
    s.projects.forEach((p: any) => {
      const t = p.type || 'Other'
      map.set(t, (map.get(t) || 0) + 1)
    })
    return Array.from(map.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
  }, [s.projects])

  const typeTotal = projectTypes.reduce((s, t) => s + t.count, 0) || 1
  const TYPE_COLORS = ['#00bfff', '#8b5cf6', '#ff7a00', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#06b6d4']
  let arcOffset = 0
  const typeArcs = projectTypes.map((item, i) => {
    const pct = item.count / typeTotal; const dash = pct * 251.2; const gap = 251.2 - dash; const offset = arcOffset; arcOffset += dash
    return { ...item, dash, gap, offset, color: TYPE_COLORS[i % TYPE_COLORS.length] }
  })

  // Revenue by month (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; amount: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-GB', { month: 'short' })
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const amount = s.invoices.filter((inv: any) => inv.status === 'paid' && (inv.paid_date || inv.created_at || '').startsWith(ym))
        .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0)
      months.push({ label, amount })
    }
    return months
  }, [s.invoices])
  const maxRevMonth = Math.max(...monthlyRevenue.map(m => m.amount), 1)

  // CRM Feed: recent prospect updates
  const recentProspects = useMemo(() => {
    return s.clients
      .filter((c: any) => {
        const stage = c.prospect_stage || 'new_lead'
        return stage !== 'won' && stage !== 'lost'
      })
      .sort((a: any, b: any) => new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime())
      .slice(0, 5)
  }, [s.clients])

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

  const stats = [
    { label: 'Active Clients', value: s.clients.length, icon: Users, color: '#00bfff' },
    { label: 'Active Projects', value: activeProjects, icon: FolderOpen, color: '#ff7a00' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: '#d97706' },
    { label: 'Total Revenue', value: `GH\u20B5${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'SLA Breaches', value: breached, icon: AlertTriangle, color: breached > 0 ? '#ef4444' : '#22c55e' },
    { label: 'Total Actions', value: totalActions, icon: Clock, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Dashboard</h2>
        <p className="text-sm text-neutral-500 mt-1">Welcome back, {s.user?.name}</p>
      </div>

      {s.loading && <div className="text-center py-8 text-neutral-500 text-sm">Loading dashboard data...</div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((st, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`${card} hover:border-neutral-700 transition-colors`}>
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

      {/* ═══ STREAK BAR ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className={`${card} flex items-center gap-8 flex-wrap`}>
        <div className="flex items-center gap-3">
          <Flame className="w-6 h-6" style={{ color: currentStreak > 0 ? '#ff7a00' : '#475569' }} />
          <div>
            <div className="text-2xl font-black" style={{ color: currentStreak > 0 ? '#ff7a00' : '#64748b' }}>{currentStreak}</div>
            <div className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Day Streak</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-[#00bfff]" />
          <div>
            <div className="text-lg font-bold text-white">{activeDays}</div>
            <div className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Active Days (Year)</div>
          </div>
        </div>
        {busiestDay && busiestDay.count > 0 && (
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-lg font-bold text-white">{busiestDay.count} actions</div>
              <div className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Best Day ({busiestDay.date})</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ BUILDING HEATMAP ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Building Heatmap — {activeDays} active days
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-neutral-600">
            <span>Less</span>
            {LEVEL_COLORS.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-[3px] overflow-x-auto justify-center py-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) => (
                <div key={ci} className="w-3 h-3 rounded-sm transition-all hover:outline hover:outline-1 hover:outline-neutral-600 hover:outline-offset-1"
                  style={{ background: LEVEL_COLORS[cell.level], cursor: cell.count > 0 ? 'pointer' : 'default' }}
                  title={`${cell.date}: ${cell.count} actions`} />
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ ANALYTICS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Type Ring */}
        {typeArcs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className={card}>
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

        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Revenue Trend (6 Months)</h3>
          <div className="flex items-end gap-3 h-32">
            {monthlyRevenue.map((m, i) => {
              const pct = Math.max((m.amount / maxRevMonth) * 100, 4)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-neutral-500 font-semibold">{m.amount > 0 ? `${(m.amount / 1000).toFixed(0)}k` : ''}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                    className="w-full rounded-t-md" style={{ background: `linear-gradient(180deg, #00bfff, ${m.amount > 0 ? '#0099cc' : 'rgba(255,255,255,0.03)'})`, minHeight: 4 }}
                    title={`GH\u20B5${m.amount.toLocaleString()}`} />
                  <span className="text-[10px] text-neutral-600">{m.label}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ═══ CRM FEED + SLA ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CRM Feed */}
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
                  onClick={() => { adminActions.setSection('clients') }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: STAGE_COLORS[c.prospect_stage] || '#475569' }}>
                    {(c.name || '?').charAt(0)}
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

        {/* SLA Health */}
        <div className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">SLA Health</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {s.slaStatuses.length === 0 && <p className="text-sm text-neutral-600 py-4 text-center">No active SLAs</p>}
            {s.slaStatuses.slice(0, 8).map((sla: any, i: number) => {
              const pct = Math.min(Math.round((sla.severity || 0) * 100), 150)
              const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#d97706' : '#22c55e'
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{sla.title}</div>
                    <div className="text-xs text-neutral-500">{sla.step_name} — {Math.round(sla.elapsed / 60)}h elapsed</div>
                  </div>
                  <div className="w-24">
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

      {/* Recent Activity */}
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
    </div>
  )
}
