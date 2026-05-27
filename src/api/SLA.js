/**
 * ICUNI Labs — SLA & Escalation Module
 * Time-based monitoring of project steps with reminders and escalations.
 * Runs via hourly trigger. Adapted from PrintShop SLA patterns.
 */

// ─── SLA CONFIG ──────────────────────────────────────────

function getSlaConfig_() {
    var config = {};
    for (var key in DEFAULT_SLA) config[key] = DEFAULT_SLA[key];
    try {
        var rows = sheetToObjects_(SHEETS.SYSTEM_CONFIG);
        rows.forEach(function(r) {
            if (r.config_key && r.config_key.indexOf('sla_') === 0) {
                if (r.config_key === 'sla_enabled') {
                    config[r.config_key] = r.config_value !== 'false';
                } else {
                    var v = parseFloat(r.config_value);
                    if (!isNaN(v) && v > 0) config[r.config_key] = v;
                }
            }
        });
    } catch(e) { Logger.log('SLA config read error: ' + e.message); }
    return config;
}

// ─── MAIN SLA CRON ───────────────────────────────────────

/**
 * Called by hourly trigger. Scans all active projects and sends SLA alerts.
 */
function checkProjectSLA() {
    var cfg = getSlaConfig_();
    if (!cfg.sla_enabled) return;
    
    var projects = sheetToObjects_(SHEETS.CLIENT_PROJECTS);
    var digests = {}; // { email: [alerts] }
    
    projects.forEach(function(project) {
        if (project.status !== 'active') return;
        
        var step = parseFloat(project.step) || 0;
        var notified = parseSlaNotified_(project.sla_notified);
        var newNotifications = [];
        
        // Check if snoozed
        if (project.sla_snoozed_until) {
            try { if (new Date(project.sla_snoozed_until) > new Date()) return; } catch(e) {}
        }
        
        // Get the timestamp for current step
        var stepDate = getStepTimestamp_(project, step);
        if (!stepDate) return;
        
        var elapsed = elapsedMinutes_(stepDate);
        var deadline = getStepDeadline_(cfg, step, project.type);
        if (elapsed < 0 || !deadline) return;
        
        var stepInfo = PROJECT_STEPS[step] || { name: 'Step ' + step, owner: 'staff' };
        var overdue = elapsed - deadline;
        
        // Reminder (at deadline)
        var remindKey = 'step_' + step + '_remind';
        if (overdue >= 0 && notified.indexOf(remindKey) < 0) {
            var alert = {
                project: project, subject: stepInfo.name + ' — Deadline Reached',
                stage: stepInfo.name, message: 'Project "' + project.title + '" has been at Step ' + step + 
                    ' (' + stepInfo.name + ') for ' + formatDuration_(elapsed) + '.',
                isEscalation: false, elapsedMins: elapsed, deadlineMins: deadline
            };
            addToDigest_(digests, ADMIN_EMAIL, alert);
            newNotifications.push(remindKey);
        }
        
        // Escalation (at 150% of deadline)
        var escKey = 'step_' + step + '_escalate';
        if (overdue >= deadline * 0.5 && notified.indexOf(escKey) < 0) {
            var escAlert = {
                project: project, subject: stepInfo.name + ' — SLA BREACHED',
                stage: stepInfo.name, message: 'CRITICAL: "' + project.title + '" has breached SLA at Step ' + step + 
                    '. Elapsed: ' + formatDuration_(elapsed) + ' (deadline: ' + formatDuration_(deadline) + ').',
                isEscalation: true, elapsedMins: elapsed, deadlineMins: deadline
            };
            addToDigest_(digests, ADMIN_EMAIL, escAlert);
            newNotifications.push(escKey);
            
            // Record SLA cost
            recordSlaCost_(project, step, overdue, cfg);
        }
        
        // Referrer follow-up (step 1.5)
        if (step === 1 && project.referrer_id) {
            var followUpTime = cfg.step_1_to_1_5 || 4320; // 3 days
            if (elapsed >= followUpTime && notified.indexOf('referrer_followup') < 0) {
                var referrer = findRow_(SHEETS.REFERRERS, 'referrer_id', project.referrer_id);
                if (referrer && referrer.email) {
                    addToDigest_(digests, referrer.email, {
                        project: project, subject: 'Follow-up Needed — ' + project.title,
                        stage: 'Referrer Follow-up', 
                        message: 'The client for "' + project.title + '" hasn\'t responded to the invoice in ' + 
                            formatDuration_(elapsed) + '. Can you follow up with them?',
                        isEscalation: false, elapsedMins: elapsed, deadlineMins: followUpTime
                    });
                }
                newNotifications.push('referrer_followup');
            }
        }
        
        // Persist new notifications
        if (newNotifications.length > 0) {
            var updated = notified.concat(newNotifications).join(',');
            updateRow_(SHEETS.CLIENT_PROJECTS, project._rowIndex, { sla_notified: updated });
        }
    });
    
    // Send digest emails
    for (var email in digests) {
        if (digests.hasOwnProperty(email) && digests[email].length > 0) {
            sendSlaDigestEmail_(email, digests[email]);
        }
    }
}

