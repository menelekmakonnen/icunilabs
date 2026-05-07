/**
 * ICUNI Lean Systems Framework (ILSF) - Core Engine
 * 
 * Handles incoming POST requests from the ICUNI Labs website intake form.
 * Validates data, calculates lead score, routing, and writes to Google Sheets.
 * 
 * --- REFERRAL ENGINE ---
 * Also handles referral partner signup, referral submission, dashboard data,
 * and admin status updates for the referral program.
 */

// Configuration
const CONFIG = {
    SHEET_NAME_LEADS: 'Leads',
    SHEET_NAME_REFERRERS: 'Referrers',
    SHEET_NAME_REFERRALS: 'Referrals',
    SHEET_NAME_OTP: 'OTP_Sessions',
    SHEET_NAME_JOBS: 'Job_Applications',
    ADMIN_EMAIL: 'labs@icuni.org',
    SCORE_THRESHOLDS: {
        HIGH: 80,
        MED: 50
    },
    PAYOUT: {
        FLAT_RATE: 1000,
        PERCENTAGE: 0.10
    },
    OTP: {
        LENGTH: 6,
        EXPIRY_MINUTES: 10,
        MAX_ATTEMPTS: 3
    }
};

// ============================================================
// HTTP HANDLERS
// ============================================================

/**
 * Handle HTTP POST requests.
 * Routes by 'action' field, falls back to legacy lead intake.
 */
function doPost(e) {
    try {
        const payload = JSON.parse(e.postData.contents);

        // Route by action if present
        if (payload.action) {
            switch (payload.action) {
                case 'referrer_signup':
                    return handleReferrerSignup(payload);
                case 'referrer_login':
                    return handleReferrerLogin(payload);
                case 'referrer_verify_otp':
                    return handleVerifyOtp(payload);
                case 'submit_referral':
                    return handleSubmitReferral(payload);
                case 'get_dashboard':
                    return handleGetDashboard(payload);
                case 'update_referral_status':
                    return handleUpdateReferralStatus(payload);
                case 'job_application':
                    return handleJobApplication(payload);
                default:
                    return createResponse(400, "Unknown action: " + payload.action);
            }
        }

        // Legacy lead intake (no action field)
        return handleLeadIntake(payload);

    } catch (error) {
        console.error("Error in doPost:", error);
        return createResponse(500, "Internal Server Error", { error: error.message });
    }
}

/**
 * Handle HTTP GET requests (e.g., for testing or Client Portal API)
 */
function doGet(e) {
    return createResponse(200, "ICUNI Labs API is running.");
}

// ============================================================
// LEGACY LEAD INTAKE
// ============================================================

function handleLeadIntake(payload) {
    if (!payload.name || !payload.email) {
        return createResponse(400, "Bad Request: Missing name or email.");
    }

    const leadId = Utilities.getUuid();
    const score = calculateLeadScore(payload);

    const record = [
        leadId,
        payload.name,
        payload.email,
        payload.businessSize || '',
        payload.bottleneck || '',
        score,
        'New',
        new Date().toISOString()
    ];

    writeToSheet(CONFIG.SHEET_NAME_LEADS, record);
    handleRouting(payload, score);

    return createResponse(200, "Success", { leadId: leadId, score: score });
}

// ============================================================
// REFERRAL ENGINE â€” HANDLERS
// ============================================================

/**
 * Register a new referrer.
 * Checks for duplicate email, creates record in Referrers sheet.
 */
