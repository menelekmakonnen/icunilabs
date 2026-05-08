import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_APPS_SCRIPT_URL;

interface QProps { name: string; email: string; jobId: string; jobTitle: string; }

const cardCls = "bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 max-w-md w-full mx-auto shadow-[0_8px_40px_rgba(0,0,0,0.6)]";
const wideCard = "bg-neutral-950/80 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 max-w-lg w-full mx-auto shadow-[0_8px_40px_rgba(0,0,0,0.6)]";
const pillActive = "px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border";
const pillOn = "bg-[#00bfff]/10 border-[#00bfff]/40 text-[#00bfff] shadow-[0_0_12px_rgba(0,191,255,0.15)]";
const pillOff = "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300";
const scalePill = "flex-1 text-center px-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border";
const checkPill = "px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border";

interface YesNoQ { id: string; label: string; type: 'yesno'; }
interface ChoiceQ { id: string; label: string; type: 'choice'; options: string[]; }
interface ScaleQ { id: string; label: string; type: 'scale'; min: number; max: number; labels: [string, string]; }
interface TextQ { id: string; label: string; type: 'text'; placeholder: string; }
interface MultiQ { id: string; label: string; type: 'multi'; options: string[]; }
type Question = YesNoQ | ChoiceQ | ScaleQ | TextQ | MultiQ;
interface Step { intro: string; questions: Question[]; }

/* Human-readable labels for the review page */
const LABELS: Record<string, string> = {
  salaryOk:        'Salary Range Acceptance (GH₵2,500 – GH₵2,950)',
  fullTimeOk:      'Full-Time Availability (Mon–Fri)',
  asapOk:          'Available to Start ASAP',
  selfView:        'How Others See You',
  deadlines:       'How You Handle Tight Deadlines',
  googleSuite:     'Google Workspace Experience',
  coldCalling:     'Cold Calling Confidence',
  hasLaptop:       'Has a Working Laptop',
  phoneSpecs:      'Smartphone Model',
  secureWorkspace: 'Secure, Distraction-Free Workspace',
  fieldSalesOk:    'Happy to Join Founder for Sales & Events',
  accraArea:       'General Area in Accra',
  otherCommitments:'Other Commitments',
  currentJob:      'Current Employment Status',
  paymentMethod:   'Preferred Payment Method',
};

