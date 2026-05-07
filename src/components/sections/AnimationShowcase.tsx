import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Compact rect config: [x, y, w, h, fill, opacity, rx]
type R = [number,number,number,number,string,number,number];
type C = [number,number,number,string,number]; // cx,cy,r,fill,opacity

interface Scene {
  title: string;
  copy: string;
  rects: R[];
  circles: C[];
}

const _ = '#0a0a0a', D = '#141414', W = '#ffffff', B = '#00bfff', O = '#ff6600', S = '#333', M = '#555', L = '#222';

// 16 rects, 4 circles per scene — they morph between positions
const scenes: Scene[] = [
  // 0: TITLE CARD
  { title: 'ICUNI Labs', copy: 'Custom Business Operations Systems', rects: [
    [100,150,600,300,_,1,16],[120,170,560,260,D,1,12],[200,220,400,30,W,0.9,6],[200,270,300,12,M,0.6,4],
    [200,310,200,40,B,0.8,8],[250,322,100,16,W,0.9,4],[350,200,100,3,B,0.3,2],[350,380,100,3,B,0.3,2],
    [0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],
    [0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],
  ], circles: [[400,200,4,B,0.5],[400,380,4,B,0.5],[180,300,3,B,0.3],[620,300,3,B,0.3]] },

  // 1: FULL OPERATIONS DASHBOARD (most complex)
  { title: 'Operations Platforms', copy: 'End-to-end systems that run your entire business from one screen', rects: [
    [0,0,800,600,_,1,16],[0,0,800,55,D,1,12],[0,50,800,6,D,1,0],[0,55,170,545,D,0.7,0],
    [190,75,190,90,L,0.8,12],[400,75,190,90,L,0.8,12],[610,75,170,90,L,0.8,12],
    [190,185,590,380,L,0.5,12],
    [220,420,50,120,W,0.8,4],[290,380,50,160,M,0.6,4],[360,350,50,190,B,0.9,4],[430,400,50,140,W,0.7,4],[500,360,50,180,M,0.5,4],[570,390,50,150,W,0.6,4],
    [20,85,130,14,B,0.3,6],[20,115,100,14,S,0.8,6],
  ], circles: [[40,28,12,B,0.3],[210,100,8,W,0.1],[700,28,10,S,1],[420,100,8,B,0.2]] },

  // 2: CRM PIPELINE
  { title: 'CRM & Deal Pipelines', copy: 'Track every lead from first contact to closed deal automatically', rects: [
    [0,0,800,600,_,1,16],[0,0,800,55,D,1,12],[0,50,800,6,D,1,0],
    [30,80,230,50,D,0.9,8],[280,80,230,50,D,0.9,8],[530,80,240,50,D,0.9,8],
    [30,150,230,120,L,0.7,8],[30,285,230,120,L,0.5,8],[30,420,230,100,L,0.4,8],
    [280,150,230,130,L,0.7,8],[280,300,230,100,L,0.5,8],
    [530,150,240,150,B,0.15,8],[530,320,240,100,L,0.4,8],
    [60,160,170,14,W,0.8,4],[310,160,170,14,W,0.7,4],[560,160,180,14,B,0.8,4],
  ], circles: [[145,105,6,O,0.8],[395,105,6,B,0.7],[650,105,6,'#10b981',0.8],[650,250,12,B,0.2]] },

  // 3: WORKFLOW ENGINE
  { title: 'Automated Workflows', copy: 'Eliminate manual processes — let the system handle routing and execution', rects: [
    [0,0,800,600,_,1,16],
    [50,220,160,140,D,0.9,8],[50,220,160,35,S,0.5,8],[320,190,180,180,D,0.9,8],[320,190,180,35,S,0.5,8],
    [610,220,150,140,D,0.9,8],[610,220,150,35,B,0.15,8],
    [70,280,120,16,B,0.25,3],[70,305,100,16,W,0.05,3],[70,330,110,16,W,0.05,3],
    [360,340,40,40,'#2d3748',0.8,4],[420,340,40,40,B,0.5,4],
    [0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],[0,0,0,0,_,0,0],
  ], circles: [[210,290,5,B,0.8],[320,290,5,B,0.8],[500,290,5,B,0.8],[610,290,5,B,0.8]] },

  // 4: CLIENT PORTAL
  { title: 'Client Portals', copy: 'Give your clients a branded window into their project — real-time, always-on', rects: [
    [0,0,800,600,_,1,16],[0,0,800,40,D,1,12],[0,35,800,6,D,1,0],[0,40,200,560,D,0.7,0],
    [240,80,520,80,L,0.8,12],[270,100,150,14,W,0.9,6],[270,125,250,10,M,0.5,4],
    [240,185,250,140,D,0.8,12],[510,185,250,140,D,0.8,12],
    [240,345,250,140,D,0.8,12],[510,345,250,140,D,0.8,12],
    [260,205,60,60,B,0.15,8],[530,205,60,60,B,0.15,8],
    [30,100,140,22,S,0.8,6],[30,140,140,22,S,0.3,6],[30,180,140,22,S,0.3,6],
  ], circles: [[100,300,40,L,0.8],[100,300,40,B,0.1],[28,20,6,'#ff5f56',1],[48,20,6,'#ffbd2e',1]] },

  // 5: DATA TABLE / INVENTORY
  { title: 'Inventory & Stock Systems', copy: 'Real-time data tables that track every unit, order, and movement', rects: [
    [0,0,800,600,_,1,16],[40,40,200,22,W,0.9,6],[40,75,300,10,M,0.4,4],
    [40,120,720,40,D,0.9,8],[40,175,720,50,D,0.5,8],[40,240,720,50,D,0.5,8],
    [40,305,720,50,D,0.5,8],[40,370,720,50,D,0.5,8],[40,435,720,50,D,0.5,8],
    [420,190,140,10,S,0.6,5],[420,255,100,10,B,0.8,5],[420,320,120,10,O,0.7,5],
    [420,385,90,10,B,0.6,5],[420,450,130,10,B,0.8,5],
    [620,180,80,20,B,0.15,10],[620,245,80,20,O,0.15,10],
  ], circles: [[60,200,8,B,0.8],[60,265,8,O,0.8],[60,330,8,B,0.8],[60,395,8,O,0.8]] },

  // 6: NOTIFICATION SYSTEM (simple)
  { title: 'Smart Notifications', copy: 'Automated alerts that keep your team and clients in the loop', rects: [
    [0,0,800,600,_,1,16],
    [200,80,400,100,D,0.9,12],[220,100,250,14,W,0.8,4],[220,125,180,10,M,0.5,4],[520,110,60,30,B,0.7,6],
    [200,200,400,100,D,0.7,12],[220,220,200,14,W,0.7,4],[220,245,160,10,M,0.4,4],[520,230,60,30,O,0.6,6],
    [200,320,400,100,D,0.5,12],[220,340,220,14,W,0.6,4],[220,365,140,10,M,0.3,4],[520,350,60,30,'#10b981',0.6,6],
    [200,440,400,80,D,0.3,12],[220,460,180,14,W,0.4,4],[220,485,120,10,M,0.2,4],
  ], circles: [[180,130,10,B,0.6],[180,250,10,O,0.5],[180,370,10,'#10b981',0.5],[180,480,10,M,0.3]] },

  // 7: CHAOS → SYSTEM (finale)
  { title: 'From Chaos to System', copy: "That's what we do. Let's fix yours.", rects: [
    [0,0,800,600,_,1,16],
    [500,180,80,50,B,0.7,4],[500,245,80,50,B,0.6,4],[500,310,80,50,B,0.5,4],
    [600,180,80,50,B,0.6,4],[600,245,80,50,B,0.7,4],[600,310,80,50,B,0.5,4],
    [700,180,60,50,B,0.5,4],[700,245,60,50,B,0.4,4],[700,310,60,50,B,0.6,4],
    [80,200,60,20,O,0.4,2],[180,280,80,15,O,0.3,2],[120,160,50,25,O,0.5,2],
    [60,320,70,18,O,0.3,2],[200,180,40,30,O,0.4,2],[150,350,55,12,O,0.2,2],
  ], circles: [[100,250,12,O,0.5],[170,200,8,O,0.4],[130,310,6,O,0.3],[200,350,10,O,0.3]] },
];

