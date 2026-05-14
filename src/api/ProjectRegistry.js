// ─── ICUNI PROJECT REGISTRY ──────────────────────────────
// Manages the ecosystem of live ICUNI-built projects.
// SuperAdmin+ can view and manage features across all projects.

function handleGetProjectRegistry(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEETS.ICUNI_PROJECTS);
    if (!sheet) {
        // Create the sheet if it doesn't exist and seed it
        sheet = ss.insertSheet(SHEETS.ICUNI_PROJECTS);
        sheet.appendRow([
            'project_id', 'name', 'description', 'url', 'api_endpoint',
            'status', 'features_json', 'owner', 'tech_stack', 'last_synced', 'created_at'
        ]);
        // Seed with known ICUNI projects
        var projects = [
            ['PROJ-LABS',     'ICUNI Labs',       'Main website & admin console',         'https://labs.icuni.org',       '', 'active', '{}', 'ICUNI', 'React + GAS',      now_(), now_()],
            ['PROJ-PRINTSHOP','PrintShop',         'Print job management system',          '',                             '', 'active', '{}', 'Maame Akosua', 'Next.js + GAS',  now_(), now_()],
            ['PROJ-BLOCKFAC', 'Block Factory',     'Precast concrete operations platform', '',                             '', 'active', '{}', 'Block Factory', 'React + GAS',  now_(), now_()],
            ['PROJ-BLOCKOPS', 'Block Ops',         'Block operations management',          '',                             '', 'active', '{}', 'Block Ops', 'React + GAS',      now_(), now_()],
            ['PROJ-LOREMAKER','Loremaker',          'AI storytelling platform',             '',                             '', 'active', '{}', 'ICUNI', 'React + GAS',          now_(), now_()],
            ['PROJ-IADJOA',   'iAdjoa',            'Virtual assistant platform',           '',                             '', 'active', '{}', 'ICUNI', 'React + GAS',          now_(), now_()]
        ];
        for (var i = 0; i < projects.length; i++) {
            sheet.appendRow(projects[i]);
        }
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var result = [];
    for (var r = 1; r < data.length; r++) {
        var row = {};
        for (var c = 0; c < headers.length; c++) {
            row[headers[c]] = data[r][c];
        }
        // Parse features JSON
        try { row.features = JSON.parse(row.features_json || '{}'); }
        catch (e) { row.features = {}; }
        result.push(row);
    }

    return successResponse_(result, 'Project registry loaded.');
}

function handleUpdateProjectFeature(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var projectId = payload.projectId;
    var featureKey = payload.featureKey;
    var enabled = !!payload.enabled;
    if (!projectId || !featureKey) return errorResponse_('Project ID and feature key are required.');

    var row = findRow_(SHEETS.ICUNI_PROJECTS, 'project_id', projectId);
    if (!row) return errorResponse_('Project not found.');

    var features = {};
    try { features = JSON.parse(row.features_json || '{}'); }
    catch (e) { features = {}; }

    features[featureKey] = enabled;
    updateRow_(SHEETS.ICUNI_PROJECTS, row._rowIndex, {
        features_json: JSON.stringify(features),
        last_synced: now_()
    });

    logAction_(auth.user.user_id, auth.user.name, 'PROJECT_FEATURE_TOGGLE',
        projectId + ': ' + featureKey + ' → ' + (enabled ? 'ON' : 'OFF'));

    return successResponse_(null, 'Feature "' + featureKey + '" ' + (enabled ? 'enabled' : 'disabled') + ' for ' + row.name + '.');
}

function handleAddProject(payload) {
    var auth = requireGodmode_(payload.token);
    if (auth.error) return auth.error;

    if (!payload.name) return errorResponse_('Project name is required.');

    var projectId = generateId_('PROJ');
    appendRow_(SHEETS.ICUNI_PROJECTS, [
        projectId,
        payload.name,
        payload.description || '',
        payload.url || '',
        payload.api_endpoint || '',
        'active',
        JSON.stringify(payload.features || {}),
        payload.owner || 'ICUNI',
        payload.tech_stack || '',
        now_(),
        now_()
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'PROJECT_ADDED', payload.name);
    return successResponse_({ projectId: projectId }, 'Project registered.');
}

function handleRemoveProject(payload) {
    var auth = requireGodmode_(payload.token);
    if (auth.error) return auth.error;

    var row = findRow_(SHEETS.ICUNI_PROJECTS, 'project_id', payload.projectId);
    if (!row) return errorResponse_('Project not found.');

    updateRow_(SHEETS.ICUNI_PROJECTS, row._rowIndex, { status: 'archived' });
    logAction_(auth.user.user_id, auth.user.name, 'PROJECT_ARCHIVED', row.name);
    return successResponse_(null, row.name + ' has been archived.');
}
