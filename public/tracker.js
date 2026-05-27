/**
 * ICUNI Labs — Site Analytics Tracker
 * Lightweight, privacy-friendly, cookie-free analytics.
 * ~3KB gzipped. No PII, no fingerprinting.
 */
;(function() {
  'use strict';

  // ── Skip admin panel and localhost dev ──
  var path = location.pathname;
  if (path.indexOf('/_ops') === 0) return;

  // ── Config ──
  var ENDPOINT = '/api/track';
  var BATCH_INTERVAL = 30000; // 30 seconds
  var MAX_CLICKS_PER_PAGE = 50;
  var SCROLL_THROTTLE = 1000;

  // ── Session (random UUID per tab — no persistence across tabs/sessions) ──
  var sessionId = sessionStorage.getItem('_ils') || (function() {
    var id = 'sess_' + crypto.randomUUID();
    sessionStorage.setItem('_ils', id);
    return id;
  })();

  var sessionStart = Date.now();
  var currentPage = location.pathname + location.search;
  var pageEntryTime = Date.now();
  var maxScrollDepth = 0;
  var clickBuffer = [];
  var eventQueue = [];
  var pageSequence = JSON.parse(sessionStorage.getItem('_ilp') || '[]');

  // ── Device Detection ──
  function getDeviceType() {
    var ua = navigator.userAgent;
    if (/Mobi|Android.*Mobile|iPhone|iPod|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return 'phone';
    if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox/') > -1) return 'Firefox';
    if (ua.indexOf('Edg/') > -1) return 'Edge';
    if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera/') > -1) return 'Opera';
    if (ua.indexOf('Chrome/') > -1) return 'Chrome';
    if (ua.indexOf('Safari/') > -1) return 'Safari';
    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/CrOS/i.test(ua)) return 'ChromeOS';
    return 'Other';
  }

  // ── UTM Params ──
  function getUtm() {
    var params = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(k) {
      var v = params.get(k);
      if (v) utm[k] = v;
    });
    return Object.keys(utm).length ? utm : null;
  }

  // ── CSS Selector for clicked element ──
  function getSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    var parts = [];
    var current = el;
    for (var i = 0; i < 4 && current && current !== document.body; i++) {
      var tag = current.tagName.toLowerCase();
      if (current.id) { parts.unshift(tag + '#' + current.id); break; }
      var cls = current.className;
      if (typeof cls === 'string' && cls.trim()) {
        var first = cls.trim().split(/\s+/).slice(0, 2).join('.');
        parts.unshift(tag + '.' + first);
      } else {
        parts.unshift(tag);
      }
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  // ── Session metadata (computed once) ──
  var sessionMeta = {
    device_type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    screen_w: screen.width,
    screen_h: screen.height,
    referrer: document.referrer || '',
    utm: getUtm(),
    lang: navigator.language || ''
  };

  // ── Precise Geolocation (township-level) ──
  // Asks browser for exact coordinates once per session.
  // Falls back to Vercel edge geo headers if denied.
  var preciseGeo = JSON.parse(sessionStorage.getItem('_ilg') || 'null');
  if (!preciseGeo && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        preciseGeo = {
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
          accuracy: Math.round(pos.coords.accuracy)
        };
        sessionStorage.setItem('_ilg', JSON.stringify(preciseGeo));
      },
      function() { /* denied or unavailable — Vercel geo will be used instead */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }

  // ── Queue an event ──
  function queueEvent(type, data) {
    eventQueue.push(Object.assign({
      event_type: type,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      page_url: currentPage,
      page_title: document.title || ''
    }, data || {}));
  }

  // ── Track page view ──
  function trackPageView() {
    // Flush previous page's time-on-page
    if (pageEntryTime && currentPage) {
      var timeOnPage = Math.round((Date.now() - pageEntryTime) / 1000);
      if (timeOnPage > 0) {
        queueEvent('page_exit', {
          page_url: currentPage,
          time_on_page: timeOnPage,
          scroll_depth: maxScrollDepth,
          clicks: clickBuffer.slice()
        });
      }
    }

    currentPage = location.pathname + location.search;
    pageEntryTime = Date.now();
    maxScrollDepth = 0;
    clickBuffer = [];

    // Track page sequence
    if (pageSequence[pageSequence.length - 1] !== currentPage) {
      pageSequence.push(currentPage);
      sessionStorage.setItem('_ilp', JSON.stringify(pageSequence));
    }

    queueEvent('page_view', {
      page_sequence_index: pageSequence.length - 1
    });
  }

  // ── Scroll tracking (throttled) ──
  var scrollTimer = null;
  function onScroll() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function() {
      scrollTimer = null;
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight
      );
      var winHeight = window.innerHeight;
      var depth = docHeight > winHeight ? Math.round((scrollTop + winHeight) / docHeight * 100) : 100;
      if (depth > maxScrollDepth) maxScrollDepth = Math.min(depth, 100);
    }, SCROLL_THROTTLE);
  }

  // ── Click tracking ──
  function onClick(e) {
    if (clickBuffer.length >= MAX_CLICKS_PER_PAGE) return;
    var target = e.target;
    if (!target) return;

    // Relative coordinates as percentages
    var x = Math.round(e.pageX / document.documentElement.scrollWidth * 1000) / 10;
    var y = Math.round(e.pageY / document.documentElement.scrollHeight * 1000) / 10;

    clickBuffer.push({
      x: x,
      y: y,
      target: getSelector(target),
      text: (target.textContent || '').slice(0, 50).trim(),
      ts: Date.now() - pageEntryTime
    });
  }

  // ── Flush events to server ──
  function flush() {
    if (eventQueue.length === 0) return;

    var payload = {
      session_id: sessionId,
      session_meta: sessionMeta,
      events: eventQueue.splice(0),
      session_duration: Math.round((Date.now() - sessionStart) / 1000),
      page_sequence: pageSequence,
      precise_geo: preciseGeo || null
    };

    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    // sendBeacon is fire-and-forget, works on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      // Fallback for older browsers
      var xhr = new XMLHttpRequest();
      xhr.open('POST', ENDPOINT, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }
  }

  // ── Wire up SPA navigation detection ──
  // Patch pushState/replaceState for SPA navigation
  var originalPush = history.pushState;
  var originalReplace = history.replaceState;

  history.pushState = function() {
    originalPush.apply(this, arguments);
    setTimeout(trackPageView, 0);
  };

  history.replaceState = function() {
    originalReplace.apply(this, arguments);
    // Don't track replaceState as navigation — it's usually cosmetic
  };

  window.addEventListener('popstate', function() {
    setTimeout(trackPageView, 0);
  });

  // ── Event listeners ──
  document.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('click', onClick, { passive: true });

  // ── Periodic flush ──
  var flushInterval = setInterval(flush, BATCH_INTERVAL);

  // ── Flush on page exit ──
  function onExit() {
    // Final page exit event
    var timeOnPage = Math.round((Date.now() - pageEntryTime) / 1000);
    queueEvent('page_exit', {
      time_on_page: timeOnPage,
      scroll_depth: maxScrollDepth,
      clicks: clickBuffer.slice()
    });

    // Session end event
    queueEvent('session_end', {
      session_duration: Math.round((Date.now() - sessionStart) / 1000),
      page_sequence: pageSequence,
      pages_visited: pageSequence.length
    });

    flush();
    clearInterval(flushInterval);
  }

  // visibilitychange is more reliable than beforeunload on mobile
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });

  window.addEventListener('beforeunload', onExit);

  // ── Initial page view ──
  trackPageView();

})();
