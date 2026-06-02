/**
 * ICUNI Labs — Call Log Module
 * Handles call guide logging, analytics, competitor intel, and pipeline auto-advance.
 */

// ─── STAGE ORDERING (for auto-advance logic) ─────────────
var STAGE_ORDER = ['prospect', 'new_lead', 'contacted', 'qualified', 'meeting_scheduled', 'won', 'disqualified'];

function stageIndex_(stage) {
    var idx = STAGE_ORDER.indexOf(stage);
    return idx >= 0 ? idx : 0;
}

// ─── SAVE CALL LOG ───────────────────────────────────────

function handleSaveCallLog(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var clientId = payload.client_id;
    if (!clientId) return errorResponse_('Client ID required.');

    var client = findRow_(SHEETS.CLIENTS, 'client_id', clientId);
    if (!client) return errorResponse_('Client not found.');

    var callId = generateId_('CALL');
    var nowStr = now_();

    // Parse talking points
    var tpChecked = payload.talking_points_checked || [];
    var tpSkipped = payload.talking_points_skipped || [];
    var tpTotal = (payload.talking_points_total || 0);

    // Serialize data capture and outcome details
    var dataCaptureJson = '';
    var outcomeDetailsJson = '';
    try { dataCaptureJson = JSON.stringify(payload.data_capture || {}); } catch(e) {}
    try { outcomeDetailsJson = JSON.stringify(payload.outcome_details || {}); } catch(e) {}

    // Duration calculation
    var durationSeconds = 0;
    if (payload.call_start && payload.call_end) {
        try {
            durationSeconds = Math.round((new Date(payload.call_end) - new Date(payload.call_start)) / 1000);
        } catch(e) {}
    }

    // ── Determine pipeline auto-advance ──
    var autoAdvanced = '';
    var outcome = payload.outcome || '';
    var currentStage = client.prospect_stage || 'new_lead';
    var targetStage = '';

    switch (outcome) {
        case 'meeting_booked':
            targetStage = 'meeting_scheduled';
            break;
        case 'callback_scheduled':
        case 'interested_will_revert':
        case 'needs_follow_up':
            if (stageIndex_(currentStage) < stageIndex_('contacted')) {
                targetStage = 'contacted';
            }
            break;
        case 'no_interest':
            if (currentStage === 'prospect' || currentStage === 'new_lead') {
                targetStage = 'disqualified';
            }
            break;
    }

    // Only advance if target is further along (never regress)
    if (targetStage && stageIndex_(targetStage) > stageIndex_(currentStage)) {
        updateRow_(SHEETS.CLIENTS, client._rowIndex, {
            prospect_stage: targetStage,
            last_activity: nowStr
        });
        SpreadsheetApp.flush();
        invalidateSheetCache_(SHEETS.CLIENTS);
        autoAdvanced = currentStage + ' → ' + targetStage;

        // Add a stage-change note
        var noteId = generateId_('NTE');
        appendRow_(SHEETS.CLIENT_NOTES, [
            noteId, clientId,
            'Auto-advanced from call: ' + autoAdvanced + ' (Outcome: ' + outcome + ')',
            auth.user.name, auth.user.email, nowStr
        ]);
    } else {
        // Still update last_activity
        updateRow_(SHEETS.CLIENTS, client._rowIndex, { last_activity: nowStr });
    }

    // ── Update contact info if provided ──
    var contactUpdates = {};
    if (payload.contact_name && !client.name) contactUpdates.name = payload.contact_name;
    if (payload.contact_phone && !client.phone) contactUpdates.phone = payload.contact_phone;
    if (Object.keys(contactUpdates).length > 0) {
        updateRow_(SHEETS.CLIENTS, client._rowIndex, contactUpdates);
    }

    // ── Write call log ──
    appendRow_(SHEETS.CALL_LOGS, [
        callId, clientId, auth.user.email, auth.user.name,
        payload.environment_type || '', payload.persona_type || '',
        payload.path_loaded || '', payload.path_switched_to || '',
        payload.call_start || nowStr, payload.call_end || nowStr, durationSeconds,
        JSON.stringify(tpChecked), JSON.stringify(tpSkipped), tpTotal,
        dataCaptureJson, outcome, outcomeDetailsJson,
        payload.next_action || '', payload.next_action_date || '', payload.next_action_notes || '',
        payload.call_notes || '', autoAdvanced, nowStr,
        payload.self_image_initial || '', payload.self_image_confirmed || '',
        payload.self_image_pivoted ? 'Yes' : '',
        payload.contact_name || '', payload.contact_phone || '', payload.contact_role || ''
    ]);

    // ── Extract competitor intel ──
    var dataCapture = payload.data_capture || {};
    if (dataCapture.competitor_system || dataCapture.competitor_developer) {
        var intelId = generateId_('INTEL');
        appendRow_(SHEETS.COMPETITOR_INTEL, [
            intelId, clientId, callId,
            dataCapture.competitor_system || '',
            dataCapture.competitor_developer || '',
            client.industry || '',
            dataCapture.system_type === 'custom' ? 'Yes' : (dataCapture.system_type === 'off_shelf' ? 'No' : ''),
            dataCapture.system_cost || '',
            dataCapture.system_name || '',
            nowStr
        ]);
    }

    // ── SLA reminder for callbacks ──
    if (outcome === 'callback_scheduled' && payload.next_action_date) {
        var cbNoteId = generateId_('NTE');
        appendRow_(SHEETS.CLIENT_NOTES, [
            cbNoteId, clientId,
            'CALLBACK SCHEDULED: ' + payload.next_action_date + (payload.next_action_notes ? ' — ' + payload.next_action_notes : ''),
            auth.user.name, auth.user.email, nowStr
        ]);
    }

    // ── Call Follow-Up SLA ──
    // Auto-complete any outstanding follow-up SLAs for this client (new call = follow-up done)
    try { autoCompleteCallSLA_(auth.user.email, clientId); } catch(e) {}
    
    // Create new SLA record if this call has a follow-up action
    if (payload.next_action_date && ['callback_scheduled', 'needs_follow_up', 'meeting_booked'].indexOf(outcome) >= 0) {
        try {
            createCallFollowUpSLA_(
                callId, auth.user.email, auth.user.name,
                clientId, client.name || client.company || 'Unknown',
                outcome, payload.next_action_date
            );
        } catch(e) { Logger.log('createCallFollowUpSLA_ error: ' + e.message); }
    }

    logAction_(auth.user.user_id, auth.user.name, 'CALL_LOGGED',
        client.name + ' / ' + (payload.path_loaded || 'unknown') + ' → ' + outcome);

    return successResponse_({
        callId: callId,
        autoAdvanced: autoAdvanced || null,
        duration: durationSeconds
    }, 'Call logged successfully.');
}

