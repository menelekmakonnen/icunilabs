import { Monitor } from 'lucide-react'

export interface DemoBenefit { title: string; desc: string }

export interface Demo {
  id: string
  title: string
  subtitle: string
  tagline: string
  description: string
  longDescription: string
  problemSolved: string
  coverImage: string
  url: string
  category: string
  features: string[]
  keyBenefits: DemoBenefit[]
  adaptableTo: string[]
  color: string
  fullDemo: boolean
}

// eslint-disable-next-line react-refresh/only-export-components -- data export alongside component is intentional
export const DEMOS: Demo[] = [
  {
    id: 'printshop',
    title: 'Print Office',
    subtitle: 'Production & Job Management',
    tagline: 'Stop losing jobs in the queue. Track every order from intake to delivery.',
    description: 'Complete back-office system for print shops — production queue, job tracking, invoice builder, expense management, and revenue analytics.',
    longDescription: 'A full production management system built for print offices that handle high volumes of custom jobs. From the moment a customer places an order to the final delivery, every step is tracked, every cost is logged, and every invoice is generated automatically. No more lost jobs, forgotten deadlines, or manual calculations.',
    problemSolved: 'Print shops lose revenue because jobs get lost between intake and delivery. Orders are tracked on paper or WhatsApp. Invoices are calculated manually. Nobody knows which jobs are profitable and which are eating into margins. The owner can\'t see what\'s happening without physically being in the shop.',
    coverImage: '/demo-printshop.webp',
    url: 'https://printshop.icuni.org',
    category: 'Manufacturing',
    features: ['Production Queue', 'Invoice Builder', 'Financial Analytics', 'Job Scheduling'],
    keyBenefits: [
      { title: 'Production Queue', desc: 'Visual job pipeline from intake to completion with priority sorting and deadline tracking.' },
      { title: 'Automated Invoicing', desc: 'Generate professional invoices from job specs. Track payments and outstanding balances.' },
      { title: 'Expense Tracking', desc: 'Log materials, labor, and overhead costs per job to see true profitability.' },
      { title: 'Revenue Dashboard', desc: 'Real-time financial overview — income, expenses, profit margins, and trends.' },
      { title: 'Job Scheduling', desc: 'Assign jobs to machines and operators with calendar-based scheduling.' },
      { title: 'Customer Records', desc: 'Complete customer history — past orders, preferences, payment behavior.' },
    ],
    adaptableTo: ['Signage & Banner Shops', 'Screen Printing Studios', 'Custom Merchandise', 'Copy & Document Centers', 'Engraving Services'],
    color: '#00bfff',
    fullDemo: false,
  },
  {
    id: 'construction',
    title: 'Construction Office',
    subtitle: 'Inventory & Project Tracking',
    tagline: 'Every bag of cement accounted for. Every delivery tracked. Every role connected.',
    description: 'Multi-role construction management — storekeeper, project manager, supplier, and head office views. Real-time stock tracking, concrete testing deadlines, material issuance.',
    longDescription: 'A multi-role construction management system where the storekeeper, project manager, supplier, and head office each have their own view — all connected in real time. Stock levels update automatically when materials are issued. Suppliers know when to send more. Project managers see everything without calling anyone.',
    problemSolved: 'Construction sites lose materials between delivery and usage. The storekeeper records on paper, the project manager relies on phone calls, and head office only finds out about shortages when it\'s too late. Suppliers over-deliver or under-deliver because nobody has accurate stock data.',
    coverImage: '/demo-construction.webp',
    url: 'https://key.icuni.org',
    category: 'Construction',
    features: ['Role-Based Views', 'Stock Tracking', 'Deadline Alerts', 'Issuance Trends'],
    keyBenefits: [
      { title: 'Role-Based Access', desc: 'Storekeeper, PM, Supplier, and Head Office each see exactly what they need.' },
      { title: 'Live Stock Tracking', desc: 'Real-time material quantities with automatic low-stock alerts.' },
      { title: 'Material Issuance Log', desc: 'Every item issued is logged — who took it, when, for which project section.' },
      { title: 'Concrete Testing Deadlines', desc: 'Automated reminders for cube testing schedules and compliance deadlines.' },
      { title: 'Supplier Integration', desc: 'Suppliers see stock levels and receive automated reorder notifications.' },
      { title: 'Head Office Dashboard', desc: 'Cross-project overview of spending, stock consumption, and project progress.' },
    ],
    adaptableTo: ['Mining Operations', 'Road & Civil Works', 'Electrical Installation Firms', 'Plumbing Contractors', 'Large-Scale Renovation Projects'],
    color: '#f59e0b',
    fullDemo: false,
  },
  {
    id: 'warehouse',
    title: 'Warehouse & Retail',
    subtitle: 'Stock & Outlet Management',
    tagline: 'Know exactly what you have, where it is, and where it\'s going.',
    description: 'Integrated warehouse operations — category-level stock management, internal allocations between outlets, retail sales tracking, and low-stock alerting.',
    longDescription: 'A warehouse-to-retail operations system that tracks inventory from the moment it enters the warehouse to the moment it leaves a retail outlet. Internal transfers between locations are logged, stock levels sync in real time, and the owner sees exactly which outlet is performing and which needs attention.',
    problemSolved: 'Businesses with multiple outlets don\'t know what stock they have, where it is, or how fast it\'s moving. Internal transfers between branches are untracked. The warehouse sends stock that the outlet didn\'t request, or the outlet runs out of bestsellers because nobody noticed.',
    coverImage: '/demo-warehouse.webp',
    url: 'https://mw.icuni.org',
    category: 'Retail & Logistics',
    features: ['Stock Categories', 'Internal Transfers', 'Outlet Sales', 'Activity Feed'],
    keyBenefits: [
      { title: 'Category Stock View', desc: 'Organize inventory by category with visual progress bars for stock levels.' },
      { title: 'Internal Transfers', desc: 'Track every allocation between warehouse and outlets with full audit trail.' },
      { title: 'Outlet Performance', desc: 'Compare sales across locations — identify top performers and underperformers.' },
      { title: 'Low-Stock Alerts', desc: 'Automatic notifications when any item drops below reorder threshold.' },
      { title: 'Activity Feed', desc: 'Real-time timeline of all stock movements, transfers, and adjustments.' },
      { title: 'Multi-Location Sync', desc: 'All branches see the same data in real time — no version conflicts.' },
    ],
    adaptableTo: ['Pharmacy Chains', 'Auto Parts Distributors', 'Agro Supply Chains', 'Cosmetics Distributors', 'Building Materials Shops'],
    color: '#8b5cf6',
    fullDemo: false,
  },
  {
    id: 'property',
    title: 'Property Office',
    subtitle: 'Portfolio & Tenant Management',
    tagline: 'Your entire property portfolio. One dashboard. Complete control.',
    description: 'Property management portfolio system — occupancy tracking, revenue dashboards, maintenance issue management, and property-by-property performance.',
    longDescription: 'A portfolio-level property management system that gives landlords and property managers complete visibility across all their properties. Occupancy rates, rental income, maintenance requests, and tenant records — all in one place. No more spreadsheets, no more forgotten maintenance calls, no more guessing which properties are profitable.',
    problemSolved: 'Property managers with multiple buildings track tenants in notebooks, collect rent via mobile money with no records, and forget maintenance requests until tenants leave. The owner has no idea which property is performing well and which is a liability.',
    coverImage: '/demo-property.webp',
    url: 'https://mobus.icuni.org',
    category: 'Real Estate',
    features: ['Portfolio Overview', 'Occupancy Rates', 'Maintenance Tracker', 'Revenue Reports'],
    keyBenefits: [
      { title: 'Portfolio Dashboard', desc: 'See all properties at a glance — occupancy, revenue, and maintenance status.' },
      { title: 'Occupancy Tracking', desc: 'Real-time occupancy rates per property with vacancy alerts.' },
      { title: 'Rent Collection', desc: 'Track payments, outstanding balances, and payment history per tenant.' },
      { title: 'Maintenance Queue', desc: 'Log, assign, and track repair requests with priority and status.' },
      { title: 'Tenant Records', desc: 'Complete tenant profiles — lease terms, contact info, payment behavior.' },
      { title: 'Revenue Analytics', desc: 'Property-by-property profitability, income trends, and expense breakdowns.' },
    ],
    adaptableTo: ['Hotel Management', 'Co-Working Spaces', 'Student Housing', 'Serviced Apartments', 'Estate Management Companies'],
    color: '#eab308',
    fullDemo: true,
  },
  {
    id: 'blockfactory',
    title: 'Block Factory',
    subtitle: 'Production & Financial Ops',
    tagline: 'Every block produced, every cedi tracked, every loss visible.',
    description: 'Block manufacturing operations — production metrics, net profit tracking, inventory loss monitoring, and automated reorder alerts.',
    longDescription: 'A production and financial operations system for block manufacturers. Track daily production output, monitor raw material consumption, catch inventory losses before they become crises, and see your real net profit — not the number you hope for. Built for factory owners who want to know exactly where their money goes.',
    problemSolved: 'Block factory owners know they\'re producing blocks but can\'t tell you exactly how many, at what cost, or with how much waste. Raw materials disappear between delivery and production. The profit they calculate in their head doesn\'t match the money in the bank.',
    coverImage: '/demo-blockfactory.webp',
    url: 'https://blockops-theta.vercel.app',
    category: 'Manufacturing',
    features: ['Production Metrics', 'Profit Tracking', 'Loss Monitoring', 'Reorder Alerts'],
    keyBenefits: [
      { title: 'Production Dashboard', desc: 'Daily, weekly, and monthly production volumes with trend analysis.' },
      { title: 'Net Profit Tracking', desc: 'Real revenue minus real costs — materials, labor, overhead, transport.' },
      { title: 'Inventory Loss Detection', desc: 'Compare expected vs actual material usage to spot waste and theft.' },
      { title: 'Reorder Alerts', desc: 'Automated notifications when cement, sand, or aggregate runs low.' },
      { title: 'Cost Per Block', desc: 'Know exactly how much each block costs to produce, including hidden expenses.' },
      { title: 'Financial Reports', desc: 'Exportable reports for accounting, tax, and business planning.' },
    ],
    adaptableTo: ['Bakeries & Food Production', 'Furniture Workshops', 'Paving & Tile Factories', 'Soap & Detergent Manufacturing', 'Any Batch Manufacturing'],
    color: '#22c55e',
    fullDemo: true,
  },
  {
    id: 'swimschool',
    title: 'Swim School',
    subtitle: 'Sessions & Enrollment',
    tagline: 'Manage sessions, track students, and grow enrollment — without the paperwork.',
    description: 'Aquatic academy management — session scheduling, attendance tracking, student enrollment, and revenue monitoring.',
    longDescription: 'A session-based management system for swim schools and similar academies. Schedule classes, track attendance, manage student enrollment, monitor instructor utilization, and see your revenue in real time. Parents get progress updates. Instructors get their schedules. You get complete visibility into your academy\'s performance.',
    problemSolved: 'Swim school owners manage classes in notebooks, track attendance on paper, and calculate revenue manually. They can\'t tell which time slots are underbooked, which instructors are overloaded, or which students haven\'t paid. Parents call constantly asking about schedules and progress.',
    coverImage: '/demo-swimschool.webp',
    url: 'https://aquaflow.icuni.org',
    category: 'Education',
    features: ['Session Scheduler', 'Attendance Rate', 'Enrollment Tracker', 'Revenue MTD'],
    keyBenefits: [
      { title: 'Session Scheduling', desc: 'Visual calendar with class types, instructor assignments, and capacity limits.' },
      { title: 'Attendance Tracking', desc: 'Mark attendance per session with historical trends and absence alerts.' },
      { title: 'Student Profiles', desc: 'Enrollment history, skill level, emergency contacts, and payment status.' },
      { title: 'Revenue Dashboard', desc: 'Month-to-date income, payment collection rates, and outstanding fees.' },
      { title: 'Instructor Management', desc: 'Track instructor schedules, utilization rates, and class assignments.' },
      { title: 'Parent Communication', desc: 'Automated progress updates and schedule notifications.' },
    ],
    adaptableTo: ['Yoga & Fitness Studios', 'Tutoring Centers', 'Driving Schools', 'Dance Academies', 'Martial Arts Dojos', 'Music Schools', 'After-School Programs'],
    color: '#06b6d4',
    fullDemo: true,
  },
  {
    id: 'momo-finance',
    title: 'MoMo Finance',
    subtitle: 'Transaction Tracing & Reconciliation',
    tagline: 'Every send, receive, and cash-out — traced, reconciled, and accounted for.',
    description: 'Transaction management for mobile money vendors and cash-heavy businesses — daily logging, auto-reconciliation against provider statements, agent performance, and discrepancy detection.',
    longDescription: 'A transaction-tracing system built specifically for MoMo vendors, microfinance operators, and cash-heavy businesses. Log every transaction as it happens. Reconcile against MTN or Vodafone statements automatically. Spot discrepancies instantly. Know your actual daily profit — not the number in your head. Built for operators who process hundreds of transactions daily and need to trust their numbers.',
    problemSolved: 'MoMo vendors and small financial operators track transactions in notebooks or not at all. End-of-day balancing never matches. They suspect agents are skimming but have no proof. They can\'t trace a specific transaction from last week without flipping through pages. They want to grow to multiple points but can\'t manage what they can\'t see.',
    coverImage: '/demo-momo.webp',
    url: '',
    category: 'Financial Services',
    features: ['Transaction Log', 'Auto-Reconciliation', 'Agent Tracking', 'Discrepancy Alerts'],
    keyBenefits: [
      { title: 'Transaction Logging', desc: 'Every send, receive, cash-in, and cash-out logged with timestamp and agent.' },
      { title: 'Auto-Reconciliation', desc: 'Match your records against MTN/Vodafone statements to find every discrepancy.' },
      { title: 'Agent Performance', desc: 'Track transaction volumes and accuracy per agent or point of sale.' },
      { title: 'Daily Profit Dashboard', desc: 'Real-time view of commissions earned, float deployed, and actual profit.' },
      { title: 'Discrepancy Alerts', desc: 'Automatic flags when records don\'t match — no more end-of-day surprises.' },
      { title: 'Multi-Point Management', desc: 'Manage multiple vendor points from one dashboard with per-location breakdown.' },
    ],
    adaptableTo: ['Forex Bureaux', 'Savings & Loans', 'Susu Collectors', 'Mobile Banking Agents', 'Cash Collection Businesses'],
    color: '#06d6a0',
    fullDemo: false,
  },
]

