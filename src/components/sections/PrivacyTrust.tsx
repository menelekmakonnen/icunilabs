
import { motion } from 'framer-motion';

const commitments = [
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        ),
        title: 'End-to-End Encryption',
        description: 'Every system we build encrypts data in transit and at rest. Your business information is locked down from day one.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: 'Your Data, Your Property',
        description: 'We never sell, share, or mine your data. You own everything — the system, the data, and the infrastructure it runs on.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
        ),
        title: 'No Hidden Analytics',
        description: 'We don\'t install third-party trackers, ad pixels, or analytics that phone home. If monitoring is needed, it runs on your terms.',
    },
    {
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        title: 'Access Controls Built In',
        description: 'Role-based permissions, audit trails, and granular access controls come standard. Your staff sees only what they need to.',
    },
];

export default function PrivacyTrust() {
    return (
        <section className="py-24 md:py-32 border-t border-neutral-800 px-6 relative overflow-hidden">
            {/* Subtle green ambient glow */}
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#10b981]/5 to-transparent blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Badge */}
                <motion.div
                    className="flex justify-center mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/5 text-xs font-bold text-[#10b981] uppercase tracking-wider">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Privacy & Data Protection
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.h2
                    className="text-3xl md:text-5xl font-black tracking-tight text-center mb-5"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    Your Business Data Is{' '}
                    <span className="text-[#10b981] drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">Sacred</span>
                </motion.h2>

                <motion.p
                    className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto text-center mb-16"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    We build systems that handle your most sensitive operations — inventory, finances, client records, employee data. We treat that responsibility with the seriousness it deserves.
                </motion.p>

                {/* Commitment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                    {commitments.map((item, i) => (
                        <motion.div
                            key={i}
                            className="group p-6 md:p-8 rounded-2xl border border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl hover:border-[#10b981]/20 transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                        >
                            <div className="flex items-start gap-5">
                                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#10b981]/8 border border-[#10b981]/15 flex items-center justify-center text-[#10b981] group-hover:bg-[#10b981]/12 group-hover:border-[#10b981]/25 transition-all duration-300">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom statement */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <p className="text-neutral-500 text-sm max-w-2xl mx-auto leading-relaxed">
                        <span className="text-[#10b981] font-semibold">Our promise:</span>{' '}
                        Every system we deliver is built with privacy by design. We don't cut corners on security, and we don't monetise your data. When you work with ICUNI Labs, your information stays exactly where it belongs — with you.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
