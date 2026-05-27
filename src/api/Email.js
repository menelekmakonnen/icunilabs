/**
 * ICUNI Labs — Email Hub
 * Gmail-bridged email service for the Ops Console.
 * Provides role-based inbox reading, threaded replies, branded sending,
 * template management, and alias administration.
 *
 * Dependencies: Config.js, Utils.js, Auth.js, Projects.js (buildBrandedEmail_)
 */

// ═══════════════════════════════════════════════════════════
// ALIAS HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get the alias registry. Reads from the Email_Aliases sheet if populated,
 * otherwise falls back to the hardcoded seed in Config.js and seeds the sheet.
 */
function getAliasRegistry_() {
    var sheet = ensureSheet_(SHEETS.EMAIL_ALIASES, [
        'alias', 'name', 'visibility', 'owner', 'category', 'can_send', 'can_receive', 'created_at'
    ]);
    var rows = sheetToObjects_(SHEETS.EMAIL_ALIASES);
    if (rows.length > 0) {
        var registry = {};
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            registry[r.alias] = {
                name: r.name || r.alias,
                visibility: r.visibility || 'all',
                owner: r.owner || '',
                category: r.category || 'general',
                can_send: r.can_send !== 'false',
                can_receive: r.can_receive !== 'false'
            };
        }
        return registry;
    }

    // Seed from hardcoded defaults
    var seed = EMAIL_ALIASES;
    var keys = Object.keys(seed);
    for (var j = 0; j < keys.length; j++) {
        var alias = keys[j];
        var cfg = seed[alias];
        sheet.appendRow([
            alias, cfg.name, cfg.visibility, cfg.owner || '', cfg.category || 'general',
            'true', 'true', now_()
        ]);
    }
    return seed;
}

/**
 * Get list of aliases accessible to a specific user.
 * Priority: 1) Godmode sees all, 2) User's assigned mailboxes from User_Mailboxes sheet,
 * 3) User's company_email if set, 4) Role-based visibility rules from alias registry.
 */
function getAccessibleAliases_(user) {
    var registry = getAliasRegistry_();
    var allAliases = Object.keys(registry);

    // Godmode sees everything
    if (user.role === ROLES.GODMODE) return allAliases;

    var accessible = [];
    var seen = {};

    // 1. User's company email is always accessible
    if (user.company_email) {
        seen[user.company_email] = true;
        accessible.push(user.company_email);
    }

    // 2. Explicitly assigned mailboxes from User_Mailboxes sheet
    var assignments = getUserMailboxAssignments_(user.email || user.id);
    for (var a = 0; a < assignments.length; a++) {
        if (!seen[assignments[a]]) {
            seen[assignments[a]] = true;
            accessible.push(assignments[a]);
        }
    }

    // 3. Private aliases owned by this user
    for (var i = 0; i < allAliases.length; i++) {
        var alias = allAliases[i];
        var cfg = registry[alias];
        if (cfg.visibility === 'private' && cfg.owner === user.email && !seen[alias]) {
            seen[alias] = true;
            accessible.push(alias);
        }
    }

    return accessible;
}

/**
 * Get mailbox assignments for a user from User_Mailboxes sheet.
 */
function getUserMailboxAssignments_(userIdentifier) {
    ensureSheet_(SHEETS.USER_MAILBOXES || 'User_Mailboxes', ['user_email', 'mailbox', 'assigned_by', 'assigned_at']);
    var rows = sheetToObjects_(SHEETS.USER_MAILBOXES || 'User_Mailboxes');
    var mailboxes = [];
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].user_email && rows[i].user_email.toString().toLowerCase().trim() === userIdentifier.toString().toLowerCase().trim()) {
            mailboxes.push(rows[i].mailbox);
        }
    }
    return mailboxes;
}

/**
 * Assign a mailbox to a user. Godmode/SuperAdmin only.
 */
