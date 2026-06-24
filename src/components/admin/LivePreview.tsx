import { useState } from 'react'
import { MapPin, ChevronRight, Monitor, Smartphone } from 'lucide-react'
import SafeHtml from '../shared/SafeHtml'

// ─── TYPES ──────────────────────────────────────────────
interface JobPreviewData {
  title: string
  type: string
  location: string
  salary_range: string
  short_description: string
  full_description: string  // newline-separated paragraphs or HTML
  requirements: string      // newline-separated items or HTML
  benefits: string          // newline-separated items or HTML
  perks: string
  hero_image: string
  apply_email: string
}

interface ProjectPreviewData {
  title: string
  subtitle: string
  description: string
  clientProblem: string
  solution: string
  businessImpact: string
  expertDeepDive: string
  tags: string
  tier: string
  projectStatus: string
  imageUrl: string
  projectUrl: string
  githubUrl: string
}

interface LivePreviewProps {
  mode: 'job' | 'project'
  data: JobPreviewData | ProjectPreviewData
}

// ─── HELPERS ────────────────────────────────────────────
const isHtml = (s: string) => { if (!s) return false; return /<[a-z][\s\S]*>/i.test(s) }
const splitLines = (s: string) => s.split('\n').filter(l => l.trim())

// ─── JOB PREVIEW ────────────────────────────────────────
function JobPreview({ data }: { data: JobPreviewData }) {
  const desc = data.full_description || ''
  const paragraphs = isHtml(desc) ? [] : splitLines(desc)
  const reqs = isHtml(data.requirements || '') ? [] : splitLines(data.requirements || '')
  const bens = isHtml(data.benefits || '') ? [] : splitLines(data.benefits || '')
  const perks = data.perks ? data.perks.split(/[,\n]/).map(p => p.trim()).filter(Boolean) : []

  return (
    <div className="bg-neutral-950 text-neutral-50 min-h-full">
      {/* Hero */}
      <div className="relative w-full h-[180px] overflow-hidden bg-neutral-900">
        {data.hero_image ? (
          <img src={data.hero_image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
            <span className="text-neutral-700 text-sm">Hero Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <h1 className="text-xl font-black tracking-tight mb-2">{data.title || 'Job Title'}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {data.type && <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur font-medium">{data.type}</span>}
            {data.location && (
              <span className="flex items-center gap-1 text-neutral-300">
                <MapPin className="w-2.5 h-2.5" />{data.location}
              </span>
            )}
            {data.salary_range && (
              <span className="px-2 py-0.5 rounded-full bg-[#ff7a00]/15 border border-[#ff7a00]/30 text-[#ff7a00] font-bold">{data.salary_range}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 space-y-6">
        {/* Perks */}
        {perks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {perks.map((p, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-[10px] text-neutral-300">{p}</span>
            ))}
          </div>
        )}

        {/* About — Chat bubbles */}
        {(paragraphs.length > 0 || isHtml(desc)) && (
          <section>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-3 h-3 text-[#00bfff]" /></span>
              About This Role
            </h2>
            {isHtml(desc) ? (
              <SafeHtml className="prose-preview text-xs text-neutral-300 leading-relaxed" html={desc} />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-2 space-y-1">
                {paragraphs.map((msg, i) => (
                  <div key={i} className="max-w-[85%] ml-auto">
                    <div className="px-3 py-1.5 rounded-xl rounded-br-sm text-[10px] leading-[1.7] bg-gradient-to-br from-[#ff7a00]/10 to-neutral-800/80 border border-[#ff7a00]/10 text-neutral-200">
                      {msg}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Requirements */}
        {(reqs.length > 0 || isHtml(data.requirements || '')) && (
          <section>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-3 h-3 text-[#00bfff]" /></span>
              What We Need From You
            </h2>
            {isHtml(data.requirements || '') ? (
              <SafeHtml className="prose-preview text-xs text-neutral-300" html={data.requirements || ''} />
            ) : (
              <div className="space-y-1">
                {reqs.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#00bfff]" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 8.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-[10px] text-neutral-300 leading-relaxed">{r}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Benefits */}
        {(bens.length > 0 || isHtml(data.benefits || '')) && (
          <section>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#ff7a00]/10 flex items-center justify-center"><ChevronRight className="w-3 h-3 text-[#ff7a00]" /></span>
              What You Get
            </h2>
            {isHtml(data.benefits || '') ? (
              <SafeHtml className="prose-preview text-xs text-neutral-300" html={data.benefits || ''} />
            ) : (
              <div className="space-y-1">
                {bens.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-neutral-900/50 border border-neutral-800">
                    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#ff7a00]" viewBox="0 0 16 16" fill="none"><path d="M3 14l4-5 3 3 4-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="text-[10px] text-neutral-300 leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Apply CTA */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-2 px-5 rounded-lg text-xs cursor-default">
            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Apply Now
          </div>
        </div>
      </div>
    </div>
  )
}

/** Reusable section block for project preview — hoisted to module level */
function PreviewSection({ title, content, color = '#00bfff' }: { title: string; content: string; color?: string }) {
    if (!content) return null
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-bold flex items-center gap-2">
          <span className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <ChevronRight className="w-2.5 h-2.5" style={{ color }} />
          </span>
          {title}
        </h3>
        {isHtml(content) ? (
          <SafeHtml className="prose-preview text-[10px] text-neutral-400 leading-relaxed" html={content} />
        ) : (
          <p className="text-[10px] text-neutral-400 leading-relaxed">{content}</p>
        )}
      </div>
    )
  }

// ─── PROJECT PREVIEW ────────────────────────────────────
function ProjectPreview({ data }: { data: ProjectPreviewData }) {
  const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const tierColors: Record<string, string> = {
    flagship: 'bg-[#ff7a00]/15 text-[#ff7a00] border-[#ff7a00]/30',
    production: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    active: 'bg-[#00bfff]/15 text-[#00bfff] border-[#00bfff]/30',
    spec: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
  }

  return (
    <div className="bg-neutral-950 text-neutral-50 min-h-full">
      {/* Header */}
      <div className="relative w-full h-[140px] overflow-hidden bg-neutral-900">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
            <span className="text-neutral-700 text-sm">Cover Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <h1 className="text-lg font-black tracking-tight">{data.title || 'Project Title'}</h1>
          <p className="text-[10px] text-neutral-400">{data.subtitle || 'Subtitle'}</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-8 space-y-4">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {data.tier && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tierColors[data.tier] || tierColors.active}`}>
              {data.tier}
            </span>
          )}
          {data.projectStatus && (
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[9px] text-neutral-400 font-medium">{data.projectStatus}</span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-neutral-800/80 text-[9px] text-neutral-500 font-medium">{t}</span>
            ))}
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div>
            {isHtml(data.description) ? (
              <SafeHtml className="prose-preview text-[10px] text-neutral-300 leading-relaxed" html={data.description} />
            ) : (
              <p className="text-[10px] text-neutral-300 leading-relaxed">{data.description}</p>
            )}
          </div>
        )}

        {/* Content sections */}
        <PreviewSection title="The Problem" content={data.clientProblem} color="#ff7a00" />
        <PreviewSection title="Our Solution" content={data.solution} color="#00bfff" />
        <PreviewSection title="Business Impact" content={data.businessImpact} color="#10b981" />
        <PreviewSection title="Expert Deep Dive" content={data.expertDeepDive} color="#a855f7" />

        {/* Links */}
        {(data.projectUrl || data.githubUrl) && (
          <div className="flex gap-2 pt-2">
            {data.projectUrl && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00bfff]/10 border border-[#00bfff]/20 text-[#00bfff] text-[10px] font-medium">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3M10 2h4v4M14 2L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Live Site
              </span>
            )}
            {data.githubUrl && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-medium">
                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                GitHub
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────
export default function LivePreview({ mode, data }: LivePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="flex flex-col h-full">
      {/* Preview header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[10px] text-neutral-600 font-medium ml-2">LIVE PREVIEW</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1 rounded transition-colors cursor-pointer ${device === 'desktop' ? 'text-[#00bfff]' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1 rounded transition-colors cursor-pointer ${device === 'mobile' ? 'text-[#00bfff]' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview body */}
      <div className="flex-1 overflow-y-auto bg-neutral-950/50 border-x border-b border-neutral-800 rounded-b-xl">
        <div className={`mx-auto transition-all duration-300 ${device === 'mobile' ? 'max-w-[375px] border-x border-neutral-800' : 'w-full'}`}>
          {mode === 'job' ? (
            <JobPreview data={data as JobPreviewData} />
          ) : (
            <ProjectPreview data={data as ProjectPreviewData} />
          )}
        </div>
      </div>
    </div>
  )
}
