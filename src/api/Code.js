/**
 * ICUNI Labs — Main Entry Point & HTTP Router
 * All API calls route through doPost/doGet.
 * Each action is dispatched to the appropriate module handler.
 *
 * Modules: Config, Utils, Auth, Logger, Projects, Invoices, CMS, SLA, Setup
 */

// ═══════════════════════════════════════════════════════════
// HTTP HANDLERS
// ═══════════════════════════════════════════════════════════

function doPost(e) {
    try {
        var payload = JSON.parse(e.postData.contents);
        var action = payload.action;

        // ── Auth ──
        if (action === 'sendOTP')           return handleSendOTP(payload);
        if (action === 'verifyOTP')         return handleVerifyOTP(payload);
        if (action === 'passwordLogin')     return handlePasswordLogin(payload);
        if (action === 'pinLogin')          return handlePinLogin(payload);
        if (action === 'validateSession')   return handleValidateSession(payload);
        if (action === 'validateDevice')    return handleValidateDevice(payload);
        if (action === 'logout')            return handleLogout(payload);
        if (action === 'setPassword')       return handleSetPassword(payload);
        if (action === 'setPin')            return handleSetPin(payload);

        // ── User Management ──
        if (action === 'getUsers')          return handleGetUsers(payload);
        if (action === 'addUser')           return handleAddUser(payload);
        if (action === 'deactivateUser')    return handleDeactivateUser(payload);

        // ── Dashboard ──
        if (action === 'getDashboard')      return handleGetDashboard(payload);

        // ── Clients ──
        if (action === 'getClients')        return handleGetClients(payload);
        if (action === 'addClient')         return handleAddClient(payload);
        if (action === 'updateClient')      return handleUpdateClient(payload);

        // ── Projects ──
        if (action === 'createProject')     return handleCreateProject(payload);
        if (action === 'getProjects')       return handleGetProjects(payload);
        if (action === 'getProject')        return handleGetProject(payload);
        if (action === 'advanceStep')       return handleAdvanceProjectStep(payload);
        if (action === 'requestBuild')      return handleClientRequestBuild(payload);

        // ── Invoices ──
        if (action === 'getInvoices')       return handleGetInvoices(payload);
        if (action === 'getInvoiceHTML')    return handleGetInvoiceHTML(payload);
        if (action === 'recordPayment')     return handleRecordPayment(payload);

        // ── CMS: Pages ──
        if (action === 'getPages')          return handleGetPages(payload);
        if (action === 'createPage')        return handleCreatePage(payload);
        if (action === 'updatePage')        return handleUpdatePage(payload);

        // ── CMS: Menus ──
        if (action === 'getMenus')          return handleGetMenus(payload);
        if (action === 'updateMenu')        return handleUpdateMenu(payload);

        // ── CMS: Settings ──
        if (action === 'getSettings')       return handleGetSettings(payload);
        if (action === 'updateSettings')    return handleUpdateSettings(payload);

        // ── Blog ──
        if (action === 'getBlogPosts')      return handleGetBlogPosts(payload);
        if (action === 'createBlogPost')    return handleCreateBlogPost(payload);
        if (action === 'updateBlogPost')    return handleUpdateBlogPost(payload);
        if (action === 'deleteBlogPost')    return handleDeleteBlogPost(payload);
        if (action === 'getBlogCategories') return handleGetBlogCategories(payload);

        // ── Job Listings ──
        if (action === 'getJobListings')    return handleGetJobListings(payload);
        if (action === 'createJobListing')  return handleCreateJobListing(payload);
        if (action === 'updateJobListing')  return handleUpdateJobListing(payload);

        // ── Portfolio ──
        if (action === 'getPortfolio')      return handleGetPortfolio(payload);
        if (action === 'createPortfolio')   return handleCreatePortfolioProject(payload);
        if (action === 'updatePortfolio')   return handleUpdatePortfolioProject(payload);

        // ── Testimonials ──
        if (action === 'getTestimonials')   return handleGetTestimonials(payload);
        if (action === 'createTestimonial') return handleCreateTestimonial(payload);

        // ── SLA ──
        if (action === 'getSlaStatus')      return handleGetSlaStatus(payload);
        if (action === 'snoozeSla')         return handleSnoozeSla(payload);
        if (action === 'getSlaCosts')       return handleGetSlaCosts(payload);

        // ── Logs ──
        if (action === 'getLogs')           return handleGetLogs(payload);
        if (action === 'getArchives')       return handleGetArchives(payload);

        // ── Referrals (legacy — matches frontend action names) ──
        if (action === 'submit_referral' || action === 'submitReferral')    return handleSubmitReferral(payload);
        if (action === 'referrer_signup' || action === 'registerReferrer')  return handleRegisterReferrer(payload);
        if (action === 'referrer_login' || action === 'loginReferrer')     return handleLoginReferrer(payload);
        if (action === 'referrer_verify_otp' || action === 'verifyReferrerOtp') return handleVerifyReferrerOtp(payload);
        if (action === 'get_dashboard' || action === 'getDashboardData')   return handleGetReferrerDashboard(payload);
        if (action === 'updateReferralStatus') return handleUpdateReferralStatus(payload);

        // ── Job Applications (legacy — matches frontend action names) ──
        if (action === 'job_application' || action === 'submitJobApplication') return handleJobApplicationLegacy(payload);
        if (action === 'job_qualification') return handleJobQualificationLegacy(payload);

        return errorResponse_('Unknown action: ' + action, 400);

    } catch (err) {
        Logger.log('doPost ERROR: ' + err.message + '\n' + (err.stack || ''));
        try { logError_('doPost', err.message); } catch(e) {}
        if (isExpectedError_(err.message)) {
            return errorResponse_(err.message);
        }
        return errorResponse_('Something went wrong. Please try again.');
    }
}