function handleAssignMailbox(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;
    var userEmail = (payload.userEmail || '').trim().toLowerCase();
    var mailbox = (payload.mailbox || '').trim().toLowerCase();
    if (!userEmail || !mailbox) return errorResponse_('User email and mailbox are required.');

    // Check if already assigned
    var existing = getUserMailboxAssignments_(userEmail);
    if (existing.indexOf(mailbox) > -1) return errorResponse_('Mailbox already assigned to this user.');

    var sheet = ensureSheet_(SHEETS.USER_MAILBOXES || 'User_Mailboxes', ['user_email', 'mailbox', 'assigned_by', 'assigned_at']);
    sheet.appendRow([userEmail, mailbox, auth.user.email, now_()]);
    logAction_(auth.user.user_id, auth.user.name, 'MAILBOX_ASSIGNED', mailbox + ' → ' + userEmail);
    return successResponse_(null, 'Mailbox assigned.');
}

/**
 * Remove a mailbox assignment. Godmode/SuperAdmin only.
 */
function handleRemoveMailbox(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;
    var userEmail = (payload.userEmail || '').trim().toLowerCase();
    var mailbox = (payload.mailbox || '').trim().toLowerCase();
    if (!userEmail || !mailbox) return errorResponse_('User email and mailbox are required.');

    var sheet = ensureSheet_(SHEETS.USER_MAILBOXES || 'User_Mailboxes', ['user_email', 'mailbox', 'assigned_by', 'assigned_at']);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().toLowerCase().trim() === userEmail &&
            data[i][1].toString().toLowerCase().trim() === mailbox) {
            sheet.deleteRow(i + 1);
            logAction_(auth.user.user_id, auth.user.name, 'MAILBOX_REMOVED', mailbox + ' from ' + userEmail);
            return successResponse_(null, 'Mailbox removed.');
        }
    }
    return errorResponse_('Assignment not found.');
}

/**
 * Get a user's mailbox assignments (for admin view).
 */
function handleGetUserMailboxes(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var targetEmail = payload.userEmail || auth.user.email;
    // Non-elevated users can only see their own
    if (targetEmail !== auth.user.email && auth.user.role !== ROLES.GODMODE && auth.user.role !== ROLES.SUPERADMIN) {
        return errorResponse_('Not authorized.');
    }
    var assigned = getUserMailboxAssignments_(targetEmail);
    var registry = getAliasRegistry_();
    var result = assigned.map(function(mb) {
        var cfg = registry[mb] || {};
        return { alias: mb, name: cfg.name || mb, category: cfg.category || 'general' };
    });
    return successResponse_(result);
}

/**
 * Get aliases a user can SEND from.
 */
function getSendableAliases_(user) {
    var registry = getAliasRegistry_();
    var accessible = getAccessibleAliases_(user);
    return accessible.filter(function(alias) {
        return registry[alias] && registry[alias].can_send !== false;
    });
}

// ═══════════════════════════════════════════════════════════
// INBOX — READ GMAIL THREADS
// ═══════════════════════════════════════════════════════════

/**
 * Fetch inbox threads for the current user's accessible aliases.
 * payload: { token, alias?: string, page?: number, pageSize?: number, query?: string }
 */
function handleGetInbox(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var userAliases = getAccessibleAliases_(auth.user);
    if (userAliases.length === 0) return successResponse_({ threads: [], total: 0, page: 0 });

    var alias = payload.alias || 'all';
    var page = parseInt(payload.page) || 0;
    var pageSize = Math.min(parseInt(payload.pageSize) || 20, 50);
    var extraQuery = payload.query || '';
    var folder = payload.folder || 'all'; // 'inbox' | 'sent' | 'all'

    // Build Gmail search query
    var aliasParts = [];
    if (alias !== 'all') {
        if (userAliases.indexOf(alias) === -1) return errorResponse_('No access to this alias.');
        if (folder === 'inbox') {
            aliasParts.push('to:' + alias);
        } else if (folder === 'sent') {
            aliasParts.push('from:' + alias);
        } else {
            aliasParts.push('(to:' + alias + ' OR from:' + alias + ')');
        }
    } else {
        var parts = [];
        for (var i = 0; i < userAliases.length; i++) {
            if (folder === 'inbox') {
                parts.push('to:' + userAliases[i]);
            } else if (folder === 'sent') {
                parts.push('from:' + userAliases[i]);
            } else {
                parts.push('to:' + userAliases[i]);
                parts.push('from:' + userAliases[i]);
            }
        }
        aliasParts.push('(' + parts.join(' OR ') + ')');
    }

    var searchQuery = aliasParts.join(' ');
    if (extraQuery) searchQuery += ' ' + extraQuery;

    try {
        var threads = GmailApp.search(searchQuery, page * pageSize, pageSize);
        var summaries = [];

        for (var t = 0; t < threads.length; t++) {
            var thread = threads[t];
            var firstMsg = thread.getMessages()[0];
            var lastMsg = thread.getMessages()[thread.getMessageCount() - 1];

            summaries.push({
                id: thread.getId(),
                subject: thread.getFirstMessageSubject(),
                from: lastMsg.getFrom(),
                to: firstMsg.getTo(),
                date: lastMsg.getDate().toISOString(),
                snippet: thread.getMessages().length > 0 ? lastMsg.getPlainBody().substring(0, 200) : '',
                messageCount: thread.getMessageCount(),
                unread: thread.isUnread(),
                labels: thread.getLabels().map(function(l) { return l.getName(); })
            });
        }

        // Ensure newest-first ordering
        summaries.sort(function(a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });

        return successResponse_({
            threads: summaries,
            page: page,
            pageSize: pageSize,
            aliases: userAliases
        });
    } catch (e) {
        Logger.log('getInbox error: ' + e.message);
        return errorResponse_('Failed to fetch inbox: ' + e.message);
    }
}

