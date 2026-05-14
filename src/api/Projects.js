/**
 * ICUNI Labs — Projects & Client Management
 * 10-step project lifecycle, client CRUD, project tracking.
 */

// ─── CLIENT MANAGEMENT ──────────────────────────────────

function handleGetClients(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var clients = sheetToObjects_(SHEETS.CLIENTS);
    // Enrich with aggregated stats for CRM cards
    var allProjects = sheetToObjects_(SHEETS.CLIENT_PROJECTS);
    var allInvoices = sheetToObjects_(SHEETS.INVOICES);
    var allPayments = sheetToObjects_(SHEETS.PAYMENTS);
    clients.forEach(function(c) {
        var myProjects = allProjects.filter(function(p) { return p.client_id === c.client_id; });
        var myInvoices = allInvoices.filter(function(inv) { return inv.client_id === c.client_id; });
        var myPayments = allPayments.filter(function(pay) { return pay.client_id === c.client_id; });
        c.project_count = myProjects.length;
        c.active_projects = myProjects.filter(function(p) { return p.status === 'active'; }).length;
        c.total_revenue = myPayments.reduce(function(sum, pay) { return sum + Number(pay.amount || 0); }, 0);
        c.total_invoiced = myInvoices.reduce(function(sum, inv) { return sum + Number(inv.total || 0); }, 0);
        c.outstanding = c.total_invoiced - c.total_revenue;
        c.last_activity = c.last_activity || c.created_at;
        // Parse tags
        try { c.tags_list = c.tags ? c.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : []; } catch(e) { c.tags_list = []; }
    });
    return successResponse_(clients);
}

function handleAddClient(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        name: { required: true, label: 'Client name' },
        email: { required: true, type: 'email', label: 'Email' }
    });
    
    var clientId = generateId_('CLI');
    
    // Create Drive folder for client
    var clientsFolder = getDriveSubfolder_(DRIVE_FOLDERS.CLIENTS);
    var clientFolder = getOrCreateFolder_(clientsFolder, payload.name + ' — ' + clientId);
    
    appendRow_(SHEETS.CLIENTS, [
        clientId, payload.name, payload.email, payload.phone || '',
        payload.company || '', 'Active', payload.referrer_id || '',
        now_(), payload.notes || '', clientFolder.getUrl(),
        payload.tags || '', payload.source || '', payload.industry || '',
        payload.address || '', payload.website || '', now_(),
        payload.prospect_stage || 'new_lead'
    ]);
    
    // Create user account for client
    try {
        handleAddUser({
            token: payload.token,
            name: payload.name,
            email: payload.email,
            phone: payload.phone || '',
            role: ROLES.CLIENT
        });
    } catch(e) { Logger.log('Client user creation note: ' + e.message); }
    
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_ADDED', 'Added client: ' + payload.name);
    return successResponse_({ clientId: clientId }, 'Client created.');
}

function handleGetClient(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.clientId);
    if (!client) return errorResponse_('Client not found.');
    // Enrich with projects, invoices, payments
    client.projects = sheetToObjects_(SHEETS.CLIENT_PROJECTS).filter(function(p) { return p.client_id === client.client_id; });
    client.invoices = sheetToObjects_(SHEETS.INVOICES).filter(function(inv) { return inv.client_id === client.client_id; });
    client.payments = sheetToObjects_(SHEETS.PAYMENTS).filter(function(pay) { return pay.client_id === client.client_id; });
    client.total_revenue = client.payments.reduce(function(sum, p) { return sum + Number(p.amount || 0); }, 0);
    client.total_invoiced = client.invoices.reduce(function(sum, inv) { return sum + Number(inv.total || 0); }, 0);
    client.outstanding = client.total_invoiced - client.total_revenue;
    // Parse notes
    try {
        client.notes_list = sheetToObjects_(SHEETS.CLIENT_NOTES).filter(function(n) { return n.client_id === client.client_id; });
    } catch(e) { client.notes_list = []; }
    // Parse tags
    try { client.tags_list = client.tags ? client.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : []; } catch(e) { client.tags_list = []; }
    return successResponse_(client);
}

