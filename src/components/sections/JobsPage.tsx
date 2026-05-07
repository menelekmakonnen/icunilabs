import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, DollarSign, Send, ChevronRight, Briefcase, Mic, Square, Upload, FileText, Eye, EyeOff, Video } from 'lucide-react';
import { AboutSVG, RequirementsSVG, BenefitsSVG, TabToggle } from './JobsSVG';
import QualificationFlow from './QualificationFlow';

const API = import.meta.env.VITE_APPS_SCRIPT_URL;
const inp = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] transition-all placeholder:text-neutral-600";
const card = "bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]";
const ic = "w-5 h-5 flex-shrink-0 mt-0.5";

/* Unique requirement icons */
const reqIcons = [
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M14 3a2 2 0 012 2v2l-3 3-2-2-4 4-3-3" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="15" r="2" stroke="#00bfff" strokeWidth="1.2"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M3 14l4-4 3 3 7-7" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="3" width="16" height="14" rx="2" stroke="#00bfff" strokeWidth="1.2"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M5 4h2l1 3-1.5 1.5a8 8 0 004 4L12 11l3 1v2a2 2 0 01-2 2A12 12 0 013 6a2 2 0 012-2z" stroke="#00bfff" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="#00bfff" strokeWidth="1.2"/><rect x="11" y="3" width="6" height="6" rx="1" stroke="#00bfff" strokeWidth="1.2"/><rect x="3" y="11" width="6" height="6" rx="1" stroke="#00bfff" strokeWidth="1.2"/><rect x="11" y="11" width="6" height="6" rx="1" stroke="#00bfff" strokeWidth="1.2"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#00bfff" strokeWidth="1.2"/><path d="M7 10.5l2 2 4-4" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M10 2L10 18M10 2l3 3M10 2L7 5" stroke="#00bfff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="14" r="4" stroke="#00bfff" strokeWidth="1.2"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M4 17l3-8 6 3-9 5z" fill="#00bfff" fillOpacity="0.15" stroke="#00bfff" strokeWidth="1.2" strokeLinejoin="round"/><circle cx="13" cy="7" r="4" stroke="#00bfff" strokeWidth="1.2"/><path d="M11.5 5.5l1.5 1.5 2-2" stroke="#00bfff" strokeWidth="1" strokeLinecap="round"/></svg>,
];

/* Unique benefit icons */
const benIcons = [
  <svg className={ic} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="#ff7a00" strokeWidth="1.2"/><text x="10" y="13" textAnchor="middle" fill="#ff7a00" fontSize="8" fontWeight="bold">$</text></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M3 16l4-5 3 3 4-6 3 4" stroke="#ff7a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><text x="10" y="14" textAnchor="middle" fill="#ff7a00" fontSize="10" fontWeight="bold">%</text><circle cx="10" cy="10" r="7" stroke="#ff7a00" strokeWidth="1.2"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3" stroke="#ff7a00" strokeWidth="1.2"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#ff7a00" strokeWidth="1.2" strokeLinecap="round"/><path d="M14 5l1.5-2M15.5 3l1 1" stroke="#ff7a00" strokeWidth="1" strokeLinecap="round"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="#ff7a00" strokeWidth="1.2"/><path d="M6 9h3M6 12h5" stroke="#ff7a00" strokeWidth="1" strokeLinecap="round"/><circle cx="14" cy="9" r="1.5" fill="#ff7a00" fillOpacity="0.4"/></svg>,
  <svg className={ic} viewBox="0 0 20 20" fill="none"><path d="M10 3v6l3 3" stroke="#ff7a00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13l-2 4h12l-2-4" stroke="#ff7a00" strokeWidth="1.2" strokeLinecap="round"/><path d="M10 3l1.5-1M10 3L8.5 2" stroke="#ff7a00" strokeWidth="1" strokeLinecap="round"/></svg>,
];

