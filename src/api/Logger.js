/**
 * ICUNI Labs — Logger & Archiving
 * Activity logging, error logging, email logging, auto-archiving.
 */

// ─── ACTIVITY LOGGING ────────────────────────────────────

function logAction_(userId, userName, action, detail) {
    try {
        appendRow_(SHEETS.ACTIVITY_LOG, [
            generateId_('LOG'), userId, userName, action, detail, '', now_()
        ]);
    } catch(e) { Logger.log('Log write failed: ' + e.message); }
}

function logError_(module, message) {
    try {
        appendRow_(SHEETS.ERROR_LOG, [
            generateId_('ERR'), module, message, '', now_()
        ]);
    } catch(e) { Logger.log('Error log failed: ' + e.message); }
}

function logEmail_(recipient, subject, type, status) {
    try {
        appendRow_(SHEETS.EMAIL_LOG, [
            generateId_('EML'), recipient, subject, type, status, now_()
        ]);
    } catch(e) { Logger.log('Email log failed: ' + e.message); }
}

// ─── AUTO-ARCHIVING ──────────────────────────────────────

/**
 * Called daily by trigger. Archives log sheets that exceed threshold.
 */
function archiveLogsIfNeeded() {
    var sheetsToCheck = [SHEETS.ACTIVITY_LOG, SHEETS.EMAIL_LOG];
    
    sheetsToCheck.forEach(function(sheetName) {
        try {
            var sheet = getSheetByName_(sheetName);
            var rowCount = sheet.getLastRow();
            
            if (rowCount >= LOG_ARCHIVE_THRESHOLD) {
                archiveSheet_(sheetName, sheet, rowCount);
            }
        } catch(e) {
            Logger.log('Archive check failed for ' + sheetName + ': ' + e.message);
            logError_('Archiver', 'Failed to archive ' + sheetName + ': ' + e.message);
        }
    });
}

function archiveSheet_(sheetName, sheet, rowCount) {
    var datestamp = Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy-MM');
    var archiveName = 'ICUNI Labs — Archive — ' + sheetName + ' — ' + datestamp;
    
    // Create archive spreadsheet
    var archiveSS = SpreadsheetApp.create(archiveName);
    var archiveFolder = getDriveSubfolder_(DRIVE_FOLDERS.BACKUPS);
    DriveApp.getFileById(archiveSS.getId()).moveTo(archiveFolder);
    
    // Copy all data to archive
    var data = sheet.getDataRange().getValues();
    var archiveSheet = archiveSS.getActiveSheet();
    archiveSheet.setName(sheetName);
    archiveSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    archiveSheet.getRange(1, 1, 1, data[0].length).setFontWeight('bold');
    archiveSheet.setFrozenRows(1);
    
    // Record in Archives registry
    appendRow_(SHEETS.ARCHIVES, [
        generateId_('ARC'), archiveSS.getId(), sheetName, rowCount,
        now_(), archiveSS.getUrl()
    ]);
    
    // Clear original sheet (keep headers)
    if (rowCount > 1) {
        sheet.deleteRows(2, rowCount - 1);
    }
    
    logAction_('SYSTEM', 'System', 'LOG_ARCHIVED', 
        sheetName + ': ' + rowCount + ' rows archived to ' + archiveName);
    Logger.log('Archived ' + rowCount + ' rows from ' + sheetName);
}

// ─── BACKUP ──────────────────────────────────────────────

/**
 * Weekly backup of all spreadsheets. Called by Sunday trigger.
 */
function backupSpreadsheets() {
    var props = PropertiesService.getScriptProperties();
    var ssIds = [
        { key: PROP_KEYS.SS_MAIN, name: 'Staff Backend' },
        { key: PROP_KEYS.SS_CONTENT, name: 'Content & Jobs' },
        { key: PROP_KEYS.SS_CLIENTS, name: 'Clients' },
        { key: PROP_KEYS.SS_REFERRALS, name: 'Referrals' }
    ];
    
    var backupFolder = getDriveSubfolder_(DRIVE_FOLDERS.BACKUPS);
    var datestamp = Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy-MM-dd');
    var backedUp = 0;
    
    ssIds.forEach(function(item) {
        try {
            var id = props.getProperty(item.key);
            if (!id) return;
            var ss = SpreadsheetApp.openById(id);
            var copy = ss.copy('Backup — ' + item.name + ' — ' + datestamp);
            DriveApp.getFileById(copy.getId()).moveTo(backupFolder);
            backedUp++;
        } catch(e) {
            Logger.log('Backup failed for ' + item.name + ': ' + e.message);
        }
    });
    
    // Clean old backups — keep last 8
    var files = backupFolder.getFiles();
    var backupFiles = [];
    while (files.hasNext()) {
        var f = files.next();
        if (f.getName().indexOf('Backup —') === 0) {
            backupFiles.push({ id: f.getId(), created: f.getDateCreated() });
        }
    }
    backupFiles.sort(function(a, b) { return b.created - a.created; });
    for (var i = 32; i < backupFiles.length; i++) {
        DriveApp.getFileById(backupFiles[i].id).setTrashed(true);
    }
    
    logAction_('SYSTEM', 'System', 'BACKUP', 'Backed up ' + backedUp + ' spreadsheets');
}

// ─── LOG RETRIEVAL ───────────────────────────────────────

function handleGetLogs(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var sheetName = payload.logType === 'errors' ? SHEETS.ERROR_LOG : 
                    payload.logType === 'emails' ? SHEETS.EMAIL_LOG : SHEETS.ACTIVITY_LOG;
    var logs = sheetToObjects_(sheetName);
    
    // Return last 200 by default
    var limit = Math.min(payload.limit || 200, 500);
    logs = logs.slice(-limit).reverse();
    
    return successResponse_(logs);
}

function handleGetArchives(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    return successResponse_(sheetToObjects_(SHEETS.ARCHIVES));
}
