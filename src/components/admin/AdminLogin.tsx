import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Lock, Mail, KeyRound, Hash } from 'lucide-react'

const inputCls = 'w-full px-4 py-3 bg-neutral-900/80 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff]/30 transition-all text-sm'
const btnCls = 'w-full py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
const primaryBtn = `${btnCls} bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white hover:shadow-[0_0_20px_rgba(0,191,255,0.3)]`
const ghostBtn = 'text-xs text-neutral-500 hover:text-[#00bfff] transition-colors cursor-pointer'

export default function AdminLogin() {
  const { loading, error, otpSent, loginMethod } = useAdminStore()
  const [email, setEmail] = useState('hello@icuni.org')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')

  useEffect(() => { adminActions.validateSession() }, [])

  const handleOTPSend = (e: React.FormEvent) => {
    e.preventDefault()
    adminActions.sendOTP(email)
  }
  const handleOTPVerify = (e: React.FormEvent) => {
    e.preventDefault()
    adminActions.verifyOTP(email, otp)
  }
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault()
    adminActions.passwordLogin(email, password)
  }
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault()
    adminActions.pinLogin(email, pin)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {/* Ambient */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00bfff]/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#00bfff]/20 to-[#0099cc]/10 border border-[#00bfff]/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#00bfff]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Operations Console</h1>
          <p className="text-sm text-neutral-500 mt-1">ICUNI Labs — Authorized Personnel Only</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm shadow-2xl">
          {/* Method tabs */}
          <div className="flex gap-1 mb-6 bg-neutral-900 rounded-lg p-1">
            {([['otp', 'Email OTP', Mail], ['password', 'Password', KeyRound], ['pin', 'Quick PIN', Hash]] as const).map(([m, label, Icon]) => (
              <button key={m} onClick={() => adminActions.setLoginMethod(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${loginMethod === m ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP Flow */}
          {loginMethod === 'otp' && !otpSent && (
            <form onSubmit={handleOTPSend} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="hello@icuni.org" required />
              </div>
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? 'Sending...' : 'Send Login Code'}
              </button>
            </form>
          )}

          {loginMethod === 'otp' && otpSent && (
            <form onSubmit={handleOTPVerify} className="space-y-4">
              <p className="text-xs text-neutral-400">A 6-digit code was sent to <span className="text-[#00bfff]">{email}</span></p>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Login Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="000000" maxLength={6} required autoFocus />
              </div>
              <button type="submit" disabled={loading || otp.length < 6} className={primaryBtn}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => adminActions.sendOTP(email)} className={ghostBtn}>Resend code</button>
            </form>
          )}

          {/* Password */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Enter password" required />
              </div>
              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* PIN */}
          {loginMethod === 'pin' && (
            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">4-Digit PIN</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={`${inputCls} text-center text-3xl tracking-[1em] font-mono`} placeholder="••••" maxLength={4} required />
              </div>
              <button type="submit" disabled={loading || pin.length < 4} className={primaryBtn}>
                {loading ? 'Logging in...' : 'Login with PIN'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-neutral-600 mt-6 tracking-wider uppercase">
          ICUNI Labs — Custom Business Operations Systems
        </p>
      </motion.div>
    </div>
  )
}
