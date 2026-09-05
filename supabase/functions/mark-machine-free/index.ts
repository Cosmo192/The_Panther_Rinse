import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request body' }, 400);
  const { machine_id, qr_token } = body as Record<string, unknown>;
  if (typeof machine_id !== 'string' || typeof qr_token !== 'string') {
    return json({ error: 'machine_id and qr_token are required strings' }, 400);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Server configuration error' }, 500);
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: machine, error: findError } = await supabase.from('machines')
    .select('id, qr_token').eq('id', machine_id).maybeSingle();
  if (findError) return json({ error: 'Unable to look up machine' }, 500);
  if (!machine) return json({ error: 'Machine not found' }, 404);
  if (machine.qr_token !== qr_token) return json({ error: 'Invalid QR token' }, 401);

  const { data: updated, error } = await supabase.from('machines')
    .update({ status: 'free' }).eq('id', machine_id).eq('qr_token', qr_token)
    .select('id').maybeSingle();
  if (error) {
    console.error('Machine update failed', error);
    return json({ error: 'Unable to update machine' }, 500);
  }
  if (!updated) return json({ error: 'Machine not found' }, 404);
  return json({ success: true, machine_id: updated.id });
});
