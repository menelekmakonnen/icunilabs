/**
 * ICUNI Labs — Invoice System
 * PDF generation (saved to Drive, sent to client) + HTML (staff frontend).
 */

// ─── INVOICE CREATION ────────────────────────────────────

function createInvoice_(data) {
    var invoiceId = 'INV-' + Utilities.formatDate(new Date(), 'Africa/Accra', 'yyyyMMdd') + '-' + 
                    Math.floor(1000 + Math.random() * 9000);
    
    var items = data.items || [];
    var subtotal = 0;
    items.forEach(function(item) {
        item.total = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += item.total;
    });
    
    var tax = data.tax_rate ? subtotal * data.tax_rate : 0;
    var total = subtotal + tax;
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (data.due_days || 7));
    var dueDateStr = Utilities.formatDate(dueDate, 'Africa/Accra', 'yyyy-MM-dd');
    
    // Save invoice record
    appendRow_(SHEETS.INVOICES, [
        invoiceId, data.project_id, data.client_id, data.client_name,
        data.type || 'standard', subtotal, tax, total,
        'pending', dueDateStr, '',
        '', now_(), data.notes || ''
    ]);
    
    // Save line items
    items.forEach(function(item) {
        appendRow_(SHEETS.INVOICE_ITEMS, [
            generateId_('ITM'), invoiceId, item.description,
            item.quantity || 1, item.unit_price || 0, item.total
        ]);
    });
    
    // Generate PDF and save to Drive
    var pdfUrl = '';
    try {
        pdfUrl = generateInvoicePDF_(invoiceId, data, items, total, tax, dueDateStr);
        // Update invoice record with PDF URL
        var inv = findRow_(SHEETS.INVOICES, 'invoice_id', invoiceId);
        if (inv) updateRow_(SHEETS.INVOICES, inv._rowIndex, { pdf_url: pdfUrl });
    } catch(e) {
        Logger.log('PDF generation failed: ' + e.message);
        logError_('Invoices', 'PDF failed for ' + invoiceId + ': ' + e.message);
    }
    
    // Email invoice to client
    if (data.client_email) {
        try {
            sendInvoiceEmail_(invoiceId, data, items, total, tax, dueDateStr, pdfUrl);
        } catch(e) { Logger.log('Invoice email failed: ' + e.message); }
    }
    
    logAction_('SYSTEM', 'System', 'INVOICE_CREATED', invoiceId + ' for ' + data.client_name + ': GH₵' + total);
    
    return { invoiceId: invoiceId, total: total, pdfUrl: pdfUrl };
}

// ─── PDF GENERATION ──────────────────────────────────────