function getSteps(firstName: string): Step[] {
  return [
    {
      intro: `Your profile is interesting, ${firstName}! Please confirm the following:`,
      questions: [
        { id: 'salaryOk', label: 'This is a Level 1 Compensation role with a salary range of GH\u20B52,500 \u2013 GH\u20B52,950/month depending on experience and meeting standards, plus a generous commission. Are you happy to continue?', type: 'yesno' },
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
      intro: 'Tell me about your setup:',
      questions: [
        { id: 'hasLaptop', label: 'Do you have a working laptop?', type: 'yesno' },
        { id: 'phoneSpecs', label: 'Smartphone specs', type: 'text', placeholder: 'e.g. iPhone 14, Samsung S25' },
        { id: 'secureWorkspace', label: 'Secure workspace free from distractions?', type: 'yesno' },
      ]
    },
    {
      intro: 'This role occasionally involves joining the founder for client meetings, sales closing, and industry events in person.',
      questions: [
        { id: 'fieldSalesOk', label: 'Are you happy to occasionally go out with the founder for sales closing and events?', type: 'yesno' },
        { id: 'accraArea', label: 'Which general area in Accra do you live in?', type: 'text', placeholder: 'e.g. East Legon, Spintex, Tema, Achimota' },
      ]
    },
    {
      intro: 'Almost there! A few more about your availability:',
      questions: [
        { id: 'otherCommitments', label: 'Will you be doing this job alongside any other responsibilities? Select all that apply.', type: 'multi', options: ['No Other Commitments', 'Family / Caregiving Duties', 'University or School', 'Personal Business / Entrepreneurship', 'Another Paid Job', 'Freelance or Contract Work', 'Volunteering / Community Service'] },
        { id: 'currentJob', label: 'Do you currently work a job that needs a notice period?', type: 'choice', options: ['Yes, with notice period', 'Yes, but can leave immediately', 'No, currently available'] },
      ]
    },
    {
      intro: 'And finally:',
      questions: [
        { id: 'paymentMethod', label: 'Preferred payment method', type: 'choice', options: ['Mobile Money', 'Bank Transfer'] },
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
  const [showReview, setShowReview] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [nameConfirm, setNameConfirm] = useState('');

  const totalSteps = steps.length;
  const current = steps[step];
  const allAnswered = current ? current.questions.every(q => {
    const a = answers[q.id];
    if (q.type === 'multi') return a !== undefined && a !== null && a.trim() !== '';
    return a !== undefined && a !== null && a.trim() !== '';
  }) : false;

  function set(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }

  function toggleMulti(id: string, option: string) {
    setAnswers(prev => {
      const current = prev[id] ? prev[id].split('|||').filter(Boolean) : [];
      // "No Other Commitments" is exclusive
      if (option === 'No Other Commitments') {
        return { ...prev, [id]: option };
      }
      // Remove "No Other Commitments" if selecting something else
      const filtered = current.filter(c => c !== 'No Other Commitments');
      if (filtered.includes(option)) {
        const next = filtered.filter(c => c !== option);
        return { ...prev, [id]: next.join('|||') };
      }
      return { ...prev, [id]: [...filtered, option].join('|||') };
    });
  }

  function advance() {
    if (step < steps.length - 1) {
      setDir(1);
      setStep(s => s + 1);
    } else {
      // Show review page
      setShowReview(true);
    }
  }

  function goBack() {
    if (showReview) { setShowReview(false); return; }
    if (step > 0) { setDir(-1); setStep(s => s - 1); }
  }

  async function submitFinal() {
    setSubmitting(true);
    try {
      if (API) {
        // Clean up multi-select values for submission
        const cleanAnswers: Record<string, string> = {};
        for (const [k, v] of Object.entries(answers)) {
          cleanAnswers[k] = v.includes('|||') ? v.split('|||').join(', ') : v;
        }
        await fetch(API, {
          method: 'POST',
          body: JSON.stringify({ action: 'job_qualification', email, jobId, jobTitle, ...cleanAnswers }),
          redirect: 'follow',
        });
      }
    } catch { /* network fallback */ }
    setSubmitting(false);
    setDone(true);
  }

  const nameMatches = nameConfirm.trim().toLowerCase() === name.trim().toLowerCase();
  const canSubmit = privacyAccepted && nameMatches && !submitting;

  // ── DONE STATE ──
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

  // ── REVIEW PAGE ──
  if (showReview) {
    const allQs = steps.flatMap(s => s.questions);
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={wideCard}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={goBack} className="p-1.5 rounded-lg border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all cursor-pointer">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 className="text-lg font-bold flex-1">Review Your Application</h3>
        </div>

        <p className="text-sm text-neutral-400 mb-5">Please review all your responses before submitting. You can go back to change anything.</p>

        {/* All answers */}
        <div className="space-y-3 mb-8 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
          {allQs.map(q => {
            const label = LABELS[q.id] || q.id;
            let val = answers[q.id] || '—';
            if (val.includes('|||')) val = val.split('|||').join(', ');
            // Scale values
            if ((q.id === 'googleSuite' || q.id === 'coldCalling') && !isNaN(Number(val))) {
              const n = Number(val);
              val = '⬤'.repeat(n) + '○'.repeat(5 - n) + ` (${n}/5)`;
            }
            return (
              <div key={q.id} className="flex justify-between items-start gap-4 py-2.5 px-3 rounded-lg bg-neutral-900/40 border border-neutral-800/50">
                <span className="text-xs text-neutral-500 leading-snug flex-shrink-0 max-w-[45%]">{label}</span>
                <span className="text-sm text-white font-medium text-right leading-snug">{val}</span>
              </div>
            );
          })}
        </div>

        {/* Privacy Policy */}
        <div className="border border-neutral-800 rounded-xl p-4 mb-6 bg-neutral-900/30">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00bfff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Privacy & Data Protection
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed mb-3">
            ICUNI Labs is committed to protecting your personal information. By submitting this application, you agree to the following:
          </p>
          <ul className="text-xs text-neutral-500 space-y-1.5 mb-3">
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> Your data will be used solely for evaluating your application for this role.</li>
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> We store your information securely on encrypted Google Workspace infrastructure.</li>
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> Your data will not be shared with third parties without your explicit consent.</li>
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> You may request deletion of your data at any time by emailing <a href="mailto:privacy@icuni.org" className="text-[#00bfff] hover:underline">privacy@icuni.org</a>.</li>
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> If unsuccessful, your application data will be retained for 12 months for future opportunities, then permanently deleted.</li>
            <li className="flex gap-2"><span className="text-[#00bfff] mt-0.5">•</span> Uploaded files (CV, voice intro) are stored in a secure Google Drive folder accessible only to the hiring team.</li>
          </ul>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${privacyAccepted ? 'bg-[#00bfff] border-[#00bfff]' : 'border-neutral-700 group-hover:border-neutral-500'}`}
              onClick={() => setPrivacyAccepted(!privacyAccepted)}>
              {privacyAccepted && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </div>
            <span className="text-xs text-neutral-300 leading-snug" onClick={() => setPrivacyAccepted(!privacyAccepted)}>
              I have read and agree to the privacy policy above and consent to ICUNI Labs processing my application data.
            </span>
          </label>
        </div>

        {/* Name confirmation */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Confirm by typing your full name
          </label>
          <input
            type="text"
            value={nameConfirm}
            onChange={e => setNameConfirm(e.target.value)}
            placeholder={name}
            className={`w-full bg-neutral-900/50 border rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-all placeholder:text-neutral-700 ${
              nameConfirm && nameMatches ? 'border-[#10b981] focus:border-[#10b981]' : nameConfirm ? 'border-red-500/50 focus:border-red-500' : 'border-neutral-800 focus:border-[#00bfff]'
            }`}
          />
          {nameConfirm && !nameMatches && (
            <p className="text-xs text-red-400/70 mt-1">Please type your full name exactly as entered: {name}</p>
          )}
        </div>

        {/* Submit */}
        <button onClick={submitFinal} disabled={!canSubmit}
          className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            canSubmit ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white hover:shadow-[0_0_20px_rgba(255,122,0,0.3)]' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
          }`}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </motion.div>
    );
  }

  // ── QUESTIONS FLOW ──
  if (!current) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: dir * 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: dir * -40 }}
        transition={{ duration: 0.3 }}
        className={cardCls}
      >
        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {[...Array(totalSteps + 1)].map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#00bfff]' : i === totalSteps ? 'bg-neutral-800/50' : 'bg-neutral-800'}`} />
          ))}
        </div>

        {/* Back + intro text */}
        <div className="flex items-start gap-2 mb-1">
          {step > 0 && (
            <button onClick={goBack} className="p-1 rounded border border-neutral-800 text-neutral-600 hover:text-white hover:border-neutral-600 transition-all cursor-pointer flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <p className="text-sm text-neutral-400">{current.intro}</p>
        </div>
        <p className="text-[11px] text-neutral-600 mb-6">Step {step + 1} of {totalSteps}</p>

        {/* Questions */}
        <div className="space-y-6">
          {current.questions.map(q => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-white mb-3">{q.label}</label>
              {renderQuestion(q, answers, set, toggleMulti)}
            </div>
          ))}
        </div>

        {/* Continue button */}
        <button onClick={advance} disabled={!allAnswered}
          className={`w-full mt-8 py-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            allAnswered ? 'bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white hover:shadow-[0_0_20px_rgba(255,122,0,0.3)]' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
          }`}>
          {step < steps.length - 1 ? 'Continue' : 'Review Application'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function renderQuestion(q: Question, answers: Record<string, string>, set: (id: string, val: string) => void, toggleMulti: (id: string, option: string) => void) {
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
    case 'multi': {
      const selected = answers[q.id] ? answers[q.id].split('|||').filter(Boolean) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {q.options.map(o => {
            const isOn = selected.includes(o);
            return (
              <button key={o} type="button" onClick={() => toggleMulti(q.id, o)}
                className={`${checkPill} ${isOn ? pillOn : pillOff}`}>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 inline-flex items-center justify-center ${isOn ? 'bg-[#00bfff] border-[#00bfff]' : 'border-neutral-600'}`}>
                    {isOn && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </span>
                  {o}
                </span>
              </button>
            );
          })}
        </div>
      );
    }
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
