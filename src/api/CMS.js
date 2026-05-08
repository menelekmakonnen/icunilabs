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
        payload.salary_range || '', payload.short_desc || '',
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