function generateInvoicePDF_(invoiceId, data, items, total, tax, dueDate) {
    var html = buildInvoiceHTML_(invoiceId, data, items, total, tax, dueDate, true);
    
    // Use Google Docs as PDF converter
    var tempDoc = DocumentApp.create('Invoice_' + invoiceId + '_temp');
    var body = tempDoc.getBody();
    
    // Since we can't directly render HTML in Docs, create a clean layout
    body.clear();
    
    // Header
    var header = body.appendParagraph('ICUNI Labs');
    header.setFontSize(24).setBold(true).setForegroundColor('#ff7a00');
    header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    var subtitle = body.appendParagraph('INVOICE');
    subtitle.setFontSize(12).setForegroundColor('#666666');
    subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    body.appendParagraph('');
    
    // Invoice details
    body.appendParagraph('Invoice: ' + invoiceId).setBold(true);
    body.appendParagraph('Date: ' + Utilities.formatDate(new Date(), 'Africa/Accra', 'dd MMMM yyyy'));
    body.appendParagraph('Due: ' + dueDate);
    body.appendParagraph('');
    
    // Client
    body.appendParagraph('Bill To:').setBold(true);
    body.appendParagraph(data.client_name);
    if (data.client_email) body.appendParagraph(data.client_email);
    body.appendParagraph('');
    
    // Items table
    var table = body.appendTable();
    var headerRow = table.appendTableRow();
    ['Description', 'Qty', 'Unit Price (GH₵)', 'Total (GH₵)'].forEach(function(h) {
        var cell = headerRow.appendTableCell(h);
        cell.getChild(0).asParagraph().setBold(true);
    });
    
    items.forEach(function(item) {
        var row = table.appendTableRow();
        row.appendTableCell(item.description || '');
        row.appendTableCell(String(item.quantity || 1));
        row.appendTableCell(formatCurrency_(item.unit_price || 0));
        row.appendTableCell(formatCurrency_(item.total || 0));
    });
    
    body.appendParagraph('');
    
    // Totals
    if (tax > 0) {
        body.appendParagraph('Subtotal: GH₵' + formatCurrency_(total - tax));
        body.appendParagraph('Tax: GH₵' + formatCurrency_(tax));
    }
    var totalPara = body.appendParagraph('TOTAL: GH₵' + formatCurrency_(total));
    totalPara.setBold(true).setFontSize(14);
    
    body.appendParagraph('');
    
    // Payment info
    body.appendParagraph('Payment Methods:').setBold(true);
    body.appendParagraph('Mobile Money (MoMo): 024 XXX XXXX');
    body.appendParagraph('Bank Transfer: Contact us for details');
    body.appendParagraph('');
    
    // Footer
    var footer = body.appendParagraph('ICUNI Labs — Custom Business Operations Systems');
    footer.setFontSize(9).setForegroundColor('#999999');
    footer.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    body.appendParagraph('labs@icuni.org | labs.icuni.org').setFontSize(9).setForegroundColor('#999999')
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    
    if (data.notes) {
        body.appendParagraph('');
        body.appendParagraph('Notes: ' + data.notes).setFontSize(10).setForegroundColor('#666666');
    }
    
    tempDoc.saveAndClose();
    
    // Convert to PDF
    var docFile = DriveApp.getFileById(tempDoc.getId());
    var pdfBlob = docFile.getAs('application/pdf');
    pdfBlob.setName('Invoice_' + invoiceId + '.pdf');
    
    // Save to Drive
    var invoiceFolder = getDriveSubfolder_(DRIVE_FOLDERS.INVOICES);
    var pdfFile = invoiceFolder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Clean up temp doc
    docFile.setTrashed(true);
    
    return 'https://drive.google.com/file/d/' + pdfFile.getId() + '/view';
}

