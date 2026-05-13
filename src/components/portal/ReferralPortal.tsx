import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Plus, X, Users, TrendingUp, Clock, DollarSign, ChevronRight, ArrowLeft, FolderOpen, Wallet, Copy, ExternalLink, Calendar } from 'lucide-react';
import ReferralProcessSVG from './ReferralProcessSVG';

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

type ViewMode = 'auth' | 'dashboard';
type AuthTab = 'login' | 'signup';

interface Referral {
  referralId: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadCompany: string;
  stage: number;
  status: string;
  dealValue: number;
  payoutAmount: number;
  payoutStatus: 'pending' | 'paid' | 'n/a';
  dateSubmitted: string;
  meetingDate: string;
  meetingTime: string;
  referrerAttending: boolean;
  dateClosed: string;
  notes: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  type: 'deck' | 'video' | 'case-study' | 'pricing';
  url: string;
  thumbnailUrl: string;
  uploadedAt: string;
}

interface DashboardData {
  referrer: { name: string; email: string; joinDate: string };
  stats: { totalReferrals: number; closedWon: number; closedLost: number; pending: number; totalEarned: number; pendingPayout: number; conversionRate: number };
  referrals: Referral[];
  materials: Material[];
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
export default function ReferralPortal({ demoMode }: { demoMode?: boolean } = {}) {
  const [view, setView] = useState<ViewMode>(demoMode ? 'dashboard' : 'auth');
  const [session, setSession] = useState<ReferrerSession | null>(demoMode ? { referrerId: 'DEMO-001', name: 'Kwame Mensah', email: 'kwame@example.com' } : null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore session (skip in demo mode)
  useEffect(() => {
    if (demoMode) return;
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
    if (session && view === 'dashboard') {
      if (demoMode) {
        // Use demo data immediately — linked to the same component so design changes propagate
        setDashboard(DEMO_DASHBOARD);
      } else {
        fetchDashboard();
      }
    }
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
        stats: { totalReferrals: 0, closedWon: 0, closedLost: 0, pending: 0, totalEarned: 0, pendingPayout: 0, conversionRate: 0 },
        referrals: [],
        materials: [],
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
    if (demoMode) return; // Don't allow logout in demo mode
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
            onRefresh={demoMode ? () => {} : fetchDashboard}
            showSubmitModal={showSubmitModal}
            setShowSubmitModal={setShowSubmitModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Demo data for the preview dashboard ───
const DEMO_MATERIALS: Material[] = [
  { id: 'M-001', title: 'ICUNI Labs Portfolio Deck', description: 'Full portfolio overview with case studies and pricing tiers.', type: 'deck', url: '#', thumbnailUrl: '', uploadedAt: '2025-09-01' },
  { id: 'M-002', title: 'Product Demo Video', description: '3-minute walkthrough of a live dashboard we built for a logistics company.', type: 'video', url: '#', thumbnailUrl: '', uploadedAt: '2025-09-10' },
  { id: 'M-003', title: 'Warehouse Ops Case Study', description: 'How we replaced 14 spreadsheets with one system for a warehouse in Tema.', type: 'case-study', url: '#', thumbnailUrl: '', uploadedAt: '2025-10-05' },
  { id: 'M-004', title: 'Pricing Overview', description: 'Transparent pricing guide for prospects — what to expect per project tier.', type: 'pricing', url: '#', thumbnailUrl: '', uploadedAt: '2025-11-01' },
];

const DEMO_DASHBOARD: DashboardData = {
  referrer: { name: 'Kwame Mensah', email: 'kwame@example.com', joinDate: '2025-09-15' },
  stats: { totalReferrals: 7, closedWon: 3, closedLost: 1, pending: 3, totalEarned: 4500, pendingPayout: 1200, conversionRate: 43 },
  referrals: [
    { referralId: 'R-001', leadName: 'Ama Owusu', leadEmail: 'ama@freshfoods.com', leadPhone: '024 111 2222', leadCompany: 'FreshFoods GH', stage: 4, status: 'Closed Won', dealValue: 15000, payoutAmount: 1500, payoutStatus: 'paid', dateSubmitted: '2025-10-02', meetingDate: '2025-10-10', meetingTime: '10:00', referrerAttending: false, dateClosed: '2025-11-10', notes: '' },
    { referralId: 'R-002', leadName: 'Yaw Boateng', leadEmail: 'yaw@kofimotors.com', leadPhone: '020 333 4444', leadCompany: 'Kofi Motors', stage: 1, status: 'Meeting Scheduled', dealValue: 0, payoutAmount: 0, payoutStatus: 'n/a', dateSubmitted: '2025-11-20', meetingDate: '2025-12-02', meetingTime: '14:00', referrerAttending: true, dateClosed: '', notes: '' },
    { referralId: 'R-003', leadName: 'Akua Serwaa', leadEmail: 'akua@bright.edu', leadPhone: '027 555 6666', leadCompany: 'Bright Academy', stage: 4, status: 'Closed Won', dealValue: 12000, payoutAmount: 1200, payoutStatus: 'pending', dateSubmitted: '2025-10-15', meetingDate: '2025-10-25', meetingTime: '11:00', referrerAttending: false, dateClosed: '2025-12-01', notes: '' },
    { referralId: 'R-004', leadName: 'Kofi Adu', leadEmail: 'kofi@logitrack.com', leadPhone: '055 777 8888', leadCompany: 'LogiTrack Ltd', stage: 2, status: 'Meeting Done', dealValue: 0, payoutAmount: 0, payoutStatus: 'n/a', dateSubmitted: '2025-12-05', meetingDate: '2025-12-15', meetingTime: '09:30', referrerAttending: true, dateClosed: '', notes: '' },
  ],
  materials: DEMO_MATERIALS,
};

// ─── LANDING PAGE (unauthenticated) ───
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
  const [isWhatsApp, setIsWhatsApp] = useState(true);
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
    const res = await apiCall({ action: 'referrer_signup', name, email, phone, isWhatsApp, background, payoutPreference });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
      {/* ── HERO + JOIN FORM (side-by-side on desktop) ── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff7a00]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <a href="#" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </a>
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
            {/* ── Hero text ── */}
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 0.6 }} className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff7a00]/30 bg-[#ff7a00]/5 text-xs font-bold text-[#ff7a00] mb-6 tracking-wider uppercase">
                <DollarSign className="w-3 h-3" /> Referral Program — Now Open
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-[1.05]">
                You Introduce.<br /><span className="bg-gradient-to-r from-[#ff7a00] to-[#ff9944] bg-clip-text text-transparent">We Close. You Earn.</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-4">
                Every business you refer gets a working demo before they commit to anything. No risk for them, commission for you. We build operations systems across <span className="text-neutral-200">Warehouse, Construction, Finance, Tax, Media, Oil & Gas, Printing</span>, and more.
              </p>
              <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mb-8">
                If you can get us in a room with a business decision maker who needs our help, we're offering <span className="text-[#ff7a00] font-bold">GH&#x20B5;1,000</span> commission — or <span className="text-[#ff7a00] font-bold">10% of the deal</span>, whichever is higher. No cap.
              </p>
              <button
                onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold rounded-lg hover:shadow-[0_0_30px_rgba(255,102,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer lg:hidden"
              >
                Start Earning <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* ── Join form (side-by-side on lg+) ── */}
            <div id="join-form" className="w-full lg:w-[420px] lg:flex-shrink-0 mt-12 lg:mt-0 scroll-mt-24">
              <AuthFormCard tab={tab} setTab={setTab} error={error} setError={setError} otpStep={otpStep} setOtpStep={setOtpStep} otpCode={otpCode} setOtpCode={setOtpCode} pendingEmail={pendingEmail} setPendingEmail={setPendingEmail} loginEmail={loginEmail} setLoginEmail={setLoginEmail} name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} isWhatsApp={isWhatsApp} setIsWhatsApp={setIsWhatsApp} background={background} setBackground={setBackground} payoutPreference={payoutPreference} setPayoutPreference={setPayoutPreference} busy={busy} setBusy={setBusy} onLogin={onLogin} handleLoginSubmit={handleLoginSubmit} handleSignupSubmit={handleSignupSubmit} handleOtpVerify={handleOtpVerify} />
            </div>
          </div>
        </div>
      </section>

      {/* ── ANIMATED PIPELINE HERO ── */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`${cardCls} p-8 md:p-10`}>
            <h2 className="text-2xl font-black tracking-tight mb-2 text-center">Your Role in 5 Steps</h2>
            <p className="text-neutral-500 text-sm text-center mb-8">Show our work. Book the meeting. We close. You earn.</p>
            <ReferralProcessSVG />
          </motion.div>
        </div>
      </section>

      {/* ── BENEFIT CARDS ── */}
      <section className="px-6 pb-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4 relative z-10">
          {[
            { icon: DollarSign, color: '#ff7a00', title: 'GH\u20B51,000+ Per Deal', desc: 'Earn GH\u20B51,000 flat or 10% of deal value \u2014 whichever is higher. No cap.' },
            { icon: Users, color: '#00bfff', title: 'Just Warm Intros', desc: "You don't sell. Show our portfolio, set the meeting, we handle the rest." },
            { icon: TrendingUp, color: '#10b981', title: 'Track Everything', desc: 'Real-time dashboard shows your referrals, pipeline stage, and total earnings live.' },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`${cardCls} p-6 group hover:border-neutral-700 transition-all`}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none" style={{ backgroundColor: b.color, opacity: 0.06 }} />
              <b.icon className="w-6 h-6 mb-4" style={{ color: b.color }} />
              <h3 className="text-lg font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DECISION MAKER CALLOUT ── */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-[#00bfff]/20 bg-gradient-to-br from-[#00bfff]/5 via-neutral-950 to-neutral-950 p-8 md:p-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#00bfff]/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-black tracking-tight mb-2">Are you the decision maker?</h3>
                <p className="text-neutral-400 leading-relaxed">
                  If you're a business owner or operations lead and you landed here \u2014 you just found your way in.
                  We build custom systems that replace spreadsheets, manual tracking, and WhatsApp chaos with real software built for how your business actually works.
                </p>
              </div>
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 bg-[#00bfff]/10 border border-[#00bfff]/30 text-[#00bfff] font-bold rounded-lg hover:bg-[#00bfff]/20 hover:shadow-[0_0_20px_rgba(0,191,255,0.15)] transition-all whitespace-nowrap flex-shrink-0">
                Book a Free Audit <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO DASHBOARD ── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Try the Dashboard</h2>
            <p className="text-neutral-400">Explore an interactive preview — this is exactly what you'll get when you join</p>
          </div>
          <div className="relative rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-950">
            <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-[#ff7a00]/15 border border-[#ff7a00]/30 text-[#ff7a00] text-[10px] font-bold tracking-wider">LIVE DEMO</div>
            <DashboardView
              session={{ referrerId: 'DEMO', name: 'Kwame Mensah', email: 'kwame@example.com' }}
              dashboard={DEMO_DASHBOARD}
              loading={false}
              onLogout={() => {}}
              onRefresh={() => {}}
              showSubmitModal={false}
              setShowSubmitModal={() => {}}
            />
          </div>
          <div className="text-center mt-6">
            <button onClick={() => document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all cursor-pointer">
              Get Your Own Dashboard <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </motion.div>
  );
}

// ─── EXTRACTED AUTH FORM CARD ───
function AuthFormCard({ tab, setTab, error, setError, otpStep, setOtpStep, otpCode, setOtpCode, pendingEmail, loginEmail, setLoginEmail, name, setName, email, setEmail, phone, setPhone, isWhatsApp, setIsWhatsApp, background, setBackground, payoutPreference, setPayoutPreference, busy, handleLoginSubmit, handleSignupSubmit, handleOtpVerify }: any) {
  return (
    <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} className={`${cardCls} p-8`}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#ff7a00] to-[#00bfff] p-[1px]">
          <div className="w-full h-full rounded-xl bg-neutral-950 flex items-center justify-center">
            <Users className="w-6 h-6 text-[#00bfff]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Join the Program</h2>
        <p className="text-neutral-400 text-sm">Start earning from your network today</p>
      </div>
      <div className="flex mb-6 bg-neutral-900 rounded-lg p-1">
        {(['login', 'signup'] as ('login'|'signup')[]).map(t => (
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
              <input type="text" required maxLength={6} value={otpCode} onChange={(e: any) => setOtpCode(e.target.value.replace(/\D/g, ''))} className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="------" autoFocus />
            </div>
            <button type="submit" disabled={busy || otpCode.length < 6} className={`${btnPrimary} mt-2 ${(busy || otpCode.length < 6) ? 'opacity-60' : ''}`}>{busy ? 'Verifying...' : 'Verify & Log In'}</button>
            <button type="button" onClick={() => { setOtpStep(false); setOtpCode(''); }} className="w-full text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer mt-2">Back</button>
          </motion.form>
        ) : tab === 'login' ? (
          <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleLoginSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-neutral-400 mb-2">Email</label><input type="email" required value={loginEmail} onChange={(e: any) => setLoginEmail(e.target.value)} className={inputCls} placeholder="you@email.com" /></div>
            <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 ${busy ? 'opacity-60' : ''}`}>{busy ? 'Sending OTP...' : 'Log In'}</button>
          </motion.form>
        ) : (
          <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignupSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-neutral-400 mb-2">Full Name</label><input type="text" required value={name} onChange={(e: any) => setName(e.target.value)} className={inputCls} placeholder="Kwame Mensah" /></div>
            <div><label className="block text-sm font-medium text-neutral-400 mb-2">Email</label><input type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)} className={inputCls} placeholder="kwame@email.com" /></div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
              <input type="tel" required value={phone} onChange={(e: any) => setPhone(e.target.value)} className={inputCls} placeholder="024 XXX XXXX" />
              <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer group">
                <button type="button" onClick={() => setIsWhatsApp(!isWhatsApp)}
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0 ${isWhatsApp ? 'bg-[#25D366]' : 'bg-neutral-700'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isWhatsApp ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors">This number is on WhatsApp</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Payout Preference</label>
              <div className="flex gap-3">
                {([['momo', 'MoMo Transfer'], ['cash', 'Cash']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setPayoutPreference(val)} className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${payoutPreference === val ? 'border-[#00bfff]/50 bg-[#00bfff]/10 text-[#00bfff]' : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-neutral-700'}`}>{label}</button>
                ))}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-neutral-400 mb-2">Background <span className="text-neutral-600">(optional)</span></label><textarea value={background} onChange={(e: any) => setBackground(e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="What do you do? How do you know potential clients?" /></div>
            <button type="submit" disabled={busy} className={`${btnPrimary} mt-2 ${busy ? 'opacity-60' : ''}`}>{busy ? 'Creating Account...' : 'Join the Program'}</button>
          </motion.form>
        )}
      </AnimatePresence>
      <p className="text-xs text-neutral-600 mt-6 text-center">Earn GH₵1,000 or 10% of deal value — whichever is higher.</p>
    </motion.div>
  );
}

// ─── DASHBOARD VIEW ───
type DashTab = 'pipeline' | 'materials' | 'earnings';
const MATERIAL_COLORS: Record<string, string> = { deck: '#ff7a00', video: '#8b5cf6', 'case-study': '#00bfff', pricing: '#10b981' };

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
  const [dashTab, setDashTab] = useState<DashTab>('pipeline');

  const tabBtn = (id: DashTab, label: string, icon: any) => {
    const Icon = icon;
    return (
      <button key={id} onClick={() => setDashTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${dashTab === id ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>
        <Icon className="w-4 h-4" />{label}
      </button>
    );
  };

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
            <button onClick={() => setShowSubmitModal(true)} className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Referrals', value: stats?.totalReferrals ?? 0, icon: Users, color: '#00bfff' },
                { label: 'Closed Won', value: stats?.closedWon ?? 0, icon: TrendingUp, color: '#10b981' },
                { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: '#f59e0b' },
                { label: 'Total Earned', value: formatCurrency(stats?.totalEarned ?? 0), icon: DollarSign, color: '#ff7a00' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`${cardCls} p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: i === 3 ? s.color : undefined }}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Tab Nav */}
            <div className="flex gap-1 mb-6">{tabBtn('pipeline', 'Pipeline', TrendingUp)}{tabBtn('materials', 'Materials', FolderOpen)}{tabBtn('earnings', 'Earnings', Wallet)}</div>

            {/* ── PIPELINE TAB ── */}
            {dashTab === 'pipeline' && (
              <div className={`${cardCls} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Your Referrals</h2>
                  <button onClick={onRefresh} className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer">Refresh</button>
                </div>
                {(dashboard?.referrals?.length ?? 0) === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center"><Users className="w-7 h-7 text-neutral-700" /></div>
                    <p className="text-neutral-500 mb-2">No referrals yet</p>
                    <p className="text-sm text-neutral-600 mb-6 max-w-xs mx-auto">Know someone whose business needs better systems? Submit your first referral and start earning.</p>
                    <button onClick={() => setShowSubmitModal(true)} className="text-sm font-medium text-[#00bfff] hover:underline cursor-pointer">Submit your first referral</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard!.referrals.map((ref, i) => (
                      <motion.div key={ref.referralId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="p-4 bg-neutral-900/40 border border-neutral-800/50 rounded-lg hover:border-neutral-700 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-sm">{ref.leadName}</p>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[ref.status] || 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>{ref.status}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {ref.status === 'Closed Won' ? <p className="text-sm font-bold text-[#ff7a00]">{formatCurrency(ref.payoutAmount)}</p>
                            : ref.status === 'Closed Lost' ? <p className="text-xs text-neutral-600">No payout</p>
                            : null}
                          </div>
                        </div>
                        <ReferralProcessSVG compact activeStep={ref.stage} className="mb-3" />
                        <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                          {ref.leadCompany && <span>{ref.leadCompany}</span>}
                          <span>Submitted {formatDate(ref.dateSubmitted)}</span>
                          {ref.meetingDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(ref.meetingDate)} {ref.meetingTime}</span>}
                          {ref.referrerAttending && <span className="text-[#00bfff]">You're attending</span>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── MATERIALS TAB ── */}
            {dashTab === 'materials' && (
              <div>
                <p className="text-sm text-neutral-400 mb-6">Use these materials to show prospects what we do. Share links or download for meetings.</p>
                {(dashboard?.materials?.length ?? 0) === 0 ? (
                  <div className={`${cardCls} p-12 text-center`}>
                    <FolderOpen className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-neutral-500">No materials available yet. Check back soon.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {dashboard!.materials.map(mat => (
                      <motion.div key={mat.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className={`${cardCls} p-5 group hover:border-neutral-700 transition-all`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${MATERIAL_COLORS[mat.type] || '#666'}15` }}>
                            <FolderOpen className="w-4 h-4" style={{ color: MATERIAL_COLORS[mat.type] || '#666' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">{mat.title}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: MATERIAL_COLORS[mat.type], backgroundColor: `${MATERIAL_COLORS[mat.type]}15` }}>{mat.type}</span>
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed mb-4">{mat.description}</p>
                        <div className="flex gap-2">
                          <button onClick={() => navigator.clipboard.writeText(mat.url)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded-lg hover:border-neutral-700 transition-all cursor-pointer">
                            <Copy className="w-3 h-3" />Copy Link
                          </button>
                          <a href={mat.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#00bfff] hover:text-white border border-[#00bfff]/20 rounded-lg hover:border-[#00bfff]/40 transition-all">
                            <ExternalLink className="w-3 h-3" />Open
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── EARNINGS TAB ── */}
            {dashTab === 'earnings' && (
              <div className={`${cardCls} p-6`}>
                <h2 className="text-lg font-semibold mb-6">Earnings Breakdown</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Total Earned</p>
                    <p className="text-2xl font-bold text-[#ff7a00]">{formatCurrency(stats?.totalEarned ?? 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pending Payout</p>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(stats?.pendingPayout ?? 0)}</p>
                  </div>
                </div>
                {dashboard?.referrals?.filter(r => r.status === 'Closed Won').length ? (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Closed Deals</p>
                    {dashboard.referrals.filter(r => r.status === 'Closed Won').map(ref => (
                      <div key={ref.referralId} className="flex items-center justify-between p-3 bg-neutral-900/30 border border-neutral-800/40 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white">{ref.leadName}</p>
                          <p className="text-xs text-neutral-500">{ref.leadCompany} &middot; Closed {formatDate(ref.dateClosed)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#ff7a00]">{formatCurrency(ref.payoutAmount)}</p>
                          <span className={`text-[10px] font-bold uppercase ${ref.payoutStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{ref.payoutStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 text-center py-8">No closed deals yet. Keep referring!</p>
                )}
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-xs text-neutral-600">Payouts: <span className="text-neutral-400">GH&#x20B5;1,000</span> or <span className="text-neutral-400">10% of deal value</span> — whichever is higher. Processed after deal closure.</p>
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
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [attending, setAttending] = useState(false);
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
      leadName, leadEmail, leadPhone, leadCompany,
      meetingDate, meetingTime, referrerAttending: attending,
      introNotes
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
        className={`${cardCls} w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Submit a Referral</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Prospect Name</label>
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

          {/* Meeting scheduling */}
          <div className="border-t border-neutral-800 pt-4 mt-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" />Meeting Details <span className="text-neutral-700 normal-case font-normal">(if scheduled)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Date</label>
                <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Time</label>
                <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className={inputCls} />
              </div>
            </div>
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer group">
              <input type="checkbox" checked={attending} onChange={e => setAttending(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#00bfff] focus:ring-[#00bfff] cursor-pointer" />
              <span className="text-sm text-neutral-500 group-hover:text-neutral-300 transition-colors">I plan to attend the meeting</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">Intro Notes <span className="text-neutral-600">(optional)</span></label>
            <textarea value={introNotes} onChange={e => setIntroNotes(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Brief context about the prospect and their needs..." />
          </div>

          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-[#00bfff] focus:ring-[#00bfff] cursor-pointer" />
            <span className="text-sm text-neutral-400">I confirm I have introduced this prospect to ICUNI Labs and they are aware of the meeting.</span>
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