function handleReferrerSignup(payload) {
    if (!payload.name || !payload.email || !payload.phone) {
        return createResponse(400, "Missing required fields: name, email, phone.");
    }

    // Check for duplicate
    const existing = findReferrerByEmail(payload.email);
    if (existing) {
        return createResponse(409, "A referrer with this email already exists.", {
            referrerId: existing.referrerId
        });
    }

    const referrerId = 'REF-' + Utilities.getUuid().substring(0, 8).toUpperCase();

    const record = [
        referrerId,
        payload.name,
        payload.email,
        payload.phone,
        payload.background || '',
        payload.payoutPreference || 'momo',
        new Date().toISOString(),
        'Active',
        0  // TotalEarned starts at 0
    ];

    writeToSheet(CONFIG.SHEET_NAME_REFERRERS, record, [
        'ReferrerID', 'Name', 'Email', 'Phone', 'Background', 'PayoutPreference', 'JoinDate', 'Status', 'TotalEarned'
    ]);

    // Notify admin
    try {
        MailApp.sendEmail({
            to: CONFIG.ADMIN_EMAIL,
            subject: 'New Referral Partner: ' + payload.name,
            body: 'A new referral partner has signed up.\n\n' +
                  'Name: ' + payload.name + '\n' +
                  'Email: ' + payload.email + '\n' +
                  'Phone: ' + payload.phone + '\n' +
                  'Background: ' + (payload.background || 'N/A') + '\n' +
                  'ID: ' + referrerId
        });
    } catch (err) {
        console.error('Admin notification failed:', err);
    }

    return createResponse(200, "Referrer registered successfully.", {
        referrerId: referrerId,
        name: payload.name,
        email: payload.email
    });
}

/**
 * Initiate login: verify referrer exists and send OTP via email.
 */
function handleReferrerLogin(payload) {
    if (!payload.email) {
        return createResponse(400, "Email is required.");
    }

    var referrer = findReferrerByEmail(payload.email);
    if (!referrer) {
        return createResponse(404, "No referrer found with this email.");
    }

    if (referrer.status !== 'Active') {
        return createResponse(403, "This referrer account is not active.");
    }

    // Generate and send OTP
    var otp = generateOtp();
    storeOtp(payload.email, otp);

    try {
        MailApp.sendEmail({
            to: payload.email,
            subject: 'ICUNI Labs - Your Login Code',
            body: 'Hi ' + referrer.name.split(' ')[0] + ',\n\n' +
                  'Your one-time login code is: ' + otp + '\n\n' +
                  'This code expires in ' + CONFIG.OTP.EXPIRY_MINUTES + ' minutes.\n\n' +
                  'If you did not request this, please ignore this email.\n\n' +
                  'ICUNI Labs'
        });
    } catch (err) {
        console.error('OTP email send failed:', err);
        return createResponse(500, "Failed to send OTP email.");
    }

    return createResponse(200, "OTP sent to your email.", { email: payload.email });
}

/**
 * Verify OTP code and return referrer session data.
 */
function handleVerifyOtp(payload) {
    if (!payload.email || !payload.otp) {
        return createResponse(400, "Email and OTP are required.");
    }

    var result = verifyOtp(payload.email, payload.otp);
    if (!result.valid) {
        return createResponse(401, result.message || "Invalid or expired code.");
    }

    var referrer = findReferrerByEmail(payload.email);
    if (!referrer) {
        return createResponse(404, "Referrer not found.");
    }

    return createResponse(200, "Login successful.", {
        referrerId: referrer.referrerId,
        name: referrer.name,
        email: referrer.email,
        phone: referrer.phone,
        totalEarned: referrer.totalEarned
    });
}

/**
 * Submit a new referral from a referrer.
 */
function handleSubmitReferral(payload) {
    if (!payload.referrerId || !payload.leadName || !payload.leadEmail || !payload.leadPhone) {
        return createResponse(400, "Missing required fields.");
    }

    // Verify the referrer exists
    const referrer = findReferrerById(payload.referrerId);
    if (!referrer) {
        return createResponse(404, "Referrer not found.");
    }

    const referralId = 'RFL-' + Utilities.getUuid().substring(0, 8).toUpperCase();

    const record = [
        referralId,
        payload.referrerId,
        payload.leadName,
        payload.leadEmail,
        payload.leadPhone,
        payload.leadCompany || '',
        payload.introNotes || '',
        'Submitted',  // Initial status
        0,            // DealValue (set later by admin)
        0,            // PayoutAmount (calculated on close)
        new Date().toISOString(),
        ''            // DateClosed
    ];

    writeToSheet(CONFIG.SHEET_NAME_REFERRALS, record, [
        'ReferralID', 'ReferrerID', 'LeadName', 'LeadEmail', 'LeadPhone',
        'LeadCompany', 'IntroNotes', 'Status', 'DealValue', 'PayoutAmount',
        'DateSubmitted', 'DateClosed'
    ]);

    // Notify admin
    try {
        MailApp.sendEmail({
            to: CONFIG.ADMIN_EMAIL,
            subject: 'New Referral from ' + referrer.name + ': ' + payload.leadName,
            body: 'A referral has been submitted.\n\n' +
                  'Referrer: ' + referrer.name + ' (' + referrer.email + ')\n' +
                  'Lead: ' + payload.leadName + '\n' +
                  'Email: ' + payload.leadEmail + '\n' +
                  'Phone: ' + payload.leadPhone + '\n' +
                  'Company: ' + (payload.leadCompany || 'N/A') + '\n' +
                  'Intro Notes: ' + (payload.introNotes || 'N/A') + '\n\n' +
                  'Referral ID: ' + referralId
        });
    } catch (err) {
        console.error('Admin notification failed:', err);
    }

    return createResponse(200, "Referral submitted successfully.", {
        referralId: referralId
    });
}

