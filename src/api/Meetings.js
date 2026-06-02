/**
 * ICUNI Labs — Meetings Module
 * CRUD for meeting lifecycle: booking → confirmation → prep → on-day → post-meeting → qualification.
 * Linked to clients, email templates, and the CRM pipeline.
 */

// ═══════════════════════════════════════════════════════════
// MEETING STAGES (ordered pipeline)
// ═══════════════════════════════════════════════════════════
var MEETING_STAGES = ['booked', 'confirmed', 'prep', 'on_day', 'post_meeting', 'qualified'];

// ═══════════════════════════════════════════════════════════
// GET MEETINGS
// ═══════════════════════════════════════════════════════════
function handleGetMeetings(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var meetings = sheetToObjects_(SHEETS.MEETINGS);
    var clients = sheetToObjects_(SHEETS.CLIENTS);
    var clientMap = {};
    clients.forEach(function(c) { clientMap[c.client_id] = c; });

    // Enrich with client data
    meetings.forEach(function(m) {
        var client = clientMap[m.client_id] || {};
        m.client_name = client.name || 'Unknown';
        m.client_company = client.company || '';
        m.client_email = client.email || '';
        m.client_phone = client.phone || '';
        // Parse JSON fields
        try { m.attendees = JSON.parse(m.attendees_json || '[]'); } catch(e) { m.attendees = []; }
        try { m.demo_checklist = JSON.parse(m.demo_checklist_json || '[]'); } catch(e) { m.demo_checklist = []; }
    });

    // Sort by date descending (newest first)
    meetings.sort(function(a, b) {
        return new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime();
    });

    return successResponse_({ meetings: meetings });
}

// ═══════════════════════════════════════════════════════════
// CREATE MEETING
// ═══════════════════════════════════════════════════════════
function handleCreateMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    validateInput_(payload, {
        client_id: { required: true, label: 'Client' },
        date:      { required: true, label: 'Date' },
        time:      { required: true, label: 'Time' },
        type:      { required: true, label: 'Type' }
    });

    var meetingId = generateId_('MTG');
    var attendees = payload.attendees || [];
    var demoChecklist = payload.demo_checklist || [];

    appendRow_(SHEETS.MEETINGS, [
        meetingId,
        payload.client_id,
        payload.date,
        payload.time,
        payload.type,                          // 'online' or 'in_person'
        payload.location_or_link || '',
        auth.user.email,                       // booked_by
        JSON.stringify(attendees),             // attendees_json
        'booked',                              // stage
        false,                                 // confirmation_sent
        '',                                    // confirmation_template
        false,                                 // reminder_sent
        payload.prep_notes || '',              // prep_notes
        JSON.stringify(demoChecklist),         // demo_checklist_json
        'pending',                             // attendance
        '',                                    // post_meeting_notes
        'pending',                             // qualification_result
        now_(),                                // created_at
        now_()                                 // updated_at
    ]);

    logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'MEETING_CREATED', 
        'Meeting booked for client ' + payload.client_id + ' on ' + payload.date);

    return successResponse_({ meeting_id: meetingId }, 'Meeting booked successfully.');
}

// ═══════════════════════════════════════════════════════════
// UPDATE MEETING
// ═══════════════════════════════════════════════════════════
function handleUpdateMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.meeting_id) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', payload.meeting_id);
    if (!meeting) return errorResponse_('Meeting not found.');

    var updates = {};
    var fields = ['date', 'time', 'type', 'location_or_link', 'stage',
                  'prep_notes', 'attendance', 'post_meeting_notes',
                  'qualification_result', 'confirmation_sent', 'confirmation_template',
                  'reminder_sent'];

    fields.forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });

    // Handle JSON fields specially
    if (payload.attendees !== undefined) {
        updates.attendees_json = JSON.stringify(payload.attendees);
    }
    if (payload.demo_checklist !== undefined) {
        updates.demo_checklist_json = JSON.stringify(payload.demo_checklist);
    }

    updates.updated_at = now_();
    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, updates);

    logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'MEETING_UPDATED',
        'Updated meeting ' + payload.meeting_id + (updates.stage ? ' → ' + updates.stage : ''));

    return successResponse_(null, 'Meeting updated.');
}

// ═══════════════════════════════════════════════════════════
// DELETE MEETING
// ═══════════════════════════════════════════════════════════
function handleDeleteMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.meeting_id) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', payload.meeting_id);
    if (!meeting) return errorResponse_('Meeting not found.');

    deleteRow_(SHEETS.MEETINGS, meeting._rowIndex);

    logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'MEETING_DELETED',
        'Deleted meeting ' + payload.meeting_id);

    return successResponse_(null, 'Meeting deleted.');
}