function formatCurrency_(num) {
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ─── HTML INVOICE (Staff Frontend) ───────────────────────

function buildInvoiceHTML_(invoiceId, data, items, total, tax, dueDate, forPdf) {
    var itemRows = items.map(function(item) {
        return '<tr>' +
            '<td style="padding:10px 12px;border-bottom:1px solid #1a2040;">' + (item.description || '') + '</td>' +
            '<td style="padding:10px 12px;border-bottom:1px solid #1a2040;text-align:center;">' + (item.quantity || 1) + '</td>' +
            '<td style="padding:10px 12px;border-bottom:1px solid #1a2040;text-align:right;">GH\u20B5' + formatCurrency_(item.unit_price || 0) + '</td>' +
            '<td style="padding:10px 12px;border-bottom:1px solid #1a2040;text-align:right;font-weight:600;">GH\u20B5' + formatCurrency_(item.total || 0) + '</td>' +
            '</tr>';
    }).join('');
    
    return '<div style="max-width:700px;margin:0 auto;background:#0f1424;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;font-family:-apple-system,sans-serif;color:#e8ecf4;">' +
        '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;display:flex;justify-content:space-between;align-items:flex-start;">' +
        '<div><div style="font-size:28px;font-weight:800;color:#ff7a00;">ICUNI Labs</div>' +
        '<div style="font-size:11px;color:#64748b;letter-spacing:3px;margin-top:4px;">INVOICE</div></div>' +
        '<div style="text-align:right;"><div style="font-size:14px;font-weight:700;">' + invoiceId + '</div>' +
        '<div style="font-size:12px;color:#8b95a8;margin-top:4px;">Date: ' + Utilities.formatDate(new Date(), 'Africa/Accra', 'dd MMM yyyy') + '</div>' +
        '<div style="font-size:12px;color:#8b95a8;">Due: ' + dueDate + '</div></div></div>' +
        '<div style="padding:24px 32px;">' +
        '<div style="margin-bottom:20px;"><div style="font-size:11px;color:#64748b;letter-spacing:2px;margin-bottom:6px;">BILL TO</div>' +
        '<div style="font-size:16px;font-weight:600;">' + data.client_name + '</div>' +
        (data.client_email ? '<div style="font-size:13px;color:#8b95a8;">' + data.client_email + '</div>' : '') + '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<tr style="background:#1a1a2e;"><th style="padding:10px 12px;text-align:left;color:#8b95a8;font-size:11px;letter-spacing:1px;">DESCRIPTION</th>' +
        '<th style="padding:10px 12px;text-align:center;color:#8b95a8;font-size:11px;">QTY</th>' +
        '<th style="padding:10px 12px;text-align:right;color:#8b95a8;font-size:11px;">UNIT PRICE</th>' +
        '<th style="padding:10px 12px;text-align:right;color:#8b95a8;font-size:11px;">TOTAL</th></tr>' +
        itemRows + '</table>' +
        '<div style="margin-top:20px;text-align:right;">' +
        (tax > 0 ? '<div style="font-size:13px;color:#8b95a8;margin-bottom:6px;">Subtotal: GH\u20B5' + formatCurrency_(total - tax) + '</div>' +
        '<div style="font-size:13px;color:#8b95a8;margin-bottom:8px;">Tax: GH\u20B5' + formatCurrency_(tax) + '</div>' : '') +
        '<div style="font-size:22px;font-weight:800;color:#ff7a00;">GH\u20B5' + formatCurrency_(total) + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:2px;">TOTAL DUE</div></div></div>' +
        '<div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0e1a;">' +
        '<div style="font-size:11px;color:#64748b;letter-spacing:2px;margin-bottom:8px;">PAYMENT METHODS</div>' +
        '<div style="font-size:13px;color:#8b95a8;line-height:1.6;">Mobile Money (MoMo) | Bank Transfer<br>Contact labs@icuni.org for payment details</div></div>' +
        (data.notes ? '<div style="padding:16px 32px;font-size:12px;color:#64748b;">Notes: ' + data.notes + '</div>' : '') +
        '<div style="padding:16px 32px;text-align:center;font-size:10px;color:#4a5568;border-top:1px solid rgba(255,255,255,0.04);">' +
        'ICUNI Labs — Custom Business Operations Systems | labs.icuni.org</div></div>';
}

// ─── INVOICE EMAIL ───────────────────────────────────────

function sendInvoiceEmail_(invoiceId, data, items, total, tax, dueDate, pdfUrl) {
    var htmlInvoice = buildInvoiceHTML_(invoiceId, data, items, total, tax, dueDate, false);
    
    var emailOptions = {
        to: data.client_email,
        subject: '[ICUNI Labs] Invoice ' + invoiceId + ' — GH₵' + formatCurrency_(total),
        htmlBody: '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0e1a;">' +
            '<div style="padding:32px 16px;">' + htmlInvoice + '</div></body></html>'
    };
    
    // Attach PDF if available
    if (pdfUrl) {
        try {
            var fileId = pdfUrl.match(/\/d\/([^\/]+)/);
            if (fileId) {
                var file = DriveApp.getFileById(fileId[1]);
                emailOptions.attachments = [file.getAs('application/pdf')];
            }
        } catch(e) { Logger.log('PDF attachment failed: ' + e.message); }
    }
    
    MailApp.sendEmail(emailOptions);
    logEmail_(data.client_email, 'Invoice ' + invoiceId, 'invoice', 'sent');
}

// ─── INVOICE API ENDPOINTS ───────────────────────────────

function handleGetInvoices(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    
    var invoices = sheetToObjects_(SHEETS.INVOICES);
    
    // Client sees only their invoices
    if (auth.user.role === ROLES.CLIENT) {
        var client = findRow_(SHEETS.CLIENTS, 'email', auth.user.email);
        if (client) {
            invoices = invoices.filter(function(inv) { return inv.client_id === client.client_id; });
        } else {
            invoices = [];
        }
    }
    
    return successResponse_(invoices);
}

function handleGetInvoiceHTML(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    
    var invoice = findRow_(SHEETS.INVOICES, 'invoice_id', payload.invoiceId);
    if (!invoice) return errorResponse_('Invoice not found.');
    
    var items = sheetToObjects_(SHEETS.INVOICE_ITEMS).filter(function(i) {
        return i.invoice_id === invoice.invoice_id;
    });
    
    var html = buildInvoiceHTML_(invoice.invoice_id, {
        client_name: invoice.client_name,
        client_email: '',
        notes: invoice.notes
    }, items, Number(invoice.total), Number(invoice.tax), invoice.due_date, false);
    
    return successResponse_({ html: html, invoice: invoice });
}

function handleRecordPayment(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        invoice_id: { required: true, label: 'Invoice ID' },
        amount: { required: true, type: 'number', label: 'Amount' },
        method: { required: true, label: 'Payment method' }
    });
    
    var invoice = findRow_(SHEETS.INVOICES, 'invoice_id', payload.invoice_id);
    if (!invoice) return errorResponse_('Invoice not found.');
    
    var paymentId = generateId_('PAY');
    appendRow_(SHEETS.PAYMENTS, [
        paymentId, payload.invoice_id, invoice.project_id, invoice.client_id,
        Number(payload.amount), payload.method, payload.reference || '',
        'completed', now_(), payload.notes || ''
    ]);
    
    // Check if fully paid
    var payments = sheetToObjects_(SHEETS.PAYMENTS).filter(function(p) {
        return p.invoice_id === invoice.invoice_id && p.status === 'completed';
    });
    var totalPaid = payments.reduce(function(sum, p) { return sum + Number(p.amount); }, 0);
    
    if (totalPaid >= Number(invoice.total)) {
        updateRow_(SHEETS.INVOICES, invoice._rowIndex, { status: 'paid', paid_date: now_() });
        
        // Update project balance
        if (invoice.project_id) {
            var project = findRow_(SHEETS.CLIENT_PROJECTS, 'project_id', invoice.project_id);
            if (project) {
                var newPaid = Number(project.total_paid) + Number(payload.amount);
                updateRow_(SHEETS.CLIENT_PROJECTS, project._rowIndex, {
                    total_paid: newPaid,
                    balance: Number(project.estimated_cost) - newPaid
                });
            }
        }
        
        // Notify referrer of commission
        if (invoice.project_id) {
            try { notifyReferrerCommission_(invoice.project_id, Number(invoice.total)); } catch(e) {}
        }
    } else {
        updateRow_(SHEETS.INVOICES, invoice._rowIndex, { status: 'partial' });
    }
    
    logAction_(auth.user.user_id, auth.user.name, 'PAYMENT_RECORDED', 
        'GH₵' + payload.amount + ' for ' + payload.invoice_id);
    return successResponse_({ paymentId: paymentId, totalPaid: totalPaid }, 'Payment recorded.');
}