function doGet(e) {
    var params = e.parameter || {};
    var action = params.action;

    // Public read endpoints (no auth required)
    if (action === 'getPortfolio')      return handleGetPortfolio({});
    if (action === 'getBlogPosts')      return handleGetBlogPosts({});
    if (action === 'getJobListings')    return handleGetJobListings({});
    if (action === 'getTestimonials')   return handleGetTestimonials({});
    if (action === 'getSettings')       return handleGetSettings({});

    return jsonResponse_(200, 'ICUNI Labs API v2 — Active', {
        version: '2.0.0',
        endpoints: 'POST with { action: "..." } payload',
        timestamp: now_()
    });
}

// ═══════════════════════════════════════════════════════════
// LEGACY HANDLERS — Keep existing functionality working
// ═══════════════════════════════════════════════════════════

/**
 * Legacy job application handler — bridges old frontend to new system.
 * Saves to new Content & Jobs spreadsheet.
 */
function handleJobApplicationLegacy(payload) {
    try {
        var appId = generateId_('APP');
        var jobTitle = payload.jobTitle || payload.job_title || 'Operations Assistant';
        var name = payload.fullName || payload.name || '';
        var email = payload.email || '';
        var phone = payload.phone || '';
        var note = payload.note || payload.coverNote || '';

        // Save files to Drive
        var cvLink = '', audioLink = '', videoLink = '';
        var applicantFolder = null;

        if (payload.cvBase64 || payload.audioBase64 || payload.videoBase64) {
            var jobsFolder = getDriveSubfolder_(DRIVE_FOLDERS.JOBS);
            var appsFolder = getOrCreateFolder_(jobsFolder, DRIVE_FOLDERS.APPLICATIONS);
            var folderName = name + ' — ' + Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyy-MM-dd');
            applicantFolder = getOrCreateFolder_(appsFolder, folderName);
        }

        if (payload.cvBase64 && applicantFolder) {
            cvLink = saveBase64File_(applicantFolder, payload.cvBase64, payload.cvName || payload.cvFileName || 'CV.pdf');
        }
        if (payload.audioBase64 && applicantFolder) {
            audioLink = saveBase64File_(applicantFolder, payload.audioBase64, payload.audioName || payload.audioFileName || 'voice-intro.webm');
        }
        if (payload.videoBase64 && applicantFolder) {
            videoLink = saveBase64File_(applicantFolder, payload.videoBase64, payload.videoName || payload.videoFileName || 'video-intro.webm');
        }

        appendRow_(SHEETS.JOB_APPLICATIONS, [
            appId, payload.jobId || 'ops-assistant-001', jobTitle,
            name, email, phone, note,
            cvLink ? 'Yes' : 'No', audioLink ? 'Yes' : 'No', videoLink ? 'Yes' : 'No',
            cvLink, audioLink, videoLink,
            'received', now_()
        ]);

        // Send confirmation email to applicant
        try {
            MailApp.sendEmail({
                to: email,
                subject: 'Application Received — ICUNI Labs',
                htmlBody: buildApplicationConfirmEmail_(name, jobTitle)
            });
            logEmail_(email, 'Application Confirmation', 'application', 'sent');
        } catch(e) { logEmail_(email, 'Application Confirmation', 'application', 'failed'); }

        // Notify jobs inbox
        try {
            MailApp.sendEmail({
                to: JOBS_EMAIL,
                subject: 'New Application — ' + name + ' for ' + jobTitle,
                htmlBody: buildProjectStepEmail_('Team',
                    'New Job Application',
                    '<strong>' + name + '</strong> (' + email + ') applied for <strong>' + jobTitle + '</strong>.<br><br>' +
                    'Phone: ' + phone + '<br>' +
                    'CV: ' + (cvLink ? '<a href="' + cvLink + '">Download</a>' : 'None') + '<br>' +
                    'Voice Intro: ' + (audioLink ? '<a href="' + audioLink + '">Listen</a>' : 'None'))
            });
        } catch(e) {}

        logAction_('PUBLIC', name, 'JOB_APPLICATION', 'Applied for ' + jobTitle);

        return successResponse_({ applicationId: appId }, 'Application submitted! Check your email for confirmation.');

    } catch (err) {
        Logger.log('Job application error: ' + err.message);
        return errorResponse_('Failed to submit application: ' + err.message);
    }
}