// ─── GET CALL LOGS ───────────────────────────────────────

function handleGetCallLogs(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var logs = sheetToObjects_(SHEETS.CALL_LOGS);

    // Filter by client if specified
    if (payload.client_id) {
        logs = logs.filter(function(l) { return l.client_id === payload.client_id; });
    }

    // Filter by caller if specified
    if (payload.caller_email) {
        logs = logs.filter(function(l) { return l.caller_email === payload.caller_email; });
    }

    // Filter by date range
    if (payload.from_date) {
        var fromDate = new Date(payload.from_date);
        logs = logs.filter(function(l) { return new Date(l.call_start) >= fromDate; });
    }
    if (payload.to_date) {
        var toDate = new Date(payload.to_date);
        logs = logs.filter(function(l) { return new Date(l.call_start) <= toDate; });
    }

    // Sort by call_start descending (most recent first)
    logs.sort(function(a, b) { return new Date(b.call_start) - new Date(a.call_start); });

    // Enrich with client name
    var clients = sheetToObjects_(SHEETS.CLIENTS);
    var clientMap = {};
    clients.forEach(function(c) { clientMap[c.client_id] = { name: c.name || c.company || 'Unknown', company: c.company || '' }; });
    logs.forEach(function(l) {
        var c = clientMap[l.client_id] || { name: 'Unknown', company: '' };
        l.client_name = c.name;
        l.client_company = c.company;
    });

    // Pagination
    var page = Number(payload.page) || 0;
    var pageSize = Number(payload.page_size) || 50;
    var total = logs.length;
    logs = logs.slice(page * pageSize, (page + 1) * pageSize);

    return successResponse_({ logs: logs, total: total, page: page, pageSize: pageSize });
}

// ─── CALL ANALYTICS ──────────────────────────────────────

