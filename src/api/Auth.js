/**
 * ICUNI Labs — Authentication & Authorization
 * 3-method login (OTP, Password, PIN), sessions, role enforcement.
 * Adapted from Maame Warehouse + PrintShop patterns.
 */

// ─── SESSION ─────────────────────────────────────────────

function createSession_(user) {
    var token = Utilities.getUuid();
    var expires = new Date();
    expires.setHours(expires.getHours() + SESSION_DURATION_HOURS);

    var sessionRow = [
        token, user.id || user.user_id, user.email, user.name, user.role,
        now_(), expires.toISOString(), 'web'
    ];
    appendRow_(SHEETS.SESSIONS, sessionRow);
    logAction_(user.id || 'unknown', user.name, 'LOGIN', 'Session created');

    // Parse permissions for session response
    var permissions = {};
    try { permissions = JSON.parse(user.permissions_json || '{}'); } catch(e) {}

    return {
        token: token,
        user: { name: user.name, email: user.email, role: user.role, job_title: user.job_title || '', permissions: permissions },
        needs_password_setup: !!user.must_change_pw
    };
}

function validateSession_(token) {
    if (!token) return null;
    // Layer 3: CacheService — avoids reading Sessions sheet on every API call.
    // Cache lives across GAS executions (shared in-memory), TTL 120s.
    var cache = CacheService.getScriptCache();
    var cacheKey = 'sess_' + token.substring(0, 16);
    var cached = cache.get(cacheKey);
    if (cached) {
        try { return JSON.parse(cached); } catch(e) { /* fall through to sheet lookup */ }
    }
    var session = findRow_(SHEETS.SESSIONS, 'token', token);
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) return null;
    var result = {
        user_id: session.user_id, email: session.email,
        name: session.name, role: session.role
    };
    try { cache.put(cacheKey, JSON.stringify(result), 120); } catch(e) {}
    return result;
}

function requireAuth_(token, allowedRoles) {
    var user = validateSession_(token);
    if (!user) return { error: errorResponse_('Unauthorized — please log in', 401) };
    if (allowedRoles) {
        var userLevel = ROLE_HIERARCHY.indexOf(user.role);
        var hasPermission = false;
        for (var i = 0; i < allowedRoles.length; i++) {
            if (user.role === allowedRoles[i] || userLevel >= ROLE_HIERARCHY.indexOf(allowedRoles[i])) {
                hasPermission = true; break;
            }
        }
        if (!hasPermission) return { error: errorResponse_('Insufficient permissions', 403) };
    }
    return { user: user };
}

function requireStaff_(token)      { return requireAuth_(token, [ROLES.PRODUCT]); }  // Product is the new minimum console role
function requireAdmin_(token)      { return requireAuth_(token, [ROLES.ADMIN]); }
function requireSuperAdmin_(token) { return requireAuth_(token, [ROLES.SUPERADMIN]); }
function requireGodmode_(token)    { return requireAuth_(token, [ROLES.GODMODE]); }

// Checks if user role is Godmode or SuperAdmin (elevated management)
function requireElevated_(token) { return requireAuth_(token, [ROLES.SUPERADMIN]); }


// ─── USER LOOKUP ─────────────────────────────────────────

function findUserByEmail_(email) {
    if (!email) return null;
    email = email.toLowerCase().trim();
    // Check Users sheet
    var users = sheetToObjects_(SHEETS.USERS);
    for (var i = 0; i < users.length; i++) {
        if (users[i].email && users[i].email.toString().toLowerCase().trim() === email) {
            if (users[i].status !== 'Active') return null;
            return users[i];
        }
    }
    return null;
}