/**
 * Get full thread content with all messages.
 * payload: { token, threadId }
 */
function handleGetThread(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.threadId) return errorResponse_('Thread ID required.');

    var userAliases = getAccessibleAliases_(auth.user);

    try {
        var thread = GmailApp.getThreadById(payload.threadId);
        if (!thread) return errorResponse_('Thread not found.');

        // Verify the user has access to at least one alias in this thread
        var messages = thread.getMessages();
        var hasAccess = false;
        for (var i = 0; i < messages.length && !hasAccess; i++) {
            var msg = messages[i];
            var from = msg.getFrom() || '';
            var to = msg.getTo() || '';
            var cc = msg.getCc() || '';
            var all = from + ' ' + to + ' ' + cc;
            for (var a = 0; a < userAliases.length; a++) {
                if (all.indexOf(userAliases[a]) > -1) {
                    hasAccess = true;
                    break;
                }
            }
        }

        if (!hasAccess && auth.user.role !== ROLES.GODMODE) {
            return errorResponse_('No access to this thread.');
        }

        var msgList = [];
        for (var m = 0; m < messages.length; m++) {
            var msg = messages[m];
            var attachments = msg.getAttachments();
            var attachInfo = [];
            for (var at = 0; at < attachments.length; at++) {
                attachInfo.push({
                    name: attachments[at].getName(),
                    size: attachments[at].getSize(),
                    contentType: attachments[at].getContentType()
                });
            }

            msgList.push({
                id: msg.getId(),
                from: msg.getFrom(),
                to: msg.getTo(),
                cc: msg.getCc() || '',
                date: msg.getDate().toISOString(),
                subject: msg.getSubject(),
                body: msg.getBody(),
                plainBody: msg.getPlainBody(),
                attachments: attachInfo,
                isStarred: msg.isStarred()
            });
        }

        // Mark as read
        thread.markRead();

        return successResponse_({
            id: thread.getId(),
            subject: thread.getFirstMessageSubject(),
            messages: msgList,
            labels: thread.getLabels().map(function(l) { return l.getName(); })
        });
    } catch (e) {
        Logger.log('getThread error: ' + e.message);
        return errorResponse_('Failed to fetch thread: ' + e.message);
    }
}

// ═══════════════════════════════════════════════════════════
// SEND & REPLY
// ═══════════════════════════════════════════════════════════

/**
 * Reply to an existing Gmail thread.
 * payload: { token, threadId, body, fromAlias?, useTemplate? }
 */
