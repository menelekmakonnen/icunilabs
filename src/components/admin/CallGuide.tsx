import { useState, useEffect, useRef } from 'react'
import { adminActions } from '../../store/useAdminStore'
import { X, Check, ChevronDown, ChevronUp, Phone, ArrowRight } from 'lucide-react'
import './call-guide.css'

// ═══ PATH DEFINITIONS ═══
const PATHS: Record<string, { label: string; color: string; points: { id: string; label: string; dataFields?: DataField[] }[] }> = {
  wc_receptionist: {
    label: 'WC Receptionist', color: '#8b5cf6',
    points: [
      { id: 'intro', label: 'Introduced with senior title' },
      { id: 'got_name', label: 'Got receptionist\'s name', dataFields: [{ id: 'receptionist_name', label: 'Receptionist Name', type: 'text' }] },
      { id: 'stated_research', label: 'Stated research project — two minutes — specific manager type' },
      { id: 'unavailable', label: 'If unavailable: got callback time & confirmed it', dataFields: [{ id: 'callback_datetime', label: 'Callback Date/Time', type: 'datetime-local' }] },
      { id: 'refused_email', label: 'If refused: offered to email first — got manager\'s email', dataFields: [{ id: 'manager_email', label: 'Manager Email', type: 'text' }] },
      { id: 'receptionist_answered', label: 'If receptionist wants to answer: engaged then escalated question complexity' },
    ]
  },
  wc_decision_maker: {
    label: 'WC Decision-Maker', color: '#00bfff',
    points: [
      { id: 'positioned_expert', label: 'Positioned them as the expert — "You\'re the best person to ask"' },
      { id: 'asked_system', label: 'Asked about current system — custom or off-the-shelf', dataFields: [{ id: 'system_name', label: 'System Name', type: 'text' }, { id: 'system_type', label: 'System Type', type: 'select', options: ['custom', 'off_shelf', 'none'] }] },
      { id: 'asked_problem', label: 'Asked most expensive problem', dataFields: [{ id: 'problem_description', label: 'Problem Description', type: 'textarea' }] },
      { id: 'put_number', label: 'Put a number on it — cedis or time', dataFields: [{ id: 'cost_amount', label: 'Amount (GHS)', type: 'number' }, { id: 'time_estimate', label: 'Time Estimate', type: 'text' }] },
      { id: 'current_system_helps', label: 'Asked if current system helps with that problem' },
      { id: 'snap_fingers', label: 'Snap-your-fingers question — dream system', dataFields: [{ id: 'dream_system', label: 'Dream System Description', type: 'textarea' }] },
      { id: 'read_energy', label: 'Read their energy — rushed vs relaxed' },
      { id: 'transitioned_challenge', label: 'Transitioned to Challenge — "We have a problem…"' },
      { id: 'pushed_meeting', label: 'After 3 yeses: pushed for meeting with specific day/time' },
    ]
  },
  bc_front_desk: {
    label: 'BC Front Desk', color: '#f59e0b',
    points: [
      { id: 'got_boss_avail', label: 'Got boss availability — when & how to reach', dataFields: [{ id: 'boss_available', label: 'Boss Available When', type: 'text' }, { id: 'contact_method', label: 'Preferred Method', type: 'select', options: ['phone', 'in_person'] }] },
      { id: 'asked_floor_mgr', label: 'Asked to speak to floor manager while on the line' },
      { id: 'connected_owner', label: 'If connected to owner — pivoted to owner script' },
    ]
  },
  bc_mr_cooper: {
    label: 'BC Mr Cooper', color: '#ff7a00',
    points: [
      { id: 'most_time', label: 'Asked what takes the most time in their day', dataFields: [{ id: 'time_sink', label: 'Biggest Time Sink', type: 'text' }] },
      { id: 'most_frustrating', label: 'Asked most frustrating part of their workflow', dataFields: [{ id: 'frustration', label: 'Key Frustration', type: 'text' }] },
      { id: 'system_usage', label: 'Asked about system usage for orders/stock/deliveries' },
      { id: 'challenge_easier', label: 'Presented the challenge — "What if we could make your job easier?"' },
      { id: 'demo_together', label: 'Offered to demo to Mr Cooper AND the boss together' },
    ]
  },
  bc_owner: {
    label: 'BC Owner', color: '#ef4444',
    points: [
      { id: 'tema_hook', label: 'Tema Harbour hook delivered — "Have you heard about the AI?"' },
      { id: 'key_number', label: 'Key number: two million dollars recovered every day' },
      { id: 'connected_back', label: 'Connected it back — "Just like Tema Harbour, we can help you"' },
      { id: 'phone_access', label: 'Emphasized phone access — "See everything from your phone"' },
      { id: 'pushed_meeting_bc', label: 'Pushed for specific meeting day and time' },
      { id: 'no_interest_competitor', label: 'If no interest: asked what system they use & who built it', dataFields: [{ id: 'competitor_system', label: 'Competitor System Name', type: 'text' }, { id: 'competitor_developer', label: 'Competitor Developer', type: 'text' }] },
    ]
  },
}