function findUserByIdentifier_(identifier) {
    if (!identifier) return null;
    identifier = identifier.toLowerCase().trim();
    var users = sheetToObjects_(SHEETS.USERS);
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        if ((u.email && u.email.toString().toLowerCase().trim() === identifier) ||
            (u.company_email && u.company_email.toString().toLowerCase().trim() === identifier) ||
            (u.phone && u.phone.toString().replace(/^'/, '').trim() === identifier) ||
            (u.id && u.id.toString().toLowerCase() === identifier)) {
            return u.status === 'Active' ? u : null;
        }
    }
    return null;
}

// ─── OTP LOGIN ───────────────────────────────────────────

function handleSendOTP(payload) {
    var email = (payload.email || payload.identifier || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse_('Please enter a valid email address.');
    }

    var cache = CacheService.getScriptCache();
    var rlKey = 'otp_rl_' + email;
    var sendCount = Number(cache.get(rlKey)) || 0;
    if (sendCount >= OTP_RATE_LIMIT) {
        return errorResponse_('Too many login attempts. Please wait before trying again.');
    }
    cache.put(rlKey, String(sendCount + 1), 3600);

    var user = findUserByIdentifier_(email);
    if (!user) {
        Utilities.sleep(1500);
        return successResponse_(null, 'If this email is registered, a login code has been sent.');
    }

    var otp = generateSecureOTP_();
    cache.put('otp_' + email, JSON.stringify({
        otp: otp, email: email, user_id: user.id, name: user.name, role: user.role,
        attempts: 0, created: now_()
    }), OTP_TTL_SECONDS);

    try {
        sendEmail_({
            to: email,
            subject: 'ICUNI Labs — Your Login Code',
            htmlBody: buildOTPEmail_(otp, user.name),
            from: 'hello@icuni.org'
        });
    } catch (e) {
        Logger.log('OTP email failed: ' + e.message);
        return errorResponse_('Failed to send login code. Please try again.');
    }

    logAction_('SYSTEM', 'System', 'OTP_SENT', 'Login code sent to: ' + email);
    return successResponse_(null, 'If this email is registered, a login code has been sent.');
}

function handleVerifyOTP(payload) {
    var email = (payload.email || payload.identifier || '').trim().toLowerCase();
    var submitted = String(payload.otp || '').trim();
    if (!email || !submitted) return errorResponse_('Email and code are required.');

    var cache = CacheService.getScriptCache();
    var otpStr = cache.get('otp_' + email);
    if (!otpStr) return errorResponse_('Login code has expired. Please request a new one.');

    var otpData = JSON.parse(otpStr);
    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
        cache.remove('otp_' + email);
        return errorResponse_('Too many incorrect attempts. Please request a new code.');
    }

    if (otpData.otp !== submitted) {
        otpData.attempts++;
        cache.put('otp_' + email, JSON.stringify(otpData), OTP_TTL_SECONDS);
        var remaining = OTP_MAX_ATTEMPTS - otpData.attempts;
        return errorResponse_('Incorrect code. ' + remaining + ' attempt' + (remaining === 1 ? '' : 's') + ' remaining.');
    }

    cache.remove('otp_' + email);
    var user = findUserByIdentifier_(email);
    if (!user) return errorResponse_('User account not found.');

    // Trusted device
    var deviceToken = null;
    if (payload.trustDevice) {
        deviceToken = issueDeviceToken_(email, user.id, user.name, user.role);
    }

    var session = createSession_(user);
    session.deviceToken = deviceToken;
    return successResponse_(session);
}

// ─── PASSWORD LOGIN ──────────────────────────────────────

function handlePasswordLogin(payload) {
    var identifier = (payload.identifier || payload.email || '').trim().toLowerCase();
    var password = payload.password;
    if (!identifier || !password) return errorResponse_('Email and password are required.');

    var user = findUserByIdentifier_(identifier);
    if (!user) return errorResponse_('Invalid credentials.', 401);
    if (!user.password_hash) return errorResponse_('No password set. Please use login code.');
    if (!verifyPassword_(password, user.password_hash)) return errorResponse_('Invalid credentials.', 401);

    return successResponse_(createSession_(user));
}

// ─── PIN LOGIN ───────────────────────────────────────────

function handlePinLogin(payload) {
    var identifier = (payload.identifier || '').trim().toLowerCase();
    var pin = String(payload.pin || '').trim();
    if (!identifier || !pin) return errorResponse_('Email and PIN are required.');
    if (!/^\d{4}$/.test(pin)) return errorResponse_('PIN must be 4 digits.');

    var cache = CacheService.getScriptCache();
    var lockKey = 'pin_lock_' + identifier;
    if (cache.get(lockKey)) return errorResponse_('Account temporarily locked. Wait 15 minutes.');

    var failKey = 'pin_fail_' + identifier;
    var failCount = Number(cache.get(failKey)) || 0;

    var user = findUserByIdentifier_(identifier);
    if (!user) { Utilities.sleep(1000); return errorResponse_('Invalid credentials.', 401); }
    if (!user.pin_hash) return errorResponse_('No Quick PIN set. Use email login.');

    if (!verifyPassword_(pin, user.pin_hash)) {
        failCount++;
        if (failCount >= PIN_MAX_ATTEMPTS) {
            cache.put(lockKey, 'locked', PIN_LOCKOUT_SECONDS);
            cache.remove(failKey);
            return errorResponse_('Too many failed attempts. Account locked for 15 minutes.');
        }
        cache.put(failKey, String(failCount), 3600);
        Utilities.sleep(400 * failCount);
        return errorResponse_('Incorrect PIN. ' + (PIN_MAX_ATTEMPTS - failCount) + ' attempts remaining.');
    }

    cache.remove(failKey);
    return successResponse_(createSession_(user));
}

