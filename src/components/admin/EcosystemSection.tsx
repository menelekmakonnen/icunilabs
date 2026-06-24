import { useEffect, useState } from 'react'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { 
  Globe, Plus, Archive, ChevronDown, ChevronUp, X, Layers, 
  Database, ArrowRight, RefreshCw, CheckCircle, AlertTriangle
} from 'lucide-react'
import { portfolioProjects } from '../../data/portfolioData'

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
  const { projectRegistry, projects, loading, user } = useAdminStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newFeatureKey, setNewFeatureKey] = useState('')
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '', tech_stack: '', owner: '' })
  const [busy, setBusy] = useState(false)
  
  // Godmode States
  const isGodmode = user?.role === 'Godmode'
  const [activeTab, setActiveTab] = useState<'control_center' | 'registry' | 'client_projects' | 'portfolio'>(
    isGodmode ? 'control_center' : 'registry'
  )
  const [overview, setOverview] = useState<any>(null)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [siteData, setSiteData] = useState<any>(null)
  const [loadingSite, setLoadingSite] = useState(false)
  const [editingSetting, setEditingSetting] = useState<{ key: string; value: string } | null>(null)

  useEffect(() => {
    adminActions.loadProjectRegistry()
    adminActions.loadProjects()
    if (isGodmode) {
      loadOverview()
    }
  }, [isGodmode])

  const loadOverview = async () => {
    setBusy(true)
    try {
      const data = await (adminActions as any).godmodeGetEcosystemOverview()
      setOverview(data)
    } catch (e) {
      console.error('Failed to load ecosystem overview', e)
    }
    setBusy(false)
  }

  const toggleSiteStatus = async (siteKey: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'maintenance' : 'active'
    if (!confirm(`Are you sure you want to put ${siteKey.toUpperCase()} into ${nextStatus.toUpperCase()} mode?`)) return
    setBusy(true)
    try {
      await (adminActions as any).godmodeToggleSiteStatus(siteKey, nextStatus)
      await loadOverview()
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  const loadSiteDatabase = async (siteKey: string) => {
    setSelectedSite(siteKey)
    setLoadingSite(true)
    setSiteData(null)
    try {
      if (siteKey === 'connect') {
        const talents = await (adminActions as any).godmodeManageConnect('getTalents')
        const projs = await (adminActions as any).godmodeManageConnect('getProjects')
        setSiteData({ talents, projects: projs })
      } else if (siteKey === 'group') {
        const contacts = await (adminActions as any).godmodeManageGroup('getContacts')
        const settings = await (adminActions as any).godmodeManageGroup('getSettings')
        setSiteData({ contacts, settings })
      } else if (siteKey === 'starterclass') {
        const regs = await (adminActions as any).godmodeManageStarterclass('getRegistrations')
        const sess = await (adminActions as any).godmodeManageStarterclass('getSessions')
        setSiteData({ registrations: regs, sessions: sess })
      }
    } catch (e) {
      console.error(e)
    }
    setLoadingSite(false)
  }

  // Connect operations
  const toggleProfileVisibility = async (talentId: string, currentVal: any) => {
    setBusy(true)
    try {
      await (adminActions as any).godmodeManageConnect('toggleProfileVisibility', { talentId, visible: !currentVal })
      const talents = await (adminActions as any).godmodeManageConnect('getTalents')
      setSiteData({ ...siteData, talents })
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  const seedTalentsConnect = async () => {
    setBusy(true)
    try {
      await (adminActions as any).godmodeManageConnect('seedTalents')
      const talents = await (adminActions as any).godmodeManageConnect('getTalents')
      setSiteData({ ...siteData, talents })
      await loadOverview()
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  // Group operations
  const updateContactStatus = async (rowIndex: number, status: string) => {
    setBusy(true)
    try {
      await (adminActions as any).godmodeManageGroup('updateContactStatus', { rowIndex, status })
      const contacts = await (adminActions as any).godmodeManageGroup('getContacts')
      setSiteData({ ...siteData, contacts })
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  const toggleGroupPricing = async (currentVal: boolean) => {
    setBusy(true)
    try {
      await (adminActions as any).godmodeManageGroup('togglePricing', { visible: !currentVal })
      const contacts = await (adminActions as any).godmodeManageGroup('getContacts')
      const settings = await (adminActions as any).godmodeManageGroup('getSettings')
      setSiteData({ ...siteData, contacts, settings })
      await loadOverview()
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

  const saveGroupSetting = async (key: string, value: string) => {
    setBusy(true)
    try {
      await (adminActions as any).godmodeManageGroup('saveSetting', { key, value })
      const settings = await (adminActions as any).godmodeManageGroup('getSettings')
      setSiteData({ ...siteData, settings })
      setEditingSetting(null)
    } catch (e) {
      console.error(e)
    }
    setBusy(false)
  }

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

  if (loading && (projectRegistry || []).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
      </div>
    )
  }

  const activeProjects = (projectRegistry || []).filter((p: any) => p.status !== 'archived')
  const archivedProjects = (projectRegistry || []).filter((p: any) => p.status === 'archived')

  const TABS = [
    ...(isGodmode ? [{ id: 'control_center' as const, label: 'GodMode Control Center', count: 4 }] : []),
    { id: 'registry' as const, label: 'Registry', count: activeProjects.length },
    { id: 'client_projects' as const, label: 'Client Projects', count: (projects || []).length },
    { id: 'portfolio' as const, label: 'Portfolio', count: portfolioProjects?.length || 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#00bfff]" />
            ICUNI Ecosystem Control Panel
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {isGodmode ? 'Central administration & maintenance control for all ICUNI properties' : `${activeProjects.length} active projects under management`}
          </p>
        </div>
        {isGodmode && activeTab === 'control_center' && (
          <button 
            id="btn-refresh-ecosystem"
            onClick={loadOverview} 
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Refresh Status
          </button>
        )}
        {!isGodmode && activeTab === 'registry' && (
          <button onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-cyan-600 text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all cursor-pointer">
            <Plus className="w-4 h-4" />Register Project
          </button>
        )}
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 border-b border-neutral-800 -mx-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedSite(null); }}
            className={`relative px-4 py-2.5 text-xs font-bold cursor-pointer transition-colors ${activeTab === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
            {tab.label}
            <span className="ml-1.5 text-[10px] text-neutral-600">{tab.count}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#00bfff] rounded-full" />}
          </button>
        ))}
      </div>

      {/* ─── TAB: GodMode Control Center ─── */}
      {activeTab === 'control_center' && isGodmode && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['labs', 'connect', 'group', 'starterclass'].map(key => {
              const info = overview?.[key] || { name: key.toUpperCase(), status: 'loading', url: '', stats: {} }
              const status = info.status
              const isMaintenance = status === 'maintenance'
              const isOffline = status === 'offline'
              
              return (
                <div key={key} className="bg-neutral-950/60 border border-neutral-850 rounded-2xl p-5 hover:border-neutral-700 transition-all flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                          <Globe className={`w-5 h-5 ${isMaintenance ? 'text-amber-400' : isOffline ? 'text-red-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-base flex items-center gap-2">
                            {info.name}
                            {key === 'labs' && <span className="text-[9px] bg-[#00bfff]/10 text-[#00bfff] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Central Console</span>}
                          </h3>
                          <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 mt-0.5">
                            {(info.url || '').replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        status === 'active' ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/25' :
                        status === 'maintenance' ? 'text-amber-400 bg-amber-400/5 border-amber-400/25' :
                        'text-red-400 bg-red-400/5 border-red-400/25'
                      }`}>
                        {status}
                      </span>
                    </div>

                    {/* Stats List */}
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-neutral-900/30 p-3 rounded-lg border border-neutral-900">
                      {Object.entries(info.stats || {}).map(([statKey, statVal]) => (
                        <div key={statKey}>
                          <div className="text-[9px] text-neutral-500 uppercase font-semibold truncate">{statKey.replace(/([A-Z])/g, ' $1')}</div>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {typeof statVal === 'boolean' ? (statVal ? 'ON' : 'OFF') : String(statVal)}
                          </div>
                        </div>
                      ))}
                      {Object.keys(info.stats || {}).length === 0 && (
                        <div className="col-span-3 text-center py-2 text-xs text-neutral-600 font-medium">No stats loaded</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-neutral-900 flex items-center justify-between gap-4">
                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 font-medium">Maintenance</span>
                      <button 
                        id={`toggle-status-${key}`}
                        onClick={() => toggleSiteStatus(key, status)}
                        disabled={busy}
                        className={`relative w-10 h-5 rounded-full transition-all cursor-pointer ${isMaintenance ? 'bg-amber-500' : 'bg-neutral-800'}`}
                      >
                        <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-md"
                          style={isMaintenance ? { left: '22px' } : { left: '2px' }} />
                      </button>
                    </div>

                    {/* Manage DB Button */}
                    {key !== 'labs' && (
                      <button 
                        id={`btn-manage-db-${key}`}
                        onClick={() => loadSiteDatabase(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedSite === key ? 'bg-[#00bfff] text-white' : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" /> Manage Database
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Database Admin Panel */}
          {selectedSite && (
            <div className="bg-neutral-950/40 border border-neutral-800 rounded-2xl p-6 space-y-6 animate-slide-up">
              <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-[#00bfff]" />
                  <div>
                    <h3 className="text-white font-bold text-lg capitalize">{selectedSite} Database</h3>
                    <p className="text-xs text-neutral-500">Live database operations & settings management</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSite(null)} className="text-neutral-500 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingSite ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <svg className="animate-spin w-6 h-6 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  <span className="text-xs text-neutral-500 font-mono">Fetching spreadsheet tables...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Connect Site Controls */}
                  {selectedSite === 'connect' && siteData && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Talents Directory</h4>
                        <button 
                          id="btn-seed-talent-connect"
                          onClick={seedTalentsConnect} 
                          disabled={busy}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          + Seed Test Talent
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-neutral-900 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400">
                              <th className="p-3 font-semibold">Name</th>
                              <th className="p-3 font-semibold">Email</th>
                              <th className="p-3 font-semibold">Skill Area</th>
                              <th className="p-3 font-semibold">Availability</th>
                              <th className="p-3 font-semibold text-center">Public Profile</th>
                            </tr>
                          </thead>
                          <tbody>
                            {siteData.talents?.map((t: any) => (
                              <tr key={t.talentId || t.email} className="border-b border-neutral-900/50 hover:bg-neutral-900/10">
                                <td className="p-3 text-white font-bold">{t.fullName || t.name}</td>
                                <td className="p-3 text-neutral-400">{t.email}</td>
                                <td className="p-3 text-neutral-400">{t.primarySkill || t.skills || '-'}</td>
                                <td className="p-3 text-neutral-500">{t.status || 'Active'}</td>
                                <td className="p-3 text-center">
                                  <button 
                                    id={`toggle-talent-${t.talentId}`}
                                    onClick={() => toggleProfileVisibility(t.talentId, String(t.publicProfile) === 'true')}
                                    disabled={busy}
                                    className={`relative w-8 h-4 rounded-full inline-block transition-all cursor-pointer ${String(t.publicProfile) === 'true' ? 'bg-emerald-500' : 'bg-neutral-850'}`}
                                  >
                                    <span className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-md"
                                      style={String(t.publicProfile) === 'true' ? { left: '18px' } : { left: '2px' }} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(!siteData.talents || siteData.talents.length === 0) && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-neutral-600 font-medium">No talents registered in Connect yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Group Site Controls */}
                  {selectedSite === 'group' && siteData && (
                    <div className="space-y-6">
                      <div className="bg-neutral-900/30 p-4 rounded-xl border border-neutral-900 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-white">Pricing Track visibility</h4>
                          <p className="text-xs text-neutral-500 mt-0.5">Toggle whether the pricing section is visible to public visitors on icuni.org</p>
                        </div>
                        <button 
                          id="toggle-group-pricing"
                          onClick={() => toggleGroupPricing(overview?.group?.stats?.pricingVisible)}
                          disabled={busy}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            overview?.group?.stats?.pricingVisible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25'
                          }`}
                        >
                          {overview?.group?.stats?.pricingVisible ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          {overview?.group?.stats?.pricingVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>

                      {/* Settings Table */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Site Settings</h4>
                        <div className="overflow-x-auto border border-neutral-900 rounded-xl">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400">
                                <th className="p-3 font-semibold">Key</th>
                                <th className="p-3 font-semibold">Value</th>
                                <th className="p-3 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {siteData.settings?.map((s: any) => (
                                <tr key={s.Key} className="border-b border-neutral-900/50">
                                  <td className="p-3 text-neutral-400 font-mono font-bold">{s.Key}</td>
                                  <td className="p-3 text-white">
                                    {editingSetting && editingSetting.key === s.Key ? (
                                      <input 
                                        value={editingSetting.value} 
                                        onChange={e => setEditingSetting({ key: s.Key, value: e.target.value })}
                                        className="bg-neutral-800 text-white text-xs border border-neutral-700 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:border-[#00bfff]"
                                      />
                                    ) : (
                                      <span>{s.Value}</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    {editingSetting && editingSetting.key === s.Key ? (
                                      <div className="flex gap-1.5 justify-end">
                                        <button onClick={() => saveGroupSetting(s.Key, editingSetting.value)} className="px-2.5 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold hover:bg-emerald-600 transition-all cursor-pointer">Save</button>
                                        <button onClick={() => setEditingSetting(null)} className="px-2.5 py-1 bg-neutral-800 text-neutral-400 rounded text-[10px] font-bold hover:bg-neutral-700 transition-all cursor-pointer">Cancel</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => setEditingSetting({ key: s.Key, value: s.Value })} className="text-[10px] text-[#00bfff] hover:underline cursor-pointer">Edit</button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Contact form leads */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">Contact Form leads</h4>
                        <div className="overflow-x-auto border border-neutral-900 rounded-xl">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-neutral-900 bg-neutral-900/30 text-neutral-400">
                                <th className="p-3 font-semibold">Name</th>
                                <th className="p-3 font-semibold">Email</th>
                                <th className="p-3 font-semibold">Message</th>
                                <th className="p-3 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {siteData.contacts?.map((c: any) => (
                                <tr key={c._rowIndex} className="border-b border-neutral-900/50 hover:bg-neutral-900/10">
                                  <td className="p-3 text-white font-bold">{c.Name}</td>
                                  <td className="p-3 text-neutral-400">{c.Email}</td>
                                  <td className="p-3 text-neutral-400 max-w-sm truncate" title={c.Message}>{c.Message}</td>
                                  <td className="p-3">
                                    <select 
                                      id={`select-contact-status-${c._rowIndex}`}
                                      value={c.Status || 'new'}
                                      onChange={e => updateContactStatus(c._rowIndex, e.target.value)}
                                      className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                                    >
                                      <option value="new">New</option>
                                      <option value="read">Read</option>
                                      <option value="replied">Replied</option>
                                      <option value="archived">Archived</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                              {(!siteData.contacts || siteData.contacts.length === 0) && (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-neutral-600 font-medium">No contact form messages received yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Starterclass Site Controls */}
                  {selectedSite === 'starterclass' && siteData && (
                    <div className="space-y-4">
                      <div className="bg-[#00bfff]/5 border border-[#00bfff]/10 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-white font-bold text-sm">Full Course Administration Console</h4>
                          <p className="text-xs text-neutral-500 mt-1">To configure sessions, send course emails, and manage student details, use the dedicated Starterclass section.</p>
                        </div>
                        <button 
                          onClick={() => {
                            adminActions.setSection('starterclass')
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-bold hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer whitespace-nowrap"
                        >
                          Go to Starterclass <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-900">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Registrations Count</span>
                          <span className="text-2xl font-bold text-white mt-1 block">{siteData.registrations?.length || 0}</span>
                        </div>
                        <div className="bg-neutral-900/40 p-4 rounded-xl border border-neutral-900">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Cohorts & Sessions</span>
                          <span className="text-2xl font-bold text-white mt-1 block">{siteData.sessions?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Registry ─── */}
      {activeTab === 'registry' && (
        <>
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
        </>
      )}

      {/* ─── TAB: Client Projects ─── */}
      {activeTab === 'client_projects' && (
        <div className="space-y-4 animate-fade-in">
          {(projects || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
              <Layers className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No client projects yet</p>
              <p className="text-xs mt-1">Projects created from the New Project page appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(projects || []).map((p: any) => (
                <div key={p.project_id || p.id} className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border
                      ${p.status === 'completed' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                        p.status === 'in_progress' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' :
                        'text-neutral-400 border-neutral-700 bg-neutral-800'}`}>
                      {p.status || 'New'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    {p.client_id && <span>Client: {p.client_id}</span>}
                    {p.type && <span>Type: {p.type}</span>}
                    {p.estimated_cost && <span>Est: GH₵{Number(p.estimated_cost).toLocaleString()}</span>}
                  </div>
                  {p.description && <p className="text-xs text-neutral-600 mt-2 line-clamp-2">{p.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: Portfolio ─── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4 animate-fade-in">
          {!portfolioProjects || portfolioProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-600">
              <Globe className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No portfolio projects</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioProjects.map((p: any, i: number) => (
                <div key={p.id || i} className="group rounded-xl bg-neutral-900/40 border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-all">
                  {p.thumbnail && (
                    <div className="h-36 overflow-hidden bg-neutral-950">
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-white mb-1">{p.title}</h4>
                    <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{p.description || p.subtitle || ''}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(p.technologies || p.tech || []).map((t: string) => (
                        <span key={t} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
