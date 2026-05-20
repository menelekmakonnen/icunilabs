/**
 * ICUNI Labs — Shared Utilities
 * Helper functions used across all modules.
 */

// ─── PROPERTY HELPERS ────────────────────────────────────
var _propsCache = null;
function getProps_() {
    if (!_propsCache) _propsCache = PropertiesService.getScriptProperties().getProperties();
    return _propsCache;
}
function getProp_(key) {
    return getProps_()[key] || null;
}

function setProp_(key, val) {
    PropertiesService.getScriptProperties().setProperty(key, val);
    _propsCache = null; // invalidate
}

// ─── PER-REQUEST CACHES ──────────────────────────────────
// Layer 1: Spreadsheet object cache — openById is ~200-400ms per call.
// Module-level vars reset between GAS executions (each doPost = fresh isolate).
var _ssCache = {};
function getCachedSS_(propKey) {
    if (!_ssCache[propKey]) _ssCache[propKey] = SpreadsheetApp.openById(getProp_(propKey));
    return _ssCache[propKey];
}

// Layer 2: Sheet data cache — getDataRange().getValues() is ~200-600ms per call.
var _sheetDataCache = {};
function invalidateSheetCache_(sheetName) {
    if (sheetName) { delete _sheetDataCache[sheetName]; }
    else { _sheetDataCache = {}; }
}

function getMainSS_()      { return getCachedSS_(PROP_KEYS.SS_MAIN); }
function getContentSS_()   { return getCachedSS_(PROP_KEYS.SS_CONTENT); }
function getPortfolioSS_() { return getCachedSS_(PROP_KEYS.SS_PORTFOLIO); }
function getClientsSS_()   { return getCachedSS_(PROP_KEYS.SS_CLIENTS); }
function getReferralsSS_() { return getCachedSS_(PROP_KEYS.SS_REFERRALS); }
function getLogsSS_()      { return getCachedSS_(PROP_KEYS.SS_LOGS); }

/**
 * Map a sheet name to the correct spreadsheet.
 */
function getSheetByName_(sheetName) {
    var ssGetter;
    // Main
    if ([SHEETS.USERS, SHEETS.SESSIONS, SHEETS.SITE_PAGES, SHEETS.SITE_MENUS,
         SHEETS.SITE_SETTINGS, SHEETS.SYSTEM_CONFIG].indexOf(sheetName) >= 0) {
        ssGetter = getMainSS_;
    }
    // Content & Jobs
    else if ([SHEETS.BLOG_POSTS, SHEETS.BLOG_CATEGORIES, SHEETS.JOB_LISTINGS,
              SHEETS.JOB_APPLICATIONS, SHEETS.JOB_QUALIFICATIONS].indexOf(sheetName) >= 0) {
        ssGetter = getContentSS_;
    }
    // Portfolio
    else if ([SHEETS.PROJECTS_PORTFOLIO, SHEETS.CASE_STUDIES, SHEETS.TESTIMONIALS].indexOf(sheetName) >= 0) {
        ssGetter = getPortfolioSS_;
    }
    // Clients
    else if ([SHEETS.CLIENTS, SHEETS.CLIENT_PROJECTS, SHEETS.CLIENT_NOTES, SHEETS.INVOICES,
              SHEETS.INVOICE_ITEMS, SHEETS.PAYMENTS, SHEETS.CALL_LOGS, SHEETS.COMPETITOR_INTEL].indexOf(sheetName) >= 0) {
        ssGetter = getClientsSS_;
    }
    // Referrals
    else if ([SHEETS.REFERRERS, SHEETS.REFERRALS, SHEETS.PAYOUTS].indexOf(sheetName) >= 0) {
        ssGetter = getReferralsSS_;
    }
    // Logs
    else if ([SHEETS.ACTIVITY_LOG, SHEETS.ERROR_LOG, SHEETS.EMAIL_LOG,
              SHEETS.SLA_LOG, SHEETS.SLA_COSTS, SHEETS.ARCHIVES,
              SHEETS.IMPERSONATION_LOG].indexOf(sheetName) >= 0) {
        ssGetter = getLogsSS_;
    }
    // Email Hub & Ecosystem (stored in Main SS)
    else if ([SHEETS.EMAIL_ALIASES, SHEETS.EMAIL_TEMPLATES,
              SHEETS.ICUNI_PROJECTS].indexOf(sheetName) >= 0) {
        ssGetter = getMainSS_;
    }
    else {
        throw new Error('Unknown sheet: ' + sheetName);
    }

    var ss = ssGetter();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
    }
    return sheet;
}

// ─── GENERIC CRUD ────────────────────────────────────────

/**
 * Read all data from a sheet as array of objects (header-keyed).
 * Results are cached per-request so repeated reads of the same sheet are free.
 */
