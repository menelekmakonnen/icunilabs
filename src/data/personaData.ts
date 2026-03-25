import {
    Rocket, Settings, Puzzle, Clapperboard, BrainCircuit,
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
}

export const personas: PersonaData[] = [
    {
        id: 'founders',
        slug: 'founders',
        icon: Rocket,
        accentColor: '#ff6600',
        title: 'The Scaling Founder',
        subtitle: 'Founder · CEO · Managing Director · Business Owner',
        tileLine: 'For Founders Scaling Past Chaos',
        tileTeaser: 'Your team is growing but your backend is still held together by WhatsApp and memory.',
        heroHeadline: "You've Outgrown Hustle-Mode.",
        heroSub: "The team is moving, but too much still depends on you. Processes live in people's heads, follow-ups happen in WhatsApp, and growth is exposing weak systems.",
        painIntro: "Sound familiar?",
        painSignals: [
            "We're growing fast, but our operations are messy.",
            "Too much still depends on me.",
            "We need better systems.",
            "Our team is wasting time on admin.",
            "We need automation — yesterday.",
        ],
        solutionHeadline: "Replace operational improvisation with real systems.",
        solutionBody: "We help founder-led companies replace spreadsheet-and-WhatsApp operations with lean internal systems, automations, and dashboards that create visibility, reduce dependency on memory, and make scaling less chaotic.",
        proofPoints: [
            { label: "Reduce bottlenecks", desc: "Stop being the single point of failure for every decision." },
            { label: "Improve delegation", desc: "Systems that let your team execute without constant hand-holding." },
            { label: "Scale with less chaos", desc: "Grow your headcount without multiplying your problems." },
        ],
        ctaText: "Get a Systems Audit for Your Business",
    },
    {
        id: 'operations',
        slug: 'operations',
        icon: Settings,
        accentColor: '#00bfff',
        title: 'The Operations Enforcer',
        subtitle: 'Head of Ops · COO · Admin Manager · Programme Manager',
        tileLine: 'For Ops Teams Drowning in Manual Work',
        tileTeaser: "You're the adult in the room, holding together broken processes with follow-up and grit.",
        heroHeadline: "Your Team Shouldn't Run on Grit Alone.",
        heroSub: "Things technically work, but badly. Staff miss steps, handoffs break, and reporting takes forever. You keep fixing the same problems.",
        painIntro: "Sound familiar?",
        painSignals: [
            "We keep chasing people for updates.",
            "This process is too manual.",
            "We fix the same issues over and over.",
            "Reporting takes forever.",
            "There's no clean audit trail.",
        ],
        solutionHeadline: "Streamline workflows. Reduce manual admin. Make execution reliable.",
        solutionBody: "We work with ops-heavy teams to replace chaotic procedures with clean, accountable workflows — SOP-backed systems, routing, intake forms, trackers, dashboards, and AI-supported admin that reduces repetitive work.",
        proofPoints: [
            { label: "Reduce manual admin", desc: "Automate the repetitive steps your team shouldn't be doing." },
            { label: "Improve visibility", desc: "Dashboards that show real status without chasing people." },
            { label: "Standardise execution", desc: "Workflows that enforce consistency across the team." },
        ],
        ctaText: "Get a Workflow Audit",
    },
    {
        id: 'product-systems',
        slug: 'product-systems',
        icon: Puzzle,
        accentColor: '#a855f7',
        title: 'The Product Translator',
        subtitle: 'Product Manager · Systems Analyst · Digital Transformation Lead',
        tileLine: 'For Product Leads Shaping Internal Tools',
        tileTeaser: "Requirements are muddy. Business teams complain. Nobody has mapped how the workflow actually works.",
        heroHeadline: "Turn Muddy Requirements Into Usable Systems.",
        heroSub: "You know a problem exists, but the workflow hasn't been mapped. Business teams complain, tech teams are busy, and nobody owns the solution.",
        painIntro: "Sound familiar?",
        painSignals: [
            "We need an internal tool but can't define it clearly.",
            "Requirements keep changing.",
            "The workflow hasn't been mapped properly.",
            "We need to test this before a bigger build.",
            "We need something usable, fast.",
        ],
        solutionHeadline: "Shape chaos into buildable, adoptable systems.",
        solutionBody: "We help teams bridge the gap between messy internal needs and usable digital systems — through workflow mapping, MVP scoping, requirements design, and AI workflow layers that people actually adopt.",
        proofPoints: [
            { label: "Structure & clarity", desc: "Turn vague needs into concrete, scoped requirements." },
            { label: "Faster validation", desc: "Pilot systems that test ideas before the big build." },
            { label: "Better adoption", desc: "Tools designed around how people actually work." },
        ],
        ctaText: "Scope Your Internal Tool",
    },
    {
        id: 'creative-ops',
        slug: 'creative-ops',
        icon: Clapperboard,
        accentColor: '#f43f5e',
        title: 'The Creative Operations Builder',
        subtitle: 'Creative Director · Studio Founder · Production Manager · Content Lead',
        tileLine: 'For Creative Teams with Broken Pipelines',
        tileTeaser: "Assets everywhere. Revisions messy. Delivery depends on people manually remembering everything.",
        heroHeadline: "Creative Work Deserves Better Pipelines.",
        heroSub: "Files are scattered. Approval chains are informal. Versions get confused. Your best creative people are slowed down by process stupidity.",
        painIntro: "Sound familiar?",
        painSignals: [
            "Approvals are a mess.",
            "We lose time chasing versions and feedback.",
            "Files are everywhere.",
            "Too much depends on manual coordination.",
            "Our production pipeline needs structure.",
        ],
        solutionHeadline: "Move faster without losing control of quality and delivery.",
        solutionBody: "We build smart production systems — asset tracking, approval workflows, content readiness dashboards, and archive structures — so creative teams can produce at speed without chaos.",
        proofPoints: [
            { label: "Fewer approval delays", desc: "Structured review flows that don't kill momentum." },
            { label: "Better asset tracking", desc: "Always know where every version lives." },
            { label: "Cleaner delivery", desc: "Hit deadlines with confidence, not panic." },
        ],
        ctaText: "Fix Your Production Pipeline",
    },
    {
        id: 'ai-adoption',
        slug: 'ai-adoption',
        icon: BrainCircuit,
        accentColor: '#10b981',
        title: 'The AI Adoption Sponsor',
        subtitle: 'Department Head · Innovation Lead · HR Lead · L&D Lead · Business Owner',
        tileLine: 'For Teams Adopting AI Properly',
        tileTeaser: "Your team knows AI matters but they're still dabbling with random prompts and no real process.",
        heroHeadline: "From Vague AI Interest to Practical Adoption.",
        heroSub: "People use random prompts with no process, no shared method, and no integration into actual work. You need practical AI use, not hype tourism.",
        painIntro: "Sound familiar?",
        painSignals: [
            "My team needs to use AI better.",
            "We want practical AI adoption, not theory.",
            "We need AI training tied to actual workflows.",
            "We don't know where to start.",
            "People are curious but inconsistent.",
        ],
        solutionHeadline: "Workflow-focused AI training and implementation.",
        solutionBody: "We help teams move from vague AI interest to practical adoption — through use-case mapping, workflow audits, team capability training, and implementation support that connects AI to real business output.",
        proofPoints: [
            { label: "Real use cases", desc: "AI applied to your actual processes, not generic demos." },
            { label: "Staff enablement", desc: "Your team learns by doing, with your data and workflows." },
            { label: "Workflow integration", desc: "AI embedded into how your business actually operates." },
        ],
        ctaText: "Start Your AI Adoption Plan",
    },
];

export function getPersonaBySlug(slug: string): PersonaData | undefined {
    return personas.find(p => p.slug === slug);
}