/**
 * Fetch dashboard data for a referrer.
 * Returns stats + list of all their referrals.
 */
function handleGetDashboard(payload) {
    if (!payload.referrerId) {
        return createResponse(400, "referrerId is required.");
    }

    const referrer = findReferrerById(payload.referrerId);
    if (!referrer) {
        return createResponse(404, "Referrer not found.");
    }

    // Get all referrals for this referrer
    const referrals = getReferralsByReferrerId(payload.referrerId);

    // Calculate stats
    const totalReferrals = referrals.length;
    const closedWon = referrals.filter(r => r.status === 'Closed Won');
    const closedLost = referrals.filter(r => r.status === 'Closed Lost');
    const pending = referrals.filter(r => !r.status.startsWith('Closed'));
    const totalEarned = closedWon.reduce((sum, r) => sum + (parseFloat(r.payoutAmount) || 0), 0);

    return createResponse(200, "Dashboard data retrieved.", {
        referrer: {
            name: referrer.name,
            email: referrer.email,
            joinDate: referrer.joinDate
        },
        stats: {
            totalReferrals: totalReferrals,
            closedWon: closedWon.length,
            closedLost: closedLost.length,
            pending: pending.length,
            totalEarned: totalEarned,
            conversionRate: totalReferrals > 0
                ? Math.round((closedWon.length / totalReferrals) * 100)
                : 0
        },
        referrals: referrals.map(r => ({
            referralId: r.referralId,
            leadName: r.leadName,
            leadCompany: r.leadCompany,
            status: r.status,
            dealValue: parseFloat(r.dealValue) || 0,
            payoutAmount: parseFloat(r.payoutAmount) || 0,
            dateSubmitted: r.dateSubmitted,
            dateClosed: r.dateClosed
        }))
    });
}

/**
 * Admin: Update referral status and deal value.
 * Triggers payout calculation on 'Closed Won'.
 */
function handleUpdateReferralStatus(payload) {
    if (!payload.referralId || !payload.status) {
        return createResponse(400, "referralId and status are required.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REFERRALS);
    if (!sheet) return createResponse(404, "Referrals sheet not found.");

    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.referralId) {
            rowIndex = i + 1; // 1-indexed for Sheets
            break;
        }
    }

    if (rowIndex === -1) {
        return createResponse(404, "Referral not found.");
    }

    // Update status (column 8)
    sheet.getRange(rowIndex, 8).setValue(payload.status);

    // Update deal value if provided (column 9)
    if (payload.dealValue !== undefined) {
        sheet.getRange(rowIndex, 9).setValue(parseFloat(payload.dealValue));
    }

    // If Closed Won, calculate payout
    if (payload.status === 'Closed Won') {
        const dealValue = payload.dealValue !== undefined
            ? parseFloat(payload.dealValue)
            : parseFloat(data[rowIndex - 1][8]) || 0;

        const payout = calculatePayout(dealValue);
        sheet.getRange(rowIndex, 10).setValue(payout);
        sheet.getRange(rowIndex, 12).setValue(new Date().toISOString());

        // Update referrer's total earned
        const referrerId = data[rowIndex - 1][1];
        updateReferrerTotalEarned(referrerId);

        // Notify referrer
        const referrer = findReferrerById(referrerId);
        if (referrer) {
            try {
                MailApp.sendEmail({
                    to: referrer.email,
                    subject: 'Your Referral Closed! - ICUNI Labs',
                    body: 'Hi ' + referrer.name.split(' ')[0] + ',\n\n' +
                          'Great news! Your referral for ' + data[rowIndex - 1][2] + ' has been closed successfully.\n\n' +
                          'Deal Value: GH\u20b5' + dealValue.toLocaleString() + '\n' +
                          'Your Payout: GH\u20b5' + payout.toLocaleString() + '\n\n' +
                          'We will process your payout shortly. Thank you for being part of the ICUNI referral network!\n\n' +
                          'Best,\nICUNI Labs'
                });
            } catch (err) {
                console.error('Referrer notification failed:', err);
            }
        }
    }

    // If Closed Lost, set date
    if (payload.status === 'Closed Lost') {
        sheet.getRange(rowIndex, 12).setValue(new Date().toISOString());
    }

    return createResponse(200, "Referral updated.", { referralId: payload.referralId, status: payload.status });
}