function sheetToObjects_(sheetName) {
    if (_sheetDataCache[sheetName]) return _sheetDataCache[sheetName];
    var sheet = getSheetByName_(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    // ── Self-healing: ensure expected headers exist ──
    // Handles the case where new columns were added to the schema
    // after the sheet was already populated with data.
    if (sheetName === SHEETS.CLIENTS) {
        ensureHeaders_(sheet, [
            'client_id', 'name', 'email', 'phone', 'company',
            'status', 'referrer_id', 'created_at', 'notes', 'drive_folder_url',
            'tags', 'source', 'industry', 'address', 'website', 'last_activity',
            'prospect_stage', 'buyer_profile', 'pain_category',
            'challenge_statement', 'laugh_factor', 'first_contact_date',
            'added_by', 'visibility'
        ]);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];
    for (var i = 1; i < data.length; i++) {
        var obj = { _rowIndex: i + 1 };
        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = data[i][j];
        }
        results.push(obj);
    }
    _sheetDataCache[sheetName] = results;
    return results;
}

/**
 * Self-healing header migration.
 * Writes each expected header into its correct column position (1-indexed).
 * Only writes if the cell in row 1 at that position is empty or doesn't
 * match the expected header. This ensures headers align with data that
 * appendRow_ already wrote positionally.
 */
function ensureHeaders_(sheet, expectedHeaders) {
    var lastCol = Math.max(sheet.getLastColumn(), expectedHeaders.length);
    var currentHeaders = lastCol > 0
        ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
        : [];
    var fixed = 0;
    for (var i = 0; i < expectedHeaders.length; i++) {
        var expected = expectedHeaders[i];
        var actual = (currentHeaders[i] || '').toString().trim();
        if (actual !== expected) {
            // Write the correct header at the expected position
            sheet.getRange(1, i + 1).setValue(expected).setFontWeight('bold');
            fixed++;
        }
    }
    if (fixed > 0) {
        Logger.log('ensureHeaders_: Fixed ' + fixed + ' headers in ' + sheet.getName());
        SpreadsheetApp.flush();
    }
}

/**
 * Find a single row by column value.
 */
function findRow_(sheetName, colName, value) {
    var all = sheetToObjects_(sheetName);
    for (var i = 0; i < all.length; i++) {
        if (all[i][colName] !== undefined && all[i][colName].toString() === value.toString()) {
            return all[i];
        }
    }
    return null;
}

/**
 * Append a row to a sheet. Data is an array.
 */
function appendRow_(sheetName, rowArray) {
    var sheet = getSheetByName_(sheetName);
    sheet.appendRow(rowArray);
    invalidateSheetCache_(sheetName);
}

/**
 * Append a row from an object, matched to header order.
 */
function appendRowObj_(sheetName, obj, headers) {
    var sheet = getSheetByName_(sheetName);
    if (sheet.getLastRow() === 0 && headers) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    var hdr = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = hdr.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
    sheet.appendRow(row);
}

/**
 * Update specific columns in a row by row index.
 */
function updateRow_(sheetName, rowIndex, updates) {
    var sheet = getSheetByName_(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var key in updates) {
        var colIdx = headers.indexOf(key);
        if (colIdx >= 0) {
            sheet.getRange(rowIndex, colIdx + 1).setValue(updates[key]);
        } else {
            Logger.log('updateRow_ WARNING: column "' + key + '" not found in sheet ' + sheetName + '. Headers: ' + headers.join(', '));
        }
    }
    invalidateSheetCache_(sheetName);
}

/**
 * Ensure a sheet exists with given headers.
 */
function ensureSheet_(sheetName, headers) {
    var sheet = getSheetByName_(sheetName);
    if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    return sheet;
}

