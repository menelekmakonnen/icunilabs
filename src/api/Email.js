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
    var rows = getSheetData_(SHEETS.EMAIL_ALIASES);
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
 */
function getAccessibleAliases_(user) {
    var registry = getAliasRegistry_();
    var accessible = [];
    var keys = Object.keys(registry);

    for (var i = 0; i < keys.length; i++) {
        var alias = keys[i];
        var cfg = registry[alias];

        if (cfg.visibility === 'all') {
            accessible.push(alias);
        } else if (cfg.visibility === 'private') {
            // Only the owner or Godmode can see private aliases
            if (cfg.owner === user.email || user.role === ROLES.GODMODE) {
                accessible.push(alias);
            }
        } else if (cfg.visibility && cfg.visibility.indexOf('role:') === 0) {
            var requiredRole = cfg.visibility.replace('role:', '');
            if (user.role === requiredRole || user.role === ROLES.GODMODE || user.role === ROLES.SUPERADMIN) {
                accessible.push(alias);
            }
        }
    }

    return accessible;
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

    // Build Gmail search query
    var aliasParts = [];
    if (alias !== 'all') {
        if (userAliases.indexOf(alias) === -1) return errorResponse_('No access to this alias.');
        aliasParts.push('(to:' + alias + ' OR from:' + alias + ')');
    } else {
        var parts = [];
        for (var i = 0; i < userAliases.length; i++) {
            parts.push('to:' + userAliases[i]);
            parts.push('from:' + userAliases[i]);
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

/**
 * Get available email templates.
 * payload: { token }
 */
function handleGetEmailTemplates(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    // Return system templates + user-saved templates
    var systemTemplates = [
        {
            id: 'welcome_client',
            name: 'Welcome Client',
            category: 'client',
            subject: '[ICUNI Labs] Welcome to ICUNI Labs',
            body: 'Thank you for choosing ICUNI Labs. We are excited to work with you on building custom solutions for your business.\n\nYour account has been set up and our team will be in touch shortly to schedule a kickoff meeting.\n\nIn the meantime, feel free to explore your client dashboard.',
            opts: { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org' },
            system: true
        },
        {
            id: 'invoice_reminder',
            name: 'Invoice Reminder',
            category: 'client',
            subject: '[ICUNI Labs] Invoice Payment Reminder',
            body: 'This is a friendly reminder that you have an outstanding invoice with ICUNI Labs.\n\nPlease review and make payment at your earliest convenience to avoid any delays in your project timeline.',
            opts: { ctaText: 'View Invoice', ctaLink: 'https://labs.icuni.org' },
            system: true
        },
        {
            id: 'project_update',
            name: 'Project Update',
            category: 'client',
            subject: '[ICUNI Labs] Project Progress Update',
            body: 'We wanted to give you an update on your project progress.\n\nOur team has been working hard and we have some exciting developments to share. Please check your dashboard for the latest status.',
            opts: { ctaText: 'View Project', ctaLink: 'https://labs.icuni.org' },
            system: true
        },
        {
            id: 'referral_thankyou',
            name: 'Referral Thank You',
            category: 'referrer',
            subject: '[ICUNI Labs] Thank You for Your Referral',
            body: 'Thank you for referring a client to ICUNI Labs! We truly appreciate your support and trust in our services.\n\nWe will keep you updated on the progress and ensure your referral commission is processed promptly.',
            opts: { ctaText: 'View Referral Status', ctaLink: 'https://labs.icuni.org' },
            system: true
        },
        {
            id: 'team_announcement',
            name: 'Team Announcement',
            category: 'team',
            subject: '[ICUNI Labs] Team Update',
            body: 'Hi team,\n\nWe have an important update to share with everyone.',
            opts: { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org' },
            system: true
        },
        {
            id: 'custom',
            name: 'Custom Email',
            category: 'custom',
            subject: '',
            body: '',
            opts: {},
            system: true
        }
    ];

    // Load user-saved templates from sheet
    var saved = [];
    try {
        var rows = getSheetData_(SHEETS.EMAIL_TEMPLATES);
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            saved.push({
                id: r.template_id,
                name: r.name,
                category: r.category || 'custom',
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

    return successResponse_(systemTemplates.concat(saved));
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
        'template_id', 'name', 'category', 'subject', 'body', 'opts', 'created_by', 'created_at', 'updated_at'
    ]);

    if (payload.template_id) {
        // Update existing
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

    // Create new
    var templateId = generateId_('TPL');
    sheet.appendRow([
        templateId,
        payload.name,
        payload.category || 'custom',
        payload.subject,
        payload.body,
        JSON.stringify(payload.opts || {}),
        auth.user.name,
        now_(),
        now_()
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'EMAIL_TEMPLATE_CREATED', templateId + ': ' + payload.name);
    return successResponse_({ template_id: templateId }, 'Template saved.');
}

/**
 * Preview a branded email (returns HTML).
 * payload: { token, subject, body, recipientName?, opts? }
 */
function handlePreviewBrandedEmail(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var name = payload.recipientName || 'Recipient';
    var subject = payload.subject || 'Preview';
    var body = (payload.body || '').replace(/\n/g, '<br>');
    var opts = payload.opts || {};

    var html = buildBrandedEmail_(name, subject, body, opts);
    return successResponse_({ html: html, subject: subject });
}
