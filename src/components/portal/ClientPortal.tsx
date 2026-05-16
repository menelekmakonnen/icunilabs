import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, LogOut, ChevronRight, Send, AlertTriangle, X } from 'lucide-react';
import { usePortalStore, portalActions } from '../../store/usePortalStore';
import type { PortalProject } from '../../store/usePortalStore';

const API = import.meta.env.VITE_APPS_SCRIPT_URL;

const PROJECT_STEPS: Record<number, string> = {
  0: 'Closing Meeting', 1: 'Project Created', 1.5: 'Follow-up', 2: 'Payment Received',
  3: 'Build In Progress', 4: 'Demo Ready', 4.5: 'Iteration', 5: 'Final Payments',
  6: 'Training', 7: 'Final Tailoring', 8: 'Additional Costs', 9: 'Post-Mortem', 10: 'Complete',
};

const inputCls = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] transition-all placeholder:text-neutral-600";

const BUG_CATEGORIES = [
  'UI / Display Issue',
  'Data Incorrect or Missing',
  'Feature Not Working',
  'Performance / Speed',
  'Login / Access Problem',
  'Payment / Invoice Issue',
  'Integration Error',
  'Feature Request',
  'Other',
];

// ─── Animated background SVG for login ───
function LoginBgSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 800 600" fill="none">
      <motion.circle cx="200" cy="150" r="80" stroke="#00bfff" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.rect x="500" y="100" width="200" height="120" rx="12" stroke="#ff7a00" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.path d="M100 400 L300 350 L500 420 L700 380" stroke="#00bfff" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.5, delay: 1, repeat: Infinity, repeatType: 'reverse' }} />
      <motion.circle cx="650" cy="450" r="60" stroke="#ff7a00" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, repeatType: 'reverse' }} />
    </svg>
  );
}

