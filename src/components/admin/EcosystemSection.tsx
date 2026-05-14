import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Globe, Plus, Archive, ChevronDown, ChevronUp, X } from 'lucide-react'

const statusColor = (s: string) => {
  if (s === 'active') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
  if (s === 'archived') return 'text-neutral-500 bg-neutral-800 border-neutral-700'
  return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
}

const techBadge = (stack: string) => {
  const colors: Record<string, string> = {
    'React': 'text-cyan-400 bg-cyan-400/10',
    'Next.js': 'text-white bg-neutral-800',
    'GAS': 'text-amber-400 bg-amber-400/10',
    'Electron': 'text-purple-400 bg-purple-400/10',
  }
  return stack.split('+').map(t => t.trim()).map(t => (
    <span key={t} className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors[t] || 'text-neutral-400 bg-neutral-800'}`}>{t}</span>
  ))
}

export default function EcosystemSection() {
  const { projectRegistry, loading } = useAdminStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newFeatureKey, setNewFeatureKey] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '', tech_stack: '', owner: '' })
  const [busy, setBusy] = useState(false)

  const isOwner = useAdminStore().user?.role === 'Godmode'

  useEffect(() => { adminActions.loadProjectRegistry() }, [])

  const toggleFeature = async (projectId: string, key: string, current: boolean) => {
    setBusy(true)
    await adminActions.updateProjectFeature(projectId, key, !current)
    setBusy(false)
  }

  const addFeature = async (projectId: string) => {
    if (!newFeatureKey.trim()) return
    setBusy(true)
    await adminActions.updateProjectFeature(projectId, newFeatureKey.trim(), true)
    setNewFeatureKey('')
    setBusy(false)
  }

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return
    setBusy(true)
    try {
      await (adminActions as any).addProject?.(newProject)
      setShowAddProject(false)
      setNewProject({ name: '', description: '', url: '', tech_stack: '', owner: '' })
      await adminActions.loadProjectRegistry()
    } catch { /* fallback */ }
    setBusy(false)
  }

  const inputCls = "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#00bfff]/50 focus:outline-none transition-colors"

  if (loading && projectRegistry.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
      </div>
    )
  }

  const activeProjects = projectRegistry.filter((p: any) => p.status !== 'archived')
  const archivedProjects = projectRegistry.filter((p: any) => p.status === 'archived')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#00bfff]" />
            ICUNI Ecosystem
          </h2>
          <p className="text-sm text-neutral-500 mt-1">{activeProjects.length} active projects under management</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-cyan-600 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all cursor-pointer">
            <Plus className="w-4 h-4" />Register Project
          </button>
        )}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeProjects.map((project: any) => {
          const features = project.features || {}
          const featureKeys = Object.keys(features)
          const isExpanded = expandedId === project.project_id

          return (
            <div key={project.project_id}
              className="bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00bfff]/20 to-purple-500/20 flex items-center justify-center border border-[#00bfff]/10">
                      <Globe className="w-5 h-5 text-[#00bfff]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">{project.name}</h3>
                      <p className="text-neutral-500 text-xs mt-0.5">{project.owner}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {project.description && (
                  <p className="text-neutral-400 text-xs leading-relaxed mb-3">{project.description}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {project.tech_stack && techBadge(project.tech_stack)}
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#00bfff] hover:text-cyan-300 transition-colors">
                      {project.url.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="border-t border-neutral-800">
                <button onClick={() => setExpandedId(isExpanded ? null : project.project_id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs text-neutral-500 hover:text-white hover:bg-neutral-800/50 transition-all cursor-pointer">
                  <span className="font-medium">{featureKeys.length} Feature{featureKeys.length !== 1 ? 's' : ''} Configured</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2">
                    {featureKeys.length === 0 ? (
                      <p className="text-xs text-neutral-600 text-center py-2">No features configured yet.</p>
                    ) : (
                      featureKeys.map(key => (
                        <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${features[key] ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                          <span className="text-xs font-medium text-white">{key}</span>
                          <button onClick={() => toggleFeature(project.project_id, key, features[key])}
                            disabled={busy}
                            className={`relative w-9 h-5 rounded-full transition-all cursor-pointer ${features[key] ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                            <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm"
                              style={features[key] ? { left: '18px' } : { left: '2px' }} />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add Feature */}
                    <div className="flex gap-2 mt-2">
                      <input value={newFeatureKey} onChange={e => setNewFeatureKey(e.target.value)}
                        className={`${inputCls} !text-xs !py-1.5`} placeholder="New feature key..."
                        onKeyDown={e => e.key === 'Enter' && addFeature(project.project_id)} />
                      <button onClick={() => addFeature(project.project_id)} disabled={busy || !newFeatureKey.trim()}
                        className="px-3 py-1.5 bg-[#00bfff] text-white text-xs font-bold rounded-lg hover:bg-cyan-500 transition-colors cursor-pointer disabled:opacity-40">
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-bold text-neutral-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Archive className="w-4 h-4" />Archived ({archivedProjects.length})
          </h3>
          <div className="space-y-2">
            {archivedProjects.map((p: any) => (
              <div key={p.project_id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/30 border border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm text-neutral-500">{p.name}</span>
                </div>
                <span className="text-[10px] text-neutral-600">{p.owner}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddProject(false)}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00bfff]" />Register ICUNI Project
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Project Name *</label>
                <input value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className={inputCls} placeholder="PrintShop" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Description</label>
                <input value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} className={inputCls} placeholder="What does this project do?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">URL</label>
                  <input value={newProject.url} onChange={e => setNewProject({...newProject, url: e.target.value})} className={inputCls} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 mb-1 block">Tech Stack</label>
                  <input value={newProject.tech_stack} onChange={e => setNewProject({...newProject, tech_stack: e.target.value})} className={inputCls} placeholder="React + GAS" />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Owner / Client</label>
                <input value={newProject.owner} onChange={e => setNewProject({...newProject, owner: e.target.value})} className={inputCls} placeholder="ICUNI" />
              </div>
              <button onClick={handleAddProject} disabled={busy || !newProject.name.trim()}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-cyan-600 text-white rounded-lg text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {busy ? <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Registering...</> : 'Register Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
