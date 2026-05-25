import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Users, FolderOpen, FileText, AlertTriangle, TrendingUp, Flame } from 'lucide-react'

const card = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 sm:p-5'

export default function DashboardSection() {
  const s = useAdminStore()
  useEffect(() => { adminActions.loadDashboard() }, [])

  const activeProjects = s.projects.filter((p: any) => p.status === 'active').length
  const pendingInvoices = s.invoices.filter((i: any) => i.status === 'pending' || i.status === 'partial').length
  const totalRevenue = s.invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
  const breached = s.slaStatuses.filter((st: any) => st.breached).length
  const weekAgo = useMemo(() => new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0], [])


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

  // Client = someone who has paid (prospect_stage=won or client). Everything else is a prospect/lead.
  const allContacts = s.clients.filter((c: any) => (c.status || '').toLowerCase() !== 'deleted')
  const payingClients = allContacts.filter((c: any) => ['won', 'client'].includes((c.prospect_stage || '').toLowerCase())).length
  const pipelineCount = allContacts.length - payingClients

  const stats = [
    { label: 'Paying Clients', value: payingClients, icon: Users, color: '#10b981' },
    { label: 'In Pipeline', value: pipelineCount, icon: TrendingUp, color: '#00bfff' },
    { label: 'Active Projects', value: activeProjects, icon: FolderOpen, color: '#ff7a00' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: '#d97706' },
    { label: 'Total Revenue', value: `GH\u20B5${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#10b981' },
    { label: 'SLA Breaches', value: breached, icon: AlertTriangle, color: breached > 0 ? '#ef4444' : '#22c55e' },
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

      {/* ═══ ANALYTICS ROW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Type Ring */}
        {typeArcs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
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
      </div>

      {/* ═══ OPS PIPELINE + CHALLENGE HIT RATE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ops Pipeline Widget */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className={card}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff7a00]" />
              Ops Pipeline
            </h3>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => { adminActions.setSection('clients'); /* LinkExtractor will be opened from CRM */ }}
                className="flex items-center gap-1.5 text-xs text-[#8b5cf6] hover:text-white cursor-pointer transition-colors font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><path d="M11 8v6" /><path d="M8 11h6" />
                </svg>
                <span className="hidden sm:inline">Search and Add</span>
                <span className="sm:hidden">Add</span>
              </button>
              <div className="w-px h-3 bg-neutral-700" />
              <button onClick={() => adminActions.setSection('clients')} className="text-xs text-[#00bfff] hover:text-white cursor-pointer transition-colors"><span className="hidden sm:inline">Open </span>CRM</button>
            </div>
          </div>
          {(() => {
            const prospects = s.clients.filter((c: any) => {
              const stage = c.prospect_stage || 'new_lead'
              return ['prospect', 'new_lead', 'contacted', 'qualified'].includes(stage)
            })
            // weekAgo computed in component body via useMemo
            const addedThisWeek = prospects.filter((c: any) => (c.created_at || '') >= weekAgo).length
            const awaitingContact = prospects.filter((c: any) => (c.prospect_stage || 'new_lead') === 'prospect').length
            const qualified = prospects.filter((c: any) => (c.prospect_stage || 'new_lead') === 'qualified').length
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Total', value: prospects.length, color: '#00bfff' },
                    { label: 'This Week', value: addedThisWeek, color: '#ff7a00' },
                    { label: 'Awaiting', value: awaitingContact, color: '#64748b' },
                    { label: 'Qualified', value: qualified, color: '#f59e0b' },
                  ].map((m, i) => (
                    <div key={i} className="text-center p-2 bg-neutral-900/50 rounded-lg border border-neutral-800/50">
                      <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}</div>
                      <div className="text-[9px] text-neutral-600 uppercase tracking-wider">{m.label}</div>
                    </div>
                  ))}
                </div>
                {prospects.length === 0 && <p className="text-sm text-neutral-600 text-center py-2">No active prospects. Start prospecting!</p>}
              </div>
            )
          })()}
        </motion.div>

        {/* Challenge Hit Rate */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className={card}>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            Challenge Hit Rate
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