const DURATION = 5500;
const MORPH = { duration: 1.8, ease: [0.25, 0.1, 0.25, 1] as const };

// Typewriter for marketing copy
function TypedCopy({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const id = setInterval(() => setCount(c => { if (c >= text.length) { clearInterval(id); return c; } return c + 1; }), 18);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, count)}
      <span className="inline-block w-[2px] h-[1em] ml-1 align-middle" style={{ backgroundColor: count < text.length ? '#00bfff' : 'transparent', boxShadow: count < text.length ? '0 0 4px #00bfff' : 'none' }} />
    </span>
  );
}

export default function AnimationShowcase() {
  const [idx, setIdx] = useState(0);
  const scene = scenes[idx];

  const advance = useCallback(() => setIdx(i => (i + 1) % scenes.length), []);
  useEffect(() => { const t = setInterval(advance, DURATION); return () => clearInterval(t); }, [advance]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 md:p-10 select-none">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00bfff]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Title + Copy */}
      <div className="w-full max-w-5xl mb-6 min-h-[90px] relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">{scene.title}</h2>
            <p className="text-base md:text-lg text-neutral-400 font-mono">
              <TypedCopy text={scene.copy} />
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Single morphing SVG */}
      <div className="w-full max-w-5xl aspect-[4/3] rounded-2xl border border-neutral-800/60 bg-neutral-950/80 shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden relative">
        <svg viewBox="0 0 800 600" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00bfff" stopOpacity="0.15" /><stop offset="100%" stopColor="#00bfff" stopOpacity="0" /></linearGradient>
          </defs>

          {/* 16 morphing rects */}
          {scene.rects.map((r, i) => (
            <motion.rect
              key={i}
              animate={{ x: r[0], y: r[1], width: r[2], height: r[3], opacity: r[5], rx: r[6] }}
              transition={MORPH}
              fill={r[4]}
              stroke={r[4] === B ? B : r[4] === O ? O : 'none'}
              strokeWidth={r[4] === B || r[4] === O ? 1 : 0}
              strokeOpacity={0.3}
            />
          ))}

          {/* 4 morphing circles */}
          {scene.circles.map((c, i) => (
            <motion.circle
              key={`c${i}`}
              animate={{ cx: c[0], cy: c[1], r: c[2], opacity: c[4] }}
              transition={MORPH}
              fill={c[3]}
              filter={c[3] === B ? 'url(#glow)' : undefined}
            />
          ))}

          {/* Subtle scan line effect */}
          <motion.rect
            x="0" width="800" height="2" fill={B} opacity={0.06}
            animate={{ y: [0, 600] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </svg>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-5xl mt-6 flex gap-2">
        {scenes.map((s, i) => (
          <button key={i} onClick={() => setIdx(i)} className="flex-1 h-1 rounded-full overflow-hidden bg-neutral-800 cursor-pointer" aria-label={s.title}>
            {i === idx ? (
              <motion.div className="h-full bg-[#00bfff] rounded-full shadow-[0_0_6px_rgba(0,191,255,0.5)]" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: DURATION / 1000, ease: 'linear' }} />
            ) : (
              <div className={`h-full rounded-full ${i < idx ? 'bg-neutral-600' : ''}`} />
            )}
          </button>
        ))}
      </div>

      {/* Branding */}
      <motion.p className="text-[11px] text-neutral-600 mt-6 tracking-[0.2em] uppercase font-bold"
        animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity }}>
        ICUNI Labs — Custom Business Operations Systems
      </motion.p>
    </div>
  );
}