// ─── TRUSTED DEVICE ──────────────────────────────────────

function issueDeviceToken_(email, userId, name, role) {
    var props = PropertiesService.getScriptProperties();
    var token = Utilities.getUuid();
    var expires = new Date(Date.now() + DEVICE_TTL_DAYS * 86400000);
    props.setProperty('dt_' + token, JSON.stringify({
        email: email, userId: userId, name: name, role: role,
        created: now_(), expires: expires.toISOString()
    }));
    enforceDeviceLimit_(email);
    return token;
}

function handleValidateDevice(payload) {
    var token = (payload.deviceToken || '').trim();
    if (!token) return errorResponse_('No device token.');
    var props = PropertiesService.getScriptProperties();
    var dataStr = props.getProperty('dt_' + token);
    if (!dataStr) return errorResponse_('Device not recognized. Please log in.');
    var data = JSON.parse(dataStr);
    if (new Date(data.expires) < new Date()) {
        props.deleteProperty('dt_' + token);
        return errorResponse_('Device trust expired. Please log in again.');
    }
    var user = findUserByEmail_(data.email);
    if (!user) { props.deleteProperty('dt_' + token); return errorResponse_('Account not found.'); }

    var session = createSession_(user);
    return successResponse_(session);
}

function enforceDeviceLimit_(email) {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var keys = Object.keys(all);
    var devices = [];
    var now = new Date();
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('dt_') !== 0) continue;
        try {
            var d = JSON.parse(all[keys[i]]);
            if (new Date(d.expires) < now) { props.deleteProperty(keys[i]); continue; }
            if (d.email === email) devices.push({ key: keys[i], created: d.created });
        } catch(e) { props.deleteProperty(keys[i]); }
    }
    if (devices.length >= MAX_DEVICES_PER_USER) {
        devices.sort(function(a, b) { return new Date(a.created) - new Date(b.created); });
        for (var j = 0; j <= devices.length - MAX_DEVICES_PER_USER; j++) {
            props.deleteProperty(devices[j].key);
        }
    }
}

// ─── SESSION MANAGEMENT ─────────────────────────────────

function handleValidateSession(payload) {
    var user = validateSession_(payload.token || payload.sessionToken);
    if (!user) return errorResponse_('Session expired. Please log in again.');
    return successResponse_({ user: user });
}

function handleLogout(payload) {
    var session = findRow_(SHEETS.SESSIONS, 'token', payload.token);
    if (session) updateRow_(SHEETS.SESSIONS, session._rowIndex, { expires_at: '1970-01-01T00:00:00Z' });
    // Invalidate session cache
    try { CacheService.getScriptCache().remove('sess_' + payload.token.substring(0, 16)); } catch(e) {}
    return successResponse_(null, 'Logged out');
}

// ─── PASSWORD MANAGEMENT ─────────────────────────────────

function handleSetPassword(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var pw = payload.new_password || '';
    var err = validatePasswordStrength_(pw);
    if (err) return errorResponse_(err);
    var user = findRow_(SHEETS.USERS, 'email', auth.user.email);
    if (!user) return errorResponse_('User not found.');
    updateRow_(SHEETS.USERS, user._rowIndex, { password_hash: hashPassword_(pw), must_change_pw: false });
    logAction_(auth.user.user_id, auth.user.name, 'PASSWORD_SET', 'Password set');
    return successResponse_(null, 'Password set successfully.');
}

