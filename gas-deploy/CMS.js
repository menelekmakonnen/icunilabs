/**
 * ICUNI Labs — CMS Module
 * WordPress-like site content management: pages, menus, hero, footer, settings.
 * Also handles Blog + Portfolio + Job Listings CRUD.
 */

// ═══════════════════════════════════════════════════════════
// SITE PAGES
// ═══════════════════════════════════════════════════════════

function handleGetPages(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    return successResponse_(sheetToObjects_(SHEETS.SITE_PAGES));
}

function handleUpdatePage(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var page = findRow_(SHEETS.SITE_PAGES, 'page_id', payload.page_id);
    if (!page) return errorResponse_('Page not found.');
    var updates = { updated_at: now_(), updated_by: auth.user.name };
    ['title', 'hero_title', 'hero_subtitle', 'hero_image', 'hero_cta_text',
     'hero_cta_link', 'content_json', 'meta_description', 'status'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });
    updateRow_(SHEETS.SITE_PAGES, page._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'PAGE_UPDATED', 'Updated: ' + page.slug);
    return successResponse_(null, 'Page updated.');
}

function handleCreatePage(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        slug: { required: true, label: 'URL slug' },
        title: { required: true, label: 'Page title' }
    });
    appendRow_(SHEETS.SITE_PAGES, [
        generateId_('PG'), payload.slug, payload.title,
        payload.hero_title || '', payload.hero_subtitle || '', payload.hero_image || '',
        payload.hero_cta_text || '', payload.hero_cta_link || '',
        payload.content_json || '{}', payload.meta_description || '',
        'draft', now_(), auth.user.name
    ]);
    logAction_(auth.user.user_id, auth.user.name, 'PAGE_CREATED', payload.slug);
    return successResponse_(null, 'Page created.');
}

// ═══════════════════════════════════════════════════════════
// MENUS
// ═══════════════════════════════════════════════════════════

function handleGetMenus(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    return successResponse_(sheetToObjects_(SHEETS.SITE_MENUS));
}

function handleUpdateMenu(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    // Bulk update: payload.items is an array of menu items
    if (payload.items && Array.isArray(payload.items)) {
        // Clear and rewrite
        var sheet = getSheetByName_(SHEETS.SITE_MENUS);
        if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
        payload.items.forEach(function(item, idx) {
            appendRow_(SHEETS.SITE_MENUS, [
                item.menu_id || generateId_('MNU'), item.label, item.link,
                item.parent_id || '', idx, item.visible !== false, now_()
            ]);
        });
        logAction_(auth.user.user_id, auth.user.name, 'MENU_UPDATED', 'Updated ' + payload.items.length + ' items');
        return successResponse_(null, 'Menu updated.');
    }
    return errorResponse_('items array is required.');
}

// ═══════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════

function handleGetSettings(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var settings = sheetToObjects_(SHEETS.SITE_SETTINGS);
    var result = {};
    settings.forEach(function(s) { result[s.setting_key] = s.setting_value; });
    return successResponse_(result);
}

function handleUpdateSettings(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var settings = payload.settings || {};
    var keys = Object.keys(settings);
    keys.forEach(function(key) {
        var existing = findRow_(SHEETS.SITE_SETTINGS, 'setting_key', key);
        if (existing) {
            updateRow_(SHEETS.SITE_SETTINGS, existing._rowIndex, {
                setting_value: settings[key], updated_at: now_(), updated_by: auth.user.name
            });
        } else {
            appendRow_(SHEETS.SITE_SETTINGS, [key, settings[key], now_(), auth.user.name]);
        }
    });
    logAction_(auth.user.user_id, auth.user.name, 'SETTINGS_UPDATED', 'Updated ' + keys.length + ' settings');
    return successResponse_(null, 'Settings updated.');
}

// ═══════════════════════════════════════════════════════════
// BLOG MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleGetBlogPosts(payload) {
    var auth = payload.token ? requireAuth_(payload.token) : { user: { role: 'public' } };
    var posts = sheetToObjects_(SHEETS.BLOG_POSTS);
    // Public only sees published
    if (!auth.user || auth.user.role === 'public' || [ROLES.CLIENT, ROLES.REFERRER].indexOf(auth.user.role) >= 0) {
        posts = posts.filter(function(p) { return p.status === 'published'; });
    }
    // Sort by date desc
    posts.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    return successResponse_(posts);
}

function handleCreateBlogPost(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        title: { required: true, label: 'Title' },
        content_html: { required: true, label: 'Content' }
    });
    var slug = (payload.slug || payload.title).toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var postId = generateId_('BLG');
    appendRow_(SHEETS.BLOG_POSTS, [
        postId, payload.title, slug, payload.category || 'General',
        auth.user.name, payload.status || 'draft',
        payload.content_html, payload.excerpt || '',
        payload.featured_image || '', payload.tags || '',
        payload.status === 'published' ? now_() : '', now_(), now_(),
        payload.meta_description || ''
    ]);
    logAction_(auth.user.user_id, auth.user.name, 'BLOG_CREATED', payload.title);
    return successResponse_({ postId: postId, slug: slug }, 'Blog post created.');
}

function handleUpdateBlogPost(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var post = findRow_(SHEETS.BLOG_POSTS, 'post_id', payload.post_id);
    if (!post) return errorResponse_('Post not found.');
    var updates = { updated_at: now_() };
    ['title', 'slug', 'category', 'status', 'content_html', 'excerpt',
     'featured_image', 'tags', 'meta_description'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });
    if (payload.status === 'published' && !post.published_at) {
        updates.published_at = now_();
    }
    updateRow_(SHEETS.BLOG_POSTS, post._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'BLOG_UPDATED', payload.title || post.title);
    return successResponse_(null, 'Blog post updated.');
}

function handleDeleteBlogPost(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var post = findRow_(SHEETS.BLOG_POSTS, 'post_id', payload.post_id);
    if (!post) return errorResponse_('Post not found.');
    updateRow_(SHEETS.BLOG_POSTS, post._rowIndex, { status: 'deleted' });
    logAction_(auth.user.user_id, auth.user.name, 'BLOG_DELETED', post.title);
    return successResponse_(null, 'Blog post deleted.');
}

function handleGetBlogCategories(payload) {
    return successResponse_(sheetToObjects_(SHEETS.BLOG_CATEGORIES));
}

// ═══════════════════════════════════════════════════════════
// JOB LISTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleGetJobListings(payload) {
    var listings = sheetToObjects_(SHEETS.JOB_LISTINGS);
    if (!payload.token) {
        listings = listings.filter(function(j) { return j.status === 'active'; });
    }
    return successResponse_(listings);
}

function handleCreateJobListing(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        title: { required: true, label: 'Job title' },
        type: { required: true, label: 'Job type' }
    });
    var jobId = generateId_('JOB');
    appendRow_(SHEETS.JOB_LISTINGS, [
        jobId, payload.title, payload.type, payload.location || 'Remote',
        payload.salary_range || '', payload.short_description || payload.short_desc || '',
        payload.full_description_json || '[]', payload.requirements_json || '[]',
        payload.benefits_json || '[]',
        payload.status || 'draft', payload.deadline || '',
        now_(), now_(), auth.user.name
    ]);
    logAction_(auth.user.user_id, auth.user.name, 'JOB_CREATED', payload.title);
    return successResponse_({ jobId: jobId }, 'Job listing created.');
}

function handleUpdateJobListing(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var job = findRow_(SHEETS.JOB_LISTINGS, 'job_id', payload.job_id);
    if (!job) return errorResponse_('Job listing not found.');
    var updates = { updated_at: now_() };
    ['title', 'type', 'location', 'salary_range', 'short_desc',
     'full_description_json', 'requirements_json', 'benefits_json',
     'status', 'deadline'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });
    // Accept frontend field name 'short_description' as alias for 'short_desc'
    if (payload.short_description !== undefined) {
        updates.short_desc = payload.short_description;
    }
    updateRow_(SHEETS.JOB_LISTINGS, job._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'JOB_UPDATED', payload.title || job.title);
    return successResponse_(null, 'Job listing updated.');
}

