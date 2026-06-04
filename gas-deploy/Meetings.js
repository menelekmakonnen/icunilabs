/**
 * ICUNI Labs — Meetings Module
 * Full CRUD for meeting pipeline management.
 * Handles creation, updates, stage transitions, regression, and cancellation.
 */

// ─── MEETING STAGES ──────────────────────────────────────
var MEETING_STAGES = ['booked', 'confirmed', 'on_day', 'completed', 'cancelled', 'regressed'];

// ─── GET ALL MEETINGS ────────────────────────────────────
function handleGetMeetings(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetings = sheetToObjects_(SHEETS.MEETINGS);

    // Filter out regressed AND cancelled meetings (they're no longer active)
    if (!payload.include_regressed) {
        meetings = meetings.filter(function(m) { return m.stage !== 'regressed' && m.stage !== 'cancelled'; });
    }

    // Filter by client if specified
    if (payload.client_id) {
        meetings = meetings.filter(function(m) { return m.client_id === payload.client_id; });
    }

    // Parse demo_checklist_json
    meetings.forEach(function(m) {
        try { m.demo_checklist = JSON.parse(m.demo_checklist_json || '[]'); } catch(e) { m.demo_checklist = []; }
    });

    // Sort by date ascending (upcoming first)
    meetings.sort(function(a, b) {
        var da = a.date || '9999-12-31';
        var db = b.date || '9999-12-31';
        return da.localeCompare(db) || (a.time || '').localeCompare(b.time || '');
    });

    return successResponse_({ meetings: meetings });
}

// ─── CREATE MEETING ──────────────────────────────────────
function handleCreateMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var clientId = payload.client_id;
    if (!clientId) return errorResponse_('Client ID required.');

    var meetingId = generateId_('MTG');
    var nowStr = now_();

    // Look up client for name/company
    var client = findRow_(SHEETS.CLIENTS, 'client_id', clientId);
    var clientName = payload.client_name || (client ? (client.name || client.company || 'Unknown') : 'Unknown');
    var clientCompany = payload.client_company || (client ? (client.company || '') : '');

    // Map client_email → contact_email (frontend sends client_email)
    var contactEmail = payload.contact_email || payload.client_email || '';

    appendRow_(SHEETS.MEETINGS, [
        meetingId, clientId, clientName, clientCompany,
        payload.contact_name || '', contactEmail,
        payload.date || '', String(payload.time || ''),
        payload.type || 'online', payload.location_or_link || '',
        payload.booked_by || auth.user.email,
        'booked', // initial stage
        '', '', // prep_notes, post_meeting_notes
        '[]', // demo_checklist_json
        '', '', // event_id, meet_link
        '', // confirmation_sent
        '', '', // result, result_notes
        nowStr, nowStr
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_CREATED', clientName + ' — ' + (payload.date || 'TBD'));

    return successResponse_({
        meeting_id: meetingId,
        client_name: clientName
    }, 'Meeting created.');
}

// ─── UPDATE MEETING ──────────────────────────────────────
function handleUpdateMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    // Build update object from provided fields
    var updates = { updated_at: now_() };
    var allowedFields = [
        'client_name', 'client_company', 'contact_name', 'contact_email',
        'date', 'time', 'type', 'location_or_link',
        'booked_by', 'stage', 'prep_notes', 'post_meeting_notes',
        'event_id', 'meet_link', 'confirmation_sent',
        'result', 'result_notes'
    ];

    allowedFields.forEach(function(field) {
        if (payload[field] !== undefined) {
            updates[field] = payload[field];
        }
    });

    // Force time to be a string (prevent Sheets date auto-format)
    if (updates.time !== undefined) {
        updates.time = String(updates.time);
    }

    // Map client_email → contact_email (frontend sends client_email)
    if (payload.client_email !== undefined && !payload.contact_email) {
        updates.contact_email = payload.client_email;
    }

    // Handle demo_checklist separately (serialize to JSON)
    if (payload.demo_checklist !== undefined) {
        try { updates.demo_checklist_json = JSON.stringify(payload.demo_checklist); } catch(e) {}
    }

    // Handle client_email — also update client record
    if (payload.client_email !== undefined && meeting.client_id) {
        var client = findRow_(SHEETS.CLIENTS, 'client_id', meeting.client_id);
        if (client) {
            updateRow_(SHEETS.CLIENTS, client._rowIndex, { email: payload.client_email });
            invalidateSheetCache_(SHEETS.CLIENTS);
        }
    }

    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, updates);
    invalidateSheetCache_(SHEETS.MEETINGS);

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_UPDATED',
        (meeting.client_name || meetingId) + ' — ' + Object.keys(updates).join(', '));

    return successResponse_({ meeting_id: meetingId }, 'Meeting updated.');
}

// ─── DELETE MEETING ──────────────────────────────────────
function handleDeleteMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    // Delete the row
    deleteRow_(SHEETS.MEETINGS, meeting._rowIndex);
    invalidateSheetCache_(SHEETS.MEETINGS);

    // Also delete calendar event if one exists
    if (meeting.event_id) {
        try { handleDeleteCalendarEvent({ token: payload.token, event_id: meeting.event_id }); } catch(e) {}
    }

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_DELETED', meeting.client_name || meetingId);

    return successResponse_(null, 'Meeting deleted.');
}

