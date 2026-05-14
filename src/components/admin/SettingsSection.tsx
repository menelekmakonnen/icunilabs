import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { KeyRound, Hash, Shield, Bell, Save, Check, Eye, EyeOff } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff]/30 transition-all text-sm'
const cardCls = 'bg-neutral-900/50 border border-neutral-800 rounded-xl p-6'
const btnPrimary = 'flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(0,191,255,0.3)] transition-all disabled:opacity-40 cursor-pointer'

export default function SettingsSection() {
  const { user, loading, error } = useAdminStore()

  // Clear stale errors from other sections on mount
  useEffect(() => { if (error) adminActions.setError('') }, [])
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Settings</h2>
        <p className="text-sm text-neutral-500 mt-1">Manage your login methods, security, and preferences</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

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
    </div>
  )
}
