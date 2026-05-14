import {
    Rocket, Settings, Puzzle, Clapperboard, BrainCircuit, Eye, Landmark,
    type LucideIcon,
} from 'lucide-react';

export interface PersonaData {
    id: string;
    slug: string;
    icon: LucideIcon;
    accentColor: string; // tailwind-safe hex
    title: string;
    subtitle: string;
    tileLine: string;      // short label for homepage tile
    tileTeaser: string;    // one-line teaser under tile
    heroHeadline: string;
    heroSub: string;
    painIntro: string;
    painSignals: string[];
    solutionHeadline: string;
    solutionBody: string;
    proofPoints: { label: string; desc: string }[];
    ctaText: string;
    /** Three diagnostic challenge questions for discovery calls */
    challengeQuestions: {
        costQuestion: string;
        revenueQuestion: string;
        leakQuestion: string;
    };
}

export const personas: PersonaData[] = [
    {
        id: 'founders',
        slug: 'founders',
        icon: Rocket,
        accentColor: '#ff7a00',
        title: 'The Scaling Founder',
        subtitle: 'Founder · CEO · Managing Director · Business Owner · Solo Operator Hiring Their First Team',
        tileLine: 'For Founders Scaling Past Chaos',
        tileTeaser: 'Your team is growing but your backend is still held together by WhatsApp and memory.',
        heroHeadline: "You've Outgrown Hustle-Mode.",
        heroSub: "The team is moving, but too much still depends on you. Processes live in people's heads, follow-ups happen in WhatsApp, and growth is exposing weak systems. You're the bottleneck — and you know it.",
        painIntro: "Sound familiar?",
        painSignals: [
            "We're growing fast, but our operations are messy.",
            "Too much still depends on me — I can't take a week off.",
            "We need better systems but don't know where to start.",
            "Our team is wasting time on admin instead of real work.",
            "We need automation — yesterday.",
            "I hired people but they can't operate without me in the room.",
        ],
        solutionHeadline: "Replace operational improvisation with real systems.",
        solutionBody: "We help founder-led companies replace spreadsheet-and-WhatsApp operations with lean internal systems, automations, and dashboards that create visibility, reduce dependency on memory, and make scaling less chaotic. You get to step back from daily firefighting and focus on growth.",
        proofPoints: [
            { label: "Reduce bottlenecks", desc: "Stop being the single point of failure for every decision." },
            { label: "Improve delegation", desc: "Systems that let your team execute without constant hand-holding." },
            { label: "Scale with less chaos", desc: "Grow your headcount without multiplying your problems." },
        ],
        ctaText: "Get a Systems Audit for Your Business",
        challengeQuestions: {
            costQuestion: "What's the most expensive process that still depends entirely on you?",
            revenueQuestion: "If you could clone yourself for one task, which task would make you the most money?",
            leakQuestion: "Where do you lose the most time every week to things your team should handle?",
        },
    },
    {
        id: 'operations',
        slug: 'operations',
        icon: Settings,
        accentColor: '#00bfff',
        title: 'The Operations Enforcer',
        subtitle: 'Head of Ops · COO · Admin Manager · Programme Manager · Office Manager · Logistics Lead',
        tileLine: 'For Ops Teams Drowning in Manual Work',
        tileTeaser: "You're the adult in the room, holding together broken processes with follow-up and grit.",
        heroHeadline: "Your Team Shouldn't Run on Grit Alone.",
        heroSub: "Things technically work, but badly. Staff miss steps, handoffs break, and reporting takes forever. You keep fixing the same problems because there's no system to prevent them. You're the human glue holding operations together.",
        painIntro: "Sound familiar?",
        painSignals: [
            "We keep chasing people for updates.",
            "This process is too manual — we're doing data entry that a system should do.",
            "We fix the same issues over and over.",
            "Reporting takes forever because data lives in five places.",
            "There's no clean audit trail — we can't prove who did what.",
            "New hires take weeks to learn our processes because nothing is documented.",
        ],
        solutionHeadline: "Streamline workflows. Reduce manual admin. Make execution reliable.",
        solutionBody: "We work with ops-heavy teams to replace chaotic procedures with clean, accountable workflows — SOP-backed systems, routing, intake forms, trackers, dashboards, and AI-supported admin that reduces repetitive work. Your team runs on systems, not heroics.",
        proofPoints: [
            { label: "Reduce manual admin", desc: "Automate the repetitive steps your team shouldn't be doing." },
            { label: "Improve visibility", desc: "Dashboards that show real status without chasing people." },
            { label: "Standardise execution", desc: "Workflows that enforce consistency across the team." },
        ],
        ctaText: "Get a Workflow Audit",
        challengeQuestions: {
            costQuestion: "What's the most time-consuming admin task your team does every single week?",
            revenueQuestion: "If you could eliminate one bottleneck, which would free up the most capacity?",
            leakQuestion: "Where do things fall through the cracks most often — handoffs, approvals, or reporting?",
        },
    },
    {
        id: 'product-systems',
        slug: 'product-systems',
        icon: Puzzle,
        accentColor: '#a855f7',
        title: 'The Product Translator',
        subtitle: 'Product Manager · Systems Analyst · Digital Transformation Lead · IT Manager · Internal Tools Owner',
        tileLine: 'For Product Leads Shaping Internal Tools',
        tileTeaser: "Requirements are muddy. Business teams complain. Nobody has mapped how the workflow actually works.",
        heroHeadline: "Turn Muddy Requirements Into Usable Systems.",
        heroSub: "You know a problem exists, but the workflow hasn't been mapped. Business teams complain, tech teams are busy, and nobody owns the solution. You're stuck between 'we need a tool' and 'we can't define what it should do.'",
        painIntro: "Sound familiar?",
        painSignals: [
            "We need an internal tool but can't define it clearly.",
            "Requirements keep changing because stakeholders don't agree.",
            "The workflow hasn't been mapped properly — everyone describes it differently.",
            "We need to test this before committing to a bigger build.",
            "We need something usable, fast — not a six-month project.",
            "Previous tools failed because people didn't adopt them.",
        ],
        solutionHeadline: "Shape chaos into buildable, adoptable systems.",
        solutionBody: "We help teams bridge the gap between messy internal needs and usable digital systems — through workflow mapping, MVP scoping, requirements design, and AI workflow layers that people actually adopt. We translate business frustration into technical specifications that get built right the first time.",
        proofPoints: [
            { label: "Structure & clarity", desc: "Turn vague needs into concrete, scoped requirements." },
            { label: "Faster validation", desc: "Pilot systems that test ideas before the big build." },
            { label: "Better adoption", desc: "Tools designed around how people actually work." },
        ],
        ctaText: "Scope Your Internal Tool",
        challengeQuestions: {
            costQuestion: "What's the most expensive failed tool or system your team tried to build?",
            revenueQuestion: "If one internal process was digitised perfectly, which would save the most time?",
            leakQuestion: "Where does institutional knowledge live that would be lost if one person left?",
        },
    },
    {
        id: 'creative-ops',
        slug: 'creative-ops',
        icon: Clapperboard,
        accentColor: '#f43f5e',
        title: 'The Creative Operations Builder',
        subtitle: 'Creative Director · Studio Founder · Production Manager · Content Lead · Agency Operations Manager',
        tileLine: 'For Creative Teams with Broken Pipelines',
        tileTeaser: "Assets everywhere. Revisions messy. Delivery depends on people manually remembering everything.",
        heroHeadline: "Creative Work Deserves Better Pipelines.",
        heroSub: "Files are scattered. Approval chains are informal. Versions get confused. Your best creative people are slowed down by process stupidity — not lack of talent, but lack of structure around the talent.",
        painIntro: "Sound familiar?",
        painSignals: [
            "Approvals are a mess — too many email threads, too many stakeholders.",
            "We lose time chasing versions and feedback.",
            "Files are everywhere — Dropbox, Google Drive, WhatsApp, email.",
            "Too much depends on manual coordination between people.",
            "Our production pipeline needs structure but can't be rigid.",
            "We miss deadlines because of coordination failures, not creative blocks.",
        ],
        solutionHeadline: "Move faster without losing control of quality and delivery.",
        solutionBody: "We build smart production systems — asset tracking, approval workflows, content readiness dashboards, and archive structures — so creative teams can produce at speed without chaos. Structure that serves creativity, not stifles it.",
        proofPoints: [
            { label: "Fewer approval delays", desc: "Structured review flows that don't kill momentum." },
            { label: "Better asset tracking", desc: "Always know where every version lives." },
            { label: "Cleaner delivery", desc: "Hit deadlines with confidence, not panic." },
        ],
        ctaText: "Fix Your Production Pipeline",
        challengeQuestions: {
            costQuestion: "What's the most expensive project delay caused by a coordination failure?",
            revenueQuestion: "If your team could produce 30% more content, what would that be worth?",
            leakQuestion: "How many hours a week does your team spend looking for files or chasing approvals?",
        },
    },
    {
        id: 'ai-adoption',
        slug: 'ai-adoption',
        icon: BrainCircuit,
        accentColor: '#10b981',
        title: 'The AI Adoption Sponsor',
        subtitle: 'Department Head · Innovation Lead · HR Lead · L&D Lead · Business Owner · Digital Champion',
        tileLine: 'For Teams Adopting AI Properly',
        tileTeaser: "Your team knows AI matters but they're still dabbling with random prompts and no real process.",
        heroHeadline: "From Vague AI Interest to Practical Adoption.",
        heroSub: "People use random prompts with no process, no shared method, and no integration into actual work. You need practical AI use, not hype tourism. The gap between 'we should use AI' and 'AI saves us 10 hours a week' is a workflow gap, not a technology gap.",
        painIntro: "Sound familiar?",
        painSignals: [
            "My team needs to use AI better — but nobody knows where to start.",
            "We want practical AI adoption, not theory or hype.",
            "We need AI training tied to actual workflows, not generic prompt tutorials.",
            "People are curious but inconsistent — some experiment, most don't.",
            "We've tried training but nothing stuck because it wasn't connected to real work.",
            "Leadership is asking for an AI strategy and I don't know what to recommend.",
        ],
        solutionHeadline: "Workflow-focused AI training and implementation.",
        solutionBody: "We help teams move from vague AI interest to practical adoption — through use-case mapping, workflow audits, team capability training, and implementation support that connects AI to real business output. No hype. No theory. Just AI that makes your team faster.",
        proofPoints: [
            { label: "Real use cases", desc: "AI applied to your actual processes, not generic demos." },
            { label: "Staff enablement", desc: "Your team learns by doing, with your data and workflows." },
            { label: "Workflow integration", desc: "AI embedded into how your business actually operates." },
        ],
        ctaText: "Start Your AI Adoption Plan",
        challengeQuestions: {
            costQuestion: "What's the most time-consuming task in your team that AI could realistically handle?",
            revenueQuestion: "If AI saved each team member 5 hours a week, what would they spend that time on?",
            leakQuestion: "What repetitive knowledge work does your team do that follows the same pattern every time?",
        },
    },
    {
        id: 'remote-owner',
        slug: 'remote-owner',
        icon: Eye,
        accentColor: '#f59e0b',
        title: 'The Remote Owner',
        subtitle: 'Business Owner · Investor · Silent Partner · Absentee Owner · Diaspora Entrepreneur',
        tileLine: 'For Owners Managing from Afar',
        tileTeaser: "You need to know your business is running honestly and efficiently without being there every day.",
        heroHeadline: "Trust, but Verify. Systems Make It Possible.",
        heroSub: "You step away from daily operations, but blind spots make you anxious. You shouldn't have to be on-site every day just to prevent revenue leakage or ensure things run correctly. You need unbreakable visibility — not staff you have to trust on faith.",
        painIntro: "Sound familiar?",
        painSignals: [
            "I'm worried about revenue leakage when I'm not there.",
            "Reports don't always match reality — I suspect things are being hidden.",
            "I need an unvarnished view of daily operations, not curated reports.",
            "Inventory or cash flow often seems inconsistent with what I'm told.",
            "I can't reliably tell if the team is genuinely productive or just present.",
            "I've caught discrepancies before but have no system to prevent them.",
        ],
        solutionHeadline: "Gain unbreakable visibility into your operations from anywhere.",
        solutionBody: "We build transparent reporting systems, inventory tracking, and operational dashboards that give you the raw truth. Replace assumptions and blind trust with hard, ungameable data that safeguards your business — whether you're across town or across the world.",
        proofPoints: [
            { label: "Plug revenue leaks", desc: "Financial and operational controls that make discrepancies obvious." },
            { label: "Unalterable truth", desc: "Dashboards that report actual system data, not human interpretations." },
            { label: "Peace of mind", desc: "Know exactly what is happening in your business from across the world." },
        ],
        ctaText: "Secure Your Operations",
        challengeQuestions: {
            costQuestion: "What's the most money you suspect you've lost due to lack of oversight?",
            revenueQuestion: "If you had full, real-time visibility, what business decision would you make tomorrow?",
            leakQuestion: "Where in your operations do you suspect the numbers don't match reality?",
        },
    },
    {
        id: 'financial-ops',
        slug: 'financial-ops',
        icon: Landmark,
        accentColor: '#06d6a0',
        title: 'The Financial Operator',
        subtitle: 'MoMo Vendor · Microfinance Manager · Mobile Banking Agent · Small Financial Services Provider · Cash Business Owner',
        tileLine: 'For Financial Operators Stuck in Notebooks',
        tileTeaser: "Your transaction records live in notebooks, MTN statements, and memory. You need a system that traces every cedi.",
        heroHeadline: "Every Transaction Should Be Traceable.",
        heroSub: "You process hundreds of transactions daily but your records are scattered between notebooks, mental arithmetic, and mobile money statements that don't reconcile. End-of-day balancing is a nightmare, and you can't prove where the gaps are.",
        painIntro: "Sound familiar?",
        painSignals: [
            "My transaction records are in notebooks and I can't reconcile them with MTN statements.",
            "I don't know my actual daily profit — I just know if there's money left.",
            "End-of-day balancing takes too long and I still find discrepancies.",
            "I can't trace a specific transaction from last week without flipping through pages.",
            "I suspect agents or staff are skimming but I have no proof.",
            "I want to grow to multiple locations but can't manage what I can't see.",
        ],
        solutionHeadline: "Replace notebooks with a system that traces every cedi, in and out.",
        solutionBody: "We build transaction-tracing systems specifically for cash-heavy and mobile money businesses. Log every send, receive, and cash-out. Reconcile against provider statements automatically. Get real-time dashboards that show your actual position — not what someone tells you it is.",
        proofPoints: [
            { label: "Full traceability", desc: "Every transaction logged, timestamped, and categorised." },
            { label: "Auto-reconciliation", desc: "Match your records against MTN/Vodafone statements instantly." },
            { label: "Theft prevention", desc: "Discrepancies surface automatically — no more guessing." },
        ],
        ctaText: "Get a Transaction Tracing System",
        challengeQuestions: {
            costQuestion: "How much money do you lose per month to discrepancies you can't explain?",
            revenueQuestion: "If you could process 50% more transactions daily with the same staff, what would that mean for your business?",
            leakQuestion: "When was the last time your end-of-day balance didn't match — and could you find out why?",
        },
    },
];

export function getPersonaBySlug(slug: string): PersonaData | undefined {
    return personas.find(p => p.slug === slug);
}