function handleSetPin(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var pin = String(payload.pin || '').trim();
    if (!/^\d{4}$/.test(pin)) return errorResponse_('PIN must be exactly 4 digits.');
    var user = findRow_(SHEETS.USERS, 'email', auth.user.email);
    if (!user) return errorResponse_('User not found.');
    updateRow_(SHEETS.USERS, user._rowIndex, { pin_hash: hashPassword_(pin) });
    return successResponse_(null, 'Quick PIN set successfully.');
}

function validatePasswordStrength_(pw) {
    if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pw)) return 'Must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pw)) return 'Must contain at least one lowercase letter.';
    if (!/[0-9]/.test(pw)) return 'Must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Must contain at least one special character.';
    return null;
}

// ─── USER MANAGEMENT (Staff+) ────────────────────────────

function handleGetUsers(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var users = sheetToObjects_(SHEETS.USERS).map(function(u) {
        return { id: u.id, name: u.name, email: u.email, phone: u.phone,
                 company_email: u.company_email || '', job_title: u.job_title || '',
                 role: u.role, status: u.status, created_at: u.created_at,
                 last_login: u.last_login, profile_pic_url: u.profile_pic_url };
    });
    // Non-godmode can't see godmode users
    if (auth.user.role !== ROLES.GODMODE) {
        users = users.filter(function(u) { return u.role !== ROLES.GODMODE; });
    }
    return successResponse_(users);
}

function handleAddUser(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    validateInput_(payload, {
        name: { required: true, label: 'Name' },
        email: { required: true, type: 'email', label: 'Email' },
        role: { required: true, oneOf: Object.values ? Object.values(ROLES) : [ROLES.GODMODE, ROLES.ASST_GODMODE, ROLES.STAFF, ROLES.CLIENT, ROLES.REFERRER], label: 'Role' }
    });
    // Only Godmode can create Godmode/Admin
    if ([ROLES.GODMODE, ROLES.ADMIN].indexOf(payload.role) >= 0 && auth.user.role !== ROLES.GODMODE) {
        return errorResponse_('Only Godmode can create admin accounts.');
    }
    var existing = findUserByEmail_(payload.email);
    if (existing) return errorResponse_('A user with this email already exists.');

    var userId = generateId_('USR');
    var tempPw = 'ICUNI' + Math.floor(1000 + Math.random() * 9000) + '!';
    appendRow_(SHEETS.USERS, [
        userId, payload.name, payload.email, payload.phone || '', payload.role,
        'Active', hashPassword_(tempPw), '',
        true, true, now_(), '', '', true, '', '',
        payload.permissions_json || '{}', payload.job_title || ''
    ]);
    logAction_(auth.user.user_id, auth.user.name, 'USER_ADDED', 'Added: ' + payload.name + ' as ' + payload.role);

    // Send welcome email
    try {
        sendEmail_({
            to: payload.email,
            subject: 'Welcome to ICUNI Labs',
            htmlBody: buildWelcomeEmail_(payload.name, payload.email, tempPw, payload.role),
            from: 'hello@icuni.org'
        });
    } catch(e) { Logger.log('Welcome email failed: ' + e.message); }

    return successResponse_({ userId: userId }, 'User created successfully.');
}

function handleDeactivateUser(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;
    var user = findRow_(SHEETS.USERS, 'id', payload.userId);
    if (!user) return errorResponse_('User not found.');
    if (user.role === ROLES.GODMODE && auth.user.role !== ROLES.GODMODE) {
        return errorResponse_('Only Godmode can deactivate Godmode accounts.');
    }
    updateRow_(SHEETS.USERS, user._rowIndex, { status: 'Inactive' });
    logAction_(auth.user.user_id, auth.user.name, 'USER_DEACTIVATED', 'Deactivated: ' + user.name);
    return successResponse_(null, 'User deactivated.');
}

// ─── ADMIN CREATION (Godmode only, email-only seeding) ──

