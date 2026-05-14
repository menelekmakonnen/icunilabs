import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAdminStore, adminActions } from '../../store/useAdminStore'
import { Camera, Lock, Key, Phone, Mail, Save, CheckCircle2, AlertCircle, Eye, EyeOff, User, Shield } from 'lucide-react'

const inp = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] transition-all placeholder:text-neutral-600"

interface ProfileData {
  name: string
  email: string
  phone: string
  role: string
  profile_pic_url: string
  cover_image_url: string
  contact_details: {
    secondary_phone?: string
    personal_email?: string
  }
  has_password: boolean
  has_pin: boolean
}

export default function ProfileSection() {
  const { user } = useAdminStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  // Editable fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [profilePic, setProfilePic] = useState('')
  const [coverImage, setCoverImage] = useState('')

  // Password
  const [showPwSection, setShowPwSection] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)

  // PIN
  const [showPinSection, setShowPinSection] = useState(false)
  const [newPin, setNewPin] = useState('')



  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setProfileLoading(true)
    try {
      const data = await Promise.race([
        adminActions.getProfile(),
        new Promise<null>(r => setTimeout(() => r(null), 8000)),
      ])
      if (data) {
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setSecondaryPhone(data.contact_details?.secondary_phone || '')
        setPersonalEmail(data.contact_details?.personal_email || '')
        setProfilePic(data.profile_pic_url || '')
        setCoverImage(data.cover_image_url || '')
      } else {
        // Fallback: populate from local user store
        if (user) {
          setName(user.name || '')
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: '',
            role: user.role || '',
            profile_pic_url: '',
            cover_image_url: '',
            contact_details: {},
            has_password: false,
            has_pin: false,
          })
        }
      }
    } catch {
      if (user) {
        setName(user.name || '')
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: '',
          role: user.role || '',
          profile_pic_url: '',
          cover_image_url: '',
          contact_details: {},
          has_password: false,
          has_pin: false,
        })
      }
    }
    setProfileLoading(false)
  }

  function flash(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSaveProfile() {
    setSaving(true)
    const ok = await adminActions.updateProfile({
      name,
      phone,
      profile_pic_url: profilePic,
      cover_image_url: coverImage,
      contact_details: {
        secondary_phone: secondaryPhone,
        personal_email: personalEmail,
      },
    })
    setSaving(false)
    if (ok) {
      flash('Profile saved successfully.')
      // Reload profile from server to get persisted data
      await loadProfile()
    } else {
      flash('Failed to save profile.', 'err')
    }
  }

  async function handleSetPassword() {
    if (newPw !== confirmPw) return flash('Passwords do not match.', 'err')
    if (newPw.length < 8) return flash('Password must be at least 8 characters.', 'err')
    setSaving(true)
    const ok = await adminActions.setPassword(newPw)
    setSaving(false)
    if (ok) { flash('Password updated.'); setNewPw(''); setConfirmPw(''); setShowPwSection(false) }
    else flash('Failed to set password.', 'err')
  }

  async function handleSetPin() {
    if (!/^\d{4}$/.test(newPin)) return flash('PIN must be exactly 4 digits.', 'err')
    setSaving(true)
    const ok = await adminActions.setPin(newPin)
    setSaving(false)
    if (ok) { flash('Quick PIN updated.'); setNewPin(''); setShowPinSection(false) }
    else flash('Failed to set PIN.', 'err')
  }

  const [uploading, setUploading] = useState<'pic'|'cover'|null>(null)

  function handleFileSelect(type: 'pic' | 'cover') {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      if (file.size > 5 * 1024 * 1024) { flash('Image must be under 5MB.', 'err'); return }

      // Show local preview immediately
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        if (type === 'pic') setProfilePic(base64)
        else setCoverImage(base64)

        // Upload to Drive
        setUploading(type)
        try {
          const result = await adminActions.uploadProfileImage(base64, file.name, type === 'pic' ? 'profile' : 'cover')
          if (result?.url) {
            if (type === 'pic') setProfilePic(result.url)
            else setCoverImage(result.url)
            flash('Image uploaded successfully.')
          } else {
            flash('Upload failed. Image shown locally only.', 'err')
          }
        } catch {
          flash('Upload failed. Image shown locally only.', 'err')
        }
        setUploading(null)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  if (profileLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="max-w-3xl">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl ${
            toast.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {toast.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </motion.div>
      )}

      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative h-48 rounded-2xl overflow-hidden border border-neutral-800 mb-8 group cursor-pointer"
        onClick={() => handleFileSelect('cover')}
      >
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#00bfff]/10 via-neutral-900 to-[#ff7a00]/10" />
        )}
        {uploading === 'cover' ? (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 text-[10px] text-neutral-400 font-medium">
          {uploading === 'cover' ? 'Uploading...' : 'Click to change cover'}
        </div>
      </motion.div>

      {/* Profile Picture + Name Row */}
      <div className="flex items-end gap-6 -mt-20 mb-8 ml-6 relative z-10">
        <div
          className="relative w-24 h-24 rounded-2xl border-4 border-neutral-950 overflow-hidden bg-neutral-800 group cursor-pointer shadow-xl"
          onClick={() => handleFileSelect('pic')}
        >
          {profilePic ? (
            <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#00bfff]/20 to-[#ff7a00]/20">
              <User className="w-10 h-10 text-neutral-500" />
            </div>
          )}
          {uploading === 'pic' ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
              <svg className="animate-spin w-6 h-6 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <div className="pb-1">
          <h2 className="text-2xl font-bold text-white">{name || user?.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-neutral-500">{profile?.email}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#ff7a00]/10 border border-[#ff7a00]/30 text-[#ff7a00] text-[10px] font-bold tracking-wider">{profile?.role}</span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-[#00bfff]" /> Personal Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Work Email</label>
            <input value={profile?.email || ''} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
            <p className="text-[10px] text-neutral-600 mt-1">Contact an admin to change email</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              <Phone className="w-3 h-3 inline mr-1" />Phone Number
            </label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="+233 xxx xxx xxxx" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              <Phone className="w-3 h-3 inline mr-1" />Secondary Phone
            </label>
            <input value={secondaryPhone} onChange={e => setSecondaryPhone(e.target.value)} className={inp} placeholder="+233 xxx xxx xxxx" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              <Mail className="w-3 h-3 inline mr-1" />Personal Email
            </label>
            <input type="email" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} className={inp} placeholder="personal@example.com" />
          </div>
        </div>

        <button
          onClick={handleSaveProfile} disabled={saving}
          className="mt-6 flex items-center gap-2 bg-gradient-to-r from-[#00bfff] to-[#00e5ff] text-black font-bold py-3 px-6 rounded-lg hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all disabled:opacity-50 cursor-pointer text-sm"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </motion.section>

      {/* Security */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 mb-6"
      >
        <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#ff7a00]" /> Security
        </h3>

        {/* Password */}
        <div className="border border-neutral-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-white">Password</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${profile?.has_password ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {profile?.has_password ? 'SET' : 'NOT SET'}
              </span>
              <button onClick={() => setShowPwSection(!showPwSection)} className="text-xs text-[#00bfff] hover:underline cursor-pointer">
                {showPwSection ? 'Cancel' : profile?.has_password ? 'Change' : 'Set Up'}
              </button>
            </div>
          </div>
          {showPwSection && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className={inp} placeholder="New password" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inp} placeholder="Confirm password" />
              <p className="text-[10px] text-neutral-600">Min 8 chars, uppercase, lowercase, number, special character</p>
              <button onClick={handleSetPassword} disabled={saving || !newPw || !confirmPw}
                className="flex items-center gap-2 bg-[#ff7a00] text-white font-bold py-2.5 px-5 rounded-lg text-sm hover:bg-[#ff9533] transition-all disabled:opacity-40 cursor-pointer">
                <Lock className="w-3.5 h-3.5" /> {saving ? 'Setting...' : 'Set Password'}
              </button>
            </motion.div>
          )}
        </div>

        {/* PIN */}
        <div className="border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-white">Quick PIN</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${profile?.has_pin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {profile?.has_pin ? 'SET' : 'NOT SET'}
              </span>
              <button onClick={() => setShowPinSection(!showPinSection)} className="text-xs text-[#00bfff] hover:underline cursor-pointer">
                {showPinSection ? 'Cancel' : profile?.has_pin ? 'Change' : 'Set Up'}
              </button>
            </div>
          </div>
          {showPinSection && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
              <input type="text" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inp} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="0000" maxLength={4} />
              <p className="text-[10px] text-neutral-600">4-digit PIN for quick login</p>
              <button onClick={handleSetPin} disabled={saving || newPin.length !== 4}
                className="flex items-center gap-2 bg-[#ff7a00] text-white font-bold py-2.5 px-5 rounded-lg text-sm hover:bg-[#ff9533] transition-all disabled:opacity-40 cursor-pointer">
                <Key className="w-3.5 h-3.5" /> {saving ? 'Setting...' : 'Set PIN'}
              </button>
            </motion.div>
          )}
        </div>
      </motion.section>
    </div>
  )
}

const pulse = 'animate-pulse bg-neutral-800/60 rounded'

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl">
      {/* Cover image ghost */}
      <div className={`h-48 rounded-2xl ${pulse} mb-8`} />

      {/* Avatar + name row */}
      <div className="flex items-end gap-6 -mt-20 mb-8 ml-6 relative z-10">
        <div className={`w-24 h-24 rounded-2xl border-4 border-neutral-950 ${pulse}`} />
        <div className="pb-1 space-y-2">
          <div className={`h-6 w-40 ${pulse}`} />
          <div className="flex gap-2">
            <div className={`h-4 w-48 ${pulse}`} />
            <div className={`h-4 w-16 rounded-full ${pulse}`} />
          </div>
        </div>
      </div>

      {/* Personal Information section */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-5 h-5 rounded ${pulse}`} />
          <div className={`h-5 w-44 ${pulse}`} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className={`h-3 w-24 mb-2 ${pulse}`} />
              <div className={`h-11 w-full rounded-lg ${pulse}`} />
            </div>
          ))}
          <div className="md:col-span-2">
            <div className={`h-3 w-28 mb-2 ${pulse}`} />
            <div className={`h-11 w-full rounded-lg ${pulse}`} />
          </div>
        </div>
        <div className={`h-11 w-36 mt-6 rounded-lg ${pulse}`} />
      </div>

      {/* Security section */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className={`w-5 h-5 rounded ${pulse}`} />
          <div className={`h-5 w-24 ${pulse}`} />
        </div>
        {/* Password row */}
        <div className="border border-neutral-800 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${pulse}`} />
              <div className={`h-4 w-20 ${pulse}`} />
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-5 w-14 rounded-full ${pulse}`} />
              <div className={`h-4 w-16 ${pulse}`} />
            </div>
          </div>
        </div>
        {/* PIN row */}
        <div className="border border-neutral-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${pulse}`} />
              <div className={`h-4 w-20 ${pulse}`} />
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-5 w-14 rounded-full ${pulse}`} />
              <div className={`h-4 w-16 ${pulse}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