// ═══════════════════════════════════════════════════════════
// SEND MEETING CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════
function handleSendMeetingConfirmation(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.meeting_id) return errorResponse_('Meeting ID required.');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', payload.meeting_id);
    if (!meeting) return errorResponse_('Meeting not found.');

    var client = findRow_(SHEETS.CLIENTS, 'client_id', meeting.client_id);
    if (!client) return errorResponse_('Client not found.');

    var attendees = [];
    try { attendees = JSON.parse(meeting.attendees_json || '[]'); } catch(e) {}

    // Format meeting details
    var dateStr = meeting.date;
    try {
        dateStr = new Date(meeting.date + 'T00:00').toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    } catch(e) {}

    var timeStr = meeting.time;
    try {
        var parts = meeting.time.split(':');
        var hr = parseInt(parts[0]);
        timeStr = (hr > 12 ? hr - 12 : hr || 12) + ':' + parts[1] + (hr >= 12 ? ' PM' : ' AM');
    } catch(e) {}

    var typeLabel = meeting.type === 'online' ? '🖥️ Online Meeting' : '📍 In-Person Meeting';
    var locationLine = meeting.location_or_link
        ? (meeting.type === 'online'
            ? '<a href="' + meeting.location_or_link + '" style="color:#00bfff;">Join Meeting</a>'
            : meeting.location_or_link)
        : '';

    var attendeeList = attendees.map(function(a) {
        return '<li style="margin-bottom:4px;color:#e8ecf4;">' + (a.name || 'TBD') +
               (a.role ? ' <span style="color:#64748b;">(' + a.role + ')</span>' : '') + '</li>';
    }).join('');

    var bodyHtml = '<div style="margin-bottom:20px;">' +
        'Your meeting with <strong>ICUNI Labs</strong> is confirmed.</div>' +
        '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:20px;margin:16px 0;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
        '<span style="font-size:18px;">' + typeLabel + '</span></div>' +
        '<table style="width:100%;border-collapse:collapse;">' +
        '<tr><td style="padding:6px 0;color:#8b95a8;font-size:13px;width:100px;">Date</td>' +
        '<td style="color:#e8ecf4;font-size:13px;font-weight:600;">' + dateStr + '</td></tr>' +
        '<tr><td style="padding:6px 0;color:#8b95a8;font-size:13px;">Time</td>' +
        '<td style="color:#e8ecf4;font-size:13px;font-weight:600;">' + timeStr + '</td></tr>' +
        (locationLine ? '<tr><td style="padding:6px 0;color:#8b95a8;font-size:13px;">Location</td>' +
        '<td style="color:#e8ecf4;font-size:13px;font-weight:600;">' + locationLine + '</td></tr>' : '') +
        '</table>' +
        (attendeeList ? '<div style="margin-top:12px;"><div style="font-size:11px;color:#64748b;letter-spacing:1px;margin-bottom:6px;">ATTENDEES</div>' +
        '<ul style="margin:0;padding-left:16px;">' + attendeeList + '</ul></div>' : '') +
        '</div>';

    // Send to client
    if (client.email) {
        try {
            sendEmail_({
                to: client.email,
                subject: 'Meeting Confirmed — ICUNI Labs',
                htmlBody: buildBrandedEmail_(client.name || 'there', 'Meeting Confirmed', bodyHtml),
                from: 'labs@icuni.org'
            });
            logEmail_(client.email, 'Meeting Confirmation', 'meeting_confirmation', 'sent');
        } catch(e) {
            logEmail_(client.email, 'Meeting Confirmation', 'meeting_confirmation', 'failed');
        }
    }

    // Also notify attendees from the team
    attendees.forEach(function(a) {
        if (a.email && a.email !== client.email) {
            try {
                sendEmail_({
                    to: a.email,
                    subject: 'Meeting Booked: ' + (client.name || client.company || 'Client') + ' — ' + dateStr,
                    htmlBody: buildBrandedEmail_(a.name || 'Team', 'Meeting Scheduled', bodyHtml),
                    from: 'labs@icuni.org'
                });
            } catch(e) {}
        }
    });

    // Update meeting record (don't auto-advance stage — confirmation can be sent/resent at any stage)
    var confUpdates = {
        confirmation_sent: true,
        confirmation_template: payload.template_id || 'default',
        updated_at: now_()
    };
    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, confUpdates);

    logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'MEETING_CONFIRMED',
        'Sent confirmation for meeting ' + payload.meeting_id);

    return successResponse_(null, 'Confirmation email sent from labs@icuni.org.');
}

// ═══════════════════════════════════════════════════════════
// QUALIFY MEETING (post-meeting → pipeline update)
// ═══════════════════════════════════════════════════════════
function handleQualifyMeeting(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.meeting_id) return errorResponse_('Meeting ID required.');
    if (!payload.result) return errorResponse_('Qualification result required (won/not_won).');

    var meeting = findRow_(SHEETS.MEETINGS, 'meeting_id', payload.meeting_id);
    if (!meeting) return errorResponse_('Meeting not found.');

    // Update meeting
    updateRow_(SHEETS.MEETINGS, meeting._rowIndex, {
        qualification_result: payload.result,
        post_meeting_notes: payload.notes || meeting.post_meeting_notes || '',
        stage: 'qualified',
        updated_at: now_()
    });

    // If won, advance client pipeline to 'won'
    if (payload.result === 'won' && meeting.client_id) {
        var client = findRow_(SHEETS.CLIENTS, 'client_id', meeting.client_id);
        if (client) {
            updateRow_(SHEETS.CLIENTS, client._rowIndex, {
                prospect_stage: 'won',
                last_activity: now_()
            });
            logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'PIPELINE_ADVANCED',
                client.name + ' advanced to Won via meeting qualification');
        }
    }

    logAction_(auth.user.user_id || auth.user.id, auth.user.name, 'MEETING_QUALIFIED',
        'Meeting ' + payload.meeting_id + ' qualified as ' + payload.result);

    return successResponse_(null, 'Meeting qualified as ' + payload.result + '.');
}
