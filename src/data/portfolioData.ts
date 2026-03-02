import type { LucideIcon } from 'lucide-react';
import { Monitor, Database, Film, Users, Server, Terminal, LineChart, Aperture, Key, Book, LayoutTemplate, GraduationCap, PlayCircle } from 'lucide-react';

export interface ProjectData {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    icon: LucideIcon;
    color: string;
    border: string;
    imageUrl: string;
    clientProblem: string;
    solution: string;
    businessImpact: string;
    expertDeepDive: string;
    githubUrl?: string;
}

export const portfolioProjects: ProjectData[] = [
    {
        id: 'mmmedia-pro',
        title: 'MMM Media Manager Pro',
        subtitle: 'Enterprise Media Logistics',
        description: 'A robust desktop application built for professional media organization. Features advanced file indexing, offline metadata management.',
        tags: ['React', 'Electron', 'Vite', 'Tailwind CSS', 'SQLite'],
        icon: Film,
        color: 'from-blue-500/20 to-purple-500/20',
        border: 'group-hover:border-blue-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'High-volume production houses face a critical bottleneck: organizing specific assets within terabytes of raw camera dumps. Cloud solutions are unviable, and native OS search fails.',
        solution: 'Developed a standalone, offline-first desktop application that performs rapid local-drive directory traversal, parsing specialized video metadata natively.',
        businessImpact: 'Drastically reduced asset-retrieval times from hours to seconds, reclaiming 15% of production schedules lost to data wrangling.',
        expertDeepDive: 'Built on Electron leveraging a highly optimized React/Vite renderer capable of 60fps scrolling through 50,000 media nodes. The IPC layer offloads heavy FFMPEG binary executions and thumbnail parsing to background Node worker pools.'
    },
    {
        id: 'darkroom',
        title: 'MMMedia Darkroom',
        subtitle: 'Automated Transcoding Pipeline',
        description: 'Specialized video transcoding and processing pipeline utility leveraging local FFMPEG implementations.',
        tags: ['React', 'Electron', 'FFMPEG', 'TypeScript', 'Node.js'],
        icon: Monitor,
        color: 'from-neutral-700/30 to-neutral-900/50',
        border: 'group-hover:border-neutral-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Marketing agencies receive massive RAW video files that crash standard browsers. Prepping these for varied distribution channels conventionally required expensive software or slow web services.',
        solution: 'Built a dedicated desktop client acting as an offline render farm. Users batch-convert massive payloads locally using native host hardware acceleration.',
        businessImpact: 'Secured the content pipeline by removing cloud dependencies, saving thousands in billed post-production hours.',
        expertDeepDive: 'Abstracts complex CLI arguments into a fluid React interface. The backbone is a rigid integration with static FFMPEG binaries via Node child_process. Zustand manages non-blocking async rendering queues.'
    },
    {
        id: 'reconcile-pro',
        title: 'Reconcile Pro',
        subtitle: 'Financial Data Alignment System',
        description: 'A specialized enterprise system capable of parsing, diffing, and merging complex payroll datasets via fuzzy matching algorithms.',
        tags: ['React', 'Electron', 'Fuse.js', 'Corporate Solutions', 'Algorithms'],
        icon: Database,
        color: 'from-emerald-500/20 to-teal-500/20',
        border: 'group-hover:border-emerald-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'During mergers, reconciling identical employee databases from disparate legacy systems manually is highly error-prone and costly.',
        solution: 'Developed an intelligent reconciliation engine. Utilizing probabilistic matching, it aligns misspelled names and shifted columns, outputting a flawlessly merged spreadsheet.',
        businessImpact: 'Reduced quarterly payroll auditing workloads from multi-week manual endeavors to a largely automated, 15-minute verification process.',
        expertDeepDive: 'Tackles deterministic alignment across unstructured datasets. Utilizes SheetJS for massive blob streams and a highly tuned Fuse.js implementation utilizing Bitap algorithms via Web Workers.'
    },
    {
        id: 'kasl',
        title: 'KASL Procurement Portal',
        subtitle: 'B2B Enterprise Purchasing System',
        description: 'A comprehensive B2B Procurement Web Portal built to streamline supplier lifecycle management.',
        tags: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Corporate Solutions'],
        icon: LayoutTemplate,
        color: 'from-lime-500/20 to-green-600/20',
        border: 'group-hover:border-lime-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
        githubUrl: 'https://github.com/menelekmakonnen/kasl',
        clientProblem: 'Enterprise procurement managers were tracking multi-million dollar vendor relationships across disjointed tools, leading to bottlenecks and compliance risks.',
        solution: 'Delivered the KASL Portal: a unified web dashboard centralizing vendor interactions, contract documents, and dynamic purchase-order status pipelines.',
        businessImpact: 'Brought 100% visibility to chaotic purchasing pipelines, minimizing supply-chain bottlenecks and reducing late-fee penalties.',
        expertDeepDive: 'Engineered on an ultra-modern React + Vite stack pivoting from legacy ERPs. The repository enforces granular component splitting and highly strict ESLint configs. Custom Hooks map heavily to upstream generic REST APIs using strictly typed Axios Interceptors.'
    },
    {
        id: 'shuno-recap',
        title: 'Browser History Recap',
        subtitle: 'Privacy-First Data Visualization',
        description: 'An ultramodern Next.js 16 Web Extension generating "Spotify Wrapped"-style insights from local browser history.',
        tags: ['Next.js 16', 'React 19', 'Browser Extension', 'Privacy'],
        icon: LineChart,
        color: 'from-pink-500/20 to-rose-500/20',
        border: 'group-hover:border-pink-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&q=80&w=1200',
        githubUrl: 'https://github.com/menelekmakonnen/recap',
        clientProblem: 'Users desire "Spotify Wrapped"-style visual recaps of their habits, but browser history is intimately private, making cloud-uploads an unacceptable privacy violation.',
        solution: 'Developed a fundamentally private local-first Next.js Extension that runs complex heuristic algorithms directly on local hardware without server transmission.',
        businessImpact: 'Created a viral, highly engaging product proving rich data-analysis can coexist perfectly with zero-knowledge privacy standards.',
        expertDeepDive: 'A Next.js 16 app functioning within Chrome Manifest V3 limits. Synchronous chronological data parsing is heavily offloaded to isolated Web Workers, ensuring 60fps auto-advancing Story UI using pure GPU-accelerated CSS animations.'
    },
    {
        id: 'connect',
        title: 'ICUNI Connect',
        subtitle: 'Internal Talent Discovery',
        description: 'A comprehensive platform for managing internal and external talent. Features real-time project tracking and directory integration.',
        tags: ['React', 'Vite', 'Corporate Solutions', 'Google Apps Script'],
        icon: Users,
        color: 'from-orange-500/20 to-red-500/20',
        border: 'group-hover:border-orange-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Project managers resorted to mass emails to find specific IT or bilingual talent, leading to expensive external hires while capable internal staff sat idle.',
        solution: 'Deployed a specialized "Internal LinkedIn" mapped to the organization\'s skill taxonomy, facilitating instant talent discovery and internal deployment.',
        businessImpact: 'Dismantled organizational silos, recording a 30% reduction in external contractor overhead within the first two quarters.',
        expertDeepDive: 'Bypassed massive corporate IT provisioning by bundling a React/Vite Single Page Application natively into Google Apps Script, executing flawlessly within client\'s existing security boundaries via native RPCs.'
    },
    {
        id: 'a1-director',
        title: 'D2R / AI Director',
        subtitle: 'Production Scheduling Logistics',
        description: 'Advanced web application utilizing modern full-stack patterns to provide intelligent timeline resource staging.',
        tags: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind'],
        icon: Server,
        color: 'from-indigo-500/20 to-violet-500/20',
        border: 'group-hover:border-indigo-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Coordinating high-end productions means juggling hundreds of moving parts. A single scheduling overlap on a spreadsheet can halt a $100k shoot day.',
        solution: 'Engineered an interactive drag-and-drop animated timeline interface. The active engine continuously runs collision detection, flashing warnings if resources are double-booked.',
        businessImpact: 'Bulletproofed production logistics, minimizing scheduling collisions to zero and lowering AD cognitive load.',
        expertDeepDive: 'Leverages Next.js React Server Components (RSC) for initial payloads while offloading mutation to SWR. The custom timeline executes O(N log N) interval overlap sweeping algorithms in real-time as DOM nodes are dragged.'
    },
    {
        id: 'gravity-os',
        title: 'Gravity - Prompt OS',
        subtitle: 'Enterprise Prompt Architecture',
        description: 'AI-powered prompt management and collaboration platform.',
        tags: ['Next.js 16', 'Electron', 'Local LLM', 'Corporate Solutions'],
        icon: Terminal,
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'group-hover:border-cyan-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Highly refined AI prompts were being lost in Slack threads. Teams lacked a standardized system to version-control or dynamically execute complex AI instructions.',
        solution: 'Created an OS specifically designed for centralized Prompt collaboration. It handles template variables dynamically mapping OS data to local or API-based LLMs.',
        businessImpact: 'Institutionalized structural AI logic, democratizing complex prompt usage and raising baseline engineering quality.',
        expertDeepDive: 'A hybrid Next.js frontend wrapped in Electron, routing directly to local inference endpoints (Ollama) bypassing cloud metrics. Utilizes a custom compiler using regex trees to tokenize strings before mapping them to TypeScript validation schemas.'
    },
    {
        id: 'ultra-manager',
        title: 'Ultra Media Manager',
        subtitle: 'Automated Aesthetic Analysis',
        description: 'Next-generation media manager utilizing local AI models for automated aesthetic scoring.',
        tags: ['Electron', 'React', 'ONNX Runtime', 'Vision Transformers'],
        icon: Aperture,
        color: 'from-yellow-500/20 to-amber-500/20',
        border: 'group-hover:border-yellow-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Photographers spend days manually culling thousands of blurry or poorly lit images from wedding bursts.',
        solution: 'Constructed an AI-powered offline media manager. Deep learning algorithms scan image tensors locally, scoring logic and grouping similarity clusters dynamically.',
        businessImpact: 'Eliminated the manual "first pass" culling phase, drastically altering standard turnaround delivery times for creatives.',
        expertDeepDive: 'Bundles ONNX and Vision Transformers inside Node. Heavy engineering was dedicated to preventing memory leaks via custom downsampling pipelines of 40-megapixel RAW buffers before processing them through the ML Model tensor.'
    },
    {
        id: 'loremaker-pro',
        title: 'Loremaker Pro',
        subtitle: 'Narrative Continuity Engine',
        description: 'Advanced lore organization software. Provides a structured database and relationship mapping tool for writers.',
        tags: ['React', 'Node.js', 'Graph Logic', 'HTML'],
        icon: Book,
        color: 'from-fuchsia-500/20 to-pink-600/20',
        border: 'group-hover:border-fuchsia-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&q=80&w=1200',
        githubUrl: 'https://github.com/menelekmakonnen/LoremakerPro',
        clientProblem: 'Authors of massive game worlds frequently misappropriate narrative logic, introducing canonical continuity errors.',
        solution: 'An interactive entity-relational graph editor. Users map characters, locations, and events, tracing structural dependencies across massive narrative arcs.',
        businessImpact: 'Provided narrative teams with a bulletproof structural Source of Truth, smoothing the editing pipeline significantly.',
        expertDeepDive: 'Abstracts creative writing into Graph-Entity serialization. The frontend traverses complex JSON trees dynamically rendering cascading dependency visuals. Employs sophisticated local state hydration to bypass API latency during heavy entity writing.'
    },
    {
        id: 'scholarships',
        title: 'ICUNI Scholarships',
        subtitle: 'Funding Discovery Portal',
        description: 'A dedicated web application backing the scholarships subdomain of icuni.org.',
        tags: ['React', 'Static Generation', 'Accessibility', 'HTML'],
        icon: GraduationCap,
        color: 'from-sky-500/20 to-blue-500/20',
        border: 'group-hover:border-sky-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200',
        githubUrl: 'https://github.com/menelekmakonnen/scholarships',
        clientProblem: 'The ICUNI philanthropic sector was losing student applicants due to obtuse, slow-loading discovery pages buried in subdomains.',
        solution: 'Overhauled the digital entry point creating a blazing-fast SPA classifying grants explicitly by categorized student-need structures.',
        businessImpact: 'Spurred a massive surge in qualified application throughput by aggressively lowering the discovery phase friction.',
        expertDeepDive: 'Deployed via strict Next.js Static Site Generation (SSG) for instantaneous TTFB. The UI enforces rigorous ADA compliance and deep ARIA tagging ensuring complete accessibility.'
    },
    {
        id: 'film-icuni',
        title: 'ICUNI Film Database',
        subtitle: 'Cinematic Collaboration Network',
        description: 'A cinematic directory of actors and filmmakers designed for building project line-ups and casting.',
        tags: ['React', 'Next.js 16', 'Corporate Solutions', 'HTML'],
        icon: PlayCircle,
        color: 'from-red-500/20 to-orange-600/20',
        border: 'group-hover:border-red-500/50',
        imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200',
        githubUrl: 'https://github.com/menelekmakonnen/film-icuni-org',
        clientProblem: 'Student and independent filmmakers lack a centralized hub to locate, view reels for, and cast local actors or technical crew for zero-budget or micro-budget productions efficiently.',
        solution: 'Deployed the ICUNI Film Database, featuring rich talent profiles, project pitching templates, a visual casting architecture, and interactive A/B "Voting Game" analytics for short films.',
        businessImpact: 'Facilitated over 187 immediate project requests upon launch, dramatically streamlining independent collaborative efforts within the creative network.',
        expertDeepDive: 'A robust Next.js application leveraging SSR rendering to ensure strong SEO on talent profiles. Implements sophisticated relational data modeling mapping Talent to Project Roles via join tables, updating UI interaction states (like "Requests Sent") instantaneously via optimistic updates.'
    },
    {
        id: 'keystore',
        title: 'KeyStore Architecture',
        subtitle: 'Secure API Middleware',
        description: 'A foundational backend service test architecture emphasizing secure request handling.',
        tags: ['Node.js', 'Axios', 'Backend Pattern', 'Middleware'],
        icon: Key,
        color: 'from-neutral-400/20 to-neutral-600/20',
        border: 'group-hover:border-neutral-400/50',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=1200',
        clientProblem: 'Applications heavily dependent on unauthenticated internal microservices risk catastrophic vulnerabilities like exposed keys and spoofed headers.',
        solution: 'Drafted KeyStore as a fortified Reverse Proxy layer. All database ingestion passes through this middleware where payloads are validated against cryptographic parameters.',
        businessImpact: 'Standardized security across future service deployments, inherently repelling standard injection exploits.',
        expertDeepDive: 'Focuses entirely on hardened server logic devoid of UI. Demonstrates advanced Axios interception logic verifying encrypted data transfer objects (DTO). Strips internal downstream errors automatically before throwing standard proxy responses.'
    }
];
