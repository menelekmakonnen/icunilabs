/**
 * ICUNI Labs — Setup Module
 * Run setupSpreadsheets() from the Apps Script editor to create all backend spreadsheets.
 * Run setupTriggers() to install time-driven SLA and archiving triggers.
 */

/**
 * Create all ICUNI Labs backend spreadsheets and store their IDs.
 * Run ONCE from Apps Script editor: Run > setupSpreadsheets
 */
function setupSpreadsheets() {
    var props = PropertiesService.getScriptProperties();
    var root = getDriveRoot_();

    function createOrGetSS(name) {
        // Check if already created
        var files = root.getFilesByName(name);
        if (files.hasNext()) {
            var existing = files.next();
            Logger.log('Found existing: ' + name + ' → ' + existing.getId());
            return SpreadsheetApp.openById(existing.getId());
        }
        var ss = SpreadsheetApp.create(name);
        DriveApp.getFileById(ss.getId()).moveTo(root);
        Logger.log('Created: ' + name + ' → ' + ss.getId());
        return ss;
    }

    // ── 1. Main Staff Backend ──
    var ssMain = createOrGetSS('ICUNI Labs — Staff Backend');
    props.setProperty(PROP_KEYS.SS_MAIN, ssMain.getId());
    setupSheetHeaders_(ssMain, SHEETS.USERS, [
        'id', 'name', 'email', 'phone', 'role',
        'status', 'password_hash', 'pin_hash',
        'notif_email', 'notif_browser',
        'created_at', 'last_login', 'profile_pic_url', 'must_change_pw',
        'cover_image_url', 'contact_details', 'permissions_json', 'job_title',
        'company_email'
    ]);
    setupSheetHeaders_(ssMain, SHEETS.SESSIONS, [
        'token', 'user_id', 'email', 'name', 'role', 'created_at', 'expires_at', 'source'
    ]);
    setupSheetHeaders_(ssMain, SHEETS.SITE_PAGES, [
        'page_id', 'slug', 'title', 'hero_title', 'hero_subtitle', 'hero_image',
        'hero_cta_text', 'hero_cta_link', 'content_json', 'meta_description',
        'status', 'updated_at', 'updated_by'
    ]);
    setupSheetHeaders_(ssMain, SHEETS.SITE_MENUS, [
        'menu_id', 'label', 'link', 'parent_id', 'order', 'visible', 'updated_at'
    ]);
    setupSheetHeaders_(ssMain, SHEETS.SITE_SETTINGS, [
        'setting_key', 'setting_value', 'updated_at', 'updated_by'
    ]);
    setupSheetHeaders_(ssMain, SHEETS.SYSTEM_CONFIG, [
        'config_key', 'config_value', 'description', 'updated_at'
    ]);

    // ── 2. Content & Jobs ──
    var ssContent = createOrGetSS('ICUNI Labs — Content & Jobs');
    props.setProperty(PROP_KEYS.SS_CONTENT, ssContent.getId());
    setupSheetHeaders_(ssContent, SHEETS.BLOG_POSTS, [
        'post_id', 'title', 'slug', 'category', 'author', 'status',
        'content_html', 'excerpt', 'featured_image', 'tags',
        'published_at', 'created_at', 'updated_at', 'meta_description'
    ]);
    setupSheetHeaders_(ssContent, SHEETS.BLOG_CATEGORIES, [
        'category_id', 'name', 'slug', 'description', 'order'
    ]);
    setupSheetHeaders_(ssContent, SHEETS.JOB_LISTINGS, [
        'job_id', 'title', 'type', 'location', 'salary_range',
        'short_desc', 'full_description_json', 'requirements_json', 'benefits_json',
        'status', 'deadline', 'created_at', 'updated_at', 'created_by'
    ]);
    setupSheetHeaders_(ssContent, SHEETS.JOB_APPLICATIONS, [
        'application_id', 'job_id', 'job_title', 'name', 'email', 'phone', 'note',
        'has_cv', 'has_audio', 'has_video', 'cv_link', 'audio_link', 'video_link',
        'status', 'applied_at'
    ]);
    setupSheetHeaders_(ssContent, SHEETS.JOB_QUALIFICATIONS, [
        'qual_id', 'application_id', 'job_id', 'email',
        'answers_json', 'submitted_at'
    ]);

    // ── 3. Portfolio ──
    var ssPortfolio = createOrGetSS('ICUNI Labs — Portfolio');
    props.setProperty(PROP_KEYS.SS_PORTFOLIO, ssPortfolio.getId());
    setupSheetHeaders_(ssPortfolio, SHEETS.PROJECTS_PORTFOLIO, [
        'project_id', 'title', 'client_name', 'category', 'description',
        'technologies', 'thumbnail', 'images_json', 'live_url',
        'status', 'order', 'created_at', 'updated_at'
    ]);
    setupSheetHeaders_(ssPortfolio, SHEETS.CASE_STUDIES, [
        'study_id', 'project_id', 'title', 'challenge', 'solution',
        'results', 'testimonial', 'status', 'created_at'
    ]);
    setupSheetHeaders_(ssPortfolio, SHEETS.TESTIMONIALS, [
        'testimonial_id', 'client_name', 'company', 'role', 'quote',
        'photo_url', 'rating', 'status', 'created_at'
    ]);

    // ── 4. Clients ──
    var ssClients = createOrGetSS('ICUNI Labs — Clients');
    props.setProperty(PROP_KEYS.SS_CLIENTS, ssClients.getId());
    setupSheetHeaders_(ssClients, SHEETS.CLIENTS, [
        'client_id', 'name', 'email', 'phone', 'company',
        'status', 'referrer_id', 'created_at', 'notes', 'drive_folder_url',
        'tags', 'source', 'industry', 'address', 'website', 'last_activity',
        'prospect_stage', 'buyer_profile', 'pain_category',
        'challenge_statement', 'laugh_factor', 'first_contact_date'
    ]);
    setupSheetHeaders_(ssClients, SHEETS.CLIENT_NOTES, [
        'note_id', 'client_id', 'content', 'author', 'author_email', 'created_at'
    ]);
    setupSheetHeaders_(ssClients, SHEETS.CLIENT_PROJECTS, [
        'project_id', 'client_id', 'title', 'description',
        'status', 'step', 'type',
        'estimated_cost', 'total_paid', 'balance',
        'start_date', 'est_completion', 'actual_completion',
        'referrer_id', 'assigned_staff',
        'created_at', 'updated_at',
        'step_0_date', 'step_1_date', 'step_2_date',
        'step_3_date', 'step_4_date', 'step_5_date',
        'step_6_date', 'step_7_date', 'step_8_date',
        'step_9_date', 'step_10_date',
        'sla_notified', 'sla_snoozed_until'
    ]);
    setupSheetHeaders_(ssClients, SHEETS.INVOICES, [
        'invoice_id', 'project_id', 'client_id', 'client_name',
        'type', 'amount', 'tax', 'total',
        'status', 'due_date', 'paid_date',
        'pdf_url', 'created_at', 'notes'
    ]);
    setupSheetHeaders_(ssClients, SHEETS.INVOICE_ITEMS, [
        'item_id', 'invoice_id', 'description', 'quantity', 'unit_price', 'total'
    ]);
    setupSheetHeaders_(ssClients, SHEETS.PAYMENTS, [
        'payment_id', 'invoice_id', 'project_id', 'client_id',
        'amount', 'method', 'reference', 'status', 'paid_at', 'notes'
    ]);

    // ── 5. Referrals ──
    var ssReferrals = createOrGetSS('ICUNI Labs — Referrals');
    props.setProperty(PROP_KEYS.SS_REFERRALS, ssReferrals.getId());
    setupSheetHeaders_(ssReferrals, SHEETS.REFERRERS, [
        'referrer_id', 'name', 'email', 'phone', 'background',
        'payout_preference', 'status', 'total_earned',
        'created_at', 'updated_at'
    ]);
    setupSheetHeaders_(ssReferrals, SHEETS.REFERRALS, [
        'referral_id', 'referrer_id', 'client_name', 'client_email', 'client_phone',
        'business_type', 'notes', 'status', 'project_id',
        'payout_amount', 'payout_status', 'created_at', 'updated_at'
    ]);
    setupSheetHeaders_(ssReferrals, SHEETS.PAYOUTS, [
        'payout_id', 'referrer_id', 'referral_id', 'amount',
        'method', 'reference', 'status', 'paid_at', 'notes'
    ]);

    // ── 6. Logs & Sessions ──
    var ssLogs = createOrGetSS('ICUNI Labs — Logs');
    props.setProperty(PROP_KEYS.SS_LOGS, ssLogs.getId());
    setupSheetHeaders_(ssLogs, SHEETS.ACTIVITY_LOG, [
        'log_id', 'user_id', 'user_name', 'action', 'detail',
        'ip', 'timestamp'
    ]);
    setupSheetHeaders_(ssLogs, SHEETS.ERROR_LOG, [
        'error_id', 'module', 'message', 'stack', 'timestamp'
    ]);
    setupSheetHeaders_(ssLogs, SHEETS.EMAIL_LOG, [
        'email_id', 'recipient', 'subject', 'type', 'status', 'timestamp'
    ]);
    setupSheetHeaders_(ssLogs, SHEETS.SLA_LOG, [
        'sla_id', 'project_id', 'step', 'type', 'detail', 'timestamp'
    ]);
    setupSheetHeaders_(ssLogs, SHEETS.SLA_COSTS, [
        'id', 'project_id', 'step', 'username', 'role',
        'overdue_minutes', 'cost_per_minute', 'total_cost',
        'breach_date', 'created_at', 'last_updated'
    ]);
    setupSheetHeaders_(ssLogs, SHEETS.ARCHIVES, [
        'archive_id', 'spreadsheet_id', 'sheet_name', 'row_count',
        'archived_at', 'url'
    ]);

    // ── Drive folder structure ──
    var jobs = getOrCreateFolder_(root, DRIVE_FOLDERS.JOBS);
    getOrCreateFolder_(jobs, DRIVE_FOLDERS.APPLICATIONS);
    getOrCreateFolder_(root, DRIVE_FOLDERS.CLIENTS);
    getOrCreateFolder_(root, DRIVE_FOLDERS.INVOICES);
    getOrCreateFolder_(root, DRIVE_FOLDERS.PORTFOLIO);
    getOrCreateFolder_(root, DRIVE_FOLDERS.BLOG);
    getOrCreateFolder_(root, DRIVE_FOLDERS.BACKUPS);

    // ── Seed Godmode user ──
    seedGodmodeUser_(ssMain);

    Logger.log('=== SETUP COMPLETE ===');
    Logger.log('Main:       ' + ssMain.getUrl());
    Logger.log('Content:    ' + ssContent.getUrl());
    Logger.log('Portfolio:  ' + ssPortfolio.getUrl());
    Logger.log('Clients:    ' + ssClients.getUrl());
    Logger.log('Referrals:  ' + ssReferrals.getUrl());
    Logger.log('Logs:       ' + ssLogs.getUrl());
}

