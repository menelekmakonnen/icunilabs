import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ExternalLink, Monitor, X, ChevronRight, Zap, Shield, Clock, DollarSign } from 'lucide-react'
import { DEMOS, CategoryIcon } from './demoData'

export default function DemoDetailPage({ demoId }: { demoId: string }) {
  const demo = DEMOS.find(d => d.id === demoId)
  const [showPreview, setShowPreview] = useState(false)

  if (!demo) return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-neutral-400 mb-4">Demo not found.</p>
        <a href="#demos" className="text-[#00bfff] font-bold hover:underline">Back to Demos</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={demo.coverImage} alt={`${demo.title} — ICUNI Labs demo`} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/90 to-neutral-950" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-16">
          <a href="#demos" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> All Demos
          </a>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-neutral-800 text-[10px] font-bold uppercase tracking-wider" style={{ color: demo.color }}>
              <CategoryIcon category={demo.category} className="w-3 h-3" /> {demo.category}
            </span>
            {demo.fullDemo && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 uppercase">Full Demo</span>}
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black tracking-tight mb-3">{demo.title}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl font-medium mb-6" style={{ color: demo.color }}>{demo.tagline}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-neutral-400 text-lg max-w-2xl mb-8 leading-relaxed">{demo.longDescription}</motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3">
            <a href={demo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold py-3 px-6 rounded-lg text-sm transition-all cursor-pointer text-white" style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.color}cc)` }}>
              <ExternalLink className="w-4 h-4" /> Try Live Demo
            </a>
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-2 bg-white/5 border border-neutral-700 text-white font-bold py-3 px-6 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer">
              <Monitor className="w-4 h-4" /> Preview Here
            </button>
            <a href="#contact" className="flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3 px-6 rounded-lg text-sm hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all cursor-pointer">
              Get This For Your Business <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Value badges */}
      <section className="max-w-5xl mx-auto px-6 -mt-2 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'Built in Days', sub: 'Not months' },
            { icon: DollarSign, label: 'No Software Subscriptions', sub: 'From us — you own the system' },
            { icon: Zap, label: 'AI-Enhanced', sub: 'Where it matters' },
            { icon: Shield, label: 'Production Ready', sub: 'Used by real businesses' },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <b.icon className="w-5 h-5 shrink-0" style={{ color: demo.color }} />
              <div><div className="text-xs font-bold text-white">{b.label}</div><div className="text-[10px] text-neutral-600">{b.sub}</div></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="p-8 rounded-2xl border border-neutral-800 bg-neutral-900/30">
          <h2 className="text-2xl font-black mb-4">The Problem</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">{demo.problemSolved}</p>
        </motion.div>
      </section>

      {/* What You Get */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-2xl font-black mb-8">What You Get</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {demo.keyBenefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 transition-all">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${demo.color}15`, border: `1px solid ${demo.color}30` }}>
                <Zap className="w-4 h-4" style={{ color: demo.color }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{b.title}</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Also Perfect For */}
      {demo.adaptableTo.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="p-8 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/20">
            <h2 className="text-2xl font-black mb-2">Also Perfect For</h2>
            <p className="text-sm text-neutral-500 mb-6">This system can be adapted for similar businesses with minimal changes.</p>
            <div className="flex flex-wrap gap-2">
              {demo.adaptableTo.map((a, i) => (
                <span key={i} className="px-4 py-2 rounded-full border text-sm font-medium" style={{ borderColor: `${demo.color}40`, color: demo.color, background: `${demo.color}08` }}>{a}</span>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-2xl border border-neutral-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00bfff]/5 via-transparent to-[#ff7a00]/5" />
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">Need something like this?</h2>
              <p className="text-neutral-400 text-sm max-w-md">Challenge us with your hardest operational problem. We'll build a working demo before you commit to anything.</p>
            </div>
            <a href="#contact" className="shrink-0 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] transition-all text-sm cursor-pointer">Challenge Us</a>
          </div>
        </motion.div>
      </section>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="w-full max-w-5xl h-[80vh] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/80" /><span className="w-3 h-3 rounded-full bg-amber-500/80" /><span className="w-3 h-3 rounded-full bg-emerald-500/80" /></div>
                  <span className="text-xs text-neutral-500 font-mono">{demo.url}</span>
                </div>
                <div className="flex items-center gap-3">
                  <a href={demo.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold flex items-center gap-1.5" style={{ color: demo.color }}><ExternalLink className="w-3.5 h-3.5" /> Open</a>
                  <button onClick={() => setShowPreview(false)} className="text-neutral-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <iframe src={demo.url} className="flex-1 w-full border-0" title={demo.title} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
