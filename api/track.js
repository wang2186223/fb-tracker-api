export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url: rawUrl } = req.body || {};
  if (!rawUrl) return res.status(400).json({ error: 'Missing url' });

  let parsed = {};
  try {
    const u = new URL(rawUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    parsed = {
      page_path:    u.pathname,
      novel_slug:   parts[1] || null,
      chapter_num:  parseInt((parts[2] || '').replace('chapter-', '')) || null,
      fbclid:       u.searchParams.get('fbclid'),
      utm_source:   u.searchParams.get('utm_source'),
      utm_medium:   u.searchParams.get('utm_medium'),
      utm_campaign: u.searchParams.get('utm_campaign'),
      utm_term:     u.searchParams.get('utm_term'),
      utm_content:  u.searchParams.get('utm_content'),
      utm_id:       u.searchParams.get('utm_id'),
    };
  } catch (e) {
    return res.status(400).json({ error: 'Invalid url' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/url_raw_logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      raw_url: rawUrl,
      country: req.headers['x-vercel-ip-country'] || '',
      ...parsed
    })
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    return res.status(500).json({ error: errText });
  }

  return res.status(200).json({ ok: true });
}
