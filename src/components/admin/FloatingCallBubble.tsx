import { useState, useEffect, useCallback } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Phone, PhoneOff, Minimize2, Maximize2, X } from 'lucide-react'
import CallGuide from './CallGuide'
import './crm.css'

/** Floating Call Bubble — persists across page navigation.
 *  Shows when a call is minimised or paused with "Return to Call" and "End Call" buttons. */
export default function FloatingCallBubble() {
  const { floatingCall } = useAdminStore()
  const [expanded, setExpanded] = useState(false)
  const [elapsed, setElapsed] = useState('00:00')

  // Timer
  useEffect(() => {
    if (!floatingCall) return
    const update = () => {
      const diff = Math.floor((Date.now() - floatingCall.callStartTime) / 1000)
      const m = Math.floor(diff / 60).toString().padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setElapsed(`${m}:${s}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [floatingCall?.callStartTime])

  const handleResume = useCallback(() => {
    setExpanded(true)
    adminActions.resumeCall()
  }, [])

  const handleMinimise = useCallback(() => {
    setExpanded(false)
  }, [])

  const handleEnd = useCallback(() => {
    setExpanded(false)
    adminActions.endCall()
  }, [])

  if (!floatingCall) return null

  const clientName = floatingCall.client?.name || floatingCall.client?.company || 'Unknown Client'

  // Expanded: show full Call Guide overlay
  if (expanded) {
    return (
      <div className="fixed inset-0 z-[9997] bg-black/50 backdrop-blur-sm flex flex-col">
        {/* Top bar with minimise/end */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="call-fab-pulse" />
            <span className="text-sm font-bold text-white">{clientName}</span>
            <span className="call-fab-timer">{elapsed}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMinimise}
              className="call-fab-btn resume flex items-center gap-1"
            >
              <Minimize2 className="w-3 h-3" /> Minimise
            </button>
            <button
              onClick={handleEnd}
              className="call-fab-btn end flex items-center gap-1"
            >
              <PhoneOff className="w-3 h-3" /> End Call
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <CallGuide
            client={floatingCall.client}
            onClose={handleMinimise}
            onMinimise={handleMinimise}
          />
        </div>
      </div>
    )
  }

  // Collapsed: show floating bubble
  return (
    <div className="call-fab">
      <div className="call-fab-bubble" onClick={handleResume}>
        <div className="call-fab-pulse" />
        <div className="call-fab-name">{clientName}</div>
        <div className="call-fab-timer">{elapsed}</div>
        {floatingCall.paused && (
          <span className="text-[9px] text-amber-500 font-bold uppercase">Paused</span>
        )}
      </div>
      <div className="call-fab-actions">
        <button className="call-fab-btn resume" onClick={handleResume}>
          <Maximize2 className="w-3 h-3 inline mr-1" /> Return to Call
        </button>
        <button className="call-fab-btn end" onClick={handleEnd}>
          <X className="w-3 h-3 inline mr-1" /> End
        </button>
      </div>
    </div>
  )
}
