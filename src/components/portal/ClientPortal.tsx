import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, LogOut, ChevronRight, Send } from 'lucide-react';
import { usePortalStore, portalActions } from '../../store/usePortalStore';
import type { PortalProject } from '../../store/usePortalStore';

const PROJECT_STEPS: Record<number, string> = {
  0: 'Closing Meeting', 1: 'Project Created', 1.5: 'Follow-up', 2: 'Payment Received',
  3: 'Build In Progress', 4: 'Demo Ready', 4.5: 'Iteration', 5: 'Final Payments',
  6: 'Training', 7: 'Final Tailoring', 8: 'Additional Costs', 9: 'Post-Mortem', 10: 'Complete',
};



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

export default function ClientPortal() {
  const { token, user, projects, loading, error, otpSent } = usePortalStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(null);

  // Auto-validate existing token
  useEffect(() => {
    if (token && !user) portalActions.validateExistingToken();
  }, []);

  // Load projects when authenticated
  useEffect(() => {
    if (token && user) portalActions.loadProjects();
  }, [token, user]);

  // Login screen
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-50 selection:bg-neutral-800 selection:text-white pt-20">
        <motion.div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 rounded-xl p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Client Portal</h2>
            <p className="text-neutral-400 text-sm">Access your project dashboard & documents.</p>
          </div>

          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.form key="email" onSubmit={e => { e.preventDefault(); portalActions.sendOTP(email) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Work Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors" placeholder="you@company.com" />
                </div>
                {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-neutral-200 transition-colors disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Login Code'}
                </button>
              </motion.form>
            ) : (
              <motion.form key="otp" onSubmit={e => { e.preventDefault(); portalActions.verifyOTP(email, otp) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Send className="w-5 h-5" /></div>
                  <p className="text-sm text-neutral-400">Code sent to <span className="text-white font-medium">{email}</span></p>
                </div>
                <div className="mb-6">
                  <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-neutral-500" placeholder="000000" />
                </div>
                {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-neutral-200 transition-colors disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Project detail view
  if (selectedProject) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20">
        <ProjectDashboard project={selectedProject} onBack={() => setSelectedProject(null)} />
      </div>
    );
  }

  // Projects list
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20 selection:bg-neutral-800 selection:text-white">
      <div className="max-w-4xl mx-auto px-6">
        <header className="flex items-end justify-between gap-6 mb-10 border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome, {user.name}</h1>
            <p className="text-neutral-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={portalActions.logout} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>

        {loading && projects.length === 0 ? (
          <div className="text-center py-20"><span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span></div>
        ) : (
          <div className="space-y-4">
            {projects.map(project => {
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
            {projects.length === 0 && !loading && (
              <div className="text-center py-20 text-neutral-500">No projects found for your account.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