/**
 * Helper: set up headers on a sheet tab if empty.
 */
function setupSheetHeaders_(ss, sheetName, headers) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
    } else {
        // ── Schema Migration: append any missing columns to existing sheets ──
        var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        for (var i = 0; i < headers.length; i++) {
            if (existingHeaders.indexOf(headers[i]) === -1) {
                var newCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, newCol).setValue(headers[i]).setFontWeight('bold');
                Logger.log('MIGRATION: Added missing column "' + headers[i] + '" to sheet ' + sheetName);
            }
        }
    }
    // Remove default Sheet1 if it exists and is empty
    var def = ss.getSheetByName('Sheet1');
    if (def && def.getLastRow() <= 1 && ss.getSheets().length > 1) {
        try { ss.deleteSheet(def); } catch(e) {}
    }
}

/**
 * Seed the initial Godmode user.
 */
function seedGodmodeUser_(ss) {
    var sheet = ss.getSheetByName(SHEETS.USERS);
    if (!sheet || sheet.getLastRow() > 1) return; // Already has users

    var tempPassword = 'ICUNI@2026!';
    var hashed = hashPassword_(tempPassword);

    sheet.appendRow([
        generateId_('USR'),
        'Godmode Admin',
        'hello@icuni.org',
        '',
        ROLES.GODMODE,
        'Active',
        hashed,
        '',
        true, true,
        now_(), '',
        '', true  // must_change_pw
    ]);

    Logger.log('Seeded Godmode user: hello@icuni.org / ' + tempPassword);
}

