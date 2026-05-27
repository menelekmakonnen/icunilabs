/**
 * ICUNI Labs — Main Entry Point & HTTP Router
 * All API calls route through doPost/doGet.
 * Each action is dispatched to the appropriate module handler.
 *
 * Modules: Config, Utils, Auth, Logger, Projects, Invoices, CMS, SLA, Setup
 */

// ═══════════════════════════════════════════════════════════
// ACTION → HANDLER MAP  (grouped by domain)
// ═══════════════════════════════════════════════════════════

var ACTION_MAP = {
    // ── Auth ──
    sendOTP: handleSendOTP, verifyOTP: handleVerifyOTP,
    passwordLogin: handlePasswordLogin, pinLogin: handlePinLogin,
    validateSession: handleValidateSession, validateDevice: handleValidateDevice,
    logout: handleLogout, setPassword: handleSetPassword, setPin: handleSetPin,
    getProfile: handleGetProfile, updateProfile: handleUpdateProfile,
    uploadProfileImage: handleUploadProfileImage,

    // ── User Management ──
    getUsers: handleGetUsers, addUser: handleAddUser,
    deactivateUser: handleDeactivateUser, createAdmin: handleCreateAdmin,
    editUser: handleEditUser, updateUserPermissions: handleUpdateUserPermissions,
    getUserPermissions: handleGetUserPermissions, runMigration: handleRunMigration,

    // ── Impersonation ──
    impersonateUser: handleImpersonateUser, endImpersonation: handleEndImpersonation,

    // ── ICUNI Project Registry ──
    getProjectRegistry: handleGetProjectRegistry, updateProjectFeature: handleUpdateProjectFeature,
    addProject: handleAddProject, removeProject: handleRemoveProject,

    // ── Email Hub ──
    getInbox: handleGetInbox, getThread: handleGetThread,
    replyToThread: handleReplyToThread, sendBrandedEmail: handleSendBrandedEmail,
    getEmailAliases: handleGetEmailAliases, updateEmailAlias: handleUpdateEmailAlias,
    deleteEmailAlias: handleDeleteEmailAlias, getEmailTemplates: handleGetEmailTemplates,
    saveEmailTemplate: handleSaveEmailTemplate, previewBrandedEmail: handlePreviewBrandedEmail,
    assignMailbox: handleAssignMailbox, removeMailbox: handleRemoveMailbox,
    getUserMailboxes: handleGetUserMailboxes,
    importEmailAsApplication: handleImportEmailAsApplication,

    // ── Dashboard ──
    getDashboard: handleGetDashboard,

    // ── Clients ──
    getClients: handleGetClients, getClient: handleGetClient,
    addClient: handleAddClient, updateClient: handleUpdateClient,
    deleteClient: handleDeleteClient, addHistoricProject: handleAddHistoricProject,
    getClientActivity: handleGetClientActivity, addClientNote: handleAddClientNote,
    updateClientTags: handleUpdateClientTags, updateClientStatus: handleUpdateClientStatus,
    sendClientEmail: handleSendClientEmail, previewClientEmail: handlePreviewClientEmail,

    // ── Link Extraction ──
    extractFromUrl: handleExtractFromUrl, checkDuplicate: handleCheckDuplicate,
    bulkSearch: handleBulkSearch,

    // ── Call Logs ──
    saveCallLog: handleSaveCallLog, getCallLogs: handleGetCallLogs,
    getCallAnalytics: handleGetCallAnalytics, getCompetitorIntel: handleGetCompetitorIntel,

    // ── Projects ──
    createProject: handleCreateProject, getProjects: handleGetProjects,
    getProject: handleGetProject, advanceStep: handleAdvanceProjectStep,
    requestBuild: handleClientRequestBuild,

    // ── Invoices ──
    getInvoices: handleGetInvoices, getInvoiceHTML: handleGetInvoiceHTML,
    recordPayment: handleRecordPayment,

    // ── CMS ──
    getPages: handleGetPages, createPage: handleCreatePage, updatePage: handleUpdatePage,
    getMenus: handleGetMenus, updateMenu: handleUpdateMenu,
    getSettings: handleGetSettings, updateSettings: handleUpdateSettings,

    // ── Blog ──
    getBlogPosts: handleGetBlogPosts, createBlogPost: handleCreateBlogPost,
    updateBlogPost: handleUpdateBlogPost, deleteBlogPost: handleDeleteBlogPost,
    getBlogCategories: handleGetBlogCategories,

    // ── Job Listings ──
    getJobListings: handleGetJobListings, createJobListing: handleCreateJobListing,
    updateJobListing: handleUpdateJobListing,

    // ── Portfolio ──
    getPortfolio: handleGetPortfolio, createPortfolio: handleCreatePortfolioProject,
    updatePortfolio: handleUpdatePortfolioProject,

    // ── Testimonials ──
    getTestimonials: handleGetTestimonials, createTestimonial: handleCreateTestimonial,

    // ── SLA ──
    getSlaStatus: handleGetSlaStatus, snoozeSla: handleSnoozeSla,
    getSlaCosts: handleGetSlaCosts,

    // ── Logs ──
    getLogs: handleGetLogs, getArchives: handleGetArchives,

    // ── Referrals (legacy aliases + new names) ──
    submit_referral: handleSubmitReferral, submitReferral: handleSubmitReferral,
    referrer_signup: handleRegisterReferrer, registerReferrer: handleRegisterReferrer,
    referrer_login: handleLoginReferrer, loginReferrer: handleLoginReferrer,
    referrer_verify_otp: handleVerifyReferrerOtp, verifyReferrerOtp: handleVerifyReferrerOtp,
    get_dashboard: handleGetReferrerDashboard, getDashboardData: handleGetReferrerDashboard,
    updateReferralStatus: handleUpdateReferralStatus,

    // ── Job Applications (legacy + admin) ──
    job_application: handleJobApplicationLegacy, submitJobApplication: handleJobApplicationLegacy,
    job_qualification: handleJobQualificationLegacy,
    getJobApplications: handleGetJobApplications, getJobQualifications: handleGetJobQualifications,
    sendApplicantEmail: handleSendApplicantEmail, previewApplicantEmail: handlePreviewApplicantEmail,
    deleteApplication: handleDeleteApplication, createApplication: handleCreateApplication,

    // ── Referrals (admin) ──
    getReferrers: handleGetReferrers, getReferrals: handleGetReferrals,
    sendReferrerEmail: handleSendReferrerEmail, previewReferrerEmail: handlePreviewReferrerEmail,
    advanceReferralStage: handleAdvanceReferralStage, closeReferral: handleCloseReferral,
    confirmReferralPayout: handleConfirmReferralPayout,

    // ── Referrer Materials ──
    getReferrerMaterials: handleGetReferrerMaterials, createReferrerMaterial: handleCreateReferrerMaterial,
    updateReferrerMaterial: handleUpdateReferrerMaterial, deleteReferrerMaterial: handleDeleteReferrerMaterial,

    // ── Referrer Notifications ──
    sendReferrerNotification: handleSendReferrerNotification, getReferrerNotifications: handleGetReferrerNotifications,

    // ── Bug Reports ──
    report_bug: handleBugReport, reportBug: handleBugReport,

    // ── Orbit Interconnection ──
    syncOrbitData: handleSyncOrbitData, getOrbitStatus: handleGetOrbitStatus,

    // ── Telemetry ──
    telemetryReport: handleTelemetryReport, telemetryGet: handleTelemetryGet,

    // ── Staff/Invoice/Deployment API (Orbit Pull) ──
    staffList: handleStaffList, invoicesList: handleInvoicesList,
    deploymentsList: handleDeploymentsList, staffSync: handleStaffSync,

    // ── Analytics ──
    trackEvent: handleTrackEvent, getAnalytics: handleGetAnalytics,
};

