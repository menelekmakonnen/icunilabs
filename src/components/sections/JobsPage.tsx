import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, DollarSign, Send, ChevronRight, ArrowRight, Briefcase, Users, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

const inputCls = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600";

interface JobListing {
  id: string;
  title: string;
  type: string;
  location: string;
  salary: string;
  commission: string;
  headline: string;
  subline: string;
  bullets: string[];
  description: string[];
  requirements: string[];
  benefits: string[];
  applyEmail: string;
}

const jobs: JobListing[] = [
  {
    id: 'ops-assistant-001',
    title: 'Operations Assistant',
    type: 'Full-Time',
    location: 'Accra, Ghana',
    salary: 'GH₵3,000/month',
    commission: 'Up to 10% on deals you bring in',
    headline: "We're Hiring.",
    subline: 'ICUNI Labs is growing and we need an Operations Assistant to keep up.',
    bullets: [
      'Keep our client pipeline moving',
      'Earn commission on every project we close',
      'Grow with a tech company building real systems for real businesses',
    ],
    description: [
      "You'll manage the space between building and closing — scheduling meetings, following up with prospects and clients, tracking our sales pipeline, chasing payments, coordinating referral partners, and ensuring nothing falls through the cracks.",
      "This is not a desk-and-wait role. You'll be on calls, sending emails, and keeping our pipeline alive daily.",
    ],
    requirements: [
      'Someone who follows up without being reminded',
      'Strong written and verbal communication',
      'Comfortable making calls to business owners and managers',
      'Organized — you track things properly, not from memory',
      'Familiar with Google Workspace',
      'Based in Accra',
    ],
    benefits: [
      'GH₵3,000 monthly base salary',
      'Commission on every paid project the company delivers',
      'Up to 10% commission on deals you directly bring in',
      'Real experience inside a growing tech company building real products for real businesses',
    ],
    applyEmail: 'jobs@icuni.org',
  },
];

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [showApply, setShowApply] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800">
      {/* Ambient glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00bfff]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 relative z-10">
        {/* Back link */}
        <a href="#" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to site
        </a>

        {!selectedJob ? (
          <JobsListView jobs={jobs} onSelect={setSelectedJob} />
        ) : (
          <JobDetailView job={selectedJob} onBack={() => { setSelectedJob(null); setShowApply(false); }} showApply={showApply} setShowApply={setShowApply} />
        )}
      </div>
    </div>
  );
}

function JobsListView({ jobs, onSelect }: { jobs: JobListing[]; onSelect: (j: JobListing) => void }) {
  return (
    <>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-6">
          <Briefcase className="w-3 h-3 text-[#00bfff]" />
          {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
          {jobs[0].headline}
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl">{jobs[0].subline}</p>
      </motion.div>

      {/* Visual Bullet Cards */}
      <motion.div className="grid md:grid-cols-3 gap-4 mb-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {[
          { icon: TrendingUp, color: '#00bfff', text: jobs[0].bullets[0] },
          { icon: DollarSign, color: '#ff6600', text: jobs[0].bullets[1] },
          { icon: Users, color: '#10b981', text: jobs[0].bullets[2] },
        ].map((b, i) => (
          <div key={i} className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 relative overflow-hidden group hover:border-neutral-700 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none" style={{ backgroundColor: b.color, opacity: 0.08 }} />
            <b.icon className="w-6 h-6 mb-4" style={{ color: b.color }} />
            <p className="text-sm font-semibold text-neutral-200 leading-relaxed">{b.text}</p>
          </div>
        ))}
      </motion.div>

      {/* Meta strip */}
      <motion.div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Full-time</span>
        <span className="text-neutral-800">·</span>
        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Based in Accra</span>
        <span className="text-neutral-800">·</span>
        <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> GH₵3,000/month + commission</span>
      </motion.div>

      {/* Job Cards */}
      <div className="space-y-4">
        {jobs.map((job, i) => (
          <motion.button
            key={job.id}
            onClick={() => onSelect(job)}
            className="w-full text-left bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 hover:bg-neutral-900/60 transition-all group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <span>{job.type}</span>
                  <span className="text-neutral-800">·</span>
                  <span>{job.location}</span>
                  <span className="text-neutral-800">·</span>
                  <span className="text-[#ff6600]">{job.salary}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Apply CTA */}
      <motion.div className="mt-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <p className="text-sm text-neutral-500">
          Or email your CV directly to <a href="mailto:jobs@icuni.org" className="text-[#00bfff] hover:underline">jobs@icuni.org</a>
        </p>
      </motion.div>
    </>
  );
}

function JobDetailView({ job, onBack, showApply, setShowApply }: { job: JobListing; onBack: () => void; showApply: boolean; setShowApply: (v: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (API_URL) {
        await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'job_application', jobId: job.id, jobTitle: job.title, name, email, phone, note }),
          redirect: 'follow',
        });
      }
    } catch { /* no-cors fallback */ }
    setBusy(false);
    setSubmitted(true);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-8 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> All positions
      </button>

      {/* Header */}
      <div className="mb-10 border-b border-neutral-800 pb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 font-medium">{job.type}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
          <span className="text-[#ff6600] font-semibold">{job.salary}</span>
        </div>
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-8">
          <Section title="The Role">
            {job.description.map((p, i) => <p key={i} className="text-neutral-300 leading-relaxed">{p}</p>)}
          </Section>
          <Section title="What We're Looking For">
            <ul className="space-y-2">
              {job.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00bfff] mt-2 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
          <Section title="What You Get">
            <ul className="space-y-2">
              {job.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Sidebar — Apply */}
        <div className="md:col-span-1">
          <div className="sticky top-24 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-xl p-6">
            {!showApply && !submitted ? (
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2">Interested?</h3>
                <p className="text-sm text-neutral-400 mb-6">Apply directly or send your CV to <a href={`mailto:${job.applyEmail}`} className="text-[#00bfff] hover:underline">{job.applyEmail}</a></p>
                <button onClick={() => setShowApply(true)} className="w-full flex items-center justify-center gap-2 bg-transparent border border-[#00bfff]/50 text-[#00bfff] font-bold py-3 rounded-lg hover:bg-[#00bfff]/10 hover:shadow-[0_0_15px_rgba(0,191,255,0.2)] transition-all cursor-pointer">
                  <Send className="w-4 h-4" /> Apply Now
                </button>
              </div>
            ) : submitted ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold mb-1">Application Sent</h3>
                <p className="text-sm text-neutral-400">We'll review your application and get back to you.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-bold mb-2">Apply for {job.title}</h3>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Full name" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Email" />
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Phone" />
                <textarea value={note} onChange={e => setNote(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Why are you right for this role?" />
                <button type="submit" disabled={busy} className={`w-full bg-transparent border border-[#00bfff]/50 text-[#00bfff] font-bold py-3 rounded-lg hover:bg-[#00bfff]/10 transition-all cursor-pointer ${busy ? 'opacity-60' : ''}`}>
                  {busy ? 'Sending...' : 'Submit Application'}
                </button>
                <button type="button" onClick={() => setShowApply(false)} className="w-full text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-[#00bfff]" />
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