interface DataField { id: string; label: string; type: 'text' | 'number' | 'textarea' | 'select' | 'datetime-local'; options?: string[] }

const OUTCOMES = [
  { id: 'meeting_booked', label: 'Meeting Booked', desc: 'Date/time confirmed', hasDatetime: true },
  { id: 'callback_scheduled', label: 'Callback Scheduled', desc: 'Call back at agreed time', hasDatetime: true },
  { id: 'interested_will_revert', label: 'Interested — Will Revert', desc: 'They\'ll get back to us', hasNotes: true },
  { id: 'no_interest', label: 'No Interest — Logged', desc: 'Graceful close' },
  { id: 'needs_follow_up', label: 'Needs Follow-Up', desc: 'Requires our follow-up', hasNotes: true, hasDate: true },
]

const PERSONAS: Record<string, { id: string; label: string; pathId: string }[]> = {
  white_collar: [
    { id: 'receptionist', label: 'Receptionist', pathId: 'wc_receptionist' },
    { id: 'buyer_manager', label: 'Buyer-Manager (Decision-Maker)', pathId: 'wc_decision_maker' },
  ],
  blue_collar: [
    { id: 'front_desk', label: 'Front Desk', pathId: 'bc_front_desk' },
    { id: 'mr_cooper', label: 'Mr Cooper (Floor Manager)', pathId: 'bc_mr_cooper' },
    { id: 'owner', label: 'Owner', pathId: 'bc_owner' },
  ],
  hybrid: [
    { id: 'receptionist', label: 'Receptionist (WC)', pathId: 'wc_receptionist' },
    { id: 'buyer_manager', label: 'Buyer-Manager (WC)', pathId: 'wc_decision_maker' },
    { id: 'front_desk', label: 'Front Desk (BC)', pathId: 'bc_front_desk' },
    { id: 'mr_cooper', label: 'Mr Cooper (BC)', pathId: 'bc_mr_cooper' },
    { id: 'owner', label: 'Owner (BC)', pathId: 'bc_owner' },
  ],
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

interface CallGuideProps {
  client: any
  onClose: () => void
}

export default function CallGuide({ client, onClose }: CallGuideProps) {
  // Classification state
  const [phase, setPhase] = useState<'classify' | 'guide'>('classify')
  const [envType, setEnvType] = useState<string>('')
  const [personaType, setPersonaType] = useState<string>('')
  const [pathId, setPathId] = useState<string>('')

  // Guide state
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [dataCapture, setDataCapture] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState('')
  const [outcomeDate, setOutcomeDate] = useState('')
  const [outcomeTime, setOutcomeTime] = useState('')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [nextActionNotes, setNextActionNotes] = useState('')
  const [contactName, setContactName] = useState(client?.name || '')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [contactPhone, setContactPhone] = useState(client?.phone || '')
  const [contactRole, setContactRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [callStart] = useState(new Date().toISOString())
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const currentPath = PATHS[pathId]
  const availablePersonas = envType ? PERSONAS[envType] || [] : []

  const startGuide = () => {
    if (!envType || !personaType || !pathId) return
    setPhase('guide')
  }

  const toggleCheck = (id: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const updateData = (key: string, value: string) => {
    setDataCapture(prev => ({ ...prev, [key]: value }))
  }

  const switchPath = (newPathId: string, newPersona: string) => {
    setPathId(newPathId)
    setPersonaType(newPersona)
  }

  const getNextAction = () => {
    const o = OUTCOMES.find(x => x.id === outcome)
    if (!o) return ''
    if (outcome === 'meeting_booked') return `Meeting on ${outcomeDate} at ${outcomeTime}`
    if (outcome === 'callback_scheduled') return `Call back on ${outcomeDate} at ${outcomeTime}`
    if (outcome === 'needs_follow_up') return `Follow up on ${outcomeDate}`
    if (outcome === 'interested_will_revert') return 'Wait for their response'
    return 'No further action'
  }

  const handleSave = async () => {
    if (!outcome) return
    setSaving(true)
    const callEnd = new Date().toISOString()
    const points = currentPath?.points || []
    const checkedArr = points.filter(p => checked.has(p.id)).map(p => p.id)
    const skippedArr = points.filter(p => !checked.has(p.id)).map(p => p.id)

    const data: Record<string, any> = {
      client_id: client.client_id,
      environment_type: envType,
      persona_type: personaType,
      path_loaded: pathId,
      path_switched_to: '',
      call_start: callStart,
      call_end: callEnd,
      talking_points_checked: checkedArr,
      talking_points_skipped: skippedArr,
      talking_points_total: points.length,
      data_capture: dataCapture,
      outcome,
      outcome_details: { date: outcomeDate, time: outcomeTime, notes: outcomeNotes },
      next_action: getNextAction(),
      next_action_date: outcomeDate || '',
      next_action_notes: nextActionNotes,
      call_notes: callNotes,
      contact_name: contactName,
      contact_phone: contactPhone,
    }

    const result = await adminActions.saveCallLog(data)
    setSaving(false)
    if (result) onClose()
  }

  const toggleSection = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }))

  // ═══ CLASSIFICATION PHASE ═══
  if (phase === 'classify') {
    return (
      <div className="cg-classify-modal" onClick={onClose}>
        <div className="cg-classify-card" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Start Call</h2>
              <p className="text-xs text-neutral-500 mt-1">{client?.name || client?.company || 'Unknown'} — {client?.phone || 'No phone'}</p>
            </div>
            <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-3">Environment Type</p>
          <div className="flex gap-2 mb-5">
            {[{ id: 'white_collar', label: 'White Collar' }, { id: 'blue_collar', label: 'Blue Collar' }, { id: 'hybrid', label: 'Hybrid' }].map(e => (
              <button key={e.id} className={`cg-env-btn ${envType === e.id ? 'selected' : ''}`}
                onClick={() => { setEnvType(e.id); setPersonaType(''); setPathId('') }}>{e.label}</button>
            ))}
          </div>

          {envType && (<>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-3">Speaking To</p>
            {availablePersonas.map(p => (
              <button key={p.id} className={`cg-persona-btn ${personaType === p.id ? 'selected' : ''}`}
                onClick={() => { setPersonaType(p.id); setPathId(p.pathId) }}>
                <div className={`w-3 h-3 rounded-full border-2 ${personaType === p.id ? 'border-[#00bfff] bg-[#00bfff]' : 'border-neutral-600'}`} />
                {p.label}
              </button>
            ))}
          </>)}

          <button onClick={startGuide} disabled={!pathId}
            className="w-full mt-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Begin Call Guide <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ═══ GUIDE PHASE ═══
  const points = currentPath?.points || []
  const checkedCount = points.filter(p => checked.has(p.id)).length

  return (
    <div className="cg-overlay">
      {/* Sticky Header */}
      <div className="cg-header">
        <div className="flex items-center gap-3">
          <div className="cg-timer">{formatDuration(elapsed)}</div>
          <div className="cg-path-badge" style={{ borderColor: currentPath?.color + '40', color: currentPath?.color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: currentPath?.color }} />
            {currentPath?.label}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Escalation dropdown */}
          <select value={pathId} onChange={e => {
            const newP = Object.values(PERSONAS).flat().find(x => x.pathId === e.target.value)
            if (newP) switchPath(newP.pathId, newP.id)
          }} className="cg-escalate" style={{ appearance: 'auto' }}>
            <option value="" disabled>Escalated to…</option>
            {Object.values(PERSONAS).flat().map(p => (
              <option key={p.pathId} value={p.pathId}>{p.label}</option>
            ))}
          </select>
          {/* Pause — exit without losing state */}
          <button onClick={onClose} className="cg-pause-btn" title="Pause — return to CRM (call stays open)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            Pause
          </button>
          {/* Discard — end without saving */}
          <button onClick={() => setShowDiscardConfirm(true)} className="cg-discard-btn" title="End call without saving">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Discard
          </button>
          <button onClick={handleSave} disabled={saving || !outcome} className="cg-end-btn">
            {saving ? 'Saving…' : 'End Call & Save'}
          </button>
        </div>
      </div>

      <div className="cg-body">
        {/* Section 1: Contact Info */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('contact')}>
            <h3>Contact Info</h3>
            {collapsed.contact ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
          </div>
          {!collapsed.contact && (
            <div className="cg-section-body">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Company</label>
                  <input value={client?.company || ''} readOnly className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Phone</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Contact Name</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Fill during call" className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Role/Title</label>
                  <input value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="e.g. Operations Manager" className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600" /></div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2+3: Talking Points + Contextual Data */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('talking')}>
            <h3>Talking Points</h3>
            <div className="flex items-center gap-2">
              <span className="cg-section-count">{checkedCount}/{points.length}</span>
              {collapsed.talking ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
            </div>
          </div>
          {!collapsed.talking && (
            <div className="cg-section-body">
              {points.map(p => (
                <div key={p.id}>
                  <div className={`cg-tp ${checked.has(p.id) ? 'is-checked' : ''}`} onClick={() => toggleCheck(p.id)}>
                    <div className={`cg-tp-check ${checked.has(p.id) ? 'checked' : ''}`}>
                      <Check />
                    </div>
                    <span className="cg-tp-label">{p.label}</span>
                  </div>
                  {/* Contextual data fields */}
                  {checked.has(p.id) && p.dataFields && (
                    <div className="cg-data-field">
                      {p.dataFields.map(f => (
                        <div key={f.id} className="mb-2 last:mb-0">
                          <label>{f.label}</label>
                          {f.type === 'textarea' ? (
                            <textarea value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)} rows={2} />
                          ) : f.type === 'select' ? (
                            <select value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)}>
                              <option value="">Select…</option>
                              {f.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                            </select>
                          ) : (
                            <input type={f.type === 'number' ? 'text' : f.type} inputMode={f.type === 'number' ? 'numeric' : undefined}
                              value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Outcome */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('outcome')}>
            <h3>Call Outcome</h3>
            {collapsed.outcome ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
          </div>
          {!collapsed.outcome && (
            <div className="cg-section-body">
              {OUTCOMES.map(o => (
                <div key={o.id}>
                  <div className={`cg-outcome ${outcome === o.id ? 'selected' : ''}`} onClick={() => setOutcome(o.id)}>
                    <div className="cg-outcome-dot" />
                    <div>
                      <div className="cg-outcome-label">{o.label}</div>
                      <div className="cg-outcome-desc">{o.desc}</div>
                    </div>
                  </div>
                  {outcome === o.id && (o.hasDatetime || o.hasDate || o.hasNotes) && (
                    <div className="cg-data-field mb-3">
                      {(o.hasDatetime || o.hasDate) && (
                        <div className={o.hasDatetime ? 'cg-data-row' : ''}>
                          <div className="mb-2"><label>Date</label><input type="date" value={outcomeDate} onChange={e => setOutcomeDate(e.target.value)} /></div>
                          {o.hasDatetime && <div className="mb-2"><label>Time</label><input type="time" value={outcomeTime} onChange={e => setOutcomeTime(e.target.value)} /></div>}
                        </div>
                      )}
                      {o.hasNotes && <div><label>Notes</label><textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} rows={2} placeholder="Additional details…" /></div>}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3">
                <label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-2">Call Notes (freeform)</label>
                <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600 resize-y"
                  placeholder="Anything that didn't fit the structured fields…" />
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Next Action */}
        {outcome && (
          <div className="cg-section">
            <div className="cg-section-header"><h3>Next Action</h3></div>
            <div className="cg-section-body">
              <div className="cg-next-action">
                <p className="text-sm text-emerald-400 font-semibold mb-2">{getNextAction() || 'Select an outcome above'}</p>
                <label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Adjust / Add Notes</label>
                <input value={nextActionNotes} onChange={e => setNextActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600"
                  placeholder="Override or add context to the next action…" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-neutral-800 border border-neutral-700 text-neutral-400 cursor-pointer hover:bg-neutral-700 hover:text-white transition-all flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            Pause Call
          </button>
          <button onClick={() => setShowDiscardConfirm(true)}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-neutral-900 border border-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Discard
          </button>
          <button onClick={handleSave} disabled={saving || !outcome}
            className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all flex items-center justify-center gap-2">
            {saving ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Saving…</>) : 'End Call & Save'}
          </button>
        </div>

        {/* Discard Confirmation */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDiscardConfirm(false)}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">Discard this call?</h3>
              <p className="text-sm text-neutral-400 mb-5">All progress, notes, and data captured during this call will be lost. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-neutral-800 text-neutral-300 cursor-pointer hover:bg-neutral-700 transition-all">Keep Going</button>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-500/15 border border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/25 transition-all">Discard Call</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