function handleReplyToThread(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.threadId) return errorResponse_('Thread ID required.');
    if (!payload.body || !payload.body.trim()) return errorResponse_('Reply body required.');

    var sendable = getSendableAliases_(auth.user);
    var replyFrom = payload.fromAlias || 'labs@icuni.org';

    if (sendable.indexOf(replyFrom) === -1) {
        return errorResponse_('You cannot send from ' + replyFrom);
    }

    try {
        var thread = GmailApp.getThreadById(payload.threadId);
        if (!thread) return errorResponse_('Thread not found.');

        var htmlBody;
        if (payload.useTemplate) {
            htmlBody = buildBrandedEmail_(
                auth.user.name,
                'Re: ' + thread.getFirstMessageSubject(),
                payload.body.replace(/\n/g, '<br>')
            );
        } else {
            // Simple HTML formatting
            htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#222;line-height:1.6;">' +
                payload.body.replace(/\n/g, '<br>') +
                '<br><br><div style="color:#888;font-size:12px;">— ' + auth.user.name + ' | ICUNI Labs</div></div>';
        }

        thread.reply('', {
            htmlBody: htmlBody,
            from: replyFrom,
            name: auth.user.name + ' — ICUNI Labs'
        });

        logAction_(auth.user.user_id, auth.user.name, 'EMAIL_REPLIED',
            replyFrom + ' → ' + thread.getFirstMessageSubject());
        logEmail_(thread.getMessages()[0].getFrom(), thread.getFirstMessageSubject(), 'thread_reply', 'sent');

        return successResponse_(null, 'Reply sent.');
    } catch (e) {
        Logger.log('replyToThread error: ' + e.message);
        return errorResponse_('Failed to send reply: ' + e.message);
    }
}

/**
 * Send a new branded email.
 * payload: { token, to, subject, body, fromAlias?, template?, recipients?, useTemplate? }
 * For bulk: recipients = [{ email, name }]
 */
function handleSendBrandedEmail(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var sendable = getSendableAliases_(auth.user);
    var fromAlias = payload.fromAlias || 'labs@icuni.org';

    if (sendable.indexOf(fromAlias) === -1) {
        return errorResponse_('You cannot send from ' + fromAlias);
    }

    // Build recipients list
    var recipients = [];
    if (payload.recipients && Array.isArray(payload.recipients) && payload.recipients.length > 0) {
        recipients = payload.recipients;
    } else if (payload.to) {
        recipients = [{ email: payload.to, name: payload.recipientName || '' }];
    } else {
        return errorResponse_('At least one recipient required.');
    }

    if (!payload.subject || !payload.subject.trim()) return errorResponse_('Subject required.');
    if (!payload.body || !payload.body.trim()) return errorResponse_('Email body required.');

    var sent = 0, failed = 0, errors = [];

    for (var i = 0; i < recipients.length; i++) {
        var r = recipients[i];
        var email = r.email;
        var name = r.name || email.split('@')[0];

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            failed++;
            errors.push(email + ': invalid email');
            continue;
        }

        var htmlBody;
        if (payload.useTemplate !== false) {
            // Use branded template by default
            htmlBody = buildBrandedEmail_(
                name,
                payload.subject,
                payload.body.replace(/\n/g, '<br>'),
                payload.templateOpts || {}
            );
        } else {
            htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#222;line-height:1.6;">' +
                payload.body.replace(/\n/g, '<br>') +
                '<br><br><div style="color:#888;font-size:12px;">— ' + auth.user.name + ' | ICUNI Labs</div></div>';
        }

        try {
            sendEmail_({
                to: email,
                subject: payload.subject,
                htmlBody: htmlBody,
                from: fromAlias,
                name: auth.user.name + ' — ICUNI Labs'
            });
            logEmail_(email, payload.subject, 'branded_email', 'sent');
            sent++;
        } catch (e) {
            logEmail_(email, payload.subject, 'branded_email', 'failed');
            failed++;
            errors.push(email + ': ' + e.message);
        }
    }

    logAction_(auth.user.user_id, auth.user.name, 'EMAIL_SENT',
        fromAlias + ' | ' + sent + ' sent, ' + failed + ' failed | ' + payload.subject);

    return successResponse_({
        sent: sent,
        failed: failed,
        errors: errors
    }, sent + ' email(s) sent' + (failed > 0 ? ', ' + failed + ' failed.' : '.'));
}

// ═══════════════════════════════════════════════════════════
// ALIAS MANAGEMENT (Godmode only)
// ═══════════════════════════════════════════════════════════

/**
 * Get email aliases accessible to the current user.
 * payload: { token }
 */