function handleCreateAdmin(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var email = (payload.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return errorResponse_('Please enter a valid email address.');
    }

    var existing = findUserByEmail_(email);
    if (existing) return errorResponse_('A user with this email already exists.');

    // Determine role — default Admin, validate
    var targetRole = payload.role || ROLES.ADMIN;
    var validRoles = ['SuperAdmin', 'Admin', 'Sales', 'Product'];
    if (validRoles.indexOf(targetRole) === -1) return errorResponse_('Invalid role.');
    // Only Godmode can create SuperAdmins
    if (targetRole === 'SuperAdmin' && auth.user.role !== ROLES.GODMODE) {
        return errorResponse_('Only Godmode can create SuperAdmin accounts.');
    }

    // Build permissions from department scope (SuperAdmin gets all)
    var defaultPerms = {};
    if (targetRole === 'SuperAdmin' || targetRole === 'Godmode') {
        defaultPerms = {
            dashboard: true, clients: true, projects: true, invoices: true,
            careers: true, referrals: true, sla: true, logs: true, settings: true
        };
    } else {
        var scopeSections = DEPARTMENT_SCOPE[targetRole] || [];
        var allSections = ['dashboard', 'clients', 'projects', 'invoices', 'careers', 'referrals', 'sla', 'logs', 'settings'];
        for (var i = 0; i < allSections.length; i++) {
            defaultPerms[allSections[i]] = scopeSections.indexOf(allSections[i]) !== -1;
        }
    }
    // Apply any permission overrides from payload
    if (payload.permissions) {
        for (var key in payload.permissions) {
            if (payload.permissions.hasOwnProperty(key)) {
                defaultPerms[key] = !!payload.permissions[key];
            }
        }
    }

    var userId = generateId_('USR');
    var jobTitle = payload.job_title || 'Operations Assistant';
    appendRow_(SHEETS.USERS, [
        userId, email.split('@')[0], email, '', targetRole,
        'Active', '', '',  // no password, no pin — they use OTP first
        true, true, now_(), '', '', true, '', '',
        JSON.stringify(defaultPerms), jobTitle
    ]);

    logAction_(auth.user.user_id, auth.user.name, 'TEAM_MEMBER_CREATED', 'Created ' + targetRole + ': ' + email + ' (' + jobTitle + ')');

    // Send OTP welcome email so they can log in
    var emailSent = false;
    try {
        var otp = generateSecureOTP_();
        var cache = CacheService.getScriptCache();
        cache.put('otp_' + email, JSON.stringify({
            otp: otp, email: email, user_id: userId, name: email.split('@')[0], role: targetRole,
            attempts: 0, created: now_()
        }), OTP_TTL_SECONDS);

        sendEmail_({
            to: email,
            subject: 'Welcome to ICUNI Labs — Your Admin Account',
            htmlBody: buildAdminWelcomeEmail_(email.split('@')[0], otp),
            from: 'hello@icuni.org'
        });
        emailSent = true;
        logEmail_(email, 'Admin Welcome + OTP', 'admin_invite', 'sent');
    } catch(e) {
        Logger.log('Admin welcome email FAILED for ' + email + ': ' + e.message + '\n' + (e.stack || ''));
        logEmail_(email, 'Admin Welcome + OTP', 'admin_invite', 'failed: ' + e.message);
    }

    if (emailSent) {
        return successResponse_({ userId: userId }, 'Admin account created. Login code sent to ' + email + '.');
    } else {
        return successResponse_({ userId: userId, emailFailed: true }, 'Admin account created but the welcome email could not be sent. The user may need to request a login code manually from the login page.');
    }
}

// ─── USER EDITING (Godmode + SuperAdmin) ──────────────────

function handleEditUser(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var userId = payload.userId;
    if (!userId) return errorResponse_('User ID is required.');

    var user = findRow_(SHEETS.USERS, 'id', userId);
    if (!user) return errorResponse_('User not found.');
    if (user.role === ROLES.GODMODE) return errorResponse_('Cannot edit Godmode users.');
    // SuperAdmin can only edit below their level
    if (auth.user.role === ROLES.SUPERADMIN && user.role === ROLES.SUPERADMIN) {
        return errorResponse_('SuperAdmins cannot edit other SuperAdmins.');
    }

    var updates = {};
    if (payload.name !== undefined && payload.name.trim()) updates.name = payload.name.trim();
    if (payload.phone !== undefined) updates.phone = payload.phone;
    if (payload.job_title !== undefined) updates.job_title = payload.job_title;
    if (payload.company_email !== undefined) updates.company_email = payload.company_email.trim().toLowerCase();
    if (payload.role !== undefined) {
        var allowed = ['SuperAdmin', 'Admin', 'Sales', 'Product'];
        // Only Godmode can promote to SuperAdmin
        if (payload.role === 'SuperAdmin' && auth.user.role !== ROLES.GODMODE) {
            return errorResponse_('Only Godmode can promote users to SuperAdmin.');
        }
        if (allowed.indexOf(payload.role) === -1) return errorResponse_('Invalid role.');
        updates.role = payload.role;
    }
    if (payload.status !== undefined) {
        var validStatus = ['Active', 'Inactive'];
        if (validStatus.indexOf(payload.status) === -1) return errorResponse_('Invalid status.');
        updates.status = payload.status;
    }

    if (Object.keys(updates).length === 0) return errorResponse_('No changes to save.');

    updateRow_(SHEETS.USERS, user._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'USER_EDITED', user.name + ' → ' + Object.keys(updates).join(', '));
    return successResponse_(null, 'User updated successfully.');
}

