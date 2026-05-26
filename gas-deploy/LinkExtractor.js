/**
 * LinkExtractor.gs — URL-Based Prospect Extraction Engine
 * 
 * Server-side module that fetches URLs via UrlFetchApp and extracts
 * business contact details for CRM prospect creation.
 * 
 * Supported sources:
 *   - Google Maps listings
 *   - Company websites
 *   - Facebook business pages
 *   - Google Search result pages
 * 
 * Includes deduplication check against existing CRM records
 * and bulk Google Maps search for batch prospecting.
 */

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER — Single URL Extraction
// ═══════════════════════════════════════════════════════════

function handleExtractFromUrl(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var url = (payload.url || '').trim();
    if (!url) return errorResponse_('Please provide a URL.');

    // Normalize URL — add https:// if missing
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    try {
        var sourceType = detectSourceType_(url);
        var extracted = {};

        switch (sourceType) {
            case 'google_maps':
                extracted = extractFromGoogleMaps_(url);
                break;
            case 'facebook':
                extracted = extractFromFacebook_(url);
                break;
            case 'google_search':
                extracted = extractFromGoogleSearch_(url);
                break;
            default:
                extracted = extractFromWebsite_(url);
                break;
        }

        extracted.source_type = sourceType;
        extracted.source_url = url;

        // Clean up extracted data
        extracted = cleanExtracted_(extracted);

        // Check if we got anything useful
        var hasData = extracted.name || extracted.phone || extracted.email;
        if (!hasData) {
            return successResponse_({
                extracted: extracted,
                success: false,
                message: "Couldn't extract details from this link. Try a different link or add manually."
            });
        }

        return successResponse_({
            extracted: extracted,
            success: true,
            message: 'Data extracted successfully.'
        });

    } catch (err) {
        Logger.log('[LinkExtractor] Extraction error: ' + err.message);
        return successResponse_({
            extracted: { source_url: url },
            success: false,
            message: "Couldn't extract details from this link. The page may be down, private, or structured differently. Try a different link or add manually."
        });
    }
}

// ═══════════════════════════════════════════════════════════
// DEDUPLICATION CHECK
// ═══════════════════════════════════════════════════════════

function handleCheckDuplicate(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var phone = normalizePhone_(payload.phone || '');
    var name = (payload.name || '').trim().toLowerCase();
    var company = (payload.company || '').trim().toLowerCase();

    if (!phone && !name && !company) {
        return successResponse_({ isDuplicate: false, existingClient: null });
    }

    var clients = sheetToObjects_(SHEETS.CLIENTS);
    var match = null;

    for (var i = 0; i < clients.length; i++) {
        var c = clients[i];
        if ((c.status || '').toLowerCase() === 'deleted') continue;

        // Phone match — strongest signal
        if (phone && normalizePhone_(c.phone || '') === phone) {
            match = c;
            break;
        }

        // Business name match — fuzzy (case-insensitive, strip common suffixes)
        var cName = normalizeBizName_(c.name || '');
        var cCompany = normalizeBizName_(c.company || '');
        var searchName = normalizeBizName_(name);
        var searchCompany = normalizeBizName_(company);

        if (searchName && (cName === searchName || cCompany === searchName)) {
            match = c;
            break;
        }
        if (searchCompany && (cName === searchCompany || cCompany === searchCompany)) {
            match = c;
            break;
        }
    }

    return successResponse_({
        isDuplicate: !!match,
        existingClient: match ? {
            client_id: match.client_id,
            name: match.name,
            company: match.company,
            phone: match.phone,
            email: match.email,
            address: match.address,
            prospect_stage: match.prospect_stage,
            created_at: match.created_at,
            added_by: match.added_by
        } : null
    });
}

// ═══════════════════════════════════════════════════════════
// BULK SEARCH — Google Maps Query
// ═══════════════════════════════════════════════════════════

