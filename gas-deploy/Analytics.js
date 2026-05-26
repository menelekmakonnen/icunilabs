/**
 * ICUNI Labs — Analytics Module
 * Handles site visitor tracking, event storage, and analytics aggregation.
 */

// ─── TRACK EVENT (called from Vercel API route) ──────────

function handleTrackEvent(payload) {
    // No auth required — this is a public tracking endpoint
    // but we validate structure to prevent abuse
    var sessionId = payload.session_id;
    if (!sessionId || !payload.events || !Array.isArray(payload.events)) {
        return errorResponse_('Invalid tracking payload.');
    }

    var events = payload.events;
    if (events.length > 100) events = events.slice(0, 100);

    var meta = payload.session_meta || {};
    var geo = payload.geo || {};
    var nowStr = now_();

    // Write each event as a row
    var rows = [];
    for (var i = 0; i < events.length; i++) {
        var evt = events[i];
        var evtId = generateId_('EVT');

        // Serialize clicks array for page_exit events
        var clicksJson = '';
        if (evt.clicks && Array.isArray(evt.clicks)) {
            try { clicksJson = JSON.stringify(evt.clicks); } catch(e) {}
        }

        rows.push([
            evtId,
            sessionId,
            evt.event_type || 'unknown',
            evt.timestamp || nowStr,
            evt.page_url || '',
            evt.page_title || '',
            meta.device_type || '',
            meta.browser || '',
            meta.os || '',
            meta.viewport_w || '',
            meta.viewport_h || '',
            meta.referrer || '',
            meta.utm ? JSON.stringify(meta.utm) : '',
            geo.city || '',
            geo.country || '',
            geo.latitude || '',
            geo.longitude || '',
            geo.region || '',
            evt.scroll_depth || '',
            evt.time_on_page || '',
            clicksJson,
            evt.session_duration || '',
            evt.page_sequence ? JSON.stringify(evt.page_sequence) : '',
            evt.pages_visited || '',
            meta.lang || '',
            meta.screen_w || '',
            meta.screen_h || '',
            nowStr
        ]);
    }

    // Batch append
    if (rows.length > 0) {
        var ANALYTICS_HEADERS = [
            'event_id', 'session_id', 'event_type', 'timestamp',
            'page_url', 'page_title', 'device_type', 'browser', 'os',
            'viewport_w', 'viewport_h', 'referrer', 'utm_json',
            'city', 'country', 'latitude', 'longitude', 'region',
            'scroll_depth', 'time_on_page', 'clicks_json',
            'session_duration', 'page_sequence_json', 'pages_visited',
            'lang', 'screen_w', 'screen_h', 'recorded_at'
        ];
        var sheet = ensureSheet_(SHEETS.ANALYTICS_EVENTS, ANALYTICS_HEADERS);
        for (var j = 0; j < rows.length; j++) {
            sheet.appendRow(rows[j]);
        }
    }

    return successResponse_(null, 'OK');
}

// ─── GET ANALYTICS (admin dashboard) ─────────────────────