/**
 * Legacy qualification flow handler — saves questionnaire answers.
 */
function handleJobQualificationLegacy(payload) {
    try {
        var qualId = generateId_('QAL');
        var email = payload.email || '';
        var jobId = payload.jobId || '';
        var jobTitle = payload.jobTitle || '';
        
        // Extract answers (everything except action, email, jobId, jobTitle)
        var answers = {};
        var skip = ['action', 'email', 'jobId', 'jobTitle'];
        for (var key in payload) {
            if (skip.indexOf(key) === -1 && payload.hasOwnProperty(key)) {
                answers[key] = payload[key];
            }
        }
        
        appendRow_(SHEETS.JOB_QUALIFICATIONS, [
            qualId, '', jobId, email,
            JSON.stringify(answers), now_()
        ]);
        
        // Link to application if possible
        var app = findRow_(SHEETS.JOB_APPLICATIONS, 'email', email);
        if (app) {
            updateRow_(SHEETS.JOB_QUALIFICATIONS, 
                findRow_(SHEETS.JOB_QUALIFICATIONS, 'qual_id', qualId)._rowIndex,
                { application_id: app.application_id }
            );
        }
        
        // Human-readable label mapping
        var LABELS = {
            salaryOk:        'Salary Range Acceptance (GH\u20B52,500 \u2013 GH\u20B52,950)',
            fullTimeOk:      'Full-Time Availability (Mon\u2013Fri)',
            asapOk:          'Available to Start ASAP',
            selfView:        'How Others See You',
            deadlines:       'How You Handle Tight Deadlines',
            googleSuite:     'Google Workspace Experience (1\u20135)',
            coldCalling:     'Cold Calling Confidence (1\u20135)',
            hasLaptop:       'Has a Working Laptop',
            phoneSpecs:      'Smartphone Model',
            secureWorkspace: 'Has a Secure, Distraction-Free Workspace',
            fieldSalesOk:    'Happy to Join Founder for Sales & Events',
            accraArea:       'General Area in Accra',
            otherCommitments:'Other Commitments Alongside Role',
            currentJob:      'Current Employment Status',
            paymentMethod:   'Preferred Payment Method'
        };
        
        // Build formatted summary rows
        var summaryRows = Object.keys(answers).map(function(k) {
            var label = LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, function(c) { return c.toUpperCase(); });
            var val = answers[k];
            // Scale values get a visual bar
            if ((k === 'googleSuite' || k === 'coldCalling') && !isNaN(Number(val))) {
                var n = Number(val);
                var filled = '';
                var empty = '';
                for (var i = 0; i < 5; i++) { if (i < n) filled += '\u2B24 '; else empty += '\u25CB '; }
                val = filled + empty + '(' + n + '/5)';
            }
            return '<tr><td style="padding:8px 12px;color:#8b95a8;font-size:13px;border-bottom:1px solid #1a2040;width:45%;">' + label + '</td>' +
                   '<td style="padding:8px 12px;color:#e8ecf4;font-size:13px;font-weight:600;border-bottom:1px solid #1a2040;">' + val + '</td></tr>';
        }).join('');
        
        var summaryTable = '<table style="width:100%;border-collapse:collapse;margin:16px 0;background:#0f1424;border:1px solid #1a2040;border-radius:8px;overflow:hidden;">' +
            '<tr style="background:#1a1a2e;"><th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;letter-spacing:1px;">QUESTION</th>' +
            '<th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;letter-spacing:1px;">YOUR ANSWER</th></tr>' +
            summaryRows + '</table>';
        
        // Send confirmation email to applicant
        try {
            MailApp.sendEmail({
                to: email,
                subject: 'Application Complete — ICUNI Labs',
                htmlBody: buildBrandedEmail_(payload.name || email.split('@')[0],
                    'Application Complete',
                    'You\'ve successfully completed your application for <strong>' + jobTitle + '</strong> at ICUNI Labs.<br><br>' +
                    'Our team will review everything and get back to you within <strong>48 hours</strong>.<br><br>' +
                    '<div style="font-size:12px;color:#64748b;letter-spacing:2px;margin-bottom:4px;">YOUR QUESTIONNAIRE RESPONSES</div>' +
                    summaryTable)
            });
            logEmail_(email, 'Application Complete', 'qualification', 'sent');
        } catch(e) { logEmail_(email, 'Application Complete', 'qualification', 'failed'); }
        
        // Notify jobs@icuni.org
        try {
            MailApp.sendEmail({
                to: JOBS_EMAIL,
                subject: 'Qualification Complete — ' + (app ? app.name || email : email) + ' for ' + jobTitle,
                htmlBody: buildBrandedEmail_('Team',
                    'Applicant Qualification Complete',
                    '<strong>' + (app ? app.name || email : email) + '</strong> has completed the qualification questionnaire for <strong>' + jobTitle + '</strong>.<br><br>' +
                    summaryTable +
                    '<br>Review the full application in the <a href="https://docs.google.com/spreadsheets/d/' + getProp_(PROP_KEYS.SS_CONTENT) + '" style="color:#ff7a00;">Content & Jobs spreadsheet</a>.')
            });
        } catch(e) { Logger.log('Jobs notification failed: ' + e.message); }
        
        logAction_('PUBLIC', email, 'JOB_QUALIFICATION', 'Completed qualification for ' + jobTitle);
        return successResponse_({ qualId: qualId }, 'Qualification submitted.');
        
    } catch(err) {
        Logger.log('Qualification error: ' + err.message);
        return errorResponse_('Failed to submit qualification.');
    }
}