function handleBulkSearch(payload) {
    var auth = requireStaff_(payload.token);
    if (auth.error) return auth.error;

    var query = (payload.query || '').trim();
    if (!query) return errorResponse_('Please provide a search query.');

    try {
        // Construct Google Maps search URL
        var searchUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(query);

        var response = fetchUrl_(searchUrl);
        if (!response) {
            return successResponse_({
                results: [],
                success: false,
                message: 'Could not fetch search results. Try a different query.'
            });
        }

        var html = response.getContentText();
        var results = parseMapsSearchResults_(html);

        // Cap at 20 results
        results = results.slice(0, 20);

        return successResponse_({
            results: results,
            success: results.length > 0,
            query: query,
            count: results.length,
            message: results.length > 0
                ? 'Found ' + results.length + ' businesses.'
                : 'No businesses found for this search. Try a different query.'
        });

    } catch (err) {
        Logger.log('[LinkExtractor] Bulk search error: ' + err.message);
        return successResponse_({
            results: [],
            success: false,
            message: 'Search failed: ' + err.message
        });
    }
}

// ═══════════════════════════════════════════════════════════
// SOURCE TYPE DETECTION
// ═══════════════════════════════════════════════════════════

function detectSourceType_(url) {
    var lower = url.toLowerCase();

    if (lower.indexOf('google.com/maps') > -1 ||
        lower.indexOf('maps.google.com') > -1 ||
        lower.indexOf('goo.gl/maps') > -1 ||
        lower.indexOf('maps.app.goo.gl') > -1) {
        return 'google_maps';
    }

    if (lower.indexOf('facebook.com') > -1 ||
        lower.indexOf('fb.com') > -1) {
        return 'facebook';
    }

    if (lower.indexOf('google.com/search') > -1 ||
        (lower.indexOf('google.com') > -1 && lower.indexOf('?q=') > -1)) {
        return 'google_search';
    }

    return 'website';
}

// ═══════════════════════════════════════════════════════════
// EXTRACTION ENGINES
// ═══════════════════════════════════════════════════════════

/**
 * Extract from Google Maps listing URL.
 * Maps pages embed structured JSON with business data.
 */