// ============================================================
// REFERRAL ENGINE â€” DATA ACCESS
// ============================================================

/**
 * Calculate payout: max of flat rate or percentage of deal value.
 */
function calculatePayout(dealValue) {
    const flat = CONFIG.PAYOUT.FLAT_RATE;
    const percentage = dealValue * CONFIG.PAYOUT.PERCENTAGE;
    return Math.max(flat, percentage);
}

/**
 * Find a referrer by email in the Referrers sheet.
 */
function findReferrerByEmail(email) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REFERRERS);
    if (!sheet || sheet.getLastRow() <= 1) return null;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][2] && data[i][2].toString().toLowerCase() === email.toLowerCase()) {
            return {
                referrerId: data[i][0],
                name: data[i][1],
                email: data[i][2],
                phone: data[i][3],
                background: data[i][4],
                payoutPreference: data[i][5],
                joinDate: data[i][6],
                status: data[i][7],
                totalEarned: data[i][8]
            };
        }
    }
    return null;
}

/**
 * Find a referrer by ID in the Referrers sheet.
 */
function findReferrerById(referrerId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REFERRERS);
    if (!sheet || sheet.getLastRow() <= 1) return null;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === referrerId) {
            return {
                referrerId: data[i][0],
                name: data[i][1],
                email: data[i][2],
                phone: data[i][3],
                background: data[i][4],
                payoutPreference: data[i][5],
                joinDate: data[i][6],
                status: data[i][7],
                totalEarned: data[i][8]
            };
        }
    }
    return null;
}

/**
 * Get all referrals for a given referrer ID.
 */
function getReferralsByReferrerId(referrerId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REFERRALS);
    if (!sheet || sheet.getLastRow() <= 1) return [];

    const data = sheet.getDataRange().getValues();
    const results = [];

    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === referrerId) {
            results.push({
                referralId: data[i][0],
                referrerId: data[i][1],
                leadName: data[i][2],
                leadEmail: data[i][3],
                leadPhone: data[i][4],
                leadCompany: data[i][5],
                introNotes: data[i][6],
                status: data[i][7],
                dealValue: data[i][8],
                payoutAmount: data[i][9],
                dateSubmitted: data[i][10],
                dateClosed: data[i][11]
            });
        }
    }
    return results;
}

/**
 * Recalculate and update a referrer's total earned amount.
 */
function updateReferrerTotalEarned(referrerId) {
    const referrals = getReferralsByReferrerId(referrerId);
    const totalEarned = referrals
        .filter(r => r.status === 'Closed Won')
        .reduce((sum, r) => sum + (parseFloat(r.payoutAmount) || 0), 0);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME_REFERRERS);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === referrerId) {
            sheet.getRange(i + 1, 9).setValue(totalEarned);
            break;
        }
    }
}

// ============================================================
// OTP UTILITIES
// ============================================================

/**
 * Generate a random N-digit OTP code.
 */
function generateOtp() {
    var code = '';
    for (var i = 0; i < CONFIG.OTP.LENGTH; i++) {
        code += Math.floor(Math.random() * 10).toString();
    }
    return code;
}

