import { useState, useEffect, useRef, useMemo } from 'react'
import { adminActions, useAdminStore } from '../../store/useAdminStore'
import { X, Check, ChevronDown, ChevronUp, Phone, ArrowRight, BookOpen } from 'lucide-react'
import './call-guide.css'

// ═══ TYPES ═══
interface DataField { id: string; label: string; type: 'text' | 'number' | 'textarea' | 'select' | 'datetime-local'; options?: string[]; suggestions?: string[] }

interface ScriptResponse { label: string; text: string }

interface TalkingPoint {
  id: string
  label: string
  script?: string
  scriptNote?: string
  responses?: ScriptResponse[]
  dataFields?: DataField[]
}

interface PathDef {
  label: string
  color: string
  points: TalkingPoint[]
}

// ═══ PATH DEFINITIONS — v3.0 (May 2026) ═══
const PATHS: Record<string, PathDef> = {
  wc_receptionist: {
    label: 'WC Receptionist', color: '#8b5cf6',
    points: [
      {
        id: 'intro', label: 'Greet warmly — ask their name',
        script: 'Good {{time_of_day}}. My name is {{user_name}}, {{user_title}} at ICUNI Labs. May I ask who I\'m speaking with?',
        dataFields: [{ id: 'receptionist_name', label: 'Receptionist Name', type: 'text' }],
      },
      {
        id: 'got_name', label: 'Thank them — state research purpose',
        script: '{{receptionist_name}}, thank you so much for taking the time to speak with me today — I really appreciate it. We\'re running a research project on the operations systems that {{industry}} companies use, and we\'d like to include your company. Could I speak to your operations manager for just two minutes?',
        scriptNote: 'Use their name warmly. Genuine gratitude builds immediate rapport and makes transfer more likely.',
      },
      {
        id: 'if_yes', label: 'If yes — get transferred',
        scriptNote: 'Thank them by name. Ask who you\'ll be speaking to. Get transferred. Switch to "WC Decision-Maker" path.',
        responses: [
          { label: '✅ Transferring now', text: 'Thank you so much, {{receptionist_name}}. Who will I be speaking with? … Great, thank you.' },
        ],
      },
      {
        id: 'if_unavailable', label: 'If unavailable — get callback time',
        script: 'No worries at all. When would be a good time to reach them? … If I call back at that time, would they be available? … Great. My name is {{user_name}} from ICUNI Labs. Thank you so much for your help, {{receptionist_name}}.',
        scriptNote: 'Log the callback time. Set your SLA timer. Call back at exactly that time.',
        dataFields: [{ id: 'callback_datetime', label: 'Callback Date/Time', type: 'datetime-local' }],
      },
      {
        id: 'if_refused', label: 'If refused — offer to email first',
        script: 'I completely understand. It\'s a two-minute research call and we\'re genuinely gathering useful data on how companies in your industry manage their operations. If it helps, I\'m happy to send a brief email first so they know to expect the call. What email address should I use?',
        scriptNote: 'This gives you a direct email to the manager, which is often more valuable than the phone transfer.',
        dataFields: [{ id: 'manager_email', label: 'Manager Email', type: 'text' }],
      },
      {
        id: 'receptionist_answered', label: 'If receptionist wants to answer — engage then escalate',
        script: '{{receptionist_name}}, that\'s really helpful — let me ask you a few questions then.',
        scriptNote: 'Start with easy questions. Escalate difficulty until they defer upward.',
        responses: [
          { label: '↗️ Escalate to manager', text: 'I really appreciate you helping, {{receptionist_name}}, but I wouldn\'t want to put you on the spot answering for the manager\'s department — these are really questions only they can answer properly, and I only need about two minutes of their time. Can you please check for me, {{receptionist_name}}?' },
        ],
        dataFields: [
          { id: 'rc_system_name', label: 'Q1: Do you use a system for operations? Which one?', type: 'text' },
          { id: 'rc_system_type', label: 'Q1b: Is it custom-built or off-the-shelf?', type: 'select', options: ['custom', 'off_shelf', 'none', 'unsure'] },
          { id: 'rc_reporting_time', label: 'Q2: How much time does the manager spend on reporting/reconciliation?', type: 'text' },
        ],
      },
    ]
  },

  wc_decision_maker: {
    label: 'WC Decision-Maker', color: '#00bfff',
    points: [
      {
        id: 'confirm_name', label: 'Confirm name — thank them',
        script: 'Hello, may I ask who I\'m speaking with? … {{name}}, thank you so much for taking the time to speak with me today — I genuinely appreciate it.',
        scriptNote: 'If transferred from the receptionist, confirm the name you were given. If they answer directly, ask first.',
        dataFields: [{ id: 'dm_name', label: 'Decision-Maker Name', type: 'text' }],
      },
      {
        id: 'positioned_expert', label: 'Positioned them as the expert',
        script: 'Like I explained earlier to {{receptionist_name}}, I am the {{user_title}} at ICUNI Labs and we are running a research on business operations systems for your department specifically. It would only take two minutes, and your expertise would really help us here.',
      },
      {
        id: 'asked_system', label: 'Q1: Current system',
        script: 'Do you use a business operations system for your {{contact_role}} department?',
        scriptNote: 'Replace {{contact_role}} with their specific role (e.g. operations, logistics, finance). If unknown, just say "your department."',
        dataFields: [
          { id: 'system_name', label: 'System Name', type: 'text' },
          { id: 'system_type', label: 'System Type', type: 'select', options: ['custom', 'off_shelf', 'none'] },
          { id: 'system_cost', label: 'System Cost (if known)', type: 'text' },
        ],
        responses: [
          { label: '✅ Yes — has a system', text: 'Thank you. Is it a custom-built for you or off the shelf? … What\'s the system called? … Do you know what it cost?' },
          { label: '❌ No system', text: 'I see. So, does that mean you use Excel and WhatsApp for your operations?' },
        ],
      },
      {
        id: 'asked_problem', label: 'Q2: Most expensive problem',
        script: 'This is mostly based on your experience and expertise. What would you say is the most expensive problem, or most time-consuming workflow, your company deals with?',
        dataFields: [{
          id: 'problem_description', label: 'Problem Description', type: 'textarea',
          suggestions: ['Manual reporting', 'Stock discrepancies', 'Payment reconciliation', 'Staff coordination', 'Client follow-ups', 'Order management'],
        }],
      },
      {
        id: 'put_number', label: 'Q3: Put a number on it',
        script: 'Roughly how much does that cost you per month — in cedis or in hours?',
        scriptNote: 'Get a specific number. They can give it per day, week, month, or year — the Pain Point Calculator below converts it all to monthly and annual for you.',
      },
      {
        id: 'run_calculation', label: 'Q3b: Run back the calculation',
        script: 'So if I understand correctly, if it {{cost_example}}, that means each {{cost_period}} you {{cost_summary}}.',
        scriptNote: 'Run their number back to them. Example: "if it takes one person three days, or costs you 10,000 cedis per recruitment, that means each month you spend/lose this amount." The Pain Point Calculator auto-fills the math.',
      },
      {
        id: 'read_energy', label: 'Read their energy',
        scriptNote: 'After 3-4 questions, read their tone. Engaged and talkative → PIVOT. Short answers → finish research, exit warm.',
        responses: [
          { label: '💬 Strong engagement → PIVOT', text: 'They\'re opening up, sharing specifics. Go to the PIVOT now.' },
          { label: '⏱️ Low engagement', text: '"It\'s manageable." Do NOT push. Finish research, exit warmly.' },
        ],
      },
      {
        id: 'pivot', label: 'THE PIVOT — "We\'ve solved that"',
        script: 'That\'s actually something we\'ve solved for businesses in similar positions. We could probably solve it for you too.',
        scriptNote: 'If they ask "can it do X?" — the answer is YES. Let interest build, then push for meeting.',
        responses: [
          { label: '🔥 Asking questions', text: 'Yes, we can do that. [Let interest build, then close the meeting.]' },
          { label: '😐 Not biting', text: 'Continue research. You\'ll get a second push at the end.' },
        ],
      },
      {
        id: 'current_system_helps', label: 'Q4: Does current system help?',
        script: 'So, can I ask — does your current system help you with that specific problem?',
        scriptNote: 'Use this version if they said they HAVE a system. If they said they DON\'T have a system, use the "No system" response below instead.',
        responses: [
          { label: '❌ No / Not really', text: 'That\'s what we hear a lot. → PIVOT if not already done.' },
          { label: '🚫 No system (ask this instead)', text: 'Do you think a business operations system could solve this problem? → If they ask HOW, PIVOT.' },
          { label: '✅ Yes it helps', text: 'Continue to dream system question.' },
        ],
      },
      {
        id: 'snap_fingers', label: 'Q5: Dream system',
        script: 'If you could snap your fingers and get a system that made your job easier, what would it do?',
        dataFields: [{ id: 'dream_system', label: 'Dream System Description', type: 'textarea' }],
      },
      {
        id: 'push_meeting', label: 'Close — 15-min conversation',
        script: 'I really think you should talk to our team properly. We are notorious for solving pretty much every type of business operations problem. Can I arrange a 15-minute conversation where we listen to the full problem and brainstorm a solution together? If you like what you hear, we\'ll build it. If not, you\'ve spent 15 minutes on a problem that\'s costing you {{annual_cost}} a year. Do you prefer in person or Google Meet on {{day}} at {{time}}?',
        scriptNote: 'For Professionals: "conversation" or "brainstorm," NEVER "demo." Treat them as a peer.',
      },
      {
        id: 'second_push', label: 'Second push — reframe their number',
        script: 'You mentioned your problem costs you around {{cost_summary}}. What if I told you we could build a system that solves exactly that? It would be worth a 15-minute conversation — in person or Google Meet — to talk it through. No strings. If you like it, we build it. If not, at least you know we\'re here.',
        scriptNote: 'Only use if the mid-research pivot didn\'t land. This is your final attempt.',
      },
      {
        id: 'warm_exit', label: 'Warm exit — offer research results',
        script: 'This has been really helpful, thank you. Would it be alright if I shared the results of our research with you once it\'s done? … Great — what\'s the best email for you?',
        scriptNote: 'Even with no meeting, you leave with a warm lead. Capture everything.',
        dataFields: [
          { id: 'dm_email', label: 'Email Address', type: 'text' },
          { id: 'dm_direct_phone', label: 'Direct Phone (if offered)', type: 'text' },
        ],
      },
    ]
  },

  bc_front_desk: {
    label: 'BC Front Desk', color: '#f59e0b',
    points: [
      {
        id: 'greet_name', label: 'Greet warmly — ask their name',
        script: 'Hello, good {{time_of_day}}. My name is {{user_name}} from ICUNI Labs. May I ask who I\'m speaking with?',
        scriptNote: 'Start warm — front desk staff deserve the same respect as any professional. A good first impression opens doors.',
        dataFields: [{ id: 'frontdesk_name', label: 'Front Desk Name', type: 'text' }],
      },
      {
        id: 'thank_and_ask', label: 'Thank them — ask about owner',
        script: '{{frontdesk_name}}, thank you so much for taking the time to talk to me today — I really appreciate it. I was hoping to have a quick word with the owner. When are they usually around? Would it be better to call or come in person?',
        scriptNote: 'The front desk will resist connecting to the owner. Accept this gracefully.',
        dataFields: [
          { id: 'boss_available', label: 'Boss Available When', type: 'text' },
          { id: 'contact_method', label: 'Preferred Method', type: 'select', options: ['phone', 'in_person'] },
        ],
      },
      {
        id: 'asked_floor_mgr', label: 'Ask to speak to floor manager',
        script: 'That\'s really helpful, thank you. In the meantime, would it be possible to speak to the manager on duty for just two minutes?',
        scriptNote: 'You now have a scheduled attempt for the boss AND immediate access to Mr Cooper.',
      },
      {
        id: 'connected_owner', label: 'If connected to owner — pivot',
        scriptNote: 'Switch to "BC Owner" using the escalation dropdown in the header.',
      },
    ]
  },

  bc_mr_cooper: {
    label: 'BC Mr Cooper', color: '#ff7a00',
    points: [
      {
        id: 'confirm_name', label: 'Greet — confirm name — thank them',
        script: 'Hello, may I ask who I\'m speaking with? … {{name}}, thank you so much for taking the time to speak with me today — I really appreciate it. I\'m {{user_name}} from ICUNI Labs.',
        scriptNote: 'Always lead with warmth — Mr Cooper is your future advocate.',
        dataFields: [{ id: 'cooper_name', label: 'Manager Name', type: 'text' }],
      },
      {
        id: 'position_expertise', label: 'Position their expertise',
        script: 'We build business operations systems. I believe you have a lot of expertise in your industry and I just have a couple of quick questions about how things run at your {{company}}.',
        scriptNote: 'Frame everything around making THEIR job easier. Never mention theft, lost money, or accountability.',
      },
      {
        id: 'most_time', label: 'Q1: What wastes the most time?',
        script: 'In your opinion, what wastes the most time in your day at your company?',
        dataFields: [{
          id: 'time_sink', label: 'Biggest Time Sink', type: 'text',
          suggestions: ['Stock counting', 'Reporting', 'Reconciliation', 'Staff scheduling', 'Order processing', 'Customer follow-ups'],
        }],
      },
      {
        id: 'most_frustrating', label: 'Q2: Most frustrating workflow',
        script: 'What\'s the most frustrating part of your workflow at your company?',
        dataFields: [{
          id: 'frustration', label: 'Key Frustration', type: 'text',
          suggestions: ['Stock disappearing', 'Cash/MoMo reconciliation', 'Manual processes', 'Staff tracking', 'Delivery coordination'],
        }],
      },
      {
        id: 'most_expensive', label: 'Q3: Most expensive problem',
        script: 'Do you know the most expensive problem that your company has to deal with?',
        dataFields: [{ id: 'expensive_problem', label: 'Most Expensive Problem', type: 'textarea' }],
      },
      {
        id: 'system_usage', label: 'Q4: System usage',
        script: 'Do you use any system to manage orders, stock, deliveries, or client follow-ups that help with any of those problems?',
        dataFields: [{ id: 'system_used', label: 'System Used', type: 'text' }],
      },
      {
        id: 'challenge', label: 'The challenge — demo together',
        script: 'We\'ve built systems for businesses just like yours that handle {{frustration}}. I would like to come and show you what we\'ve got. Would it be possible for us to come in when the boss is available and show both of you together? That way you can see it first-hand and decide together.',
        scriptNote: 'This makes Mr Cooper the hero who brought the solution. The owner trusts Mr Cooper\'s judgment.',
      },
    ]
  },

  bc_owner: {
    label: 'BC Owner/Trader', color: '#ef4444',
    points: [
      {
        id: 'greet_owner', label: 'Greet — ask their name',
        script: 'Good {{time_of_day}}, this is {{user_name}} from ICUNI Labs. Can I take your name please?',
        dataFields: [{ id: 'owner_name', label: 'Owner Name', type: 'text' }],
      },
      {
        id: 'thank_and_hook', label: 'Thank them — Tema Harbour hook',
        script: '{{name}}, thank you so much for taking the time to talk to me today. Quick question — have you heard about what happened at Tema Harbour with the AI?',
        scriptNote: 'Let them respond. Yes, no, or "what happened?" All reactions hook them in.',
      },
      {
        id: 'key_number', label: 'Key number: GH₵1.2 billion',
        script: 'They brought in an AI system for customs. A job that used to take two hours per declaration now takes five minutes. And in the first two weeks, they recovered an extra one point two billion cedis that was going missing. One point two billion. In two weeks.',
        scriptNote: 'Pause. Let them react. Acknowledge whatever they give you.',
      },
      {
        id: 'connected_back', label: 'What we do — phone access',
        script: 'Here is why I called. We build systems like that for businesses here in Accra — print shops, supermarkets, warehouses. The system shows you everything from your phone no matter where you are: what comes in, what goes out, where your money is, what your staff are doing. You do not have to be at the shop every day to know what is happening.',
      },
      {
        id: 'drop_by', label: 'The close — 10-minute drop-by',
        script: 'You know what, let us just come by. We will be in your area on {{day}} anyway. We will come by with a laptop around {{time}} and show you what we built for a business like yours — takes about ten minutes. If you like it, we talk. If you don\'t, no problem, we leave. Sound okay?',
        scriptNote: '✓ Magic words: "in your area anyway," "ten minutes," "if you don\'t like it we leave." Founder does the drop-by.',
      },
      {
        id: 'already_have_system', label: 'If they have a system — probe',
        script: 'Oh, that\'s great. What system do you use? And who built it for you?',
        responses: [
          { label: '📱 Phone access', text: 'Does it handle seeing everything from your phone?' },
          { label: '💰 Subscription?', text: 'Quick question — do you pay for it every month, or is it yours?' },
          { label: '🔄 Ownership pitch', text: 'Interesting. When we build, it is yours for life — you pay once and you own it, no monthly fees. If you ever want to compare, we would happily show you. Could we drop by for ten minutes tomorrow?' },
        ],
        dataFields: [
          { id: 'competitor_system', label: 'Competitor System', type: 'text' },
          { id: 'competitor_developer', label: 'Developer Name', type: 'text' },
          { id: 'competitor_monthly_cost', label: 'Monthly Cost (if known)', type: 'number' },
        ],
      },
      {
        id: 'not_interested', label: 'If not interested — exit warm',
        script: 'No problem at all — honestly refreshing to hear things are running smoothly. Quick thing before I go: what system do you use, and who built it? … Thank you. And if you ever know someone who needs a system, please point them our way — we are the best people for it. Thanks for your time, {{name}}.',
        scriptNote: 'Short, gracious. Get competitor info and ask for referral. No begging.',
        dataFields: [
          { id: 'competitor_system_exit', label: 'Competitor System', type: 'text' },
          { id: 'referral_info', label: 'Any referral given?', type: 'text' },
        ],
      },
    ]
  },
}

