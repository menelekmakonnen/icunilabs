
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { personas } from '../../data/personaData';

interface DiagnosticOption {
    label: string;
    personaId: string;
}

const diagnosticOptions: DiagnosticOption[] = [
    { label: "Too much depends on one person — usually me", personaId: "founders" },
    { label: "Our workflows are too manual and keep breaking", personaId: "operations" },
    { label: "We need an internal tool but can't define the requirements", personaId: "product-systems" },
    { label: "Our content or production pipeline is messy", personaId: "creative-ops" },
    { label: "We want to use AI properly but don't know where to start", personaId: "ai-adoption" },
    { label: "I'm worried about revenue leakage when I'm not there", personaId: "remote-owner" },
    { label: "Our transactions live in notebooks — we can't trace anything", personaId: "financial-ops" },
];

interface FollowUp {
    question: string;
    options: string[];
}

const followUps: Record<string, FollowUp> = {
    founders: {
        question: "What would feel like a win in 90 days?",
        options: [
            "My team can execute without me being in every decision",
            "We have a dashboard that shows me what's actually happening",
            "Our client onboarding runs on a system, not memory",
            "We stop losing things between spreadsheets and WhatsApp",
        ],
    },
    operations: {
        question: "Where does the workflow usually break?",
        options: [
            "Handoffs between people or departments",
            "Manual data entry and repeated admin tasks",
            "Reporting — it takes forever to compile",
            "People skip steps and there's no accountability trail",
        ],
    },
    'product-systems': {
        question: "What's blocking progress right now?",
        options: [
            "Nobody has mapped how the process actually works",
            "Requirements keep shifting — there's no single source of truth",
            "We've tried tools before and people didn't use them",
            "We need a quick proof-of-concept before committing to a full build",
        ],
    },
    'creative-ops': {
        question: "What's slowing production down the most?",
        options: [
            "Approvals — too many people, too many email threads",
            "File and version management is chaos",
            "We miss deadlines because of coordination failures",
            "There's no single view of what's in production and what's done",
        ],
    },
    'ai-adoption': {
        question: "Where is your team with AI right now?",
        options: [
            "Curious but haven't used it in any structured way",
            "A few people experiment, but it's not consistent",
            "We've tried training but nothing stuck",
            "We need help identifying where AI would actually help",
        ],
    },
    'remote-owner': {
        question: "What keeps you up at night?",
        options: [
            "I suspect revenue leakage but can't prove it",
            "Staff reports don't match what I see when I visit",
            "I can't scale because I can't monitor what I have",
            "I need ungameable data, not curated reports",
        ],
    },
    'financial-ops': {
        question: "What's your biggest frustration with transactions?",
        options: [
            "End-of-day balancing never matches — I don't know why",
            "I can't trace a transaction from last week without flipping notebooks",
            "I suspect agents are skimming but have no proof",
            "I want to expand to more locations but can't manage what I can't see",
        ],
    },
};