function handleGetClientActivity(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var clientId = payload.clientId;
    if (!clientId) return errorResponse_('Client ID required.');
    var activities = [];
    // Projects
    sheetToObjects_(SHEETS.CLIENT_PROJECTS).filter(function(p) { return p.client_id === clientId; }).forEach(function(p) {
        activities.push({ type: 'project_created', title: 'Project Created: ' + p.title, detail: p.type + ' — GH\u20B5' + Number(p.estimated_cost || 0).toLocaleString(), timestamp: p.created_at, icon: 'folder' });
    });
    // Invoices
    sheetToObjects_(SHEETS.INVOICES).filter(function(inv) { return inv.client_id === clientId; }).forEach(function(inv) {
        activities.push({ type: 'invoice_sent', title: 'Invoice ' + inv.invoice_id, detail: inv.type + ' — GH\u20B5' + Number(inv.total || 0).toLocaleString(), timestamp: inv.created_at, icon: 'file-text' });
    });
    // Payments
    sheetToObjects_(SHEETS.PAYMENTS).filter(function(pay) { return pay.client_id === clientId; }).forEach(function(pay) {
        activities.push({ type: 'payment_received', title: 'Payment Received', detail: 'GH\u20B5' + Number(pay.amount || 0).toLocaleString() + ' via ' + pay.method, timestamp: pay.paid_at, icon: 'check-circle' });
    });
    // Notes
    try {
        sheetToObjects_(SHEETS.CLIENT_NOTES).filter(function(n) { return n.client_id === clientId; }).forEach(function(n) {
            activities.push({ type: 'note', title: 'Note by ' + (n.author || 'Staff'), detail: n.content, timestamp: n.created_at, icon: 'message-square' });
        });
    } catch(e) {}
    // Sort by timestamp descending
    activities.sort(function(a, b) { return new Date(b.timestamp || 0) - new Date(a.timestamp || 0); });
    return successResponse_(activities);
}

function handleAddClientNote(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var clientId = payload.clientId;
    var content = (payload.content || '').trim();
    if (!clientId || !content) return errorResponse_('Client ID and note content required.');
    var noteId = generateId_('NTE');
    appendRow_(SHEETS.CLIENT_NOTES, [
        noteId, clientId, content, auth.user.name, auth.user.email, now_()
    ]);
    // Update last_activity on client
    var client = findRow_(SHEETS.CLIENTS, 'client_id', clientId);
    if (client) updateRow_(SHEETS.CLIENTS, client._rowIndex, { last_activity: now_() });
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_NOTE', 'Note on ' + clientId);
    return successResponse_({ noteId: noteId }, 'Note added.');
}

function handleUpdateClientTags(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.clientId);
    if (!client) return errorResponse_('Client not found.');
    var tags = Array.isArray(payload.tags) ? payload.tags.join(',') : (payload.tags || '');
    updateRow_(SHEETS.CLIENTS, client._rowIndex, { tags: tags });
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_TAGS', client.name + ': ' + tags);
    return successResponse_(null, 'Tags updated.');
}

function handleUpdateClientStatus(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.clientId);
    if (!client) return errorResponse_('Client not found.');
    var updates = { last_activity: now_() };
    if (payload.prospect_stage) updates.prospect_stage = payload.prospect_stage;
    if (payload.status) updates.status = payload.status;
    updateRow_(SHEETS.CLIENTS, client._rowIndex, updates);
    // Auto-add a note about stage change
    if (payload.prospect_stage) {
        var noteId = generateId_('NTE');
        appendRow_(SHEETS.CLIENT_NOTES, [
            noteId, payload.clientId,
            'Stage changed to: ' + payload.prospect_stage + (payload.note ? ' — ' + payload.note : ''),
            auth.user.name, auth.user.email, now_()
        ]);
    }
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_STAGE',
        client.name + ' → ' + (payload.prospect_stage || payload.status));
    return successResponse_(null, 'Client status updated.');
}

