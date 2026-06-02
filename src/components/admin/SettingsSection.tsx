import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { KeyRound, Hash, Shield, Bell, Save, Check, Eye, EyeOff, ChevronUp, ChevronDown, Plus, RotateCcw, Layout, Pencil, Trash2, GripVertical } from 'lucide-react'
import { DEFAULT_NAV_ITEMS, SIDEBAR_CONFIG_KEY } from './vercel/VercelSidebar'

const inputCls = 'w-full px-4 py-3 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff]/30 transition-all text-sm'
const cardCls = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-6'
const btnPrimary = 'flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40 cursor-pointer whitespace-nowrap'

type SettingsTab = 'security' | 'sidebar'

export default function SettingsSection() {
  const { user, loading, error } = useAdminStore()
  const isGodmode = user?.role === 'Godmode'

  // Clear stale errors from other sections on mount
  useEffect(() => { if (error) adminActions.setError('') }, [])

  const [activeTab, setActiveTab] = useState<SettingsTab>('security')

  const tabs: { id: SettingsTab; label: string; icon: any; godmodeOnly?: boolean }[] = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'sidebar', label: 'Sidebar Layout', icon: Layout, godmodeOnly: true },
  ]

  const visibleTabs = tabs.filter(t => !t.godmodeOnly || isGodmode)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage your login methods, security, and preferences</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {/* Tab bar */}
      {visibleTabs.length > 1 && (
        <div className="flex gap-1 bg-neutral-900/50 rounded-xl p-1 border border-neutral-800 w-fit">
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'security' && <SecurityTab loading={loading} />}
      {activeTab === 'sidebar' && isGodmode && <SidebarLayoutTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SECURITY TAB (original settings content)
// ═══════════════════════════════════════════════════════════
function SecurityTab({ loading }: { loading: boolean }) {
  const { user } = useAdminStore()
  const [pw, setPw] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pinSuccess, setPinSuccess] = useState(false)

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== pwConfirm) { adminActions.setError('Passwords do not match.'); return }
    const ok = await adminActions.setPassword(pw)
    if (ok) { setPwSuccess(true); setPw(''); setPwConfirm(''); setTimeout(() => setPwSuccess(false), 3000) }
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin !== pinConfirm) { adminActions.setError('PINs do not match.'); return }
    const ok = await adminActions.setPin(pin)
    if (ok) { setPinSuccess(true); setPin(''); setPinConfirm(''); setTimeout(() => setPinSuccess(false), 3000) }
  }

  return (
    <>
      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardCls}>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[#00bfff]" />
          <h3 className="text-lg font-bold text-white">Profile</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-neutral-500">Name:</span> <span className="text-white font-medium ml-2">{user?.name}</span></div>
          <div><span className="text-neutral-500">Email:</span> <span className="text-white font-medium ml-2">{user?.email}</span></div>
          <div><span className="text-neutral-500">Role:</span> <span className="text-[#ff7a00] font-bold ml-2">{user?.role}</span></div>
        </div>
      </motion.div>

      {/* Set Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardCls}>
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="w-5 h-5 text-[#ff7a00]" />
          <h3 className="text-lg font-bold text-white">Password Login</h3>
          <span className="text-xs text-neutral-600 ml-auto">Set or change your password for direct login</span>
        </div>
        <form onSubmit={handleSetPassword} className="space-y-3">
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
              className={inputCls} placeholder="New password (min 8 chars, uppercase, number, special)" required minLength={8} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input type={showPw ? 'text' : 'password'} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
            className={inputCls} placeholder="Confirm password" required minLength={8} />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading || pw.length < 8} className={btnPrimary}>
              <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Set Password'}
            </button>
            {pwSuccess && <span className="flex items-center gap-1 text-emerald-400 text-sm"><Check className="w-4 h-4" />Password updated</span>}
          </div>
          <p className="text-xs text-neutral-600">Requirements: 8+ chars, uppercase, lowercase, number, special character</p>
        </form>
      </motion.div>

      {/* Set Quick PIN */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardCls}>
        <div className="flex items-center gap-3 mb-4">
          <Hash className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Quick PIN</h3>
          <span className="text-xs text-neutral-600 ml-auto">4-digit PIN for fast login on trusted devices</span>
        </div>
        <form onSubmit={handleSetPin} className="space-y-3">
          <div className="flex gap-3">
            <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`${inputCls} text-center text-xl tracking-[0.8em] font-mono max-w-[180px]`} placeholder="••••" maxLength={4} required />
            <input type="password" value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className={`${inputCls} text-center text-xl tracking-[0.8em] font-mono max-w-[180px]`} placeholder="Confirm" maxLength={4} required />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={loading || pin.length < 4} className={btnPrimary}>
              <Save className="w-4 h-4" />{loading ? 'Saving...' : 'Set PIN'}
            </button>
            {pinSuccess && <span className="flex items-center gap-1 text-emerald-400 text-sm"><Check className="w-4 h-4" />PIN updated</span>}
          </div>
        </form>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cardCls}>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            ['Email notifications', 'Receive SLA alerts, bug reports, and application notifications via email', true],
            ['Browser notifications', 'Desktop push notifications for urgent alerts', true],
          ].map(([label, desc, _def], i) => (
            <label key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors cursor-pointer">
              <input type="checkbox" defaultChecked={!!_def} className="mt-1 accent-[#00bfff]" />
              <div>
                <div className="text-sm text-white font-medium">{label as string}</div>
                <div className="text-xs text-neutral-500">{desc as string}</div>
              </div>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Security Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${cardCls} border-[#00bfff]/10`}>
        <h3 className="text-sm font-bold text-neutral-400 mb-3 uppercase tracking-wider">Security Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-black text-white">24h</div>
            <div className="text-xs text-neutral-500">Session Duration</div>
          </div>
          <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-black text-white">5</div>
            <div className="text-xs text-neutral-500">Max Devices</div>
          </div>
          <div className="text-center p-3 bg-neutral-800/50 rounded-lg">
            <div className="text-2xl font-black text-white">30d</div>
            <div className="text-xs text-neutral-500">Device Trust</div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// SIDEBAR LAYOUT TAB (GodMode only)
// ═══════════════════════════════════════════════════════════
interface SidebarItem {
  id: string
  label: string
  section?: string
}

function SidebarLayoutTab() {
  const [items, setItems] = useState<SidebarItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [newSectionName, setNewSectionName] = useState('')
  const [saved, setSaved] = useState(false)
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null)
  const [editSectionLabel, setEditSectionLabel] = useState('')

  // Load items from localStorage or defaults
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_CONFIG_KEY)
      if (raw) {
        setItems(JSON.parse(raw))
      } else {
        setItems(DEFAULT_NAV_ITEMS.map(n => ({ id: n.id, label: n.label, section: n.section })))
      }
    } catch {
      setItems(DEFAULT_NAV_ITEMS.map(n => ({ id: n.id, label: n.label, section: n.section })))
    }
  }, [])

  // Group items by section for display
  const grouped = useCallback((): { section: string; items: SidebarItem[] }[] => {
    const result: { section: string; items: SidebarItem[] }[] = []
    let currentSection = ''
    items.forEach(item => {
      if (item.section && item.section !== currentSection) {
        currentSection = item.section
        result.push({ section: currentSection, items: [item] })
      } else {
        if (result.length === 0) result.push({ section: '', items: [] })
        result[result.length - 1].items.push(item)
      }
    })
    return result
  }, [items])

  const moveItem = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
    if (toIdx < 0 || toIdx >= items.length) return
    const newItems = [...items]
    const item = newItems[fromIdx]
    // If moving into a different section group, inherit the section
    if (direction === 'up' && newItems[toIdx].section && !item.section) {
      // moving above a section header — take its section
    }
    ;[newItems[fromIdx], newItems[toIdx]] = [newItems[toIdx], newItems[fromIdx]]
    setItems(newItems)
  }

  const startEditLabel = (item: SidebarItem) => {
    setEditingId(item.id)
    setEditLabel(item.label)
  }

  const saveLabel = () => {
    if (!editingId || !editLabel.trim()) return
    setItems(prev => prev.map(i => i.id === editingId ? { ...i, label: editLabel.trim() } : i))
    setEditingId(null)
  }

  const startEditSection = (groupIdx: number, currentLabel: string) => {
    setEditingSectionIdx(groupIdx)
    setEditSectionLabel(currentLabel)
  }

  const saveSectionLabel = () => {
    if (editingSectionIdx === null || !editSectionLabel.trim()) return
    const groups = grouped()
    const group = groups[editingSectionIdx]
    if (!group) return
    const oldLabel = group.section
    setItems(prev => prev.map(i => i.section === oldLabel ? { ...i, section: editSectionLabel.trim() } : i))
    setEditingSectionIdx(null)
  }

  const addSection = () => {
    if (!newSectionName.trim()) return
    // Add a placeholder item to start the section
    setItems(prev => [...prev, { id: `section-${Date.now()}`, label: '(New Item)', section: newSectionName.trim() }])
    setNewSectionName('')
  }

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    // Only save real items (not placeholder section items)
    const realItems = items.filter(i => !i.id.startsWith('section-'))
    localStorage.setItem(SIDEBAR_CONFIG_KEY, JSON.stringify(realItems))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // Force sidebar to re-render by dispatching a storage event
    window.dispatchEvent(new Event('storage'))
  }

  const handleReset = () => {
    localStorage.removeItem(SIDEBAR_CONFIG_KEY)
    setItems(DEFAULT_NAV_ITEMS.map(n => ({ id: n.id, label: n.label, section: n.section })))
    setSaved(false)
    window.dispatchEvent(new Event('storage'))
  }

  const groups = grouped()

  // Compute flat index from group/item indices
  const flatIdx = (groupIdx: number, itemIdx: number): number => {
    let idx = 0
    for (let g = 0; g < groupIdx; g++) idx += groups[g].items.length
    return idx + itemIdx
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className={cardCls}>
        <div className="flex items-center gap-3 mb-2">
          <Layout className="w-5 h-5 text-[#00bfff]" />
          <h3 className="text-lg font-bold text-white">Sidebar Layout</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-6">Rearrange, rename, and group sidebar items. Changes are saved per-browser.</p>

        <div className="space-y-4">
          {groups.map((group, gi) => (
            <div key={gi} className="rounded-xl bg-neutral-900/30 border border-neutral-800 overflow-hidden">
              {/* Section header */}
              {group.section && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800/50 border-b border-neutral-800">
                  {editingSectionIdx === gi ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input value={editSectionLabel} onChange={e => setEditSectionLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveSectionLabel()}
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00bfff] flex-1"
                        autoFocus />
                      <button onClick={saveSectionLabel} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex-1">{group.section}</span>
                      <button onClick={() => startEditSection(gi, group.section)} className="text-neutral-600 hover:text-neutral-300 cursor-pointer" title="Rename section">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Items */}
              {group.items.map((item, ii) => {
                const idx = flatIdx(gi, ii)
                const isEditing = editingId === item.id
                const isPlaceholder = item.id.startsWith('section-')

                return (
                  <div key={item.id}
                    className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800/50 last:border-b-0 hover:bg-neutral-800/30 transition-colors group">
                    <GripVertical className="w-3.5 h-3.5 text-neutral-700 flex-shrink-0" />

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveLabel()}
                          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00bfff] flex-1"
                          autoFocus />
                        <button onClick={saveLabel} className="text-emerald-400 hover:text-emerald-300 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>
                        <span className={`text-sm flex-1 ${isPlaceholder ? 'text-neutral-600 italic' : 'text-white'}`}>{item.label}</span>
                        <span className="text-[10px] text-neutral-700 font-mono">{item.id}</span>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0}
                        className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer" title="Move up">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1}
                        className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer" title="Move down">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {!isEditing && (
                        <button onClick={() => startEditLabel(item)}
                          className="p-1 text-neutral-500 hover:text-[#00bfff] cursor-pointer" title="Rename">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {isPlaceholder && (
                        <button onClick={() => removeItem(idx)}
                          className="p-1 text-neutral-500 hover:text-red-400 cursor-pointer" title="Remove">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Add section */}
        <div className="flex items-center gap-2 mt-4">
          <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSection()}
            className={inputCls + ' max-w-[220px] !py-2 !text-xs'}
            placeholder="New section name..." />
          <button onClick={addSection} disabled={!newSectionName.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-400 hover:text-white border border-neutral-700 rounded-lg cursor-pointer transition-colors disabled:opacity-30">
            <Plus className="w-3.5 h-3.5" /> Add Section
          </button>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-800">
          <button onClick={handleSave} className={btnPrimary}>
            <Save className="w-4 h-4" /> Save Layout
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-400 hover:text-white border border-neutral-700 rounded-lg cursor-pointer transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset to Default
          </button>
          {saved && <span className="flex items-center gap-1 text-emerald-400 text-sm"><Check className="w-4 h-4" /> Saved — refresh to see changes</span>}
        </div>
      </div>
    </motion.div>
  )
}
