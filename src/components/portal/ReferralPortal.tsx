import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Plus, X, Users, TrendingUp, Clock, DollarSign, ChevronRight, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

type ViewMode = 'auth' | 'dashboard';
type AuthTab = 'login' | 'signup';

interface Referral {
  referralId: string;
  leadName: string;
  leadCompany: string;
  status: string;
  dealValue: number;
  payoutAmount: number;
  dateSubmitted: string;
  dateClosed: string;
}

interface DashboardData {
  referrer: { name: string; email: string; joinDate: string };
  stats: { totalReferrals: number; closedWon: number; closedLost: number; pending: number; totalEarned: number; conversionRate: number };
  referrals: Referral[];
}

interface ReferrerSession {
  referrerId: string;
  name: string;
  email: string;
}

async function apiCall(payload: Record<string, unknown>) {
  if (!API_URL) {
    await new Promise(r => setTimeout(r, 800));
    return null;
  }
  try {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
    return await res.json();
  } catch {
    return null;
  }
}

const statusColors: Record<string, string> = {
  'Submitted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Meeting Set': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'In Progress': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Closed Won': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Closed Lost': 'bg-red-500/20 text-red-400 border-red-500/30',
};

// ─── Input field styling ───
const inputCls = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600";
const btnPrimary = "w-full bg-transparent border border-[#00bfff]/50 text-[#00bfff] shadow-[inset_0_0_10px_rgba(0,191,255,0.05)] font-bold py-3 rounded-lg hover:bg-[#00bfff]/10 hover:shadow-[0_0_15px_rgba(0,191,255,0.2)] hover:-translate-y-[1px] transition-all duration-300 cursor-pointer";
const cardCls = "bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

function formatCurrency(val: number) {
  return 'GH\u20B5' + val.toLocaleString();
}