function handleUpdateClient(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.clientId);
    if (!client) return errorResponse_('Client not found.');
    var updates = { last_activity: now_() };
    ['name','email','phone','company','status','notes','industry','source','website','address'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });
    updateRow_(SHEETS.CLIENTS, client._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_UPDATED', 'Updated: ' + (payload.name || client.name));
    return successResponse_(null, 'Client updated.');
}

function handleDeleteClient(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.clientId);
    if (!client) return errorResponse_('Client not found.');
    updateRow_(SHEETS.CLIENTS, client._rowIndex, { status: 'Deleted', last_activity: now_() });
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_DELETED', client.name);
    return successResponse_(null, 'Client deleted.');
}

// ─── PROJECT LIFECYCLE ───────────────────────────────────

function handleCreateProject(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        client_id: { required: true, label: 'Client' },
        title: { required: true, label: 'Project title' },
        type: { required: true, label: 'Project type' },
        estimated_cost: { required: true, type: 'number', label: 'Estimated cost' }
    });
    
    var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.client_id);
    if (!client) return errorResponse_('Client not found.');
    
    var projectId = generateId_('PRJ');
    var nowStr = now_();
    
    appendRow_(SHEETS.CLIENT_PROJECTS, [
        projectId, payload.client_id, payload.title, payload.description || '',
        'active', '0', payload.type,
        Number(payload.estimated_cost), 0, Number(payload.estimated_cost),
        nowStr, payload.est_completion || '', '',
        payload.referrer_id || client.referrer_id || '', auth.user.user_id,
        nowStr, nowStr,
        nowStr, '', '', '', '', '', '', '', '', '', '', // step dates (0 = now)
        '', '' // sla_notified, sla_snoozed
    ]);
    
    // Auto-create invoice
    var invoiceResult = createInvoice_({
        project_id: projectId,
        client_id: payload.client_id,
        client_name: client.name,
        client_email: client.email,
        type: 'deposit',
        items: payload.invoice_items || [{ description: payload.title, quantity: 1, unit_price: Number(payload.estimated_cost) }],
        due_days: payload.due_days || 7,
        notes: payload.invoice_notes || ''
    });
    
    // Notify client
    try {
        sendProjectCreatedEmail_(client, projectId, payload.title, invoiceResult.invoiceId, Number(payload.estimated_cost));
    } catch(e) { Logger.log('Project email failed: ' + e.message); }
    
    // Notify referrer if applicable
    var referrerId = payload.referrer_id || client.referrer_id;
    if (referrerId) {
        try {
            notifyReferrerProjectApproved_(referrerId, client.name, payload.title);
        } catch(e) { Logger.log('Referrer notify failed: ' + e.message); }
    }
    
    logAction_(auth.user.user_id, auth.user.name, 'PROJECT_CREATED', 'Project: ' + payload.title + ' for ' + client.name);
    return successResponse_({ projectId: projectId, invoiceId: invoiceResult.invoiceId }, 'Project created & invoice sent.');
}

function handleGetProjects(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    
    var projects = sheetToObjects_(SHEETS.CLIENT_PROJECTS);
    
    // Client sees only their projects
    if (auth.user.role === ROLES.CLIENT) {
        var clientRecord = findRow_(SHEETS.CLIENTS, 'email', auth.user.email);
        if (clientRecord) {
            projects = projects.filter(function(p) { return p.client_id === clientRecord.client_id; });
        } else {
            projects = [];
        }
    }
    
    // Referrer sees only referred projects
    if (auth.user.role === ROLES.REFERRER) {
        var referrer = findRow_(SHEETS.REFERRERS, 'email', auth.user.email);
        if (referrer) {
            projects = projects.filter(function(p) { return p.referrer_id === referrer.referrer_id; });
        } else {
            projects = [];
        }
    }
    
    // Enrich with client name
    var clients = sheetToObjects_(SHEETS.CLIENTS);
    var clientMap = {};
    clients.forEach(function(c) { clientMap[c.client_id] = c.name; });
    projects.forEach(function(p) { p.client_name = clientMap[p.client_id] || 'Unknown'; });
    
    return successResponse_(projects);
}