// ─── Dashboard preview mockup for login page ───
function DashboardPreview() {
  return (
    <div className="relative rounded-xl border border-neutral-800/50 bg-neutral-900/20 p-5 overflow-hidden select-none pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10" />
      {/* Mock header */}
      <div className="flex items-center justify-between mb-4">
        <div><div className="h-3 w-32 bg-neutral-800 rounded mb-1.5" /><div className="h-2 w-20 bg-neutral-800/60 rounded" /></div>
        <div className="h-6 w-16 bg-neutral-800 rounded" />
      </div>
      {/* Mock project card */}
      <div className="bg-neutral-900/60 border border-neutral-800/40 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-center mb-3">
          <div><div className="h-3 w-36 bg-neutral-700 rounded mb-1" /><div className="h-2 w-24 bg-emerald-500/20 rounded" /></div>
          <div className="text-right"><span className="text-xs font-mono text-neutral-600">60%</span></div>
        </div>
        <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden">
          <motion.div className="h-full bg-white/30 rounded-full" initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 2, delay: 0.5 }} />
        </div>
      </div>
      {/* Mock financial cards */}
      <div className="grid grid-cols-3 gap-2">
        {['Est. Cost', 'Paid', 'Balance'].map((l, i) => (
          <div key={i} className="bg-neutral-900/40 border border-neutral-800/30 rounded-lg p-2 text-center">
            <div className="text-[8px] text-neutral-600 mb-1">{l}</div>
            <div className={`text-xs font-bold ${i === 1 ? 'text-emerald-500/40' : i === 2 ? 'text-amber-500/40' : 'text-neutral-500/40'}`}>
              GH₵{i === 0 ? '8,500' : i === 1 ? '5,100' : '3,400'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MILESTONES ───
function getMilestones(currentStep: number) {
  const milestones = [
    { name: 'Project Approved', step: 1 },
    { name: 'Payment Received', step: 2 },
    { name: 'Build In Progress', step: 3 },
    { name: 'Demo/Review', step: 4 },
    { name: 'Training & Handover', step: 6 },
    { name: 'Complete', step: 10 },
  ];
  return milestones.map(m => ({
    ...m,
    status: currentStep >= m.step ? 'completed' : currentStep >= m.step - 1 ? 'active' : 'pending',
  }));
}

// ─── BUG REPORT MODAL ───
function BugReportModal({ projects, onClose }: { projects: PortalProject[]; onClose: () => void }) {
  const [project, setProject] = useState(projects[0]?.project_id || '');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const proj = projects.find(p => p.project_id === project);
      if (API) {
        await fetch(API, {
          method: 'POST',
          body: JSON.stringify({
            action: 'report_bug',
            projectId: project,
            projectTitle: proj?.title || 'Unknown',
            category,
            description,
            token: localStorage.getItem('icuni_portal_token'),
          }),
          redirect: 'follow',
        });
      }
    } catch { /* fallback */ }
    setBusy(false);
    setSent(true);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-lg bg-neutral-950/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Report an Issue
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold mb-2">Report Submitted</h4>
            <p className="text-sm text-neutral-400">Our technical team has been notified and will look into this. You'll hear from us shortly.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Project / Product</label>
              <select value={project} onChange={e => setProject(e.target.value)}
                className={`${inputCls} cursor-pointer`}>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.title}</option>
                ))}
                <option value="general">General / Website</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">What kind of issue?</label>
              <div className="grid grid-cols-2 gap-2">
                {BUG_CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`text-left text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                      category === c ? 'bg-[#00bfff]/10 border-[#00bfff]/40 text-[#00bfff]' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Describe the issue</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                className={`${inputCls} resize-none`} rows={4} required
                placeholder="What happened? What did you expect? Include any steps to reproduce..." />
            </div>
            <button type="submit" disabled={busy || !category || !description.trim()}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                category && description.trim() ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}>
              {busy ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── PROJECT DASHBOARD ───
function ProjectDashboard({ project, onBack }: { project: PortalProject; onBack: () => void }) {
  const step = Number(project.step) || 0;
  const pct = Math.round((step / 10) * 100);
  const milestones = getMilestones(step);

  return (
    <div className="max-w-5xl mx-auto px-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-neutral-900 pb-8">
        <div>
          <button onClick={onBack} className="text-xs text-neutral-500 hover:text-white transition-colors mb-4 flex items-center gap-1">
            <ChevronRight className="w-3 h-3 rotate-180" /> All Projects
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-emerald-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Step {step}: {PROJECT_STEPS[step] || 'In Progress'}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{project.title}</h1>
          <p className="text-xl text-neutral-400">{project.client_name || 'Your Project'}</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Progress */}
          <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Progress</h2>
              <span className="text-sm font-mono text-neutral-500">{pct}% Complete</span>
            </div>
            <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden mb-8 border border-neutral-800">
              <motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
            </div>
            <div className="space-y-4">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="mt-0.5">
                    {m.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-neutral-500" />}
                    {m.status === 'active' && <Circle className="w-5 h-5 text-white animate-pulse" />}
                    {m.status === 'pending' && <Circle className="w-5 h-5 text-neutral-800" />}
                  </div>
                  <p className={`font-medium ${m.status === 'pending' ? 'text-neutral-600' : 'text-neutral-200'}`}>{m.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Financial */}
          <div className="grid sm:grid-cols-3 gap-4">
            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl text-center">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Estimated Cost</div>
              <div className="text-2xl font-bold text-white">GH₵{(project.estimated_cost || 0).toLocaleString()}</div>
            </section>
            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl text-center">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Total Paid</div>
              <div className="text-2xl font-bold text-emerald-400">GH₵{(project.total_paid || 0).toLocaleString()}</div>
            </section>
            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl text-center">
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Balance</div>
              <div className="text-2xl font-bold text-amber-400">GH₵{(project.balance || 0).toLocaleString()}</div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-neutral-500" />Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Started</span><span className="text-neutral-200">{project.start_date?.split('T')[0] || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Est. Completion</span><span className="text-neutral-200">{project.est_completion?.split('T')[0] || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Type</span><span className="text-neutral-200">{project.type || 'custom'}</span></div>
            </div>
          </section>
          {project.description && (
            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl">
              <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{project.description}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ───
export default function ClientPortal({ demoMode }: { demoMode?: boolean } = {}) {
  const { token, user, projects, loading, error, otpSent } = usePortalStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(null);
  const [showBugReport, setShowBugReport] = useState(false);

  // Demo mode data
  const demoUser = { name: 'Ama Owusu', email: 'ama@freshfoods.com', role: 'client' };
  const demoProjects: PortalProject[] = [
    { project_id: 'DEMO-P1', client_id: 'DEMO-C1', title: 'FreshFoods Inventory Tracker', client_name: 'FreshFoods GH', status: 'active', step: 4, type: 'custom', description: 'End-to-end inventory management system with supplier integration and automated reorder alerts.', estimated_cost: 8500, total_paid: 5100, balance: 3400, start_date: '2025-10-01', est_completion: '2026-01-15' },
    { project_id: 'DEMO-P2', client_id: 'DEMO-C1', title: 'Staff Scheduling Portal', client_name: 'FreshFoods GH', status: 'active', step: 2, type: 'custom', description: 'Shift management and employee scheduling dashboard with WhatsApp notifications.', estimated_cost: 4200, total_paid: 2100, balance: 2100, start_date: '2025-12-01', est_completion: '2026-03-01' },
  ];

  const activeUser = demoMode ? demoUser : user;
  const activeProjects = demoMode ? demoProjects : projects;
  const isAuthed = demoMode || (token && user);

  useEffect(() => {
    if (!demoMode && token && !user) portalActions.validateExistingToken();
  }, []);

  useEffect(() => {
    if (!demoMode && token && user) portalActions.loadProjects();
  }, [token, user]);

  // ── LOGIN SCREEN (redesigned) ──
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white">
        {/* Navbar spacing */}
        <div className="pt-20" />

        {/* Hero section */}
        <section className="relative px-6 pt-8 pb-16 overflow-hidden">
          <LoginBgSVG />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#00bfff]/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#ff7a00]/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Welcome + Login */}
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <img src="/icuni_logo.webp" alt="ICUNI Labs" className="w-10 h-10 rounded-lg" />
                    <div>
                      <div className="text-sm font-bold text-[#ff7a00]">ICUNI Labs</div>
                      <div className="text-[10px] text-neutral-600 tracking-widest">CLIENT PORTAL</div>
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
                    Welcome to your<br /><span className="bg-gradient-to-r from-[#00bfff] to-[#00e5ff] bg-clip-text text-transparent">project hub</span>
                  </h1>
                  <p className="text-neutral-400 text-lg mb-8 max-w-md">
                    Track milestones, review demos, manage invoices, and communicate with the build team — all from one secure dashboard.
                  </p>
                </motion.div>

                {/* Login form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
                  <AnimatePresence mode="wait">
                    {!otpSent ? (
                      <motion.form key="email" onSubmit={e => { e.preventDefault(); portalActions.sendOTP(email) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="mb-5">
                          <label className="block text-sm font-medium text-neutral-400 mb-2">Work Email</label>
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className={inputCls} placeholder="you@company.com" />
                        </div>
                        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
                        <button type="submit" disabled={loading}
                          className="w-full bg-gradient-to-r from-[#00bfff] to-[#00e5ff] text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all disabled:opacity-50 cursor-pointer">
                          {loading ? 'Sending...' : 'Send Login Code'}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.form key="otp" onSubmit={e => { e.preventDefault(); portalActions.verifyOTP(email, otp) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="text-center mb-5">
                          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3"><Send className="w-5 h-5" /></div>
                          <p className="text-sm text-neutral-400">Code sent to <span className="text-white font-medium">{email}</span></p>
                        </div>
                        <div className="mb-5">
                          <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                            className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`} placeholder="000000" />
                        </div>
                        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
                        <button type="submit" disabled={loading}
                          className="w-full bg-gradient-to-r from-[#00bfff] to-[#00e5ff] text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all disabled:opacity-50 cursor-pointer">
                          {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Right: Dashboard preview */}
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="hidden md:block">
                <p className="text-xs text-neutral-600 uppercase tracking-widest mb-3 text-center">What you'll see inside</p>
                <DashboardPreview />
                {/* Feature bullets */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: <svg className="w-3.5 h-3.5 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>, label: 'Real-time progress tracking' },
                    { icon: <svg className="w-3.5 h-3.5 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/><path d="M6 14h4"/></svg>, label: 'Invoice & payment history' },
                    { icon: <svg className="w-3.5 h-3.5 text-[#f59e0b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, label: 'Milestone notifications' },
                    { icon: <svg className="w-3.5 h-3.5 text-[#ef4444]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: 'Issue reporting' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-neutral-500">
                      {f.icon}{f.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Project detail ──
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20">
        <ProjectDashboard project={selectedProject} onBack={() => setSelectedProject(null)} />
      </div>
    );
  }

  // ── Projects list ──
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20 selection:bg-neutral-800 selection:text-white">
      <div className="max-w-4xl mx-auto px-6">
        <header className="flex items-end justify-between gap-6 mb-10 border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome, {activeUser!.name}</h1>
            <p className="text-neutral-400">{activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBugReport(true)}
              className="flex items-center gap-2 text-sm text-amber-500/80 hover:text-amber-400 transition-colors cursor-pointer border border-amber-500/20 hover:border-amber-500/40 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Report Issue
            </button>
            {!demoMode && <button onClick={portalActions.logout} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>}

          </div>
        </header>

        {loading && activeProjects.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h-5 w-48 animate-pulse bg-neutral-800/60 rounded mb-2" />
                    <div className="h-3.5 w-28 animate-pulse bg-neutral-800/60 rounded" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-4 w-10 animate-pulse bg-neutral-800/60 rounded ml-auto" />
                    <div className="h-4 w-4 animate-pulse bg-neutral-800/60 rounded ml-auto" />
                  </div>
                </div>
                <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div className="h-full w-1/3 animate-pulse bg-neutral-800/60 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map(project => {
              const step = Number(project.step) || 0;
              const pct = Math.round((step / 10) * 100);
              return (
                <motion.button key={project.project_id} onClick={() => { setSelectedProject(project); portalActions.loadProjectDetail(project.project_id) }}
                  className="w-full text-left bg-neutral-900/40 border border-neutral-800 hover:border-neutral-600 p-6 rounded-xl transition-colors group"
                  whileHover={{ y: -2 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{project.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{PROJECT_STEPS[step] || `Step ${step}`}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-neutral-500">{pct}%</div>
                      <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-white transition-colors mt-1 ml-auto" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                    <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </motion.button>
              );
            })}
            {activeProjects.length === 0 && !loading && (
              <div className="text-center py-20 text-neutral-500">No projects found for your account.</div>
            )}
          </div>
        )}
      </div>

      {/* Bug Report Modal */}
      <AnimatePresence>
        {showBugReport && <BugReportModal projects={activeProjects} onClose={() => setShowBugReport(false)} />}
      </AnimatePresence>
    </div>
  );
}