const jobs = [{
  id:'ops-assistant-001', title:'Operations Assistant', type:'Full-Time', location:'Accra, Ghana',
  salary:'GH\u20B53,000/month + commission', heroImage:'/ops-assistant-hero.png',
  shortDesc:'Keep our client pipeline moving, coordinate referral partners, and grow with a tech company building real systems for real businesses.',
  flyerImage:'/ops-assistant-flyer.jpg',
  deadline: '2026-05-18T00:00:00', // Sunday 17 May end-of-day
  perks:['Commission on every project','Real tech industry experience','Growth trajectory'],
  fullDescription:[
    "Hey! \ud83d\udc4b\ud83c\udffe We build custom operations systems for businesses across Ghana and beyond.",
    "We help companies replace spreadsheets, WhatsApp chaos, and manual processes with software built for how they actually work.",
    "We're growing fast and need someone sharp, organized, and persistent to keep things moving behind the scenes.",
    "As Ops Assistant, you'll manage the space between building and closing \u2014 scheduling, follow-ups, pipeline tracking, payment chasing, referral coordination \u2014 you name it.",
    "This is NOT a desk-and-wait role \ud83d\ude45\ud83c\udffe\u200d\u2642\ufe0f You'll be on calls daily with business owners and decision-makers.",
    "You'll send emails, update our CRM, and make sure every lead gets the attention it deserves.",
    "You'll work directly with the founder and see how we acquire clients, deliver projects, and scale. Full visibility. Real impact.",
    "Basically \u2014 if you're the type who follows up without being reminded, loves being on top of things, and wants to grow inside a tech company building the future of business ops in Africa\u2026 we want to hear from you \ud83d\ude80",
  ],
  requirements:[
    'Follows up without being reminded, persistent and proactive',
    'Strong written and verbal communication in English',
    'Comfortable making cold and warm calls to business owners',
    'Highly organized, tracks tasks in systems not from memory',
    'Familiar with Google Workspace (Sheets, Docs, Gmail, Calendar)',
    'Based in Accra, Ghana',
    'Available to start ASAP',
  ],
  benefits:[
    'GH\u20B53,000 monthly base salary',
    'Commission on every paid project the company delivers',
    'Up to 10% commission on deals you directly bring in',
    'Direct mentorship from the founder',
    'Real experience inside a growing tech company',
    'Clear growth path as the company scales',
  ],
  applyEmail:'jobs@icuni.org',
}].filter(j => !j.deadline || new Date(j.deadline) > new Date());