function handleGetProject(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var project = findRow_(SHEETS.CLIENT_PROJECTS, 'project_id', payload.projectId);
    if (!project) return errorResponse_('Project not found.');
    
    // Authorization check
    if (auth.user.role === ROLES.CLIENT) {
        var cl = findRow_(SHEETS.CLIENTS, 'email', auth.user.email);
        if (!cl || cl.client_id !== project.client_id) return errorResponse_('Access denied.');
    }
    
    // Enrich
    var client = findRow_(SHEETS.CLIENTS, 'client_id', project.client_id);
    project.client_name = client ? client.name : 'Unknown';
    project.client_email = client ? client.email : '';
    project.step_info = PROJECT_STEPS[project.step] || { name: 'Unknown', owner: 'staff' };
    
    // Get invoices
    project.invoices = sheetToObjects_(SHEETS.INVOICES).filter(function(inv) {
        return inv.project_id === project.project_id;
    });
    
    // Get payments
    project.payments = sheetToObjects_(SHEETS.PAYMENTS).filter(function(pay) {
        return pay.project_id === project.project_id;
    });
    
    return successResponse_(project);
}

/**
 * Advance a project to the next step.
 */
function handleAdvanceProjectStep(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var project = findRow_(SHEETS.CLIENT_PROJECTS, 'project_id', payload.projectId);
    if (!project) return errorResponse_('Project not found.');
    
    var currentStep = parseFloat(project.step) || 0;
    var stepOrder = [0, 1, 1.5, 2, 3, 4, 4.5, 5, 6, 7, 8, 9, 10];
    var currentIdx = stepOrder.indexOf(currentStep);
    if (currentIdx === -1 || currentIdx >= stepOrder.length - 1) {
        return errorResponse_('Project is at the final step or has an invalid step.');
    }
    
    var nextStep = payload.nextStep !== undefined ? parseFloat(payload.nextStep) : stepOrder[currentIdx + 1];
    if (stepOrder.indexOf(nextStep) === -1) return errorResponse_('Invalid step.');
    
    var nowStr = now_();
    var updates = { step: nextStep, updated_at: nowStr };
    
    // Record step timestamp
    var stepKey = 'step_' + String(nextStep).replace('.', '_') + '_date';
    // Map to the column name format
    var colMap = {
        'step_0_date': 'step_0_date', 'step_1_date': 'step_1_date',
        'step_1_5_date': 'step_1_date', // 1.5 shares step_1
        'step_2_date': 'step_2_date', 'step_3_date': 'step_3_date',
        'step_4_date': 'step_4_date', 'step_4_5_date': 'step_4_date',
        'step_5_date': 'step_5_date', 'step_6_date': 'step_6_date',
        'step_7_date': 'step_7_date', 'step_8_date': 'step_8_date',
        'step_9_date': 'step_9_date', 'step_10_date': 'step_10_date'
    };
    if (colMap[stepKey]) updates[colMap[stepKey]] = nowStr;
    
    // Mark complete if step 10
    if (nextStep >= 10) {
        updates.status = 'completed';
        updates.actual_completion = nowStr;
    }
    
    // Clear SLA notifications for fresh tracking on new step
    updates.sla_notified = '';
    updates.sla_snoozed_until = '';
    
    updateRow_(SHEETS.CLIENT_PROJECTS, project._rowIndex, updates);
    
    var stepInfo = PROJECT_STEPS[nextStep] || { name: 'Step ' + nextStep };
    logAction_(auth.user.user_id, auth.user.name, 'PROJECT_STEP', 
        project.title + ' → Step ' + nextStep + ': ' + stepInfo.name);
    
    // Send notifications based on step
    var client = findRow_(SHEETS.CLIENTS, 'client_id', project.client_id);
    if (client) sendStepNotification_(project, nextStep, client, auth.user);
    
    return successResponse_({ step: nextStep, stepName: stepInfo.name }, 'Project advanced to: ' + stepInfo.name);
}

/**
 * Client requests a new build (creates a lead for staff to review).
 */
