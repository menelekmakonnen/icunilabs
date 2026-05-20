/**
 * ═══════════════════════════════════════════════════════════
 * ICUNI Labs — Interconnection Handlers
 * OrbitSync + Telemetry + StaffAPI implementations
 * ═══════════════════════════════════════════════════════════
 *
 * These handlers use the Labs GAS patterns (jsonResponse_, errorResponse_, etc.)
 * and store data in the MAIN spreadsheet (alongside Users, Sessions, etc.)
 *
 * SHEETS CREATED:
 *   OrbitProjects   — Project mirror from Orbit desktop
 *   OrbitHealth     — Health flags from Orbit
 *   OrbitSyncLog    — Sync audit trail
 *   AppTelemetry    — Client app telemetry events
 *   AppRegistry     — Known client apps
 *   Staff           — Staff directory
 *   Invoices_Ops    — Operational invoices (distinct from client invoices)
 *   Deployments     — GAS deployment history
 */

// ─── SHEET NAMES ────────────────────────────────────────
var IC_ORBIT_PROJECTS   = 'OrbitProjects';
var IC_ORBIT_HEALTH     = 'OrbitHealth';
var IC_ORBIT_SYNC_LOG   = 'OrbitSyncLog';
var IC_TELEMETRY        = 'AppTelemetry';
var IC_APP_REGISTRY     = 'AppRegistry';
var IC_STAFF            = 'Staff';
var IC_OPS_INVOICES     = 'Invoices_Ops';
var IC_DEPLOYMENTS      = 'Deployments';

// ─── HEADER DEFINITIONS ─────────────────────────────────
var IC_HEADERS = {
  ORBIT_PROJECTS: ['project_id','name','path','client','domain','platform','framework','language','maturity','pattern','file_count','loc','conversations','last_modified','emoji_free','svg_logo','multi_sheet','bug_reporting','auth_threshold','collapsible_sidebar','critical_flags','high_flags','medium_flags','low_flags','synced_at'],
  ORBIT_HEALTH:   ['flag_id','project_id','project_name','severity','type','description','file_path','auto_detected','resolved','detected_at','synced_at'],
  ORBIT_SYNC_LOG: ['sync_id','source','timestamp','total_projects','critical_flags','high_flags','compliance_rate','duration_ms','status','error'],
  TELEMETRY:      ['event_id','app_name','client','event_type','active_users','transactions_today','errors_today','quota_email_used','quota_fetch_used','data_json','received_at'],
  APP_REGISTRY:   ['app_id','app_name','client','gas_deployment_id','site_url','status','last_telemetry','registered_at'],
  STAFF:          ['staff_id','name','email','role','phone','active_projects','specialization','status','joined_at','updated_at'],
  OPS_INVOICES:   ['invoice_id','client','project','description','amount','currency','status','paid_amount','due_date','paid_date','created_at','notes'],
  DEPLOYMENTS:    ['deployment_id','project','version','environment','gas_deployment_id','deployed_by','deployed_at','notes','status']
};

// ═══════════════════════════════════════════════════════════
// ORBIT SYNC HANDLERS
// ═══════════════════════════════════════════════════════════

