import { useState } from 'react'
import { adminActions } from '../../../store/useAdminStore'
import { ChevronLeft, Reply, Send, Paperclip, Clock } from 'lucide-react'

const cls = "w-full bg-neutral-900/80 border border-neutral-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/40 focus:ring-1 focus:ring-[#00bfff]/20 focus:outline-none transition-all backdrop-blur-sm"

function relTime(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  if (ms < 60000) return 'Just now'
  if (ms < 3600000) return Math.floor(ms / 60000) + 'm ago'
  if (ms < 86400000) return Math.floor(ms / 3600000) + 'h ago'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function extractName(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*</)
  return m ? m[1].trim() : from.split('@')[0]
}

function avatarColor(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return `hsl(${Math.abs(h) % 360}, 60%, 45%)`
}

export default function MailThread({ thread, aliases, onClose }: { thread: any; aliases: any[]; onClose: () => void }) {
  const [replyBody, setReplyBody] = useState('')
  const [replyFrom, setReplyFrom] = useState(aliases[0]?.alias || 'labs@icuni.org')
  const [replying, setReplying] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)

  const handleReply = async () => {
    if (!replyBody.trim()) return
    setReplying(true)
    const ok = await adminActions.replyToThread(thread.id, replyBody, replyFrom, useTemplate)
    setReplying(false)
    if (ok) { setReplyBody(''); setShowReply(false) }
  }

  const msgs = thread.messages || []

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={onClose} className="mt-1 p-2 rounded-xl hover:bg-neutral-800/80 text-neutral-500 hover:text-white transition-all cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white leading-tight">{thread.subject}</h2>
          <p className="text-xs text-neutral-500 mt-1">{msgs.length} message{msgs.length !== 1 ? 's' : ''} in thread</p>
        </div>
        {!showReply && (
          <button onClick={() => setShowReply(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,128,255,0.25)] transition-all cursor-pointer">
            <Reply className="w-4 h-4" />Reply
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {msgs.map((msg: any, i: number) => {
          const name = extractName(msg.from)
          const initial = name.charAt(0).toUpperCase()
          const isLast = i === msgs.length - 1
          return (
            <div key={msg.id || i}
              className={`group rounded-2xl border backdrop-blur-sm transition-all ${isLast ? 'bg-neutral-900/80 border-neutral-700/60' : 'bg-neutral-900/40 border-neutral-800/40'}`}>
              {/* Message header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-800/30">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: avatarColor(msg.from) }}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-[10px] text-neutral-600 truncate">&lt;{msg.from.match(/<([^>]+)>/)?.[1] || msg.from}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-neutral-500">To: {msg.to?.split(',')[0]}</span>
                    {msg.cc && <span className="text-[10px] text-neutral-600">CC: {msg.cc.split(',')[0]}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-600">
                  <Clock className="w-3 h-3" />{relTime(msg.date)}
                </div>
              </div>
              {/* Body */}
              <div className={`px-5 py-4 text-sm text-neutral-300 leading-relaxed ${isLast ? '' : 'max-h-48 overflow-hidden relative'}`}>
                <div dangerouslySetInnerHTML={{ __html: msg.body }} className="mail-body [&_img]:max-w-full [&_img]:rounded-lg [&_a]:text-[#00bfff] [&_a]:underline" />
                {!isLast && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-900/80 to-transparent" />}
              </div>
              {/* Attachments */}
              {msg.attachments?.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2">
                  {msg.attachments.map((a: any, j: number) => (
                    <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800/60 border border-neutral-700/40">
                      <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="text-xs text-neutral-400">{a.name}</span>
                      <span className="text-[10px] text-neutral-600">{(a.size / 1024).toFixed(0)}KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reply composer */}
      {showReply && (
        <div className="bg-neutral-900/60 border border-neutral-700/40 rounded-2xl p-5 space-y-4 backdrop-blur-sm animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Reply className="w-4 h-4 text-[#00bfff]" />Reply</h3>
            <button onClick={() => setShowReply(false)} className="text-xs text-neutral-500 hover:text-white cursor-pointer">Cancel</button>
          </div>
          <div className="flex gap-3 items-center">
            <select value={replyFrom} onChange={e => setReplyFrom(e.target.value)} className={`${cls} !w-auto !py-2`}>
              {aliases.map((a: any) => <option key={a.alias || a} value={a.alias || a}>{a.alias || a}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
              <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="rounded" />
              Branded wrapper
            </label>
          </div>
          <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} className={`${cls} !min-h-[120px] resize-none`} placeholder="Write your reply..." autoFocus />
          <button onClick={handleReply} disabled={replying || !replyBody.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white rounded-xl text-sm font-bold cursor-pointer hover:shadow-[0_0_20px_rgba(0,128,255,0.3)] disabled:opacity-40 transition-all">
            <Send className="w-4 h-4" />{replying ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      )}
    </div>
  )
}