// ═══════════════════════════════════════════════════════════
// PORTFOLIO MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleGetPortfolio(payload) {
    var projects = sheetToObjects_(SHEETS.PROJECTS_PORTFOLIO);
    if (!payload.token) {
        projects = projects.filter(function(p) { return p.status === 'published'; });
    }
    projects.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
    return successResponse_(projects);
}

function handleCreatePortfolioProject(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, { title: { required: true, label: 'Project title' } });
    var projId = generateId_('PTF');
    appendRow_(SHEETS.PROJECTS_PORTFOLIO, [
        projId, payload.title, payload.client_name || '', payload.category || '',
        payload.description || '', payload.technologies || '',
        payload.thumbnail || '', payload.images_json || '[]', payload.live_url || '',
        payload.status || 'draft', payload.order || 0, now_(), now_()
    ]);
    logAction_(auth.user.user_id, auth.user.name, 'PORTFOLIO_CREATED', payload.title);
    return successResponse_({ projectId: projId }, 'Portfolio project created.');
}

function handleUpdatePortfolioProject(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var proj = findRow_(SHEETS.PROJECTS_PORTFOLIO, 'project_id', payload.project_id);
    if (!proj) return errorResponse_('Portfolio project not found.');
    var updates = { updated_at: now_() };
    ['title', 'client_name', 'category', 'description', 'technologies',
     'thumbnail', 'images_json', 'live_url', 'status', 'order'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });
    updateRow_(SHEETS.PROJECTS_PORTFOLIO, proj._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'PORTFOLIO_UPDATED', payload.title || proj.title);
    return successResponse_(null, 'Portfolio project updated.');
}

// ═══════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════

function handleGetTestimonials(payload) {
    var all = sheetToObjects_(SHEETS.TESTIMONIALS);
    if (!payload.token) all = all.filter(function(t) { return t.status === 'published'; });
    return successResponse_(all);
}

function handleCreateTestimonial(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    appendRow_(SHEETS.TESTIMONIALS, [
        generateId_('TST'), payload.client_name || '', payload.company || '',
        payload.role || '', payload.quote || '', payload.photo_url || '',
        payload.rating || 5, payload.status || 'draft', now_()
    ]);
    return successResponse_(null, 'Testimonial created.');
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD ANALYTICS (Staff)
// ═══════════════════════════════════════════════════════════

function handleGetDashboard(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    
    var clients = sheetToObjects_(SHEETS.CLIENTS);
    var projects = sheetToObjects_(SHEETS.CLIENT_PROJECTS);
    var invoices = sheetToObjects_(SHEETS.INVOICES);
    var referrals = sheetToObjects_(SHEETS.REFERRALS);
    var applications = sheetToObjects_(SHEETS.JOB_APPLICATIONS);
    
    var activeProjects = projects.filter(function(p) { return p.status === 'active'; });
    var pendingInvoices = invoices.filter(function(i) { return i.status === 'pending'; });
    var totalRevenue = invoices.filter(function(i) { return i.status === 'paid'; })
        .reduce(function(sum, i) { return sum + Number(i.total); }, 0);
    var pendingAmount = pendingInvoices.reduce(function(sum, i) { return sum + Number(i.total); }, 0);
    
    // Projects by step
    var stepCounts = {};
    activeProjects.forEach(function(p) {
        var step = p.step || '0';
        stepCounts[step] = (stepCounts[step] || 0) + 1;
    });
    
    return successResponse_({
        totalClients: clients.length,
        activeClients: clients.filter(function(c) { return c.status === 'Active'; }).length,
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        completedProjects: projects.filter(function(p) { return p.status === 'completed'; }).length,
        totalRevenue: totalRevenue,
        pendingInvoiceCount: pendingInvoices.length,
        pendingInvoiceAmount: pendingAmount,
        totalReferrals: referrals.length,
        totalApplications: applications.length,
        projectsByStep: stepCounts,
        recentProjects: activeProjects.slice(-5).reverse(),
        recentApplications: applications.slice(-5).reverse()
    });
}

// ═══════════════════════════════════════════════════════════
// ADMIN READ — JOB APPLICATIONS & QUALIFICATIONS
// ═══════════════════════════════════════════════════════════

function handleGetJobApplications(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var apps = sheetToObjects_(SHEETS.JOB_APPLICATIONS);
    apps.sort(function(a, b) { return new Date(b.applied_at || 0) - new Date(a.applied_at || 0); });
    return successResponse_(apps);
}

function handleGetJobQualifications(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var quals = sheetToObjects_(SHEETS.JOB_QUALIFICATIONS);
    return successResponse_(quals);
}

function handleDeleteApplication(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var rowIndex = payload.rowIndex;
    if (!rowIndex) return errorResponse_('Row index is required.');

    var sheet = getSheetByName_(SHEETS.JOB_APPLICATIONS);
    if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
        return errorResponse_('Invalid row index.');
    }
    sheet.deleteRow(rowIndex);
    logAction_(auth.user.user_id, auth.user.name, 'DELETE_APPLICATION', 'Row ' + rowIndex);
    return successResponse_(null, 'Application deleted.');
}

function handleCreateApplication(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    validateInput_(payload, {
        name:  { required: true, label: 'Applicant name' },
        email: { required: true, type: 'email', label: 'Email' }
    });

    var appId = 'APP-' + Date.now();
    var jobId = payload.job_id || 'manual';
    var jobTitle = payload.job_title || 'Manual Entry';

    appendRow_(SHEETS.JOB_APPLICATIONS, [
        appId, jobId, jobTitle,
        payload.name, payload.email, payload.phone || '', payload.note || '',
        'No', 'No', 'No',
        '', '', '',
        'received', now_()
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'CREATE_APPLICATION',
        payload.name + ' (' + payload.email + ')');

    return successResponse_({ application_id: appId }, 'Applicant added.');
}

// ═══════════════════════════════════════════════════════════
// ADMIN — APPLICANT EMAIL SYSTEM
// ═══════════════════════════════════════════════════════════

var APPLICANT_TEMPLATES = ['cv_confirmation', 'interview_selected', 'not_selected', 'interview_thanks', 'interview_confirmed', 'trial_invitation', 'role_offered', 'role_rejected', 'custom'];

/**
 * Send a curated email template to one or more applicants.
 * Supports single email or batch via recipients[] array.
 */
function handleSendApplicantEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var template = payload.template;
    if (!template || APPLICANT_TEMPLATES.indexOf(template) === -1) {
        return errorResponse_('Invalid template. Must be one of: ' + APPLICANT_TEMPLATES.join(', '));
    }

    // Build recipients list — support both single and batch
    var recipients = [];
    if (payload.recipients && Array.isArray(payload.recipients) && payload.recipients.length > 0) {
        recipients = payload.recipients;
    } else if (payload.email) {
        recipients = [{ email: payload.email, name: payload.applicantName || '' }];
    } else {
        return errorResponse_('At least one recipient email is required.');
    }

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

        var tpl = buildApplicantTemplate_(name, template, payload.extras || {});

        // Allow frontend to override with edited preview HTML
        var finalHtml = payload.rawHtml || buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);
        var finalSubject = payload.rawSubject || tpl.subject;

        try {
            sendEmail_({
                to: email,
                subject: finalSubject,
                htmlBody: finalHtml,
                from: 'jobs@icuni.org'
            });
            logEmail_(email, tpl.subject, 'admin_applicant_' + template, 'sent');
            sent++;
        } catch(e) {
            logEmail_(email, tpl.subject, 'admin_applicant_' + template, 'failed');
            failed++;
            errors.push(email + ': ' + e.message);
        }

        // Auto-update application status
        if (tpl.newStatus) {
            var app = findRow_(SHEETS.JOB_APPLICATIONS, 'email', email);
            if (app) {
                updateRow_(SHEETS.JOB_APPLICATIONS, app._rowIndex, { status: tpl.newStatus });
            }
        }
    }

    logAction_(auth.user.user_id, auth.user.name, 'APPLICANT_EMAIL',
        template + ' → ' + sent + ' sent, ' + failed + ' failed');

    var msg = sent + ' email' + (sent !== 1 ? 's' : '') + ' sent';
    if (failed > 0) msg += ', ' + failed + ' failed';
    return successResponse_({ sent: sent, failed: failed, errors: errors }, msg + '.');
}