export default function JobsPage(){
  const h = window.location.hash;
  const applyMatch = h.match(/^#apply\/(.+)$/);
  const jobMatch = h.match(/^#job\/(.+)$/);
  if (applyMatch) {
    const j = jobs.find(x=>x.id===applyMatch[1]);
    if (j) return <ApplyModal job={j}/>;
  }
  if (jobMatch) {
    const j = jobs.find(x=>x.id===jobMatch[1]);
    if (j) return <Detail job={j}/>;
  }
  return <Listing/>;
}

/* ---- Sequential Chat Messages ---- */
function ChatMessages({messages}:{messages:string[]}){
  const [revealed,setRevealed]=useState(0);
  const [typing,setTyping]=useState(false);
  const containerRef=useRef<HTMLDivElement>(null);
  const started=useRef(false);

  useEffect(()=>{
    if(!containerRef.current)return;
    const obs=new IntersectionObserver(([e])=>{
      if(e.isIntersecting&&!started.current){started.current=true;setTyping(true);}
    },{threshold:0.15});
    obs.observe(containerRef.current);
    return()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    if(!typing)return;
    const t=setTimeout(()=>{
      setTyping(false);
      setRevealed(r=>{
        const next=r+1;
        if(next<messages.length)setTimeout(()=>setTyping(true),200);
        return next;
      });
    },600);
    return()=>clearTimeout(t);
  },[typing,messages.length]);

  const total=messages.length;
  return(
    <div ref={containerRef} className="p-3 min-h-[120px]">
      {messages.slice(0,revealed).map((msg,i)=>{
        const minsAgo=total-1-i;
        const isLast=i===revealed-1&&revealed===total;
        const timeLabel=minsAgo===0?'Now':minsAgo===1?'1m ago':`${minsAgo}m ago`;
        return(
          <motion.div key={i} initial={{opacity:0,y:14,scale:0.93}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.3,ease:'easeOut'}} className="mb-1.5">
            <div className="max-w-[80%] ml-auto group">
              <div className={`relative px-4 py-2.5 rounded-2xl rounded-br-sm text-[14px] leading-[1.7] transition-all duration-200 group-hover:shadow-[0_4px_20px_rgba(255,122,0,0.2)] group-hover:-translate-y-[1px] ${
                isLast?'bg-gradient-to-br from-[#ff7a00]/25 to-[#cc5500]/15 border border-[#ff7a00]/30 text-white'
                :'bg-gradient-to-br from-[#ff7a00]/8 to-neutral-800/80 border border-[#ff7a00]/10 text-neutral-200 group-hover:border-[#ff7a00]/25'
              }`}>
                {msg}
                <svg className="absolute -bottom-[6px] right-3 w-3 h-2" viewBox="0 0 12 8" fill="none">
                  <path d="M0 0L6 8L12 0Z" fill={isLast?'rgba(180,80,0,0.2)':'rgba(100,60,20,0.15)'}/>
                </svg>
              </div>
              <p className="text-[10px] text-neutral-600 mt-1 text-right mr-1">{timeLabel}</p>
            </div>
          </motion.div>
        );
      })}
      {typing&&(
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.15}} className="mb-1">
          <div className="flex gap-1 px-3 py-2 rounded-2xl rounded-br-sm bg-[#ff7a00]/10 border border-[#ff7a00]/10 w-fit ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]/60 animate-bounce" style={{animationDelay:'0ms'}}/>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]/60 animate-bounce" style={{animationDelay:'150ms'}}/>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]/60 animate-bounce" style={{animationDelay:'300ms'}}/>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Listing(){
  return(
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-6">
            <Briefcase className="w-3 h-3 text-[#00bfff]"/>{jobs.length} open position{jobs.length!==1?'s':''}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-3">Careers</h1>
          <p className="text-lg text-neutral-400 max-w-xl mb-12">Join a team building custom operations systems for businesses across Ghana and beyond.</p>
        </motion.div>
        <div className="space-y-4">
          {jobs.map((j,i)=>(
            <motion.a key={j.id} href={`#job/${j.id}`}
              className="block rounded-xl relative overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all group cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
              initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.1}}>
              <img src={j.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"/>
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/80 to-neutral-950/60"/>
              <div className="relative p-6 md:p-8 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00bfff] transition-colors">{j.title}</h3>
                  <p className="text-sm text-neutral-300 mb-4 leading-relaxed">{j.shortDesc}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{j.type}</span>
                    <span className="text-neutral-700">&#183;</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{j.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {j.perks.map(p=><span key={p} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-neutral-300">{p}</span>)}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-[#00bfff] group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"/>
              </div>
            </motion.a>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-500">{"Don't see a fit? Email "}<a href="mailto:jobs@icuni.org" className="text-[#00bfff] hover:underline">jobs@icuni.org</a>{" anyway."}</p>
        </div>
      </div>
    </div>
  );
}

const ApplyBtn = ({jobId}:{jobId:string})=>(
  <a href={`#apply/${jobId}`} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_25px_rgba(255,102,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer">
    <Send className="w-4 h-4"/> Apply Now
  </a>
);

function Detail({job}:{job:typeof jobs[0]}){
  const [showSalary,setShowSalary]=useState(false);
  const [lightbox,setLightbox]=useState(false);

  return(
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* Hero */}
      <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
        <img src={job.heroImage} alt={job.title} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <div className="max-w-4xl mx-auto">
            <a href="#jobs" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4"><ArrowLeft className="w-4 h-4"/> All positions</a>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-sm font-medium">{job.type}</span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-sm font-medium">Hybrid</span>
              <span className="flex items-center gap-1 text-sm text-neutral-300"><MapPin className="w-3.5 h-3.5"/>{job.location}</span>
              <button onClick={()=>setShowSalary(!showSalary)} className="flex items-center gap-1.5 text-[#ff7a00] hover:text-[#ff9533] transition-colors cursor-pointer text-sm font-medium">
                <span className="text-base font-bold leading-none">₵</span>
                {showSalary?job.salary:'Reveal salary'}{showSalary?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}
              </button>
            </div>
            {/* CTA #1 */}
            <ApplyBtn jobId={job.id}/>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        <div className="grid md:grid-cols-[1fr_280px] gap-10">
          {/* Main content */}
          <div className="space-y-16 min-w-0">
            {/* About - Chat/message interface */}
            <section className="relative">
              <AboutSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#00bfff]"/></span>
                  About This Role
                </h2>
                {/* Chat interface */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-neutral-900/80 border-b border-neutral-800">
                    <img src="/icuni_logo.png" alt="ICUNI Labs" className="w-9 h-9 rounded-full bg-neutral-800 p-1 object-contain"/>
                    <div>
                      <p className="text-sm font-semibold text-white">ICUNI Labs</p>
                      <p className="text-[10px] text-[#10b981] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block"/>Online now</p>
                    </div>
                  </div>
                  <ChatMessages messages={job.fullDescription}/>
                </div>
              </motion.div>
            </section>

            {/* Requirements - Paper unfolding */}
            <section className="relative">
              <RequirementsSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#00bfff]"/></span>
                  What We Need From You
                </h2>
                <div className="space-y-2">
                  {job.requirements.map((r,i)=>(
                    <motion.div key={i}
                      initial={{opacity:0,scaleY:0,originY:0}}
                      whileInView={{opacity:1,scaleY:1}}
                      viewport={{once:true,margin:'-10px'}}
                      transition={{duration:0.4,delay:i*0.08,ease:[0.25,0.46,0.45,0.94]}}
                      className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/40 text-neutral-300 text-[15px] leading-relaxed origin-top"
                    >
                      {reqIcons[i] || reqIcons[0]}
                      <span>{r}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Benefits - Paper unfolding */}
            <section className="relative">
              <BenefitsSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#ff7a00]"/></span>
                  What You Get
                </h2>
                <div className="space-y-2">
                  {job.benefits.map((b,i)=>(
                    <motion.div key={i}
                      initial={{opacity:0,scaleY:0,originY:0}}
                      whileInView={{opacity:1,scaleY:1}}
                      viewport={{once:true,margin:'-10px'}}
                      transition={{duration:0.4,delay:i*0.08,ease:[0.25,0.46,0.45,0.94]}}
                      className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/40 text-neutral-300 text-[15px] leading-relaxed origin-top"
                    >
                      {benIcons[i] || benIcons[0]}
                      <span>{b}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* CTA - after benefits */}
            <motion.div initial={{opacity:0,scale:0.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
              className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,191,255,0.05),transparent_70%)]"/>
              <h3 className="text-2xl font-bold mb-2 relative z-10">Sound like you?</h3>
              <p className="text-neutral-400 mb-6 relative z-10">We move fast. Apply now and hear back within days.</p>
              <div className="relative z-10"><ApplyBtn jobId={job.id}/></div>
            </motion.div>
          </div>

          {/* Sidebar - desktop only */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-4">
              {/* Job flyer image - click to expand */}
              {job.flyerImage && (
                <button onClick={()=>setLightbox(true)} className={`${card} overflow-hidden cursor-pointer group w-full`}>
                  <img src={job.flyerImage} alt={`${job.title} flyer`} className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"/>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-white">Click to expand</span>
                  </div>
                </button>
              )}
              {/* Job summary card */}
              <div className={`${card} p-6`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-4">Quick Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-neutral-300"><Clock className="w-4 h-4 text-[#00bfff]"/>{job.type}</div>
                  <div className="flex items-center gap-2 text-neutral-300"><MapPin className="w-4 h-4 text-[#00bfff]"/>{job.location}</div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <DollarSign className="w-4 h-4 text-[#ff7a00]"/>
                    <button onClick={()=>setShowSalary(!showSalary)} className="text-[#ff7a00] hover:text-[#ff9533] transition-colors cursor-pointer font-medium">
                      {showSalary?job.salary:'Reveal salary'}
                    </button>
                  </div>
                </div>
                <div className="border-t border-neutral-800 mt-4 pt-4">
                  <p className="text-xs text-neutral-500 mb-4">{job.shortDesc}</p>
                  <a href={`#apply/${job.id}`} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:-translate-y-[1px] transition-all cursor-pointer text-sm">
                    <Send className="w-4 h-4"/> Apply Now
                  </a>
                </div>
              </div>

              {/* Refer & Earn card */}
              <a href="#referral" className={`${card} p-5 block group hover:border-[#ff7a00]/30 transition-all`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#ff7a00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  </div>
                  <span className="text-sm font-bold text-white group-hover:text-[#ff7a00] transition-colors">Refer &amp; Earn</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">Know someone who needs our services? Connect us and earn commission on every deal.</p>
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightbox && job.flyerImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={()=>setLightbox(false)} onKeyDown={e=>{if(e.key==='Escape')setLightbox(false);}} tabIndex={0}>
          <img src={job.flyerImage} alt={`${job.title} flyer`} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"/>
          <button onClick={()=>setLightbox(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ---- Full-screen Apply page ---- */
function ApplyModal({job}:{job:typeof jobs[0]}){
  return(
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20">
      <div className="max-w-lg mx-auto px-6">
        <a href={`#job/${job.id}`} className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4"/> Back to {job.title}
        </a>
        <AppForm job={job}/>
      </div>
    </div>
  );
}

/* ---- Drop zone hook ---- */
function useDrop(onFile:(f:File)=>void, accept?:string[]){
  const [d,setD]=useState(false);
  const h=useCallback((e:React.DragEvent)=>{e.preventDefault();e.stopPropagation();},[]);
  const hi=useCallback((e:React.DragEvent)=>{e.preventDefault();setD(true);},[]);
  const ho=useCallback((e:React.DragEvent)=>{e.preventDefault();setD(false);},[]);
  const hd=useCallback((e:React.DragEvent)=>{
    e.preventDefault();setD(false);const f=e.dataTransfer.files?.[0];if(!f)return;
    if(accept?.length){const ext='.'+f.name.split('.').pop()!.toLowerCase();if(!accept.some(a=>a.startsWith('.')?ext===a.toLowerCase():f.type.startsWith(a)))return;}
    onFile(f);
  },[onFile,accept]);
  return{d,p:{onDragOver:h,onDragEnter:hi,onDragLeave:ho,onDrop:hd}};
}

function AppForm({job}:{job:typeof jobs[0]}){
  const [name,setName]=useState('');const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');const [note,setNote]=useState('');
  const [cvFile,setCvFile]=useState<File|null>(null);
  const [videoFile,setVideoFile]=useState<File|null>(null);
  const [audioBlob,setAudioBlob]=useState<Blob|null>(null);
  const [audioFile,setAudioFile]=useState<File|null>(null);
  const [rec,setRec]=useState(false);const [recTime,setRecTime]=useState(0);
  const [done,setDone]=useState(false);const [busy,setBusy]=useState(false);
  const [vidErr,setVidErr]=useState('');
  const [cvTab,setCvTab]=useState(0); // 0=document 1=video
  const [voiceTab,setVoiceTab]=useState(0); // 0=record 1=upload

  const mr=useRef<MediaRecorder|null>(null);const ch=useRef<Blob[]>([]);const ti=useRef<number|null>(null);
  const cvDrop=useDrop(f=>setCvFile(f),['.pdf','.doc','.docx','.txt','.rtf','.odt']);
  const audioDrop=useDrop(f=>{setAudioFile(f);setAudioBlob(null);},['audio/']);
  const vidDrop=useDrop(f=>{setVidErr('');if(f.size>300*1024*1024){setVidErr('Max 300 MB.');return;}setVideoFile(f);},['video/']);

  async function startRec(){
    try{const s=await navigator.mediaDevices.getUserMedia({audio:true});const m=new MediaRecorder(s);mr.current=m;ch.current=[];
    m.ondataavailable=e=>{if(e.data.size>0)ch.current.push(e.data);};
    m.onstop=()=>{setAudioBlob(new Blob(ch.current,{type:'audio/webm'}));setAudioFile(null);s.getTracks().forEach(t=>t.stop());};
    m.start();setRec(true);setRecTime(0);ti.current=window.setInterval(()=>setRecTime(t=>t+1),1000);}catch{}
  }
  function stopRec(){mr.current?.stop();setRec(false);if(ti.current)clearInterval(ti.current);}
  useEffect(()=>()=>{if(ti.current)clearInterval(ti.current);},[]);

  function b64(f:File|Blob):Promise<string>{return new Promise(r=>{const rd=new FileReader();rd.onloadend=()=>r((rd.result as string).split(',')[1]);rd.readAsDataURL(f);});}

  const audioOk=audioBlob||audioFile;
  const ok=!busy&&audioOk;
  const fmt=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const dropCls=(active:boolean,has:boolean)=>active?'border-[#00bfff] bg-[#00bfff]/10':has?'border-[#00bfff]/50 bg-[#00bfff]/5':'border-neutral-800 hover:border-neutral-700';

  async function submit(e:React.FormEvent){
    e.preventDefault();if(!audioOk)return;setBusy(true);
    try{
      const p:Record<string,unknown>={action:'job_application',jobId:job.id,jobTitle:job.title,name,email,phone,note};
      if(cvFile){p.cvBase64=await b64(cvFile);p.cvName=cvFile.name;}
      const a=audioBlob||audioFile;if(a){p.audioBase64=await b64(a);p.audioName=audioFile?audioFile.name:'voice-intro.webm';}
      if(videoFile){p.videoBase64=await b64(videoFile);p.videoName=videoFile.name;}
      if(API)await fetch(API,{method:'POST',body:JSON.stringify(p),redirect:'follow'});
    }catch{}
    setBusy(false);setDone(true);
  }

  if(done)return(
    <QualificationFlow name={name} email={email} jobId={job.id} jobTitle={job.title} />
  );

  return(
    <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className={`${card} p-8 max-w-lg mx-auto`}>
      <h3 className="text-xl font-bold mb-1">Apply for {job.title}</h3>
      <p className="text-sm text-neutral-500 mb-6">Or email <a href={`mailto:${job.applyEmail}`} className="text-[#00bfff] hover:underline">{job.applyEmail}</a></p>
      <form onSubmit={submit} className="space-y-5">
        <input type="text" required value={name} onChange={e=>setName(e.target.value)} className={inp} placeholder="Full name"/>
        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={inp} placeholder="Email"/>
        <input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} className={inp} placeholder="Phone"/>

        {/* CV: tab toggle document vs video */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Your CV</label>
          <TabToggle tabs={['Document CV','Video CV']} active={cvTab} onChange={setCvTab}/>
          {cvTab===0?(
            <label {...cvDrop.p} className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${dropCls(cvDrop.d,!!cvFile)}`}>
              <FileText className={`w-6 h-6 ${cvFile?'text-[#00bfff]':'text-neutral-600'}`}/>
              <span className={`text-sm text-center ${cvFile?'text-white':'text-neutral-500'}`}>{cvFile?cvFile.name:'Drop CV here or click to browse'}</span>
              <span className="text-[11px] text-neutral-600">PDF, Word, or text documents</span>
              <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.odt" className="hidden" onChange={e=>{setCvFile(e.target.files?.[0]||null);setVideoFile(null);}}/>
            </label>
          ):(
            <label {...vidDrop.p} className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${dropCls(vidDrop.d,!!videoFile)}`}>
              <Video className={`w-6 h-6 ${videoFile?'text-[#00bfff]':'text-neutral-600'}`}/>
              <span className={`text-sm text-center ${videoFile?'text-white':'text-neutral-500'}`}>{videoFile?videoFile.name:'Drop video here or click to browse'}</span>
              <span className="text-[11px] text-neutral-600">MP4, MOV, WebM - max 300 MB</span>
              <input type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.avi" className="hidden" onChange={e=>{const f=e.target.files?.[0];setVidErr('');if(!f){setVideoFile(null);return;}if(f.size>300*1024*1024){setVidErr('Max 300 MB.');return;}setVideoFile(f);setCvFile(null);}}/>
            </label>
          )}
          {vidErr&&<p className="text-xs text-red-400 mt-1">{vidErr}</p>}
        </div>

        {/* Voice Intro: tab toggle record vs upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Voice Intro <span className="text-red-500">*</span></label>
          <p className="text-xs text-neutral-400 mb-2">Why are you right for this role?</p>
          <TabToggle tabs={['Record','Upload File']} active={voiceTab} onChange={setVoiceTab}/>
          {voiceTab===0?(
            <div className="space-y-2">
              {!rec?(
                <button type="button" onClick={startRec} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer text-sm">
                  <Mic className="w-5 h-5 text-red-500"/> Tap to Record
                </button>
              ):(
                <button type="button" onClick={stopRec} className="w-full flex items-center justify-center gap-2 py-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-400 cursor-pointer text-sm animate-pulse">
                  <Square className="w-4 h-4"/> Stop Recording ({fmt(recTime)})
                </button>
              )}
              {audioBlob&&!audioFile&&(
                <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg px-3 py-2">
                  <Mic className="w-3 h-3 text-[#10b981]"/>
                  <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1 [&::-webkit-media-controls-panel]{background:transparent}"/>
                  <span className="text-xs text-[#10b981]">{fmt(recTime)}</span>
                  <button type="button" onClick={()=>{setAudioBlob(null);setRecTime(0);}} className="p-1 rounded hover:bg-red-500/20 transition-colors cursor-pointer" title="Discard recording">
                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              )}
            </div>
          ):(
            <label {...audioDrop.p} className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${dropCls(audioDrop.d,!!audioFile)}`}>
              {audioFile?(
                <><Mic className="w-5 h-5 text-[#10b981]"/><span className="text-sm text-[#10b981]">{audioFile.name}</span></>
              ):(
                <><Upload className="w-5 h-5 text-neutral-600"/><span className="text-sm text-neutral-500">Drop audio file here or click</span></>
              )}
              <input type="file" accept="audio/*" className="hidden" onChange={e=>{setAudioFile(e.target.files?.[0]||null);setAudioBlob(null);}}/>
            </label>
          )}
          {!audioOk&&<p className="text-xs text-red-400/70 mt-2">Required - record or upload your voice intro</p>}
        </div>

        <textarea value={note} onChange={e=>setNote(e.target.value)} className={`${inp} resize-none`} rows={3} placeholder="Anything else? (optional)"/>

        <button type="submit" disabled={!ok}
          className={`w-full bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white font-bold py-3.5 rounded-lg hover:shadow-[0_0_25px_rgba(255,102,0,0.3)] transition-all cursor-pointer ${!ok?'opacity-40 cursor-not-allowed':''}`}>
          {busy?'Submitting...':'Submit Application'}
        </button>
      </form>
    </motion.div>
  );
}