// ─── HELPERS ─────────────────────────────────────────────

function elapsedMinutes_(isoTimestamp) {
    if (!isoTimestamp) return -1;
    var then = new Date(isoTimestamp);
    if (isNaN(then.getTime())) return -1;
    return (Date.now() - then.getTime()) / 60000;
}

function parseSlaNotified_(val) {
    if (!val) return [];
    return String(val).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

function formatDuration_(mins) {
    var m = Math.round(mins);
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60);
    var r = m % 60;
    if (h < 24) return h + 'h' + (r ? ' ' + r + 'm' : '');
    var d = Math.floor(h / 24);
    var rh = h % 24;
    return d + 'd' + (rh ? ' ' + rh + 'h' : '');
}

function getStepTimestamp_(project, step) {
    var stepMap = {
        0: 'step_0_date', 1: 'step_1_date', 2: 'step_2_date',
        3: 'step_3_date', 4: 'step_4_date', 5: 'step_5_date',
        6: 'step_6_date', 7: 'step_7_date', 8: 'step_8_date',
        9: 'step_9_date', 10: 'step_10_date'
    };
    var col = stepMap[Math.floor(step)];
    return col ? project[col] : null;
}

function getStepDeadline_(cfg, step, projectType) {
    var map = {
        0: cfg.step_0_to_1,
        1: cfg.step_1_to_1_5,
        2: cfg.step_2_to_3,
        3: projectType === 'demo' ? cfg.step_3_to_4_demo : cfg.step_3_to_4_build,
        4: cfg.step_4_to_5,
        6: cfg.step_6_to_7,
        9: cfg.step_9_to_10
    };
    return map[step] || 10080; // default 7 days
}

function addToDigest_(digests, email, alert) {
    if (!email) return;
    if (!digests[email]) digests[email] = [];
    digests[email].push(alert);
}

// ─── SLA COST TRACKING ──────────────────────────────────

function recordSlaCost_(project, step, overdueMinutes, cfg) {
    if (overdueMinutes <= 0) return;
    var costRate = cfg.sla_cost_per_minute || 0.1667;
    var dailyRate = cfg.sla_cost_daily_rate || 100;
    var threshold = 1440; // 24 hours
    
    var cost;
    if (overdueMinutes <= threshold) {
        cost = overdueMinutes * costRate;
    } else {
        cost = threshold * costRate;
        cost += Math.ceil((overdueMinutes - threshold) / 1440) * dailyRate;
    }
    // Cap at project cost
    var projectCost = parseFloat(project.estimated_cost) || 0;
    if (projectCost > 0 && cost > projectCost) cost = projectCost;
    cost = Math.round(cost * 100) / 100;
    
    var existing = findRow_(SHEETS.SLA_COSTS, 'project_id', project.project_id);
    if (existing && existing.step === String(step)) {
        updateRow_(SHEETS.SLA_COSTS, existing._rowIndex, {
            overdue_minutes: Math.round(overdueMinutes),
            total_cost: cost, last_updated: now_()
        });
    } else {
        appendRow_(SHEETS.SLA_COSTS, [
            generateId_('SLC'), project.project_id, String(step), project.assigned_staff || '',
            '', Math.round(overdueMinutes), costRate, cost,
            Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy-MM-dd'), now_(), now_()
        ]);
    }
}

// ─── SLA DIGEST EMAIL ────────────────────────────────────

