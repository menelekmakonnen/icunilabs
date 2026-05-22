import { useEffect, useState, useMemo, useRef } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Phone, TrendingUp, Users, Clock, Target, BarChart3, ChevronDown, Download, Calendar, Filter, FileText, Pencil, ArrowRight } from 'lucide-react'
import CallGuide from './CallGuide'

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
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'this_year' | 'all' | 'custom'

export default function CallSection() {
  const { callLogs, competitorIntel, clients } = useAdminStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'competitor'>('overview')
  const [dateFilter, setDateFilter] = useState<DateFilter>('this_week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  
  // Call Picker State
  const [showCallPicker, setShowCallPicker] = useState(false)
  const [callGuideClient, setCallGuideClient] = useState<any>(null)
  const callPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    adminActions.loadCallLogs()
    adminActions.loadCompetitorIntel()
    adminActions.loadClients()
  }, [])

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (callPickerRef.current && !callPickerRef.current.contains(e.target as Node)) {
        setShowCallPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditClient = (clientId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const client = clients?.find((c: any) => c.client_id === clientId)
    if (client) {
      // @ts-ignore
      if (adminActions.setActiveClientOptimistic) adminActions.setActiveClientOptimistic(client)
      // @ts-ignore
      if (adminActions.setSection) adminActions.setSection('clients')
    }
  }

  // ── Date Filtering Logic ──
  const filteredLogs = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let start: Date | null = null
    let end: Date | null = null

    switch (dateFilter) {
      case 'today':
        start = todayStart
        end = new Date(todayStart.getTime() + 86400000)
        break
      case 'yesterday':
        start = new Date(todayStart.getTime() - 86400000)
        end = todayStart
        break
      case 'this_week': {
        const day = now.getDay() || 7 // Mon=1, Sun=7
        start = new Date(todayStart.getTime() - (day - 1) * 86400000)
        end = new Date(start.getTime() + 7 * 86400000)
        break
      }
      case 'last_week': {
        const day = now.getDay() || 7
        const thisWeekStart = new Date(todayStart.getTime() - (day - 1) * 86400000)
        start = new Date(thisWeekStart.getTime() - 7 * 86400000)
        end = thisWeekStart
        break
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear() + 1, 0, 1)
        break
      case 'custom':
        if (customStart) start = new Date(customStart)
        if (customEnd) {
          end = new Date(customEnd)
          end.setDate(end.getDate() + 1) // include end day
        }
        break
    }

    if (!start && !end) return callLogs

    return callLogs.filter(log => {
      const d = new Date(log.call_start)
      if (start && d < start) return false
      if (end && d >= end) return false
      return true
    })
  }, [callLogs, dateFilter, customStart, customEnd])

  // ── Client-Side Analytics ──
  const analytics = useMemo(() => {
    let totalDuration = 0
    let meetings = 0
    const paths: Record<string, number> = {}
    const pathMeetings: Record<string, number> = {}
    const outcomes: Record<string, number> = {}
    const callers: Record<string, { calls: number; meetings: number; name: string }> = {}

    filteredLogs.forEach(log => {
      totalDuration += Number(log.duration_seconds || 0)
      if (log.outcome === 'meeting_booked') meetings++

      // Outcomes
      const out = log.outcome || 'unknown'
      outcomes[out] = (outcomes[out] || 0) + 1

      // Paths
      const p = log.path_loaded || 'unknown'
      paths[p] = (paths[p] || 0) + 1
      if (log.outcome === 'meeting_booked') {
        pathMeetings[p] = (pathMeetings[p] || 0) + 1
      }

      // Callers
      const caller = log.caller_email || 'unknown'
      if (!callers[caller]) {
        callers[caller] = { calls: 0, meetings: 0, name: log.caller_name || caller }
      }
      callers[caller].calls++
      if (log.outcome === 'meeting_booked') callers[caller].meetings++
    })

    const avgDuration = filteredLogs.length ? Math.round(totalDuration / filteredLogs.length) : 0

    // Conversion by Path
    const conversionByPath = Object.keys(paths).map(p => ({
      path: p,
      calls: paths[p],
      meetings: pathMeetings[p] || 0,
      rate: paths[p] ? Math.round(((pathMeetings[p] || 0) / paths[p]) * 100) : 0
    })).sort((a, b) => b.rate - a.rate)

    // Leaderboard
    const leaderboard = Object.values(callers).map(c => ({
      ...c,
      conversionRate: c.calls ? Math.round((c.meetings / c.calls) * 100) : 0
    })).sort((a, b) => b.meetings - a.meetings || b.calls - a.calls)

    return {
      calls: filteredLogs.length,
      avgDuration,
      meetings,
      pathCounts: paths,
      conversionByPath,
      outcomeCounts: outcomes,
      callerLeaderboard: leaderboard
    }
  }, [filteredLogs])

  // ── CSV Export ──
  const handleExport = () => {
    if (!filteredLogs.length) return
    
    const headers = ['Date', 'Client', 'Caller', 'Path', 'Outcome', 'Duration (s)', 'Notes', 'Pipeline Auto-Advanced', 'Points Checked', 'Total Points']
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        let ptsChecked = 0
        try { ptsChecked = JSON.parse(log.talking_points_checked || '[]').length } catch {}
        
        return [
          `"${new Date(log.call_start).toISOString()}"`,
          `"${(log.client_name || '').replace(/"/g, '""')}"`,
          `"${(log.caller_name || log.caller_email || '').replace(/"/g, '""')}"`,
          `"${(PATH_LABELS[log.path_loaded] || log.path_loaded || '').replace(/"/g, '""')}"`,
          `"${(OUTCOME_LABELS[log.outcome] || log.outcome || '').replace(/"/g, '""')}"`,
          log.duration_seconds || 0,
          `"${(log.call_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(log.pipeline_auto_advanced || '').replace(/"/g, '""')}"`,
          ptsChecked,
          log.talking_points_total || 0
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `icuni_call_report_${dateFilter}_${new Date().getTime()}.csv`
    link.click()
  }

  return (
    <div className="crm-fade-in p-6 h-full flex flex-col">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-[#00bfff]" /> Call Dashboard
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Advanced analytics and call activity monitoring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-neutral-900/50 p-2 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 pr-4 border-r border-neutral-800">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="bg-transparent text-sm text-white font-medium outline-none cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 text-sm pr-4 border-r border-neutral-800">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded outline-none border border-neutral-700" />
              <span className="text-neutral-500">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-neutral-800 text-neutral-300 px-2 py-1 rounded outline-none border border-neutral-700" />
            </div>
          )}

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors border border-neutral-700">
            <Download className="w-4 h-4" /> Export
          </button>
          
          <div className="relative border-l border-neutral-800 pl-4 ml-1" ref={callPickerRef}>
            <button
              onClick={() => setShowCallPicker(!showCallPicker)}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-sm font-bold cursor-pointer hover:bg-emerald-500/15 hover:border-emerald-400/40 transition-all"
            >
              <Phone className="w-4 h-4" />
              Start Call
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-60" />
            </button>
            {showCallPicker && (
              <div className="absolute top-full right-0 mt-2 w-80 max-h-72 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 py-1"
                style={{ scrollbarWidth: 'thin' }}>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Select a contact</p>
                {(!clients || clients.length === 0) && (
                  <p className="px-3 py-4 text-xs text-neutral-500 text-center">No contacts yet</p>
                )}
                {(clients || []).map((cl: any) => (
                  <button key={cl.client_id}
                    onClick={() => { setCallGuideClient(cl); setShowCallPicker(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-neutral-800/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(cl.name || cl.company || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{cl.name || cl.company || 'Unnamed'}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{cl.company || 'No company'} • {cl.phone || 'No phone'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-800">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'logs', label: `Call Logs (${filteredLogs.length})`, icon: FileText },
          { id: 'competitor', label: 'Competitor Intel', icon: TrendingUp }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === t.id ? 'border-[#00bfff] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="crm-fade-in space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Calls', value: analytics.calls, icon: Phone, color: '#00bfff' },
                { label: 'Avg Duration', value: fmtDuration(analytics.avgDuration), icon: Clock, color: '#f59e0b' },
                { label: 'Meetings Booked', value: analytics.meetings, icon: Target, color: '#10b981' },
                { label: 'Overall Conversion', value: `${analytics.calls ? Math.round((analytics.meetings / analytics.calls) * 100) : 0}%`, icon: TrendingUp, color: '#8b5cf6' },
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leaderboard */}
              <div className="crm-metric">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#8b5cf6]" />
                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Associate Leaderboard</p>
                </div>
                {analytics.callerLeaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.callerLeaderboard.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-neutral-300/20 text-neutral-300' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-600'}`}>{i + 1}</span>
                          <span className="text-sm text-white font-medium">{c.name.split('@')[0]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-neutral-500"><span className="text-white">{c.calls}</span> calls</span>
                          <span className="text-emerald-400 font-bold">{c.meetings} mtgs</span>
                          <span className="text-[#00bfff] font-bold">{c.conversionRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-neutral-600 text-sm">No caller data in this period.</p>}
              </div>

              {/* Path Conversions */}
              <div className="crm-metric">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-4">Path Performance</p>
                {analytics.conversionByPath.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.conversionByPath.map((data, i) => {
                      const maxCalls = Math.max(...analytics.conversionByPath.map(d => d.calls))
                      return (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-300 font-medium">{PATH_LABELS[data.path] || data.path}</span>
                            <div className="flex gap-3">
                              <span className="text-neutral-500">{data.meetings}/{data.calls}</span>
                              <span className={`font-bold ${data.rate > 20 ? 'text-emerald-400' : data.rate > 10 ? 'text-amber-400' : 'text-neutral-400'}`}>{data.rate}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#00bfff] to-[#0099cc]" style={{ width: `${(data.calls / maxCalls) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <p className="text-neutral-600 text-sm">No path data in this period.</p>}
              </div>
            </div>

            {/* Outcome Distribution */}
            <div className="crm-metric">
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-4">Outcome Distribution</p>
              {Object.keys(analytics.outcomeCounts).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {Object.entries(analytics.outcomeCounts).sort((a, b) => b[1] - a[1]).map(([outcome, count]) => (
                    <div key={outcome} className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800 text-center">
                      <p className="text-xl font-bold text-white mb-1">{count}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">{OUTCOME_LABELS[outcome] || outcome}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-neutral-600 text-sm">No outcomes recorded in this period.</p>}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="crm-fade-in crm-metric">
            {filteredLogs.length > 0 ? (
              <div className="space-y-0">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLog === log.call_id
                  let ptsChecked = 0
                  try { ptsChecked = JSON.parse(log.talking_points_checked || '[]').length } catch {}

                  return (
                    <div key={log.call_id} className="border-b border-neutral-800/50 last:border-0">
                      <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-neutral-900/30 px-2 rounded-lg transition-colors" onClick={() => setExpandedLog(isExpanded ? null : log.call_id)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-neutral-400" />
                          </div>
                          <div>
                            <span 
                              className="text-sm text-white font-medium block hover:text-[#00bfff] transition-colors truncate max-w-[200px] sm:max-w-xs" 
                              onClick={(e) => {
                                if (log.client_id) handleEditClient(log.client_id, e)
                              }}
                            >
                              {log.client_name || 'Unknown Prospect'}
                            </span>
                            <span className="text-[10px] text-neutral-500">{log.contact_name || log.caller_name || log.caller_email} {log.contact_phone ? `• ${log.contact_phone}` : ''} • {fmtDate(log.call_start)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-neutral-500 hidden sm:block">{PATH_LABELS[log.path_loaded] || log.path_loaded}</span>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${log.outcome === 'meeting_booked' ? 'bg-emerald-500/15 text-emerald-400' : log.outcome === 'no_interest' ? 'bg-red-500/15 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                            {OUTCOME_LABELS[log.outcome] || log.outcome}
                          </span>
                          <span className="text-neutral-400 font-mono hidden sm:block">{fmtDuration(Number(log.duration_seconds || 0))}</span>
                          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="pb-4 pt-2 pl-12 pr-4 text-sm text-neutral-400 space-y-3 bg-neutral-900/10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Call Notes</p>
                              <p className="bg-neutral-900/50 p-3 rounded border border-neutral-800 text-white whitespace-pre-wrap">{log.call_notes || <span className="italic text-neutral-600">No notes recorded</span>}</p>
                            </div>
                            <div className="space-y-3">
                              {log.next_action && (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded">
                                  <p className="text-[10px] text-emerald-500/80 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1">
                                    <ArrowRight className="w-3 h-3" /> Next Action
                                  </p>
                                  <p className="text-white text-sm font-medium">{log.next_action.replace(/_/g, ' ')}</p>
                                  {log.next_action_date && <p className="text-xs text-neutral-400 mt-0.5">Date: {fmtDate(log.next_action_date)}</p>}
                                  {log.next_action_notes && <p className="text-xs text-neutral-500 mt-1 italic">"{log.next_action_notes}"</p>}
                                </div>
                              )}
                              
                              <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Talking Points Coverage</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00bfff]" style={{ width: `${log.talking_points_total ? (ptsChecked / log.talking_points_total) * 100 : 0}%` }} />
                                  </div>
                                  <span className="font-bold text-white">{ptsChecked}/{log.talking_points_total || 0}</span>
                                </div>
                              </div>
                              {log.pipeline_auto_advanced && (
                                <div>
                                  <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Pipeline Action</p>
                                  <p className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 w-max px-2 py-1 rounded">
                                    <Target className="w-3.5 h-3.5" /> Auto-advanced to {log.pipeline_auto_advanced}
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/50 mt-2">
                                {log.client_id && (
                                  <button onClick={(e) => handleEditClient(log.client_id, e)} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#00bfff] transition-colors py-1 px-2 rounded hover:bg-neutral-800">
                                    <Pencil className="w-3.5 h-3.5" /> Edit Client
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-neutral-500">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No call logs found for this date range.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitor' && (
          <div className="crm-fade-in crm-metric">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#ff7a00]" />
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold">Competitor Intelligence Database</p>
            </div>
            {competitorIntel.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-900/80 text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 font-bold">System Name</th>
                      <th className="px-4 py-3 font-bold">Developer</th>
                      <th className="px-4 py-3 font-bold text-center">Encounters</th>
                      <th className="px-4 py-3 font-bold">Industries</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {competitorIntel.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{c.system_name}</td>
                        <td className="px-4 py-3 text-neutral-400">{c.developer || '—'}</td>
                        <td className="px-4 py-3 text-center text-[#00bfff] font-bold">{c.count}</td>
                        <td className="px-4 py-3 text-neutral-500">
                          <div className="flex flex-wrap gap-1">
                            {(c.industries || []).map((ind: string) => (
                              <span key={ind} className="bg-neutral-800 px-2 py-0.5 rounded text-[10px]">{ind}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neutral-600 text-sm py-4">No competitor intelligence gathered yet.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Call Guide Overlay */}
      {callGuideClient && (
        <CallGuide client={callGuideClient} onClose={() => setCallGuideClient(null)} />
      )}
    </div>
  )
}
