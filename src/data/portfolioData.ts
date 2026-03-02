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
        imageUrl: '/images/covers/mmmedia-pro.png',
        clientProblem: 'High-volume production houses face a critical bottleneck: organizing specific assets within terabytes of raw camera dumps. Cloud solutions are unviable, and native OS search fails.',
        solution: 'Developed a standalone, offline-first desktop application that performs rapid local-drive directory traversal, parsing specialized video metadata natively.',
        businessImpact: 'Drastically reduced asset-retrieval times from hours to seconds, reclaiming 15% of production schedules lost to data wrangling.',
        expertDeepDive: 'Built on an Electron architecture leveraging a heavily optimized React and Vite renderer. The frontend must reliably handle virtualized DOM lists of over 50,000 media nodes while maintaining a strict 60FPS scrolling experience without garbage-collection stutter. To prevent the main UI thread from blocking, we architected an aggressive IPC (Inter-Process Communication) layer. Heavy File I/O operations, complex regex pattern matching for metadata tagging, and FFMPEG binary executions for thumbnail/proxy generation are offloaded entirely to background Node.js worker pools. We integrated SQLite natively with PRAGMA optimizations for lightning-fast local indexing, utilizing a multi-layered local caching strategy to persist metadata even when network drives detach.'
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
        imageUrl: '/images/covers/darkroom.png',
        clientProblem: 'Marketing agencies receive massive RAW video files that crash standard browsers. Prepping these for varied distribution channels conventionally required expensive software or slow web services.',
        solution: 'Built a dedicated desktop client acting as an offline render farm. Users batch-convert massive payloads locally using native host hardware acceleration.',
        businessImpact: 'Secured the content pipeline by removing cloud dependencies, saving thousands in billed post-production hours.',
        expertDeepDive: 'Darkroom functions by abstracting complex, unreadable CLI arguments into a fluid, user-friendly React interface. The backbone of the application is a rigid, deeply-coupled integration with static FFMPEG binaries compiled for specific OS architectures and distributed alongside the Electron executable. Through Node\'s "child_process", it pipes standard error and standard out streams directly into the React context, calculating bit-rate progression and rendering visually stunning timeline progress bars. Zustand is utilized to manage non-blocking async rendering queues globally, allowing users to queue dozens of terabytes of rendering payloads unattended while retaining full application responsiveness. Crucially, it interfaces with native OS power states to prevent system sleep during heavy rendering tasks.'
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
        imageUrl: '/images/covers/reconcile-pro.png',
        clientProblem: 'During mergers, reconciling identical employee databases from disparate legacy systems manually is highly error-prone and costly.',
        solution: 'Developed an intelligent reconciliation engine. Utilizing probabilistic matching, it aligns misspelled names and shifted columns, outputting a flawlessly merged spreadsheet.',
        businessImpact: 'Reduced quarterly payroll auditing workloads from multi-week manual endeavors to a largely automated, 15-minute verification process.',
        expertDeepDive: 'This system tackles deterministic alignment across wildly unstructured, multi-million cell datasets. We utilized the SheetJS library to handle binary blob streaming because standard JSON parsing of this magnitude would single-handedly crash V8 heap limits. The core reconciliation engine depends heavily on a deeply tuned custom Fuse.js implementation. We employ modified Bitap algorithms and Levenshtein distance scoring distributed across multiple Web Workers to aggressively map strings (e.g., misspellings of employee names or addresses) without blocking the UI. A proprietary heuristic weighting system was built to prioritize specific primary keys. The result is an Electron application that visually maps thousands of probabilistic matches on-screen simultaneously via canvas rendering, allowing financial auditors to approve algorithmic guesses in real-time.'
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
        imageUrl: '/images/covers/kasl.png',
        githubUrl: 'https://github.com/menelekmakonnen/kasl',
        clientProblem: 'Enterprise procurement managers were tracking multi-million dollar vendor relationships across disjointed tools, leading to bottlenecks and compliance risks.',
        solution: 'Delivered the KASL Portal: a unified web dashboard centralizing vendor interactions, contract documents, and dynamic purchase-order status pipelines.',
        businessImpact: 'Brought 100% visibility to chaotic purchasing pipelines, minimizing supply-chain bottlenecks and reducing late-fee penalties.',
        expertDeepDive: 'Engineered on an ultra-modern React + Vite stack pivoting away from legacy, slow, heavily-coupled ERP ecosystems. The codebase architecture enforces extremely granular component extraction to ensure testing coverage and maintainability at scale. We utilized strict, custom ESLint configurations to prevent "any" type bleed across the massive data ingestion boundaries. Global state is minimally managed, instead pivoting toward heavily typed custom React Hooks that interface directly with upstream generic REST APIs using strictly typed Axios Interceptors. Request duplication, JWT token refresh handshakes, and sophisticated cache invalidation rules are all handled invisibly below the component lifecycle, ensuring that the heavy procurement forms dynamically update with zero layout shift during complex vendor negotiations.'
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
        imageUrl: '/images/covers/shuno-recap.png',
        githubUrl: 'https://github.com/menelekmakonnen/recap',
        clientProblem: 'Users desire "Spotify Wrapped"-style visual recaps of their habits, but browser history is intimately private, making cloud-uploads an unacceptable privacy violation.',
        solution: 'Developed a fundamentally private local-first Next.js Extension that runs complex heuristic algorithms directly on local hardware without server transmission.',
        businessImpact: 'Created a viral, highly engaging product proving rich data-analysis can coexist perfectly with zero-knowledge privacy standards.',
        expertDeepDive: 'A masterclass in pushing the Next.js 16 App Router into the highly constrained Chrome Manifest V3 extension environments. Because extension environments ruthlessly throttle execution bounds, heavy chronological data parsing (grouping millions of history iterations by domain, time-of-day, and active dwell time) is deeply offloaded to isolated Web Workers using standard message passing. We completely abandoned React state-driven animations for the core visualizer; instead, we mapped the "Story" UI framework to pure GPU-accelerated CSS animations triggered by intersection observers to guarantee an unwavering 60fps cinematic playback on all devices. All machine-learning classification and categorization maps execute in memory relying entirely on the local device, guaranteeing zero network payloads.'
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
        imageUrl: '/images/covers/connect.png',
        clientProblem: 'Project managers resorted to mass emails to find specific IT or bilingual talent, leading to expensive external hires while capable internal staff sat idle.',
        solution: 'Deployed a specialized "Internal LinkedIn" mapped to the organization\'s skill taxonomy, facilitating instant talent discovery and internal deployment.',
        businessImpact: 'Dismantled organizational silos, recording a 30% reduction in external contractor overhead within the first two quarters.',
        expertDeepDive: 'This project required an exotic deployment strategy: bypassing massive corporate IT provisioning pipelines by bundling a complete React/Vite Single Page Application natively into Google Apps Script (GAS) HTML endpoints. We developed a proprietary custom bundler pipeline using Rollup that actively inlines all CSS and JS chunks into a monolithic HTML document, circumventing Google\'s strict sandbox restrictions. The frontend communicates via native GAS RPC execution handles (`google.script.run`), utilizing Google Sheets as a pseudo-relational database. To mitigate massive latency spikes common with GAS execution, we implemented an optimistic UI architecture utilizing robust IndexedDB local-first synching methodologies, making network saves entirely non-blocking to the user.'
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
        imageUrl: '/images/covers/a1-director.png',
        clientProblem: 'Coordinating high-end productions means juggling hundreds of moving parts. A single scheduling overlap on a spreadsheet can halt a $100k shoot day.',
        solution: 'Engineered an interactive drag-and-drop animated timeline interface. The active engine continuously runs collision detection, flashing warnings if resources are double-booked.',
        businessImpact: 'Bulletproofed production logistics, minimizing scheduling collisions to zero and lowering AD cognitive load.',
        expertDeepDive: 'A massively interactive DOM masterpiece that aggressively utilizes Next.js React Server Components (RSC) to construct the initial heavy scheduling data payloads on the edge, before hydrating exclusively the interactive mutation zones with Client Components. The actual timeline schedule implements highly memory-bound O(N log N) interval overlap sweeping algorithms natively in the browser. As the user physically drags DOM nodes across the screen using Framer Motion\'s pointer tracking, the interval sweep recalculates dependencies simultaneously up to 60 times a second. We engineered custom delta-time serializers to ensure the drag mechanics translate perfectly back into UTC ISO strings without drift.'
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
        imageUrl: '/images/covers/gravity-os.png',
        clientProblem: 'Highly refined AI prompts were being lost in Slack threads. Teams lacked a standardized system to version-control or dynamically execute complex AI instructions.',
        solution: 'Created an OS specifically designed for centralized Prompt collaboration. It handles template variables dynamically mapping OS data to local or API-based LLMs.',
        businessImpact: 'Institutionalized structural AI logic, democratizing complex prompt usage and raising baseline engineering quality.',
        expertDeepDive: 'Operating as a profound hybrid application mixing a Next.js frontend wrapped transparently inside a native Electron chromium shell. Gravity allows massive corporations to route data processing strictly through native hardware inference endpoints (like Local Ollama integrations), fundamentally bypassing public cloud metrics for classified data. The core innovation is a proprietary custom AST compiler parsing double-bracket {{variables}} in real-time within the text editor. These string maps generate abstract syntax trees, validate dynamically against Zod TypeScript schemas, and interpolate injected system state (like the current highlighted code in an IDE) into the finalized LLM payload execution pipeline.'
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
        imageUrl: '/images/covers/ultra-manager.png',
        clientProblem: 'Photographers spend days manually culling thousands of blurry or poorly lit images from wedding bursts.',
        solution: 'Constructed an AI-powered offline media manager. Deep learning algorithms scan image tensors locally, scoring logic and grouping similarity clusters dynamically.',
        businessImpact: 'Eliminated the manual "first pass" culling phase, drastically altering standard turnaround delivery times for creatives.',
        expertDeepDive: 'This is not an API wrapper; Ultra bundles ONNX execution runtimes and quantized Vision Transformers natively inside Edge Node modules. Extreme engineering precision was required to construct custom C++ bindings that downsample 40-megapixel RAW Sony proprietary buffers into viable 224x224 RGB tensors before passing them to the machine-learning pipeline. The architecture successfully isolates these heavy array mutation tasks away from V8\'s main thread, avoiding catastrophic garbage collection pauses. It implements custom K-Means clustering algorithms to mathematically map the multi-dimensional tensor arrays, actively grouping semantically similar photos together in the frontend UI automatically.'
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
        imageUrl: '/images/covers/loremaker-pro.png',
        githubUrl: 'https://github.com/menelekmakonnen/LoremakerPro',
        clientProblem: 'Authors of massive game worlds frequently misappropriate narrative logic, introducing canonical continuity errors.',
        solution: 'An interactive entity-relational graph editor. Users map characters, locations, and events, tracing structural dependencies across massive narrative arcs.',
        businessImpact: 'Provided narrative teams with a bulletproof structural Source of Truth, smoothing the editing pipeline significantly.',
        expertDeepDive: 'Loremaker fundamentally transforms the nebulous process of creative writing into strict Graph-Entity serialization mathematically. The frontend operates on an intricate nested JSON structure; when authors generate a tag, the graph dynamically maps and traverses the data tree, pushing visual representation into cascading dependency nodes. Bypassing heavy iterative API updates during creative writing sprints, the client implements sophisticated local-state continuous hydration mechanisms. Changes are retained locally and sequentially queued to sync upward, ensuring the authoring interface never locks or registers latency.'
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
        imageUrl: '/images/covers/scholarships.png',
        githubUrl: 'https://github.com/menelekmakonnen/scholarships',
        clientProblem: 'The ICUNI philanthropic sector was losing student applicants due to obtuse, slow-loading discovery pages buried in subdomains.',
        solution: 'Overhauled the digital entry point creating a blazing-fast SPA classifying grants explicitly by categorized student-need structures.',
        businessImpact: 'Spurred a massive surge in qualified application throughput by aggressively lowering the discovery phase friction.',
        expertDeepDive: 'This project is fundamentally engineered to weaponize performance as a user-retention feature. Deployed via a rigid Next.js Static Site Generation (SSG) topology, the application builds flat HTML that parses into the browser with near-zero Time to First Byte (TTFB). The client runtime subsequently hydrates as an ultra-lean React application specifically to enable instantaneous, un-rendered layout transitions between scholarship categories. The UI framework inherently enforces strict ADA compliance at the compiler level, dropping custom linting rules to ensure semantic HTML constraints, deep ARIA labeling, and unbroken keyboard navigation focus rings.'
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
        imageUrl: '/images/covers/film-icuni.png',
        githubUrl: 'https://github.com/menelekmakonnen/film-icuni-org',
        clientProblem: 'Student and independent filmmakers lack a centralized hub to locate, view reels for, and cast local actors or technical crew for zero-budget or micro-budget productions efficiently.',
        solution: 'Deployed the ICUNI Film Database, featuring rich talent profiles, project pitching templates, a visual casting architecture, and interactive A/B "Voting Game" analytics for short films.',
        businessImpact: 'Facilitated over 187 immediate project requests upon launch, dramatically streamlining independent collaborative efforts within the creative network.',
        expertDeepDive: 'Operates as a robust Server-Side Rendered (SSR) Next.js monolith structured around deeply interlinked database paradigms. Instead of massive denormalized document stores, this application uses highly structured Join Tables mapping specific granular "Talent ID" tokens exclusively to "Project Roles". The Next.js API layer is heavily utilized to safely mutate form states originating from complex nested modals, triggering deep automated email systems directly to users instantly on role assignment. We leverage SWR patterns heavily in the custom hook layer to generate perceived instantaneous "Requests Sent" network clicks, hiding slow SMTP backend interactions through aggressive optimistic UI swapping.'
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
        imageUrl: '/images/covers/keystore.png',
        clientProblem: 'Applications heavily dependent on unauthenticated internal microservices risk catastrophic vulnerabilities like exposed keys and spoofed headers.',
        solution: 'Drafted KeyStore as a fortified Reverse Proxy layer. All database ingestion passes through this middleware where payloads are validated against cryptographic parameters.',
        businessImpact: 'Standardized security across future service deployments, inherently repelling standard injection exploits.',
        expertDeepDive: 'A pure, headless backend-logic marvel completely stripped of frontend distraction. KeyStore explicitly demonstrates severe data sanitization prior to routing downstream to internal Node clusters. The codebase leans heavily on advanced Axios interception architecture, catching requests globally at the edge to verify complex RSA encrypted Data Transfer Object (DTO) signatures. It explicitly acts as a firewall, mapping stack traces of erroneous external traffic and forcibly stripping internal stack-dumps before translating them to generic 400x proxy responses—ensuring the external network topology remains invisible to malicious scrapers.'
    }
];