/**
 * Store an OTP in the OTP_Sessions sheet.
 */
function storeOtp(email, otp) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_OTP);

    if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEET_NAME_OTP);
        sheet.appendRow(['Email', 'OTP', 'CreatedAt', 'Attempts', 'Used']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
    }

    // Invalidate any existing OTPs for this email
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().toLowerCase() === email.toLowerCase() && data[i][4] !== 'yes') {
            sheet.getRange(i + 1, 5).setValue('yes');
        }
    }

    // Write new OTP
    sheet.appendRow([email, otp, new Date().toISOString(), 0, 'no']);
}

/**
 * Verify an OTP. Returns { valid: boolean, message?: string }.
 */
function verifyOtp(email, otp) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_OTP);
    if (!sheet) return { valid: false, message: 'No OTP found. Please request a new code.' };

    var data = sheet.getDataRange().getValues();

    // Find latest unused OTP for this email
    for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][0] && data[i][0].toString().toLowerCase() === email.toLowerCase() && data[i][4] !== 'yes') {
            // Check expiry
            var created = new Date(data[i][2]);
            var now = new Date();
            var diffMinutes = (now - created) / (1000 * 60);

            if (diffMinutes > CONFIG.OTP.EXPIRY_MINUTES) {
                sheet.getRange(i + 1, 5).setValue('yes');
                return { valid: false, message: 'Code expired. Please request a new one.' };
            }

            // Check attempts
            var attempts = parseInt(data[i][3]) || 0;
            if (attempts >= CONFIG.OTP.MAX_ATTEMPTS) {
                sheet.getRange(i + 1, 5).setValue('yes');
                return { valid: false, message: 'Too many attempts. Please request a new code.' };
            }

            // Check match
            if (data[i][1].toString() === otp.toString()) {
                sheet.getRange(i + 1, 5).setValue('yes');
                return { valid: true };
            } else {
                sheet.getRange(i + 1, 4).setValue(attempts + 1);
                return { valid: false, message: 'Incorrect code. ' + (CONFIG.OTP.MAX_ATTEMPTS - attempts - 1) + ' attempts remaining.' };
            }
        }
    }

    return { valid: false, message: 'No OTP found. Please request a new code.' };
}

// ============================================================
// LEAD SCORING (original)
// ============================================================

/**
 * Handle job application submission.
 */
function handleJobApplication(payload) {
    if (!payload.name || !payload.email) {
        return createResponse(400, "Name and email are required.");
    }

    var hasCV = !!payload.cvBase64;
    var hasAudio = !!payload.audioBase64;

    var record = [
        new Date().toISOString(),
        payload.jobId || '',
        payload.jobTitle || '',
        payload.name,
        payload.email,
        payload.phone || '',
        payload.note || '',
        hasCV ? 'Yes' : 'No',
        hasAudio ? 'Yes' : 'No',
        'New'
    ];

    writeToSheet(CONFIG.SHEET_NAME_JOBS, record, [
        'DateApplied', 'JobID', 'JobTitle', 'Name', 'Email', 'Phone', 'Note', 'HasCV', 'HasAudio', 'Status'
    ]);

    try {
        var attachments = [];
        if (hasCV) {
            attachments.push(Utilities.newBlob(
                Utilities.base64Decode(payload.cvBase64),
                'application/pdf',
                payload.cvName || 'cv.pdf'
            ));
        }
        if (hasAudio) {
            var audioMime = (payload.audioName || '').indexOf('.webm') > -1 ? 'audio/webm' : 'audio/mpeg';
            attachments.push(Utilities.newBlob(
                Utilities.base64Decode(payload.audioBase64),
                audioMime,
                payload.audioName || 'voice-intro.webm'
            ));
        }

        var emailBody = 'New application received:\n\n' +
            'Position: ' + (payload.jobTitle || 'N/A') + '\n' +
            'Name: ' + payload.name + '\n' +
            'Email: ' + payload.email + '\n' +
            'Phone: ' + (payload.phone || 'N/A') + '\n\n' +
            'Note: ' + (payload.note || 'None') + '\n\n' +
            'CV Attached: ' + (hasCV ? 'Yes' : 'No') + '\n' +
            'Audio Intro: ' + (hasAudio ? 'Yes' : 'No');

        var emailOpts = {
            to: 'jobs@icuni.org',
            subject: 'Job Application: ' + payload.name + ' - ' + (payload.jobTitle || 'Unknown'),
            body: emailBody,
            replyTo: payload.email,
        };
        if (attachments.length > 0) emailOpts.attachments = attachments;
        MailApp.sendEmail(emailOpts);
    } catch (err) {
        console.error('Job application email failed:', err);
    }

    return createResponse(200, "Application submitted successfully.");
}