function handleSyncOrbitData(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var startTime = new Date().getTime();
  var syncId = generateId_('SYNC');

  try {
    var data = payload.payload;
    if (!data || !data.projects) return errorResponse_('Missing payload.projects');

    var ss = getMainSS_();

    // Ensure sheets
    icEnsureSheet_(ss, IC_ORBIT_PROJECTS, IC_HEADERS.ORBIT_PROJECTS);
    icEnsureSheet_(ss, IC_ORBIT_HEALTH, IC_HEADERS.ORBIT_HEALTH);
    icEnsureSheet_(ss, IC_ORBIT_SYNC_LOG, IC_HEADERS.ORBIT_SYNC_LOG);

    var projSheet = ss.getSheetByName(IC_ORBIT_PROJECTS);
    var healthSheet = ss.getSheetByName(IC_ORBIT_HEALTH);
    var nowStr = now_();

    // Clear and refresh projects
    if (projSheet.getLastRow() > 1) {
      projSheet.deleteRows(2, projSheet.getLastRow() - 1);
    }

    var projects = data.projects;
    for (var i = 0; i < projects.length; i++) {
      var p = projects[i];
      var compliance = p.compliance || {};
      var health = p.health || {};
      var stats = p.stats || {};
      var flags = health.flags || [];

      var fc = { critical: 0, high: 0, medium: 0, low: 0 };
      for (var f = 0; f < flags.length; f++) {
        var sev = flags[f].severity || 'low';
        if (fc[sev] !== undefined) fc[sev]++;
      }

      projSheet.appendRow([
        p.id || '', p.name || '', p.path || '', p.client || '',
        p.domain || '', p.platform || '', p.framework || '',
        p.language || '', p.maturity || '', p.pattern || '',
        stats.file_count || 0, stats.loc || 0,
        stats.conversations || 0, stats.last_modified || '',
        compliance.emoji_free ? 'Yes' : 'No',
        compliance.svg_logo ? 'Yes' : 'No',
        compliance.multi_sheet ? 'Yes' : 'No',
        compliance.bug_reporting ? 'Yes' : 'No',
        compliance.auth_threshold ? 'Yes' : 'No',
        compliance.collapsible_sidebar ? 'Yes' : 'No',
        fc.critical, fc.high, fc.medium, fc.low,
        nowStr
      ]);
    }

    // Refresh health flags
    if (healthSheet.getLastRow() > 1) {
      healthSheet.deleteRows(2, healthSheet.getLastRow() - 1);
    }

    for (var j = 0; j < projects.length; j++) {
      var projFlags = (projects[j].health || {}).flags || [];
      for (var k = 0; k < projFlags.length; k++) {
        var flag = projFlags[k];
        healthSheet.appendRow([
          flag.id || generateId_('HF'),
          projects[j].id || '', projects[j].name || '',
          flag.severity || 'low', flag.type || 'unknown',
          flag.description || '', flag.file_path || '',
          flag.auto_detected ? 'Yes' : 'No',
          flag.resolved ? 'Yes' : 'No',
          flag.detected_at || '', nowStr
        ]);
      }
    }

    // Log sync
    var summary = data.summary || {};
    var duration = new Date().getTime() - startTime;
    var logSheet = ss.getSheetByName(IC_ORBIT_SYNC_LOG);
    logSheet.appendRow([
      syncId, 'orbit', nowStr,
      summary.total_projects || projects.length,
      summary.critical_flags || 0,
      summary.high_flags || 0,
      summary.compliance_rate || 0,
      duration, 'success', ''
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'ORBIT_SYNC', projects.length + ' projects synced');

    return successResponse_({
      syncId: syncId,
      projectsSynced: projects.length,
      durationMs: duration
    }, 'Orbit sync complete');

  } catch (e) {
    var errDuration = new Date().getTime() - startTime;
    try {
      var logSheet2 = getMainSS_().getSheetByName(IC_ORBIT_SYNC_LOG);
      if (logSheet2) logSheet2.appendRow([syncId, 'orbit', now_(), 0, 0, 0, 0, errDuration, 'error', e.message]);
    } catch (e2) {}
    return errorResponse_('Orbit sync failed: ' + e.message);
  }
}

function handleGetOrbitStatus(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();
  var logSheet = ss.getSheetByName(IC_ORBIT_SYNC_LOG);
  if (!logSheet || logSheet.getLastRow() <= 1) {
    return successResponse_({ lastSync: null, message: 'No Orbit sync history' });
  }

  var lastRow = logSheet.getLastRow();
  var headers = IC_HEADERS.ORBIT_SYNC_LOG;
  var data = logSheet.getRange(lastRow, 1, 1, headers.length).getValues()[0];

  return successResponse_({
    syncId: data[0], source: data[1], timestamp: data[2],
    totalProjects: data[3], criticalFlags: data[4], highFlags: data[5],
    complianceRate: data[6], durationMs: data[7], status: data[8],
    error: data[9] || null
  });
}

// ═══════════════════════════════════════════════════════════
// TELEMETRY HANDLERS
// ═══════════════════════════════════════════════════════════

function handleTelemetryReport(payload) {
  var appName = payload.app || '';
  var client = payload.client || '';
  var eventType = payload.event || 'heartbeat';
  var eventData = payload.data || {};

  if (!appName) return errorResponse_('Missing app name');

  // API key validation (optional — if set in ScriptProperties)
  var validKey = getProp_('TELEMETRY_API_KEY');
  if (validKey && payload.apiKey !== validKey) {
    return errorResponse_('Invalid API key', 403);
  }

  var ss = getMainSS_();
  var nowStr = now_();

  icEnsureSheet_(ss, IC_TELEMETRY, IC_HEADERS.TELEMETRY);
  icEnsureSheet_(ss, IC_APP_REGISTRY, IC_HEADERS.APP_REGISTRY);

  var eventId = generateId_('TEL');
  var telSheet = ss.getSheetByName(IC_TELEMETRY);

  telSheet.appendRow([
    eventId, appName, client, eventType,
    eventData.active_users || 0,
    eventData.transactions_today || 0,
    eventData.errors_today || 0,
    (eventData.quota_usage || {}).email || 0,
    (eventData.quota_usage || {}).fetch || 0,
    JSON.stringify(eventData),
    nowStr
  ]);

  // Update app registry
  var regSheet = ss.getSheetByName(IC_APP_REGISTRY);
  var regData = regSheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < regData.length; i++) {
    if (regData[i][1] === appName && regData[i][2] === client) {
      regSheet.getRange(i + 1, 7).setValue(nowStr);
      found = true;
      break;
    }
  }
  if (!found) {
    regSheet.appendRow([generateId_('APP'), appName, client, '', '', 'active', nowStr, nowStr]);
  }

  return successResponse_({ eventId: eventId, received: true });
}