// ═══ REFERENCE DATA — v3.0 ═══
const KEY_DATA_POINTS = [
  { stat: '63% of businesses run manually', use: 'Prospect says "we\'re fine without a system"' },
  { stat: 'GH₵1.2 billion recovered in 2 weeks', use: 'Trader opener (Tema Harbour hook)' },
  { stat: '2 hours → 5 minutes review time', use: 'Anyone asks how a system saves time' },
  { stat: '23% margin increase in 4 months', use: 'Prospect asks "what results have you seen?"' },
  { stat: 'Stock loss cut within 60 days', use: 'Prospect\'s pain is shrinkage / stock variance' },
  { stat: '4–12 months ROI for basic systems', use: 'Prospect asks "how long before this pays off?"' },
  { stat: 'Pay once, own forever', use: 'Prospect mentions paying monthly for current system' },
]

const OBJECTION_HANDLERS: Record<string, string> = {
  'We already have a system': 'Ask what it\'s called and who built it (log it). Ask if it does the things they care about. Recovery: "Do you pay monthly, or is it yours?" If monthly: "When we build, it\'s yours for life, no monthly fees." Multiply their monthly fee by 3 years to show what renting really costs.',
  'How much does it cost?': 'Never price on a cold call. "It depends on what your business needs — we build custom, so pricing is based on what we build for you. That\'s exactly why a quick conversation helps: once we understand your setup, we give you an honest number. No commitment."',
  'Send me an email': 'Usually means "go away," but take the email. Ask for the right person\'s name. Send a short message with the relevant link, then follow up with a call 2 days later referencing it.',
  'I\'m not interested': 'Respect it immediately. Get competitor info, ask for a referral, exit warm. "Completely understand. If anything changes, you have us. And if you know anyone who needs a system, point them our way." No begging.',
  'What do you even do?': '"We build operations systems that help companies like yours track stock, orders, finances, and employees all in one place. But I\'m actually calling to learn how you do things, not to pitch you."',
  'Why should I trust you?': '"A Kumasi retailer saw 23% margin increase in 4 months. A pharmacy cut stock loss within 60 days. And the Tema Harbour AI — same principle — recovered 1.2 billion cedis in 2 weeks. Happy to show you, free, so you can judge for yourself."',
}

