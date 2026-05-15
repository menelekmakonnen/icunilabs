/**
 * ICUNI Labs — Configuration
 * Central source of truth for all sheet names, column maps, roles, and settings.
 */

// ─── SPREADSHEET IDS ─────────────────────────────────────
// Populated by setupSpreadsheets() and stored in ScriptProperties
var PROP_KEYS = {
    SS_MAIN:       'ss_main',
    SS_CONTENT:    'ss_content',
    SS_PORTFOLIO:  'ss_portfolio',
    SS_CLIENTS:    'ss_clients',
    SS_REFERRALS:  'ss_referrals',
    SS_LOGS:       'ss_logs',
    SUPER_ADMIN_EMAILS: 'super_admin_emails',
    SITE_CONFIG:   'site_config'
};

// ─── SHEET NAMES ─────────────────────────────────────────
var SHEETS = {
    // Main Backend
    USERS:         'Users',
    SESSIONS:      'Sessions',
    SITE_PAGES:    'Site_Pages',
    SITE_MENUS:    'Site_Menus',
    SITE_SETTINGS: 'Site_Settings',
    SYSTEM_CONFIG: 'System_Config',

    // Content & Jobs
    BLOG_POSTS:    'Blog_Posts',
    BLOG_CATEGORIES: 'Blog_Categories',
    JOB_LISTINGS:  'Job_Listings',
    JOB_APPLICATIONS: 'Job_Applications',
    JOB_QUALIFICATIONS: 'Job_Qualifications',

    // Portfolio
    PROJECTS_PORTFOLIO: 'Portfolio_Projects',
    CASE_STUDIES:  'Case_Studies',
    TESTIMONIALS:  'Testimonials',

    // Clients
    CLIENTS:       'Clients',
    CLIENT_PROJECTS: 'Client_Projects',
    CLIENT_NOTES:  'Client_Notes',
    INVOICES:      'Invoices',
    INVOICE_ITEMS: 'Invoice_Items',
    PAYMENTS:      'Payments',

    // Referrals
    REFERRERS:     'Referrers',
    REFERRALS:     'Referrals',
    PAYOUTS:       'Payouts',

    // Logs
    ACTIVITY_LOG:  'Activity_Log',
    ERROR_LOG:     'Error_Log',
    EMAIL_LOG:     'Email_Log',
    SLA_LOG:       'SLA_Log',
    SLA_COSTS:     'SLA_Costs',
    ARCHIVES:      'Archives',

    // ICUNI Ecosystem
    ICUNI_PROJECTS:    'ICUNI_Projects',
    IMPERSONATION_LOG: 'Impersonation_Log',

    // Email Hub
    EMAIL_ALIASES:     'Email_Aliases',
    EMAIL_TEMPLATES:   'Email_Templates',
    USER_MAILBOXES:    'User_Mailboxes'
};

// ─── COLUMN MAPS ─────────────────────────────────────────
var COL = {
    USERS: {
        ID: 0, NAME: 1, EMAIL: 2, PHONE: 3, ROLE: 4,
        STATUS: 5, PASSWORD_HASH: 6, PIN_HASH: 7,
        NOTIF_EMAIL: 8, NOTIF_BROWSER: 9,
        CREATED_AT: 10, LAST_LOGIN: 11,
        PROFILE_PIC_URL: 12, MUST_CHANGE_PW: 13,
        COVER_IMAGE_URL: 14, CONTACT_DETAILS: 15,
        PERMISSIONS_JSON: 16, JOB_TITLE: 17
    },
    CLIENTS: {
        ID: 0, NAME: 1, EMAIL: 2, PHONE: 3, COMPANY: 4,
        STATUS: 5, REFERRER_ID: 6, CREATED_AT: 7,
        NOTES: 8, DRIVE_FOLDER_URL: 9,
        TAGS: 10, SOURCE: 11, INDUSTRY: 12,
        ADDRESS: 13, WEBSITE: 14, LAST_ACTIVITY: 15,
        PROSPECT_STAGE: 16
    },
    CLIENT_PROJECTS: {
        ID: 0, CLIENT_ID: 1, TITLE: 2, DESCRIPTION: 3,
        STATUS: 4, STEP: 5, TYPE: 6,
        ESTIMATED_COST: 7, TOTAL_PAID: 8, BALANCE: 9,
        START_DATE: 10, EST_COMPLETION: 11, ACTUAL_COMPLETION: 12,
        REFERRER_ID: 13, ASSIGNED_STAFF: 14,
        CREATED_AT: 15, UPDATED_AT: 16,
        STEP_0_DATE: 17, STEP_1_DATE: 18, STEP_2_DATE: 19,
        STEP_3_DATE: 20, STEP_4_DATE: 21, STEP_5_DATE: 22,
        STEP_6_DATE: 23, STEP_7_DATE: 24, STEP_8_DATE: 25,
        STEP_9_DATE: 26, STEP_10_DATE: 27,
        SLA_NOTIFIED: 28, SLA_SNOOZED_UNTIL: 29
    },
    INVOICES: {
        ID: 0, PROJECT_ID: 1, CLIENT_ID: 2, CLIENT_NAME: 3,
        TYPE: 4, AMOUNT: 5, TAX: 6, TOTAL: 7,
        STATUS: 8, DUE_DATE: 9, PAID_DATE: 10,
        PDF_URL: 11, CREATED_AT: 12, NOTES: 13
    }
};

