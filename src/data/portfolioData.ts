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
    projectUrl?: string;
}

export const portfolioProjects: ProjectData[] = [
    {
        id: 'printflow',
        title: 'PrintFlow',
        subtitle: 'Print Office Operations ERP',
        description: 'A comprehensive internal enterprise resource planning (ERP) system designed to manage entire print studio workflows, from job queues to inventory and accounting.',
        tags: ['Next.js', 'React', 'Corporate Solutions'],
        icon: Aperture,
        color: 'from-fuchsia-500/20 to-purple-600/20',
        border: 'group-hover:border-fuchsia-500/50',
        imageUrl: '/images/covers/popout-studios.png',
        clientProblem: 'High-volume print studios often suffer from severe operational fragmentation, relying on disjointed software to track active print jobs, manage physical raw material inventory, process internal accounting, and oversee daily employee tasks. This disconnect inevitably leads to delayed production pipelines and lost revenue.',
        solution: 'Architected and deployed PrintFlow as a completely unified Print Office Operations suite. The platform centralizes all critical business functions—including job queuing, expense tracking, inventory management, and product cataloging—into a single, secure web portal.',
        businessImpact: 'Unified the entire administrative overhead of the studio, eliminating the need for scattered spreadsheets. This drastically improved the speed of job fulfillment and provided management with immediate, real-time oversight over inventory supply lines and unit economics.',
        expertDeepDive: 'The architecture employs a robust Next.js 16 App Router foundation connected to a comprehensive API backend. The system fundamentally handles complex relational data, linking active print jobs directly to inventory consumption and automated accounting ledgers. The frontend leverages modern React 19 paradigms to deliver a highly responsive dashboard, handling massive operational datasets and dynamic queuing systems while ensuring strict, role-based JWT authentication secures the sensitive financial and structural data.',
        projectUrl: 'https://popout.icuni.org'
    },
    {
        id: 'mmmedia-pro',
        title: 'MMM Media Manager Pro',
        subtitle: 'Professional Media Management',
        description: 'A robust desktop application built for professional media organization and edit compilation.',
        tags: ['React', 'Electron', 'Media & Entertainment'],
        icon: Film,
        color: 'from-blue-500/20 to-purple-500/20',
        border: 'group-hover:border-blue-500/50',
        imageUrl: '/images/covers/mmmedia-pro.png',
        clientProblem: 'Professional creative agencies constantly struggle with organizing massive volumes of video assets and raw camera dumps. Native operating system tools lack the specialized metadata context required for rapidly sorting and managing heavy multimedia files during the pre-edit phase.',
        solution: 'Developed the "MMM Edia - Edit Compiler" suite natively for the desktop. The platform focuses on high-speed local directory traversal, allowing editors to seamlessly index, review, and organize massive batches of local files strictly within a single, highly-focused interface.',
        businessImpact: 'The centralized interface eliminates the constant friction of searching through disjointed hard drives, substantially increasing the daily speed at which editors can locate perfect clips and assemble early project timelines.',
        expertDeepDive: 'Built as an interactive desktop utility, the application heavily leverages an Electron shell to bridge high-performance localized OS functionality with a fluid, accessible React UI. This architecture allows the software to bypass the restrictive bandwidth and storage limitations of cloud-based media managers. By executing entirely on local hardware, the implementation guarantees true privacy for unreleased media IP while retaining the rapid, iterative user interface capabilities of modern web frameworks mapped through Vite.'
    },
    {
        id: 'darkroom',
        title: 'MMMedia Darkroom',
        subtitle: 'Automated Transcoding Pipeline',
        description: 'An Electron-based utility designed to streamline repetitive local media transcoding operations.',
        tags: ['React', 'Electron', 'Media & Entertainment'],
        icon: Monitor,
        color: 'from-neutral-700/30 to-neutral-900/50',
        border: 'group-hover:border-neutral-500/50',
        imageUrl: '/images/covers/darkroom.png',
        clientProblem: 'Exporting and converting heavy media files into varied delivery formats traditionally requires complex, user-unfriendly software or expensive, bandwidth-heavy cloud platforms, creating frustrating bottlenecks for digital marketing teams.',
        solution: 'Built the "MMMedia Darkroom", an offline-first desktop application that wraps intensive media command-line operations into an intuitive, accessible React graphical interface, tailored specifically for creative teams.',
        businessImpact: 'By drastically lowering the technical barrier to entry for media processing, the application allows non-technical team members to securely process large payloads locally, removing the dependency on external subscriptions.',
        expertDeepDive: 'The system encapsulates its processing logic within a standalone Electron environment written entirely in strict TypeScript. This local-first structure provides immediate access to the host machine\'s native file pathways, ensuring secure handling of massive source files without ever transmitting data externally. The React front-end actively tracks operational progression, providing users with crucial, real-time visual feedback during lengthy media conversions, significantly improving the pre-production workflow.'
    },
    {
        id: 'reconcile-pro',
        title: 'Reconcile Pro',
        subtitle: 'Payroll Data Reconciliation',
        description: 'A specialized application designed to systematically audit and merge complex corporate payroll outputs.',
        tags: ['React', 'Data & Analytics', 'Corporate Solutions'],
        icon: Database,
        color: 'from-emerald-500/20 to-teal-500/20',
        border: 'group-hover:border-emerald-500/50',
        imageUrl: '/images/covers/reconcile-pro.png',
        clientProblem: 'Human resources and financial auditing teams routinely face the daunting task of manually comparing disparate legacy payroll lists. Misspelled entries and disjointed database formats often lead to exhausting, error-prone manual spreadsheets.',
        solution: 'Delivered the "Payroll Data Reconciliation System," a focused application designed specifically to process and intelligently map overlapping or mismatched data points, ultimately delivering "truth-merged payroll outputs in minutes."',
        businessImpact: 'Reconcile Pro dramatically accelerated weekly auditing sprints, effectively eliminating severe human-error liabilities from the reconciliation equation while freeing financial personnel to focus on higher-level analytical tasks.',
        expertDeepDive: 'The engineering strategy prioritized strict data fidelity and rapid cross-referencing capabilities. By transforming opaque, massive data lists into a deeply interactive comparison interface, the platform allows stakeholders to intuitively verify system-generated matches. The architecture successfully structures the unpredictable nature of legacy HR exports into a unified, reliable pipeline that ensures consistent corporate financial reporting without requiring massive manual manipulation.'
    },
    {
        id: 'kasl',
        title: 'KASL Procurement Portal',
        subtitle: 'B2B Enterprise Purchasing System',
        description: 'An enterprise web portal built to seamlessly streamline supplier and procurement lifecycle management.',
        tags: ['React', 'Vite', 'Corporate Solutions'],
        icon: LayoutTemplate,
        color: 'from-lime-500/20 to-green-600/20',
        border: 'group-hover:border-lime-500/50',
        imageUrl: '/images/covers/kasl.png',
        githubUrl: 'https://github.com/menelekmakonnen/kasl',
        clientProblem: 'Within large organizations, tracking crucial vendor relationships, purchasing workflows, and procurement states across disconnected communication channels frequently leads to critical pipeline slowdowns and administrative confusion.',
        solution: 'Deployed the KASL Hub: a centralized web application serving as the definitive source of truth for tracking B2B procurement pipelines and managing real-time supplier interaction.',
        businessImpact: 'Brought intense transparency to previously chaotic purchasing procedures, ensuring stakeholders have immediate visibility into procurement status, fundamentally accelerating operational timelines.',
        expertDeepDive: 'Constructed utilizing a highly-responsive React and Vite architecture, the KASL Portal serves as a modernized counterpoint to notoriously slow legacy ERP interfaces. The frontend was tightly engineered with TypeScript to enforce strict structural data contracts throughout the complex procurement pipelines. Emphasizing a frictionless user experience, the system breaks down intricate purchasing funnels into accessible, state-driven interfaces that significantly improve onboarding and compliance verification for external suppliers.',
        projectUrl: 'https://kasl.kezeah.com'
    },
    {
        id: 'shuno-recap',
        title: 'Browser History Recap',
        subtitle: 'Privacy-First Data Visualization',
        description: 'A web environment dedicated to generating highly personalized visual insights explicitly from local browser history data.',
        tags: ['React', 'Data & Analytics', 'Privacy'],
        icon: LineChart,
        color: 'from-pink-500/20 to-rose-500/20',
        border: 'group-hover:border-pink-500/50',
        imageUrl: '/images/covers/shuno-recap.png',
        githubUrl: 'https://github.com/menelekmakonnen/recap',
        clientProblem: 'Users deeply appreciate engaging, retrospective analytics regarding their digital habits, but uploading highly sensitive personal browser history to remote third-party servers presents severe privacy and security concerns.',
        solution: 'Architected the "Browser History Recap" project, focusing exclusively on running robust chronological categorization and visually engaging storytelling interfaces completely localized to the user\'s machine.',
        businessImpact: 'Provided a uniquely engaging tool that perfectly bridges the gap between high-end digital analytics and absolute data privacy, building intense user trust and organic product engagement.',
        expertDeepDive: 'The core technical mandate for this project was strict data localization. Rather than defaulting to a typical server-client API model, the entire logical engine processes data inputs entirely within the user\'s local environment. The user interface translates complex timeline history into sweeping, accessible visual graphics, proving that compelling analytics do not fundamentally require the compromise of sensitive, deeply personal user tracking information.',
        projectUrl: 'https://recap.icuni.org'
    },
    {
        id: 'connect',
        title: 'ICUNI Connect',
        subtitle: 'Talent Directory & Project Management',
        description: 'An internal corporate gateway combining dynamic talent directories with centralized project management structures.',
        tags: ['React', 'Corporate Solutions', 'Community'],
        icon: Users,
        color: 'from-orange-500/20 to-red-500/20',
        border: 'group-hover:border-orange-500/50',
        imageUrl: '/images/covers/connect.png',
        clientProblem: 'Large networks often suffer from extreme talent siloing, making it incredibly difficult for project leaders to identify specific internal colleagues with the necessary skillset for specialized, cross-departmental engagements.',
        solution: 'Launched "ICUNI Connect," a dedicated central platform functioning as a deeply searchable talent directory embedded directly alongside functional project management dashboards.',
        businessImpact: 'Effectively dismantled corporate communication barriers by granting instant visibility into organizational talent, resulting in substantially faster team building and better internal resource utilization.',
        expertDeepDive: 'The platform serves as a vital connective tissue for the organization, bridging the gap between flat employee tracking systems and active workflow management. By intertwining individual user profiles with current project scopes, the interface inherently creates a dynamic map of ongoing initiatives. The architecture utilizes modern React workflows to ensure that the directory remains hyper-responsive during searches, facilitating rapid discovery and fostering a culture of organic structural collaboration.',
        projectUrl: 'https://connect.icuni.org'
    },
    {
        id: 'a1-director',
        title: 'D2R / AI Director',
        subtitle: 'Interactive Scheduling Engine',
        description: 'A structural application focused on establishing highly organized, timeline-based staging and project scheduling.',
        tags: ['React', 'Media & Entertainment', 'Logistics'],
        icon: Server,
        color: 'from-indigo-500/20 to-violet-500/20',
        border: 'group-hover:border-indigo-500/50',
        imageUrl: '/images/covers/a1-director.png',
        clientProblem: 'Managing intensely complex schedules filled with interdependent tasks and overlapping resource requirements frequently causes severe logistical clashes when relying strictly on traditional static ledgers.',
        solution: 'Engineered a highly intelligent scheduling timeline approach, transitioning flat logistical data into an interactive, visually dominant control center.',
        businessImpact: 'Bulletproofed the structural scheduling phase, preventing systemic overlaps and completely alleviating the cognitive burden placed on administrative directors.',
        expertDeepDive: 'The application is predominantly built around a powerful graphical timeline engine. Instead of burying scheduling logic in deep tables, the system visually maps constraints, actively managing interval tracking and temporal progression. The UI incorporates fluid interactions, allowing administrators to rapidly adjust and observe cascading logistical impacts in a completely visual context, dramatically raising the baseline efficiency of production timelines.'
    },
    {
        id: 'gravity-os',
        title: 'Gravity - Prompt OS',
        subtitle: 'Enterprise Prompt Architecture',
        description: 'An expansive prompt management and collaboration platform, forming a pivotal component of the Em Dash Suite by ICUNI Global.',
        tags: ['React', 'Corporate Solutions', 'AI Architecture'],
        icon: Terminal,
        color: 'from-cyan-500/20 to-blue-600/20',
        border: 'group-hover:border-cyan-500/50',
        imageUrl: '/images/covers/gravity-os.png',
        clientProblem: 'The massive adoption of AI tools within the enterprise space has resulted in complete prompt fragmentation. Critical instructions were lost to personal chat histories, leading to vastly inconsistent AI outputs across organizational teams.',
        solution: 'Developed "Gravity - Prompt OS," a centralized workspace specifically designed for standardizing, versioning, and deploying complex prompt templates across an entire collaborative team.',
        businessImpact: 'Institutionalized architectural AI logic, democratizing access to highly refined prompt frameworks and enforcing structural consistency across enterprise AI initiatives.',
        expertDeepDive: 'Positioned as an operating environment entirely dedicated to AI interactions, Gravity anchors the overarching Em Dash Suite. The core architecture serves as a dedicated repository mechanism, securely housing variables and structured logic away from disjointed text documents. The application provides an elegant, structured interface that allows teams to seamlessly author and share highly-capable templates, treating prompt creation with the same rigorous versioning methodologies typically reserved strictly for software engineering.'
    },
    {
        id: 'ultra-manager',
        title: 'Ultra Media Manager',
        subtitle: 'Advanced Media Logistics',
        description: 'A focused, structural system specifically designed for robust, overarching digital asset management.',
        tags: ['React', 'Media & Entertainment', 'Asset Management'],
        icon: Aperture,
        color: 'from-yellow-500/20 to-amber-500/20',
        border: 'group-hover:border-yellow-500/50',
        imageUrl: '/images/covers/ultra-manager.png',
        clientProblem: 'Scaling content libraries rapidly descend into organizational chaos when existing management platforms fail to provide adequate contextual tagging or overarching hierarchy systems.',
        solution: 'Drafted the Ultra Media Manager platform to focus intensely on delivering a stable, highly logical categorization backbone for rapidly expanding multimedia collections.',
        businessImpact: 'Allowed massive content libraries to maintain strict organizational consistency over time, significantly improving cross-team asset retrieval and project turnaround times.',
        expertDeepDive: 'The core methodology of this application involves structuring vast, unstructured content pools into highly navigable pathways. The user interface prioritizes clarity, actively mitigating the visual noise associated with heavy media directories. By providing specialized cataloging features and focused structural layouts, the application empowers media teams to rapidly segment their assets into logical pipelines without becoming overwhelmed by the sheer scale of the raw data.'
    },
    {
        id: 'loremaker-pro',
        title: 'Loremaker Pro',
        subtitle: 'Narrative Continuity Engine',
        description: 'A specialized structural tool providing robust logic relationship mapping and database capabilities for writers.',
        tags: ['React', 'Node.js', 'Data & Analytics'],
        icon: Book,
        color: 'from-fuchsia-500/20 to-pink-600/20',
        border: 'group-hover:border-fuchsia-500/50',
        imageUrl: '/images/covers/loremaker-pro.png',
        githubUrl: 'https://github.com/menelekmakonnen/LoremakerPro',
        clientProblem: 'Authors managing expansive, multi-volume narrative worlds frequently struggle to maintain canonical consistency, tracking complex character timelines and location histories entirely through fragmented notes.',
        solution: 'Engineered "Loremaker", a dedicated relationship mapping platform. The application translates linear storytelling notes into structured relational datasets, providing a true database for narrative continuity.',
        businessImpact: 'Replaced disjointed word processors with a dedicated structural source of truth, drastically empowering narrative teams to maintain flawless lore continuity during rapid creative drafting.',
        expertDeepDive: 'Loremaker functionally shifts the paradigm of creative tracking from flat text into explicit programmatic architecture. Integrating a stable Node.js server backbone, the application provides an interactive front-end mapped against complex continuous data structures. The UI enables writers to systematically tether events, personas, and geographies into highly organized, easily searchable trees, treating immense fictional world-building with strict organizational fidelity.',
        projectUrl: 'https://loremaker.cloud'
    },
    {
        id: 'scholarships',
        title: 'ICUNI Scholarships',
        subtitle: 'Funding Discovery Portal',
        description: 'A dedicated web interface backing the primary scholarships subdomain of the ICUNI philanthropic network.',
        tags: ['React', 'HTML', 'Community'],
        icon: GraduationCap,
        color: 'from-sky-500/20 to-blue-500/20',
        border: 'group-hover:border-sky-500/50',
        imageUrl: '/images/covers/scholarships.png',
        githubUrl: 'https://github.com/menelekmakonnen/scholarships',
        clientProblem: 'Potential students continuously struggled to locate and parse appropriate funding opportunities due to disjointed websites and poor categorization of critical scholarship guidelines.',
        solution: 'Overhauled the digital entry point by deploying a centralized, highly focused repository explicitly categorized by differing grant structures and student-need classifications.',
        businessImpact: 'Severely lowered the barrier to entry regarding information discovery, ensuring that philanthropic scholarship funds successfully reached the qualified candidates who actively needed them.',
        expertDeepDive: 'The engineering strategy prioritized immense clarity and rapid accessibility above complex functionality. The application serves as a strictly focused directory interface, presenting dense, highly-specific financial and academic requirements via an intuitive, easily scannable visual grid. By prioritizing a clean React architecture and robust semantic HTML, the digital platform directly combats the inherent administrative friction usually associated with sprawling educational subdomains.',
        projectUrl: 'https://scholarships.icuni.org'
    },
    {
        id: 'film-icuni',
        title: 'ICUNI Film Database',
        subtitle: 'Cinematic Collaboration Network',
        description: 'An interactive cinematic directory dedicated to connecting independent actors, filmmakers, and studio projects.',
        tags: ['React', 'HTML', 'Media & Entertainment'],
        icon: PlayCircle,
        color: 'from-red-500/20 to-orange-600/20',
        border: 'group-hover:border-red-500/50',
        imageUrl: '/images/covers/film-icuni.png',
        githubUrl: 'https://github.com/menelekmakonnen/film-icuni-org',
        clientProblem: 'Independent, micro-budget film creators lack a centralized hub for efficiently organizing casting calls, locating specific technical crew, and reviewing local talent portfolios.',
        solution: 'Built the ICUNI Film Database, functioning as a highly focused collaborative network. It introduces structured talent profiles alongside centralized project pitching and casting boards.',
        businessImpact: 'Effectively consolidated disjointed creative networks into a fully searchable database, significantly accelerating the difficult pre-production and active casting phases for localized independent projects.',
        expertDeepDive: 'The platform successfully abstracts the chaos of social media casting into a highly functional web directory. Driven by a robust React frontend, the architecture bridges individual profiles (showcasing roles and acting histories) directly to overarching production hubs. The application logic is specifically designed to facilitate immediate discovery, mapping specific creative requirements to a focused talent roster, fully accelerating the independent film community workflow.',
        projectUrl: 'https://films.icuni.org'
    },
    {
        id: 'keystore',
        title: 'KeyStore Architecture',
        subtitle: 'Secure Information Middleware',
        description: 'A foundational, highly structural backend configuration focusing strictly on secure credential handling and environment isolation.',
        tags: ['Backend Architecture', 'Corporate Solutions', 'Security'],
        icon: Key,
        color: 'from-neutral-400/20 to-neutral-600/20',
        border: 'group-hover:border-neutral-400/50',
        imageUrl: '/images/covers/keystore.png',
        clientProblem: 'Fragmenting critical environment variables and credentials arbitrarily across various front-end repositories dramatically exposes organizational codebases to severe security vulnerabilities.',
        solution: 'Designed the KeyStore architectural mandate to enforce an unyielding, centralized structure for securing project variables away from client-facing applications.',
        businessImpact: 'Established a strict baseline security perimeter for internal deployments, mitigating unauthorized access points and drastically simplifying the security auditing process.',
        expertDeepDive: 'The methodology behind KeyStore is purely structural engineering. Rather than an interactive graphical interface, the project emphasizes a resilient, invisible backend topology. It functions to isolate sensitive information logically from the active UI rendering cycle, emphasizing middleware compliance. This enforces a standardized security pattern, ensuring subsequent software suites are built utilizing a secure-by-default foundational layer.',
        projectUrl: 'https://key.icuni.org'
    }
];