const COMPETITORS = [
  { name: 'JFSyncPOS', gap: 'Strong POS, no deep custom workflows', cost: 'GH₵99–499/mo' },
  { name: 'CliqPOS', gap: 'Good branch dashboards, no delivery or custom automation', cost: 'GH₵199–799/mo' },
  { name: 'Webhuk ERP', gap: 'Ghana tax logic, less established track record', cost: 'Quote-based' },
  { name: 'Odoo', gap: 'Full ERP but implementations often stall on unused modules', cost: 'GH₵284–559/mo' },
  { name: 'ERPNext', gap: 'Needs technical partner for setup', cost: 'GH₵160–1,233/mo' },
  { name: 'Zoho Inventory', gap: 'Custom flows need partner work', cost: 'GH₵331–2,843/mo' },
  { name: 'Business Central', gap: 'Expensive; needs existing discipline', cost: 'GH₵913/user/mo' },
  { name: 'SAP Business One', gap: 'Partner-led project, high cost', cost: 'Quote-based' },
]

// ═══ PAIN POINT PRESETS ═══
type PainUnit = 'cedis' | 'hours' | 'days'
type PainFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface PainPreset {
  id: string
  label: string
  icon: string
  category: 'money' | 'time'
  defaultUnit: PainUnit
  defaultFreq: PainFreq
  hint: string
}

const PAIN_PRESETS: PainPreset[] = [
  // Money-based pain points
  { id: 'stock_shrinkage', label: 'Stock shrinkage / theft', icon: '📦', category: 'money', defaultUnit: 'cedis', defaultFreq: 'monthly', hint: 'How much stock goes missing or unaccounted for?' },
  { id: 'cash_reconciliation', label: 'Cash & MoMo reconciliation errors', icon: '💳', category: 'money', defaultUnit: 'cedis', defaultFreq: 'weekly', hint: 'How much is unaccounted for when you reconcile?' },
  { id: 'overpurchasing', label: 'Overpurchasing / duplicate orders', icon: '🔄', category: 'money', defaultUnit: 'cedis', defaultFreq: 'monthly', hint: 'Extra spent on redundant or excess orders?' },
  { id: 'lost_sales', label: 'Lost sales / missed orders', icon: '📉', category: 'money', defaultUnit: 'cedis', defaultFreq: 'weekly', hint: 'Revenue lost from stockouts or missed customer orders?' },
  { id: 'customer_churn', label: 'Customer churn / poor follow-up', icon: '👋', category: 'money', defaultUnit: 'cedis', defaultFreq: 'monthly', hint: 'Revenue lost from clients who left?' },
  { id: 'delivery_issues', label: 'Late deliveries / penalties', icon: '🚚', category: 'money', defaultUnit: 'cedis', defaultFreq: 'weekly', hint: 'Fines, refunds, or lost goodwill from late deliveries?' },
  { id: 'system_subscription', label: 'Current system subscription', icon: '💸', category: 'money', defaultUnit: 'cedis', defaultFreq: 'monthly', hint: 'How much do you pay per month for your current system?' },
  // Time-based pain points
  { id: 'manual_stock_count', label: 'Manual stock counting', icon: '📋', category: 'time', defaultUnit: 'hours', defaultFreq: 'weekly', hint: 'Hours spent physically counting stock?' },
  { id: 'whatsapp_reporting', label: 'WhatsApp & phone-based reporting', icon: '📱', category: 'time', defaultUnit: 'hours', defaultFreq: 'daily', hint: 'Time spent gathering reports via WhatsApp/calls?' },
  { id: 'manual_reconciliation', label: 'Manual reconciliation', icon: '🧮', category: 'time', defaultUnit: 'hours', defaultFreq: 'weekly', hint: 'Hours spent reconciling cash, MoMo, and bank?' },
  { id: 'staff_scheduling', label: 'Staff scheduling & attendance', icon: '👥', category: 'time', defaultUnit: 'hours', defaultFreq: 'weekly', hint: 'Time managing rotas, attendance, and shift changes?' },
  { id: 'order_processing', label: 'Order processing & tracking', icon: '📝', category: 'time', defaultUnit: 'hours', defaultFreq: 'daily', hint: 'Hours processing and tracking customer orders?' },
  { id: 'branch_visits', label: 'Branch visits for oversight', icon: '🏪', category: 'time', defaultUnit: 'hours', defaultFreq: 'weekly', hint: 'Time traveling to branches just to check on things?' },
  { id: 'invoice_prep', label: 'Invoice & receipt preparation', icon: '🧾', category: 'time', defaultUnit: 'hours', defaultFreq: 'weekly', hint: 'Time creating invoices, receipts, or quotes manually?' },
  { id: 'chasing_payments', label: 'Chasing payments & follow-ups', icon: '📞', category: 'time', defaultUnit: 'hours', defaultFreq: 'daily', hint: 'Time calling customers for overdue payments?' },
]

const FREQ_MULTIPLIERS: Record<PainFreq, number> = {
  daily: 22,     // working days per month
  weekly: 4.33,  // weeks per month
  monthly: 1,
  yearly: 1 / 12,
}