// ─── PERMISSION MANAGEMENT (Godmode + SuperAdmin) ────────

function handleUpdateUserPermissions(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var user = findRow_(SHEETS.USERS, 'id', payload.userId);
    if (!user) return errorResponse_('User not found.');
    if (user.role === ROLES.GODMODE) return errorResponse_('Cannot modify Godmode permissions.');
    if (auth.user.role === ROLES.SUPERADMIN && user.role === ROLES.SUPERADMIN) {
        return errorResponse_('SuperAdmins cannot modify other SuperAdmin permissions.');
    }

    var perms = payload.permissions || {};
    updateRow_(SHEETS.USERS, user._rowIndex, { permissions_json: JSON.stringify(perms) });
    logAction_(auth.user.user_id, auth.user.name, 'PERMISSIONS_UPDATED', user.name + ': ' + Object.keys(perms).filter(function(k) { return perms[k]; }).join(', '));
    return successResponse_(null, 'Permissions updated for ' + user.name + '.');
}

function handleGetUserPermissions(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var targetId = payload.userId || auth.user.user_id;
    // Non-godmode can only see their own permissions
    if (targetId !== auth.user.user_id && auth.user.role !== ROLES.GODMODE) {
        return errorResponse_('Access denied.');
    }

    var user = findRow_(SHEETS.USERS, 'id', targetId);
    if (!user) return errorResponse_('User not found.');

    var permissions = {};
    try { permissions = JSON.parse(user.permissions_json || '{}'); } catch(e) {}
    return successResponse_({ userId: user.id, name: user.name, role: user.role, permissions: permissions });
}

// ── PROFILE MANAGEMENT ──────────────────────────────────

function handleGetProfile(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var user = findRow_(SHEETS.USERS, 'email', auth.user.email);
    if (!user) return errorResponse_('User not found.');
    var contactDetails = {};
    try { contactDetails = JSON.parse(user.contact_details || '{}'); } catch(e) {}
    var permissions = {};
    try { permissions = JSON.parse(user.permissions_json || '{}'); } catch(e) {}
    return successResponse_({
        name: user.name,
        email: user.email,
        company_email: user.company_email || '',
        phone: user.phone || '',
        role: user.role,
        job_title: user.job_title || '',
        profile_pic_url: user.profile_pic_url || '',
        cover_image_url: user.cover_image_url || '',
        contact_details: contactDetails,
        permissions: permissions,
        has_password: !!user.password_hash,
        has_pin: !!user.pin_hash
    });
}

function handleUpdateProfile(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    var user = findRow_(SHEETS.USERS, 'email', auth.user.email);
    if (!user) return errorResponse_('User not found.');

    var updates = {};
    if (payload.name && payload.name.trim()) updates.name = payload.name.trim();
    if (payload.phone !== undefined) updates.phone = payload.phone;
    if (payload.profile_pic_url !== undefined) updates.profile_pic_url = payload.profile_pic_url;
    if (payload.cover_image_url !== undefined) updates.cover_image_url = payload.cover_image_url;
    if (payload.contact_details !== undefined) {
        updates.contact_details = JSON.stringify(payload.contact_details);
    }

    if (Object.keys(updates).length === 0) return errorResponse_('No changes to save.');
    updateRow_(SHEETS.USERS, user._rowIndex, updates);
    logAction_(auth.user.user_id, auth.user.name, 'PROFILE_UPDATED', Object.keys(updates).join(', '));
    return successResponse_(null, 'Profile updated.');
}