/**
 * Calculate lead score based on submitted data
 */
function calculateLeadScore(data) {
    let score = 0;

    if (data.businessSize) {
        if (data.businessSize === '200+') score += 50;
        else if (data.businessSize === '51-200') score += 40;
        else if (data.businessSize === '11-50') score += 20;
        else score += 10;
    }

    if (data.bottleneck && data.bottleneck.length > 50) {
        score += 20;
    }

    if (data.bottleneck && data.bottleneck.toLowerCase().includes('scale')) score += 15;
    if (data.bottleneck && data.bottleneck.toLowerCase().includes('automation')) score += 15;

    return score;
}

// ============================================================
// LEAD ROUTING (original)
// ============================================================

/**
 * Execute routing logic (Email notifications, Calendar links, etc.) based on score
 */
function handleRouting(leadData, score) {
    const adminSubject = `New Lead: ${leadData.name} (Score: ${score})`;
    const adminBody = `Review lead details in the Operations Sheet.\n\nName: ${leadData.name}\nEmail: ${leadData.email}\nSize: ${leadData.businessSize}\nBottleneck: ${leadData.bottleneck}\nScore: ${score}`;

    // Always notify admin
    MailApp.sendEmail({
        to: CONFIG.ADMIN_EMAIL,
        subject: adminSubject,
        body: adminBody
    });

    if (score >= CONFIG.SCORE_THRESHOLDS.HIGH) {
        console.log(`High score lead routing for ${leadData.email}`);

        const eventUrl = createTentativeCalendarEvent(leadData.name, leadData.email);

        sendTemplatedEmail(
            leadData.email,
            leadData.name,
            "ICUNI Labs: Systems Audit Next Steps",
            `Hi ${leadData.name.split(' ')[0]},\n\nBased on your submission, your team size (${leadData.businessSize}) and bottleneck align perfectly with the systems we build at ICUNI Labs. \n\nI've generated a tentative hold for a 30-minute Systems Audit on my calendar here: ${eventUrl}\n\nIf that time doesn't work, let me know and we will adjust.\n\nBest,\nICUNI Labs Operations`
        );

    } else if (score >= CONFIG.SCORE_THRESHOLDS.MED) {
        console.log(`Medium score lead routing for ${leadData.email}`);
        sendTemplatedEmail(
            leadData.email,
            leadData.name,
            "ICUNI Labs: Your Intake Review",
            `Hi ${leadData.name.split(' ')[0]},\n\nThanks for submitting your operations details to ICUNI Labs. We are reviewing your bottleneck regarding "${leadData.bottleneck.substring(0, 30)}..." to determine the best approach.\n\nWe'll follow up shortly with some initial thoughts on whether an Audit or a Build Sprint makes sense for your current stage.\n\nBest,\nICUNI Labs Operations`
        );
    } else {
        console.log(`Low score lead routing for ${leadData.email}`);
        sendTemplatedEmail(
            leadData.email,
            leadData.name,
            "ICUNI Labs: Operations Resources",
            `Hi ${leadData.name.split(' ')[0]},\n\nThanks for reaching out to ICUNI Labs. Based on your current team size and needs, you might be slightly early for a full Custom Systems Build.\n\nHowever, we highly recommend starting by structuring your standard operating procedures. Attached is a link to our free Lean Operations Framework guide.\n\nBest,\nICUNI Labs Operations`
        );
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Sends a dynamically populated email
 */
function sendTemplatedEmail(toEmail, name, subject, bodyText) {
    try {
        MailApp.sendEmail({
            to: toEmail,
            subject: subject,
            body: bodyText,
        });
    } catch (error) {
        console.error("Failed to send template email to: " + toEmail, error);
    }
}

/**
 * Creates a tentative calendar event 3 days from now
 */
function createTentativeCalendarEvent(leadName, leadEmail) {
    try {
        const calendar = CalendarApp.getDefaultCalendar();

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 3);
        startTime.setHours(14, 0, 0, 0);

        const endTime = new Date(startTime.getTime() + (30 * 60 * 1000));

        const event = calendar.createEvent(
            `Systems Audit: ICUNI Labs x ${leadName}`,
            startTime,
            endTime,
            {
                description: `Discovery call generated via ICUNI Labs intake.\nLead Email: ${leadEmail}`,
                guests: leadEmail,
                sendInvites: true
            }
        );

        return `https://calendar.google.com/calendar/r/week/${startTime.getFullYear()}/${startTime.getMonth() + 1}/${startTime.getDate()}`;

    } catch (error) {
        console.error("Calendar creation failed: ", error);
        return "Error creating calendar invite - we will reach out manually.";
    }
}

/**
 * Write a record to a specified Google Sheet.
 * If the sheet does not exist, creates it with optional headers.
 */
function writeToSheet(sheetName, recordData, headers) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            if (headers && headers.length > 0) {
                sheet.appendRow(headers);
                sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
            } else {
                // Default headers for Leads
                sheet.appendRow(['LeadID', 'Name', 'Email', 'BusinessSize', 'Bottleneck', 'LeadScore', 'Status', 'DateCreated']);
                sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");
            }
        }

        sheet.appendRow(recordData);
    } catch (err) {
        console.error(`Failed to write to sheet ${sheetName}:`, err);
        throw new Error('Database write error');
    }
}

