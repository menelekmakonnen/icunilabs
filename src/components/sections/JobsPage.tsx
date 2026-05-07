import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, DollarSign, Send, ChevronRight, Briefcase, Mic, Square, Upload, FileText, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const inputCls = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600";
const cardCls = "bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

interface JobListing {
  id: string; title: string; type: string; location: string;
  salary: string; commission: string; heroImage: string;
  shortDesc: string; // for listing card
  fullDescription: string[]; // paragraphs for detail page
  requirements: string[];
  benefits: string[];
  perks: string[]; // non-salary perks for listing card
  applyEmail: string;
}

const jobs: JobListing[] = [
  {
    id: 'ops-assistant-001',
    title: 'Operations Assistant',
    type: 'Full-Time',
    location: 'Accra, Ghana',
    salary: 'GH₵3,000/month + commission',
    commission: 'Up to 10% on deals you directly bring in',
    heroImage: '/ops-assistant-hero.png',
    shortDesc: 'Keep our client pipeline moving, coordinate referral partners, and grow with a tech company building real systems for real businesses.',
    perks: ['Commission on every project', 'Real tech industry experience', 'Growth trajectory'],
    fullDescription: [
      "ICUNI Labs builds custom business operations systems for companies across Ghana and beyond. Our clients replace spreadsheets, WhatsApp chains, and manual processes with software built specifically for how they work. We're expanding our client base and need someone sharp, organized, and persistent to keep things moving behind the scenes.",
      "As Operations Assistant, you'll manage the space between building and closing. That means scheduling meetings with prospects, following up with existing clients, tracking our entire sales pipeline, chasing payments when they're due, coordinating with our growing network of referral partners, and ensuring absolutely nothing falls through the cracks.",
      "This is not a desk-and-wait role. You will be on calls daily — with business owners, managers, and decision-makers. You'll be sending emails, updating our CRM, keeping our pipeline alive, and making sure every lead gets the attention it deserves. If a prospect goes quiet, you follow up. If a payment is late, you chase it. If a referral partner needs support, you're their point of contact.",
      "You'll work directly with the founder and have visibility into every part of the business — from how we acquire clients to how we deliver projects. This isn't a siloed corporate role. You'll see the full picture, contribute to real decisions, and grow your career inside a company that's building the future of business operations in Africa.",
      "We're looking for someone who follows up without being reminded. Someone with strong written and verbal communication skills. Someone comfortable picking up the phone and calling a business owner they've never met. You need to be organized — tracking things properly in systems, not from memory. Familiarity with Google Workspace is expected. You must be based in Accra.",
    ],
    requirements: [
      'Follows up without being reminded — persistent and proactive',
      'Strong written and verbal communication in English',
      'Comfortable making cold and warm calls to business owners and managers',
      'Highly organized — tracks tasks in systems, not from memory',
      'Familiar with Google Workspace (Sheets, Docs, Gmail, Calendar)',
      'Based in Accra, Ghana',
      'Available to start within 2 weeks',
    ],
    benefits: [
      'GH₵3,000 monthly base salary',
      'Commission on every paid project the company delivers',
      'Up to 10% commission on deals you directly bring in',
      'Direct mentorship from the founder',
      'Real experience inside a growing tech company building real products for real businesses',
      'Clear growth path — this role scales as the company scales',
    ],
    applyEmail: 'jobs@icuni.org',
  },
];