/**
 * Preview an email template — returns rendered HTML without sending.
 */
function handlePreviewApplicantEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var template = payload.template;
    if (!template || APPLICANT_TEMPLATES.indexOf(template) === -1) {
        return errorResponse_('Invalid template.');
    }

    var name = payload.applicantName || 'Applicant';
    var tpl = buildApplicantTemplate_(name, template, payload.extras || {});
    var html = buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);

    return successResponse_({
        html: html,
        subject: tpl.subject,
        newStatus: tpl.newStatus
    });
}

/**
 * Build subject, title, body HTML, opts, and optional newStatus for each template.
 * 7 templates covering the full applicant lifecycle.
 * @param {Object} extras — dynamic fields (dateOptions[], confirmedDate, confirmedTime, meetingLink)
 */
function buildApplicantTemplate_(name, template, extras) {
    extras = extras || {};
    switch (template) {

        // ── 1. Thank You for Your Application ────────────────
        case 'cv_confirmation':
            return {
                subject: 'Application Received — ICUNI Labs',
                title: 'Thank You for Your Application',
                body:
                    'Thank you for taking the time to apply to ICUNI Labs. ' +
                    'We know that every application represents real effort, and we want you to know ' +
                    'that yours has been <strong>safely received</strong> and is now in the hands of our team.<br><br>' +
                    'Here\'s what happens next:<br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    '1. Our team reviews every application individually<br>' +
                    '2. We assess your skills, experience, and potential<br>' +
                    '3. You\'ll hear back from us within <strong style="color:#ff7a00;">48 hours</strong>' +
                    '</div></div>' +
                    'We appreciate your interest in joining our team. Sit tight — we\'ll be in touch soon.',
                opts: { ctaText: 'Explore Our Work', ctaLink: 'https://labs.icuni.org' },
                newStatus: null
            };

        // ── 2. Selected for Interview ────────────────────────
        case 'interview_selected':
            // Build date options block if provided
            var dateBlock = '';
            var dateOpts = extras.dateOptions || [];
            if (dateOpts.length > 0) {
                var rows = '';
                for (var d = 0; d < dateOpts.length; d++) {
                    rows += '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:14px;">' +
                        '<strong style="color:#34d399;">Option ' + (d+1) + '</strong></td>' +
                        '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:14px;">' +
                        dateOpts[d] + '</td></tr>';
                }
                dateBlock =
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#34d399;font-size:13px;letter-spacing:2px;margin-bottom:10px;">AVAILABLE SLOTS</div>' +
                    '<table style="width:100%;border-collapse:collapse;">' + rows + '</table>' +
                    '<div style="color:#94a3b8;font-size:12px;margin-top:10px;">Please reply to this email with your preferred slot and we\'ll confirm your appointment.</div>' +
                    '</div>';
            }
            return {
                subject: 'Interview Invitation — ICUNI Labs',
                title: 'You\'ve Been Selected for an Interview!',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">CONGRATULATIONS</span>' +
                    '</div>' +
                    'We\'re excited to let you know that after carefully reviewing your application, ' +
                    'our team has <strong>selected you to move forward to the interview stage</strong>.<br><br>' +
                    'This isn\'t something we take lightly — out of all the applications we received, ' +
                    'yours demonstrated the qualities we\'re looking for, and we\'d love to get to know you better.<br><br>' +
                    dateBlock +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#34d399;font-size:13px;letter-spacing:2px;margin-bottom:8px;">WHAT TO EXPECT</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    '• The conversation will be relaxed — we want to learn about <strong>you</strong><br>' +
                    '• Come prepared to share your experiences and ask us questions too<br>' +
                    '• Duration: approximately 30–45 minutes' +
                    '</div></div>' +
                    'We genuinely believe that the best teams are built through honest, human conversations — ' +
                    'and we\'re looking forward to ours.<br><br>' +
                    '<strong>' + (dateOpts.length > 0 ? 'Reply with your preferred slot and we\'ll lock it in.' : 'Keep an eye on your inbox for scheduling details.') + '</strong>',
                opts: { ctaText: 'Prepare for Your Interview', ctaLink: 'https://labs.icuni.org' },
                newStatus: 'interview'
            };

        // ── 3. Not Selected for Next Step ─────────────────────
        case 'not_selected':
            return {
                subject: 'Application Update — ICUNI Labs',
                title: 'An Update on Your Application',
                body:
                    'Thank you for your interest in ICUNI Labs and for the time you invested in your application. ' +
                    'We truly appreciate it.<br><br>' +
                    'After careful consideration, we\'ve decided to <strong>move forward with other candidates</strong> ' +
                    'whose experience more closely aligns with the specific needs of this role at this time.<br><br>' +
                    '<div style="background:linear-gradient(135deg,#1a1a2e,#1e1a30);border:1px solid #3a2a5a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#c4b5fd;font-size:13px;letter-spacing:2px;margin-bottom:8px;">THIS DOESN\'T DEFINE YOU</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    'We want to be completely honest with you: not being selected for one role says ' +
                    '<strong>nothing</strong> about your value or your potential. The hiring process is a snapshot ' +
                    'of a moment — not a measure of a person. The qualities that led you to apply here — your ambition, ' +
                    'your willingness to put yourself forward — are qualities that will serve you well wherever you go.' +
                    '</div></div>' +
                    'We encourage you to keep an eye on our careers page for future opportunities. ' +
                    'Circumstances change, teams grow, and the right fit might be just around the corner.<br><br>' +
                    'We wish you every success in your career. Truly.',
                opts: { ctaText: 'Explore Other Roles', ctaLink: 'https://labs.icuni.org/careers' },
                newStatus: 'rejected'
            };

        // ── 4. Thank You for Today's Interview ───────────────
        case 'interview_thanks':
            return {
                subject: 'Thank You for the Interview — ICUNI Labs',
                title: 'Thank You for Your Time Today',
                body:
                    'We wanted to reach out personally to say <strong>thank you</strong> for taking the time to speak ' +
                    'with us today. We genuinely enjoyed learning more about you — your experiences, your perspective, ' +
                    'and what drives you.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#60a5fa;font-size:13px;letter-spacing:2px;margin-bottom:8px;">WHAT HAPPENS NEXT</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    '• Our team will discuss all interviews internally<br>' +
                    '• We aim to reach a decision within <strong style="color:#ff7a00;">48 hours</strong><br>' +
                    '• You\'ll receive a personal update from us either way — we don\'t leave people hanging' +
                    '</div></div>' +
                    'Regardless of the outcome, please know that making it to the interview stage is an achievement in itself. ' +
                    'We were impressed by the quality of our conversation, and we appreciate you sharing your story with us.<br><br>' +
                    'We\'ll be in touch soon.',
                opts: { ctaText: 'Visit ICUNI Labs', ctaLink: 'https://labs.icuni.org' },
                newStatus: null
            };

        // ── 5. Interview Confirmed ───────────────────────────
        case 'interview_confirmed':
            var cDate = extras.confirmedDate || 'TBC';
            var cTime = extras.confirmedTime || 'TBC';
            var mLink = extras.meetingLink || '';
            var meetingBlock = mLink
                ? '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:8px;padding:16px;margin:12px 0;text-align:center;">' +
                  '<div style="color:#34d399;font-size:13px;letter-spacing:2px;margin-bottom:10px;">YOUR MEETING LINK</div>' +
                  '<a href="' + mLink + '" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.5px;">Join Meeting</a>' +
                  '<div style="color:#94a3b8;font-size:12px;margin-top:10px;word-break:break-all;">' + mLink + '</div>' +
                  '</div>'
                : '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:12px 16px;margin:12px 0;color:#e8ecf4;font-size:14px;">' +
                  'The interview will take place <strong>in person</strong>. Further location details will follow shortly.' +
                  '</div>';
            return {
                subject: 'Interview Confirmed — ICUNI Labs',
                title: 'Your Interview is Confirmed!',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">CONFIRMED</span>' +
                    '</div>' +
                    'Great news — your interview slot has been <strong>confirmed</strong>. We\'re looking forward to speaking with you!<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#34d399;font-size:13px;letter-spacing:2px;margin-bottom:10px;">YOUR INTERVIEW DETAILS</div>' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:13px;width:80px;">Date</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;">' + cDate + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;">Time</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;">' + cTime + '</td></tr>' +
                    '</table></div>' +
                    meetingBlock +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#60a5fa;font-size:13px;letter-spacing:2px;margin-bottom:8px;">HOW TO PREPARE</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    '• Be ready 5 minutes before the scheduled time<br>' +
                    '• Have a stable internet connection if joining online<br>' +
                    '• Prepare to tell us about yourself and your experience<br>' +
                    '• Feel free to ask us questions too — it\'s a two-way conversation' +
                    '</div></div>' +
                    'We can\'t wait to meet you. See you soon!',
                opts: mLink
                    ? { ctaText: 'Join Meeting', ctaLink: mLink }
                    : { ctaText: 'Visit ICUNI Labs', ctaLink: 'https://labs.icuni.org' },
                newStatus: null
            };

        // ── 6. Paid Trial Invitation ─────────────────────────
        case 'trial_invitation':
            var rate = extras.weeklyRate || '700';
            return {
                subject: "Congratulations \u2014 You've Been Selected for the Next Stage | ICUNI Labs",
                title: 'Paid Working Trial Invitation',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">YOU STOOD OUT</span>' +
                    '</div>' +
                    'Congratulations. Out of all the applicants we reviewed for the Operations Assistant role, ' +
                    'you stood out \u2014 and I would like to personally invite you to the next stage of our process.<br><br>' +
                    'This is a <strong>one-week paid working trial</strong> \u2014 a structured week where you will perform ' +
                    'the core function of the role with full support, real tools, and real compensation. ' +
                    'The purpose is mutual: I get to see how you work in a live environment, and you get to ' +
                    'experience what it is actually like to work with me and this company.<br><br>' +

                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#00bfff;font-size:13px;letter-spacing:2px;margin-bottom:10px;">WHAT YOU WILL DO</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:2;">' +
                    '\u2022 Receive a demo video, outreach scripts, and access to our demo sites<br>' +
                    '\u2022 Identify and qualify <strong style="color:white;">10 strong prospective leads</strong><br>' +
                    '\u2022 Deliver <strong style="color:white;">2 fully qualified, meeting-ready leads</strong> to me for closing<br>' +
                    '\u2022 You will not be expected to sell, negotiate, or close' +
                    '</div></div>' +

                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#10b981;font-size:13px;letter-spacing:2px;margin-bottom:10px;">COMPENSATION</div>' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Base Pay</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">GH\u20B5' + rate + ' for the week</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Commission</td>' +
                    '<td style="padding:8px 12px;color:#ff7a00;font-size:15px;font-weight:600;text-align:right;">GH\u20B51,000 or 10% of deal</td></tr>' +
                    '</table>' +
                    '<div style="color:#64748b;font-size:12px;margin-top:10px;">Commission applies to any deal that closes from a lead you deliver during the trial \u2014 whichever is higher.</div>' +
                    '</div>' +

                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#f59e0b;font-size:13px;letter-spacing:2px;margin-bottom:10px;">NEXT STEP</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.7;">' +
                    'If you accept, I would like to schedule a <strong style="color:white;">1-hour briefing call today</strong> ' +
                    'to walk you through the tools, scripts, expectations, and answer any questions.<br><br>' +
                    'Please select a time between <strong style="color:white;">12:00 PM and 5:00 PM today</strong> ' +
                    'and reply to this email with your preferred slot.' +
                    '</div></div>' +

                    'After the briefing, you will receive a short <strong>Independent Contractor Agreement</strong> ' +
                    'to review and sign. This formalises the arrangement and protects both parties.<br><br>' +

                    'At the end of the 5 days, we will have a brief wrap-up conversation. If the fit is right on both sides, ' +
                    'we move into a formal offer. If not, you walk away with your full pay and commission \u2014 no obligations.<br><br>' +

                    'I look forward to working with you this week.<br><br>' +

                    '<div style="border-top:1px solid #2a2a4a;padding-top:16px;margin-top:16px;">' +
                    '<strong style="color:white;">Menelek (Mikael) Makonnen</strong><br>' +
                    '<span style="color:#64748b;font-size:13px;">Founder, ICUNI Labs \u2014 labs.icuni.org</span>' +
                    '</div>',
                opts: { hideCta: true },
                newStatus: 'trial_invited'
            };

        // ── 7. You Have Been Selected for the Role ───────────
        case 'role_offered':
            return {
                subject: 'Offer of Employment — ICUNI Labs',
                title: 'Welcome to the Team!',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#d97706,#f59e0b);color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">🏆 CONGRATULATIONS</span>' +
                    '</div>' +
                    'We are absolutely <strong>thrilled</strong> to let you know that after a thorough evaluation process, ' +
                    'our team has unanimously decided that <strong>you are the right person for the role</strong>.<br><br>' +
                    'From the moment we reviewed your application to the conversation we had during your interview, ' +
                    'you consistently demonstrated the qualities we value most at ICUNI Labs — initiative, thoughtfulness, ' +
                    'and a genuine desire to contribute to something meaningful.<br><br>' +
                    '<div style="background:linear-gradient(135deg,#1a1a2e,#1a2010);border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#4ade80;font-size:13px;letter-spacing:2px;margin-bottom:8px;">NEXT STEPS</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    '• A member of our team will reach out to discuss the details of your role<br>' +
                    '• We\'ll share onboarding information and your start date<br>' +
                    '• Get ready to build something great with us!' +
                    '</div></div>' +
                    'We chose you because we believe in your potential, and we can\'t wait to see what we\'ll build together.<br><br>' +
                    '<strong>Welcome to ICUNI Labs.</strong>',
                opts: { ctaText: 'Welcome Aboard', ctaLink: 'https://labs.icuni.org' },
                newStatus: 'offered'
            };

        // ── 6. You Have Not Been Selected for the Role ───────
        case 'role_rejected':
            return {
                subject: 'Final Decision — ICUNI Labs',
                title: 'Our Decision on the Role',
                body:
                    'First of all, thank you — sincerely — for the time and energy you invested throughout ' +
                    'this process. Meeting you during the interview was a genuine pleasure, and our team speaks ' +
                    'highly of the conversation we had.<br><br>' +
                    'After very careful deliberation, we\'ve made the difficult decision to <strong>offer the position ' +
                    'to another candidate</strong> whose background is a closer match for the very specific needs of this role.<br><br>' +
                    '<div style="background:linear-gradient(135deg,#1a1a2e,#1e1a30);border:1px solid #3a2a5a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#c4b5fd;font-size:13px;letter-spacing:2px;margin-bottom:8px;">WE MEAN THIS</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    'This was a close decision, and it was not made lightly. The fact that you reached the final stages ' +
                    'of our process speaks to the calibre of person you are. We would genuinely encourage you to ' +
                    'apply again in the future — teams evolve, new roles open up, and the right fit may well be ' +
                    'just around the corner.' +
                    '</div></div>' +
                    'We wish you nothing but the very best in your career. You have a lot to offer, ' +
                    'and the right opportunity will find you.<br><br>' +
                    'With sincere respect and gratitude.',
                opts: { ctaText: 'Stay Connected', ctaLink: 'https://labs.icuni.org/careers' },
                newStatus: 'rejected'
            };

        // ── 8. Custom Email — Fully Editable ─────────────────
        case 'custom':
            return {
                subject: extras.subject || 'A Message from ICUNI Labs',
                title: extras.title || 'Hello from ICUNI Labs',
                body: extras.body || 'This is a custom message from our team.',
                opts: extras.ctaLink
                    ? { ctaText: extras.ctaText || 'Visit ICUNI Labs', ctaLink: extras.ctaLink }
                    : { hideCta: true },
                newStatus: extras.newStatus || null
            };

        default:
            throw new Error('Unknown template: ' + template);
    }
}