// ─── ID GENERATION ───────────────────────────────────────
function generateId_(prefix) {
    return prefix + '-' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

// ─── DATE/TIME ───────────────────────────────────────────
function now_() {
    return new Date().toISOString();
}

function formatDateGhana_(date) {
    return Utilities.formatDate(date || new Date(), 'Africa/Accra', 'yyyy-MM-dd HH:mm:ss');
}

// ─── DRIVE HELPERS ───────────────────────────────────────
function getOrCreateFolder_(parent, name) {
    var folders = parent.getFoldersByName(name);
    return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getDriveRoot_() {
    return getOrCreateFolder_(DriveApp.getRootFolder(), DRIVE_FOLDERS.ROOT);
}

function getDriveSubfolder_(subfolder) {
    return getOrCreateFolder_(getDriveRoot_(), subfolder);
}

// ─── MIME GUESSING ───────────────────────────────────────
function guessMime_(filename) {
    var ext = (filename || '').split('.').pop().toLowerCase();
    var map = {
        'pdf': 'application/pdf', 'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'gif': 'image/gif', 'webp': 'image/webp',
        'mp4': 'video/mp4', 'webm': 'video/webm',
        'mp3': 'audio/mpeg', 'ogg': 'audio/ogg'
    };
    return map[ext] || 'application/octet-stream';
}

// ─── RESPONSE HELPERS ────────────────────────────────────
function jsonResponse_(code, message, data) {
    return ContentService.createTextOutput(JSON.stringify({
        status: code, message: message, data: data || null
    })).setMimeType(ContentService.MimeType.JSON);
}

function successResponse_(data, message) {
    return jsonResponse_(200, message || 'Success', data);
}

function errorResponse_(message, code) {
    return jsonResponse_(code || 400, message);
}

// ─── SAFE ERROR HANDLING ─────────────────────────────────
function isExpectedError_(msg) {
    if (!msg) return false;
    var patterns = [
        'Access denied', 'Insufficient permissions', 'deactivated', 'not registered',
        'is required', 'must be', 'already exists', 'not found', 'Invalid',
        'Too many', 'at least', 'at most', 'Please', 'expired', 'Incorrect',
        'disabled', 'locked', 'Unauthorized'
    ];
    for (var i = 0; i < patterns.length; i++) {
        if (msg.indexOf(patterns[i]) !== -1) return true;
    }
    return false;
}

function safeCall_(label, fn, args) {
    try {
        return fn.apply(null, args || []);
    } catch (err) {
        Logger.log('ERROR [' + label + ']: ' + err.message + '\n' + (err.stack || ''));
        logError_(label, err.message);
        if (isExpectedError_(err.message)) throw err;
        throw new Error('Something went wrong. Please try again.');
    }
}

// ─── HASHING ─────────────────────────────────────────────
function hashPassword_(password, salt) {
    if (!salt) salt = Utilities.getUuid().replace(/-/g, '');
    var raw = salt + password;
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
    var hash = digest.map(function(b) {
        return ('0' + ((b + 256) % 256).toString(16)).slice(-2);
    }).join('');
    return salt + ':' + hash;
}

function verifyPassword_(password, storedHash) {
    if (!storedHash) return false;
    var parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    var recomputed = hashPassword_(password, parts[0]);
    return recomputed.split(':')[1] === parts[1];
}

// ─── VALIDATION ──────────────────────────────────────────
function validateInput_(data, rules) {
    if (!data || typeof data !== 'object') throw new Error('Invalid input data.');
    var keys = Object.keys(rules);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i], rule = rules[key], val = data[key];
        var label = rule.label || key;
        if (rule.required && (val === undefined || val === null || String(val).trim() === '')) {
            throw new Error(label + ' is required.');
        }
        if (val === undefined || val === null || val === '') continue;
        var strVal = String(val);
        if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            throw new Error(label + ' must be a valid email address.');
        }
        if (rule.type === 'number' && isNaN(Number(val))) {
            throw new Error(label + ' must be a valid number.');
        }
        if (rule.maxLength && strVal.length > rule.maxLength) {
            throw new Error(label + ' must be at most ' + rule.maxLength + ' characters.');
        }
        if (rule.oneOf && rule.oneOf.indexOf(strVal) === -1) {
            throw new Error(label + ' must be one of: ' + rule.oneOf.join(', ') + '.');
        }
    }
}

// ─── RATE LIMITING ───────────────────────────────────────
function rateLimit_(userId, action, maxPerMinute) {
    var cache = CacheService.getScriptCache();
    var key = 'rl_' + (userId || 'anon') + '_' + action;
    var current = Number(cache.get(key)) || 0;
    if (current >= maxPerMinute) {
        throw new Error('Too many requests. Please wait a moment.');
    }
    cache.put(key, String(current + 1), 60);
}

// ─── EMAIL SENDING (alias-aware) ─────────────────────────
/**
 * Send an email using GmailApp so that the 'from' alias is respected.
 * 
 * IMPORTANT: Each alias (jobs@, labs@, tech.issue@) must first be added as
 * a "Send mail as" address in Gmail → Settings → Accounts and Import.
 * 
 * Usage:
 *   sendEmail_({ to: 'client@x.com', subject: 'Hi', htmlBody: '...', from: 'jobs@icuni.org' });
 *   sendEmail_({ to: 'client@x.com', subject: 'Hi', htmlBody: '...' }); // defaults to labs@icuni.org
 *
 * Supported 'from' values:
 *   - 'jobs@icuni.org'        — job applications, qualifications
 *   - 'labs@icuni.org'        — general, project updates, invoices (default)
 *   - 'tech.issue@icuni.org'  — bug reports
 *   - 'hello@icuni.org'       — auth, OTP codes
 */
function sendEmail_(options) {
    var to = options.to;
    var subject = options.subject;
    var htmlBody = options.htmlBody || '';
    var fromAlias = options.from || 'labs@icuni.org';
    var attachments = options.attachments || [];
    var name = options.name || 'ICUNI Labs';

    try {
        // GmailApp supports the 'from' parameter for workspace aliases
        var gmailOpts = {
            htmlBody: htmlBody,
            from: fromAlias,
            name: name
        };
        if (attachments.length > 0) gmailOpts.attachments = attachments;
        GmailApp.sendEmail(to, subject, '', gmailOpts);
    } catch (e) {
        // Fallback: if alias isn't configured or GmailApp fails, use MailApp
        Logger.log('GmailApp.sendEmail failed (from: ' + fromAlias + '): ' + e.message + '. Falling back to MailApp.');
        var mailOpts = { to: to, subject: subject, htmlBody: htmlBody };
        if (attachments.length > 0) mailOpts.attachments = attachments;
        MailApp.sendEmail(mailOpts);
    }
}
