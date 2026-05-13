import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Play, Monitor, ChevronRight, X } from 'lucide-react'

interface Demo {
  id: string
  title: string
  subtitle: string
  description: string
  coverImage: string
  url: string
  category: string
  features: string[]
  color: string
  fullDemo: boolean
}

const DEMOS: Demo[] = [
  {
    id: 'printshop',
    title: 'Print Office',
    subtitle: 'Production & Job Management',
    description: 'Complete back-office system for print shops — production queue, job tracking, invoice builder, expense management, and revenue analytics.',
    coverImage: '/demo-printshop.png',
    url: 'https://printshop.icuni.org',
    category: 'Manufacturing',
    features: ['Production Queue', 'Invoice Builder', 'Financial Analytics', 'Job Scheduling'],
    color: '#00bfff',
    fullDemo: false,
  },
  {
    id: 'construction',
    title: 'Construction Office',
    subtitle: 'Inventory & Project Tracking',
    description: 'Multi-role construction management — storekeeper, project manager, supplier, and head office views. Real-time stock tracking, concrete testing deadlines, material issuance.',
    coverImage: '/demo-construction.png',
    url: 'https://key.icuni.org',
    category: 'Construction',
    features: ['Role-Based Views', 'Stock Tracking', 'Deadline Alerts', 'Issuance Trends'],
    color: '#f59e0b',
    fullDemo: false,
  },
  {
    id: 'warehouse',
    title: 'Warehouse & Retail',
    subtitle: 'Stock & Outlet Management',
    description: 'Integrated warehouse operations — category-level stock management, internal allocations between outlets, retail sales tracking, and low-stock alerting.',
    coverImage: '/demo-warehouse.png',
    url: 'https://mw.icuni.org',
    category: 'Retail & Logistics',
    features: ['Stock Categories', 'Internal Transfers', 'Outlet Sales', 'Activity Feed'],
    color: '#8b5cf6',
    fullDemo: false,
  },
  {
    id: 'property',
    title: 'Property Office',
    subtitle: 'Portfolio & Tenant Management',
    description: 'Property management portfolio system — occupancy tracking, revenue dashboards, maintenance issue management, and property-by-property performance.',
    coverImage: '/demo-property.png',
    url: 'https://mobus.icuni.org',
    category: 'Real Estate',
    features: ['Portfolio Overview', 'Occupancy Rates', 'Maintenance Tracker', 'Revenue Reports'],
    color: '#eab308',
    fullDemo: true,
  },
  {
    id: 'blockfactory',
    title: 'Block Factory',
    subtitle: 'Production & Financial Ops',
    description: 'Block manufacturing operations — production metrics, net profit tracking, inventory loss monitoring, and automated reorder alerts.',
    coverImage: '/demo-blockfactory.png',
    url: 'https://blockops-theta.vercel.app',
    category: 'Manufacturing',
    features: ['Production Metrics', 'Profit Tracking', 'Loss Monitoring', 'Reorder Alerts'],
    color: '#22c55e',
    fullDemo: true,
  },
  {
    id: 'swimschool',
    title: 'Swim School',
    subtitle: 'Sessions & Enrollment',
    description: 'Aquatic academy management — session scheduling, attendance tracking, student enrollment, and revenue monitoring.',
    coverImage: '/demo-swimschool.png',
    url: 'https://aquaflow.icuni.org',
    category: 'Education',
    features: ['Session Scheduler', 'Attendance Rate', 'Enrollment Tracker', 'Revenue MTD'],
    color: '#06b6d4',
    fullDemo: true,
  },
]

// ─── Category SVG icons ───
function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const cls = className || 'w-4 h-4'
  switch (category) {
    case 'Manufacturing':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l7-4v18M12 21V3l7 4v14" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="10" width="2" height="2" rx="0.5"/><rect x="8" y="14" width="2" height="2" rx="0.5"/><rect x="15" y="10" width="2" height="2" rx="0.5"/><rect x="15" y="14" width="2" height="2" rx="0.5"/></svg>
    case 'Construction':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M6 20V10l6-6 6 6v10" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 10h6" strokeLinecap="round"/></svg>
    case 'Retail & Logistics':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2" strokeLinecap="round"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>
    case 'Real Estate':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    case 'Education':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L2 9l10 6 10-6-10-6z" strokeLinejoin="round"/><path d="M20 9v7" strokeLinecap="round"/><path d="M6 12v5c0 2.5 3 4 6 4s6-1.5 6-4v-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default:
      return <Monitor className={cls} />
  }
}

