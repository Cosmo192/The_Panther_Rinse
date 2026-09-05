import { handlePreflight, jsonResponse, readJsonBody } from './http.ts';
import { supabaseAdmin } from './supabase.ts';
import type { Machine, MachineWithToken } from './types.ts';

type TargetStatus = 'free' | 'in_use';

export async function handleMarkMachine(
  request: Request,
  targetStatus: TargetStatus,
): Promise<Response> {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const body = await readJsonBody(request);
  const machineId = body?.machine_id;
  const qrToken = body?.qr_token;

  if (typeof machineId !== 'string' || typeof qrToken !== 'string') {
    return jsonResponse(
      { error: 'machine_id and qr_token are required strings' },
      400,
    );
  }

  const { data: machine, error: findError } = await supabaseAdmin
    .from('machines')
    .select('id, type, status, in_use_since, created_at, qr_token')
    .eq('id', machineId)
    .maybeSingle<MachineWithToken>();

  if (findError) {
    console.error('Machine lookup failed', findError);
    return jsonResponse({ error: 'Unable to look up machine' }, 500);
  }

  if (!machine) {
    return jsonResponse({ error: 'Machine not found' }, 404);
  }

  if (machine.qr_token !== qrToken) {
    return jsonResponse({ error: 'Invalid QR token' }, 401);
  }

  if (targetStatus === 'in_use' && machine.status === 'in_use') {
    return jsonResponse({ error: 'Machine is already in use' }, 409);
  }

  const update = supabaseAdmin
    .from('machines')
    .update({ status: targetStatus })
    .eq('id', machineId)
    .eq('qr_token', qrToken);

  // Conditional status matching prevents two simultaneous scans from both
  // claiming a free machine.
  const guardedUpdate = targetStatus === 'in_use'
    ? update.eq('status', 'free')
    : update;

  const { data: updated, error: updateError } = await guardedUpdate
    .select('id, type, status, in_use_since, created_at')
    .maybeSingle<Machine>();

  if (updateError) {
    console.error('Machine update failed', updateError);
    return jsonResponse({ error: 'Unable to update machine' }, 500);
  }

  if (!updated) {
    return jsonResponse({ error: 'Machine is already in use' }, 409);
  }

  if (targetStatus === 'free') {
    return jsonResponse({ success: true, machine_id: updated.id });
  }

  const inUseSince = updated.in_use_since!;
  const estimatedDoneTime = new Date(
    new Date(inUseSince).getTime() + 50 * 60 * 1000,
  ).toISOString();

  return jsonResponse({
    success: true,
    machine_id: updated.id,
    in_use_since: inUseSince,
    estimated_done_time: estimatedDoneTime,
  });
}