// ─── MAIN COMPONENT ───
export default function JobsPage() {
  const hash = window.location.hash;
  const jobMatch = hash.match(/^#job\/(.+)$/);
  const selectedJob = jobMatch ? jobs.find(j => j.id === jobMatch[1]) : null;

  if (selectedJob) return <JobDetailPage job={selectedJob} />;
  return <JobsListingPage />;
}

// ─── LISTING PAGE (job-agnostic) ───
function JobsListingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-6">
            <Briefcase className="w-3 h-3 text-[#00bfff]" />
            {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-3">Careers</h1>
          <p className="text-lg text-neutral-400 max-w-xl mb-12">Join a team building custom operations systems for businesses across Ghana and beyond.</p>
        </motion.div>

        <div className="space-y-4">
          {jobs.map((job, i) => (
            <motion.a key={job.id} href={`#job/${job.id}`}
              className={`${cardCls} block p-6 hover:border-neutral-700 transition-all group cursor-pointer`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00bfff] transition-colors">{job.title}</h3>
                  <p className="text-sm text-neutral-400 mb-4 leading-relaxed">{job.shortDesc}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                    <span className="text-neutral-800">·</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.perks.map(p => (
                      <span key={p} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">{p}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-[#00bfff] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500">Don't see a fit? Email <a href="mailto:jobs@icuni.org" className="text-[#00bfff] hover:underline">jobs@icuni.org</a> anyway — we're always growing.</p>
        </div>
      </div>
    </div>
  );
}

// ─── JOB DETAIL PAGE ───
function JobDetailPage({ job }: { job: JobListing }) {
  const [showSalary, setShowSalary] = useState(false);
  const [showApply, setShowApply] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Hero Image */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        <img src={job.heroImage} alt={job.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <div className="max-w-4xl mx-auto">
            <a href="#jobs" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> All positions
            </a>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{job.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8 pb-20">
        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400 mb-8 pb-8 border-b border-neutral-800">
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 font-medium">{job.type}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
          <button onClick={() => setShowSalary(!showSalary)}
            className="flex items-center gap-1.5 text-[#ff6600] hover:text-[#ff8833] transition-colors cursor-pointer font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            {showSalary ? job.salary : 'Click to reveal salary'}
            {showSalary ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#00bfff]" />About This Role</h2>
              <div className="space-y-4">
                {job.fullDescription.map((p, i) => <p key={i} className="text-neutral-300 leading-relaxed text-[15px]">{p}</p>)}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#00bfff]" />Requirements</h2>
              <ul className="space-y-2.5">{job.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300 text-[15px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00bfff] mt-2 flex-shrink-0" />{r}
                </li>
              ))}</ul>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#ff6600]" />What You Get</h2>
              <ul className="space-y-2.5">{job.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300 text-[15px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] mt-2 flex-shrink-0" />{b}
                </li>
              ))}</ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              {!showApply ? (
                <div className={`${cardCls} p-6 text-center`}>
                  <h3 className="text-lg font-bold mb-2">Ready to apply?</h3>
                  <p className="text-sm text-neutral-400 mb-6">Submit your application with CV and a short audio intro.</p>
                  <button onClick={() => setShowApply(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff6600] to-[#ff8833] text-white font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer">
                    <Send className="w-4 h-4" /> Apply Now
                  </button>
                  <p className="text-xs text-neutral-600 mt-4">Or email <a href={`mailto:${job.applyEmail}`} className="text-[#00bfff] hover:underline">{job.applyEmail}</a></p>
                </div>
              ) : (
                <ApplicationForm job={job} onCancel={() => setShowApply(false)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APPLICATION FORM ───
function ApplicationForm({ job, onCancel }: { job: JobListing; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioFile(null);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { /* mic denied */ }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  function fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'job_application',
        jobId: job.id, jobTitle: job.title,
        name, email, phone, note,
      };
      if (pdfFile) {
        payload.cvBase64 = await fileToBase64(pdfFile);
        payload.cvName = pdfFile.name;
      }
      const audioSource = audioBlob || audioFile;
      if (audioSource) {
        payload.audioBase64 = await fileToBase64(audioSource);
        payload.audioName = audioFile ? audioFile.name : 'voice-intro.webm';
      }
      if (API_URL) {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload), redirect: 'follow' });
      }
    } catch { /* no-cors fallback */ }
    setBusy(false);
    setSubmitted(true);
  }

  const audioReady = audioBlob || audioFile;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (submitted) {
    return (
      <div className={`${cardCls} p-6 text-center`}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#10b981]/10 flex items-center justify-center">
          <svg className="w-7 h-7 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-lg font-bold mb-1">Application Sent!</h3>
        <p className="text-sm text-neutral-400">We'll review and get back to you at {email}.</p>
      </div>
    );
  }

  return (
    <div className={`${cardCls} p-6`}>
      <h3 className="text-lg font-bold mb-4">Apply for {job.title}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Full name" />
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="Email" />
        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Phone" />
        <textarea value={note} onChange={e => setNote(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Why are you right for this role?" />

        {/* CV Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">CV / Resume (PDF)</label>
          <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed cursor-pointer transition-all ${pdfFile ? 'border-[#00bfff]/50 bg-[#00bfff]/5' : 'border-neutral-800 hover:border-neutral-700'}`}>
            <FileText className={`w-4 h-4 flex-shrink-0 ${pdfFile ? 'text-[#00bfff]' : 'text-neutral-600'}`} />
            <span className={`text-sm truncate ${pdfFile ? 'text-white' : 'text-neutral-500'}`}>{pdfFile ? pdfFile.name : 'Click to upload PDF'}</span>
            <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        {/* Audio Recording */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Voice Intro (optional)</label>
          <p className="text-xs text-neutral-600 mb-3">Record a short intro or upload an audio file</p>
          <div className="flex gap-2 mb-2">
            {!recording ? (
              <button type="button" onClick={startRecording} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer text-sm">
                <Mic className="w-4 h-4 text-red-500" /> Record
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 cursor-pointer text-sm animate-pulse">
                <Square className="w-3 h-3" /> Stop ({formatTime(recordingTime)})
              </button>
            )}
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer text-sm">
              <Upload className="w-4 h-4" /> Upload
              <input type="file" accept="audio/*" className="hidden" onChange={e => { setAudioFile(e.target.files?.[0] || null); setAudioBlob(null); }} />
            </label>
          </div>
          {audioReady && (
            <div className="flex items-center gap-2 text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg px-3 py-2">
              <Mic className="w-3 h-3" />
              {audioFile ? audioFile.name : `Recording (${formatTime(recordingTime)})`}
            </div>
          )}
        </div>

        <button type="submit" disabled={busy}
          className={`w-full bg-gradient-to-r from-[#ff6600] to-[#ff8833] text-white font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all cursor-pointer ${busy ? 'opacity-60' : ''}`}>
          {busy ? 'Submitting...' : 'Submit Application'}
        </button>
        <button type="button" onClick={onCancel} className="w-full text-sm text-neutral-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
      </form>
    </div>
  );
}