function extractFromGoogleMaps_(url) {
    var html = fetchUrlText_(url);
    if (!html) return {};

    var data = {};

    // Business name — try multiple patterns
    // Pattern 1: <meta property="og:title" content="...">
    var ogTitle = extractMeta_(html, 'og:title');
    if (ogTitle) {
        // Strip " - Google Maps" suffix
        data.name = ogTitle.replace(/\s*[-–—]\s*Google\s*Maps$/i, '').trim();
    }

    // Pattern 2: aria-label on the main heading
    if (!data.name) {
        var ariaName = extractPattern_(html, /aria-label="([^"]{2,80})"/);
        if (ariaName && ariaName.length < 80) data.name = ariaName;
    }

    // Address — look for formatted address patterns
    var addressPatterns = [
        // Common Maps patterns with address in JSON-like structures
        /"formatted_address"\s*:\s*"([^"]+)"/,
        /,"([^"]*(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Blvd|Highway|Hwy|Close|Crescent|Circle|Way|Terrace|Place|Court)[^"]*?)"/i,
        // Ghana-specific address patterns
        /"([^"]*(?:Accra|Kumasi|Tema|Tamale|Takoradi|Cape Coast|Sunyani|Koforidua|Ho |Bolgatanga|Wa )[^"]*?)"/i,
    ];
    for (var i = 0; i < addressPatterns.length; i++) {
        var addr = extractPattern_(html, addressPatterns[i]);
        if (addr && addr.length > 5 && addr.length < 200) {
            data.address = decodeHtmlEntities_(addr);
            break;
        }
    }

    // Phone number(s) — look for phone patterns in page
    var phones = extractPhones_(html);
    if (phones.length > 0) data.phone = phones[0];
    if (phones.length > 1) data.phone_alt = phones.slice(1).join(', ');

    // Website link — extract from Maps data
    var websitePatterns = [
        /"website"\s*:\s*"(https?:\/\/[^"]+)"/,
        /href="(https?:\/\/(?!(?:www\.)?google\.com|maps\.google|accounts\.google|support\.google|policies\.google)[^"]+)"[^>]*>.*?(?:website|visit|web|site)/i,
    ];
    for (var w = 0; w < websitePatterns.length; w++) {
        var website = extractPattern_(html, websitePatterns[w]);
        if (website && website.indexOf('google.com') === -1) {
            data.website = website;
            break;
        }
    }

    // Star rating
    var ratingMatch = html.match(/(\d+\.?\d*)\s*(?:stars?|rating)/i) ||
                      html.match(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/);
    if (ratingMatch) data.star_rating = parseFloat(ratingMatch[1]);

    // Review count
    var reviewMatch = html.match(/(\d[\d,]*)\s*(?:reviews?|ratings?)/i) ||
                      html.match(/"reviewCount"\s*:\s*"?(\d+)"?/);
    if (reviewMatch) data.review_count = parseInt(reviewMatch[1].replace(/,/g, ''));

    // Business category
    var catPatterns = [
        /"category"\s*:\s*"([^"]+)"/,
        /"@type"\s*:\s*"([^"]+)"/,
    ];
    for (var c = 0; c < catPatterns.length; c++) {
        var cat = extractPattern_(html, catPatterns[c]);
        if (cat && cat !== 'LocalBusiness' && cat.length < 60) {
            data.business_category = cat;
            break;
        }
    }

    // Opening hours
    var hoursMatch = html.match(/"openingHours"\s*:\s*(\[[^\]]+\])/);
    if (hoursMatch) {
        try {
            var hours = JSON.parse(hoursMatch[1]);
            data.opening_hours = hours.join('; ');
        } catch (e) {
            // Hours may not be valid JSON, try raw extraction
            var rawHours = extractPattern_(html, /"openingHours"\s*:\s*"([^"]+)"/);
            if (rawHours) data.opening_hours = rawHours;
        }
    }

    // GPS coordinates — extract from URL or page data
    var gpsMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) ||
                   html.match(/"latitude"\s*:\s*(-?\d+\.?\d*)\s*,\s*"longitude"\s*:\s*(-?\d+\.?\d*)/);
    if (gpsMatch) {
        data.gps_lat = parseFloat(gpsMatch[1]);
        data.gps_lng = parseFloat(gpsMatch[2]);
    }

    // Email — sometimes in Maps pages
    var emails = extractEmails_(html);
    if (emails.length > 0) data.email = emails[0];

    data.google_maps_url = url;
    data.source = 'Google Maps';

    return data;
}

/**
 * Extract from a company website.
 * Parses the main page and attempts /contact page for more data.
 */