/**
 * Re-seed or update the Godmode user.
 * Run from Apps Script editor if the admin account was accidentally deleted.
 */
function reseedGodmode() {
    var props = PropertiesService.getScriptProperties();
    var ssId = props.getProperty(PROP_KEYS.SS_MAIN);
    if (!ssId) { Logger.log('ERROR: Main spreadsheet not set up. Run setupSpreadsheets() first.'); return; }

    var ss = SpreadsheetApp.openById(ssId);
    var sheet = ss.getSheetByName(SHEETS.USERS);
    if (!sheet) { Logger.log('ERROR: Users sheet not found.'); return; }

    // Check if hello@icuni.org already exists
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (String(data[i][2]).toLowerCase().trim() === 'hello@icuni.org') {
            // Update to ensure Godmode role and Active status
            sheet.getRange(i + 1, 5).setValue(ROLES.GODMODE);  // role column
            sheet.getRange(i + 1, 6).setValue('Active');         // status column
            Logger.log('Updated existing user hello@icuni.org to Godmode/Active at row ' + (i + 1));
            return;
        }
    }

    // Insert new
    var tempPassword = 'ICUNI@2026!';
    sheet.appendRow([
        generateId_('USR'), 'Godmode Admin', 'hello@icuni.org', '',
        ROLES.GODMODE, 'Active', hashPassword_(tempPassword), '',
        true, true, now_(), '', '', true
    ]);
    Logger.log('Re-seeded Godmode user: hello@icuni.org / ' + tempPassword);
}

/**
 * Install time-driven triggers for SLA monitoring and log archiving.
 * Run ONCE from Apps Script editor: Run > setupTriggers
 */
function setupTriggers() {
    var triggers = ScriptApp.getProjectTriggers();

    // Remove existing ICUNI triggers
    triggers.forEach(function(t) {
        var fn = t.getHandlerFunction();
        if (['checkProjectSLA', 'archiveLogsIfNeeded', 'backupSpreadsheets'].indexOf(fn) >= 0) {
            ScriptApp.deleteTrigger(t);
        }
    });

    // SLA check every hour
    ScriptApp.newTrigger('checkProjectSLA')
        .timeBased()
        .everyHours(1)
        .create();

    // Log archiving check daily
    ScriptApp.newTrigger('archiveLogsIfNeeded')
        .timeBased()
        .everyDays(1)
        .atHour(3) // 3 AM Ghana time
        .create();

    // Weekly backup
    ScriptApp.newTrigger('backupSpreadsheets')
        .timeBased()
        .onWeekDay(ScriptApp.WeekDay.SUNDAY)
        .atHour(2)
        .create();

    Logger.log('Triggers installed: SLA (hourly), Archive (daily 3AM), Backup (Sunday 2AM)');
}
