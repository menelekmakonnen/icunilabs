import { useEffect, useMemo, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Calendar, X } from 'lucide-react'

/**
 * Periodically nudges the user to set a date & time on any real meeting that
 * still has none, so it shows correctly on the pipeline and calendar. Used on
 * both the Meetings and Calendar pages. Dismissing snoozes it for 10 minutes.
 */
export default function MeetingDatePrompt() {
  const { meetings } = useAdminStore()
  const [snoozedUntil, setSnoozedUntil] = useState(0)
  const [idx, setIdx] = useState(0)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [busy, setBusy] = useState(false)
  const [, setTick] = useState(0)

  // Re-evaluate every minute so the prompt reappears after a snooze.
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 60000); return () => clearInterval(t) }, [])

  const needsDate = useMemo(() => {
    return (meetings || []).filter((m: any) =>
      m.meeting_id && !String(m.meeting_id).startsWith('call-') &&
      m.stage !== 'cancelled' && m.stage !== 'regressed' && m.stage !== 'qualified' &&
      (!m.date || !m.time)
    )
  }, [meetings])

  const current = needsDate.length > 0 ? needsDate[idx % needsDate.length] : null

  useEffect(() => {
    if (current) { setDate(current.date || ''); setTime(current.time && /^\d{1,2}:\d{2}/.test(String(current.time)) ? String(current.time).slice(0, 5) : '') }
  }, [current?.meeting_id])

  if (needsDate.length === 0 || !current || Date.now() < snoozedUntil) return null

  const save = async () => {
    if (!date || !time) return
    setBusy(true)
    await adminActions.updateMeeting(current.meeting_id, { date, time })
    await adminActions.loadMeetings()
    setBusy(false)
    setIdx(0)
  }

  return (
    <div className="mb-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/25">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-300">{needsDate.length} meeting{needsDate.length !== 1 ? 's' : ''} still need a date &amp; time</p>
          <p className="text-[11px] text-neutral-400 mb-2">Set a time for <strong className="text-white">{current.client_name || current.client_company || 'this meeting'}</strong> so it shows correctly on the calendar.</p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-[9px] text-neutral-500 uppercase block mb-0.5">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400/50" />
            </div>
            <div>
              <label className="text-[9px] text-neutral-500 uppercase block mb-0.5">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400/50" />
            </div>
            <button onClick={save} disabled={busy || !date || !time}
              className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-500/30 disabled:opacity-40 transition-all">{busy ? 'Saving…' : 'Save'}</button>
            {needsDate.length > 1 && (
              <button onClick={() => setIdx(i => (i + 1) % needsDate.length)} className="px-2 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer">Next →</button>
            )}
          </div>
        </div>
        <button onClick={() => setSnoozedUntil(Date.now() + 10 * 60000)} title="Remind me in 10 minutes" className="text-neutral-500 hover:text-white cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
      </div>
    </div>
  )
}
