import type { LucideIcon } from 'lucide-react';
import { Monitor, Database, Film, Users, Server, Terminal, LineChart, Aperture, Key, Book, LayoutTemplate, GraduationCap } from 'lucide-react';

export interface ProjectData {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    icon: LucideIcon;
    color: string;
    border: string;
    laymanSummary: string;
    expertDeepDive: string;
    githubUrl?: string;
}

export const portfolioProjects: ProjectData[] = [
    {
        id: 'mmmedia-pro',
        title: 'MMM Media Manager Pro',
        subtitle: 'Professional Media Management',
        description: 'A robust desktop application built for professional media organization. Features advanced file indexing, offline metadata management, and a high-performance UI handling thousands of media files seamlessly.',
        tags: ['React', 'Electron', 'Vite', 'Tailwind CSS'],
        icon: Film,
        color: 'from-blue-500/20 to-purple-500/20',
        border: 'group-hover:border-blue-500/50',
        laymanSummary: 'MMM Media Manager Pro is like a supercharged file explorer built specifically for video editors and media professionals. Imagine having thousands of gigabytes of raw video footage spread across multiple hard drives; it becomes almost impossible to find that *one specific clip*. MMM Media Pro scans all your drives rapidly, extracts hidden tags and camera metadata without needing the internet, and presents your entire library in a lightning-fast, searchable interface. It completely ends the headache of lost files.',
        expertDeepDive: 'MMM Media Manager Pro solves the classic bottleneck of localized media indexing and offline metadata retrieval. Built as an Electron application leveraging a React and Vite frontend, it emphasizes high-performance virtualized DOM rendering to smoothly scroll through thousands of media entries without memory leakage. Rather than relying on cloud-based indexing, the system implements a robust local SQLite/IndexedDB architecture coupled with native Node.js process spanning, allowing for rapid directory traversal and asynchronous metadata extraction via underlying binary tools like EXIFTool. The aesthetic utilizes heavily customized Tailwind utilities with a distinct "Dark mode" design system.'
    },
    {
        id: 'darkroom',
        title: 'MMMedia Darkroom',
        subtitle: 'Desktop Media Processing',
        description: 'Specialized video transcoding and processing pipeline utility. Leverages local FFMPEG implementations to provide lightning-fast, secure offline media conversions and proxies.',
        tags: ['React', 'Electron', 'FFMPEG', 'TypeScript'],
        icon: Monitor,
        color: 'from-neutral-700/30 to-neutral-900/50',
        border: 'group-hover:border-neutral-500/50',
        laymanSummary: 'Video files from modern cameras are often massive and incredibly difficult for computers to play smoothly. MMMedia Darkroom is a specialized "rendering factory." You drop your massive, clunky video files into it, and it precisely compresses and converts them into smaller, easily editable "proxy" versions. The best part? It happens entirely offline and entirely on your machine, ensuring complete privacy and maximum speed without needing an internet connection.',
        expertDeepDive: 'MMMedia Darkroom acts as a powerful React GUI wrapper around complex FFMPEG CLI binaries executing natively via Electron\'s Node integration. It abstracts away complex codec flags, pixel formats, and multi-pass encoding parameters into an intuitive interface. The architectural challenge was ensuring the UI thread remains unblocked while the heavy child processes (FFMPEG) compute. It utilizes IPC (Inter-Process Communication) and Zustand for sophisticated state management, allowing real-time progress monitoring, batch queuing, and localized error reporting via a custom logger stream interface.'
    },
    {
        id: 'reconcile-pro',
        title: 'Reconcile Pro',
        subtitle: 'Payroll Data Reconciliation',
        description: 'A specialized enterprise system capable of parsing, diffing, and merging complex payroll datasets. Employs advanced fuzzy matching algorithms to output truth-merged payroll files in minutes.',
        tags: ['React', 'Electron', 'Fuse.js', 'SheetJS'],
        icon: Database,
        color: 'from-emerald-500/20 to-teal-500/20',
        border: 'group-hover:border-emerald-500/50',
        laymanSummary: 'When large companies merge or audit their employee payrolls, they often have two massive spreadsheets that don\'t perfectly align (names are misspelled, IDs change). Finding the discrepancies manually takes days. Reconcile Pro is an incredibly smart tool that imports these spreadsheets, acts like a digital detective to find matching employees even if their names are spelled slightly differently, and automatically generates a perfect, unified report highlighting exactly where the money differences lie.',
        expertDeepDive: 'Reconcile Pro tackles the problem of deterministic data alignment across disparate, unsanitized CSV/XLSX data sources. It utilizes `SheetJS` to parse complex Excel structures into structured JSON memory maps. To overcome human-error in data entry, it integrates `Fuse.js` to perform probabilistic fuzzy-string matching on key identifiers (like names), applying a configurable distance and threshold tolerance. The Electron backend runs memory-intensive diffing algorithms on workers, while the React UI relies on virtualized grid components to render large datasets smoothly.'
    },
    {
        id: 'connect',
        title: 'ICUNI Connect',
        subtitle: 'Talent Directory & Project Management',
        description: 'A comprehensive platform for managing internal and external talent. Features real-time project tracking, skill matrices, and seamless directory integration.',
        tags: ['React', 'Vite', 'Tailwind', 'Google Apps Script'],
        icon: Users,
        color: 'from-orange-500/20 to-red-500/20',
        border: 'group-hover:border-orange-500/50',
        laymanSummary: 'Think of ICUNI Connect as a private, highly-organized LinkedIn mixed with project management software. It allows an organization to easily see exactly who has what skills, their current availability, and assign them directly to specific internal projects. It ensures that the right talent is always working on the right task, drastically reducing the friction of finding help within a large team.',
        expertDeepDive: 'ICUNI Connect bridges the gap between modern frontend practices (React, Tailwind, Framer Motion) and enterprise legacy environments by utilizing Google Apps Script (GAS) as a serverless backend. The Vite build process was meticulously configured using plugins to output a "Single File" bundle (inlining all CSS and JS into a single HTML file), which allows it to be perfectly served natively within an iframe via the Google Workspace ecosystem. This architectural choice bypassed complex cloud hosting restrictions while providing a fluid SPA experience.'
    },
    {
        id: 'a1-director',
        title: 'D2R / AI Director',
        subtitle: 'Scheduling & Planning AI Web App',
        description: 'Advanced web application utilizing modern full-stack patterns to provide intelligent resource scheduling, AI-driven planning scenarios, and timeline visualization.',
        tags: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind'],
        icon: Server,
        color: 'from-indigo-500/20 to-violet-500/20',
        border: 'group-hover:border-indigo-500/50',
        laymanSummary: 'Planning massive, week-long events or production schedules is a nightmare of logistics. D2R / AI Director is a web platform that takes the heavy lifting out of scheduling. It visualizes time like a beautifully animated calendar and utilizes intelligent algorithms to ensure that resources (like cameras, crew, and stages) are never double-booked or sitting idle. It’s like having an AI producer managing your physical assets.',
        expertDeepDive: 'D2R (Director to Reality) is built upon the cutting-edge Next.js 16 App Router architecture and React 19. It heavily relies on Server Components for rapid initial layout rendering and client-side data fetching (`SWR`/`React Query` paradigms) for real-time schedule mutability. The core challenge involved building highly responsive drag-and-drop timeline visualizations that remain performant when executing complex collision-detection algorithms over large temporal datasets. The UI layers are styled with a bespoke Tailwind utility design system ensuring aesthetic precision.'
    },
    {
        id: 'gravity-os',
        title: 'Gravity - Prompt OS',
        subtitle: 'Prompts & Collaboration Platform',
        description: 'AI-powered prompt management and collaboration platform. Part of the elite Em Dash Suite, featuring robust electron-based desktop integration and seamless state management.',
        tags: ['Next.js 16', 'Electron', 'Tailwind', 'Framer Motion'],
        icon: Terminal,
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'group-hover:border-cyan-500/50',
        laymanSummary: 'As AI becomes more integrated into our lives, knowing *how* to talk to it (the "prompt") becomes highly valuable. Gravity acts as an operating system specifically for these prompts. It allows you to organize, test, and share your most effective AI interactions seamlessly across your desktop environment, ensuring you never lose a magical AI conversation formula again.',
        expertDeepDive: 'Gravity - Prompt OS serves as the nexus of prompt engineering iteration. It is an ambitious hybrid application intertwining a Next.js (React) front-end deployed inside an Electron desktop shell. This fusion allows Gravity to utilize the beautiful Radix UI component library and complex state persistence while simultaneously tapping into native operating system file systems and local LLM execution capabilities via Node integrations. It uses strict TypeScript interfaces for mapping prompt variables to contextual environment data injected during execution.'
    },
    {
        id: 'shuno-recap',
        title: 'Browser History Recap (Shuno)',
        subtitle: 'Data Visualization Engine',
        description: 'A sophisticated tool for parsing and visualizing browser history data using D3 and sql.js, creating beautiful network charts and word clouds locally.',
        tags: ['React', 'D3.js', 'Sql.js', 'Vite'],
        icon: LineChart,
        color: 'from-pink-500/20 to-rose-500/20',
        border: 'group-hover:border-pink-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/recap',
        laymanSummary: 'At the end of the year, music apps show you a "Wrapped" recap of your listening history. "Shuno" does exactly this, but for your web browsing. It securely looks at the raw data of the thousands of sites you visited and algorithmically paints a picture of your interests—generating stunning visual word clouds and network graphs to summarize the story of your digital life over the past year. Crucially, all this analysis happens entirely on your own computer, so your data never leaves your device.',
        expertDeepDive: 'Shuno is an exercise in client-side big data processing and declarative data-visualization. To maintain absolute user privacy, Shuno utilizes `sql.js` (SQLite compiled to WebAssembly) to directly query browser history databases (`Places.sqlite` in Firefox/Chrome) securely inside the browser environment. Once the raw query yields the result set, it aggregates domain frequencies and categorical data using strict functional algorithms before passing the state payloads down to complex `d3.js` and `Recharts` SVG charting functions, ensuring 60fps animations despite heavy DOM node mapping.'
    },
    {
        id: 'ultra-manager',
        title: 'Ultra Media Manager (Anager)',
        subtitle: 'AI-Powered Media Analysis',
        description: 'Next-generation media manager utilizing local AI models via ONNX Runtime and Transformers for automated aesthetic scoring, tagging, and advanced metadata extraction.',
        tags: ['Electron', 'React', 'ONNX', 'Transformers'],
        icon: Aperture,
        color: 'from-yellow-500/20 to-amber-500/20',
        border: 'group-hover:border-yellow-500/50',
        laymanSummary: 'While traditional media managers just organize files, Ultra Media Manager acts as a robotic photo editor. It runs highly sophisticated AI models directly on your hardware to actually "look" at the photos and videos in your library. It can automatically tag images based on what’s visually in them, score them for aesthetic quality, and group similar-looking photos together—saving days of manual keyword entry and culling.',
        expertDeepDive: 'Code-named "Anager", this project represents a significant shift from simple metadata parsers to deep-learning-infused architecture. It bundles `@xenova/transformers` and `onnxruntime-node` inside an Electron shell to execute Vision Transformer (ViT) and ResNet architectures entirely offline. To prevent UI lockup while tensors compute, Anager offloads inference to Node.js backend pipelines, streaming inferences back to the Vite-React layer. It relies entirely on native memory allocation for matrix operations to ensure real-time photo-tagging capabilities without GPU burnout.'
    },
    {
        id: 'keystore',
        title: 'KeyStore Architecture',
        subtitle: 'Core Backend Service Test',
        description: 'A foundational backend service test architecture emphasizing secure request handling and streamlined data delivery using robust modern backend patterns.',
        tags: ['Node.js', 'Axios', 'Backend Pattern'],
        icon: Key,
        color: 'from-neutral-400/20 to-neutral-600/20',
        border: 'group-hover:border-neutral-400/50',
        laymanSummary: 'If an app is a shiny car, the "backend" is the engine. KeyStore was an architectural stress-test to build a bulletproof, highly scalable engine. It isn’t meant to look pretty; it’s meant to test secure key validation, ensuring that when an application talks to a server, the request is handled rapidly and the data cannot be intercepted or spoofed.',
        expertDeepDive: 'KeyStore serves as a rigid sandbox for exploring generic service architecture and interceptor paradigms using `Axios` and `node-fetch`. The focus here was entirely separated from the DOM, concentrating heavily on robust CommonJS implementations for proxy and redirect handling, mimicking secure upstream data relays. It enforces strict environmental scoping and serves as the architectural skeleton for larger authentication modules used across production apps.'
    },
    {
        id: 'loremaker-pro',
        title: 'Loremaker Pro',
        subtitle: 'World-building Management System',
        description: 'Advanced lore organization software. Provides a structured database and relationship mapping tool for writers to ensure deep continuity across massive fictional universes.',
        tags: ['React', 'Node.js', 'GraphDB', 'GitHub'],
        icon: Book,
        color: 'from-fuchsia-500/20 to-pink-600/20',
        border: 'group-hover:border-fuchsia-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/LoremakerPro',
        laymanSummary: 'Writing a massive fantasy novel or designing a sprawling video game universe means keeping track of hundreds of characters, locations, and magical rules. Loremaker Pro is an interactive encyclopedia built exclusively for authors. It prevents "plot holes" by allowing writers to map exactly how characters relate to each other and track how events cascade through their timeline, turning messy sticky notes into a beautifully organized universe.',
        expertDeepDive: 'Loremaker Pro abstracts the complexities of narrative continuity into a distinct entity-relationship modeling problem. The platform architecture treats characters, events, and locations as standalone nodes in a localized Graph structure. By serializing relationships in a bidirectional format, the UI can rapidly compute and dynamically render complex lineage trees or dependency graphs. The interface leverages React to provide real-time updates to the active story schema without needing constant data-rehydration from a backend layer.'
    },
    {
        id: 'kasl',
        title: 'KASL Platform',
        subtitle: 'Interactive Web System Framework',
        description: 'A foundation framework emphasizing rapid component deployment using React, Vite, and strict TypeScript compilation layers.',
        tags: ['React', 'TypeScript', 'Vite', 'GitHub'],
        icon: LayoutTemplate,
        color: 'from-lime-500/20 to-green-600/20',
        border: 'group-hover:border-lime-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/kasl',
        laymanSummary: 'KASL is a specialized software foundation. Instead of an engineer spending a week setting up the plumbing for a new web project, the KASL repository comes pre-wired with modern, lightning-fast tools. It is heavily standardized so that teams can jump straight into building features rather than fighting with the setup process.',
        expertDeepDive: 'KASL acts as a hyper-opinionated Vite + React + TypeScript boilerplate designed specifically for maintaining consistency across ICUNI Labs. It centralizes strict ESLint thresholds, `tsconfig` paths, and module aliasing. By pre-packaging the HMR (Hot Module Replacement) pipeline and integrating bespoke Tailwind configurations, it standardizes the continuous deployment pipelines required for smaller standalone systems.'
    },
    {
        id: 'scholarships',
        title: 'ICUNI Scholarships',
        subtitle: 'Educational Opportunities Portal',
        description: 'A dedicated web application backing the scholarships subdomain of icuni.org. Designed to rapidly match applicants with specialized educational funding options.',
        tags: ['React', 'Web System', 'Static Generation', 'GitHub'],
        icon: GraduationCap,
        color: 'from-sky-500/20 to-blue-500/20',
        border: 'group-hover:border-sky-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/scholarships',
        laymanSummary: 'Navigating educational funding can be overwhelmingly complex. The ICUNI Scholarships platform strips away the noise. It serves as a sleek, lightning-fast portal that instantly helps students discover specific resources and grants available within the ICUNI.org ecosystem, guiding them gracefully from discovery to application.',
        expertDeepDive: 'The Scholarships repository handles the bespoke UI components responsible for the ICUNI organization\'s philanthropic wings. To guarantee high SEO performance and instantaneous time-to-interactive (TTI) for users on poor connections, the architecture likely relies on static HTML generation and rigorous asset compression. The project emphasizes accessibility (a11y) standards, ensuring screen readers can perfectly parse the complex tabular data of criteria and funding deadlines.'
    }
];
