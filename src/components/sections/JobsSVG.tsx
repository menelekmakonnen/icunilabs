/* Decorative background SVGs and icon components for the Jobs page */
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/* ---- Section background SVGs (assemble on scroll) ---- */
export function ScrollSVG({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.12, 0.12, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.7, 1, 1, 0.7]);
  return (
    <div ref={ref} className={`absolute pointer-events-none ${className}`}>
      <motion.div style={{ opacity, scale }}>{children}</motion.div>
    </div>
  );
}

/* Network/connection nodes - About section */
export function AboutSVG() {
  return (
    <ScrollSVG className="right-0 top-0 w-[400px] h-[400px] -mr-20">
      <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="200" cy="200" r="3" fill="#00bfff" opacity="0.6" />
        <circle cx="120" cy="100" r="2" fill="#00bfff" opacity="0.4" />
        <circle cx="300" cy="130" r="2.5" fill="#ff7a00" opacity="0.4" />
        <circle cx="80" cy="280" r="2" fill="#00bfff" opacity="0.3" />
        <circle cx="320" cy="300" r="2" fill="#ff7a00" opacity="0.3" />
        <circle cx="250" cy="60" r="1.5" fill="#00bfff" opacity="0.3" />
        <circle cx="150" cy="340" r="1.5" fill="#ff7a00" opacity="0.3" />
        <line x1="200" y1="200" x2="120" y2="100" stroke="#00bfff" strokeWidth="0.5" opacity="0.2" />
        <line x1="200" y1="200" x2="300" y2="130" stroke="#ff7a00" strokeWidth="0.5" opacity="0.2" />
        <line x1="200" y1="200" x2="80" y2="280" stroke="#00bfff" strokeWidth="0.5" opacity="0.15" />
        <line x1="200" y1="200" x2="320" y2="300" stroke="#ff7a00" strokeWidth="0.5" opacity="0.15" />
        <line x1="120" y1="100" x2="250" y2="60" stroke="#00bfff" strokeWidth="0.3" opacity="0.1" />
        <line x1="300" y1="130" x2="320" y2="300" stroke="#ff7a00" strokeWidth="0.3" opacity="0.1" />
        <circle cx="200" cy="200" r="60" stroke="#00bfff" strokeWidth="0.5" opacity="0.08" strokeDasharray="4 6" />
        <circle cx="200" cy="200" r="120" stroke="#ff7a00" strokeWidth="0.3" opacity="0.06" strokeDasharray="2 8" />
        <circle cx="200" cy="200" r="180" stroke="#00bfff" strokeWidth="0.3" opacity="0.04" strokeDasharray="1 10" />
      </svg>
    </ScrollSVG>
  );
}

/* Checklist/badge - Requirements section */
export function RequirementsSVG() {
  return (
    <ScrollSVG className="left-0 top-10 w-[350px] h-[350px] -ml-24">
      <svg viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="80" y="60" width="190" height="230" rx="12" stroke="#00bfff" strokeWidth="0.6" opacity="0.1" />
        <rect x="100" y="90" width="150" height="8" rx="4" fill="#00bfff" opacity="0.06" />
        <rect x="100" y="115" width="120" height="8" rx="4" fill="#00bfff" opacity="0.05" />
        <rect x="100" y="140" width="140" height="8" rx="4" fill="#00bfff" opacity="0.04" />
        <rect x="100" y="165" width="100" height="8" rx="4" fill="#00bfff" opacity="0.04" />
        <rect x="100" y="190" width="130" height="8" rx="4" fill="#00bfff" opacity="0.03" />
        <path d="M115 94 L120 99 L130 89" stroke="#00bfff" strokeWidth="1.5" opacity="0.15" fill="none" strokeLinecap="round" />
        <path d="M115 119 L120 124 L130 114" stroke="#00bfff" strokeWidth="1.5" opacity="0.12" fill="none" strokeLinecap="round" />
        <path d="M115 144 L120 149 L130 139" stroke="#ff7a00" strokeWidth="1.5" opacity="0.12" fill="none" strokeLinecap="round" />
        <circle cx="280" cy="70" r="25" stroke="#ff7a00" strokeWidth="0.5" opacity="0.08" />
        <path d="M270 70 L277 77 L290 63" stroke="#ff7a00" strokeWidth="1" opacity="0.1" fill="none" strokeLinecap="round" />
      </svg>
    </ScrollSVG>
  );
}

/* Growth/upward - Benefits section */
export function BenefitsSVG() {
  return (
    <ScrollSVG className="right-0 top-0 w-[380px] h-[380px] -mr-16">
      <svg viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 320 L130 240 L200 260 L270 160 L340 80" stroke="#ff7a00" strokeWidth="1" opacity="0.1" strokeLinecap="round" />
        <path d="M60 320 L130 280 L200 290 L270 220 L340 180" stroke="#00bfff" strokeWidth="0.6" opacity="0.08" strokeLinecap="round" />
        <circle cx="130" cy="240" r="3" fill="#ff7a00" opacity="0.15" />
        <circle cx="270" cy="160" r="3" fill="#ff7a00" opacity="0.15" />
        <circle cx="340" cy="80" r="4" fill="#ff7a00" opacity="0.2" />
        <path d="M330 80 L340 65 L350 80" stroke="#ff7a00" strokeWidth="1" opacity="0.15" fill="none" strokeLinecap="round" />
        <rect x="50" y="320" width="300" height="0.5" fill="#00bfff" opacity="0.05" />
      </svg>
    </ScrollSVG>
  );
}

/* ---- Bullet point icons ---- */
export function BulletAbout() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#00bfff" strokeWidth="1" opacity="0.4" />
      <circle cx="8" cy="8" r="2" fill="#00bfff" opacity="0.8" />
    </svg>
  );
}

export function BulletCheck() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="3" stroke="#00bfff" strokeWidth="1" opacity="0.4" />
      <path d="M5 8 L7 10 L11 6" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

export function BulletStar() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-1" viewBox="0 0 16 16" fill="none">
      <path d="M8 2 L9.5 6 L14 6.5 L10.5 9.5 L11.5 14 L8 11.5 L4.5 14 L5.5 9.5 L2 6.5 L6.5 6 Z" stroke="#ff7a00" strokeWidth="0.8" fill="#ff7a00" opacity="0.3" />
    </svg>
  );
}

/* ---- Tab toggle component ---- */
export function TabToggle({ tabs, active, onChange }: { tabs: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex bg-neutral-900/80 rounded-lg p-0.5 border border-neutral-800 mb-3">
      {tabs.map((t, i) => (
        <button key={t} type="button" onClick={() => onChange(i)}
          className={`flex-1 text-xs font-semibold py-2 px-3 rounded-md transition-all cursor-pointer ${
            active === i ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
          }`}>{t}</button>
      ))}
    </div>
  );
}