function handleClientRequestBuild(payload) {
    var auth = requireAuth_(payload.token, [ROLES.CLIENT]);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        title: { required: true, label: 'Project title' },
        description: { required: true, label: 'Description' }
    });
    
    var client = findRow_(SHEETS.CLIENTS, 'email', auth.user.email);
    if (!client) return errorResponse_('Client record not found.');
    
    var projectId = generateId_('PRJ');
    appendRow_(SHEETS.CLIENT_PROJECTS, [
        projectId, client.client_id, payload.title, payload.description,
        'pending_review', '0', payload.type || 'custom',
        0, 0, 0,
        now_(), '', '',
        '', '',
        now_(), now_(),
        '', '', '', '', '', '', '', '', '', '', '',
        '', ''
    ]);
    
    // Notify staff
    try {
        sendEmail_({
            to: ADMIN_EMAIL,
            subject: '[ICUNI Labs] New Build Request from ' + client.name,
            htmlBody: buildNewRequestEmail_(client, payload.title, payload.description),
            from: 'labs@icuni.org'
        });
        logEmail_(ADMIN_EMAIL, 'New Build Request', 'notification', 'sent');
    } catch(e) { logEmail_(ADMIN_EMAIL, 'New Build Request', 'notification', 'failed'); }
    
    logAction_(auth.user.user_id, auth.user.name, 'BUILD_REQUESTED', payload.title);
    return successResponse_({ projectId: projectId }, 'Build request submitted. We\'ll be in touch soon!');
}

// ─── STEP NOTIFICATIONS ─────────────────────────────────

function sendStepNotification_(project, step, client, staffUser) {
    var subject, body;
    
    switch(step) {
        case 1: // Project created
            subject = 'Your Project Has Been Approved — ' + project.title;
            body = 'Great news! Your project <strong>' + project.title + '</strong> has been approved and created. An invoice has been sent to your email.';
            break;
        case 2: // Payment received
            subject = 'Payment Received — ' + project.title;
            body = 'We\'ve received your payment for <strong>' + project.title + '</strong>. Building starts now!';
            break;
        case 3: // Build started
            subject = 'Build In Progress — ' + project.title;
            body = '<strong>' + project.title + '</strong> is now being built. Estimated delivery: ' + (project.est_completion || '5-7 working days') + '.';
            break;
        case 4: // Demo ready
            subject = 'Demo Ready for Review — ' + project.title;
            body = 'Your demo for <strong>' + project.title + '</strong> is ready! Let\'s schedule a review session.';
            break;
        case 6: // Training
            subject = 'Training Session — ' + project.title;
            body = 'Time for your training session on <strong>' + project.title + '</strong>. We\'ll be reaching out to schedule.';
            break;
        case 9: // Post-mortem
            subject = 'Project Review — ' + project.title;
            body = 'We\'d love your feedback on <strong>' + project.title + '</strong>. Please share your experience with us.';
            break;
        case 10: // Upsells
            subject = 'Upgrade Opportunities — ' + project.title;
            body = 'Now that you\'ve been using <strong>' + project.title + '</strong>, we have some exciting upgrade ideas for you!';
            break;
        default:
            return; // No notification for other steps
    }
    
    try {
        sendEmail_({
            to: client.email,
            subject: '[ICUNI Labs] ' + subject,
            htmlBody: buildProjectStepEmail_(client.name, subject, body),
            from: 'labs@icuni.org'
        });
        logEmail_(client.email, subject, 'project_step', 'sent');
    } catch(e) {
        logEmail_(client.email, subject, 'project_step', 'failed');
    }
}