// ═══════════════════════════════════════════════════════════
// ADMIN READ — REFERRERS & REFERRALS
// ═══════════════════════════════════════════════════════════

function handleGetReferrers(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    return successResponse_(sheetToObjects_(SHEETS.REFERRERS));
}

function handleGetReferrals(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var referrals = sheetToObjects_(SHEETS.REFERRALS);
    referrals.sort(function(a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); });
    return successResponse_(referrals);
}

// ═══════════════════════════════════════════════════════════
// ADMIN — REFERRER EMAIL SYSTEM
// ═══════════════════════════════════════════════════════════

var REFERRER_TEMPLATES = ['welcome', 'stage_update', 'payment_sent', 'meeting_reminder', 'new_material', 'custom'];

function handleSendReferrerEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var template = payload.template;
    if (!template || REFERRER_TEMPLATES.indexOf(template) === -1) {
        return errorResponse_('Invalid template. Must be one of: ' + REFERRER_TEMPLATES.join(', '));
    }
    var recipients = [];
    if (payload.recipients && Array.isArray(payload.recipients) && payload.recipients.length > 0) {
        recipients = payload.recipients;
    } else if (payload.email) {
        recipients = [{ email: payload.email, name: payload.name || '' }];
    } else {
        return errorResponse_('At least one recipient email is required.');
    }
    var sent = 0, failed = 0, errors = [];
    for (var i = 0; i < recipients.length; i++) {
        var r = recipients[i];
        var email = r.email;
        var name = r.name || email.split('@')[0];
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { failed++; errors.push(email + ': invalid email'); continue; }
        var tpl = buildReferrerTemplate_(name, template, payload.extras || {});
        var finalHtml = payload.rawHtml || buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);
        var finalSubject = payload.rawSubject || tpl.subject;
        try {
            sendEmail_({ to: email, subject: finalSubject, htmlBody: finalHtml, from: 'hello@icuni.org' });
            logEmail_(email, tpl.subject, 'admin_referrer_' + template, 'sent');
            sent++;
        } catch(e) {
            logEmail_(email, tpl.subject, 'admin_referrer_' + template, 'failed');
            failed++; errors.push(email + ': ' + e.message);
        }
    }
    logAction_(auth.user.user_id, auth.user.name, 'REFERRER_EMAIL', template + ' -> ' + sent + ' sent, ' + failed + ' failed');
    var msg = sent + ' email' + (sent !== 1 ? 's' : '') + ' sent';
    if (failed > 0) msg += ', ' + failed + ' failed';
    return successResponse_({ sent: sent, failed: failed, errors: errors }, msg + '.');
}

function handlePreviewReferrerEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var template = payload.template;
    if (!template || REFERRER_TEMPLATES.indexOf(template) === -1) return errorResponse_('Invalid template.');
    var name = payload.name || 'Partner';
    var tpl = buildReferrerTemplate_(name, template, payload.extras || {});
    var html = buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);
    return successResponse_({ html: html, subject: tpl.subject });
}

function buildReferrerTemplate_(name, template, extras) {
    extras = extras || {};
    switch (template) {
        case 'welcome':
            return {
                subject: 'Welcome to the ICUNI Labs Referral Program',
                title: 'Welcome Aboard, Partner!',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#ff7a00,#ff9533);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">YOU\'RE IN</span>' +
                    '</div>' +
                    'Welcome to the ICUNI Labs Referral Partner program. We\'re excited to have you on board.<br><br>' +
                    'Here\'s how it works:<br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#ff7a00;font-size:13px;letter-spacing:2px;margin-bottom:10px;">YOUR PATH TO EARNINGS</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:2;">' +
                    '1. Introduce us to a business owner or decision maker<br>' +
                    '2. We handle the meeting, pitch, and proposal<br>' +
                    '3. When the deal closes, you earn <strong style="color:#ff7a00;">GH\\u20B51,000+</strong> or 10% of the deal<br>' +
                    '4. Payment hits as soon as the first payment lands' +
                    '</div></div>' +
                    'Log in to your referral dashboard to access portfolio decks, demo sites, and tracking tools.<br><br>' +
                    'We look forward to building together.',
                opts: { ctaText: 'Go to Dashboard', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'stage_update':
            var stageName = extras.stageName || 'the next stage';
            var prospectName = extras.prospectName || 'your referral';
            return {
                subject: 'Referral Update \u2014 ' + prospectName + ' | ICUNI Labs',
                title: 'Your Referral is Moving Forward',
                body:
                    'Great news \u2014 <strong>' + prospectName + '</strong> has progressed to <strong style="color:#00bfff;">' + stageName + '</strong>.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#00bfff;font-size:13px;letter-spacing:2px;margin-bottom:8px;">CURRENT STATUS</div>' +
                    '<div style="color:#e8ecf4;font-size:15px;font-weight:600;">' + stageName + '</div>' +
                    '<div style="color:#94a3b8;font-size:12px;margin-top:6px;">Prospect: ' + prospectName + '</div>' +
                    '</div>' +
                    'We\'ll keep you updated as things progress. You can also check your dashboard for real-time status.',
                opts: { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'payment_sent':
            var amount = extras.amount || '1,000';
            var method = extras.method || 'your preferred method';
            return {
                subject: 'Payment Sent \u2014 GH\\u20B5' + amount + ' | ICUNI Labs',
                title: 'You Just Got Paid!',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">PAYMENT SENT</span>' +
                    '</div>' +
                    'Congratulations! Your referral commission has been processed.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Amount</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#10b981;font-size:18px;font-weight:700;text-align:right;">GH\\u20B5' + amount + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Method</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:14px;text-align:right;">' + method + '</td></tr>' +
                    '</table></div>' +
                    'Thank you for the introduction \u2014 keep them coming. Every deal you bring in earns you more.',
                opts: { ctaText: 'Refer Another', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'meeting_reminder':
            var meetDate = extras.meetingDate || 'TBC';
            var meetTime = extras.meetingTime || 'TBC';
            var prospect = extras.prospectName || 'your referral';
            return {
                subject: 'Meeting Reminder \u2014 ' + prospect + ' | ICUNI Labs',
                title: 'Meeting Coming Up',
                body:
                    'Just a heads up \u2014 the meeting with <strong>' + prospect + '</strong> is scheduled:<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:13px;width:80px;">Date</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;">' + meetDate + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:13px;">Time</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;">' + meetTime + '</td></tr>' +
                    '</table></div>' +
                    'We\'ll handle the meeting. If the prospect has invited you to attend, feel free to join \u2014 otherwise sit back and let us do our thing.<br><br>' +
                    'We\'ll update you as soon as it\'s done.',
                opts: { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'new_material':
            var matTitle = extras.materialTitle || 'New Material';
            var matDesc = extras.materialDescription || 'New portfolio and demo materials are now available.';
            return {
                subject: 'New Material Available | ICUNI Labs',
                title: 'Fresh Material for Your Toolkit',
                body:
                    'We\'ve added new material to your referral toolkit:<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#8b5cf6;font-size:13px;letter-spacing:2px;margin-bottom:8px;">NEW MATERIAL</div>' +
                    '<div style="color:#e8ecf4;font-size:16px;font-weight:600;margin-bottom:6px;">' + matTitle + '</div>' +
                    '<div style="color:#94a3b8;font-size:14px;line-height:1.6;">' + matDesc + '</div>' +
                    '</div>' +
                    'Use this when speaking with prospects. Log in to your dashboard to view and download.',
                opts: { ctaText: 'View Materials', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'custom':
            return {
                subject: extras.subject || 'A Message from ICUNI Labs',
                title: extras.title || 'Hello from ICUNI Labs',
                body: extras.body || 'This is a custom message from our team.',
                opts: extras.ctaLink ? { ctaText: extras.ctaText || 'Visit ICUNI Labs', ctaLink: extras.ctaLink } : { hideCta: true }
            };
        default:
            throw new Error('Unknown referrer template: ' + template);
    }
}

// ═══════════════════════════════════════════════════════════
// ADMIN — REFERRAL PIPELINE MANAGEMENT
// ═══════════════════════════════════════════════════════════

function handleAdvanceReferralStage(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var referral = findRow_(SHEETS.REFERRALS, 'referral_id', payload.referralId);
    if (!referral) return errorResponse_('Referral not found.');
    var newStage = Number(payload.newStage) || 0;
    updateRow_(SHEETS.REFERRALS, referral._rowIndex, {
        stage: newStage,
        updated_at: now_()
    });
    logAction_(auth.user.user_id, auth.user.name, 'REFERRAL_STAGE_ADVANCED',
        referral.client_name + ' → Stage ' + newStage);
    return successResponse_({ stage: newStage }, 'Referral advanced to stage ' + newStage + '.');
}

function handleCloseReferral(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var referral = findRow_(SHEETS.REFERRALS, 'referral_id', payload.referralId);
    if (!referral) return errorResponse_('Referral not found.');
    var outcome = payload.outcome; // 'won' or 'lost'
    if (outcome !== 'won' && outcome !== 'lost') return errorResponse_('Outcome must be "won" or "lost".');
    var updates = {
        status: outcome === 'won' ? 'Closed Won' : 'Closed Lost',
        updated_at: now_()
    };
    if (outcome === 'won' && payload.dealValue) {
        var commissionRate = 0.10; // 10% of deal
        var commission = Math.max(Number(payload.dealValue) * commissionRate, 1000); // Min GH₵1,000
        updates.payout_amount = commission;
        updates.payout_status = 'pending';
    }
    updateRow_(SHEETS.REFERRALS, referral._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'REFERRAL_CLOSED',
        referral.client_name + ' → ' + updates.status);
    return successResponse_(null, 'Referral closed as ' + updates.status + '.');
}

function handleConfirmReferralPayout(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var referral = findRow_(SHEETS.REFERRALS, 'referral_id', payload.referralId);
    if (!referral) return errorResponse_('Referral not found.');
    updateRow_(SHEETS.REFERRALS, referral._rowIndex, {
        payout_status: 'confirmed',
        updated_at: now_()
    });
    // Update referrer total earned
    if (referral.referrer_id) {
        var referrer = findRow_(SHEETS.REFERRERS, 'referrer_id', referral.referrer_id);
        if (referrer) {
            var newTotal = Number(referrer.total_earned || 0) + Number(referral.payout_amount || 0);
            updateRow_(SHEETS.REFERRERS, referrer._rowIndex, {
                total_earned: newTotal,
                updated_at: now_()
            });
        }
    }
    logAction_(auth.user.user_id, auth.user.name, 'PAYOUT_CONFIRMED',
        referral.client_name + ' — GH₵' + (referral.payout_amount || 0));
    return successResponse_(null, 'Payout confirmed.');
}

// ═══════════════════════════════════════════════════════════
// ADMIN — REFERRER MATERIALS CRUD
// ═══════════════════════════════════════════════════════════

/**
 * Materials are stored in the REFERRERS spreadsheet on a 'Materials' sheet.
 * Columns: material_id, title, type, description, url, status, created_at, updated_at
 */
var SHEETS_MATERIALS = 'Materials';

function handleGetReferrerMaterials(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    try {
        return successResponse_(sheetToObjects_(SHEETS_MATERIALS));
    } catch(e) {
        // Materials sheet may not exist yet — return empty
        return successResponse_([]);
    }
}

function handleCreateReferrerMaterial(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var matId = generateId_('MAT');
    var nowStr = now_();
    try {
        appendRow_(SHEETS_MATERIALS, [
            matId,
            payload.title || 'Untitled',
            payload.type || 'document',
            payload.description || '',
            payload.url || '',
            'active',
            nowStr,
            nowStr
        ]);
    } catch(e) {
        // Auto-create sheet if missing
        var ssId = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.SS_REFERRALS);
        if (ssId) {
            var ss = SpreadsheetApp.openById(ssId);
            var sheet = ss.insertSheet(SHEETS_MATERIALS);
            sheet.appendRow(['material_id', 'title', 'type', 'description', 'url', 'status', 'created_at', 'updated_at']);
            sheet.getRange(1, 1, 1, 8).setFontWeight('bold');
            sheet.setFrozenRows(1);
            sheet.appendRow([matId, payload.title || 'Untitled', payload.type || 'document',
                payload.description || '', payload.url || '', 'active', nowStr, nowStr]);
        } else {
            return errorResponse_('Referrals spreadsheet not set up.');
        }
    }
    logAction_(auth.user.user_id, auth.user.name, 'MATERIAL_CREATED', payload.title || matId);
    return successResponse_({ materialId: matId }, 'Material created.');
}

function handleUpdateReferrerMaterial(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var mat = findRow_(SHEETS_MATERIALS, 'material_id', payload.materialId || payload.material_id);
    if (!mat) return errorResponse_('Material not found.');
    var updates = { updated_at: now_() };
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.type !== undefined) updates.type = payload.type;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.url !== undefined) updates.url = payload.url;
    if (payload.status !== undefined) updates.status = payload.status;
    updateRow_(SHEETS_MATERIALS, mat._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'MATERIAL_UPDATED', payload.title || mat.title);
    return successResponse_(null, 'Material updated.');
}

function handleDeleteReferrerMaterial(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var mat = findRow_(SHEETS_MATERIALS, 'material_id', payload.materialId || payload.material_id);
    if (!mat) return errorResponse_('Material not found.');
    updateRow_(SHEETS_MATERIALS, mat._rowIndex, { status: 'deleted', updated_at: now_() });
    logAction_(auth.user.user_id, auth.user.name, 'MATERIAL_DELETED', mat.title || mat.material_id);
    return successResponse_(null, 'Material deleted.');
}

// ═══════════════════════════════════════════════════════════
// ADMIN — REFERRER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

/**
 * Notifications are stored in REFERRERS spreadsheet on a 'Notifications' sheet.
 * Columns: notif_id, referrer_id, referral_id, type, message, read, created_at
 */
var SHEETS_NOTIFICATIONS = 'Notifications';

function handleSendReferrerNotification(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var notifId = generateId_('NTF');
    var nowStr = now_();
    try {
        appendRow_(SHEETS_NOTIFICATIONS, [
            notifId,
            payload.referrerId || '',
            payload.referralId || '',
            payload.type || 'general',
            payload.message || '',
            false,
            nowStr
        ]);
    } catch(e) {
        // Auto-create sheet if missing
        var ssId = PropertiesService.getScriptProperties().getProperty(PROP_KEYS.SS_REFERRALS);
        if (ssId) {
            var ss = SpreadsheetApp.openById(ssId);
            var sheet = ss.insertSheet(SHEETS_NOTIFICATIONS);
            sheet.appendRow(['notif_id', 'referrer_id', 'referral_id', 'type', 'message', 'read', 'created_at']);
            sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
            sheet.setFrozenRows(1);
            sheet.appendRow([notifId, payload.referrerId || '', payload.referralId || '',
                payload.type || 'general', payload.message || '', false, nowStr]);
        } else {
            return errorResponse_('Referrals spreadsheet not set up.');
        }
    }
    logAction_(auth.user.user_id, auth.user.name, 'REFERRER_NOTIFIED',
        payload.type + ' — ' + (payload.referrerId || 'all'));
    return successResponse_({ notifId: notifId }, 'Notification sent.');
}

function handleGetReferrerNotifications(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    try {
        var notifs = sheetToObjects_(SHEETS_NOTIFICATIONS);
        notifs.sort(function(a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); });
        return successResponse_(notifs);
    } catch(e) {
        return successResponse_([]);
    }
}

// ═══════════════════════════════════════════════════════════
// CLIENT EMAIL SYSTEM
// ═══════════════════════════════════════════════════════════

var CLIENT_TEMPLATES = ['welcome', 'project_kickoff', 'milestone_update', 'invoice_reminder',
    'review_request', 'thank_you', 'follow_up', 'upsell', 'check_in', 'custom'];

function handleSendClientEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var template = payload.template;
    if (!template || CLIENT_TEMPLATES.indexOf(template) === -1) {
        return errorResponse_('Invalid template. Must be one of: ' + CLIENT_TEMPLATES.join(', '));
    }
    var recipients = [];
    if (payload.recipients && Array.isArray(payload.recipients) && payload.recipients.length > 0) {
        recipients = payload.recipients;
    } else if (payload.email) {
        recipients = [{ email: payload.email, name: payload.clientName || '' }];
    } else {
        return errorResponse_('At least one recipient email is required.');
    }
    var sent = 0, failed = 0, errors = [];
    for (var i = 0; i < recipients.length; i++) {
        var r = recipients[i];
        var email = r.email;
        var name = r.name || email.split('@')[0];
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { failed++; errors.push(email + ': invalid email'); continue; }
        var tpl = buildClientTemplate_(name, template, payload.extras || {});
        var finalHtml = payload.rawHtml || buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);
        var finalSubject = payload.rawSubject || tpl.subject;
        try {
            sendEmail_({ to: email, subject: finalSubject, htmlBody: finalHtml, from: 'hello@icuni.org' });
            logEmail_(email, tpl.subject, 'admin_client_' + template, 'sent');
            sent++;
        } catch(e) {
            logEmail_(email, tpl.subject, 'admin_client_' + template, 'failed');
            failed++; errors.push(email + ': ' + e.message);
        }
    }
    logAction_(auth.user.user_id, auth.user.name, 'CLIENT_EMAIL', template + ' -> ' + sent + ' sent, ' + failed + ' failed');
    var msg = sent + ' email' + (sent !== 1 ? 's' : '') + ' sent';
    if (failed > 0) msg += ', ' + failed + ' failed';
    return successResponse_({ sent: sent, failed: failed, errors: errors }, msg + '.');
}

function handlePreviewClientEmail(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var template = payload.template;
    if (!template || CLIENT_TEMPLATES.indexOf(template) === -1) return errorResponse_('Invalid template.');
    var name = payload.clientName || 'Client';
    var tpl = buildClientTemplate_(name, template, payload.extras || {});
    var html = buildBrandedEmail_(name, tpl.title, tpl.body, tpl.opts);
    return successResponse_({ html: html, subject: tpl.subject });
}

function buildClientTemplate_(name, template, extras) {
    extras = extras || {};
    switch (template) {
        case 'meeting_confirmation':
            var mtgDate = extras.date || 'TBD';
            var mtgTime = extras.time || 'TBD';
            var mtgType = extras.type || 'online';
            var mtgLink = extras.link || extras.meetLink || '';
            var mtgLocation = extras.location || '';
            return {
                subject: 'Meeting Confirmed \u2014 ' + mtgDate + ' at ' + mtgTime + ' | ICUNI Labs',
                title: 'Your Meeting is Confirmed',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#10b981,#22c55e);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">CONFIRMED</span>' +
                    '</div>' +
                    'We\u2019re looking forward to meeting with you. Here are the details:<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#10b981;font-size:13px;letter-spacing:2px;margin-bottom:10px;">MEETING DETAILS</div>' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Date</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + mtgDate + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Time</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + mtgTime + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Format</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + (mtgType === 'online' ? 'Virtual (Google Meet)' : 'In Person') + '</td></tr>' +
                    (mtgLocation ? '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Location</td><td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + mtgLocation + '</td></tr>' : '') +
                    '</table></div>' +
                    (extras.notes || 'If you need to reschedule, simply reply to this email and we\u2019ll accommodate.'),
                opts: mtgLink ? { ctaText: 'Join Meeting', ctaLink: mtgLink } : {}
            };
        case 'welcome':
            return {
                subject: 'Welcome to ICUNI Labs \u2014 Let\u2019s Build Something Great',
                title: 'Welcome to ICUNI Labs',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#00bfff,#0099cc);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">WELCOME</span>' +
                    '</div>' +
                    'We\u2019re excited to officially welcome you as a client of ICUNI Labs. ' +
                    'From this point forward, you have a dedicated team working behind the scenes to bring your vision to life.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#00bfff;font-size:13px;letter-spacing:2px;margin-bottom:10px;">WHAT HAPPENS NEXT</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:2;">' +
                    '1. Your dedicated project folder has been created<br>' +
                    '2. We\u2019ll schedule a kickoff call to align on your goals<br>' +
                    '3. You\u2019ll receive access to your client portal for real-time tracking<br>' +
                    '4. Development begins according to your approved timeline' +
                    '</div></div>' +
                    'If you have any questions at all, simply reply to this email. We\u2019re here for you.',
                opts: { ctaText: 'Visit Your Portal', ctaLink: 'https://labs.icuni.org/#client' }
            };
        case 'project_kickoff':
            var projName = extras.projectName || 'your project';
            var timeline = extras.timeline || '4\u20136 weeks';
            return {
                subject: 'Project Kickoff \u2014 ' + projName + ' | ICUNI Labs',
                title: 'Your Project Has Officially Launched',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#10b981,#34d399);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">LAUNCHED</span>' +
                    '</div>' +
                    'Great news \u2014 <strong>' + projName + '</strong> is now officially in development.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#10b981;font-size:13px;letter-spacing:2px;margin-bottom:10px;">PROJECT DETAILS</div>' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Project</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + projName + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Est. Timeline</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + timeline + '</td></tr>' +
                    '</table></div>' +
                    'You\u2019ll receive milestone updates as we hit key checkpoints. We build in the open \u2014 expect regular demos and feedback sessions.',
                opts: { ctaText: 'Track Progress', ctaLink: 'https://labs.icuni.org/#client' }
            };
        case 'milestone_update':
            var milestone = extras.milestone || 'a key milestone';
            var stepNum = extras.step || '5';
            return {
                subject: 'Milestone Reached \u2014 ' + milestone + ' | ICUNI Labs',
                title: 'Milestone Update',
                body:
                    'Your project has reached <strong style="color:#00bfff;">' + milestone + '</strong> (Step ' + stepNum + '/10).<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#00bfff;font-size:13px;letter-spacing:2px;margin-bottom:8px;">PROGRESS</div>' +
                    '<div style="height:8px;background:#2a2a4a;border-radius:4px;overflow:hidden;margin:8px 0;">' +
                    '<div style="height:100%;width:' + (parseInt(stepNum) * 10) + '%;background:linear-gradient(90deg,#00bfff,#8b5cf6);border-radius:4px;"></div></div>' +
                    '<div style="color:#94a3b8;font-size:12px;text-align:center;">' + (parseInt(stepNum) * 10) + '% Complete</div>' +
                    '</div>' +
                    (extras.details || 'Everything is progressing smoothly. We\u2019ll notify you at the next checkpoint.'),
                opts: { ctaText: 'View Full Update', ctaLink: 'https://labs.icuni.org/#client' }
            };
        case 'invoice_reminder':
            var invId = extras.invoiceId || 'INV-XXX';
            var amount = extras.amount || '0';
            var dueDate = extras.dueDate || 'soon';
            return {
                subject: 'Payment Reminder \u2014 ' + invId + ' | ICUNI Labs',
                title: 'Friendly Payment Reminder',
                body:
                    'This is a friendly reminder that invoice <strong style="color:#ff7a00;">' + invId + '</strong> is due.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #4a3a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<table style="width:100%;border-collapse:collapse;">' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Invoice</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#ff7a00;font-size:15px;font-weight:700;text-align:right;">' + invId + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#94a3b8;font-size:14px;">Amount</td>' +
                    '<td style="padding:8px 12px;border-bottom:1px solid #2a2a4a;color:#e8ecf4;font-size:18px;font-weight:700;text-align:right;">GH\u20B5' + amount + '</td></tr>' +
                    '<tr><td style="padding:8px 12px;color:#94a3b8;font-size:14px;">Due Date</td>' +
                    '<td style="padding:8px 12px;color:#e8ecf4;font-size:15px;font-weight:600;text-align:right;">' + dueDate + '</td></tr>' +
                    '</table></div>' +
                    'If you\u2019ve already made this payment, please disregard this message. Otherwise, please process at your earliest convenience.<br><br>' +
                    'If you have any questions about the invoice, simply reply to this email.',
                opts: { ctaText: 'View Invoice', ctaLink: 'https://labs.icuni.org/#client' }
            };
        case 'review_request':
            var projName2 = extras.projectName || 'your project';
            var demoLink = extras.demoLink || 'https://labs.icuni.org';
            return {
                subject: 'Demo Ready for Review \u2014 ' + projName2 + ' | ICUNI Labs',
                title: 'Your Demo is Ready',
                body:
                    '<div style="text-align:center;margin-bottom:16px;">' +
                    '<span style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#a78bfa);color:#fff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">REVIEW REQUESTED</span>' +
                    '</div>' +
                    'A new build of <strong>' + projName2 + '</strong> is ready for your review and feedback.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #3a2a5a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#8b5cf6;font-size:13px;letter-spacing:2px;margin-bottom:10px;">WHAT WE NEED FROM YOU</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:2;">' +
                    '1. Click the link below to view the latest build<br>' +
                    '2. Test the features and user flow<br>' +
                    '3. Reply to this email with your feedback and any revision requests' +
                    '</div></div>' +
                    'Your input is critical to making this project perfect. We aim to incorporate feedback within 24\u201348 hours.',
                opts: { ctaText: 'View Demo', ctaLink: demoLink }
            };
        case 'thank_you':
            return {
                subject: 'Thank You \u2014 ICUNI Labs',
                title: 'Thank You for Choosing ICUNI Labs',
                body:
                    'It\u2019s been a genuine pleasure working with you. We\u2019re proud of what we\u2019ve built together, ' +
                    'and we hope it delivers real value for your business.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a4a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#10b981;font-size:13px;letter-spacing:2px;margin-bottom:10px;">ONGOING SUPPORT</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    'Your project is complete, but we\u2019re not going anywhere. We offer:<br>' +
                    '\u2022 30-day post-launch support included<br>' +
                    '\u2022 Priority access for future projects<br>' +
                    '\u2022 Retainer packages for ongoing maintenance' +
                    '</div></div>' +
                    'If you know anyone who could benefit from what we do, we\u2019d love an introduction. ' +
                    'Every referral that converts earns you (or your nominee) a bonus.<br><br>' +
                    'Thank you for trusting us with your vision.',
                opts: { ctaText: 'Refer a Friend', ctaLink: 'https://labs.icuni.org/#referral' }
            };
        case 'follow_up':
            var daysSince = extras.daysSince || 'a while';
            return {
                subject: 'Just Checking In | ICUNI Labs',
                title: 'Checking In',
                body:
                    'It\u2019s been ' + daysSince + ' since we last connected, and we wanted to reach out.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:1.8;">' +
                    'We\u2019re here if you need anything \u2014 whether it\u2019s a quick question, a new feature, ' +
                    'or an entirely new project. Our team is always ready to help.' +
                    '</div></div>' +
                    'Simply reply to this email to get the conversation started.',
                opts: { ctaText: 'Let\u2019s Talk', ctaLink: 'https://labs.icuni.org' }
            };
        case 'upsell':
            var offerTitle = extras.offerTitle || 'an expanded scope';
            var offerDesc = extras.offerDescription || 'We\u2019ve identified opportunities to expand your current project.';
            return {
                subject: 'Growth Opportunity \u2014 ' + offerTitle + ' | ICUNI Labs',
                title: 'A Growth Opportunity',
                body:
                    'Based on the success of our work together, we\u2019ve identified an opportunity to take things further.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #4a3a2a;border-radius:10px;padding:20px;margin:12px 0;">' +
                    '<div style="color:#ff7a00;font-size:13px;letter-spacing:2px;margin-bottom:10px;">OPPORTUNITY</div>' +
                    '<div style="color:#e8ecf4;font-size:16px;font-weight:600;margin-bottom:6px;">' + offerTitle + '</div>' +
                    '<div style="color:#94a3b8;font-size:14px;line-height:1.6;">' + offerDesc + '</div>' +
                    '</div>' +
                    'Interested? Reply to this email or schedule a call and we\u2019ll walk you through the details.',
                opts: { ctaText: 'Learn More', ctaLink: 'https://labs.icuni.org' }
            };
        case 'check_in':
            return {
                subject: 'How\u2019s Everything Going? | ICUNI Labs',
                title: 'Quick Check-In',
                body:
                    'We like to periodically check in with our clients to make sure everything is running smoothly.<br><br>' +
                    '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin:12px 0;">' +
                    '<div style="color:#00bfff;font-size:13px;letter-spacing:2px;margin-bottom:8px;">QUICK QUESTIONS</div>' +
                    '<div style="color:#e8ecf4;font-size:14px;line-height:2;">' +
                    '\u2022 Is your product/service performing as expected?<br>' +
                    '\u2022 Have you encountered any issues we should know about?<br>' +
                    '\u2022 Are there new features or improvements you\u2019d like to explore?' +
                    '</div></div>' +
                    'Your feedback helps us improve. Simply reply to this email with your thoughts.',
                opts: { ctaText: 'Share Feedback', ctaLink: 'https://labs.icuni.org' }
            };
        case 'custom':
            return {
                subject: extras.subject || 'A Message from ICUNI Labs',
                title: extras.title || 'Hello from ICUNI Labs',
                body: extras.body || 'This is a custom message from our team.',
                opts: extras.ctaLink ? { ctaText: extras.ctaText || 'Visit ICUNI Labs', ctaLink: extras.ctaLink } : { hideCta: true }
            };
        default:
            throw new Error('Unknown client template: ' + template);
    }
}

// ═══════════════════════════════════════════════════════════
// CLIENT CONTACTS MANAGEMENT
// ═══════════════════════════════════════════════════════════

var CONTACT_ROLES = ['receptionist', 'buyer_manager', 'owner', 'front_desk', 'middle_manager', 'mr_cooper', 'other'];

function handleGetContacts(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var contacts = sheetToObjects_(SHEETS.CLIENT_CONTACTS);

    // Filter by client_id if specified
    if (payload.client_id) {
        contacts = contacts.filter(function(c) { return c.client_id === payload.client_id; });
    }

    return successResponse_({ contacts: contacts });
}

function handleAddContact(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.client_id) return errorResponse_('Client ID is required.');
    if (!payload.name) return errorResponse_('Contact name is required.');
    if (!payload.role) return errorResponse_('Contact role is required.');

    var contactId = generateId_('CON');
    var nowStr = now_();

    appendRow_(SHEETS.CLIENT_CONTACTS, [
        contactId, payload.client_id,
        payload.name, payload.role,
        payload.email || '', payload.phone || '',
        payload.whatsapp || '', payload.notes || '',
        payload.is_primary ? 'true' : 'false',
        nowStr, nowStr
    ]);

    // If this contact has an email and the client doesn't, update the client record
    if (payload.email && payload.is_primary) {
        var client = findRow_(SHEETS.CLIENTS, 'client_id', payload.client_id);
        if (client && !client.email) {
            updateRow_(SHEETS.CLIENTS, client._rowIndex, { email: payload.email });
            invalidateSheetCache_(SHEETS.CLIENTS);
        }
    }

    logAction_(auth.user.user_id, auth.user.name, 'CONTACT_ADDED',
        payload.name + ' (' + payload.role + ') → ' + payload.client_id);

    return successResponse_({ contact_id: contactId }, 'Contact added.');
}

function handleUpdateContact(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.contact_id) return errorResponse_('Contact ID is required.');

    var contact = findRow_(SHEETS.CLIENT_CONTACTS, 'contact_id', payload.contact_id);
    if (!contact) return errorResponse_('Contact not found.');

    var updates = { updated_at: now_() };
    ['name', 'role', 'email', 'phone', 'whatsapp', 'notes', 'is_primary'].forEach(function(f) {
        if (payload[f] !== undefined) updates[f] = payload[f];
    });

    updateRow_(SHEETS.CLIENT_CONTACTS, contact._rowIndex, updates);
    invalidateSheetCache_(SHEETS.CLIENT_CONTACTS);

    logAction_(auth.user.user_id, auth.user.name, 'CONTACT_UPDATED', contact.name);

    return successResponse_(null, 'Contact updated.');
}

function handleDeleteContact(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.contact_id) return errorResponse_('Contact ID is required.');

    var contact = findRow_(SHEETS.CLIENT_CONTACTS, 'contact_id', payload.contact_id);
    if (!contact) return errorResponse_('Contact not found.');

    deleteRow_(SHEETS.CLIENT_CONTACTS, contact._rowIndex);

    logAction_(auth.user.user_id, auth.user.name, 'CONTACT_DELETED', contact.name);

    return successResponse_(null, 'Contact deleted.');
}
