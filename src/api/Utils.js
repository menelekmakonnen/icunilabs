/**
 * ICUNI Labs — Shared Utilities
 * Helper functions used across all modules.
 */

// ─── PROPERTY HELPERS ────────────────────────────────────
function getProp_(key) {
    return PropertiesService.getScriptProperties().getProperty(key);
}

function setProp_(key, val) {
    PropertiesService.getScriptProperties().setProperty(key, val);
}

// ─── SPREADSHEET GETTERS ─────────────────────────────────
function getMainSS_()      { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_MAIN)); }
function getContentSS_()   { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_CONTENT)); }
function getPortfolioSS_() { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_PORTFOLIO)); }
function getClientsSS_()   { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_CLIENTS)); }
function getReferralsSS_() { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_REFERRALS)); }
function getLogsSS_()      { return SpreadsheetApp.openById(getProp_(PROP_KEYS.SS_LOGS)); }

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
              SHEETS.INVOICE_ITEMS, SHEETS.PAYMENTS].indexOf(sheetName) >= 0) {
        ssGetter = getClientsSS_;
    }
    // Referrals
    else if ([SHEETS.REFERRERS, SHEETS.REFERRALS, SHEETS.PAYOUTS].indexOf(sheetName) >= 0) {
        ssGetter = getReferralsSS_;
    }
    // Logs
    else if ([SHEETS.ACTIVITY_LOG, SHEETS.ERROR_LOG, SHEETS.EMAIL_LOG,
              SHEETS.SLA_LOG, SHEETS.SLA_COSTS, SHEETS.ARCHIVES].indexOf(sheetName) >= 0) {
        ssGetter = getLogsSS_;
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
 */
function sheetToObjects_(sheetName) {
    var sheet = getSheetByName_(sheetName);
    if (!sheet || sheet.getLastRow() <= 1) return [];
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
    return results;
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
        }
    }
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