// Category SVG icons
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const cls = className || 'w-4 h-4'
  switch (category) {
    case 'Manufacturing':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M5 21V7l7-4v18M12 21V3l7 4v14" strokeLinecap="round" strokeLinejoin="round"/><rect x="8" y="10" width="2" height="2" rx="0.5"/><rect x="8" y="14" width="2" height="2" rx="0.5"/><rect x="15" y="10" width="2" height="2" rx="0.5"/><rect x="15" y="14" width="2" height="2" rx="0.5"/></svg>
    case 'Construction':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 20h20M6 20V10l6-6 6 6v10" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 20v-6h4v6" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 10h6" strokeLinecap="round"/></svg>
    case 'Retail & Logistics':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2" strokeLinecap="round"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/></svg>
    case 'Real Estate':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    case 'Education':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3L2 9l10 6 10-6-10-6z" strokeLinejoin="round"/><path d="M20 9v7" strokeLinecap="round"/><path d="M6 12v5c0 2.5 3 4 6 4s6-1.5 6-4v-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'Financial Services':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" strokeLinejoin="round"/><path d="M12 22V12" strokeLinecap="round"/><path d="M3 7l9 5 9-5" strokeLinejoin="round"/><circle cx="12" cy="12" r="2"/></svg>
    default:
      return <Monitor className={cls} />
  }
}