// ─── SEND MEETING CONFIRMATION ──────────────────────────
function handleSendMeetingConfirmation(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    var clientEmail = payload.client_email || meeting.contact_email || '';
    if (!clientEmail) return errorResponse_('No email address for this meeting.');

    if (!meeting.date || !meeting.time) return errorResponse_('Date and time must be set before confirming.');

    // Update stage to confirmed
    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, {
        stage: 'confirmed',
        contact_email: clientEmail,
        confirmation_sent: now_(),
        updated_at: now_()
    });
    invalidateSheetCache_(SHEETS.MEETINGS);

    // Create/update calendar event with confirmation
    try {
        var calResult = handleConfirmCalendarEvent({
            token: payload.token,
            meeting_id: meetingId,
            client_name: meeting.client_name,
            client_email: clientEmail,
            date: meeting.date,
            time: meeting.time,
            type: meeting.type || 'online',
            location_or_link: meeting.location_or_link || '',
            event_id: meeting.event_id || '',
            booked_by_email: meeting.booked_by || ''
        });

        // Save the event_id and meet_link from calendar
        var calData = {};
        try {
            var parsed = JSON.parse(calResult.getContent());
            if (parsed.data) {
                calData.event_id = parsed.data.event_id || '';
                calData.meet_link = parsed.data.meet_link || '';
            }
        } catch(e) {}

        if (calData.event_id || calData.meet_link) {
            updateRow_(SHEETS.MEETINGS, meeting._rowIndex, calData);
        }
    } catch (e) {
        Logger.log('Calendar confirm during meeting confirmation failed: ' + e.message);
    }

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_CONFIRMED',
        meeting.client_name + ' — ' + meeting.date + ' ' + meeting.time);

    return successResponse_({
        meeting_id: meetingId,
        stage: 'confirmed'
    }, 'Meeting confirmed and invitation sent.');
}

// ─── QUALIFY MEETING (set result) ────────────────────────
function handleQualifyMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, {
        stage: 'completed',
        result: payload.result || '',
        result_notes: payload.notes || '',
        updated_at: now_()
    });
    invalidateSheetCache_(SHEETS.MEETINGS);

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_QUALIFIED',
        meeting.client_name + ' — ' + (payload.result || 'no result'));

    return successResponse_({ meeting_id: meetingId }, 'Meeting qualified.');
}

// ─── REGRESS MEETING (return to call pipeline) ──────────
function handleRegressMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    var targetStage = payload.target_stage || 'contacted';
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    // Mark meeting as regressed
    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, {
        stage: 'regressed',
        result_notes: (meeting.result_notes || '') + '\nRegressed to ' + targetStage + ' on ' + now_(),
        updated_at: now_()
    });
    invalidateSheetCache_(SHEETS.MEETINGS);

    // Revert client pipeline stage
    if (meeting.client_id) {
        var client = findRow_(SHEETS.CLIENTS, 'client_id', meeting.client_id);
        if (client) {
            updateRow_(SHEETS.CLIENTS, client._rowIndex, {
                prospect_stage: targetStage,
                last_activity: now_()
            });
            invalidateSheetCache_(SHEETS.CLIENTS);

            // Add note
            var noteId = generateId_('NTE');
            appendRow_(SHEETS.CLIENT_NOTES, [
                noteId, meeting.client_id,
                'Meeting regressed: pipeline stage set to ' + targetStage,
                auth.user.name, auth.user.email, now_()
            ]);
        }
    }

    // Delete calendar event if one exists
    if (meeting.event_id) {
        try { handleDeleteCalendarEvent({ token: payload.token, event_id: meeting.event_id }); } catch(e) {}
    }

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_REGRESSED',
        meeting.client_name + ' → ' + targetStage);

    return successResponse_({
        meeting_id: meetingId,
        new_stage: targetStage
    }, 'Meeting regressed. Client returned to ' + targetStage + '.');
}

// ─── CANCEL MEETING ──────────────────────────────────────
function handleCancelMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetingId = payload.meeting_id;
    if (!meetingId) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', meetingId);
    if (!meeting) return errorResponse_('Meeting not found.');

    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, {
        stage: 'cancelled',
        result_notes: (meeting.result_notes || '') + '\nCancelled on ' + now_() + (payload.reason ? ': ' + payload.reason : ''),
        updated_at: now_()
    });
    invalidateSheetCache_(SHEETS.MEETINGS);

    // Delete calendar event if one exists
    if (meeting.event_id) {
        try { handleDeleteCalendarEvent({ token: payload.token, event_id: meeting.event_id }); } catch(e) {}
    }

    logAction_(auth.user.user_id, auth.user.name, 'MEETING_CANCELLED',
        meeting.client_name + (payload.reason ? ' — ' + payload.reason : ''));

    return successResponse_({ meeting_id: meetingId }, 'Meeting cancelled.');
}
