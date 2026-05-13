/**
 * ReferralProcessSVG — Animated 5-step referral pipeline visualization.
 *
 * Two modes:
 * 1) Hero mode (no activeStep) — all nodes animate in with staggered draw-on.
 * 2) Progress mode (activeStep provided) — nodes up to activeStep glow active,
 *    remaining are dim/future.
 */
import { motion } from 'framer-motion';

interface Props {
  /** 0-based active step index. Omit for hero/landing mode. */
  activeStep?: number;
  /** Compact inline mode for dashboard cards */
  compact?: boolean;
  className?: string;
}

const STAGES = [
  { label: 'You Introduce', sub: 'Show our work', color: '#ff7a00' },
  { label: 'Meeting Booked', sub: 'Set date & time', color: '#00bfff' },
  { label: 'We Meet', sub: 'We handle it', color: '#8b5cf6' },
  { label: 'Deal Closes', sub: 'Proposal signed', color: '#10b981' },
  { label: 'You Get Paid', sub: 'Cash or MoMo', color: '#ff7a00' },
];

export const STAGE_LABELS = STAGES.map(s => s.label);
export const STAGE_COUNT = STAGES.length;

// ── Icon paths for each stage ──
function StageIcon({ index, size = 20, color }: { index: number; size?: number; color: string }) {
  const s = size;
  const half = s / 2;
  const common = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (index) {
    case 0: // Handshake / person introducing
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
          <path d="M17 14c2 0 3.5 1.5 3.5 3.5V21" />
        </svg>
      );
    case 1: // Calendar
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" {...common}>
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M8 2v4M16 2v4M3 10h18" />
          <circle cx="12" cy="16" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 2: // Briefcase / meeting
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" {...common}>
          <rect x="2" y="7" width="20" height="14" rx="3" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          <path d="M2 13h20" />
          <circle cx="12" cy="13" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 3: // Document check
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" {...common}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path d="M14 2v6h6" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      );
    case 4: // Money
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10" />
          <path d="M8.5 9.5C8.5 8.1 10 7 12 7s3.5 1.1 3.5 2.5c0 2-3.5 1.75-3.5 3.5" />
          <circle cx="12" cy="16" r="0.5" fill={color} stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Compact inline progress bar (for dashboard referral cards) ──
function CompactProgress({ activeStep = -1 }: { activeStep?: number }) {
  return (
    <div className="flex items-center gap-1 w-full">
      {STAGES.map((stage, i) => {
        const done = i <= activeStep;
        const current = i === activeStep;
        return (
          <div key={i} className="flex items-center flex-1 min-w-0">
            {/* Dot */}
            <motion.div
              className="relative flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 300 }}
            >
              <div
                className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                style={{
                  borderColor: done ? stage.color : 'rgb(64,64,64)',
                  backgroundColor: done ? stage.color : 'transparent',
                  boxShadow: current ? `0 0 8px ${stage.color}60` : 'none',
                }}
              />
              {current && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${stage.color}` }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <div className="flex-1 h-[2px] mx-0.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i < activeStep ? STAGES[i + 1].color : 'rgb(38,38,38)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Full hero SVG pipeline ──
function HeroPipeline({ activeStep }: { activeStep?: number }) {
  const isProgress = activeStep !== undefined;

  return (
    <div className="w-full">
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start justify-between relative px-4">
        {/* Connector line behind nodes */}
        <div className="absolute top-8 left-[10%] right-[10%] h-[2px] z-0">
          <div className="w-full h-full bg-neutral-800 rounded-full" />
          {isProgress && activeStep > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #ff7a00, #00bfff, #8b5cf6, #10b981)` }}
              initial={{ width: '0%' }}
              animate={{ width: `${(activeStep / (STAGES.length - 1)) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          )}
          {!isProgress && (
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, #ff7a00, #00bfff, #8b5cf6, #10b981, #ff7a00)` }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
            />
          )}
        </div>

        {STAGES.map((stage, i) => {
          const done = isProgress ? i <= activeStep : true;
          const current = isProgress && i === activeStep;
          const future = isProgress && i > activeStep;
          const nodeDelay = isProgress ? 0 : i * 0.2;

          return (
            <motion.div
              key={i}
              className="flex flex-col items-center z-10 flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: nodeDelay, duration: 0.5 }}
            >
              {/* Node circle */}
              <motion.div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500"
                style={{
                  borderColor: future ? 'rgb(64,64,64)' : stage.color,
                  backgroundColor: done && !future ? `${stage.color}15` : 'rgb(10,10,10)',
                  boxShadow: current ? `0 0 20px ${stage.color}40, inset 0 0 15px ${stage.color}10` : done && !future ? `0 0 10px ${stage.color}15` : 'none',
                }}
                whileHover={!isProgress ? { scale: 1.08, boxShadow: `0 0 25px ${stage.color}30` } : undefined}
              >
                <div style={{ opacity: future ? 0.3 : 1 }}>
                  <StageIcon index={i} size={22} color={future ? 'rgb(100,100,100)' : stage.color} />
                </div>

                {/* Active pulse ring */}
                {(current || (!isProgress && i === 0)) && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: `2px solid ${stage.color}` }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  />
                )}

                {/* Step number badge */}
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
                  style={{
                    backgroundColor: future ? 'rgb(38,38,38)' : stage.color,
                    color: future ? 'rgb(100,100,100)' : 'white',
                  }}
                >
                  {done && !future ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    i + 1
                  )}
                </div>
              </motion.div>

              {/* Label */}
              <div className="mt-3 text-center">
                <p className={`text-sm font-bold transition-colors ${future ? 'text-neutral-600' : 'text-white'}`}>
                  {stage.label}
                </p>
                <p className={`text-[11px] mt-0.5 transition-colors ${future ? 'text-neutral-700' : 'text-neutral-500'}`}>
                  {stage.sub}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-1 pl-2">
        {STAGES.map((stage, i) => {
          const done = isProgress ? i <= activeStep : true;
          const current = isProgress && i === activeStep;
          const future = isProgress && i > activeStep;

          return (
            <motion.div
              key={i}
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              {/* Left: dot + vertical connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border-2"
                  style={{
                    borderColor: future ? 'rgb(64,64,64)' : stage.color,
                    backgroundColor: done && !future ? `${stage.color}15` : 'rgb(10,10,10)',
                    boxShadow: current ? `0 0 12px ${stage.color}40` : 'none',
                  }}
                >
                  <StageIcon index={i} size={16} color={future ? 'rgb(100,100,100)' : stage.color} />
                </motion.div>
                {i < STAGES.length - 1 && (
                  <div className="w-[2px] h-6 my-1 rounded-full transition-all"
                    style={{ backgroundColor: i < (activeStep ?? STAGES.length) ? STAGES[Math.min(i + 1, STAGES.length - 1)].color + '40' : 'rgb(38,38,38)' }}
                  />
                )}
              </div>

              {/* Right: text */}
              <div className="pt-1.5">
                <p className={`text-sm font-bold ${future ? 'text-neutral-600' : 'text-white'}`}>{stage.label}</p>
                <p className={`text-xs ${future ? 'text-neutral-700' : 'text-neutral-500'}`}>{stage.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Exported component ──
export default function ReferralProcessSVG({ activeStep, compact, className = '' }: Props) {
  if (compact) {
    return (
      <div className={className}>
        <CompactProgress activeStep={activeStep} />
        {activeStep !== undefined && activeStep >= 0 && activeStep < STAGES.length && (
          <p className="text-[10px] font-medium mt-1.5" style={{ color: STAGES[activeStep].color }}>
            {STAGES[activeStep].label}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <HeroPipeline activeStep={activeStep} />
    </div>
  );
}