function handleUploadProfileImage(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;
    if (!payload.base64 || !payload.fileName) return errorResponse_('File data and name required.');
    var type = payload.type || 'profile'; // 'profile' or 'cover'

    // Save to Drive
    var usersFolder = getDriveSubfolder_(DRIVE_FOLDERS.USERS || 'User Files');
    var userFolder = getOrCreateFolder_(usersFolder, auth.user.name + ' — ' + auth.user.user_id);

    var parts = payload.base64.split(',');
    var raw = parts.length > 1 ? parts[1] : parts[0];
    var mimeMatch = payload.base64.match(/^data:([^;]+);/);
    var mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    var blob = Utilities.newBlob(Utilities.base64Decode(raw), mime, payload.fileName);
    var file = userFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    // Use direct image URL format (renderable in <img> tags)
    var fileId = file.getId();
    var fileUrl = 'https://lh3.googleusercontent.com/d/' + fileId;

    // Auto-update the user's profile
    var user = findRow_(SHEETS.USERS, 'email', auth.user.email);
    if (user) {
        var updates = {};
        if (type === 'cover') updates.cover_image_url = fileUrl;
        else updates.profile_pic_url = fileUrl;
        updateRow_(SHEETS.USERS, user._rowIndex, updates);
    }

    logAction_(auth.user.user_id, auth.user.name, 'PROFILE_IMAGE_UPLOADED', type + ': ' + payload.fileName);
    return successResponse_({ url: fileUrl }, 'Image uploaded.');
}

// ─── OTP HELPERS ─────────────────────────────────────────

function generateSecureOTP_() {
    var bytes = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        Utilities.getUuid() + Date.now() + Math.random()
    );
    var num = Math.abs(bytes[0] * 16777216 + bytes[1] * 65536 + bytes[2] * 256 + bytes[3]);
    var otp = String(num % 1000000);
    while (otp.length < 6) otp = '0' + otp;
    return otp;
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────

function buildOTPEmail_(otp, name) {
    var digits = otp.split('');
    var boxes = digits.map(function(d) {
        return '<td style="width:44px;height:52px;text-align:center;font-family:monospace;font-size:28px;font-weight:700;color:#ff7a00;background:#1a1a2e;border:2px solid #2a2a4a;border-radius:10px;">' + d + '</td>';
    }).join('<td style="width:6px;"></td>');

    return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;"><tr><td align="center">' +
        '<table width="460" cellpadding="0" cellspacing="0" style="background:#0f1424;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">' +
        '<tr><td style="padding:28px 32px 16px;text-align:center;background:linear-gradient(180deg,#111827 0%,#0f1424 100%);">' +
        '<img src="' + LOGO_URL + '" alt="ICUNI Labs" width="44" height="44" style="display:block;margin:0 auto 10px;border-radius:10px;" />' +
        '<div style="font-size:22px;font-weight:800;color:#ff7a00;">ICUNI Labs</div>' +
        '<div style="font-size:11px;color:#4a5568;margin-top:4px;letter-spacing:4px;">SECURE LOGIN</div></td></tr>' +
        '<tr><td style="padding:24px 32px 0;color:#e8ecf4;font-size:16px;">Hi <strong>' + (name || 'there') + '</strong>,</td></tr>' +
        '<tr><td style="padding:12px 32px;color:#8b95a8;font-size:14px;">Enter this code to log in. It expires in <strong style="color:#e8ecf4;">5 minutes</strong>.</td></tr>' +
        '<tr><td style="padding:20px 32px;" align="center"><table cellpadding="0" cellspacing="0"><tr>' + boxes + '</tr></table></td></tr>' +
        '<tr><td style="padding:16px 32px;text-align:center;"><div style="padding:8px 16px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.15);font-size:12px;color:#ef4444;display:inline-block;">Never share this code with anyone.</div></td></tr>' +
        '<tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">' +
        '<div style="color:#4a5568;font-size:11px;">ICUNI Labs — Custom Business Operations Systems</div>' +
        '<div style="color:#3a4050;font-size:10px;margin-top:4px;">labs@icuni.org | labs.icuni.org</div></td></tr>' +
        '</table></td></tr></table></body></html>';
}

function buildWelcomeEmail_(name, email, tempPw, role) {
    return buildBrandedEmail_(name,
        'Welcome to ICUNI Labs',
        'Your account has been created with the role: <strong style="color:#ff7a00;">' + role + '</strong>.<br><br>' +
        'Your temporary password is:<br>' +
        '<div style="background:#1a1a2e;border:2px solid #ff7a00;border-radius:8px;padding:12px;text-align:center;margin:12px 0;font-family:monospace;font-size:18px;color:#ff7a00;font-weight:700;">' + tempPw + '</div>' +
        'Please log in and change your password immediately.',
        { ctaText: 'Log In Now', ctaLink: 'https://labs.icuni.org' }
    );
}