function handleGetAnalytics(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var allEvents = sheetToObjects_(SHEETS.ANALYTICS_EVENTS);

    // Date filtering
    var fromDate = payload.from_date ? new Date(payload.from_date) : null;
    var toDate = payload.to_date ? new Date(payload.to_date) : null;

    // Adjust toDate to end-of-day so events on the selected date are included
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    if (fromDate || toDate) {
        allEvents = allEvents.filter(function(e) {
            var d = new Date(e.timestamp);
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        });
    }

    // ── Separate event types ──
    var pageViews = allEvents.filter(function(e) { return e.event_type === 'page_view'; });
    var pageExits = allEvents.filter(function(e) { return e.event_type === 'page_exit'; });
    var sessionEnds = allEvents.filter(function(e) { return e.event_type === 'session_end'; });

    // ── Unique sessions ──
    var sessionSet = {};
    allEvents.forEach(function(e) { sessionSet[e.session_id] = true; });
    var uniqueSessions = Object.keys(sessionSet).length;

    // ── Device breakdown ──
    var devices = { phone: 0, tablet: 0, desktop: 0 };
    var deviceSessions = {};
    allEvents.forEach(function(e) {
        if (!deviceSessions[e.session_id]) {
            deviceSessions[e.session_id] = e.device_type || 'desktop';
            var dt = e.device_type || 'desktop';
            if (devices.hasOwnProperty(dt)) devices[dt]++;
            else devices['desktop']++;
        }
    });

    // ── Page performance ──
    var pageStats = {};
    pageViews.forEach(function(e) {
        var url = e.page_url || '/';
        if (!pageStats[url]) pageStats[url] = { views: 0, sessions: {}, totalTime: 0, totalScroll: 0, exitCount: 0, bounces: 0 };
        pageStats[url].views++;
        pageStats[url].sessions[e.session_id] = true;
    });

    pageExits.forEach(function(e) {
        var url = e.page_url || '/';
        if (!pageStats[url]) pageStats[url] = { views: 0, sessions: {}, totalTime: 0, totalScroll: 0, exitCount: 0, bounces: 0 };
        pageStats[url].totalTime += Number(e.time_on_page || 0);
        pageStats[url].totalScroll += Number(e.scroll_depth || 0);
        pageStats[url].exitCount++;
    });

    // Convert to array
    var pagePerformance = Object.keys(pageStats).map(function(url) {
        var s = pageStats[url];
        var uniqueVisitors = Object.keys(s.sessions).length;
        return {
            page: url,
            views: s.views,
            unique_visitors: uniqueVisitors,
            avg_time: s.exitCount > 0 ? Math.round(s.totalTime / s.exitCount) : 0,
            avg_scroll: s.exitCount > 0 ? Math.round(s.totalScroll / s.exitCount) : 0
        };
    }).sort(function(a, b) { return b.views - a.views; });

    // ── Avg session duration ──
    var totalDuration = 0;
    var durationCount = 0;
    sessionEnds.forEach(function(e) {
        var d = Number(e.session_duration || 0);
        if (d > 0) { totalDuration += d; durationCount++; }
    });
    var avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

    // ── Bounce rate ──
    var sessionPageCounts = {};
    pageViews.forEach(function(e) {
        sessionPageCounts[e.session_id] = (sessionPageCounts[e.session_id] || 0) + 1;
    });
    var bounceSessions = 0;
    var totalSessionsWithViews = Object.keys(sessionPageCounts).length;
    for (var sid in sessionPageCounts) {
        if (sessionPageCounts[sid] === 1) bounceSessions++;
    }
    var bounceRate = totalSessionsWithViews > 0 ? Math.round((bounceSessions / totalSessionsWithViews) * 100) : 0;

    // ── Pages per session ──
    var pagesPerSession = totalSessionsWithViews > 0 ? Math.round(pageViews.length / totalSessionsWithViews * 10) / 10 : 0;

    // ── Location breakdown ──
    var locations = {};
    var locationSessions = {};
    allEvents.forEach(function(e) {
        if (!e.city || locationSessions[e.session_id]) return;
        locationSessions[e.session_id] = true;
        var key = e.city + '|' + e.country;
        if (!locations[key]) {
            locations[key] = { city: e.city, country: e.country, lat: Number(e.latitude || 0), lng: Number(e.longitude || 0), count: 0 };
        }
        locations[key].count++;
    });
    var locationBreakdown = Object.keys(locations).map(function(k) { return locations[k]; })
        .sort(function(a, b) { return b.count - a.count; });

    // ── Referrer breakdown ──
    var referrers = {};
    var referrerSessions = {};
    allEvents.forEach(function(e) {
        if (referrerSessions[e.session_id]) return;
        referrerSessions[e.session_id] = true;
        var ref = e.referrer || 'Direct';
        if (ref && ref !== 'Direct') {
            try { ref = new URL(ref).hostname; } catch(ex) {}
        }
        referrers[ref] = (referrers[ref] || 0) + 1;
    });
    var referrerBreakdown = Object.keys(referrers).map(function(k) {
        return { source: k, count: referrers[k] };
    }).sort(function(a, b) { return b.count - a.count; });

    // ── Click map (per page) ──
    var clickMaps = {};
    pageExits.forEach(function(e) {
        var url = e.page_url || '/';
        if (!e.clicks_json) return;
        try {
            var clicks = JSON.parse(e.clicks_json);
            if (!Array.isArray(clicks)) return;
            if (!clickMaps[url]) clickMaps[url] = [];
            clicks.forEach(function(c) {
                clickMaps[url].push({ x: c.x, y: c.y, target: c.target, text: c.text || '' });
            });
        } catch(ex) {}
    });

    // ── Daily trend (last 30 days) ──
    var dailyTrend = {};
    pageViews.forEach(function(e) {
        var day = (e.timestamp || '').substring(0, 10);
        if (!day) return;
        if (!dailyTrend[day]) dailyTrend[day] = { views: 0, sessions: {} };
        dailyTrend[day].views++;
        dailyTrend[day].sessions[e.session_id] = true;
    });
    var trend = Object.keys(dailyTrend).sort().map(function(day) {
        return { date: day, views: dailyTrend[day].views, visitors: Object.keys(dailyTrend[day].sessions).length };
    });

    // ── Visitor journeys (recent 50) ──
    var journeys = {};
    sessionEnds.forEach(function(e) {
        if (!e.page_sequence_json) return;
        try {
            var seq = JSON.parse(e.page_sequence_json);
            if (Array.isArray(seq)) {
                journeys[e.session_id] = {
                    session_id: e.session_id,
                    pages: seq,
                    duration: Number(e.session_duration || 0),
                    device: e.device_type || 'desktop',
                    city: e.city || '',
                    timestamp: e.timestamp || ''
                };
            }
        } catch(ex) {}
    });
    var recentJourneys = Object.keys(journeys).map(function(k) { return journeys[k]; })
        .sort(function(a, b) { return (b.timestamp || '').localeCompare(a.timestamp || ''); })
        .slice(0, 50);

    // ── Browser & OS breakdown ──
    var browsers = {};
    var oses = {};
    var browserSessions = {};
    allEvents.forEach(function(e) {
        if (browserSessions[e.session_id]) return;
        browserSessions[e.session_id] = true;
        browsers[e.browser || 'Other'] = (browsers[e.browser || 'Other'] || 0) + 1;
        oses[e.os || 'Other'] = (oses[e.os || 'Other'] || 0) + 1;
    });

    return successResponse_({
        summary: {
            total_visitors: uniqueSessions,
            total_page_views: pageViews.length,
            avg_session_duration: avgSessionDuration,
            bounce_rate: bounceRate,
            pages_per_session: pagesPerSession
        },
        devices: devices,
        browsers: browsers,
        oses: oses,
        page_performance: pagePerformance,
        locations: locationBreakdown,
        referrers: referrerBreakdown,
        click_maps: clickMaps,
        daily_trend: trend,
        journeys: recentJourneys,
        total_events: allEvents.length
    });
}