function saveBase64File_(folder, base64Data, fileName) {
    try {
        var parts = base64Data.split(',');
        var raw = parts.length > 1 ? parts[1] : parts[0];
        var mimeMatch = base64Data.match(/^data:([^;]+);/);
        var mime = mimeMatch ? mimeMatch[1] : guessMime_(fileName);
        var blob = Utilities.newBlob(Utilities.base64Decode(raw), mime, fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return file.getUrl();
    } catch(e) {
        Logger.log('File save failed: ' + e.message);
        return '';
    }
}

function buildApplicationConfirmEmail_(name, jobTitle) {
    return buildBrandedEmail_(name,
        'Application Received',
        'Thank you for applying for the <strong>' + jobTitle + '</strong> position at ICUNI Labs!<br><br>' +
        'We\'ve received your application and our team will review it carefully. ' +
        'You can expect to hear from us within <strong>48 hours</strong>.<br><br>' +
        'In the meantime, feel free to explore our work at <a href="https://labs.icuni.org" style="color:#ff7a00;">labs.icuni.org</a>.',
        { ctaText: 'Explore Our Work', ctaLink: 'https://labs.icuni.org' });
}

// ═══════════════════════════════════════════════════════════
// LEGACY REFERRAL HANDLERS — Keep existing functionality
// ═══════════════════════════════════════════════════════════

function handleSubmitReferral(payload) {
    var referrer = findRow_(SHEETS.REFERRERS, 'referrer_id', payload.referrerId);
    if (!referrer) return errorResponse_('Referrer not found.');
    
    var referralId = generateId_('REF');
    appendRow_(SHEETS.REFERRALS, [
        referralId, payload.referrerId, payload.clientName, payload.clientEmail,
        payload.clientPhone || '', payload.businessType || '', payload.notes || '',
        'New', '', 0, 'pending', now_(), now_()
    ]);
    
    logAction_(payload.referrerId, referrer.name, 'REFERRAL_SUBMITTED', payload.clientName);
    return successResponse_({ referralId: referralId }, 'Referral submitted.');
}

function handleRegisterReferrer(payload) {
    validateInput_(payload, {
        name: { required: true, label: 'Name' },
        email: { required: true, type: 'email', label: 'Email' }
    });
    
    var existing = findRow_(SHEETS.REFERRERS, 'email', payload.email);
    if (existing) return errorResponse_('Email already registered.');
    
    var referrerId = generateId_('RFR');
    appendRow_(SHEETS.REFERRERS, [
        referrerId, payload.name, payload.email, payload.phone || '',
        payload.background || '', payload.payoutPreference || 'MoMo',
        'Active', 0, now_(), now_()
    ]);
    
    // Create user account
    try {
        handleAddUser({
            token: payload.adminToken || '',
            name: payload.name, email: payload.email,
            phone: payload.phone || '', role: ROLES.REFERRER
        });
    } catch(e) { /* May fail if no admin token — that's ok for self-registration */ }
    
    logAction_('PUBLIC', payload.name, 'REFERRER_REGISTERED', payload.email);
    return successResponse_({ referrerId: referrerId }, 'Registration successful.');
}

function handleLoginReferrer(payload) {
    return handleSendOTP({ email: payload.email, identifier: payload.email });
}

function handleVerifyReferrerOtp(payload) {
    return handleVerifyOTP({ email: payload.email, identifier: payload.email, otp: payload.otp });
}

function handleGetReferrerDashboard(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    
    var referrer = findRow_(SHEETS.REFERRERS, 'email', auth.user.email);
    if (!referrer) return errorResponse_('Referrer record not found.');
    
    var referrals = sheetToObjects_(SHEETS.REFERRALS).filter(function(r) {
        return r.referrer_id === referrer.referrer_id;
    });
    
    var totalEarned = referrals.filter(function(r) { return r.payout_status === 'confirmed' || r.payout_status === 'paid'; })
        .reduce(function(sum, r) { return sum + Number(r.payout_amount || 0); }, 0);
    
    return successResponse_({
        referrer: { name: referrer.name, email: referrer.email, status: referrer.status },
        referrals: referrals,
        stats: {
            total: referrals.length,
            active: referrals.filter(function(r) { return r.status === 'New' || r.status === 'In Progress'; }).length,
            closed: referrals.filter(function(r) { return r.status === 'Closed Won'; }).length,
            totalEarned: totalEarned
        }
    });
}

function handleUpdateReferralStatus(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var referral = findRow_(SHEETS.REFERRALS, 'referral_id', payload.referralId);
    if (!referral) return errorResponse_('Referral not found.');
    updateRow_(SHEETS.REFERRALS, referral._rowIndex, {
        status: payload.status, updated_at: now_()
    });
    logAction_(auth.user.user_id, auth.user.name, 'REFERRAL_UPDATED', referral.client_name + ' → ' + payload.status);
    return successResponse_(null, 'Referral status updated.');
}