function extractFromWebsite_(url) {
    var html = fetchUrlText_(url);
    if (!html) return {};

    var data = {};

    // Business name — from page title or OG tags
    var ogTitle = extractMeta_(html, 'og:title');
    var pageTitle = extractPattern_(html, /<title[^>]*>([^<]{2,120})<\/title>/i);

    if (ogTitle) {
        data.name = ogTitle.split(/\s*[-–—|]\s*/)[0].trim();
    } else if (pageTitle) {
        data.name = decodeHtmlEntities_(pageTitle.split(/\s*[-–—|]\s*/)[0].trim());
    }

    // OG description — may hint at industry
    var ogDesc = extractMeta_(html, 'og:description') || extractMeta_(html, 'description');
    if (ogDesc) data.about = ogDesc.substring(0, 300);

    // Phone numbers
    var phones = extractPhones_(html);
    if (phones.length > 0) data.phone = phones[0];
    if (phones.length > 1) data.phone_alt = phones.slice(1).join(', ');

    // Email addresses
    var emails = extractEmails_(html);
    if (emails.length > 0) data.email = emails[0];

    // Physical address — look for common patterns
    var addrMatch = html.match(/(?:address|location|find us|visit us)[^<]{0,100}?(?:<[^>]*>)*\s*([^<]{10,200})/i);
    if (addrMatch) {
        var cleanAddr = addrMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        if (cleanAddr.length > 5 && cleanAddr.length < 200) data.address = cleanAddr;
    }

    // Social media links
    var socialLinks = {};
    var socialPatterns = {
        facebook: /href="(https?:\/\/(?:www\.)?facebook\.com\/[^"]+)"/i,
        twitter: /href="(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"]+)"/i,
        instagram: /href="(https?:\/\/(?:www\.)?instagram\.com\/[^"]+)"/i,
        linkedin: /href="(https?:\/\/(?:www\.)?linkedin\.com\/[^"]+)"/i,
        youtube: /href="(https?:\/\/(?:www\.)?youtube\.com\/[^"]+)"/i,
        tiktok: /href="(https?:\/\/(?:www\.)?tiktok\.com\/[^"]+)"/i,
    };
    for (var platform in socialPatterns) {
        var socialMatch = html.match(socialPatterns[platform]);
        if (socialMatch) socialLinks[platform] = socialMatch[1];
    }
    if (Object.keys(socialLinks).length > 0) {
        data.social_links = JSON.stringify(socialLinks);
    }

    // Try to fetch /contact page for more data
    try {
        var baseUrl = url.replace(/\/$/, '');
        var contactPaths = ['/contact', '/contact-us', '/about', '/about-us'];
        for (var p = 0; p < contactPaths.length; p++) {
            var contactUrl = baseUrl + contactPaths[p];
            var contactHtml = fetchUrlText_(contactUrl);
            if (contactHtml && contactHtml.length > 500) {
                // Extract additional phone/email/address from contact page
                if (!data.phone) {
                    var contactPhones = extractPhones_(contactHtml);
                    if (contactPhones.length > 0) data.phone = contactPhones[0];
                }
                if (!data.email) {
                    var contactEmails = extractEmails_(contactHtml);
                    if (contactEmails.length > 0) data.email = contactEmails[0];
                }
                if (!data.address) {
                    var contactAddr = contactHtml.match(/(?:address|location|find us|visit us|office)[^<]{0,100}?(?:<[^>]*>)*\s*([^<]{10,200})/i);
                    if (contactAddr) {
                        var cleanContactAddr = contactAddr[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                        if (cleanContactAddr.length > 5) data.address = cleanContactAddr;
                    }
                }
                break; // Only try one contact page
            }
        }
    } catch (e) {
        // Contact page fetch failed — that's fine, we have the main page data
    }

    data.website = url;
    data.source = 'Website';

    return data;
}

/**
 * Extract from Facebook business page.
 * Uses Open Graph meta tags and page HTML patterns.
 */
function extractFromFacebook_(url) {
    var html = fetchUrlText_(url);
    if (!html) return {};

    var data = {};

    // Business name — from OG tags
    data.name = extractMeta_(html, 'og:title') || '';
    if (data.name) {
        data.name = data.name.replace(/\s*[-–—|]\s*Facebook.*$/i, '').trim();
    }

    // Page description
    var desc = extractMeta_(html, 'og:description') || extractMeta_(html, 'description');
    if (desc) data.about = desc.substring(0, 300);

    // Category
    var catMatch = html.match(/"category"\s*:\s*"([^"]+)"/i) ||
                   html.match(/data-key="category"[^>]*>([^<]+)/i);
    if (catMatch) data.business_category = catMatch[1];

    // Phone
    var phones = extractPhones_(html);
    if (phones.length > 0) data.phone = phones[0];

    // Email
    var emails = extractEmails_(html);
    if (emails.length > 0) data.email = emails[0];

    // Address
    var addrMatch = html.match(/"address"\s*:\s*\{([^}]+)\}/);
    if (addrMatch) {
        var street = extractPattern_(addrMatch[1], /"streetAddress"\s*:\s*"([^"]+)"/);
        var city = extractPattern_(addrMatch[1], /"addressLocality"\s*:\s*"([^"]+)"/);
        var parts = [street, city].filter(Boolean);
        if (parts.length > 0) data.address = parts.join(', ');
    }

    // Website link from the page
    var websiteMatch = html.match(/"website"\s*:\s*"(https?:\/\/[^"]+)"/i);
    if (websiteMatch && websiteMatch[1].indexOf('facebook.com') === -1) {
        data.website = websiteMatch[1];
    }

    data.source = 'Facebook';

    return data;
}

/**
 * Extract from Google Search results / knowledge panel.
 */