// ═══════════════════════════════════════════════════════════
// HTTP HANDLERS
// ═══════════════════════════════════════════════════════════

function doPost(e) {
    try {
        var payload = JSON.parse(e.postData.contents);
        var action = payload.action;
        var handler = ACTION_MAP[action];

        if (!handler) return errorResponse_('Unknown action: ' + action, 400);
        return handler(payload);

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
            sendEmail_({
                to: email,
                subject: 'Application Received — ICUNI Labs',
                htmlBody: buildApplicationConfirmEmail_(name, jobTitle),
                from: 'jobs@icuni.org'
            });
            logEmail_(email, 'Application Confirmation', 'application', 'sent');
        } catch(e) { logEmail_(email, 'Application Confirmation', 'application', 'failed'); }

        // Notify jobs inbox
        try {
            sendEmail_({
                to: JOBS_EMAIL,
                subject: 'New Application — ' + name + ' for ' + jobTitle,
                htmlBody: buildProjectStepEmail_('Team',
                    'New Job Application',
                    '<strong>' + name + '</strong> (' + email + ') applied for <strong>' + jobTitle + '</strong>.<br><br>' +
                    'Phone: ' + phone + '<br>' +
                    'CV: ' + (cvLink ? '<a href="' + cvLink + '">Download</a>' : 'None') + '<br>' +
                    'Voice Intro: ' + (audioLink ? '<a href="' + audioLink + '">Listen</a>' : 'None')),
                from: 'jobs@icuni.org'
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
            // Shared
            salaryOk:        'Salary Range Acceptance',
            fullTimeOk:      'Full-Time Availability (Mon\u2013Fri)',
            asapOk:          'Available to Start ASAP',
            phoneNumber:     'Phone Number',
            whatsappOk:      'WhatsApp on This Number',
            hasLaptop:       'Has a Working Laptop',
            phoneSpecs:      'Smartphone Model',
            accraArea:       'General Area in Accra',
            otherCommitments:'Other Commitments Alongside Role',
            currentJob:      'Current Employment Status',
            paymentMethod:   'Preferred Payment Method',
            // Ops Assistant
            selfView:        'How Others See You',
            deadlines:       'How You Handle Tight Deadlines',
            googleSuite:     'Google Workspace Experience (1\u20135)',
            coldCalling:     'Cold Calling Confidence (1\u20135)',
            secureWorkspace: 'Has a Secure, Distraction-Free Workspace',
            fieldSalesOk:    'Happy to Join Founder for Sales & Events',
            // Growth Associate
            salesExp:        'Previous Sales Experience',
            firstMove:       'First Move to Reach a Decision-Maker',
            gatekeeperPlay:  'Receptionist Says "Call Back Later"',
            followUpCount:   'Follow-Up Persistence on Warm Leads',
            walkInComfort:   'Walk-In Cold Visit Confidence (1\u20135)',
            phonePitch:      'Phone Pitch Confidence (1\u20135)',
            hasTransport:    'Has Reliable Transportation in Accra',
        };
        
        // Build formatted summary rows
        var summaryRows = Object.keys(answers).map(function(k) {
            var label = LABELS[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, function(c) { return c.toUpperCase(); });
            var val = answers[k];
            // Scale values get a visual bar
            var scaleKeys = ['googleSuite', 'coldCalling', 'walkInComfort', 'phonePitch'];
            if (scaleKeys.indexOf(k) >= 0 && !isNaN(Number(val))) {
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
            sendEmail_({
                to: email,
                subject: 'Application Complete — ICUNI Labs',
                htmlBody: buildBrandedEmail_(payload.name || email.split('@')[0],
                    'Application Complete',
                    'You\'ve successfully completed your application for <strong>' + jobTitle + '</strong> at ICUNI Labs.<br><br>' +
                    'Our team will review everything and get back to you within <strong>48 hours</strong>.<br><br>' +
                    '<div style="font-size:12px;color:#64748b;letter-spacing:2px;margin-bottom:4px;">YOUR QUESTIONNAIRE RESPONSES</div>' +
                    summaryTable),
                from: 'jobs@icuni.org'
            });
            logEmail_(email, 'Application Complete', 'qualification', 'sent');
        } catch(e) { logEmail_(email, 'Application Complete', 'qualification', 'failed'); }
        
        // Notify jobs@icuni.org
        try {
            sendEmail_({
                to: JOBS_EMAIL,
                subject: 'Qualification Complete — ' + (app ? app.name || email : email) + ' for ' + jobTitle,
                htmlBody: buildBrandedEmail_('Team',
                    'Applicant Qualification Complete',
                    '<strong>' + (app ? app.name || email : email) + '</strong> has completed the qualification questionnaire for <strong>' + jobTitle + '</strong>.<br><br>' +
                    summaryTable +
                    '<br>Review the full application in the <a href="https://docs.google.com/spreadsheets/d/' + getProp_(PROP_KEYS.SS_CONTENT) + '" style="color:#ff7a00;">Content & Jobs spreadsheet</a>.'),
                from: 'jobs@icuni.org'
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

// ═══════════════════════════════════════════════════════════
// BUG REPORT HANDLER
// ═══════════════════════════════════════════════════════════

function handleBugReport(payload) {
    var TECH_EMAIL = 'tech.issue@icuni.org';
    
    // Try to identify user from token
    var userName = 'Unknown';
    var userEmail = 'Unknown';
    if (payload.token) {
        var session = validateSession_(payload.token);
        if (session) { userName = session.name; userEmail = session.email; }
    }
    
    var projectTitle = payload.projectTitle || payload.projectId || 'General';
    var category = payload.category || 'Unspecified';
    var description = payload.description || 'No description provided.';
    
    var body = '<strong>Project:</strong> ' + projectTitle + '<br>' +
        '<strong>Category:</strong> ' + category + '<br>' +
        '<strong>Reported by:</strong> ' + userName + ' (' + userEmail + ')<br>' +
        '<strong>Time:</strong> ' + now_() + '<br><br>' +
        '<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:8px;padding:16px;margin-top:8px;">' +
        '<div style="font-size:11px;color:#64748b;letter-spacing:2px;margin-bottom:6px;">DESCRIPTION</div>' +
        '<div style="color:#e8ecf4;font-size:14px;line-height:1.6;white-space:pre-wrap;">' + description + '</div>' +
        '</div>';
    
    try {
        sendEmail_({
            to: TECH_EMAIL,
            subject: '[Bug Report] ' + category + ' — ' + projectTitle,
            htmlBody: buildBrandedEmail_('Tech Team', 'New Bug Report', body, { ctaText: 'View Dashboard', ctaLink: 'https://labs.icuni.org' }),
            from: 'tech.issue@icuni.org'
        });
    } catch(e) {
        Logger.log('Bug report email failed: ' + e.message);
    }
    
    logAction_(userName, userName, 'BUG_REPORT', category + ' — ' + projectTitle);
    return successResponse_(null, 'Bug report submitted. Our team has been notified.');
}