export default function Diagnostic() {
    const [step, setStep] = useState(0); // 0=intro, 1=q1, 2=followup, 3=result
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);

    const matchedPersona = personas.find(p => p.id === selectedPersonaId);

    const reset = () => {
        setStep(0);
        setSelectedPersonaId(null);
        setSelectedFollowUp(null);
    };

    return (
        <section id="diagnostic" className="py-24 md:py-32 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
            <div className="max-w-3xl mx-auto px-6">

                <div className="text-center mb-12">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Not Sure Where To Start?
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400 text-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Answer two quick questions. We'll point you in the right direction.
                    </motion.p>
                </div>

                <motion.div
                    className="bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 md:p-10 relative overflow-hidden min-h-[350px]"
                    style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#ff7a00] to-[#00bfff] shadow-[0_0_10px_rgba(0,191,255,0.5)]"
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Intro */}
                        {step === 0 && (
                            <motion.div
                                key="intro"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center text-center py-8"
                            >
                                <h3 className="text-2xl font-bold text-white mb-4">What's Actually Slowing Your Team Down?</h3>
                                <p className="text-neutral-400 mb-8 max-w-md">
                                    A quick diagnostic to match your operational problem with the right solution approach.
                                </p>
                                <button
                                    onClick={() => setStep(1)}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-[#00bfff]/50 text-[#00bfff] shadow-[inset_0_0_10px_rgba(0,191,255,0.05)] font-bold rounded hover:bg-[#00bfff]/10 hover:shadow-[0_0_15px_rgba(0,191,255,0.2)] hover:-translate-y-[1px] transition-all"
                                >
                                    Start Diagnostic
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Question 1 */}
                        {step === 1 && (
                            <motion.div
                                key="q1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="mt-4"
                            >
                                <h3 className="text-xl font-semibold text-white mb-6">What's your biggest operational problem right now?</h3>
                                <div className="space-y-3">
                                    {diagnosticOptions.map((opt) => (
                                        <button
                                            key={opt.personaId}
                                            onClick={() => {
                                                setSelectedPersonaId(opt.personaId);
                                                setStep(2);
                                            }}
                                            className="w-full text-left p-4 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-[#00bfff]/40 hover:bg-neutral-900/70 hover:text-white transition-all duration-300 cursor-pointer"
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Follow-up question */}
                        {step === 2 && selectedPersonaId && followUps[selectedPersonaId] && (
                            <motion.div
                                key="q2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="mt-4"
                            >
                                <h3 className="text-xl font-semibold text-white mb-6">{followUps[selectedPersonaId].question}</h3>
                                <div className="space-y-3">
                                    {followUps[selectedPersonaId].options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedFollowUp(opt);
                                                setStep(3);
                                            }}
                                            className="w-full text-left p-4 rounded-lg border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-[#00bfff]/40 hover:bg-neutral-900/70 hover:text-white transition-all duration-300 cursor-pointer"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Result */}
                        {step === 3 && matchedPersona && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                                    style={{ backgroundColor: matchedPersona.accentColor + '20' }}
                                >
                                    <matchedPersona.icon
                                        className="w-8 h-8"
                                        style={{ color: matchedPersona.accentColor }}
                                    />
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-2">
                                    You likely have a{' '}
                                    <span style={{ color: matchedPersona.accentColor }}>
                                        {matchedPersona.title.toLowerCase().replace('the ', '')}
                                    </span>
                                    {' '}problem.
                                </h3>
                                <p className="text-neutral-400 mb-6 max-w-md mx-auto">
                                    {matchedPersona.solutionHeadline}
                                </p>

                                {selectedFollowUp && (
                                    <p className="text-sm text-neutral-500 mb-6 italic">
                                        Your focus: "{selectedFollowUp}"
                                    </p>
                                )}

                                {/* Challenge Question — primes the prospect */}
                                <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 mb-8 max-w-md mx-auto text-left">
                                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" style={{ color: matchedPersona.accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                        Before your diagnostic call, ask yourself:
                                    </p>
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                        "{matchedPersona.challengeQuestions.costQuestion}"
                                    </p>
                                    <p className="text-[11px] text-neutral-500 mt-2 italic">
                                        The answer to this question is the starting point for everything we build.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href={`#${matchedPersona.slug}`}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded text-white transition-all hover:-translate-y-[1px]"
                                        style={{
                                            backgroundColor: matchedPersona.accentColor,
                                            boxShadow: `0 4px 20px ${matchedPersona.accentColor}40`,
                                        }}
                                    >
                                        See How We Help
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                    <a
                                        href="#contact"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded border border-neutral-700 text-white hover:bg-neutral-800 transition-all"
                                    >
                                        Book a Diagnostic Call
                                    </a>
                                </div>

                                <button
                                    onClick={reset}
                                    className="mt-6 inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-300 text-sm transition-colors cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Start over
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </section>
    );
}
