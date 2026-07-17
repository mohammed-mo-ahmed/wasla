import {stops} from '../ai/data/stops';
import {routes} from '../ai/data/routes';
import {busRoutes} from '../ai/data/bus-routes';
import {getSupabase} from './client';
import {getSupabaseAdmin} from './admin-client';

export async function seedStops() {
  const supabase = getSupabase();
  if (!supabase) return {error: 'Supabase not configured', count: 0};

  const rows = stops.map(s => ({
    id: s.id,
    name: s.name,
    name_ar: s.nameAr,
    lat: s.lat,
    lng: s.lng,
    area: s.area,
    lines: s.lines,
    zone: s.zone,
  }));

  const {error} = await supabase
    .from('stops')
    .upsert(rows as any, {onConflict: 'id'});

  if (error) return {error: error.message, count: 0};
  return {error: null, count: rows.length};
}

export async function seedRoutes() {
  const supabase = getSupabase();
  if (!supabase) return {error: 'Supabase not configured', count: 0};

  const rows = routes.map(r => ({
    id: r.id,
    from_id: r.fromId,
    to_id: r.toId,
    from_name: r.fromName,
    to_name: r.toName,
    duration: r.duration,
    cost: r.cost,
    type: r.type,
    line_name: r.lineName,
    transfers: r.transfers,
    steps: r.steps as unknown as Record<string, unknown>[],
  }));

  const {error} = await supabase
    .from('routes')
    .upsert(rows as any, {onConflict: 'id'});

  if (error) return {error: error.message, count: 0};
  return {error: null, count: rows.length};
}

export async function seedBusRoutes() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return {error: 'Supabase not configured (service role key missing)', count: 0};
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Prefer': 'resolution=merge-duplicates',
  };

  const rows = busRoutes.map(r => ({
    line_number: r.lineNumber,
    path: r.path,
    full_path: r.fullPath,
  }));

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/bus_routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const body = await res.text();
      return {error: `HTTP ${res.status}: ${body.slice(0, 300)}`, count: 0};
    }

    return {error: null, count: rows.length};
  } catch (err) {
    return {error: err instanceof Error ? err.message : 'Unknown error', count: 0};
  }
}

export async function seedAll() {
  const stopsResult = await seedStops();
  const routesResult = await seedRoutes();
  const busRoutesResult = await seedBusRoutes();
  return {stops: stopsResult, routes: routesResult, busRoutes: busRoutesResult};
}
