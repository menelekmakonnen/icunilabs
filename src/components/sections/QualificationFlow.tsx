import { useState } from 'react';
import { motion } from 'framer-motion';

const API = import.meta.env.VITE_APPS_SCRIPT_URL;

interface QProps { name: string; email: string; jobId: string; jobTitle: string; }

const cardCls = "bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 max-w-md w-full mx-auto shadow-[0_8px_40px_rgba(0,0,0,0.6)]";
const pillActive = "px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border";
const pillOn = "bg-[#00bfff]/10 border-[#00bfff]/40 text-[#00bfff] shadow-[0_0_12px_rgba(0,191,255,0.15)]";
const pillOff = "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300";
const scalePill = "flex-1 text-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border";

interface YesNoQ { id: string; label: string; type: 'yesno'; }
interface ChoiceQ { id: string; label: string; type: 'choice'; options: string[]; }
interface ScaleQ { id: string; label: string; type: 'scale'; min: number; max: number; labels: [string, string]; }
interface TextQ { id: string; label: string; type: 'text'; placeholder: string; }
type Question = YesNoQ | ChoiceQ | ScaleQ | TextQ;
interface Step { intro: string; questions: Question[]; }

function getSteps(firstName: string): Step[] {
  return [
    {
      intro: `Your profile is interesting, ${firstName}! Please confirm the following:`,
      questions: [
        { id: 'salaryOk', label: 'Are you happy with GH\u20B53,000/month base + commission?', type: 'yesno' },
        { id: 'fullTimeOk', label: 'Full-time, Monday to Friday?', type: 'yesno' },
        { id: 'asapOk', label: 'Available to start ASAP?', type: 'yesno' },
      ]
    },
    {
      intro: 'Thank you for that! Now these two:',
      questions: [
        { id: 'selfView', label: 'How do others see you?', type: 'choice', options: ['Reserved / Reactive', 'Random bursts of energy', 'Proactive, always on top of affairs'] },
        { id: 'deadlines', label: 'How do you handle a high volume of tasks with tight deadlines?', type: 'choice', options: ['Prioritize by urgency and communicate delays', 'Work extended hours to meet deadlines', 'Delegate or seek assistance when needed', 'I struggle under pressure'] },
      ]
    },
    {
      intro: 'Well done! Just two more of these:',
      questions: [
        { id: 'googleSuite', label: 'Familiarity with Google Workspace (Drive, Docs, Sheets, Calendar, Gmail)', type: 'scale', min: 1, max: 5, labels: ['Needs training', 'Exceptional'] },
        { id: 'coldCalling', label: 'Comfort with cold calling business owners', type: 'scale', min: 1, max: 5, labels: ['Very uncomfortable', 'Very confident'] },
      ]
    },
    {
      intro: 'First, tell me about your setup:',
      questions: [
        { id: 'hasLaptop', label: 'Do you have a working laptop?', type: 'yesno' },
        { id: 'phoneSpecs', label: 'Smartphone specs', type: 'text', placeholder: 'e.g. iPhone 14, Samsung S23' },
        { id: 'secureWorkspace', label: 'Secure workspace free from distractions?', type: 'yesno' },
      ]
    },
    {
      intro: 'And finally:',
      questions: [
        { id: 'paymentMethod', label: 'Preferred payment method', type: 'choice', options: ['Mobile Money', 'Bank Transfer'] },
        { id: 'currentJob', label: 'Do you currently work a job that needs a notice period?', type: 'choice', options: ['Yes, with notice period', 'Yes, but can leave immediately', 'No, currently available'] },
      ]
    },
  ];
}

export default function QualificationFlow({ name, email, jobId, jobTitle }: QProps) {
  const firstName = name.split(' ')[0] || name;
  const [steps] = useState(() => getSteps(firstName));
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dir, setDir] = useState(1);

  const current = steps[step];
  const allAnswered = current ? current.questions.every(q => {
    const a = answers[q.id];
    return a !== undefined && a !== null && a.trim() !== '';
  }) : false;

  function set(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }

  async function advance() {
    if (step < steps.length - 1) {
      setDir(1);
      setStep(s => s + 1);
    } else {
      setSubmitting(true);
      try {
        if (API) {
          await fetch(API, {
            method: 'POST',
            body: JSON.stringify({ action: 'job_qualification', email, jobId, jobTitle, ...answers }),
            redirect: 'follow',
          });
        }
      } catch { /* network fallback */ }
      setSubmitting(false);
      setDone(true);
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cardCls + " text-center"}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#10b981]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Awesome!</h3>
        <p className="text-neutral-300 text-sm leading-relaxed mb-4">
          I have recorded this for you, {firstName}, and we will be in touch within <span className="text-white font-semibold">48 hours</span> with a confirmation.
        </p>
        <p className="text-neutral-500 text-xs">
          If you have further queries, contact <a href="mailto:jobs@icuni.org" className="text-[#00bfff] hover:underline">jobs@icuni.org</a>
        </p>
        <p className="text-neutral-600 text-xs mt-4">Thank you for your application.</p>
      </motion.div>
    );
  }

  if (!current) return null;

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: dir * 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cardCls}
    >
      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#00bfff]' : 'bg-neutral-800'}`} />
        ))}
      </div>

      {/* Intro text */}
      <p className="text-sm text-neutral-400 mb-1">{current.intro}</p>
      <p className="text-[11px] text-neutral-600 mb-6">Step {step + 1} of {steps.length}</p>

      {/* Questions */}
      <div className="space-y-6">
        {current.questions.map(q => (
          <div key={q.id}>
            <label className="block text-sm font-medium text-white mb-3">{q.label}</label>
            {renderQuestion(q, answers, set)}
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button onClick={advance} disabled={!allAnswered || submitting}
        className={`w-full mt-8 py-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
          allAnswered ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white hover:shadow-[0_0_20px_rgba(255,122,0,0.3)]' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
        }`}>
        {submitting ? 'Submitting...' : step < steps.length - 1 ? 'Continue' : 'Finish'}
      </button>
    </motion.div>
  );
}

function renderQuestion(q: Question, answers: Record<string, string>, set: (id: string, val: string) => void) {
  switch (q.type) {
    case 'yesno':
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map(o => (
            <button key={o} type="button" onClick={() => set(q.id, o)} className={`${pillActive} flex-1 ${answers[q.id] === o ? pillOn : pillOff}`}>{o}</button>
          ))}
        </div>
      );
    case 'choice':
      return (
        <div className="space-y-2">
          {q.options.map(o => (
            <button key={o} type="button" onClick={() => set(q.id, o)}
              className={`${pillActive} w-full text-left ${answers[q.id] === o ? pillOn : pillOff}`}>{o}</button>
          ))}
        </div>
      );
    case 'scale':
      return (
        <div>
          <div className="flex justify-between text-[10px] text-neutral-600 mb-2">
            <span>{q.labels[0]}</span><span>{q.labels[1]}</span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: q.max - q.min + 1 }, (_, i) => i + q.min).map(n => (
              <button key={n} type="button" onClick={() => set(q.id, String(n))}
                className={`${scalePill} ${answers[q.id] === String(n) ? pillOn : pillOff}`}>{n}</button>
            ))}
          </div>
        </div>
      );
    case 'text':
      return (
        <input type="text" value={answers[q.id] || ''} onChange={e => set(q.id, e.target.value)}
          placeholder={q.placeholder}
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00bfff] transition-all placeholder:text-neutral-600" />
      );
    default:
      return null;
  }
}