/**
 * Helper to build JSON responses
 */
function createResponse(code, message, data) {
    var result = {
        status: code,
        message: message,
        data: data || null
    };

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Google Sheets simple trigger: Fires when a cell is edited in the spreadsheet.
 * Used to detect when a Lead Status changes to 'Client', to move their Drive folder.
 */
function onEdit(e) {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();

    // Only monitor the Leads tab
    if (sheet.getName() !== CONFIG.SHEET_NAME_LEADS) return;

    const editedRow = e.range.getRow();
    const editedCol = e.range.getColumn();

    // Assume Status is column G (7) based on our headers setup:
    // ['LeadID', 'Name', 'Email', 'BusinessSize', 'Bottleneck', 'LeadScore', 'Status', 'DateCreated', 'DriveFolderURL']
    if (editedCol === 7 && editedRow > 1) {
        const newValue = e.value;

        // If the Lead explicitly converted to a Client
        if (newValue === 'Client') {
            const dataRange = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0];
            const folderUrl = dataRange[8]; // Index 8 is Column I 'DriveFolderURL'
            const leadName = dataRange[1];  // Index 1 is Column B 'Name'

            if (folderUrl) {
                moveLeadToClientFolder(folderUrl, leadName);
            }
        }
    }
}

/**
 * Extracts folder ID from URL and moves it from the Leads folder to the Clients folder.
 */
function moveLeadToClientFolder(folderUrl, leadName) {
    try {
        const idMatch = folderUrl.match(/[-\w]{25,}/);
        if (!idMatch) return;

        const folderId = idMatch[0];
        const folderToMove = DriveApp.getFolderById(folderId);

        // Using the User-Provided Clients Subfolder ID
        const clientsParent = DriveApp.getFolderById('1gGBjwgbr0JMvYgb81ShezxkHyTWNpoyz');

        // Move to clients folder
        folderToMove.moveTo(clientsParent);

        // Rename from [LEAD] to [CLIENT]
        const currentName = folderToMove.getName();
        if (currentName.startsWith('[LEAD]')) {
            folderToMove.setName(currentName.replace('[LEAD]', '[CLIENT]'));
        } else {
            folderToMove.setName(`[CLIENT] ${leadName}`);
        }

        console.log(`Successfully moved folder for ${leadName} to Clients.`);
    } catch (error) {
        console.error(`Failed to move folder for ${leadName}:`, error);
    }
}
