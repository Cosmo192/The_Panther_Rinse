import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Server configuration error' }, 500);
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from('machines')
    .select('id, type, status, in_use_since, created_at');
  if (error) {
    console.error('Machine list failed', error);
    return json({ error: 'Unable to load machines' }, 500);
  }
  const order = (a: { id: string }, b: { id: string }) =>
    Number(a.id.split('_')[1]) - Number(b.id.split('_')[1]);
  return json({
    washers: (data ?? []).filter(row => row.type === 'washer').sort(order),
    dryers: (data ?? []).filter(row => row.type === 'dryer').sort(order),
  });
});