function formatDate(iso: string) {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

// ─── MAIN COMPONENT ───
export default function ReferralPortal() {
  const [view, setView] = useState<ViewMode>('auth');
  const [session, setSession] = useState<ReferrerSession | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('icuni_referrer');
    if (saved) {
      try {
        const s = JSON.parse(saved) as ReferrerSession;
        setSession(s);
        setView('dashboard');
      } catch { /* ignore */ }
    }
  }, []);

  // Fetch dashboard when session is set
  useEffect(() => {
    if (session && view === 'dashboard') fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, view]);

  async function fetchDashboard() {
    if (!session) return;
    setLoading(true);
    const res = await apiCall({ action: 'get_dashboard', referrerId: session.referrerId });
    if (res?.data) setDashboard(res.data);
    else {
      // Demo data fallback
      setDashboard({
        referrer: { name: session.name, email: session.email, joinDate: new Date().toISOString() },
        stats: { totalReferrals: 0, closedWon: 0, closedLost: 0, pending: 0, totalEarned: 0, conversionRate: 0 },
        referrals: []
      });
    }
    setLoading(false);
  }

  function handleLogin(s: ReferrerSession) {
    setSession(s);
    localStorage.setItem('icuni_referrer', JSON.stringify(s));
    setView('dashboard');
  }

  function handleLogout() {
    setSession(null);
    setDashboard(null);
    localStorage.removeItem('icuni_referrer');
    setView('auth');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white">
      <AnimatePresence mode="wait">
        {view === 'auth' ? (
          <AuthView key="auth" onLogin={handleLogin} />
        ) : (
          <DashboardView
            key="dash"
            session={session!}
            dashboard={dashboard}
            loading={loading}
            onLogout={handleLogout}
            onRefresh={fetchDashboard}
            showSubmitModal={showSubmitModal}
            setShowSubmitModal={setShowSubmitModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AUTH VIEW ───
function AuthView({ onLogin }: { onLogin: (s: ReferrerSession) => void }) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');

  // Signup form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [background, setBackground] = useState('');
  const [payoutPreference, setPayoutPreference] = useState<'momo' | 'cash'>('momo');

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await apiCall({ action: 'referrer_login', email: loginEmail });
    if (res?.status === 200) {
      setPendingEmail(loginEmail);
      setOtpStep(true);
    } else if (res?.status === 404) {
      setError('No account found. Sign up first.');
    } else {
      // Demo fallback — send OTP step
      setPendingEmail(loginEmail);
      setOtpStep(true);
    }
    setBusy(false);
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await apiCall({ action: 'referrer_verify_otp', email: pendingEmail, otp: otpCode });
    if (res?.status === 200 && res.data) {
      onLogin({ referrerId: res.data.referrerId, name: res.data.name, email: res.data.email });
    } else if (res?.message) {
      setError(res.message);
    } else {
      // Demo fallback
      onLogin({ referrerId: 'DEMO-001', name: 'Demo User', email: pendingEmail });
    }
    setBusy(false);
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await apiCall({ action: 'referrer_signup', name, email, phone, background, payoutPreference });
    if (res?.status === 200 && res.data) {
      onLogin({ referrerId: res.data.referrerId, name: res.data.name, email: res.data.email });
    } else if (res?.status === 409) {
      setError('This email is already registered. Try logging in.');
    } else {
      // Demo fallback
      onLogin({ referrerId: 'DEMO-' + Date.now(), name, email });
    }
    setBusy(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 pt-20"
    >
      {/* Back link */}
      <a href="#" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to site
      </a>

      <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className={`${cardCls} w-full max-w-md p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#ff6600] to-[#00bfff] p-[1px]">
            <div className="w-full h-full rounded-xl bg-neutral-950 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#00bfff]" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Refer & Earn</h2>
          <p className="text-neutral-400 text-sm">Earn <span className="text-[#ff6600] font-semibold">GH&#x20B5;1,000+</span> per closed referral</p>
        </div>

        {/* Tab toggle */}
        <div className="flex mb-6 bg-neutral-900 rounded-lg p-1">
          {(['login', 'signup'] as AuthTab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${tab === t ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >{t === 'login' ? 'Log In' : 'Sign Up'}</button>
          ))}
        </div>

        {error && <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{error}</div>}

        <AnimatePresence mode="wait">
          {otpStep ? (
            <motion.form key="otp" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onSubmit={handleOtpVerify} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#00bfff]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#00bfff]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm text-neutral-400">We sent a 6-digit code to <span className="text-white font-medium">{pendingEmail}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Enter OTP</label>
                <input type="text" required maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="------" autoFocus />
              </div>
              <button type="submit" disabled={busy || otpCode.length < 6} className={`${btnPrimary} mt-2 ${(busy || otpCode.length < 6) ? 'opacity-60' : ''}`}>
                {busy ? 'Verifying...' : 'Verify & Log In'}
              </button>
              <button type="button" onClick={() => { setOtpStep(false); setOtpCode(''); }} className="w-full text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer mt-2">Back</button>
            </motion.form>
          ) : tab === 'login' ? (
            <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inputCls} placeholder="you@email.com" />
              </div>
              <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 ${busy ? 'opacity-60' : ''}`}>
                {busy ? 'Sending OTP...' : 'Log In'}
              </button>
            </motion.form>
          ) : (
            <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Kwame Mensah" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="kwame@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Phone (MoMo)</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="024 XXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Payout Preference</label>
                <div className="flex gap-3">
                  {([['momo', 'MoMo Transfer'], ['cash', 'Cash']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setPayoutPreference(val)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                        payoutPreference === val
                          ? 'border-[#00bfff]/50 bg-[#00bfff]/10 text-[#00bfff]'
                          : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-neutral-700'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Background <span className="text-neutral-600">(optional)</span></label>
                <textarea value={background} onChange={e => setBackground(e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="What do you do? How do you know potential clients?" />
              </div>
              <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 ${busy ? 'opacity-60' : ''}`}>
                {busy ? 'Creating Account...' : 'Join the Program'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Value prop */}
        <div className="mt-8 pt-6 border-t border-neutral-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">How it works</h4>
          <div className="space-y-2">
            {[
              ['1', 'Introduce someone who needs better systems'],
              ['2', 'Set a meeting with ICUNI Labs'],
              ['3', 'We close the deal, you earn'],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-neutral-400">{n}</span>
                <span className="text-sm text-neutral-400">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-600 mt-4">Earn GH&#x20B5;1,000 or 10% of deal value — whichever is higher.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── DASHBOARD VIEW ───
function DashboardView({ session, dashboard, loading, onLogout, onRefresh, showSubmitModal, setShowSubmitModal }: {
  session: ReferrerSession;
  dashboard: DashboardData | null;
  loading: boolean;
  onLogout: () => void;
  onRefresh: () => void;
  showSubmitModal: boolean;
  setShowSubmitModal: (v: boolean) => void;
}) {
  const stats = dashboard?.stats;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-neutral-900 pb-8">
          <div>
            <a href="#" className="inline-flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mb-4">
              <ArrowLeft className="w-3 h-3" /> Back to site
            </a>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Welcome, {session.name.split(' ')[0]}</h1>
            <p className="text-neutral-400">Your referral dashboard</p>
          </div>
          <div className="flex items-center gap-4 self-start md:self-auto">
            <button onClick={() => setShowSubmitModal(true)} className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-gradient-to-r from-[#ff6600] to-[#ff8833] text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer">
              <Plus className="w-4 h-4" /> New Referral
            </button>
            <button onClick={onLogout} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </header>

        {loading && !dashboard ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, icon: Users, color: '#00bfff' },
                { label: 'Closed Won', value: stats?.closedWon ?? 0, icon: TrendingUp, color: '#10b981' },
                { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: '#f59e0b' },
                { label: 'Total Earned', value: formatCurrency(stats?.totalEarned ?? 0), icon: DollarSign, color: '#ff6600' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`${cardCls} p-5`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: i === 3 ? s.color : undefined }}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Conversion Rate Bar */}
            {(stats?.totalReferrals ?? 0) > 0 && (
              <div className={`${cardCls} p-5 mb-10`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-400">Conversion Rate</span>
                  <span className="text-sm font-mono text-neutral-500">{stats?.conversionRate ?? 0}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                  <motion.div className="h-full bg-gradient-to-r from-[#00bfff] to-[#10b981]" initial={{ width: 0 }}
                    animate={{ width: `${stats?.conversionRate ?? 0}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>
            )}

            {/* Referrals List */}
            <div className={`${cardCls} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Your Referrals</h2>
                <button onClick={onRefresh} className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">Refresh</button>
              </div>

              {(dashboard?.referrals?.length ?? 0) === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <Users className="w-7 h-7 text-neutral-700" />
                  </div>
                  <p className="text-neutral-500 mb-2">No referrals yet</p>
                  <p className="text-sm text-neutral-600 mb-6 max-w-xs mx-auto">Know someone whose business needs better systems? Submit your first referral and start earning.</p>
                  <button onClick={() => setShowSubmitModal(true)} className="text-sm font-medium text-[#00bfff] hover:underline cursor-pointer">
                    Submit your first referral
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard!.referrals.map((ref, i) => (
                    <motion.div key={ref.referralId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-neutral-900/40 border border-neutral-800/50 rounded-lg hover:border-neutral-700 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-medium text-sm truncate">{ref.leadName}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[ref.status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                            {ref.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          {ref.leadCompany && <span>{ref.leadCompany}</span>}
                          <span>{formatDate(ref.dateSubmitted)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {ref.status === 'Closed Won' ? (
                          <p className="text-sm font-bold text-[#ff6600]">{formatCurrency(ref.payoutAmount)}</p>
                        ) : ref.status === 'Closed Lost' ? (
                          <p className="text-xs text-neutral-600">No payout</p>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Payout Info */}
            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-600">
                Payouts: <span className="text-neutral-400">GH&#x20B5;1,000</span> or <span className="text-neutral-400">10% of deal value</span> — whichever is higher. Processed after deal closure.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Submit Referral Modal */}
      <AnimatePresence>
        {showSubmitModal && session && (
          <SubmitReferralModal session={session} onClose={() => setShowSubmitModal(false)} onSuccess={() => { setShowSubmitModal(false); onRefresh(); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── SUBMIT REFERRAL MODAL ───
function SubmitReferralModal({ session, onClose, onSuccess }: { session: ReferrerSession; onClose: () => void; onSuccess: () => void }) {
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [introNotes, setIntroNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    await apiCall({
      action: 'submit_referral',
      referrerId: session.referrerId,
      leadName, leadEmail, leadPhone, leadCompany, introNotes
    });
    setBusy(false);
    onSuccess();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className={`${cardCls} w-full max-w-lg p-8`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Submit a Referral</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Lead Name</label>
            <input type="text" required value={leadName} onChange={e => setLeadName(e.target.value)} className={inputCls} placeholder="Ama Owusu" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
              <input type="email" required value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className={inputCls} placeholder="ama@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Phone</label>
              <input type="tel" required value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className={inputCls} placeholder="024 XXX XXXX" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Company <span className="text-neutral-600">(optional)</span></label>
            <input type="text" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} className={inputCls} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Intro Notes <span className="text-neutral-600">(optional)</span></label>
            <textarea value={introNotes} onChange={e => setIntroNotes(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Brief context about the lead and their needs..." />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#00bfff] focus:ring-[#00bfff] cursor-pointer" />
            <span className="text-sm text-neutral-400">I confirm I have introduced this person to ICUNI Labs or will do so prior to the meeting.</span>
          </label>

          <button type="submit" disabled={busy || !confirmed}
            className={`${btnPrimary} mt-4 ${(busy || !confirmed) ? 'opacity-40 hover:bg-transparent hover:shadow-none hover:translate-y-0' : ''}`}>
            {busy ? 'Submitting...' : 'Submit Referral'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