function notifyReferrerProjectApproved_(referrerId, clientName, projectTitle) {
    var referrer = findRow_(SHEETS.REFERRERS, 'referrer_id', referrerId);
    if (!referrer || !referrer.email) return;
    
    sendEmail_({
        to: referrer.email,
        subject: '[ICUNI Labs] Great news — ' + clientName + '\'s project is approved!',
        htmlBody: buildProjectStepEmail_(referrer.name,
            'Referral Update: Project Approved',
            'The project <strong>' + projectTitle + '</strong> for <strong>' + clientName + 
            '</strong> has been approved. You\'ll receive your commission confirmation once payment is received.'),
        from: 'labs@icuni.org'
    });
    logEmail_(referrer.email, 'Referral project approved', 'referrer_notify', 'sent');
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────

/** Logo URL served from the live site */
var LOGO_URL = 'https://labs.icuni.org/icuni_logo.png';

/**
 * Master branded email template — all ICUNI Labs emails use this.
 * Includes the ICUNI Labs logo at the top of every email.
 */
function buildBrandedEmail_(name, title, bodyHtml, opts) {
    opts = opts || {};
    var ctaText = opts.ctaText || 'Visit ICUNI Labs';
    var ctaLink = opts.ctaLink || 'https://labs.icuni.org';
    var showCta = opts.hideCta !== true;
    
    return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;"><tr><td align="center">' +
        '<table width="540" cellpadding="0" cellspacing="0" style="background:#0f1424;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">' +
        
        // ── Logo Header ──
        '<tr><td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(180deg,#111827 0%,#0f1424 100%);">' +
        '<img src="' + LOGO_URL + '" alt="ICUNI Labs" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:10px;" />' +
        '<div style="font-size:20px;font-weight:800;color:#ff7a00;letter-spacing:-0.02em;">ICUNI Labs</div>' +
        '<div style="font-size:10px;color:#4a5568;letter-spacing:4px;margin-top:2px;">CUSTOM BUSINESS SYSTEMS</div>' +
        '</td></tr>' +
        
        // ── Title ──
        '<tr><td style="padding:24px 32px 8px;text-align:center;">' +
        '<div style="font-size:18px;font-weight:700;color:#e8ecf4;line-height:1.4;">' + title + '</div>' +
        '</td></tr>' +
        
        // ── Body ──
        '<tr><td style="padding:8px 32px 24px;color:#8b95a8;font-size:15px;line-height:1.7;">' +
        'Hi <strong style="color:#e8ecf4;">' + (name || 'there') + '</strong>,<br><br>' + bodyHtml +
        '</td></tr>' +
        
        // ── CTA Button ──
        (showCta ? '<tr><td style="padding:0 32px 28px;text-align:center;">' +
        '<a href="' + ctaLink + '" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#ff7a00,#ff9a40);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;box-shadow:0 4px 12px rgba(255,122,0,0.3);">' + ctaText + '</a>' +
        '</td></tr>' : '') +
        
        // ── Footer ──
        '<tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">' +
        '<div style="color:#4a5568;font-size:11px;line-height:1.6;">ICUNI Labs — Custom Business Operations Systems</div>' +
        '<div style="color:#3a4050;font-size:10px;margin-top:4px;">labs@icuni.org | labs.icuni.org</div>' +
        '</td></tr>' +
        
        '</table></td></tr></table></body></html>';
}

/**
 * Backward-compatible alias — all existing callers continue to work.
 */
function buildProjectStepEmail_(name, title, bodyHtml) {
    return buildBrandedEmail_(name, title, bodyHtml, { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org' });
}

function sendProjectCreatedEmail_(client, projectId, title, invoiceId, amount) {
    var body = 'Your project <strong>' + title + '</strong> has been created (ID: ' + projectId + ').<br><br>' +
        'An invoice of <strong>GH\u20B5' + amount.toLocaleString() + '</strong> (Invoice: ' + invoiceId + ') has been generated.<br><br>' +
        'Please review and make the deposit to get started.';
    
    sendEmail_({
        to: client.email,
        subject: '[ICUNI Labs] Project Created — ' + title,
        htmlBody: buildBrandedEmail_(client.name, 'New Project Created', body),
        from: 'labs@icuni.org'
    });
    logEmail_(client.email, 'Project Created — ' + title, 'project_created', 'sent');
}

function buildNewRequestEmail_(client, title, description) {
    return buildBrandedEmail_('Team',
        'New Build Request',
        '<strong>' + client.name + '</strong> (' + client.email + ') has requested a new build:<br><br>' +
        '<strong>Project:</strong> ' + title + '<br>' +
        '<strong>Description:</strong> ' + description + '<br><br>' +
        'Please review and follow up with the client.');
}

