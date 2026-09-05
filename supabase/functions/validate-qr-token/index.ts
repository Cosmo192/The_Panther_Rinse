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
  const token = new URL(request.url).searchParams.get('token')?.trim();
  if (!token) return json({ valid: false });

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Server configuration error' }, 500);
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from('machines')
    .select('id, type, status').eq('qr_token', token).maybeSingle();
  if (error) {
    console.error('QR validation failed', error);
    return json({ error: 'Unable to validate QR token' }, 500);
  }
  if (!data) return json({ valid: false });
  return json({ valid: true, machine_id: data.id, machine_type: data.type, current_status: data.status });
});