function handleGetEmailAliases(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var registry = getAliasRegistry_();
    var accessible = getAccessibleAliases_(auth.user);
    var sendable = getSendableAliases_(auth.user);

    var aliases = [];
    var keys = Object.keys(registry);
    for (var i = 0; i < keys.length; i++) {
        var alias = keys[i];
        var cfg = registry[alias];
        var canAccess = accessible.indexOf(alias) > -1;
        var canSend = sendable.indexOf(alias) > -1;

        // Non-elevated users only see their accessible aliases
        if (!canAccess && auth.user.role !== ROLES.GODMODE) continue;

        aliases.push({
            alias: alias,
            name: cfg.name,
            visibility: cfg.visibility,
            owner: cfg.owner || '',
            category: cfg.category || 'general',
            can_send: canSend,
            can_receive: canAccess,
            is_mine: canAccess
        });
    }

    // Also return auto-discovered Gmail aliases
    try {
        var gmailAliases = GmailApp.getAliases();
        // Flag any that aren't in the registry
        for (var g = 0; g < gmailAliases.length; g++) {
            if (!registry[gmailAliases[g]]) {
                aliases.push({
                    alias: gmailAliases[g],
                    name: gmailAliases[g].split('@')[0],
                    visibility: 'all',
                    owner: '',
                    category: 'discovered',
                    can_send: true,
                    can_receive: true,
                    is_mine: true,
                    unregistered: true
                });
            }
        }
    } catch (e) {
        // GmailApp.getAliases() may fail in some contexts
    }

    return successResponse_(aliases);
}

/**
 * Add or update an email alias. Godmode only.
 * payload: { token, alias, name?, visibility?, owner?, category?, can_send?, can_receive? }
 */
function handleUpdateEmailAlias(payload) {
    var auth = requireGodmode_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.alias || !payload.alias.trim()) return errorResponse_('Alias required.');

    var alias = payload.alias.trim().toLowerCase();
    var sheet = ensureSheet_(SHEETS.EMAIL_ALIASES, [
        'alias', 'name', 'visibility', 'owner', 'category', 'can_send', 'can_receive', 'created_at'
    ]);

    // Check if alias already exists
    var existing = findRow_(SHEETS.EMAIL_ALIASES, 'alias', alias);
    if (existing) {
        var updates = {};
        if (payload.name !== undefined) updates.name = payload.name;
        if (payload.visibility !== undefined) updates.visibility = payload.visibility;
        if (payload.owner !== undefined) updates.owner = payload.owner;
        if (payload.category !== undefined) updates.category = payload.category;
        if (payload.can_send !== undefined) updates.can_send = String(payload.can_send);
        if (payload.can_receive !== undefined) updates.can_receive = String(payload.can_receive);
        updateRow_(SHEETS.EMAIL_ALIASES, existing._rowIndex, updates);
        logAction_(auth.user.user_id, auth.user.name, 'EMAIL_ALIAS_UPDATED', alias + ': ' + JSON.stringify(updates));
        return successResponse_(null, 'Alias updated.');
    }

    // Create new alias
    sheet.appendRow([
        alias,
        payload.name || alias.split('@')[0],
        payload.visibility || 'all',
        payload.owner || '',
        payload.category || 'general',
        payload.can_send !== false ? 'true' : 'false',
        payload.can_receive !== false ? 'true' : 'false',
        now_()
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'EMAIL_ALIAS_CREATED', alias);
    return successResponse_(null, 'Alias created.');
}

/**
 * Delete an email alias. Godmode only.
 * payload: { token, alias }
 */
function handleDeleteEmailAlias(payload) {
    var auth = requireGodmode_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.alias) return errorResponse_('Alias required.');

    var existing = findRow_(SHEETS.EMAIL_ALIASES, 'alias', payload.alias);
    if (!existing) return errorResponse_('Alias not found.');

    var sheet = getSheetByName_(SHEETS.EMAIL_ALIASES);
    sheet.deleteRow(existing._rowIndex);

    logAction_(auth.user.user_id, auth.user.name, 'EMAIL_ALIAS_DELETED', payload.alias);
    return successResponse_(null, 'Alias deleted.');
}

// ═══════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════