function extractFromGoogleSearch_(url) {
    var html = fetchUrlText_(url);
    if (!html) return {};

    var data = {};

    // Knowledge panel business name
    var kpName = html.match(/data-attrid="title"[^>]*>([^<]+)/i) ||
                 html.match(/<h2[^>]*data-attrid="title"[^>]*>([^<]+)/i) ||
                 html.match(/<div[^>]*class="[^"]*kp-header[^"]*"[^>]*>[^<]*<[^>]*>([^<]+)/i);
    if (kpName) data.name = decodeHtmlEntities_(kpName[1].trim());

    // Phone from knowledge panel
    var phones = extractPhones_(html);
    if (phones.length > 0) data.phone = phones[0];

    // Website from knowledge panel
    var kpWebsite = html.match(/data-attrid="[^"]*website[^"]*"[^>]*href="(https?:\/\/[^"]+)"/i);
    if (kpWebsite) data.website = kpWebsite[1];

    // Address from knowledge panel
    var kpAddr = html.match(/data-attrid="[^"]*address[^"]*"[^>]*>(?:<[^>]*>)*([^<]+)/i);
    if (kpAddr) data.address = decodeHtmlEntities_(kpAddr[1].trim());

    // Hours from knowledge panel
    var kpHours = html.match(/data-attrid="[^"]*hours[^"]*"[^>]*>(?:<[^>]*>)*([^<]+)/i);
    if (kpHours) data.opening_hours = decodeHtmlEntities_(kpHours[1].trim());

    data.source = 'Google Search';

    return data;
}

// ═══════════════════════════════════════════════════════════
// BULK SEARCH — Parse Google Maps search results
// ═══════════════════════════════════════════════════════════

function parseMapsSearchResults_(html) {
    var results = [];

    // Google Maps search results are embedded in complex JS.
    // We look for business name + address + rating patterns in the raw HTML.
    // Each business appears in a pattern like: ["BusinessName",null,null,null,"Address","Rating"]
    // This is fragile but works for current Maps format.

    // Strategy: find all business-like entries by looking for patterns
    // with names followed by rating/review data
    var namePattern = /\["([^"]{2,80})(?:",null){1,5}[^[]*?"(\d\.?\d*)\s*(?:stars?)?[^[]*?(\d[\d,]*)\s*(?:reviews?)/gi;
    var match;
    var seen = {};

    while ((match = namePattern.exec(html)) !== null && results.length < 20) {
        var name = match[1];
        if (seen[name] || name.length < 2) continue;
        seen[name] = true;

        results.push({
            name: name,
            star_rating: parseFloat(match[2]) || 0,
            review_count: parseInt((match[3] || '0').replace(/,/g, '')) || 0,
            source: 'Google Maps',
        });
    }

    // Fallback: try simpler name extraction if the pattern above doesn't match
    if (results.length === 0) {
        // Look for aria-label patterns with business names
        var ariaPattern = /aria-label="([^"]{3,60})"\s*[^>]*role="(?:article|heading)"/gi;
        while ((match = ariaPattern.exec(html)) !== null && results.length < 20) {
            var ariaName = match[1].trim();
            if (seen[ariaName] || ariaName.length < 3) continue;
            seen[ariaName] = true;

            results.push({
                name: ariaName,
                source: 'Google Maps',
            });
        }
    }

    return results;
}

// ═══════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════

/** Fetch URL content with retry and error handling */
function fetchUrl_(url) {
    var options = {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    };

    for (var attempt = 0; attempt <= 2; attempt++) {
        try {
            var response = UrlFetchApp.fetch(url, options);
            var code = response.getResponseCode();
            if (code >= 200 && code < 400) return response;
            if (code >= 500 && attempt < 2) {
                Utilities.sleep(1000 * Math.pow(2, attempt));
                continue;
            }
            return null;
        } catch (e) {
            if (attempt < 2) {
                Utilities.sleep(1000 * Math.pow(2, attempt));
                continue;
            }
            Logger.log('[LinkExtractor] Fetch failed for ' + url + ': ' + e.message);
            return null;
        }
    }
    return null;
}

