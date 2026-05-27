/**
 * SLASection — Rich, live SLA dashboard with countdown cards, urgency colors, and filtering.
 * Replaces the old DataTable-based SLA view.
 */
import { useEffect, useState, useMemo } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Clock, AlertTriangle, CheckCircle, Shield, ChevronDown, Pause, Eye, BarChart3, Filter } from 'lucide-react'
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

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    breached: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', label: 'Breached' },
    active:   { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', label: 'On Track' },
    snoozed:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Snoozed' },
  }
  const s = map[status] || map.active
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: s.bg, color: s.text }}>{s.label}</span>
}

export default function SLASection() {
  const { slaStatuses, slaCosts, slaConfig, loading, user } = useAdminStore()
  const [tab, setTab] = useState<'status' | 'costs'>('status')
  const [filter, setFilter] = useState<SLAFilter>('all')
  const [groupByStep, setGroupByStep] = useState(false)
  const [_tick, setTick] = useState(0)

  const role = user?.role || ''
  const canSnooze = ['Godmode', 'SuperAdmin', 'Admin'].includes(role)

  useEffect(() => { adminActions.loadSLA(); adminActions.loadSlaCosts() }, [])

  // Live ticker: re-render every 30s for countdown freshness
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // ── Filtered statuses ──
  const filtered = useMemo(() => {
    if (!slaStatuses) return []
    return slaStatuses.filter((s: any) => {
      if (filter === 'on_track') return !s.breached && s.severity < 0.75
      if (filter === 'at_risk') return !s.breached && s.severity >= 0.75
      if (filter === 'breached') return s.breached
      return true
    })
  }, [slaStatuses, filter, _tick])

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
    if (!groupByStep) return null
    const map: Record<string, any[]> = {}
    filtered.forEach((s: any) => {
      const key = `${s.step} — ${s.step_name}`
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, groupByStep])

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
          <Badge status={s.snoozed ? 'snoozed' : s.breached ? 'breached' : 'active'} />
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
              ⚠ {fmtElapsed(overdueMinutes)} overdue
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