function buildAdminWelcomeEmail_(name, otp) {
    var digits = otp.split('');
    var boxes = digits.map(function(d) {
        return '<td style="width:44px;height:52px;text-align:center;font-family:monospace;font-size:28px;font-weight:700;color:#8b5cf6;background:#1a1a2e;border:2px solid #2a2a4a;border-radius:10px;">' + d + '</td>';
    }).join('<td style="width:6px;"></td>');

    return buildBrandedEmail_(name,
        'Welcome to the Team',
        'You have been invited to join <strong style="color:#ff7a00;">ICUNI Labs</strong> as an <strong style="color:#8b5cf6;">Admin</strong>.<br><br>' +
        'Use the login code below to access your account for the first time:<br><br>' +
        '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>' + boxes + '</tr></table><br>' +
        'Once logged in, you can set up your password and PIN for faster access.',
        { ctaText: 'Log In to ICUNI Labs', ctaLink: 'https://labs.icuni.org' }
    );
}

// ─── IMPERSONATION (Godmode + SuperAdmin) ─────────────────

function handleImpersonateUser(payload) {
    var auth = requireElevated_(payload.token);
    if (auth.error) return auth.error;

    var targetUserId = payload.targetUserId;
    if (!targetUserId) return errorResponse_('Target user ID is required.');

    var targetUser = findRow_(SHEETS.USERS, 'id', targetUserId);
    if (!targetUser) return errorResponse_('Target user not found.');
    if (targetUser.role === ROLES.GODMODE) return errorResponse_('Cannot impersonate Godmode users.');
    if (auth.user.role === ROLES.SUPERADMIN && targetUser.role === ROLES.SUPERADMIN) {
        return errorResponse_('SuperAdmins cannot impersonate other SuperAdmins.');
    }

    // Create a time-limited impersonation token (15 minutes)
    var impToken = generateId_('IMP');
    var cache = CacheService.getScriptCache();
    cache.put('imp_' + impToken, JSON.stringify({
        impersonator_id: auth.user.user_id,
        impersonator_name: auth.user.name,
        impersonator_role: auth.user.role,
        target_id: targetUser.id,
        target_name: targetUser.name,
        target_email: targetUser.email,
        target_role: targetUser.role,
        created: now_()
    }), 900); // 15 minutes

    // Log impersonation start
    logAction_(auth.user.user_id, auth.user.name, 'IMPERSONATION_START',
        'Impersonating: ' + targetUser.name + ' (' + targetUser.role + ')');

    // Log to impersonation sheet
    try {
        appendRow_(SHEETS.IMPERSONATION_LOG, [
            impToken, auth.user.user_id, auth.user.name, auth.user.role,
            targetUser.id, targetUser.name, targetUser.role,
            now_(), '', 'active'
        ]);
    } catch(e) { Logger.log('Impersonation log write failed: ' + e.message); }

    return successResponse_({
        impersonationToken: impToken,
        targetUser: {
            user_id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            permissions: targetUser.permissions_json ? JSON.parse(targetUser.permissions_json) : {}
        },
        expiresIn: 900
    }, 'Now impersonating ' + targetUser.name + '. Session expires in 15 minutes.');
}

function handleEndImpersonation(payload) {
    var auth = requireAuth_(payload.token);
    if (auth.error) return auth.error;

    var impToken = payload.impersonationToken;
    if (impToken) {
        var cache = CacheService.getScriptCache();
        cache.remove('imp_' + impToken);

        // Update impersonation log
        try {
            var row = findRow_(SHEETS.IMPERSONATION_LOG, 'id', impToken);
            if (row) {
                updateRow_(SHEETS.IMPERSONATION_LOG, row._rowIndex, {
                    ended_at: now_(),
                    status: 'ended'
                });
            }
        } catch(e) { /* best-effort */ }
    }

    logAction_(auth.user.user_id, auth.user.name, 'IMPERSONATION_END', 'Ended impersonation session');
    return successResponse_(null, 'Impersonation session ended.');
}