function sendSlaDigestEmail_(email, alerts) {
    if (!email || alerts.length === 0) return;
    var hasEsc = alerts.some(function(a) { return a.isEscalation; });
    var subject = (hasEsc ? '[URGENT] ' : '[Reminder] ') + alerts.length + ' SLA Alerts — ICUNI Labs';
    
    var alertBlocks = alerts.map(function(a) {
        var pct = a.deadlineMins > 0 ? Math.min(Math.round((a.elapsedMins / a.deadlineMins) * 100), 150) : 100;
        var barColor = pct >= 100 ? '#dc2626' : (pct >= 75 ? '#d97706' : '#22c55e');
        var border = a.isEscalation ? '#dc2626' : '#d97706';
        return '<div style="margin-bottom:20px;padding:16px;border:1px solid #e2e8f0;border-left:4px solid ' + border + ';border-radius:8px;background:#f8fafc;">' +
            '<h3 style="margin:0 0 6px;font-size:15px;color:#0f172a;">' + a.subject + '</h3>' +
            '<p style="margin:0 0 10px;font-size:13px;color:#475569;">' + a.message + '</p>' +
            '<div style="background:#e2e8f0;border-radius:4px;height:4px;overflow:hidden;">' +
            '<div style="background:' + barColor + ';height:100%;width:' + Math.min(pct, 100) + '%;"></div></div>' +
            '<div style="font-size:11px;color:#94a3b8;margin-top:6px;">' + formatDuration_(a.elapsedMins) + ' / ' + formatDuration_(a.deadlineMins) + '</div></div>';
    }).join('');
    
    var body = '<div style="font-family:-apple-system,sans-serif;background:#f1f5f9;padding:32px 16px;">' +
        '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">' +
        '<div style="background:' + (hasEsc ? 'linear-gradient(135deg,#450a0a,#dc2626)' : 'linear-gradient(135deg,#451a03,#d97706)') + ';padding:28px;text-align:center;">' +
        '<div style="font-size:22px;font-weight:800;color:#fff;">ICUNI Labs</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:3px;margin-top:4px;">' + (hasEsc ? 'SLA ESCALATION' : 'SLA REMINDERS') + '</div></div>' +
        '<div style="padding:24px;">' + alertBlocks + '</div>' +
        '<div style="padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">Automated SLA digest from ICUNI Labs</div>' +
        '</div></div>';
    
    try {
        sendEmail_({ to: email, subject: subject, htmlBody: body, from: 'labs@icuni.org' });
        logEmail_(email, subject, 'sla_digest', 'sent');
    } catch(e) {
        logEmail_(email, subject, 'sla_digest', 'failed');
    }
}

// ─── SLA API ENDPOINTS ──────────────────────────────────

function handleGetSlaStatus(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var cfg = getSlaConfig_();
    var projects = sheetToObjects_(SHEETS.CLIENT_PROJECTS);
    var statuses = [];
    
    projects.forEach(function(p) {
        if (p.status !== 'active') return;
        var step = parseFloat(p.step) || 0;
        var stepDate = getStepTimestamp_(p, step);
        if (!stepDate) return;
        
        var elapsed = Math.round(elapsedMinutes_(stepDate));
        var deadline = getStepDeadline_(cfg, step, p.type);
        var stepInfo = PROJECT_STEPS[step] || { name: 'Step ' + step };
        
        statuses.push({
            project_id: p.project_id, title: p.title, client_id: p.client_id,
            step: step, step_name: stepInfo.name, elapsed: elapsed, deadline: deadline,
            breached: elapsed >= deadline, severity: deadline > 0 ? Math.round((elapsed / deadline) * 100) / 100 : 0,
            snoozed: p.sla_snoozed_until ? new Date(p.sla_snoozed_until) > new Date() : false
        });
    });
    
    statuses.sort(function(a, b) { return b.severity - a.severity; });
    return successResponse_({ config: cfg, statuses: statuses });
}

function handleSnoozeSla(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var project = findRow_(SHEETS.CLIENT_PROJECTS, 'project_id', payload.projectId);
    if (!project) return errorResponse_('Project not found.');
    var until = new Date();
    until.setMinutes(until.getMinutes() + (payload.minutes || 30));
    updateRow_(SHEETS.CLIENT_PROJECTS, project._rowIndex, { sla_snoozed_until: until.toISOString() });
    logAction_(auth.user.user_id, auth.user.name, 'SLA_SNOOZED', project.title + ' for ' + (payload.minutes || 30) + 'min');
    return successResponse_(null, 'SLA snoozed for ' + (payload.minutes || 30) + ' minutes.');
}

function handleGetSlaCosts(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    return successResponse_(sheetToObjects_(SHEETS.SLA_COSTS));
}