// ─── ROLES ───────────────────────────────────────────────
var ROLES = {
    GODMODE:          'Godmode',
    SUPERADMIN:       'SuperAdmin',
    ADMIN:            'Admin',        // Operations-related
    SALES:            'Sales',        // BDM, Growth-related
    PRODUCT:          'Product',      // Builders and Developers
    CLIENT:           'Client',
    REFERRER:         'Referrer'
};

// Lowest → highest privilege
var ROLE_HIERARCHY = [ROLES.REFERRER, ROLES.CLIENT, ROLES.PRODUCT, ROLES.SALES, ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.GODMODE];

// Console-capable roles (can log in to /#_ops)
var CONSOLE_ROLES = [ROLES.GODMODE, ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.SALES, ROLES.PRODUCT];

// Department-scoped section access (SuperAdmin and Godmode get everything)
var DEPARTMENT_SCOPE = {
    'Admin':      ['dashboard', 'clients', 'projects', 'invoices', 'sla', 'careers', 'referrals', 'logs', 'settings'],
    'Sales':      ['dashboard', 'clients', 'referrals', 'careers'],
    'Product':    ['dashboard', 'projects', 'sla', 'logs']
};

// ─── PROJECT STEPS ───────────────────────────────────────
var PROJECT_STEPS = {
    0:   { name: 'Closing Meeting', owner: 'staff' },
    1:   { name: 'Project Created & Invoice Sent', owner: 'staff' },
    1.5: { name: 'Referrer Follow-up', owner: 'referrer' },
    2:   { name: 'Payment Received', owner: 'client' },
    3:   { name: 'Build In Progress', owner: 'staff' },
    4:   { name: 'Demo/Test Ready', owner: 'staff' },
    4.5: { name: 'Iteration Loop', owner: 'staff' },
    5:   { name: 'Final Payments', owner: 'client' },
    6:   { name: 'Training Session', owner: 'staff' },
    7:   { name: 'Final Tailoring', owner: 'staff' },
    8:   { name: 'Additional Costs', owner: 'client' },
    9:   { name: 'Post-Mortem & Reviews', owner: 'staff' },
    10:  { name: 'Upsells & Upgrades', owner: 'staff' }
};

// ─── SLA DEFAULTS (minutes) ─────────────────────────────
var DEFAULT_SLA = {
    step_0_to_1:     1440,   // 24h
    step_1_to_1_5:   4320,   // 3 days
    step_1_5_to_2:   2880,   // 2 days
    step_2_to_3:     1440,   // 24h (same day)
    step_3_to_4_demo:  4320, // 3 working days
    step_3_to_4_build: 10080,// 7 working days
    step_4_to_5:     4320,   // 3 days
    step_6_to_7:     2880,   // 2 days
    step_9_to_10:    10080,  // 1 week
    sla_enabled:     true,
    sla_cost_per_minute: 0.1667, // GH₵10/hour
    sla_cost_daily_rate: 100     // GH₵100/day after 24h
};

// ─── SESSION CONFIG ──────────────────────────────────────
var SESSION_DURATION_HOURS = 24;
var OTP_TTL_SECONDS = 300;
var OTP_MAX_ATTEMPTS = 3;
var OTP_RATE_LIMIT = 5;
var PIN_MAX_ATTEMPTS = 5;
var PIN_LOCKOUT_SECONDS = 900;
var DEVICE_TTL_DAYS = 30;
var MAX_DEVICES_PER_USER = 5;

// ─── LOG ARCHIVING ───────────────────────────────────────
var LOG_ARCHIVE_THRESHOLD = 40000;

// ─── ADMIN EMAIL ─────────────────────────────────────────
var ADMIN_EMAIL = 'labs@icuni.org';
var JOBS_EMAIL = 'jobs@icuni.org';

// ─── EMAIL ALIASES ───────────────────────────────────────
var EMAIL_ALIASES = {
    'labs@icuni.org':       { name: 'ICUNI Labs',     visibility: 'all',      category: 'general' },
    'hello@icuni.org':      { name: 'Hello',          visibility: 'role:Godmode', category: 'general' },
    'donotreply@icuni.org': { name: 'Do Not Reply',   visibility: 'all',      category: 'system' },
    'feedback@icuni.org':   { name: 'Feedback',       visibility: 'all',      category: 'general' },
    'jobs@icuni.org':       { name: 'Jobs / Careers',  visibility: 'all',      category: 'careers' },
    'tech.issue@icuni.org': { name: 'Tech Issues',    visibility: 'all',      category: 'support' },
    'menelek@icuni.org':    { name: 'Menelek',        visibility: 'private',  owner: 'menelek@icuni.org' },
    'josephine@icuni.org':  { name: 'Josephine',      visibility: 'private',  owner: 'josephine.johnson@icuni.org' },
    'doreen.ahiafor@icuni.org': { name: 'Doreen',    visibility: 'private',  owner: 'doreen.ahiafor@icuni.org' }
};

// ─── DRIVE FOLDERS ───────────────────────────────────────
var DRIVE_FOLDERS = {
    ROOT:         'ICUNI Labs',
    CLIENTS:      'Clients',
    INVOICES:     'Invoices',
    JOBS:         'Jobs',
    APPLICATIONS: 'Applications',
    PORTFOLIO:    'Portfolio',
    BLOG:         'Blog',
    BACKUPS:      'Backups',
    USERS:        'User Files'
};
