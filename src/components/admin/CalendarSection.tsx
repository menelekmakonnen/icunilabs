import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { ChevronLeft, ChevronRight, RefreshCw, Calendar as CalIcon, X, Phone, Video, MapPin, Clock, ExternalLink } from 'lucide-react'

type CalView = 'month' | 'week' | 'day'

const STAGE_COLORS: Record<string, string> = {
  booked: '#00bfff', confirmed: '#8b5cf6', prep: '#a855f7',
  on_day: '#ff7a00', post_meeting: '#f59e0b', qualified: '#22c55e',
}
const STAGE_LABELS: Record<string, string> = {
  booked: 'Booked', confirmed: 'Confirmed', prep: 'Prep', on_day: 'On-Day',
  post_meeting: 'Post-Meeting', qualified: 'Qualified',
}
const OUTCOME_LABELS: Record<string, string> = {
  callback_scheduled: 'Callback', needs_follow_up: 'Follow-Up',
  meeting_booked: 'Meeting', interested_will_revert: 'Interested',
}

function eventColor(ev: any): string {
  if (ev.source === 'callback') return '#f59e0b'
  if (ev.source === 'google') return '#6b7280'
  return STAGE_COLORS[ev.stage] || '#00bfff'
}
function eventBadge(ev: any): string {
  if (ev.source === 'callback') return OUTCOME_LABELS[ev.outcome] || 'Callback'
  if (ev.source === 'google') return 'Google'
  return STAGE_LABELS[ev.stage] || 'Meeting'
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function startOfWeek(d: Date): Date { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1) }
function fmtTime12(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  if (isNaN(hr)) return t
  const ap = hr >= 12 ? 'PM' : 'AM'
  return `${hr % 12 || 12}:${m || '00'} ${ap}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarSection() {
  const { clients } = useAdminStore()
  const [view, setView] = useState<CalView>(() => {
    try { return (localStorage.getItem('icuni_cal_view') as CalView) || 'month' } catch { return 'month' }
  })
  const [cursor, setCursor] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => { try { localStorage.setItem('icuni_cal_view', view) } catch { /* ignore */ } }, [view])

  const range = useMemo(() => {
    if (view === 'day') return { from: cursor, to: cursor }
    if (view === 'week') { const s = startOfWeek(cursor); return { from: s, to: addDays(s, 6) } }
    const gridStart = startOfWeek(startOfMonth(cursor))
    return { from: gridStart, to: addDays(gridStart, 41) }
  }, [view, cursor])

  const load = useCallback(async () => {
    setLoading(true)
    const evs = await adminActions.getCalendarEvents(ymd(range.from), ymd(range.to))
    setEvents(Array.isArray(evs) ? evs : [])
    setLoading(false)
  }, [range.from, range.to])

  useEffect(() => { load() }, [load])

  const eventsByDay = useMemo(() => {
    const map: Record<string, any[]> = {}
    events.forEach((ev: any) => {
      if (!ev.date) return
      ;(map[ev.date] = map[ev.date] || []).push(ev)
    })
    Object.keys(map).forEach(k => map[k].sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99'))))
    return map
  }, [events])

  const doSync = async () => {
    setSyncing(true)
    await adminActions.syncCalendar()
    await load()
    setSyncing(false)
  }

  const go = (dir: number) => {
    if (view === 'day') setCursor(c => addDays(c, dir))
    else if (view === 'week') setCursor(c => addDays(c, dir * 7))
    else setCursor(c => new Date(c.getFullYear(), c.getMonth() + dir, 1))
  }
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCursor(d) }

  const title = useMemo(() => {
    if (view === 'day') return cursor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'week') {
      const s = startOfWeek(cursor); const e = addDays(s, 6)
      return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }, [view, cursor])

  const openEvent = (ev: any) => {
    if (ev.source === 'meeting') { adminActions.setSection('meetings'); return }
    if (ev.source === 'callback' && ev.client_id) {
      const c = (clients || []).find((x: any) => x.client_id === ev.client_id)
      if (c) adminActions.setActiveClientOptimistic(c)
      adminActions.setSection('clients')
    }
  }

  const todayStr = ymd(new Date())

  return (
    <div className="space-y-4">
      {/* Header / controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
            <CalIcon className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Calendar</h2>
            <p className="text-[11px] text-neutral-500">Meetings, callbacks &amp; Google Calendar — {loading ? 'loading…' : `${events.length} event${events.length !== 1 ? 's' : ''}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-neutral-900/60 border border-neutral-800 rounded-lg overflow-hidden">
            {(['month', 'week', 'day'] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-bold capitalize cursor-pointer transition-all ${view === v ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' : 'text-neutral-500 hover:text-white'}`}>{v}</button>
            ))}
          </div>
          <button onClick={doSync} disabled={syncing} title="Push upcoming meetings to Google Calendar"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 hover:text-white cursor-pointer transition-all disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync Google'}
          </button>
        </div>
      </div>

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => go(-1)} className="p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer transition-all">Today</button>
          <button onClick={() => go(1)} className="p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#00bfff' }} /> Meeting</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} /> Callback</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: '#6b7280' }} /> Google</span>
        </div>
      </div>

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-800">
            {WEEKDAYS.map(d => <div key={d} className="px-2 py-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, i) => addDays(range.from, i)).map((day, i) => {
              const ds = ymd(day)
              const inMonth = day.getMonth() === cursor.getMonth()
              const dayEvents = eventsByDay[ds] || []
              const isToday = ds === todayStr
              return (
                <div key={i} className={`min-h-[92px] border-b border-r border-neutral-800/60 p-1.5 ${inMonth ? '' : 'bg-neutral-950/40'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8b5cf6] text-white' : inMonth ? 'text-neutral-300' : 'text-neutral-700'}`}>{day.getDate()}</span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((ev: any) => (
                      <button key={ev.id} onClick={() => setSelected(ev)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: `${eventColor(ev)}22`, color: eventColor(ev) }}>
                        {ev.time ? fmtTime12(ev.time).replace(':00', '') + ' ' : ''}{ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <button onClick={() => { setView('day'); setCursor(new Date(day)) }} className="text-[9px] text-neutral-500 hover:text-white cursor-pointer px-1.5">+{dayEvents.length - 3} more</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => addDays(range.from, i)).map((day, i) => {
            const ds = ymd(day)
            const dayEvents = eventsByDay[ds] || []
            const isToday = ds === todayStr
            return (
              <div key={i} className={`bg-neutral-950/40 border rounded-xl p-2 min-h-[140px] ${isToday ? 'border-[#8b5cf6]/40' : 'border-neutral-800'}`}>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">{WEEKDAYS[day.getDay()]}</span>
                  <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-[#8b5cf6] text-white' : 'text-neutral-300'}`}>{day.getDate()}</span>
                </div>
                <div className="space-y-1">
                  {dayEvents.length === 0 && <p className="text-[9px] text-neutral-700 text-center py-2">—</p>}
                  {dayEvents.map((ev: any) => (
                    <button key={ev.id} onClick={() => setSelected(ev)}
                      className="w-full text-left px-1.5 py-1 rounded text-[10px] cursor-pointer hover:opacity-80 transition-opacity border-l-2"
                      style={{ background: `${eventColor(ev)}15`, borderColor: eventColor(ev) }}>
                      <div className="font-bold truncate text-white">{ev.title}</div>
                      <div className="text-[9px]" style={{ color: eventColor(ev) }}>{ev.time ? fmtTime12(ev.time) : 'All day'} · {eventBadge(ev)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view === 'day' && (
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-3 sm:p-4">
          {(() => {
            const dayEvents = eventsByDay[ymd(cursor)] || []
            if (dayEvents.length === 0) return <p className="text-sm text-neutral-600 text-center py-12">No meetings or callbacks scheduled.</p>
            return (
              <div className="space-y-2">
                {dayEvents.map((ev: any) => (
                  <button key={ev.id} onClick={() => setSelected(ev)}
                    className="w-full flex items-center gap-3 text-left px-3 py-3 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-all">
                    <div className="w-16 shrink-0 text-right">
                      <div className="text-xs font-bold text-white">{ev.time ? fmtTime12(ev.time) : 'All day'}</div>
                    </div>
                    <div className="w-1 self-stretch rounded-full" style={{ background: eventColor(ev) }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate">{ev.title}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{ev.company || ev.notes || ''}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0" style={{ background: `${eventColor(ev)}18`, color: eventColor(ev) }}>{eventBadge(ev)}</span>
                  </button>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── EVENT DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-neutral-800 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${eventColor(selected)}18`, color: eventColor(selected) }}>{eventBadge(selected)}</span>
                <h3 className="text-base font-bold text-white mt-2 truncate">{selected.title}</h3>
                {selected.company && <p className="text-xs text-neutral-500 truncate">{selected.company}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-white cursor-pointer shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-neutral-300">
                <CalIcon className="w-4 h-4 text-neutral-500" />
                {new Date(selected.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {selected.time && <div className="flex items-center gap-2 text-neutral-300"><Clock className="w-4 h-4 text-neutral-500" /> {fmtTime12(selected.time)}</div>}
              {selected.source === 'meeting' && (
                <div className="flex items-center gap-2 text-neutral-300">
                  {selected.type === 'online' ? <Video className="w-4 h-4 text-neutral-500" /> : <MapPin className="w-4 h-4 text-neutral-500" />}
                  {selected.type === 'online' ? 'Online' : 'In-Person'}
                </div>
              )}
              {selected.location_or_link && (
                selected.location_or_link.startsWith('http')
                  ? <a href={selected.location_or_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#00bfff] hover:underline break-all"><ExternalLink className="w-4 h-4 shrink-0" /> {selected.location_or_link}</a>
                  : <div className="flex items-center gap-2 text-neutral-300"><MapPin className="w-4 h-4 text-neutral-500" /> {selected.location_or_link}</div>
              )}
              {selected.notes && <p className="text-xs text-neutral-400 bg-neutral-900/50 rounded-lg p-2.5">{selected.notes}</p>}
              {selected.source === 'callback' && selected.caller_email && <p className="text-[11px] text-neutral-600">Owner: {selected.caller_email}</p>}
            </div>
            {selected.source !== 'google' && (
              <div className="p-3 border-t border-neutral-800">
                <button onClick={() => { openEvent(selected); setSelected(null) }}
                  className="w-full py-2 text-xs font-bold text-[#8b5cf6] hover:text-white bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5">
                  {selected.source === 'meeting' ? <><CalIcon className="w-3.5 h-3.5" /> Open in Meetings</> : <><Phone className="w-3.5 h-3.5" /> Open Client</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
