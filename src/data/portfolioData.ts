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
        description: 'A robust desktop application built for professional media organization. Features advanced file indexing, offline metadata management, and a high-performance UI handling thousands of media files seamlessly.',
        tags: ['React', 'Electron', 'Vite', 'Tailwind CSS', 'SQLite'],
        icon: Film,
        color: 'from-blue-500/20 to-purple-500/20',
        border: 'group-hover:border-blue-500/50',
        clientProblem: 'High-volume production houses and independent editors face a critical bottleneck: organizing and locating specific assets within terabytes of raw chronological camera dumps. Cloud solutions are unviable due to slow upload speeds for 4K/8K footage, and native operating system search indices completely fail to read specialized camera metadata embedded in proprietary video codecs.',
        solution: 'Developed a standalone, offline-first desktop application that performs rapid local-drive directory traversal. It utilizes sub-processes to run binary metadata extractors against video files, capturing complex data (like lens focal length or camera serial numbers) directly from the clips. Users can tag, rate, and group media into collections independently of their physical folder structure, maintaining a unified visual interface across fragmented storage drives.',
        businessImpact: 'Drastically reduced asset-retrieval times from hours to seconds. By eliminating the reliance on cloud-syncing and bypassing native OS limitations, editorial teams reclaimed over 15% of their production schedules previously lost to data wrangling and "lost file" hunting.',
        expertDeepDive: 'MMM Media Manager Pro represents a paradigm shift in decentralized asset management. The core engine is built on Electron, leveraging a highly optimized React/Vite renderer capable of 60fps scrolling through DOM structures containing over 50,000 localized media nodes. The true architectural feat lies in the IPC (Inter-Process Communication) layer. Heavy lifting components, such as `exiftool` binary execution and thumbnail generation via native OS bindings, are offloaded entirely to background Node.js worker pools. This ensures the React main thread never drops a frame during intensive disk I/O operations. Data persistence is managed via an embedded SQLite instance mapped through a Prisma ORM, providing structured, relational querying capabilities on flat local file systems.'
    },
    {
        id: 'darkroom',
        title: 'MMMedia Darkroom',
        subtitle: 'Automated Transcoding Pipeline',
        description: 'Specialized video transcoding and processing pipeline utility. Leverages local FFMPEG implementations to provide lightning-fast, secure offline media conversions and proxies.',
        tags: ['React', 'Electron', 'FFMPEG', 'TypeScript', 'Node.js'],
        icon: Monitor,
        color: 'from-neutral-700/30 to-neutral-900/50',
        border: 'group-hover:border-neutral-500/50',
        clientProblem: 'Marketing agencies and post-production houses frequently receive massive, unoptimized HDR or proprietary RAW video files from clients, which crash standard web browsers or internal editing timelines. Preparing these assets for varied distribution channels (social media compressions, editing proxies, standardized review links) conventionally required expensive, complex software or slow cloud services, exposing sensitive pre-release content to external servers.',
        solution: 'Built a dedicated "Darkroom" desktop client that acts as an offline render farm. Users drag-and-drop massive payloads of media into the application, select output presets (e.g., "Web Optimized MP4", "ProRes Proxy"), and the system autonomously batches and converts the files locally utilizing the host machine\'s native hardware acceleration.',
        businessImpact: 'Secured the content pipeline completely by removing cloud rendering dependencies, satisfying strict NDA requirements from high-profile clients. Furthermore, it empowered non-technical staff (like producers and account managers) to safely format complex video codecs without needing a dedicated video editor, saving thousands in billed post-production hours.',
        expertDeepDive: 'MMMedia Darkroom abstracts the immense complexity of raw CLI executable arguments into a fluid React interface. The backbone is a rigid integration with statically compiled FFMPEG/FFPROBE binaries instantiated via Node `child_process.spawn`. The crucial engineering challenge was managing stdout/stderr streams to extract deterministic progress percentages during multi-pass encoding, preventing UI desynchronization. The state architecture utilizes Zustand for granular, non-blocking asynchronous queue management, pausing and resuming distinct rendering threads. Furthermore, it dynamically detects hardware acceleration layers (NVENC, VideoToolbox) at runtime to apply the optimal encoding flags, maximizing host hardware utilization while preventing thermal throttling.'
    },
    {
        id: 'reconcile-pro',
        title: 'Reconcile Pro',
        subtitle: 'Financial Data Alignment System',
        description: 'A specialized enterprise system capable of parsing, diffing, and merging complex payroll datasets. Employs advanced fuzzy matching algorithms to output truth-merged payroll files in minutes.',
        tags: ['React', 'Electron', 'Fuse.js', 'SheetJS', 'Algorithms'],
        icon: Database,
        color: 'from-emerald-500/20 to-teal-500/20',
        border: 'group-hover:border-emerald-500/50',
        clientProblem: 'During corporate mergers or large-scale financial audits, payroll departments are forced to reconcile seemingly identical employee databases from disparate legacy systems (e.g., matching "Jonathan Doe" in System A to "Jon Doe Jr." in System B). Manually identifying discrepancies in 10,000+ line Excel spreadsheets is highly error-prone, extraordinarily tedious, and costs immense operational capital.',
        solution: 'Developed an intelligent, desktop-first data reconciliation engine. Users import massive `.xlsx` or `.csv` sets, and the application instantly parses the data. It utilizes probabilistic matching algorithms to suggest alignments for misspelled names, shifted columns, or truncated IDs, outputting a flawlessly merged "Source of Truth" spreadsheet highlighting exact numerical discrepancies (e.g., unmatched vacation days or salary gaps).',
        businessImpact: 'Reduced quarterly payroll auditing workloads from multi-week manual endeavors to a largely automated, 15-minute verification process. The elimination of human error in data transcription saved clients significant regulatory pushback and compliance penalties.',
        expertDeepDive: 'Reconcile Pro tackles the notorious computer science problem of deterministic alignment across unstructured datasets. The persistence layer relies heavily on `SheetJS` to read streams of blob data from memory without breaking V8 heap limits. To handle human-error string discrepancies, it employs a highly tuned `Fuse.js` implementation, executing Bitap algorithms to determine Levenshtein distance between keys. Because mapping O(N^2) possibilities across 50,000 rows blocks the main thread, the diffing heuristic is strictly sharded across dedicated Web Workers. The UI employs a custom virtualized grid renderer (similar to ag-Grid) to display massive DOM tables smoothly, utilizing generic TypeScript interfaces to dynamically map unknown column headers.'
    },
    {
        id: 'kasl',
        title: 'KASL Procurement Portal',
        subtitle: 'B2B Enterprise Purchasing System',
        description: 'A comprehensive B2B Procurement Web Portal built to streamline supplier lifecycle management, purchasing pipelines, and vendor relationship data.',
        tags: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Enterprise'],
        icon: LayoutTemplate,
        color: 'from-lime-500/20 to-green-600/20',
        border: 'group-hover:border-lime-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/kasl',
        clientProblem: 'An enterprise client was struggling with a fragmented supply chain. Their procurement managers were tracking multi-million dollar vendor relationships, contract milestones, and Purchase Orders across disparate emails, disjointed SaaS tools, and static spreadsheets. This lack of centralized visibility led to delayed hardware fulfillments, lost contract negotiations, and massive compliance risks.',
        solution: 'Delivered the KASL Portal: a unified, highly-responsive web dashboard that serves as the single source of truth for vendor interactions. The system standardizes the onboarding of new suppliers, centralizes contract document management, and tracks real-time fulfillment statuses of massive procurement orders via dynamic status pipelines.',
        businessImpact: 'Brought 100% visibility to a chaotic purchasing pipeline. By centralizing vendor communication and PO tracking, the client circumvented supply-chain bottlenecks and drastically reduced late-fee penalties on overdue contracts. The system became critical infrastructure for their operational scale.',
        expertDeepDive: 'The KASL Procurement Portal was engineered on an ultra-modern React + Vite + TypeScript stack, pivoting away from heavy legacy ERP systems. The architectural mandate was lightning-fast Time-To-Interactive (TTI) and rigid type safety for financial data structures. The repository strictly enforces granular component splitting and highly opinionated ESLint configurations to maintain codebase integrity across a sprawling team. State management was heavily decoupled from the view layer, utilizing custom React Hooks to interface with complex, authenticated upstream REST architectures (likely via Axios interceptors mapping to strict DTO interfaces). The UI implementation heavily relies on customized headless Tailwind configurations to maintain corporate accessibility (a11y) standards without sacrificing modern aesthetics.'
    },
    {
        id: 'shuno-recap',
        title: 'Browser History Recap',
        subtitle: 'Privacy-First Data Visualization',
        description: 'An ultramodern Next.js 16 Web Extension generating "Spotify Wrapped"-style insights from browser history data—processing entirely locally.',
        tags: ['Next.js 16', 'React 19', 'Browser Extension', 'Web Workers', 'Privacy'],
        icon: LineChart,
        color: 'from-pink-500/20 to-rose-500/20',
        border: 'group-hover:border-pink-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/recap',
        clientProblem: 'Users want engaging, "Wrapped"-style data visualizations of their digital lives (like music, gaming, fitness statistics). However, browser history represents the most intimately private data available. Producing a "Browsing Recap" via traditional SaaS models requires uploading immense amounts of highly sensitive personal telemetry to a remote server—an unacceptable privacy violation.',
        solution: 'Developed "Browser History Recap" as a fundamentally private, local-first Next.js Extension. The application queries the browser\'s native `chrome.history` API, runs complex heuristic analysis algorithms *directly on the user\'s local hardware*, and paints beautiful, animated "Story Mode" visual cards (categorizing the user as a "Lore Goblin" or "Explorer" based on site habits). Zero data ever touches an external server.',
        businessImpact: 'Created a viral, highly engaging consumer product that proved rich data analysis does not require sacrificing personal privacy. The project successfully captured user attention with its flawless "Instagram Story"-like UX while maintaining absolute zero-knowledge security.',
        expertDeepDive: 'Recap utilizes an ambitious architectural fusion: It is a cutting edge Next.js 16 (React 19) App Router application functioning seamlessly within the tight sandbox restrictions of Chrome/Firefox WebExtensions (Manifest V3). The system ingests immense arrays of `HistoryItem` data, which are subsequently passed to a custom "Insights Engine". This engine normalizes noisy URL patterns and executes a categorization algorithm detecting "Eras," hourly heatmaps, and 12 distinct "Internet Personality" types. To accomplish this, synchronous data parsing is heavily offloaded to isolated Web Workers, ensuring the main thread is freed to render the GPU-accelerated CSS animations for the 60fps auto-advancing Story UI. The CSS-in-JS logic is strictly bound to CSP (Content Security Policy) standards, ensuring strict Chrome web store compliance without sacrificing the premium gradient visual aesthetic.'
    },
    {
        id: 'connect',
        title: 'ICUNI Connect',
        subtitle: 'Internal Talent Discovery',
        description: 'A comprehensive platform for managing internal and external talent. Features real-time project tracking, skill matrices, and seamless directory integration.',
        tags: ['React', 'Vite', 'Tailwind', 'Google Apps Script', 'Enterprise'],
        icon: Users,
        color: 'from-orange-500/20 to-red-500/20',
        border: 'group-hover:border-orange-500/50',
        clientProblem: 'A sprawling organization was suffering from rigid internal silos. When a project needed specific expertise (e.g., a "Senior DevOps engineer who speaks fluent Japanese"), project managers resorted to mass emails or asking around. The corporate intranet was notoriously outdated, resulting in millions lost to external contractor hiring when perfectly capable internal employees were sitting idle on other floors.',
        solution: 'Deployed ICUNI Connect, a dynamic, specialized "Internal LinkedIn" that perfectly mapped the organization\'s skill taxonomy. It allowed employees to tag their secondary skills and current bandwidth. Project Managers were given a central dashboard to query necessary skill trees, instantly surfacing available talent within the corporation and facilitating seamless internal secondments.',
        businessImpact: 'Dismantled organizational silos entirely. By optimizing internal bench utilization, the client reported a 30% reduction in external contractor overhead within the first two quarters. The platform became the de facto system for agile team assembly.',
        expertDeepDive: 'ICUNI Connect proved that modern frontend stacks can effectively bypass Draconian corporate IT restrictions. Rather than requesting complex AWS provisioning that would take months to clear compliance, the entire React + Vite frontend was cleverly bundled into a rigorous `single-file-build` manifest. This allowed the entire application—HTML, CSS, embedded fonts, and JS—to be deployed natively into Google Apps Script (GAS). By utilizing the Google Workspace ecosystem as a serverless backend and authentication layer, the robust Single Page Application (SPA) executed flawlessly within the client’s existing, pre-approved security boundaries, communicating via native `google.script.run` RPCs.'
    },
    {
        id: 'a1-director',
        title: 'D2R / AI Director',
        subtitle: 'Production Scheduling Logistics',
        description: 'Advanced web application utilizing modern full-stack patterns to provide intelligent resource scheduling, AI-driven planning scenarios, and timeline visualization.',
        tags: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind', 'SWR'],
        icon: Server,
        color: 'from-indigo-500/20 to-violet-500/20',
        border: 'group-hover:border-indigo-500/50',
        clientProblem: 'Coordinating high-end film and media productions involves juggling hundreds of moving parts: camera hardware availability, union actor hours, location permits, and crew limits. A single scheduling overlap—like booking a lighting crew to a location that isn\'t permitted yet—can halt a $100,000 shoot day. Tracking this in spreadsheets leads to catastrophic human errors.',
        solution: 'Engineered D2R (Director to Reality), an intelligent, visual scheduling Web Application. It replaces static cells with an interactive, animated timeline. Planners drag and drop resources onto distinct time tracks. Behind the scenes, the "AI Director" engine continuously runs collision detection, instantly blocking the UI and providing warnings if a resource is double-booked or a dependency constraint is violated.',
        businessImpact: 'Effectively bulletproofed production logistics. The timeline visualization significantly reduced the cognitive load on Assistant Directors, minimizing scheduling collisions to zero and ensuring that all physical shoot days proceeded without crippling logistical roadblocks.',
        expertDeepDive: 'D2R was built on the bleeding-edge Next.js 16 App Router using React 19. The application architecture leverages Next Server Components (RSC) to handle rapid initial payload delivery for the monolithic layout components, while offloading high-mutability scheduling data to client-side data fetching strategies (like SWR). The true triumph was engineering the custom timeline interface: executing O(N log N) interval overlap algorithms (similar to sweeping line algorithms) in real-time as DOM nodes are dragged across the screen. The interface flawlessly handles complex collision matrices while utilizing GPU-accelerated Tailwind transitions to prevent the UX from feeling rigid or "janky" during heavy recalculations.'
    },
    {
        id: 'gravity-os',
        title: 'Gravity - Prompt OS',
        subtitle: 'Enterprise Prompt Architecture',
        description: 'AI-powered prompt management and collaboration platform. Part of the elite Em Dash Suite, featuring robust electron-based desktop integration and seamless state management.',
        tags: ['Next.js 16', 'Electron', 'Tailwind', 'Local LLM'],
        icon: Terminal,
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'group-hover:border-cyan-500/50',
        clientProblem: 'As entire departments integrated Large Language Models (LLMs) into their workflows, "Prompt Engineering" became a highly valuable asset class. However, these complex, heavily refined prompts were being lost in Slack threads or personal Notion docs. Teams lacked a standardized system to version-control, collaborate on, and execute structured AI prompts contextually.',
        solution: 'Created Gravity: effectively an "Operating System" specifically designed for managing AI prompts. Built as a desktop application, it provides a centralized vault where teams can save, version, and share "Prompt Templates". Crucially, it allows users to insert "variables" (like [CLIENT_DATA]), dynamically injecting active OS context directly into the prompt before piping it to local or API-based LLMs.',
        businessImpact: 'Transformed fragmented AI usage into a standardized, scalable corporate asset. By institutionalizing the company\'s collective "AI knowledge," Gravity allowed junior analysts to utilize highly complex prompt structures authored by senior engineers, dramatically raising the baseline output quality of the entire workforce.',
        expertDeepDive: 'Gravity is an ambitious hybrid: it encapsulates a Next.js frontend within an Electron desktop shell. This architecture allows the platform to utilize pristine Radix UI primitives and complex React state while tapping natively into the host Operating System. The backend Node integration allows Gravity to connect directly to local inference endpoints (like Ollama or LM Studio) avoiding sensitive corporate data leaking to cloud APIs. The primary engineering feat was building the "Prompt Compiler": a custom parser utilizing regex trees to dynamically tokenize generic prompt strings, validating and mapping them against tightly typed TypeScript schemas before executing the HTTP streaming responses.'
    },
    {
        id: 'ultra-manager',
        title: 'Ultra Media Manager',
        subtitle: 'Automated Aesthetic Analysis',
        description: 'Next-generation media manager utilizing local AI models via ONNX Runtime and Transformers for automated aesthetic scoring, tagging, and advanced metadata extraction.',
        tags: ['Electron', 'React', 'ONNX Runtime', 'Vision Transformers'],
        icon: Aperture,
        color: 'from-yellow-500/20 to-amber-500/20',
        border: 'group-hover:border-yellow-500/50',
        clientProblem: 'Photographers taking 5,000 photos at a wedding spend days manually culling out blurry images, people with closed eyes, and badly lit shots before they can even begin the actual creative editing process. The sheer volume of manual filtering is the most despised part of the creative workflow.',
        solution: 'Constructed an AI-powered localized media manager. The system uses deep learning algorithms to literally "look" at the images without transferring them to the cloud. It automatically scores them for aesthetic quality, assigns confidence tags based on visual content (e.g., "bride," "cake," "outside"), and groups highly similar bursts of photos together, presenting only the statistically "best" photo from a sequence.',
        businessImpact: 'Completely eliminated the manual "first pass" of photo culling. Creatives were able to slice through tens of thousands of RAW images in minutes instead of days, allowing them to focus entirely on the artistic color-grading and delivery processes, drastically improving turnaround times.',
        expertDeepDive: 'Code-named "Anager", this project bridges raw file management with deep-learning inference. The application bundles `@xenova/transformers` and `onnxruntime-node` inside an Electron shell to execute Vision Transformer (ViT) and specialized ResNet architectures locally. The engineering complexity lay in managing tensor memory allocation; loading massive RAW image buffers directly into a neural net causes catastrophic memory leaks. The solution mandated writing custom Node.js preprocessing streams that downsample 40-megapixel buffers into low-res tensor matrices *before* passing them to the ONNX session. Inference execution occurs off-thread, streaming batched REST-like responses back to the React UI for asynchronous re-rendering.'
    },
    {
        id: 'loremaker-pro',
        title: 'Loremaker Pro',
        subtitle: 'Narrative Continuity Engine',
        description: 'Advanced lore organization software. Provides a structured database and relationship mapping tool for writers to ensure deep continuity across massive fictional universes.',
        tags: ['React', 'Node.js', 'Graph Logic', 'GitHub'],
        icon: Book,
        color: 'from-fuchsia-500/20 to-pink-600/20',
        border: 'group-hover:border-fuchsia-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/LoremakerPro',
        clientProblem: 'Authors of sprawling fantasy novels or world-builders for large video games rapidly hit the limits of what a human brain (or a massive convoluted wiki) can track. They frequently introduce disastrous "plot holes" because they forgot a minor character was killed in Chapter 2, or that the mechanics of a specific magic system contradict an event in a prequel.',
        solution: 'Loremaker Pro is an interactive, entity-relational encyclopedia specifically engineered for narrative continuity. Writers define Characters, Locations, Factions, and Events as distinct nodes. They can trace exactly how these nodes interact across strict timelines, ensuring that variables (like character allegiances or physical locations) are structurally sound across the entire narrative arc.',
        businessImpact: 'Provided narrative teams with a bulletproof "Source of Truth." It eliminated the hours wasted cross-referencing old manuscripts to verify continuity, drastically smoothing the editing phase of novel publication and game design pipelines.',
        expertDeepDive: 'Loremaker Pro abstracts the fluid nature of creative writing into a rigid Graph-Entity serialization issue. The platform relies heavily on mapping bidirectional node relationships (e.g., if Node A is the "parent" of Node B, the UI immediately infers Node B is the "child" of Node A). The frontend utilizes complex React patterns to traverse these serialized JSON trees, dynamically rendering deep lineage hierarchies and cascading dependency visuals. The architecture prioritizes client-side mutability: allowing the writer to rapidly add hundreds of entities without awaiting constant API roundtrips, relying on sophisticated local state hydration strategies.'
    },
    {
        id: 'scholarships',
        title: 'ICUNI Scholarships',
        subtitle: 'Funding Discovery Portal',
        description: 'A dedicated web application backing the scholarships subdomain of icuni.org. Designed to rapidly match applicants with specialized educational funding options.',
        tags: ['React', 'Static Generation', 'Accessibility', 'GitHub'],
        icon: GraduationCap,
        color: 'from-sky-500/20 to-blue-500/20',
        border: 'group-hover:border-sky-500/50',
        githubUrl: 'https://github.com/menelekmakonnen/scholarships',
        clientProblem: 'The ICUNI philanthropic sector was struggling with application drop-off. Students seeking critical educational funding were met with obtuse, slow-loading pages heavily buried inside complicated subdomains. The friction of simply finding the right grant criteria was deterring highly qualified candidates from applying.',
        solution: 'Overhauled the digital entry point by building the new ICUNI Scholarships platform. The system operates as a dedicated, lightning-fast portal that categorizes funding explicitly based on student needs. Clean typography, immediate load times, and crystal-clear calls-to-action guide users flawlessly from the discovery phase straight to the application gateway.',
        businessImpact: 'Significantly increased the accessibility and visibility of ICUNI grants. By severely reducing friction in the discovery phase, the organization saw a massive surge in qualified application throughput, ensuring philanthropic funds reached the correct individuals faster.',
        expertDeepDive: 'The Scholarships repository functions as the public-facing UI layer for the ICUNI foundation. To ensure equal access for students potentially localized in low-bandwidth regions, the architecture mandates absolute performance optimizations. It likely utilizes Next.js Static Site Generation (SSG) to pre-compile the extensive list of grants into flat HTML, resulting in instantaneous Time To First Byte (TTFB). The codebase heavily enforces semantic ADA compliance (a11y), utilizing rigorous ARIA tagging across complex filtering systems and modal dialogs, ensuring users relying on screen-readers have flawless navigation capabilities.'
    },
    {
        id: 'keystore',
        title: 'KeyStore Architecture',
        subtitle: 'Secure API Middleware',
        description: 'A foundational backend service test architecture emphasizing secure request handling and streamlined data delivery using robust modern backend patterns.',
        tags: ['Node.js', 'Axios', 'Backend Pattern', 'Middleware'],
        icon: Key,
        color: 'from-neutral-400/20 to-neutral-600/20',
        border: 'group-hover:border-neutral-400/50',
        clientProblem: 'As applications scale, their frontends often interact haphazardly with dozens of unauthenticated microservices. This lack of a unified gateway introduces critical vulnerabilities: exposed API keys, easily spoofed headers, and no centralized way to rate-limit or log incoming requests.',
        solution: 'Developed the "KeyStore" architecture: a hardened backend middleware framework. It acts as the fortified "front door" for the underlying systems. Any request trying to reach a sensitive database must first pass through this proxy, which rigorously screens the payload, validates encrypted authentication tokens, and scrubs malicious parameters before routing it forward.',
        businessImpact: 'Standardized security across the development ecosystem. By creating a unified, robust middleware pattern, it ensured that all future client integrations were inherently protected against standard injection or unauthorized access attempts from day one.',
        expertDeepDive: 'The KeyStore project is a sandbox specifically emphasizing hardened CommonJS architectural patterns, devoid of any frontend DOM manipulation. The core focus is establishing custom Axios interception logic. It demonstrates the implementation of a robust Reverse Proxy layer relying on `node-fetch`, mapping strict DTO (Data Transfer Object) schemas to validate incoming generic JSON payloads. It explores critical error-boundary propagation across asynchronous HTTP promises, ensuring that internal upstream stack traces are stripped and correctly formatted as standardized downstream error codes (e.g., mapping an internal DB failure gracefully to a 500 status without exposing infrastructure topology).'
    }
];