function handleTelemetryGet(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();

  // Apps
  var apps = [];
  var regSheet = ss.getSheetByName(IC_APP_REGISTRY);
  if (regSheet && regSheet.getLastRow() > 1) {
    var regData = regSheet.getDataRange().getValues();
    for (var i = 1; i < regData.length; i++) {
      apps.push({
        id: regData[i][0], name: regData[i][1], client: regData[i][2],
        deploymentId: regData[i][3], siteUrl: regData[i][4], status: regData[i][5],
        lastTelemetry: regData[i][6], registeredAt: regData[i][7]
      });
    }
  }

  // Recent events
  var events = [];
  var telSheet = ss.getSheetByName(IC_TELEMETRY);
  if (telSheet && telSheet.getLastRow() > 1) {
    var lastRow = telSheet.getLastRow();
    var startRow = Math.max(2, lastRow - 99);
    var data = telSheet.getRange(startRow, 1, lastRow - startRow + 1, IC_HEADERS.TELEMETRY.length).getValues();
    for (var j = 0; j < data.length; j++) {
      events.push({
        eventId: data[j][0], app: data[j][1], client: data[j][2],
        eventType: data[j][3], activeUsers: data[j][4], transactions: data[j][5],
        errors: data[j][6], quotaEmail: data[j][7], quotaFetch: data[j][8],
        receivedAt: data[j][10]
      });
    }
  }

  return successResponse_({ apps: apps, recentEvents: events, totalApps: apps.length });
}

// ═══════════════════════════════════════════════════════════
// STAFF/INVOICE/DEPLOYMENT API
// ═══════════════════════════════════════════════════════════

function handleStaffList(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();
  icEnsureSheet_(ss, IC_STAFF, IC_HEADERS.STAFF);
  var sheet = ss.getSheetByName(IC_STAFF);
  return successResponse_({ staff: icSheetToObjects_(sheet, IC_HEADERS.STAFF) });
}

function handleInvoicesList(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();
  icEnsureSheet_(ss, IC_OPS_INVOICES, IC_HEADERS.OPS_INVOICES);
  var sheet = ss.getSheetByName(IC_OPS_INVOICES);
  return successResponse_({ invoices: icSheetToObjects_(sheet, IC_HEADERS.OPS_INVOICES) });
}

function handleDeploymentsList(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();
  icEnsureSheet_(ss, IC_DEPLOYMENTS, IC_HEADERS.DEPLOYMENTS);
  var sheet = ss.getSheetByName(IC_DEPLOYMENTS);
  return successResponse_({ deployments: icSheetToObjects_(sheet, IC_HEADERS.DEPLOYMENTS) });
}

function handleStaffSync(payload) {
  var auth = requireAuth_(payload.token);
  if (auth.error) return auth.error;

  var ss = getMainSS_();
  icEnsureSheet_(ss, IC_STAFF, IC_HEADERS.STAFF);
  icEnsureSheet_(ss, IC_OPS_INVOICES, IC_HEADERS.OPS_INVOICES);
  icEnsureSheet_(ss, IC_DEPLOYMENTS, IC_HEADERS.DEPLOYMENTS);

  var staff = icSheetToObjects_(ss.getSheetByName(IC_STAFF), IC_HEADERS.STAFF);
  var invoices = icSheetToObjects_(ss.getSheetByName(IC_OPS_INVOICES), IC_HEADERS.OPS_INVOICES);
  var deployments = icSheetToObjects_(ss.getSheetByName(IC_DEPLOYMENTS), IC_HEADERS.DEPLOYMENTS);

  return successResponse_({
    staff: staff,
    invoices: invoices,
    deployments: deployments,
    syncedAt: now_()
  });
}

// ═══════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════

function icEnsureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function icSheetToObjects_(sheet, headers) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var h = 0; h < headers.length; h++) {
      var val = data[i][h] !== undefined ? data[i][h] : '';
      if (val instanceof Date) val = val.toISOString();
      obj[headers[h]] = val;
    }
    results.push(obj);
  }
  return results;
}