function handleGetCallAnalytics(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var allLogs = sheetToObjects_(SHEETS.CALL_LOGS);
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

    var today = allLogs.filter(function(l) { return new Date(l.call_start) >= todayStart; });
    var thisWeek = allLogs.filter(function(l) { return new Date(l.call_start) >= weekStart; });

    // ── Summary metrics ──
    var totalDuration = allLogs.reduce(function(s, l) { return s + Number(l.duration_seconds || 0); }, 0);
    var avgDuration = allLogs.length > 0 ? Math.round(totalDuration / allLogs.length) : 0;

    var meetingsThisWeek = thisWeek.filter(function(l) { return l.outcome === 'meeting_booked'; }).length;

    // ── Calls by path ──
    var pathCounts = {};
    allLogs.forEach(function(l) {
        var p = l.path_loaded || 'unknown';
        pathCounts[p] = (pathCounts[p] || 0) + 1;
    });

    // ── Talking point completion rates ──
    var tpStats = {};
    allLogs.forEach(function(l) {
        var path = l.path_loaded || 'unknown';
        if (!tpStats[path]) tpStats[path] = { checked: {}, total: {} };
        try {
            var checked = JSON.parse(l.talking_points_checked || '[]');
            var skipped = JSON.parse(l.talking_points_skipped || '[]');
            checked.forEach(function(tp) {
                tpStats[path].checked[tp] = (tpStats[path].checked[tp] || 0) + 1;
                tpStats[path].total[tp] = (tpStats[path].total[tp] || 0) + 1;
            });
            skipped.forEach(function(tp) {
                tpStats[path].total[tp] = (tpStats[path].total[tp] || 0) + 1;
            });
        } catch(e) {}
    });

    // Convert to completion rates
    var tpCompletionRates = {};
    for (var path in tpStats) {
        tpCompletionRates[path] = {};
        for (var tp in tpStats[path].total) {
            var totalCount = tpStats[path].total[tp];
            var checkedCount = tpStats[path].checked[tp] || 0;
            tpCompletionRates[path][tp] = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
        }
    }

    // ── Conversion rates by path ──
    var conversionByPath = {};
    for (var p in pathCounts) {
        var pathLogs = allLogs.filter(function(l) { return (l.path_loaded || 'unknown') === p; });
        var meetings = pathLogs.filter(function(l) { return l.outcome === 'meeting_booked'; }).length;
        conversionByPath[p] = {
            calls: pathLogs.length,
            meetings: meetings,
            rate: pathLogs.length > 0 ? Math.round((meetings / pathLogs.length) * 100) : 0
        };
    }

    // ── Outcome distribution ──
    var outcomeCounts = {};
    allLogs.forEach(function(l) {
        var o = l.outcome || 'unknown';
        outcomeCounts[o] = (outcomeCounts[o] || 0) + 1;
    });

    // ── Per-caller stats ──
    var callerStats = {};
    allLogs.forEach(function(l) {
        var email = l.caller_email || 'unknown';
        if (!callerStats[email]) callerStats[email] = { name: l.caller_name, calls: 0, meetings: 0, totalDuration: 0 };
        callerStats[email].calls++;
        callerStats[email].totalDuration += Number(l.duration_seconds || 0);
        if (l.outcome === 'meeting_booked') callerStats[email].meetings++;
    });

    // Convert to array and calculate rates
    var callerLeaderboard = Object.keys(callerStats).map(function(email) {
        var s = callerStats[email];
        return {
            email: email,
            name: s.name,
            calls: s.calls,
            meetings: s.meetings,
            conversionRate: s.calls > 0 ? Math.round((s.meetings / s.calls) * 100) : 0,
            avgDuration: s.calls > 0 ? Math.round(s.totalDuration / s.calls) : 0
        };
    }).sort(function(a, b) { return b.meetings - a.meetings || b.calls - a.calls; });

    return successResponse_({
        callsToday: today.length,
        callsThisWeek: thisWeek.length,
        totalCalls: allLogs.length,
        avgDuration: avgDuration,
        meetingsThisWeek: meetingsThisWeek,
        pathCounts: pathCounts,
        tpCompletionRates: tpCompletionRates,
        conversionByPath: conversionByPath,
        outcomeCounts: outcomeCounts,
        callerLeaderboard: callerLeaderboard
    });
}

// ─── COMPETITOR INTEL ────────────────────────────────────

function handleGetCompetitorIntel(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var intel = sheetToObjects_(SHEETS.COMPETITOR_INTEL);

    // Aggregate by system name
    var systemAgg = {};
    intel.forEach(function(i) {
        var name = (i.system_name || 'Unknown').toLowerCase().trim();
        if (!name || name === 'unknown') return;
        if (!systemAgg[name]) systemAgg[name] = { system_name: i.system_name, developer: i.developer_name, count: 0, industries: [] };
        systemAgg[name].count++;
        if (i.industry && systemAgg[name].industries.indexOf(i.industry) === -1) {
            systemAgg[name].industries.push(i.industry);
        }
        if (i.developer_name && !systemAgg[name].developer) systemAgg[name].developer = i.developer_name;
    });

    var aggregated = Object.keys(systemAgg).map(function(k) { return systemAgg[k]; })
        .sort(function(a, b) { return b.count - a.count; });

    return successResponse_({
        raw: intel,
        aggregated: aggregated,
        total: intel.length
    });
}
