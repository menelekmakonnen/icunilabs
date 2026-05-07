import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, DollarSign, Send, ChevronRight, Briefcase, Mic, Square, Upload, FileText, Eye, EyeOff, Video } from 'lucide-react';
import { AboutSVG, RequirementsSVG, BenefitsSVG, BulletCheck, BulletStar, TabToggle } from './JobsSVG';
import QualificationFlow from './QualificationFlow';

const API = import.meta.env.VITE_APPS_SCRIPT_URL;
const inp = "w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] transition-all placeholder:text-neutral-600";
const card = "bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]";

const jobs = [{
  id:'ops-assistant-001', title:'Operations Assistant', type:'Full-Time', location:'Accra, Ghana',
  salary:'GH\u20B53,000/month + commission', heroImage:'/ops-assistant-hero.png',
  shortDesc:'Keep our client pipeline moving, coordinate referral partners, and grow with a tech company building real systems for real businesses.',
  flyerImage:'/ops-assistant-flyer.jpg',
  perks:['Commission on every project','Real tech industry experience','Growth trajectory'],
  fullDescription:[
    "ICUNI Labs builds custom business operations systems for companies across Ghana and beyond. Our clients replace spreadsheets, WhatsApp chains, and manual processes with software built specifically for how they work. We're expanding our client base and need someone sharp, organized, and persistent to keep things moving behind the scenes.",
    "As Operations Assistant, you'll manage the space between building and closing. That means scheduling meetings with prospects, following up with existing clients, tracking our entire sales pipeline, chasing payments when they're due, coordinating with our growing network of referral partners, and ensuring absolutely nothing falls through the cracks.",
    "This is not a desk-and-wait role. You will be on calls daily with business owners, managers, and decision-makers. You'll be sending emails, updating our CRM, keeping our pipeline alive, and making sure every lead gets the attention it deserves.",
    "You'll work directly with the founder and have visibility into every part of the business, from how we acquire clients to how we deliver projects. You'll see the full picture, contribute to real decisions, and grow your career inside a company building the future of business operations in Africa.",
    "We're looking for someone who follows up without being reminded. Strong written and verbal communication skills. Comfortable picking up the phone and calling a business owner they've never met. Organized, tracking things properly in systems, not from memory. Google Workspace familiarity expected. Based in Accra.",
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
}];

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
              <span className="flex items-center gap-1 text-sm text-neutral-300"><MapPin className="w-3.5 h-3.5"/>{job.location}</span>
              <button onClick={()=>setShowSalary(!showSalary)} className="flex items-center gap-1.5 text-[#ff7a00] hover:text-[#ff9533] transition-colors cursor-pointer text-sm font-medium">
                <DollarSign className="w-3.5 h-3.5"/>{showSalary?job.salary:'Reveal salary'}{showSalary?<EyeOff className="w-3 h-3"/>:<Eye className="w-3 h-3"/>}
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
            {/* About - visual cards instead of wall of text */}
            <section className="relative">
              <AboutSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#00bfff]"/></span>
                  About This Role
                </h2>
                <div className="space-y-4">
                  {/* Lead paragraph - featured callout */}
                  <div className="rounded-xl bg-gradient-to-br from-[#00bfff]/5 to-transparent border border-[#00bfff]/10 p-6">
                    <p className="text-neutral-200 leading-[1.9] text-[15px]">{job.fullDescription[0]}</p>
                  </div>
                  {/* Remaining paragraphs as alternating styled blocks */}
                  {job.fullDescription.slice(1).map((p,i)=>{
                    const sentences = p.split('. ');
                    const lead = sentences[0] + '.';
                    const rest = sentences.slice(1).join('. ');
                    return(
                      <div key={i} className={`rounded-xl p-5 ${i%2===0?'bg-neutral-900/40 border border-neutral-800/50':'bg-neutral-950/40 border border-neutral-900/50'}`}>
                        <p className="text-neutral-200 leading-[1.9] text-[15px]">
                          <span className="text-white font-medium">{lead}</span>{rest?' '+rest:''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            {/* Requirements */}
            <section className="relative">
              <RequirementsSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#00bfff]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#00bfff]"/></span>
                  What We Need From You
                </h2>
                <ul className="space-y-3 pl-11">
                  {job.requirements.map((r,i)=><li key={i} className="flex items-start gap-3 text-neutral-300 text-[15px] leading-relaxed"><BulletCheck/>{r}</li>)}
                </ul>
              </motion.div>
            </section>

            {/* CTA #2 - mid-page banner */}
            <motion.div initial={{opacity:0,scale:0.97}} whileInView={{opacity:1,scale:1}} viewport={{once:true}}
              className="relative rounded-2xl overflow-hidden p-8 md:p-12 text-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,191,255,0.05),transparent_70%)]"/>
              <h3 className="text-2xl font-bold mb-2 relative z-10">Sound like you?</h3>
              <p className="text-neutral-400 mb-6 relative z-10">We move fast. Apply now and hear back within days.</p>
              <div className="relative z-10"><ApplyBtn jobId={job.id}/></div>
            </motion.div>

            {/* Benefits */}
            <section className="relative">
              <BenefitsSVG/>
              <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#ff7a00]/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-[#ff7a00]"/></span>
                  What You Get
                </h2>
                <ul className="space-y-3 pl-11">
                  {job.benefits.map((b,i)=><li key={i} className="flex items-start gap-3 text-neutral-300 text-[15px] leading-relaxed"><BulletStar/>{b}</li>)}
                </ul>
              </motion.div>
            </section>
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
              {audioBlob&&!audioFile&&<div className="flex items-center gap-2 text-xs text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg px-3 py-2"><Mic className="w-3 h-3"/>Recording ({fmt(recTime)})</div>}
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
