import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Phone, TrendingUp, Users, Clock, Target, BarChart3, ChevronDown } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  wc_receptionist: 'WC Receptionist',
  wc_decision_maker: 'WC Decision-Maker',
  bc_front_desk: 'BC Front Desk',
  bc_mr_cooper: 'BC Mr Cooper',
  bc_owner: 'BC Owner',
}

const OUTCOME_LABELS: Record<string, string> = {
  meeting_booked: 'Meeting Booked',
  callback_scheduled: 'Callback Scheduled',
  interested_will_revert: 'Interested',
  no_interest: 'No Interest',
  needs_follow_up: 'Follow-Up',
}

function fmtDuration(sec: number) {
  if (!sec) return '0:00'
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtDate(d: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

export default function CallDashboard() {
  const { callAnalytics, callLogs, competitorIntel } = useAdminStore()
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    adminActions.loadCallAnalytics()
    adminActions.loadCallLogs()
    adminActions.loadCompetitorIntel()
  }, [])

  const a = callAnalytics || {} as any

  return (
    <div className="crm-fade-in">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Calls Today', value: a.callsToday ?? '—', icon: Phone, color: '#00bfff' },
          { label: 'This Week', value: a.callsThisWeek ?? '—', icon: BarChart3, color: '#8b5cf6' },
          { label: 'Avg Duration', value: fmtDuration(a.avgDuration || 0), icon: Clock, color: '#f59e0b' },
          { label: 'Meetings (Week)', value: a.meetingsThisWeek ?? '—', icon: Target, color: '#10b981' },
        ].map((m, i) => (
          <div key={i} className="crm-metric">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">{m.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Calls by Path */}
        <div className="crm-metric">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-3">Calls by Path</p>
          {a.pathCounts ? Object.entries(a.pathCounts).sort((a: any, b: any) => b[1] - a[1]).map(([path, count]: any) => {
            const maxCount = Math.max(...Object.values(a.pathCounts as Record<string, number>))
            return (
              <div key={path} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">{PATH_LABELS[path] || path}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00bfff] to-[#0099cc] transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
              </div>
            )
          }) : <p className="text-neutral-600 text-xs">No data yet</p>}
        </div>

        {/* Conversion by Path */}
        <div className="crm-metric">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-3">Conversion Rate by Path</p>
          {a.conversionByPath ? Object.entries(a.conversionByPath).map(([path, data]: any) => (
            <div key={path} className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0">
              <span className="text-xs text-neutral-400">{PATH_LABELS[path] || path}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-neutral-600">{data.meetings}/{data.calls} calls</span>
                <span className={`text-sm font-bold ${data.rate > 20 ? 'text-emerald-400' : data.rate > 10 ? 'text-amber-400' : 'text-neutral-500'}`}>{data.rate}%</span>
              </div>
            </div>
          )) : <p className="text-neutral-600 text-xs">No data yet</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Outcome Distribution */}
        <div className="crm-metric">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-3">Outcome Distribution</p>
          {a.outcomeCounts ? Object.entries(a.outcomeCounts).sort((a: any, b: any) => b[1] - a[1]).map(([outcome, count]: any) => (
            <div key={outcome} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-neutral-400">{OUTCOME_LABELS[outcome] || outcome}</span>
              <span className="text-sm font-bold text-white">{count}</span>
            </div>
          )) : <p className="text-neutral-600 text-xs">No data yet</p>}
        </div>

        {/* Leaderboard */}
        <div className="crm-metric">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Associate Leaderboard</p>
          </div>
          {(a.callerLeaderboard || []).length > 0 ? a.callerLeaderboard.map((c: any, i: number) => (
            <div key={c.email} className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-600 w-4">{i + 1}</span>
                <span className="text-sm text-white font-medium">{c.name || c.email.split('@')[0]}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-neutral-500">{c.calls} calls</span>
                <span className="text-emerald-400 font-bold">{c.meetings} mtgs</span>
                <span className="text-[#00bfff] font-bold">{c.conversionRate}%</span>
              </div>
            </div>
          )) : <p className="text-neutral-600 text-xs">Needs 2+ associates with call data</p>}
        </div>
      </div>

      {/* Competitor Intel */}
      {competitorIntel.length > 0 && (
        <div className="crm-metric mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#ff7a00]" />
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Competitor Intel</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-neutral-600 border-b border-neutral-800">
                <th className="text-left py-2 font-bold">System</th>
                <th className="text-left py-2 font-bold">Developer</th>
                <th className="text-center py-2 font-bold">Seen</th>
                <th className="text-left py-2 font-bold">Industries</th>
              </tr></thead>
              <tbody>
                {competitorIntel.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-neutral-800/30">
                    <td className="py-2 text-white font-medium">{c.system_name}</td>
                    <td className="py-2 text-neutral-400">{c.developer || '—'}</td>
                    <td className="py-2 text-center text-[#00bfff] font-bold">{c.count}</td>
                    <td className="py-2 text-neutral-500">{(c.industries || []).join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Calls Log */}
      <div className="crm-metric">
        <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-3">Recent Calls</p>
        {callLogs.length > 0 ? callLogs.slice(0, 20).map((log: any) => (
          <div key={log.call_id} className="border-b border-neutral-800/30 last:border-0">
            <div className="flex items-center justify-between py-2.5 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.call_id ? null : log.call_id)}>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center">
                  <Phone className="w-3 h-3 text-neutral-500" />
                </div>
                <div>
                  <span className="text-sm text-white font-medium">{log.client_name || 'Unknown'}</span>
                  <span className="text-[10px] text-neutral-600 ml-2">{PATH_LABELS[log.path_loaded] || log.path_loaded}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${log.outcome === 'meeting_booked' ? 'bg-emerald-500/15 text-emerald-400' : log.outcome === 'no_interest' ? 'bg-red-500/15 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  {OUTCOME_LABELS[log.outcome] || log.outcome}
                </span>
                <span className="text-neutral-600">{fmtDuration(Number(log.duration_seconds || 0))}</span>
                <span className="text-neutral-700">{fmtDate(log.call_start)}</span>
                <ChevronDown className={`w-3 h-3 text-neutral-600 transition-transform ${expandedLog === log.call_id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expandedLog === log.call_id && (
              <div className="pb-3 pl-9 text-xs text-neutral-500 space-y-1">
                <p><span className="text-neutral-600 font-bold">Caller:</span> {log.caller_name}</p>
                <p><span className="text-neutral-600 font-bold">Points:</span> {log.talking_points_checked ? JSON.parse(log.talking_points_checked).length : 0}/{log.talking_points_total} covered</p>
                {log.call_notes && <p><span className="text-neutral-600 font-bold">Notes:</span> {log.call_notes}</p>}
                {log.pipeline_auto_advanced && <p className="text-emerald-400"><span className="font-bold">Auto-advanced:</span> {log.pipeline_auto_advanced}</p>}
              </div>
            )}
          </div>
        )) : <p className="text-neutral-600 text-xs py-4 text-center">No calls logged yet. Start a call from any prospect card.</p>}
      </div>
    </div>
  )
}
