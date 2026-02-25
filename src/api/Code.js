/**
 * ICUNI Lean Systems Framework (ILSF) - Core Engine
 * 
 * Handles incoming POST requests from the ICUNI Labs website intake form.
 * Validates data, calculates lead score, routing, and writes to Google Sheets.
 */

// Configuration
const CONFIG = {
    SHEET_NAME_LEADS: 'Leads',
    ADMIN_EMAIL: 'labs@icuni.org', // Replace with actual admin email
    SCORE_THRESHOLDS: {
        HIGH: 80,
        MED: 50
    }
};

/**
 * Handle HTTP POST requests (e.g., from the website contact form)
 */
function doPost(e) {
    try {
        // 1. Parse incoming JSON data
        const payload = JSON.parse(e.postData.contents);

        // 2. Validate input
        if (!payload.name || !payload.email) {
            return createResponse(400, "Bad Request: Missing name or email.");
        }

        // 3. Generate standard Lead ID
        const leadId = Utilities.getUuid();

        // 4. Calculate Lead Score
        const score = calculateLeadScore(payload);

        // 5. Build record array for Google Sheets
        // Columns: LeadID, Name, Email, BusinessSize, Bottleneck, LeadScore, Status, DateCreated
        const record = [
            leadId,
            payload.name,
            payload.email,
            payload.businessSize || '',
            payload.bottleneck || '',
            score,
            'New', // Initial Status
            new Date().toISOString()
        ];

        // 6. Write to Google Sheets
        writeToSheet(CONFIG.SHEET_NAME_LEADS, record);

        // 7. Branch Logic based on Score
        handleRouting(payload, score);

        // 8. Return success
        return createResponse(200, "Success", { leadId: leadId, score: score });

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

/**
 * Calculate lead score based on submitted data
 */
function calculateLeadScore(data) {
    let score = 0;

    // Example scoring logic
    if (data.businessSize) {
        if (data.businessSize === '200+') score += 50;
        else if (data.businessSize === '51-200') score += 40;
        else if (data.businessSize === '11-50') score += 20;
        else score += 10;
    }

    if (data.bottleneck && data.bottleneck.length > 50) {
        score += 20; // Detailed bottleneck description implies higher intent
    }

    // Add more sophisticated scoring factors (e.g., specific keywords in bottleneck)
    if (data.bottleneck && data.bottleneck.toLowerCase().includes('scale')) score += 15;
    if (data.bottleneck && data.bottleneck.toLowerCase().includes('automation')) score += 15;

    return score;
}

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

        // 1. Create a tentative Calendar Event for next week
        const eventUrl = createTentativeCalendarEvent(leadData.name, leadData.email);

        // 2. Send high-fit email with booking confirmation / link
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

        // Set event for 3 days from now, taking 30 mins
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 3);
        startTime.setHours(14, 0, 0, 0); // Defaulting to 2:00 PM

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
 * Write a record to a specified Google Sheet
 */
function writeToSheet(sheetName, recordData) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName(sheetName);

        // Create sheet if it doesn't exist
        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
            // Optional: Add headers if creating new sheet
            sheet.appendRow(['LeadID', 'Name', 'Email', 'BusinessSize', 'Bottleneck', 'LeadScore', 'Status', 'DateCreated']);
            sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold");
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
function createResponse(code, message, data = null) {
    const result = {
        status: code,
        message: message,
        data: data
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
    if (sheet.getName() !== CONFIG.SHEETS.TAB_LEADS) return;

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