/** Fetch URL and return text content */
function fetchUrlText_(url) {
    var response = fetchUrl_(url);
    return response ? response.getContentText() : '';
}

/** Extract content from meta tags */
function extractMeta_(html, property) {
    // Try property attribute
    var match = html.match(new RegExp('<meta[^>]*(?:property|name)="' + property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*content="([^"]*)"', 'i'));
    if (match) return decodeHtmlEntities_(match[1]);

    // Try reversed order (content before property)
    match = html.match(new RegExp('<meta[^>]*content="([^"]*)"[^>]*(?:property|name)="' + property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'i'));
    if (match) return decodeHtmlEntities_(match[1]);

    return '';
}

/** Extract first regex match */
function extractPattern_(html, regex) {
    var match = html.match(regex);
    return match ? match[1] : '';
}

/** Extract phone numbers from HTML */
function extractPhones_(html) {
    // Strip HTML tags for cleaner phone extraction
    var text = html.replace(/<[^>]*>/g, ' ');

    // Ghana phone patterns: 0XX-XXX-XXXX, +233-XX-XXX-XXXX, 0XXXXXXXXX
    // International: +1-XXX-XXX-XXXX, (XXX) XXX-XXXX
    var phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3}[-.\s]?\d{3,4}/g;
    var matches = text.match(phoneRegex) || [];

    // Deduplicate and filter out numbers that are too short or look like dates/years
    var seen = {};
    var phones = [];
    for (var i = 0; i < matches.length; i++) {
        var clean = matches[i].replace(/[^\d+]/g, '');
        // Must be at least 9 digits (Ghana numbers) and not look like a year
        if (clean.length >= 9 && clean.length <= 15 && !seen[clean]) {
            seen[clean] = true;
            phones.push(matches[i].trim());
        }
    }

    return phones.slice(0, 5); // Max 5 phone numbers
}

/** Extract email addresses from HTML */
function extractEmails_(html) {
    // Look in mailto: links first
    var mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi) || [];
    var emails = mailtoMatches.map(function(m) { return m.replace('mailto:', '').toLowerCase(); });

    // Then look for email patterns in text
    var text = html.replace(/<[^>]*>/g, ' ');
    var emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    var textEmails = text.match(emailRegex) || [];

    // Merge and deduplicate, filter out common false positives
    var seen = {};
    var IGNORE_DOMAINS = ['example.com', 'email.com', 'sentry.io', 'w3.org', 'schema.org',
        'googleapis.com', 'google.com', 'gstatic.com', 'facebook.com', 'fb.com'];

    var allEmails = emails.concat(textEmails.map(function(e) { return e.toLowerCase(); }));
    var result = [];
    for (var i = 0; i < allEmails.length; i++) {
        var em = allEmails[i].toLowerCase();
        var domain = em.split('@')[1] || '';
        if (!seen[em] && IGNORE_DOMAINS.indexOf(domain) === -1) {
            seen[em] = true;
            result.push(em);
        }
    }

    return result.slice(0, 3); // Max 3 emails
}

/** Normalize phone number for comparison */
function normalizePhone_(phone) {
    if (!phone) return '';
    var clean = phone.replace(/[^\d]/g, '');
    // Ghana: convert 0XX to 233XX
    if (clean.length === 10 && clean.charAt(0) === '0') {
        clean = '233' + clean.substring(1);
    }
    return clean;
}

/** Normalize business name for dedup comparison */
function normalizeBizName_(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/\b(ltd|limited|llc|inc|incorporated|co|company|plc|gh|ghana)\b/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Clean extracted data — trim, remove empty strings */
function cleanExtracted_(data) {
    var clean = {};
    for (var key in data) {
        if (!data.hasOwnProperty(key)) continue;
        var val = data[key];
        if (typeof val === 'string') {
            val = val.trim();
            if (val) clean[key] = val;
        } else if (val !== null && val !== undefined) {
            clean[key] = val;
        }
    }
    return clean;
}

/** Decode HTML entities */
function decodeHtmlEntities_(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, function(_, code) { return String.fromCharCode(code); });
}
