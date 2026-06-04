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

    // ── Classify: attempt vs conversation ──
    // Conversation: >180s AND/OR >=70% talking points checked
    var tpPercent = tpTotal > 0 ? (tpChecked.length / tpTotal) : 0;
    var isConversation = durationSeconds > 180 || tpPercent >= 0.7;
    var callType = isConversation ? 'conversation' : 'attempt';

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

    // ── Same-day same-company grouping ──
    // If caller already logged a call to this client today, merge into existing
    var todayStr = nowStr.substring(0, 10); // YYYY-MM-DD
    var existingToday = sheetToObjects_(SHEETS.CALL_LOGS).filter(function(l) {
        return l.client_id === clientId &&
               l.caller_email === auth.user.email &&
               (l.call_start || l.created_at || '').substring(0, 10) === todayStr;
    });

    if (existingToday.length > 0) {
        // Merge into the first matching log — update end time, duration, append notes
        var existing = existingToday[0];
        var mergedDuration = Number(existing.duration_seconds || 0) + durationSeconds;
        var mergedNotes = (existing.call_notes || '');
        if (payload.call_notes) mergedNotes += (mergedNotes ? '\n---\n' : '') + payload.call_notes;

        // Upgrade to conversation if any segment qualifies
        var mergedType = (existing.call_type === 'conversation' || callType === 'conversation') ? 'conversation' : 'attempt';

        // Use the latest outcome
        var mergedOutcome = outcome || existing.outcome;

        updateRow_(SHEETS.CALL_LOGS, existing._rowIndex, {
            call_end: payload.call_end || nowStr,
            duration_seconds: mergedDuration,
            call_notes: mergedNotes,
            call_type: mergedType,
            outcome: mergedOutcome,
            outcome_details_json: outcomeDetailsJson || existing.outcome_details_json,
            talking_points_checked_json: JSON.stringify(tpChecked.length > 0 ? tpChecked : (existing.talking_points_checked_json ? JSON.parse(existing.talking_points_checked_json) : [])),
            next_action: payload.next_action || existing.next_action,
            next_action_date: payload.next_action_date || existing.next_action_date,
            next_action_notes: payload.next_action_notes || existing.next_action_notes,
            transcript: (existing.transcript || '') + (payload.transcript ? '\n---\n' + payload.transcript : ''),
            created_at: nowStr
        });
        invalidateSheetCache_(SHEETS.CALL_LOGS);

        callId = existing.call_id; // return the existing call ID
    } else {
        // New call log entry
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
            payload.transcript || '',
            callType
        ]);
    }

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

    // ── Daily targets: attempts vs conversations ──
    var todayAttempts = today.filter(function(l) { return l.call_type === 'attempt' || (!l.call_type && Number(l.duration_seconds || 0) <= 180); }).length;
    var todayConversations = today.filter(function(l) { return l.call_type === 'conversation' || (!l.call_type && Number(l.duration_seconds || 0) > 180); }).length;

    // Per-caller daily breakdown
    var callerDaily = {};
    today.forEach(function(l) {
        var email = l.caller_email || 'unknown';
        if (!callerDaily[email]) callerDaily[email] = { name: l.caller_name, attempts: 0, conversations: 0 };
        if (l.call_type === 'conversation' || (!l.call_type && Number(l.duration_seconds || 0) > 180)) {
            callerDaily[email].conversations++;
        } else {
            callerDaily[email].attempts++;
        }
    });

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
        callerLeaderboard: callerLeaderboard,
        // Daily targets
        todayAttempts: todayAttempts,
        todayConversations: todayConversations,
        todayTotal: today.length,
        targetAttempts: { min: 25, max: 30 },
        targetConversations: { min: 15, max: 18 },
        callerDaily: callerDaily
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