// ─── Floating SVG background ───
function DemoBgSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.02] pointer-events-none" viewBox="0 0 1200 800" fill="none">
      <motion.rect x="100" y="50" width="300" height="180" rx="16" stroke="#00bfff" strokeWidth="0.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.rect x="800" y="100" width="250" height="140" rx="12" stroke="#ff7a00" strokeWidth="0.8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, delay: 1, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.circle cx="600" cy="400" r="120" stroke="#00bfff" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 6, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.path d="M50 600 Q300 500 600 550 Q900 600 1150 520" stroke="#ff7a00" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 5, delay: 2, repeat: Infinity, repeatType: 'reverse' }} />
    </svg>
  )
}

export default function DemosPage() {
  const [previewDemo, setPreviewDemo] = useState<Demo | null>(null)

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white">
      {/* Hero */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        <DemoBgSVG />
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#00bfff]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-[#ff7a00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00bfff]/20 to-[#ff7a00]/20 border border-neutral-800 flex items-center justify-center">
                <Play className="w-5 h-5 text-[#00bfff]" />
              </div>
              <div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-[3px] font-bold">Live Systems</div>
                <div className="text-sm font-bold text-[#ff7a00]">Interactive Demos</div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-[1.1]">
              See what we <span className="bg-gradient-to-r from-[#00bfff] to-[#00e5ff] bg-clip-text text-transparent">build</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mb-2">
              Explore live demos of systems we've built for real businesses. Every dashboard, every feature — running in production.
            </p>
            <p className="text-sm text-neutral-600">
              {DEMOS.length} systems · {DEMOS.filter(d => d.fullDemo).length} full interactive demos · All industries
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMOS.map((demo, i) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
              className="group relative bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all duration-300"
            >
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={demo.coverImage}
                  alt={demo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-neutral-800/50 text-[10px] font-bold uppercase tracking-wider" style={{ color: demo.color }}>
                  <CategoryIcon category={demo.category} className="w-3 h-3" />
                  {demo.category}
                </div>

                {/* Full demo badge */}
                {demo.fullDemo && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    Full Demo
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewDemo(demo)}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5" /> Preview
                  </button>
                  <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.color}dd)` }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Explore
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-0.5">{demo.title}</h3>
                <p className="text-xs font-medium mb-3" style={{ color: demo.color }}>{demo.subtitle}</p>
                <p className="text-sm text-neutral-400 leading-relaxed mb-4 line-clamp-2">{demo.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {demo.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-500 border border-neutral-800">
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={demo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold transition-colors cursor-pointer group/link"
                  style={{ color: demo.color }}
                >
                  Explore demo <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-2xl border border-neutral-800 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#00bfff]/5 via-transparent to-[#ff7a00]/5" />
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
                Need something like this?
              </h2>
              <p className="text-neutral-400 text-sm max-w-md">
                We build custom business operations systems — tailored to how your business actually works. No subscriptions. No templates. Just your system.
              </p>
            </div>
            <a
              href="#contact"
              className="shrink-0 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all text-sm cursor-pointer"
            >
              Challenge Us
            </a>
          </div>
        </motion.div>
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDemo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewDemo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-5xl h-[80vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-neutral-500 font-mono">{previewDemo.url}</span>
                </div>
                <div className="flex items-center gap-3">
                  <a href={previewDemo.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer" style={{ color: previewDemo.color }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open in new tab
                  </a>
                  <button onClick={() => setPreviewDemo(null)} className="text-neutral-500 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Iframe */}
              <iframe
                src={previewDemo.url}
                className="flex-1 w-full border-0"
                title={previewDemo.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