const FREQ_LABELS: Record<PainFreq, string> = {
  daily: '/day', weekly: '/week', monthly: '/month', yearly: '/year',
}

const SELF_IMAGE_SIGNALS = {
  before: [
    { signal: 'Website', professional: 'Polished, About section, mission content', trader: 'No website or basic Facebook page' },
    { signal: 'Branding', professional: 'Branded, consistent visual identity', trader: 'Hand-painted or simple signage' },
    { signal: 'Business Name', professional: 'Company-style name and logo', trader: 'Name-as-brand ("Auntie Akua\'s")' },
    { signal: 'Locations', professional: 'Multiple branches, consistent branding', trader: 'Single location' },
    { signal: 'Titles', professional: 'CEO, Director, Founder', trader: 'Owner, "I run the shop"' },
    { signal: 'Contact', professional: 'Email, website, team page', trader: 'Just a phone number' },
  ],
  during: [
    { signal: 'Phone answer', professional: '"Good afternoon, how can I help?"', trader: '"Hello?" / "Yes?"' },
    { signal: 'Identity', professional: 'Identifies by name or title', trader: 'Asks "what is this about?"' },
    { signal: 'First 30 seconds', professional: 'Open to conversation', trader: 'Impatient, wants the point' },
  ],
}

const PIVOT_SCRIPTS = {
  professional_to_trader: "Let me get to the point \u2014 have you heard about what happened at Tema Harbour with the AI?",
  trader_to_professional: "Actually, let me ask \u2014 how do you currently manage your operations?",
}

function computeSelfImage(presence: string, titles: string, envType: string): 'professional' | 'trader' | 'unsure' {
  if (presence === 'yes' && titles === 'yes') return 'professional'
  if (presence === 'no' && titles === 'no') return 'trader'
  if (presence === 'yes' || titles === 'yes') return 'professional'
  if (envType === 'white_collar') return 'professional'
  if (envType === 'blue_collar') return 'trader'
  return 'unsure'
}

// ═══ UTILITIES ═══
const OUTCOMES: { id: string; label: string; desc: string; hasDatetime?: boolean; hasDate?: boolean; hasNotes?: boolean }[] = [
  { id: 'meeting_booked', label: 'Meeting Booked', desc: 'Date/time confirmed', hasDatetime: true },
  { id: 'dropby_booked', label: 'Drop-By Booked', desc: 'Founder will visit', hasDatetime: true },
  { id: 'callback_scheduled', label: 'Callback Scheduled', desc: 'Call back at agreed time', hasDatetime: true },
  { id: 'interested_will_revert', label: 'Interested — Will Revert', desc: 'They\'ll get back to us', hasNotes: true },
  { id: 'warm_lead', label: 'Warm Lead — Research Share', desc: 'Got their details, will share research', hasNotes: true, hasDate: true },
  { id: 'no_interest', label: 'No Interest — Logged', desc: 'Graceful close' },
  { id: 'disqualified_early', label: 'Disqualified — Early Exit', desc: 'Energy was dead, exited cleanly' },
]

const PERSONAS: Record<string, { id: string; label: string; pathId: string }[]> = {
  white_collar: [
    { id: 'receptionist', label: 'Receptionist', pathId: 'wc_receptionist' },
    { id: 'buyer_manager', label: 'Buyer-Manager (Decision-Maker)', pathId: 'wc_decision_maker' },
  ],
  blue_collar: [
    { id: 'front_desk', label: 'Front Desk', pathId: 'bc_front_desk' },
    { id: 'mr_cooper', label: 'Mr Cooper (Floor Manager)', pathId: 'bc_mr_cooper' },
    { id: 'owner', label: 'Owner / Trader', pathId: 'bc_owner' },
  ],
  hybrid: [
    { id: 'receptionist', label: 'Receptionist (WC)', pathId: 'wc_receptionist' },
    { id: 'buyer_manager', label: 'Buyer-Manager (WC)', pathId: 'wc_decision_maker' },
    { id: 'front_desk', label: 'Front Desk (BC)', pathId: 'bc_front_desk' },
    { id: 'mr_cooper', label: 'Mr Cooper (BC)', pathId: 'bc_mr_cooper' },
    { id: 'owner', label: 'Owner (BC)', pathId: 'bc_owner' },
  ],
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function resolveScript(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key]
    if (val) return val
    return `⟨${key.replace(/_/g, ' ')}⟩`
  })
}

function formatCurrency(n: number): string {
  if (!n || isNaN(n)) return ''
  return 'GH₵' + n.toLocaleString('en-GH', { maximumFractionDigits: 0 })
}

// ═══ COMPONENT ═══
interface CallGuideProps {
  client: any
  onClose: () => void
  onMinimise?: () => void
}

