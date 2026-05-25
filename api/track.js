/**
 * ICUNI Labs — Analytics Tracking Endpoint
 * Vercel Edge Function that receives tracker events,
 * enriches with geo headers, and forwards to GAS backend.
 */

const GAS_URL = process.env.VITE_GOOGLE_SCRIPT_URL || process.env.GOOGLE_SCRIPT_URL || '';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.json();

    // Validate basic structure
    if (!body.session_id || !body.events || !Array.isArray(body.events)) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Rate limit: max 100 events per batch
    if (body.events.length > 100) {
      body.events = body.events.slice(0, 100);
    }

    // Enrich with Vercel geo headers
    const geo = {
      city: req.headers.get('x-vercel-ip-city') || '',
      country: req.headers.get('x-vercel-ip-country') || '',
      region: req.headers.get('x-vercel-ip-region') || '',
      latitude: req.headers.get('x-vercel-ip-latitude') || '',
      longitude: req.headers.get('x-vercel-ip-longitude') || '',
    };

    // Decode URL-encoded city names (Vercel sends them encoded)
    if (geo.city) {
      try { geo.city = decodeURIComponent(geo.city); } catch(e) {}
    }
    if (geo.region) {
      try { geo.region = decodeURIComponent(geo.region); } catch(e) {}
    }

    // Build enriched payload for GAS
    const gasPayload = {
      action: 'trackEvent',
      session_id: body.session_id,
      session_meta: body.session_meta || {},
      events: body.events,
      session_duration: body.session_duration || 0,
      page_sequence: body.page_sequence || [],
      geo: geo,
    };

    // Fire-and-forget to GAS backend (don't wait for response)
    if (GAS_URL) {
      fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasPayload),
      }).catch(() => {
        // Silently fail — analytics should never break the site
      });
    }

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    // Analytics errors should never surface to the user
    return new Response(null, { status: 204 });
  }
}