// ═══════════════════════════════════════════════════════════
// ──  CALL FOLLOW-UP SLA SYSTEM  ───────────────────────────
// ═══════════════════════════════════════════════════════════

var CALL_SLA_HEADERS = [
    'sla_id', 'call_id', 'caller_email', 'caller_name',
    'client_id', 'client_name', 'outcome', 'due_date',
    'status', 'postponed_until', 'accrued_fee', 'fee_last_calculated',
    'escalated', 'escalated_at', 'completed_at', 'created_at'
];

/**
 * Create a follow-up SLA record. Called internally when a call is logged
 * with callback_scheduled, needs_follow_up, or meeting_booked.
 */
function createCallFollowUpSLA_(callId, callerEmail, callerName, clientId, clientName, outcome, dueDate) {
    if (!dueDate) return;
    var sheet = ensureSheet_(SHEETS.CALL_FOLLOW_UP_SLA, CALL_SLA_HEADERS);
    var slaId = generateId_('FSLA');
    var nowStr = now_();
    sheet.appendRow([
        slaId, callId, callerEmail, callerName,
        clientId, clientName, outcome, dueDate,
        'active', '', 0, nowStr,
        '', '', '', nowStr
    ]);
    return slaId;
}

/**
 * Auto-complete any outstanding follow-up SLAs for a given client+caller
 * when a new call is logged for the same client.
 */
function autoCompleteCallSLA_(callerEmail, clientId) {
    try {
        var slas = sheetToObjects_(SHEETS.CALL_FOLLOW_UP_SLA);
        var nowStr = now_();
        slas.forEach(function(s) {
            if (s.caller_email === callerEmail && s.client_id === clientId &&
                (s.status === 'active' || s.status === 'postponed')) {
                updateRow_(SHEETS.CALL_FOLLOW_UP_SLA, s._rowIndex, {
                    status: 'completed', completed_at: nowStr
                });
            }
        });
    } catch(e) { Logger.log('autoCompleteCallSLA_ error: ' + e.message); }
}

/**
 * Count business hours between two dates (Mon-Fri, 8am-6pm Africa/Accra).
 * Returns fractional hours.
 */
function countBusinessHours_(fromDate, toDate, cfg) {
    var startHour = cfg.call_sla_business_start || 8;
    var endHour = cfg.call_sla_business_end || 18;
    var businessHoursPerDay = endHour - startHour; // 10 hours
    
    var from = new Date(fromDate);
    var to = new Date(toDate);
    if (from >= to) return 0;
    
    var totalMinutes = 0;
    var cursor = new Date(from);
    
    // Walk through each day
    while (cursor < to) {
        var day = cursor.getDay(); // 0=Sun, 6=Sat
        if (day >= 1 && day <= 5) { // Mon-Fri
            var dayStart = new Date(cursor);
            dayStart.setHours(startHour, 0, 0, 0);
            var dayEnd = new Date(cursor);
            dayEnd.setHours(endHour, 0, 0, 0);
            
            var windowStart = cursor > dayStart ? cursor : dayStart;
            var windowEnd = to < dayEnd ? to : dayEnd;
            
            if (windowStart < windowEnd) {
                totalMinutes += (windowEnd - windowStart) / 60000;
            }
        }
        // Move to next day at midnight
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
    }
    
    return Math.round(totalMinutes * 100) / 6000; // Convert to hours, 2 decimal
}

/**
 * Hourly cron: check all active call follow-up SLAs for penalties and escalation.
 */