export default function CallGuide({ client, onClose, onMinimise }: CallGuideProps) {
  const { user } = useAdminStore()

  // Classification state
  const [phase, setPhase] = useState<'classify' | 'guide'>('classify')
  const [envType, setEnvType] = useState<string>('')
  const [personaType, setPersonaType] = useState<string>('')
  const [pathId, setPathId] = useState<string>('')

  // Self-image classification
  const [hasProfPresence, setHasProfPresence] = useState<string>(client?.has_professional_presence || '')
  const [usesProfTitles, setUsesProfTitles] = useState<string>(client?.uses_professional_titles || '')
  const [selfImageOverride, setSelfImageOverride] = useState<string>(client?.self_image || '')
  const [showSignalRef, setShowSignalRef] = useState(false)
  const [selfImageConfirmed, setSelfImageConfirmed] = useState('')
  const [showPivotCard, setShowPivotCard] = useState(false)
  const [pivotHappened, setPivotHappened] = useState(false)

  const computedSelfImage = selfImageOverride || computeSelfImage(hasProfPresence, usesProfTitles, envType)

  // Guide state
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [dataCapture, setDataCapture] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState('')
  const [outcomeDate, setOutcomeDate] = useState('')
  const [outcomeTime, setOutcomeTime] = useState('')
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [nextActionNotes, setNextActionNotes] = useState('')
  const [contactName, setContactName] = useState(client?.name || '')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [contactPhone, setContactPhone] = useState(client?.phone || '')
  const [contactRole, setContactRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set())
  const [activeResponse, setActiveResponse] = useState<Record<string, number>>({})

  // ── Pain Point Calculator state ──
  const [painPresetId, setPainPresetId] = useState('')
  const [painCustomLabel, setPainCustomLabel] = useState('')
  const [painValue, setPainValue] = useState('')
  const [painUnit, setPainUnit] = useState<PainUnit>('cedis')
  const [painFreq, setPainFreq] = useState<PainFreq>('monthly')
  const [painItems, setPainItems] = useState<{ label: string; value: number; unit: PainUnit; freq: PainFreq; monthlyValue: number }[]>([])

  // Timer — starts when entering guide phase, not on mount
  const [callStart, setCallStart] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (phase === 'guide' && !timerRef.current) {
      setCallStart(new Date().toISOString())
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // Auto-sync contactName when a name field is captured
  useEffect(() => {
    const nameVal = dataCapture.dm_name || dataCapture.cooper_name || dataCapture.owner_name || ''
    if (nameVal && !contactName) setContactName(nameVal)
  }, [dataCapture.dm_name, dataCapture.cooper_name, dataCapture.owner_name]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentPath = PATHS[pathId]
  const availablePersonas = envType ? PERSONAS[envType] || [] : []

  // ── Pain point: add item ──
  const addPainItem = () => {
    const val = Number(painValue)
    if (!val || val <= 0) return
    const label = painPresetId === '_custom'
      ? (painCustomLabel || 'Custom problem')
      : (PAIN_PRESETS.find(p => p.id === painPresetId)?.label || 'Problem')
    const monthlyValue = painUnit === 'cedis'
      ? val * FREQ_MULTIPLIERS[painFreq]
      : val * FREQ_MULTIPLIERS[painFreq] // hours/days stay as time units
    setPainItems(prev => [...prev, { label, value: val, unit: painUnit, freq: painFreq, monthlyValue }])
    // Auto-fill dataCapture for script vars
    const totalMonthlyCedis = [...painItems, { unit: painUnit, monthlyValue }]
      .filter(i => i.unit === 'cedis')
      .reduce((sum, i) => sum + i.monthlyValue, 0)
    const totalMonthlyTime = [...painItems, { unit: painUnit, monthlyValue }]
      .filter(i => i.unit !== 'cedis')
      .reduce((sum, i) => sum + i.monthlyValue, 0)
    if (totalMonthlyCedis > 0) updateData('cost_amount', String(Math.round(totalMonthlyCedis)))
    if (totalMonthlyTime > 0) updateData('time_estimate', `${Math.round(totalMonthlyTime)} ${painUnit === 'days' ? 'days' : 'hours'}/month`)
    // Reset inputs
    setPainValue('')
    setPainPresetId('')
    setPainCustomLabel('')
  }

  const removePainItem = (idx: number) => {
    setPainItems(prev => {
      const next = prev.filter((_, i) => i !== idx)
      const totalCedis = next.filter(i => i.unit === 'cedis').reduce((s, i) => s + i.monthlyValue, 0)
      const totalTime = next.filter(i => i.unit !== 'cedis').reduce((s, i) => s + i.monthlyValue, 0)
      updateData('cost_amount', totalCedis > 0 ? String(Math.round(totalCedis)) : '')
      updateData('time_estimate', totalTime > 0 ? `${Math.round(totalTime)} hours/month` : '')
      return next
    })
  }

  // ── Auto-math for cost calculations ──
  const costMath = useMemo(() => {
    const monthly = Number(dataCapture.cost_amount) || 0
    const competitorMonthly = Number(dataCapture.competitor_monthly_cost) || 0
    const totalMonthlyTime = painItems.filter(i => i.unit !== 'cedis').reduce((s, i) => s + i.monthlyValue, 0)
    return {
      monthly,
      quarterly: monthly * 3,
      annual: monthly * 12,
      threeYear: monthly * 36,
      monthlyTimeHours: Math.round(totalMonthlyTime),
      annualTimeHours: Math.round(totalMonthlyTime * 12),
      competitorMonthly,
      competitor3Year: competitorMonthly * 36,
      hasCost: monthly > 0,
      hasTime: totalMonthlyTime > 0,
      hasCompetitor: competitorMonthly > 0,
      painItems,
    }
  }, [dataCapture.cost_amount, dataCapture.competitor_monthly_cost, painItems])

  // ── Template variables — auto-populated from all name fields ──
  const scriptVars: Record<string, string> = useMemo(() => {
    // Build a human-readable cost example from pain items
    const costExample = painItems.length > 0
      ? painItems.map(i => i.unit === 'cedis'
          ? `costs you ${formatCurrency(i.value)} ${FREQ_LABELS[i.freq]}`
          : `takes ${i.value} ${i.unit} ${FREQ_LABELS[i.freq]}`
        ).join(', or ')
      : '⟨their specific example⟩'
    const costPeriod = costMath.hasCost || costMath.hasTime ? 'month' : '⟨month/year⟩'

    return {
      name: contactName || dataCapture.dm_name || dataCapture.cooper_name || dataCapture.owner_name || client?.name || '',
      company: client?.company || '',
      industry: client?.industry || 'your',
      contact_role: contactRole || '⟨specific role⟩',
      time_of_day: getTimeOfDay(),
      user_name: user?.name || 'your name',
      user_title: 'Research Lead',
      receptionist_name: dataCapture.receptionist_name || dataCapture.frontdesk_name || '',
      frontdesk_name: dataCapture.frontdesk_name || '',
      day: outcomeDate || '⟨day⟩',
      time: outcomeTime || '⟨time⟩',
      cost_amount: costMath.hasCost ? formatCurrency(costMath.monthly) : '',
      annual_cost: costMath.hasCost ? formatCurrency(costMath.annual) : '⟨annual cost⟩',
      cost_example: costExample,
      cost_period: costPeriod,
      cost_summary: (() => {
        const parts: string[] = []
        if (costMath.hasCost) parts.push(`spend ${formatCurrency(costMath.monthly)}/month`)
        if (costMath.hasTime) parts.push(`lose ${costMath.monthlyTimeHours} hours/month`)
        if (dataCapture.time_estimate && !costMath.hasTime) parts.push(`lose ${dataCapture.time_estimate}`)
        return parts.length > 0 ? parts.join(' and ') : '⟨cost summary⟩'
      })(),
      time_estimate: dataCapture.time_estimate || (costMath.hasTime ? `${costMath.monthlyTimeHours} hours/month` : ''),
      frustration: dataCapture.frustration || dataCapture.time_sink || '⟨their frustration⟩',
    }
  }, [contactName, contactRole, dataCapture, client, user, outcomeDate, outcomeTime, costMath, painItems])

  const startGuide = () => {
    if (!envType || !personaType || !pathId) return
    setPhase('guide')
  }

  const toggleCheck = (id: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const toggleScript = (id: string) => {
    setExpandedScripts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const updateData = (key: string, value: string) => {
    setDataCapture(prev => ({ ...prev, [key]: value }))
  }

  const switchPath = (newPathId: string, newPersona: string) => {
    setPathId(newPathId)
    setPersonaType(newPersona)
  }

  const getNextAction = () => {
    if (!outcome) return ''
    if (outcome === 'meeting_booked') return `Meeting on ${outcomeDate} at ${outcomeTime}`
    if (outcome === 'dropby_booked') return `Founder drop-by on ${outcomeDate} at ${outcomeTime}`
    if (outcome === 'callback_scheduled') return `Call back on ${outcomeDate} at ${outcomeTime}`
    if (outcome === 'warm_lead') return 'Share research results, follow up'
    if (outcome === 'interested_will_revert') return 'Wait for their response'
    if (outcome === 'disqualified_early') return 'No action — disqualified'
    return 'No further action'
  }

  const handleSave = async () => {
    if (!outcome) return
    setSaving(true)
    const callEnd = new Date().toISOString()
    const points = currentPath?.points || []
    const checkedArr = points.filter(p => checked.has(p.id)).map(p => p.id)
    const skippedArr = points.filter(p => !checked.has(p.id)).map(p => p.id)

    const data: Record<string, any> = {
      client_id: client.client_id,
      environment_type: envType,
      persona_type: personaType,
      path_loaded: pathId,
      path_switched_to: '',
      call_start: callStart,
      call_end: callEnd,
      talking_points_checked: checkedArr,
      talking_points_skipped: skippedArr,
      talking_points_total: points.length,
      data_capture: { ...dataCapture, _cost_math: costMath.hasCost ? costMath : undefined, _pain_items: painItems.length > 0 ? painItems : undefined },
      outcome,
      outcome_details: { date: outcomeDate, time: outcomeTime, notes: outcomeNotes },
      next_action: getNextAction(),
      next_action_date: outcomeDate || '',
      next_action_notes: nextActionNotes,
      call_notes: callNotes,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_role: contactRole,
      self_image_initial: computedSelfImage,
      self_image_confirmed: selfImageConfirmed || computedSelfImage,
      self_image_pivoted: pivotHappened,
    }

    const result = await adminActions.saveCallLog(data)
    setSaving(false)
    if (result) onClose()
  }

  const toggleSection = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }))

  // ═══ CLASSIFICATION PHASE ═══
  if (phase === 'classify') {
    return (
      <div className="cg-classify-modal" onClick={onClose}>
        <div className="cg-classify-card" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Start Call</h2>
              <p className="text-xs text-neutral-500 mt-1">{client?.name || client?.company || 'Unknown'} &mdash; {client?.phone || 'No phone'}</p>
            </div>
            <button onClick={onClose} className="text-neutral-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>

          {/* ═══ PRE-CALL ASSESSMENT ═══ */}
          <div className="cg-self-image-section">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Pre-Call Classification
              </p>
              <button onClick={() => setShowSignalRef(!showSignalRef)} className="text-[10px] text-[#00bfff] hover:text-white cursor-pointer transition-colors flex items-center gap-1">
                <BookOpen className="w-3 h-3" />{showSignalRef ? 'Hide' : 'Show'} Signals Guide
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-[11px] text-neutral-400 mb-1.5">Professional online presence? <span className="text-neutral-600">(website, branded social, About section)</span></p>
                <div className="flex gap-2">
                  {['yes', 'no', 'unsure'].map(v => (
                    <button key={v} onClick={() => { setHasProfPresence(v); setSelfImageOverride('') }}
                      className={`cg-signal-btn ${hasProfPresence === v ? (v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'unsure') : ''}`}>
                      {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unsure'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 mb-1.5">Uses professional titles? <span className="text-neutral-600">(CEO, Director, Founder in listings)</span></p>
                <div className="flex gap-2">
                  {['yes', 'no', 'unsure'].map(v => (
                    <button key={v} onClick={() => { setUsesProfTitles(v); setSelfImageOverride('') }}
                      className={`cg-signal-btn ${usesProfTitles === v ? (v === 'yes' ? 'yes' : v === 'no' ? 'no' : 'unsure') : ''}`}>
                      {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Unsure'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(hasProfPresence || usesProfTitles) && (
              <div className={`cg-self-image-result ${computedSelfImage}`}>
                <div className="flex items-center gap-3">
                  <div className={`cg-self-image-icon ${computedSelfImage}`}>
                    {computedSelfImage === 'professional' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    ) : computedSelfImage === 'trader' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {computedSelfImage === 'professional' ? 'Professional' : computedSelfImage === 'trader' ? 'Trader' : 'Unsure'}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {computedSelfImage === 'professional' ? 'Research-First' : computedSelfImage === 'trader' ? 'Story-First' : 'Select environment type to default'}
                    </p>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    {(['professional', 'trader'] as const).map(si => (
                      <button key={si} onClick={() => setSelfImageOverride(si === computedSelfImage && !selfImageOverride ? '' : si)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all border ${
                          computedSelfImage === si
                            ? si === 'professional' ? 'bg-[#8b5cf6]/15 border-[#8b5cf6]/30 text-[#8b5cf6]' : 'bg-[#f59e0b]/15 border-[#f59e0b]/30 text-[#f59e0b]'
                            : 'border-neutral-800 text-neutral-600 hover:text-neutral-400 hover:border-neutral-700'
                        }`}>
                        {si === 'professional' ? 'Professional' : 'Trader'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-neutral-800/50">
                  <p className="text-[11px] text-neutral-500">
                    {computedSelfImage === 'professional'
                      ? '\u25b8 Open with research: "We\'re running a research project on companies in your industry\u2026"'
                      : computedSelfImage === 'trader'
                      ? '\u25b8 Open with Tema Harbour: "Have you heard about what happened at Tema Harbour with the AI?"'
                      : '\u25b8 Read their tone in the first 30 seconds, then commit to a path.'}
                  </p>
                </div>
              </div>
            )}

            {showSignalRef && (
              <div className="cg-signal-ref">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Before the Call (Online Signals)</p>
                <div className="cg-signal-table mb-3">
                  <div className="cg-signal-row header">
                    <span>Signal</span><span>&rarr; Professional</span><span>&rarr; Trader</span>
                  </div>
                  {SELF_IMAGE_SIGNALS.before.map(s => (
                    <div key={s.signal} className="cg-signal-row">
                      <span className="text-neutral-400 font-medium">{s.signal}</span>
                      <span className="text-[#8b5cf6]/80">{s.professional}</span>
                      <span className="text-[#f59e0b]/80">{s.trader}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">During the Call (Voice Signals)</p>
                <div className="cg-signal-table">
                  <div className="cg-signal-row header">
                    <span>Signal</span><span>&rarr; Professional</span><span>&rarr; Trader</span>
                  </div>
                  {SELF_IMAGE_SIGNALS.during.map(s => (
                    <div key={s.signal} className="cg-signal-row">
                      <span className="text-neutral-400 font-medium">{s.signal}</span>
                      <span className="text-[#8b5cf6]/80">{s.professional}</span>
                      <span className="text-[#f59e0b]/80">{s.trader}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-3">Environment Type</p>
          <div className="flex gap-2 mb-5">
            {[{ id: 'white_collar', label: 'White Collar' }, { id: 'blue_collar', label: 'Blue Collar' }, { id: 'hybrid', label: 'Hybrid' }].map(e => (
              <button key={e.id} className={`cg-env-btn ${envType === e.id ? 'selected' : ''}`}
                onClick={() => { setEnvType(e.id); setPersonaType(''); setPathId('') }}>{e.label}</button>
            ))}
          </div>

          {envType && (<>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-3">Speaking To</p>
            {availablePersonas.map(p => (
              <button key={p.id} className={`cg-persona-btn ${personaType === p.id ? 'selected' : ''}`}
                onClick={() => { setPersonaType(p.id); setPathId(p.pathId) }}>
                <div className={`w-3 h-3 rounded-full border-2 ${personaType === p.id ? 'border-[#00bfff] bg-[#00bfff]' : 'border-neutral-600'}`} />
                {p.label}
              </button>
            ))}
          </>)}

          <button onClick={startGuide} disabled={!pathId}
            className="w-full mt-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Begin Call Guide <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ═══ GUIDE PHASE ═══
  const points = currentPath?.points || []
  const checkedCount = points.filter(p => checked.has(p.id)).length

  return (
    <div className="cg-overlay">
      {/* Sticky Header */}
      <div className="cg-header">
        <div className="flex items-center gap-3">
          <div className="cg-timer">{formatDuration(elapsed)}</div>
          <div className="cg-path-badge" style={{ borderColor: currentPath?.color + '40', color: currentPath?.color }}>
            <div className="w-2 h-2 rounded-full" style={{ background: currentPath?.color }} />
            {currentPath?.label}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Self-image pivot trigger */}
          <button
            onClick={() => setShowPivotCard(!showPivotCard)}
            className={`cg-pivot-trigger ${computedSelfImage}`}
            title="Mid-call pivot &#8212; switch approach"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span className="hidden sm:inline">{computedSelfImage === 'professional' ? 'Prof' : computedSelfImage === 'trader' ? 'Trader' : '?'}</span>
          </button>
          {/* Escalation dropdown */}
          <select value={pathId} onChange={e => {
            const newP = Object.values(PERSONAS).flat().find(x => x.pathId === e.target.value)
            if (newP) switchPath(newP.pathId, newP.id)
          }} className="cg-escalate" style={{ appearance: 'auto' }}>
            <option value="" disabled>Escalated to…</option>
            {Object.values(PERSONAS).flat().map(p => (
              <option key={p.pathId} value={p.pathId}>{p.label}</option>
            ))}
          </select>
          {/* Pause */}
          <button onClick={() => {
            const startTime = callStart ? new Date(callStart).getTime() : Date.now()
            adminActions.minimiseCall(client, startTime)
            if (onMinimise) onMinimise()
            else onClose()
          }} className="cg-pause-btn" title="Minimise — continue navigating">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            Pause
          </button>
          {/* Discard */}
          <button onClick={() => setShowDiscardConfirm(true)} className="cg-discard-btn" title="End call without saving">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Discard
          </button>
          <button onClick={handleSave} disabled={saving || !outcome} className="cg-end-btn">
            {saving ? 'Saving…' : 'End Call & Save'}
          </button>
        </div>
      </div>

      <div className="cg-body">
        {/* Mid-Call Pivot Card */}
        {showPivotCard && (
          <div className="cg-pivot-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Mid-Call Pivot
              </p>
              <button onClick={() => setShowPivotCard(false)} className="text-neutral-600 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-neutral-600 mb-2">Read wrong? Switch approach:</p>
            <div className="space-y-2">
              {computedSelfImage !== 'trader' && (
                <button onClick={() => {
                  setSelfImageConfirmed('trader'); setSelfImageOverride('trader'); setPivotHappened(true)
                  if (!pathId.startsWith('bc_')) {
                    const bcOwner = Object.values(PERSONAS).flat().find(x => x.pathId === 'bc_owner')
                    if (bcOwner) switchPath(bcOwner.pathId, bcOwner.id)
                  }
                  setShowPivotCard(false)
                }} className="cg-pivot-option trader">
                  <div><p className="text-sm font-bold">Pivot to Trader</p><p className="text-[10px] opacity-70">Story-First</p></div>
                  <p className="text-[11px] italic opacity-80 mt-1">&ldquo;{PIVOT_SCRIPTS.professional_to_trader}&rdquo;</p>
                </button>
              )}
              {computedSelfImage !== 'professional' && (
                <button onClick={() => {
                  setSelfImageConfirmed('professional'); setSelfImageOverride('professional'); setPivotHappened(true)
                  if (!pathId.startsWith('wc_')) {
                    const wcDM = Object.values(PERSONAS).flat().find(x => x.pathId === 'wc_decision_maker')
                    if (wcDM) switchPath(wcDM.pathId, wcDM.id)
                  }
                  setShowPivotCard(false)
                }} className="cg-pivot-option professional">
                  <div><p className="text-sm font-bold">Pivot to Professional</p><p className="text-[10px] opacity-70">Research-First</p></div>
                  <p className="text-[11px] italic opacity-80 mt-1">&ldquo;{PIVOT_SCRIPTS.trader_to_professional}&rdquo;</p>
                </button>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800/50">
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-1">30-Second Voice Check</p>
              <div className="flex gap-3 text-[10px]">
                <span className="text-[#8b5cf6]/70">&ldquo;Hello, this is [Name]&hellip;&rdquo; &rarr; Professional</span>
                <span className="text-[#f59e0b]/70">&ldquo;Hello?&rdquo; / &ldquo;Yes?&rdquo; &rarr; Trader</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Contact Info */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('contact')}>
            <h3>Contact Info</h3>
            {collapsed.contact ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
          </div>
          {!collapsed.contact && (
            <div className="cg-section-body">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Company</label>
                  <input value={client?.company || ''} readOnly className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Phone</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Contact Name</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Fill during call" className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600" /></div>
                <div><label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Role/Title</label>
                  <input value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="e.g. Operations Manager" className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600" /></div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Talking Points + Scripts */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('talking')}>
            <h3>Script & Talking Points</h3>
            <div className="flex items-center gap-2">
              <span className="cg-section-count">{checkedCount}/{points.length}</span>
              {collapsed.talking ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
            </div>
          </div>
          {!collapsed.talking && (
            <div className="cg-section-body">
              {points.map((p, idx) => {
                const hasScript = !!(p.script || p.scriptNote || p.responses)
                const isExpanded = expandedScripts.has(p.id)
                const isChecked = checked.has(p.id)
                const showFields = (isChecked || isExpanded) && p.dataFields

                return (
                  <div key={p.id} className="cg-tp-wrapper">
                    {/* Step number + Talking point */}
                    <div className={`cg-tp ${isChecked ? 'is-checked' : ''}`}>
                      <div className={`cg-tp-check ${isChecked ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); toggleCheck(p.id) }}>
                        <Check />
                      </div>
                      <div className="cg-tp-content" onClick={() => hasScript && toggleScript(p.id)}>
                        <div className="cg-tp-top">
                          <span className="cg-tp-step">{idx + 1}</span>
                          <span className="cg-tp-label">{p.label}</span>
                          {hasScript && (
                            <span className={`cg-script-toggle ${isExpanded ? 'expanded' : ''}`}>
                              <BookOpen className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Script Panel */}
                    {hasScript && isExpanded && (
                      <div className="cg-script-panel">
                        {p.script && (
                          <div className="cg-script-text">
                            <span className="cg-script-you">You:</span> {resolveScript(p.script, scriptVars)}
                          </div>
                        )}
                        {p.scriptNote && (
                          <div className="cg-script-note">
                            💡 {p.scriptNote}
                          </div>
                        )}
                        {p.responses && p.responses.length > 0 && (
                          <div className="cg-responses">
                            <div className="cg-response-tabs">
                              {p.responses.map((r, ri) => (
                                <button key={ri}
                                  className={`cg-response-tab ${(activeResponse[p.id] ?? -1) === ri ? 'active' : ''}`}
                                  onClick={() => setActiveResponse(prev => ({ ...prev, [p.id]: prev[p.id] === ri ? -1 : ri }))}>
                                  {r.label}
                                </button>
                              ))}
                            </div>
                            {(activeResponse[p.id] ?? -1) >= 0 && p.responses[activeResponse[p.id]] && (
                              <div className="cg-response-body">
                                <span className="cg-script-you">You:</span> {resolveScript(p.responses[activeResponse[p.id]].text, scriptVars)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contextual data fields — show on check OR expand */}
                    {showFields && (
                      <div className="cg-data-field">
                        {p.dataFields!.map(f => (
                          <div key={f.id} className="mb-2 last:mb-0">
                            <label>{f.label}</label>
                            {f.type === 'textarea' ? (
                              <textarea value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)} rows={2} />
                            ) : f.type === 'select' ? (
                              <select value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)}>
                                <option value="">Select…</option>
                                {f.options?.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                              </select>
                            ) : (
                              <input type={f.type === 'number' ? 'text' : f.type} inputMode={f.type === 'number' ? 'numeric' : undefined}
                                value={dataCapture[f.id] || ''} onChange={e => updateData(f.id, e.target.value)} />
                            )}
                            {/* Quick suggestion chips */}
                            {f.suggestions && f.suggestions.length > 0 && !dataCapture[f.id] && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {f.suggestions.map(s => (
                                  <button key={s} onClick={() => updateData(f.id, s)}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/50 text-neutral-400 hover:text-white hover:border-[#00bfff]/40 hover:bg-[#00bfff]/10 cursor-pointer transition-all">
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {/* ═══ PAIN POINT CALCULATOR ═══ */}
                        {(p.id === 'put_number' || p.id === 'run_calculation' || p.id === 'asked_problem' || p.id === 'most_expensive') && (
                          <div className="mt-3 p-3 rounded-xl bg-neutral-900/80 border border-neutral-700/50">
                            <p className="text-[10px] text-[#00bfff]/70 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                              Pain Point Calculator
                            </p>

                            {/* Logged pain items */}
                            {painItems.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {painItems.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/30">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[11px] text-white font-medium">{item.label}</span>
                                      <span className="text-[10px] text-neutral-500 ml-1.5">
                                        {item.unit === 'cedis' ? formatCurrency(item.value) : `${item.value} ${item.unit}`}{FREQ_LABELS[item.freq]}
                                      </span>
                                      <span className="text-[10px] text-emerald-400/70 ml-1.5">
                                        = {item.unit === 'cedis' ? `${formatCurrency(item.monthlyValue)}/mo` : `${Math.round(item.monthlyValue)} ${item.unit}/mo`}
                                      </span>
                                    </div>
                                    <button onClick={() => removePainItem(i)} className="text-neutral-600 hover:text-red-400 cursor-pointer ml-2 p-0.5 transition-colors">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Preset selector */}
                            <div className="mb-2">
                              <p className="text-[10px] text-neutral-500 mb-1.5">What's costing them?</p>
                              <div className="flex flex-wrap gap-1">
                                {PAIN_PRESETS.map(pp => (
                                  <button key={pp.id} onClick={() => { setPainPresetId(pp.id); setPainUnit(pp.defaultUnit); setPainFreq(pp.defaultFreq); setPainCustomLabel('') }}
                                    className={`text-[10px] px-2 py-1 rounded-md border cursor-pointer transition-all flex items-center gap-1 ${
                                      painPresetId === pp.id
                                        ? 'bg-[#00bfff]/10 border-[#00bfff]/40 text-[#00bfff]'
                                        : 'bg-neutral-800/60 border-neutral-700/40 text-neutral-400 hover:text-white hover:border-neutral-600'
                                    }`}>
                                    <span>{pp.icon}</span> {pp.label}
                                  </button>
                                ))}
                                <button onClick={() => { setPainPresetId('_custom'); setPainUnit('cedis'); setPainFreq('monthly') }}
                                  className={`text-[10px] px-2 py-1 rounded-md border cursor-pointer transition-all ${
                                    painPresetId === '_custom'
                                      ? 'bg-[#8b5cf6]/10 border-[#8b5cf6]/40 text-[#8b5cf6]'
                                      : 'bg-neutral-800/60 border-neutral-700/40 text-neutral-400 hover:text-white hover:border-neutral-600'
                                  }`}>
                                  ✏️ Other
                                </button>
                              </div>
                            </div>

                            {/* Input row — only when a preset is selected */}
                            {painPresetId && (
                              <div className="space-y-2 mt-2">
                                {painPresetId === '_custom' && (
                                  <input value={painCustomLabel} onChange={e => setPainCustomLabel(e.target.value)}
                                    placeholder="Describe the problem…"
                                    className="w-full px-3 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white text-sm placeholder-neutral-600" />
                                )}
                                {painPresetId !== '_custom' && (
                                  <p className="text-[10px] text-neutral-500 italic">{PAIN_PRESETS.find(p => p.id === painPresetId)?.hint}</p>
                                )}
                                <div className="flex gap-2">
                                  <input value={painValue} onChange={e => setPainValue(e.target.value)}
                                    type="text" inputMode="numeric" placeholder={painUnit === 'cedis' ? 'Amount' : 'Hours/Days'}
                                    className="flex-1 px-3 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white text-sm placeholder-neutral-600"
                                    onKeyDown={e => { if (e.key === 'Enter') addPainItem() }} />
                                  <select value={painUnit} onChange={e => setPainUnit(e.target.value as PainUnit)}
                                    className="px-2 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white text-[11px] min-w-[70px]">
                                    <option value="cedis">GH₵</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                  </select>
                                  <select value={painFreq} onChange={e => setPainFreq(e.target.value as PainFreq)}
                                    className="px-2 py-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-white text-[11px] min-w-[80px]">
                                    <option value="daily">Per Day</option>
                                    <option value="weekly">Per Week</option>
                                    <option value="monthly">Per Month</option>
                                    <option value="yearly">Per Year</option>
                                  </select>
                                  <button onClick={addPainItem}
                                    className="px-3 py-2 bg-[#00bfff]/15 border border-[#00bfff]/30 text-[#00bfff] rounded-lg text-[11px] font-bold cursor-pointer hover:bg-[#00bfff]/25 transition-all">
                                    Add
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Auto-calculated totals */}
                            {(costMath.hasCost || costMath.hasTime) && (
                              <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <p className="text-[9px] text-emerald-400/50 font-bold uppercase tracking-wider mb-1.5">📊 Total Calculated Impact</p>
                                <div className={`grid ${costMath.hasCost && costMath.hasTime ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                  {costMath.hasCost && (
                                    <div className="text-center p-2 rounded-lg bg-emerald-500/5">
                                      <p className="text-[9px] text-neutral-500 uppercase">Money Lost</p>
                                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(costMath.monthly)}<span className="text-[10px] text-neutral-500">/mo</span></p>
                                      <p className="text-xs font-bold text-[#ff7a00]">{formatCurrency(costMath.annual)}<span className="text-[10px] text-neutral-500">/yr</span></p>
                                    </div>
                                  )}
                                  {costMath.hasTime && (
                                    <div className="text-center p-2 rounded-lg bg-[#8b5cf6]/5">
                                      <p className="text-[9px] text-neutral-500 uppercase">Time Lost</p>
                                      <p className="text-sm font-bold text-[#8b5cf6]">{costMath.monthlyTimeHours} hrs<span className="text-[10px] text-neutral-500">/mo</span></p>
                                      <p className="text-xs font-bold text-[#8b5cf6]/70">{costMath.annualTimeHours} hrs<span className="text-[10px] text-neutral-500">/yr</span></p>
                                    </div>
                                  )}
                                </div>
                                {costMath.hasCost && (
                                  <p className="text-[10px] text-neutral-500 text-center mt-1.5">3-year cost: <strong className="text-[#ff7a00]">{formatCurrency(costMath.threeYear)}</strong></p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Competitor cost comparison */}
                        {costMath.hasCompetitor && p.id === 'already_have_system' && (
                          <div className="mt-3 p-3 rounded-lg bg-[#ff7a00]/5 border border-[#ff7a00]/20">
                            <p className="text-[10px] text-[#ff7a00]/60 font-bold uppercase tracking-wider mb-1.5">💸 Subscription vs Ownership</p>
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                                <p className="text-[10px] text-neutral-500">Their system (3 yr)</p>
                                <p className="text-sm font-bold text-red-400">{formatCurrency(costMath.competitor3Year)}</p>
                                <p className="text-[9px] text-neutral-600">…and still renting</p>
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                <p className="text-[10px] text-neutral-500">ICUNI Labs</p>
                                <p className="text-sm font-bold text-emerald-400">Built once</p>
                                <p className="text-[9px] text-emerald-600">Owned forever</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 3: Quick Reference */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('reference')}>
            <h3>Quick Reference</h3>
            {collapsed.reference ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
          </div>
          {!collapsed.reference && (
            <div className="cg-section-body">
              {/* Key Data Points */}
              <div className="mb-4">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Key Data Points</p>
                <div className="space-y-1.5">
                  {KEY_DATA_POINTS.map((dp, i) => (
                    <div key={i} className="cg-ref-row">
                      <span className="cg-ref-stat">{dp.stat}</span>
                      <span className="cg-ref-use">{dp.use}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitor Table */}
              <div className="mb-4">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Competitor Gaps</p>
                <div className="space-y-1.5">
                  {COMPETITORS.map((c, i) => (
                    <div key={i} className="cg-ref-row">
                      <span className="cg-ref-stat">{c.name} <span className="text-neutral-600 text-[10px]">{c.cost}</span></span>
                      <span className="cg-ref-use">{c.gap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Three Pains */}
              <div className="mb-4">
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">3 Pains Every Accra Business Shares</p>
                <div className="space-y-1">
                  <p className="text-[11px] text-neutral-400">📦 <strong>Stock disappearing</strong> — variance between what comes in and what sells</p>
                  <p className="text-[11px] text-neutral-400">💳 <strong>Cash & MoMo chaos</strong> — fragmented payments that don't reconcile</p>
                  <p className="text-[11px] text-neutral-400">🏪 <strong>Owner trapped at the shop</strong> — can't see what's happening without being there</p>
                </div>
              </div>

              {/* Objection Handlers */}
              <div>
                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider mb-2">Objection Handlers</p>
                <div className="space-y-2">
                  {Object.entries(OBJECTION_HANDLERS).map(([objection, response], i) => (
                    <details key={i} className="cg-objection">
                      <summary className="cg-objection-q">"{objection}"</summary>
                      <p className="cg-objection-a">{response}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Outcome */}
        <div className="cg-section">
          <div className="cg-section-header" onClick={() => toggleSection('outcome')}>
            <h3>Call Outcome</h3>
            {collapsed.outcome ? <ChevronDown className="w-4 h-4 text-neutral-600" /> : <ChevronUp className="w-4 h-4 text-neutral-600" />}
          </div>
          {!collapsed.outcome && (
            <div className="cg-section-body">
              {OUTCOMES.map(o => (
                <div key={o.id}>
                  <div className={`cg-outcome ${outcome === o.id ? 'selected' : ''}`} onClick={() => setOutcome(o.id)}>
                    <div className="cg-outcome-dot" />
                    <div>
                      <div className="cg-outcome-label">{o.label}</div>
                      <div className="cg-outcome-desc">{o.desc}</div>
                    </div>
                  </div>
                  {outcome === o.id && (o.hasDatetime || o.hasDate || o.hasNotes) && (
                    <div className="cg-data-field mb-3">
                      {(o.hasDatetime || o.hasDate) && (
                        <div className={o.hasDatetime ? 'cg-data-row' : ''}>
                          <div className="mb-2"><label>Date</label><input type="date" value={outcomeDate} onChange={e => setOutcomeDate(e.target.value)} /></div>
                          {o.hasDatetime && <div className="mb-2"><label>Time</label><input type="time" value={outcomeTime} onChange={e => setOutcomeTime(e.target.value)} /></div>}
                        </div>
                      )}
                      {o.hasNotes && <div><label>Notes</label><textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} rows={2} placeholder="Additional details…" /></div>}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3">
                <label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-2">Call Notes (freeform)</label>
                <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600 resize-y"
                  placeholder="Anything that didn't fit the structured fields…" />
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Next Action */}
        {outcome && (
          <div className="cg-section">
            <div className="cg-section-header"><h3>Next Action</h3></div>
            <div className="cg-section-body">
              <div className="cg-next-action">
                <p className="text-sm text-emerald-400 font-semibold mb-2">{getNextAction() || 'Select an outcome above'}</p>
                <label className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider block mb-1">Adjust / Add Notes</label>
                <input value={nextActionNotes} onChange={e => setNextActionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-lg text-white text-sm placeholder-neutral-600"
                  placeholder="Override or add context to the next action…" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button onClick={() => {
            const startTime = callStart ? new Date(callStart).getTime() : Date.now()
            adminActions.minimiseCall(client, startTime)
            if (onMinimise) onMinimise()
            else onClose()
          }}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-neutral-800 border border-neutral-700 text-neutral-400 cursor-pointer hover:bg-neutral-700 hover:text-white transition-all flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            Pause Call
          </button>
          <button onClick={() => setShowDiscardConfirm(true)}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-neutral-900 border border-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/10 hover:border-red-500/40 transition-all flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Discard
          </button>
          <button onClick={handleSave} disabled={saving || !outcome}
            className="flex-[2] py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00bfff] to-[#0099cc] text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] transition-all flex items-center justify-center gap-2">
            {saving ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10" /></svg>Saving…</>) : 'End Call & Save'}
          </button>
        </div>

        {/* Discard Confirmation */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDiscardConfirm(false)}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2">Discard this call?</h3>
              <p className="text-sm text-neutral-400 mb-5">All progress, notes, and data captured during this call will be lost. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-neutral-800 text-neutral-300 cursor-pointer hover:bg-neutral-700 transition-all">Keep Going</button>
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-500/15 border border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/25 transition-all">Discard Call</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