function notifyReferrerCommission_(projectId, invoiceTotal) {
    var project = findRow_(SHEETS.CLIENT_PROJECTS, 'project_id', projectId);
    if (!project || !project.referrer_id) return;
    
    var referrer = findRow_(SHEETS.REFERRERS, 'referrer_id', project.referrer_id);
    if (!referrer || !referrer.email) return;
    
    var commission = invoiceTotal * 0.10; // 10% commission
    
    MailApp.sendEmail({
        to: referrer.email,
        subject: '[ICUNI Labs] Commission Confirmed — GH₵' + formatCurrency_(commission),
        htmlBody: buildProjectStepEmail_(referrer.name,
            'Commission Payment Confirmed',
            'Payment has been received for the project you referred.<br><br>' +
            '<div style="background:#1a1a2e;border:2px solid #ff7a00;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">' +
            '<div style="font-size:12px;color:#8b95a8;">YOUR COMMISSION</div>' +
            '<div style="font-size:28px;font-weight:800;color:#ff7a00;margin-top:4px;">GH\u20B5' + formatCurrency_(commission) + '</div></div>' +
            'This will be paid to you via your preferred payment method on file.')
    });
    
    // Update referral payout
    var referral = findRow_(SHEETS.REFERRALS, 'project_id', projectId);
    if (referral) {
        updateRow_(SHEETS.REFERRALS, referral._rowIndex, {
            payout_amount: commission, payout_status: 'confirmed', status: 'Closed Won'
        });
    }
    
    logEmail_(referrer.email, 'Commission confirmed', 'commission', 'sent');
}