function checkCallFollowUpSLA() {
    var cfg = getSlaConfig_();
    if (!cfg.sla_enabled) return;
    
    var slas;
    try { slas = sheetToObjects_(SHEETS.CALL_FOLLOW_UP_SLA); } catch(e) { return; }
    
    var now = new Date();
    var nowStr = now_();
    var ratePerHour = cfg.call_sla_rate_per_hour || 1.00;
    var escalationHours = cfg.call_sla_escalation_hours || 2;
    
    // Load users for escalation lookups
    var users;
    try { users = sheetToObjects_(SHEETS.USERS); } catch(e) { users = []; }
    
    slas.forEach(function(s) {
        if (s.status !== 'active' && s.status !== 'postponed') return;
        
        var dueDate = new Date(s.due_date);
        if (isNaN(dueDate.getTime())) return;
        
        // If postponed and not yet past the postpone time, skip
        if (s.status === 'postponed' && s.postponed_until) {
            var postponedUntil = new Date(s.postponed_until);
            if (now < postponedUntil) return;
            // Postpone expired — reactivate and adjust billing start
            updateRow_(SHEETS.CALL_FOLLOW_UP_SLA, s._rowIndex, { status: 'active' });
            s.status = 'active';
            // Use postponed_until as the new billing start
            dueDate = postponedUntil;
        }
        
        // Not overdue yet
        if (now <= dueDate) return;
        
        // Calculate business hours overdue
        var businessHours = countBusinessHours_(dueDate, now, cfg);
        if (businessHours <= 0) return;
        
        // Calculate fee: existing accrued (from before postpone) + new accrual
        var existingFee = parseFloat(s.accrued_fee) || 0;
        // Fee for this period = hours since due (or since postpone ended) × rate
        var periodFee = Math.round(businessHours * ratePerHour * 100) / 100;
        var totalFee = Math.round((existingFee + periodFee) * 100) / 100;
        
        // But don't double-count: total = max(old fee, new calculation)
        // Simple approach: recalculate from scratch since due_date
        var totalBusinessHours = countBusinessHours_(new Date(s.due_date), now, cfg);
        totalFee = Math.max(existingFee, Math.round(totalBusinessHours * ratePerHour * 100) / 100);
        
        var updates = { accrued_fee: totalFee, fee_last_calculated: nowStr };
        
        // Escalation: if overdue >= escalation threshold AND not yet escalated
        if (totalBusinessHours >= escalationHours && s.escalated !== 'true') {
            var superior = findSuperior_(s.caller_email, users);
            if (superior) {
                sendCallSlaEscalation_(superior.email, s, totalFee, totalBusinessHours);
                updates.escalated = 'true';
                updates.escalated_at = nowStr;
            }
        }
        
        updateRow_(SHEETS.CALL_FOLLOW_UP_SLA, s._rowIndex, updates);
    });
}

/**
 * Find the superior of a user by role hierarchy.
 */
function findSuperior_(userEmail, users) {
    var user = users.filter(function(u) { return u.email === userEmail; })[0];
    if (!user) return null;
    
    var userRoleIdx = ROLE_HIERARCHY.indexOf(user.role);
    if (userRoleIdx < 0) return null;
    
    // Find someone with a higher role
    for (var i = userRoleIdx + 1; i < ROLE_HIERARCHY.length; i++) {
        var superiors = users.filter(function(u) {
            return u.role === ROLE_HIERARCHY[i] && u.status === 'active';
        });
        if (superiors.length > 0) return superiors[0];
    }
    return null;
}

/**
 * Send escalation email to the superior.
 */
function sendCallSlaEscalation_(superiorEmail, sla, fee, hours) {
    var subject = '[ESCALATION] Missed Follow-Up — ' + (sla.client_name || 'Unknown Client');
    var body = '<div style="font-family:-apple-system,sans-serif;background:#f1f5f9;padding:32px 16px;">' +
        '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">' +
        '<div style="background:linear-gradient(135deg,#450a0a,#dc2626);padding:28px;text-align:center;">' +
        '<div style="font-size:22px;font-weight:800;color:#fff;">ICUNI Labs</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:3px;margin-top:4px;">CALL SLA ESCALATION</div></div>' +
        '<div style="padding:24px;">' +
        '<p style="font-size:14px;color:#0f172a;margin:0 0 12px;"><strong>' + (sla.caller_name || sla.caller_email) + '</strong> has a missed follow-up that has exceeded ' + Math.round(hours) + ' business hours.</p>' +
        '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:12px 0;">' +
        '<p style="margin:0 0 6px;font-size:13px;color:#7f1d1d;"><strong>Client:</strong> ' + (sla.client_name || 'N/A') + '</p>' +
        '<p style="margin:0 0 6px;font-size:13px;color:#7f1d1d;"><strong>Due:</strong> ' + sla.due_date + '</p>' +
        '<p style="margin:0 0 6px;font-size:13px;color:#7f1d1d;"><strong>Outcome:</strong> ' + (sla.outcome || 'N/A').replace(/_/g, ' ') + '</p>' +
        '<p style="margin:0;font-size:15px;color:#dc2626;font-weight:700;">Accrued Fee: GH₵' + fee.toFixed(2) + '</p></div>' +
        '<p style="font-size:13px;color:#475569;">Please follow up with this team member to ensure the call is actioned.</p>' +
        '</div></div></div>';
    
    try {
        sendEmail_({ to: superiorEmail, subject: subject, htmlBody: body, from: 'labs@icuni.org' });
        logEmail_(superiorEmail, subject, 'call_sla_escalation', 'sent');
    } catch(e) {
        logEmail_(superiorEmail, subject, 'call_sla_escalation', 'failed');
    }
}

