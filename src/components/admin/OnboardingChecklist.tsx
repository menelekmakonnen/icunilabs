import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Circle, ChevronDown, ChevronRight, X, Compass, BookOpen, Target, Users, FolderOpen, Zap } from 'lucide-react'

interface CheckItem {
  id: string
  label: string
  description: string
  link?: string // admin section to navigate to
}

interface CheckGroup {
  id: string
  title: string
  icon: React.ElementType
  color: string
  items: CheckItem[]
}

const ONBOARDING_GROUPS: CheckGroup[] = [
  {
    id: 'orientation',
    title: 'Orientation',
    icon: Compass,
    color: '#ff7a00',
    items: [
      { id: 'read-philosophy', label: 'Read the "Challenge, Don\'t Sell" philosophy', description: 'Understand that we identify the most expensive problem, not pitch features. Ask: "What is your most expensive problem?"' },
      { id: 'review-personas', label: 'Review the 7 buyer personas', description: 'Learn who ICUNI serves — from Scaling Founders to Financial Operators. Each has unique pain signals and challenge questions.' },
      { id: 'visit-website', label: 'Visit the live website as a prospect would', description: 'Navigate the homepage, run the diagnostic quiz, view the demos page. Experience the funnel.' },
      { id: 'understand-pipeline', label: 'Understand the pipeline stages', description: 'Prospect → Contacted → Qualified → Meeting Scheduled → Proposal Sent → Negotiation → Won. Know what moves someone forward.' },
    ]
  },
  {
    id: 'crm-basics',
    title: 'CRM & Prospecting',
    icon: Users,
    color: '#00bfff',
    items: [
      { id: 'add-prospect', label: 'Add your first prospect (Detail Mode)', description: 'Open the CRM, click "Add Prospect", fill in a contact\'s details including buyer profile and location.', link: 'clients' },
      { id: 'batch-mode', label: 'Try Google Maps Batch Mode', description: 'Switch to Maps Mode and rapidly add 5 businesses from a Google Maps search. Enter the area, then type names one by one.', link: 'clients' },
      { id: 'advance-stage', label: 'Advance a prospect through the pipeline', description: 'Select a prospect and use the Advance button. Add a mandatory note explaining why they progressed.', link: 'clients' },
      { id: 'handoff-boundary', label: 'Understand the Handoff Boundary', description: 'In the pipeline view, notice the orange "Handoff to Founder" line after Qualified. Everything left of it is your domain.', link: 'clients' },
    ]
  },
  {
    id: 'discovery',
    title: 'Discovery Intelligence',
    icon: Target,
    color: '#f59e0b',
    items: [
      { id: 'capture-challenge', label: 'Capture a prospect\'s "Most Expensive Problem"', description: 'During or after a call, open their profile and fill in the Pain Category and Challenge Statement fields.' },
      { id: 'laugh-factor', label: 'Learn the "Laugh Factor" signal', description: 'When a prospect laughs while describing their problem, it\'s a high-value signal. Mark it in their profile.' },
      { id: 'check-hit-rate', label: 'Check the Challenge Hit Rate dashboard', description: 'Go to the Dashboard and find the Challenge Hit Rate widget. Your target: capture challenge data for every contacted prospect.', link: 'dashboard' },
    ]
  },
  {
    id: 'admin-tools',
    title: 'Admin Tools',
    icon: FolderOpen,
    color: '#8b5cf6',
    items: [
      { id: 'view-projects', label: 'Browse active projects', description: 'Open the Projects section to see client projects, their progress steps, and types.', link: 'projects' },
      { id: 'view-invoices', label: 'Review the invoice system', description: 'Check the Invoices section — understand statuses (pending, paid, partial) and how they link to clients.', link: 'invoices' },
      { id: 'check-sla', label: 'Review SLA tracking', description: 'Open the SLA section to see deadline monitoring and breach alerts.', link: 'sla' },
      { id: 'review-logs', label: 'Review activity logs', description: 'Check the Logs section to understand audit trails and system activity history.', link: 'logs' },
    ]
  },
]

const STORAGE_KEY = 'icuni_onboarding_progress'

function loadProgress(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

function saveProgress(p: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export default function OnboardingChecklist({ onClose, onNavigate }: { onClose: () => void; onNavigate?: (section: string) => void }) {
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('orientation')

  useEffect(() => { saveProgress(progress) }, [progress])

  const toggle = (id: string) => {
    setProgress(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const totalItems = ONBOARDING_GROUPS.reduce((sum, g) => sum + g.items.length, 0)
  const completedItems = Object.values(progress).filter(Boolean).length
  const pct = Math.round((completedItems / totalItems) * 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900/30 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#ff7a00]" />
              Ops Onboarding
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Your self-guided walkthrough of the ICUNI operations engine.</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-neutral-800/50 bg-neutral-950/50 flex items-center gap-4 shrink-0">
          <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#ff7a00] to-[#00bfff]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-bold text-white shrink-0">{pct}%</span>
          <span className="text-[10px] text-neutral-600 shrink-0">{completedItems}/{totalItems}</span>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {ONBOARDING_GROUPS.map(group => {
            const groupDone = group.items.filter(i => progress[i.id]).length
            const expanded = expandedGroup === group.id
            return (
              <div key={group.id} className="border border-neutral-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedGroup(expanded ? null : group.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all cursor-pointer"
                >
                  <group.icon className="w-4 h-4 shrink-0" style={{ color: group.color }} />
                  <span className="text-sm font-bold text-white flex-1 text-left">{group.title}</span>
                  <span className="text-[10px] text-neutral-600 mr-2">{groupDone}/{group.items.length}</span>
                  {groupDone === group.items.length ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : expanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 space-y-1">
                        {group.items.map(item => {
                          const done = progress[item.id]
                          return (
                            <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${done ? 'bg-emerald-500/5' : 'hover:bg-neutral-900/50'}`}>
                              <button onClick={() => toggle(item.id)} className="mt-0.5 shrink-0 cursor-pointer">
                                {done ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-neutral-700 hover:text-neutral-500 transition-colors" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${done ? 'text-neutral-500 line-through' : 'text-white'}`}>{item.label}</p>
                                <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{item.description}</p>
                                {item.link && onNavigate && !done && (
                                  <button
                                    onClick={() => { onNavigate(item.link!); onClose() }}
                                    className="mt-1.5 text-[10px] font-bold text-[#00bfff] hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                                  >
                                    <Zap className="w-3 h-3" /> Go there now
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/20 shrink-0">
          {pct === 100 ? (
            <p className="text-sm text-emerald-400 font-bold text-center">Onboarding complete. You're ready to operate.</p>
          ) : (
            <p className="text-[10px] text-neutral-600 text-center">Progress is saved locally. Come back anytime to continue.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
