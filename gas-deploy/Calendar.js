/**
 * Calendar.js — Google Calendar integration for ICUNI Labs meetings.
 * 
 * Syncs meeting pipeline stages to the ICUNI Labs shared Google Calendar:
 * - Booked → internal-only event (blocks the time on ICUNI Labs calendar)
 * - Confirmed → sends invite to both ICUNI Labs + client (with Meet link for online)
 * - Rescheduled → updates existing event
 * - Deleted → removes event
 *
 * Also provides available-time-slot queries for salespeople.
 */

// ── Constants ──────────────────────────────────────────────
var ICUNI_CALENDAR_ID = 'primary';  // Uses the deploying user's calendar (menelek@icuni.org)
var ONLINE_START_HOUR = 11;   // 11:00 AM
var ONLINE_END_HOUR   = 15.5; // 3:30 PM
var INPERSON_START_HOUR = 11.5; // 11:30 AM
var INPERSON_END_HOUR   = 17;   // 5:00 PM
var MEETING_DURATION_MIN = 60;
var SLOT_INTERVAL_MIN = 30;

// ═══════════════════════════════════════════════════════════
// CREATE CALENDAR EVENT (Booked stage — internal only)
// ═══════════════════════════════════════════════════════════
function handleCreateCalendarEvent(payload) {
  var auth = requireStaff_(payload.token);
  if (auth.error) return auth.error;

  var meetingId = payload.meeting_id || '';
  var clientName = payload.client_name || 'Client Meeting';
  var date = payload.date; // YYYY-MM-DD
  var time = payload.time; // HH:MM
  var type = payload.type || 'online';
  var location = payload.location_or_link || '';
  var bookedBy = resolveStaffName_(payload.booked_by || auth.user.email);

  if (!date || !time) return errorResponse_('Date and time are required.');

  try {
    var startDt = new Date(date + 'T' + time + ':00');
    var endDt = new Date(startDt.getTime() + MEETING_DURATION_MIN * 60000);

    var eventPayload = {
      summary: 'ICUNI Labs — ' + clientName,
      description: 'Meeting with ' + clientName + '\nBooked by: ' + bookedBy + '\nMeeting ID: ' + meetingId +
                   '\nType: ' + (type === 'online' ? 'Online' : 'In-Person'),
      start: { dateTime: startDt.toISOString(), timeZone: 'Africa/Accra' },
      end:   { dateTime: endDt.toISOString(), timeZone: 'Africa/Accra' },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }, { method: 'email', minutes: 60 }] },
    };

    if (type === 'in_person' && location) {
      eventPayload.location = location;
    }

    var event = CalendarApp.getDefaultCalendar().createEvent(
      eventPayload.summary,
      startDt,
      endDt,
      { description: eventPayload.description, location: eventPayload.location || '' }
    );

    var eventId = event.getId();

    logAction_(auth.user.user_id, auth.user.name, 'CALENDAR_EVENT_CREATED', clientName + ' — ' + date + ' ' + time);

    return successResponse_({ event_id: eventId }, 'Calendar event created.');
  } catch (err) {
    Logger.log('Calendar create error: ' + err.message);
    return errorResponse_('Failed to create calendar event: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// CONFIRM CALENDAR EVENT (Confirmed stage — invite both parties)
// ═══════════════════════════════════════════════════════════
function handleConfirmCalendarEvent(payload) {
  var auth = requireStaff_(payload.token);
  if (auth.error) return auth.error;

  var meetingId = payload.meeting_id || '';
  var clientName = payload.client_name || 'Client Meeting';
  var clientEmail = payload.client_email || '';
  var date = payload.date;
  var time = payload.time;
  var type = payload.type || 'online';
  var location = payload.location_or_link || '';
  var eventId = payload.event_id || '';
  var bookedByEmail = payload.booked_by_email || '';

  if (!date || !time) return errorResponse_('Date and time are required to confirm.');

  try {
    var startDt = new Date(date + 'T' + time + ':00');
    var endDt = new Date(startDt.getTime() + MEETING_DURATION_MIN * 60000);

    // Build guest list
    var guests = [];
    if (clientEmail) guests.push(clientEmail);
    if (bookedByEmail && bookedByEmail !== 'menelek@icuni.org') guests.push(bookedByEmail);

    // For online meetings — create a Google Meet link using Calendar Advanced Service
    var meetLink = '';
    if (type === 'online') {
      // Use Calendar Advanced Service to create event with conferenceData
      var advancedEvent = {
        summary: 'ICUNI Labs — ' + clientName + ' (Confirmed)',
        description: 'Confirmed meeting with ' + clientName + '\nMeeting ID: ' + meetingId +
                     '\nType: Online\n\nThis meeting has been confirmed.',
        start: { dateTime: startDt.toISOString(), timeZone: 'Africa/Accra' },
        end:   { dateTime: endDt.toISOString(), timeZone: 'Africa/Accra' },
        attendees: guests.map(function(e) { return { email: e }; }),
        conferenceData: {
          createRequest: {
            requestId: meetingId + '-' + Date.now(),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }, { method: 'email', minutes: 60 }] },
        guestsCanModify: false,
        sendUpdates: 'all'
      };

      // Delete old internal-only event if it exists
      if (eventId) {
        try {
          var cal = CalendarApp.getDefaultCalendar();
          var oldEvent = cal.getEventById(eventId);
          if (oldEvent) oldEvent.deleteEvent();
        } catch (e) { /* old event might not exist */ }
      }

      // Create via Advanced Service with conferenceDataVersion
      var created = Calendar.Events.insert(advancedEvent, ICUNI_CALENDAR_ID, { conferenceDataVersion: 1, sendUpdates: 'all' });
      meetLink = (created.conferenceData && created.conferenceData.entryPoints)
        ? created.conferenceData.entryPoints.filter(function(ep) { return ep.entryPointType === 'video'; })[0]?.uri || ''
        : '';

      eventId = created.id;
    } else {
      // In-person meeting — update existing or create new
      if (eventId) {
        try {
          var cal2 = CalendarApp.getDefaultCalendar();
          var existing = cal2.getEventById(eventId);
          if (existing) {
            existing.setTitle('ICUNI Labs — ' + clientName + ' (Confirmed)');
            existing.setDescription('Confirmed in-person meeting with ' + clientName + '\nMeeting ID: ' + meetingId);
            if (location) existing.setLocation(location);
            guests.forEach(function(g) { existing.addGuest(g); });
          }
        } catch (e) {
          Logger.log('Failed to update event: ' + e.message);
        }
      } else {
        var cal3 = CalendarApp.getDefaultCalendar();
        var newEvent = cal3.createEvent(
          'ICUNI Labs — ' + clientName + ' (Confirmed)',
          startDt, endDt,
          {
            description: 'Confirmed in-person meeting with ' + clientName + '\nMeeting ID: ' + meetingId,
            location: location,
            guests: guests.join(','),
            sendInvites: true
          }
        );
        eventId = newEvent.getId();
      }
    }

    logAction_(auth.user.user_id, auth.user.name, 'CALENDAR_CONFIRMED', clientName + ' — ' + date + ' ' + time);

    return successResponse_({
      event_id: eventId,
      meet_link: meetLink
    }, 'Meeting confirmed and invites sent.');
  } catch (err) {
    Logger.log('Calendar confirm error: ' + err.message + '\n' + (err.stack || ''));
    return errorResponse_('Failed to confirm calendar event: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// GET AVAILABLE TIME SLOTS
// ═══════════════════════════════════════════════════════════
function handleGetAvailableSlots(payload) {
  var auth = requireStaff_(payload.token);
  if (auth.error) return auth.error;

  var type = payload.type || 'online';
  var daysAhead = payload.days_ahead || 5;

  var startHour = type === 'online' ? ONLINE_START_HOUR : INPERSON_START_HOUR;
  var endHour = type === 'online' ? ONLINE_END_HOUR : INPERSON_END_HOUR;

  try {
    var cal = CalendarApp.getDefaultCalendar();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var slots = [];
    var businessDaysChecked = 0;
    var dayOffset = 0;

    while (businessDaysChecked < daysAhead && dayOffset < 14) {
      var day = new Date(today.getTime() + dayOffset * 86400000);
      dayOffset++;

      // Skip weekends
      var dow = day.getDay();
      if (dow === 0 || dow === 6) continue;
      businessDaysChecked++;

      // Get events for this day
      var dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
      var dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      var events = cal.getEvents(dayStart, dayEnd);

      // Build busy intervals
      var busy = events.map(function(ev) {
        return {
          start: ev.getStartTime().getTime(),
          end: ev.getEndTime().getTime()
        };
      });

      // Generate 30-min slot candidates within business hours
      var slotStartMinutes = startHour * 60;
      var slotEndMinutes = endHour * 60;

      for (var min = slotStartMinutes; min + MEETING_DURATION_MIN <= slotEndMinutes; min += SLOT_INTERVAL_MIN) {
        var slotStart = new Date(day);
        slotStart.setHours(Math.floor(min / 60), min % 60, 0, 0);
        var slotEnd = new Date(slotStart.getTime() + MEETING_DURATION_MIN * 60000);

        // Check for conflicts
        var conflict = busy.some(function(b) {
          return slotStart.getTime() < b.end && slotEnd.getTime() > b.start;
        });

        if (!conflict) {
          // Skip if in the past
          if (slotStart.getTime() > Date.now()) {
            slots.push({
              date: Utilities.formatDate(day, 'Africa/Accra', 'yyyy-MM-dd'),
              time: Utilities.formatDate(slotStart, 'Africa/Accra', 'HH:mm'),
              day_label: Utilities.formatDate(day, 'Africa/Accra', 'EEE, dd MMM'),
              time_label: Utilities.formatDate(slotStart, 'Africa/Accra', 'h:mm a')
            });
          }
        }
      }
    }

    return successResponse_({ slots: slots }, slots.length + ' available slots found.');
  } catch (err) {
    Logger.log('Available slots error: ' + err.message);
    return errorResponse_('Failed to check available slots: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// DELETE CALENDAR EVENT
// ═══════════════════════════════════════════════════════════
function handleDeleteCalendarEvent(payload) {
  var auth = requireStaff_(payload.token);
  if (auth.error) return auth.error;

  var eventId = payload.event_id;
  if (!eventId) return errorResponse_('Event ID required.');

  try {
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(eventId);
    if (event) {
      event.deleteEvent();
      logAction_(auth.user.user_id, auth.user.name, 'CALENDAR_EVENT_DELETED', 'Event ' + eventId);
      return successResponse_(null, 'Calendar event deleted.');
    }
    return errorResponse_('Event not found.');
  } catch (err) {
    Logger.log('Calendar delete error: ' + err.message);
    return errorResponse_('Failed to delete calendar event: ' + err.message);
  }
}

// ── Helper: resolve staff name from email ──
function resolveStaffName_(email) {
  if (!email) return 'Unknown';
  try {
    var users = sheetToObjects_(SHEETS.USERS);
    var user = users.filter(function(u) { return u.email === email; })[0];
    return user ? user.name : email.split('@')[0];
  } catch (e) {
    return email.split('@')[0];
  }
}