// ─── CALL FOLLOW-UP SLA API ENDPOINTS ───────────────────

function handleGetCallFollowUpSLA(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var slas;
    try { slas = sheetToObjects_(SHEETS.CALL_FOLLOW_UP_SLA); } catch(e) { slas = []; }
    
    // Recalculate live fees for active SLAs
    var cfg = getSlaConfig_();
    var now = new Date();
    slas.forEach(function(s) {
        if (s.status !== 'active') return;
        var dueDate = new Date(s.due_date);
        if (now > dueDate) {
            var bh = countBusinessHours_(dueDate, now, cfg);
            var existingFee = parseFloat(s.accrued_fee) || 0;
            s.live_fee = Math.max(existingFee, Math.round(bh * (cfg.call_sla_rate_per_hour || 1) * 100) / 100);
            s.business_hours_overdue = Math.round(bh * 100) / 100;
        } else {
            s.live_fee = parseFloat(s.accrued_fee) || 0;
            s.business_hours_overdue = 0;
        }
    });
    
    // Sort: active first, then by overdue hours descending
    slas.sort(function(a, b) {
        var statusOrder = { active: 0, postponed: 1, completed: 2 };
        var sa = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 3;
        var sb = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 3;
        if (sa !== sb) return sa - sb;
        return (b.business_hours_overdue || 0) - (a.business_hours_overdue || 0);
    });
    
    return successResponse_(slas);
}

function handlePostponeFollowUp(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var slaId = payload.sla_id;
    if (!slaId) return errorResponse_('SLA ID required.');
    
    var sla = findRow_(SHEETS.CALL_FOLLOW_UP_SLA, 'sla_id', slaId);
    if (!sla) return errorResponse_('SLA record not found.');
    
    // Only the owner or a superior can postpone
    if (sla.caller_email !== auth.user.email) {
        var userRoleIdx = ROLE_HIERARCHY.indexOf(auth.user.role);
        var slaRoleIdx = ROLE_HIERARCHY.indexOf('Sales');
        if (userRoleIdx <= slaRoleIdx) return errorResponse_('You can only postpone your own SLAs.');
    }
    
    var postponeUntil = payload.postpone_until;
    if (!postponeUntil) return errorResponse_('Postpone date required.');
    
    // Freeze current fees before postponing
    var cfg = getSlaConfig_();
    var now = new Date();
    var dueDate = new Date(sla.due_date);
    var currentFee = parseFloat(sla.accrued_fee) || 0;
    if (now > dueDate && sla.status === 'active') {
        var bh = countBusinessHours_(dueDate, now, cfg);
        currentFee = Math.max(currentFee, Math.round(bh * (cfg.call_sla_rate_per_hour || 1) * 100) / 100);
    }
    
    updateRow_(SHEETS.CALL_FOLLOW_UP_SLA, sla._rowIndex, {
        status: 'postponed',
        postponed_until: postponeUntil,
        accrued_fee: currentFee,
        fee_last_calculated: now_()
    });
    
    logAction_(auth.user.user_id, auth.user.name, 'CALL_SLA_POSTPONED',
        sla.client_name + ' postponed to ' + postponeUntil);
    
    return successResponse_(null, 'Follow-up postponed. Accrued fee of GH₵' + currentFee.toFixed(2) + ' preserved.');
}

function handleCompleteFollowUp(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var slaId = payload.sla_id;
    if (!slaId) return errorResponse_('SLA ID required.');
    
    var sla = findRow_(SHEETS.CALL_FOLLOW_UP_SLA, 'sla_id', slaId);
    if (!sla) return errorResponse_('SLA record not found.');
    
    updateRow_(SHEETS.CALL_FOLLOW_UP_SLA, sla._rowIndex, {
        status: 'completed',
        completed_at: now_()
    });
    
    logAction_(auth.user.user_id, auth.user.name, 'CALL_SLA_COMPLETED',
        sla.client_name + ' (fee: GH₵' + (parseFloat(sla.accrued_fee) || 0).toFixed(2) + ')');
    
    return successResponse_(null, 'Follow-up marked complete.');
}