// Master template catalog — references existing builders in CMS.js
var MAIL_HUB_TEMPLATES = [
    // ── CAREERS (Applicant) ──
    { id: 'applicant:cv_confirmation',    name: 'Application Received',        category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Confirm receipt of their application materials.' },
    { id: 'applicant:interview_selected', name: 'Selected for Interview',      category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Invite them with date/time options to choose from.' },
    { id: 'applicant:not_selected',       name: 'Not Selected (Application)',  category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'They did not make it past the application stage.' },
    { id: 'applicant:interview_thanks',   name: 'Interview Thank You',         category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Thank them for attending the interview today.' },
    { id: 'applicant:interview_confirmed',name: 'Interview Confirmed',         category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Confirm their slot with date, time, and meeting link.' },
    { id: 'applicant:trial_invitation',   name: 'Paid Trial Invitation',       category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Invite to a 1-week paid working trial.' },
    { id: 'applicant:role_offered',       name: 'Role Offered',                category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Congratulations — they got the job!' },
    { id: 'applicant:role_rejected',      name: 'Not Selected (Final)',        category: 'careers',   builder: 'applicant', from: 'jobs@icuni.org',  desc: 'Final rejection after interview stage.' },
    // ── REFERRER ──
    { id: 'referrer:welcome',             name: 'Referrer Welcome',            category: 'referrer',  builder: 'referrer',  from: 'hello@icuni.org', desc: 'Welcome to the ICUNI Labs Referral Program.' },
    { id: 'referrer:stage_update',        name: 'Referral Stage Update',       category: 'referrer',  builder: 'referrer',  from: 'hello@icuni.org', desc: 'Notify referrer their referral progressed.' },
    { id: 'referrer:payment_sent',        name: 'Referrer Payment Sent',       category: 'referrer',  builder: 'referrer',  from: 'hello@icuni.org', desc: 'Confirm commission payment to the referrer.' },
    { id: 'referrer:meeting_reminder',    name: 'Referrer Meeting Reminder',   category: 'referrer',  builder: 'referrer',  from: 'hello@icuni.org', desc: 'Remind about an upcoming prospect meeting.' },
    { id: 'referrer:new_material',        name: 'New Referral Material',       category: 'referrer',  builder: 'referrer',  from: 'hello@icuni.org', desc: 'New portfolio or demo material available.' },
    // ── CLIENT ──
    { id: 'client:welcome',              name: 'Client Welcome',              category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Welcome them as a new ICUNI Labs client.' },
    { id: 'client:project_kickoff',      name: 'Project Kickoff',             category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Kickoff call scheduled, outline what happens next.' },
    { id: 'client:milestone_update',     name: 'Milestone Update',            category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Share progress on their project milestone.' },
    { id: 'client:invoice_reminder',     name: 'Invoice Reminder',            category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Friendly reminder about an outstanding invoice.' },
    { id: 'client:review_request',       name: 'Review Request',              category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Ask client to review deliverables or leave feedback.' },
    { id: 'client:thank_you',            name: 'Client Thank You',            category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Thank client after project completion.' },
    { id: 'client:follow_up',            name: 'Client Follow-Up',            category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Check in after delivery or a quiet period.' },
    { id: 'client:upsell',              name: 'Upsell / New Offer',          category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Propose additional services or upgrades.' },
    { id: 'client:check_in',            name: 'Periodic Check-In',           category: 'client',    builder: 'client',    from: 'hello@icuni.org', desc: 'Routine touchpoint to maintain the relationship.' },
    // ── TEAM ──
    { id: 'team:announcement',           name: 'Team Announcement',           category: 'team',      builder: 'custom',    from: 'labs@icuni.org',  desc: 'Internal announcement to all staff.' },
    // ── CUSTOM ──
    { id: 'custom',                      name: 'Custom Email',                category: 'custom',    builder: 'custom',    from: 'labs@icuni.org',  desc: 'Write your own branded email from scratch.' }
];

/**
 * Get available email templates.
 * payload: { token }
 */
function handleGetEmailTemplates(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var templates = [];
    for (var i = 0; i < MAIL_HUB_TEMPLATES.length; i++) {
        var t = MAIL_HUB_TEMPLATES[i];
        templates.push({
            id: t.id,
            name: t.name,
            category: t.category,
            builder: t.builder,
            from: t.from,
            desc: t.desc,
            system: true
        });
    }

    // Load user-saved templates from sheet
    try {
        var rows = sheetToObjects_(SHEETS.EMAIL_TEMPLATES);
        for (var j = 0; j < rows.length; j++) {
            var r = rows[j];
            templates.push({
                id: r.template_id,
                name: r.name,
                category: r.category || 'custom',
                builder: 'custom',
                from: r.from_alias || 'labs@icuni.org',
                desc: r.description || '',
                subject: r.subject,
                body: r.body,
                opts: r.opts ? JSON.parse(r.opts) : {},
                system: false,
                created_by: r.created_by,
                created_at: r.created_at
            });
        }
    } catch (e) {
        // Sheet may not exist yet
    }

    return successResponse_(templates);
}

/**
 * Save a reusable email template.
 * payload: { token, name, category, subject, body, opts?, template_id? }
 */
function handleSaveEmailTemplate(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.name || !payload.subject || !payload.body) {
        return errorResponse_('Name, subject, and body are required.');
    }

    var sheet = ensureSheet_(SHEETS.EMAIL_TEMPLATES, [
        'template_id', 'name', 'category', 'subject', 'body', 'opts', 'from_alias', 'description', 'created_by', 'created_at', 'updated_at'
    ]);

    if (payload.template_id) {
        var existing = findRow_(SHEETS.EMAIL_TEMPLATES, 'template_id', payload.template_id);
        if (existing) {
            updateRow_(SHEETS.EMAIL_TEMPLATES, existing._rowIndex, {
                name: payload.name,
                category: payload.category || 'custom',
                subject: payload.subject,
                body: payload.body,
                opts: JSON.stringify(payload.opts || {}),
                updated_at: now_()
            });
            return successResponse_(null, 'Template updated.');
        }
    }

    var templateId = generateId_('TPL');
    sheet.appendRow([
        templateId, payload.name, payload.category || 'custom', payload.subject,
        payload.body, JSON.stringify(payload.opts || {}), payload.fromAlias || 'labs@icuni.org',
        payload.description || '', auth.user.name, now_(), now_()
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'EMAIL_TEMPLATE_CREATED', templateId + ': ' + payload.name);
    return successResponse_({ template_id: templateId }, 'Template saved.');
}

/**
 * Preview a branded email using the CMS template builders.
 * payload: { token, templateId, recipientName?, extras? }
 * OR: { token, subject, body, recipientName?, opts? } for freeform
 */
function handlePreviewBrandedEmail(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var name = payload.recipientName || 'Recipient';
    var extras = payload.extras || {};

    // If a templateId is provided, route through the correct builder
    if (payload.templateId) {
        var parts = payload.templateId.split(':');
        var builder = parts[0];
        var tplKey = parts.length > 1 ? parts[1] : 'custom';

        var tpl;
        try {
            if (builder === 'applicant') {
                tpl = buildApplicantTemplate_(name, tplKey, extras);
            } else if (builder === 'referrer') {
                tpl = buildReferrerTemplate_(name, tplKey, extras);
            } else if (builder === 'client') {
                tpl = buildClientTemplate_(name, tplKey, extras);
            } else {
                // Custom / team — use provided subject + body
                tpl = {
                    subject: payload.subject || 'A Message from ICUNI Labs',
                    title: payload.subject || 'Hello from ICUNI Labs',
                    body: (payload.body || '').replace(/\n/g, '<br>'),
                    opts: payload.opts || {}
                };
            }
        } catch (e) {
            // Fallback for unknown template keys
            tpl = {
                subject: payload.subject || 'Preview',
                title: payload.subject || 'Preview',
                body: (payload.body || '').replace(/\n/g, '<br>'),
                opts: payload.opts || {}
            };
        }

        var html = buildBrandedEmail_(name, tpl.title || tpl.subject, tpl.body, tpl.opts);
        return successResponse_({ html: html, subject: tpl.subject });
    }

    // Freeform preview
    var subject = payload.subject || 'Preview';
    var body = (payload.body || '').replace(/\n/g, '<br>');
    var opts = payload.opts || {};
    var html = buildBrandedEmail_(name, subject, body, opts);
    return successResponse_({ html: html, subject: subject });
}

// ═══════════════════════════════════════════════════════════
// IMPORT EMAIL AS JOB APPLICATION
// ═══════════════════════════════════════════════════════════

/**
 * Import a Gmail thread/message as a job application.
 * Reads the message, extracts body as cover letter, saves attachments to Drive,
 * and creates an entry in Job_Applications using the same schema as website submissions.
 * payload: { token, threadId, messageId?, name, email, phone?, jobTitle?, coverLetterOverride? }
 */
function handleImportEmailAsApplication(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.threadId) return errorResponse_('Thread ID required.');
    if (!payload.name || !payload.email) return errorResponse_('Name and email are required.');

    try {
        var thread = GmailApp.getThreadById(payload.threadId);
        if (!thread) return errorResponse_('Thread not found.');

        // Get target message (first message or specific message)
        var messages = thread.getMessages();
        var msg = null;
        if (payload.messageId) {
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].getId() === payload.messageId) { msg = messages[i]; break; }
            }
        }
        if (!msg) msg = messages[0];

        var name = payload.name.trim();
        var email = payload.email.trim().toLowerCase();
        var phone = payload.phone || '';
        var jobTitle = payload.jobTitle || 'Email Import';
        var coverLetter = payload.coverLetterOverride || msg.getPlainBody() || '';
        // Trim cover letter to reasonable length
        if (coverLetter.length > 5000) coverLetter = coverLetter.substring(0, 5000) + '...';

        // Check for duplicate
        var existing = findRow_(SHEETS.JOB_APPLICATIONS, 'email', email);
        if (existing) {
            return errorResponse_('An application from ' + email + ' already exists (ID: ' + existing.application_id + ').');
        }

        // Save attachments to Drive (same structure as website submissions)
        var cvLink = '', audioLink = '', videoLink = '';
        var attachments = msg.getAttachments();

        if (attachments.length > 0) {
            var jobsFolder = getDriveSubfolder_(DRIVE_FOLDERS.JOBS);
            var appsFolder = getOrCreateFolder_(jobsFolder, DRIVE_FOLDERS.APPLICATIONS);
            var folderName = name + ' — ' + Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy-MM-dd') + ' (Email Import)';
            var applicantFolder = getOrCreateFolder_(appsFolder, folderName);

            for (var a = 0; a < attachments.length; a++) {
                var att = attachments[a];
                var attName = att.getName();
                var blob = att.copyBlob();
                var file = applicantFolder.createFile(blob.setName(attName));
                var fileUrl = file.getUrl();

                // Classify: CV = PDF/DOC, Audio = webm/mp3/m4a, Video = mp4/mov
                if (/\.(pdf|doc|docx)$/i.test(attName) && !cvLink) {
                    cvLink = fileUrl;
                } else if (/\.(webm|mp3|m4a|ogg|wav)$/i.test(attName) && !audioLink) {
                    audioLink = fileUrl;
                } else if (/\.(mp4|mov|avi|mkv)$/i.test(attName) && !videoLink) {
                    videoLink = fileUrl;
                } else if (!cvLink && /\.(pdf|doc|docx)$/i.test(attName)) {
                    cvLink = fileUrl;
                }
                // Any remaining attachments are still saved in the folder
            }
        }

        // Create application row (same schema as website submissions)
        var appId = generateId_('APP');
        appendRow_(SHEETS.JOB_APPLICATIONS, [
            appId, 'email-import', jobTitle,
            name, email, phone, coverLetter,
            cvLink ? 'Yes' : 'No', audioLink ? 'Yes' : 'No', videoLink ? 'Yes' : 'No',
            cvLink, audioLink, videoLink,
            'received', now_()
        ]);

        logAction_(auth.user.user_id, auth.user.name, 'EMAIL_IMPORT_APPLICATION',
            name + ' (' + email + ') from thread: ' + thread.getFirstMessageSubject());

        return successResponse_({
            application_id: appId,
            has_cv: !!cvLink,
            has_audio: !!audioLink,
            has_video: !!videoLink,
            attachments_saved: attachments.length
        }, 'Application imported from email.');

    } catch (e) {
        Logger.log('importEmailAsApplication error: ' + e.message);
        return errorResponse_('Failed to import: ' + e.message);
    }
}

