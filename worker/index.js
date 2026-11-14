import { CATALOG } from './catalog.js';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
  });
}
function error(message, status = 400) { return reply({ error: message }, status); }
function isValidBossMap(bossId, mapId) {
  return Number.isInteger(bossId) && typeof mapId === 'string' &&
    Array.isArray(CATALOG[String(bossId)]) && CATALOG[String(bossId)].includes(mapId);
}
async function parseBody(request) {
  if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) throw new Error('Expected application/json');
  if (Number(request.headers.get('content-length') || 0) > 4096) throw new Error('Request too large');
  const text = await request.text();
  if (text.length > 4096) throw new Error('Request too large');
  const body = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid JSON object');
  return body;
}
function getData(input) {
  const bossId=Number(input.bossId), mapId=input.mapId;
  if (!isValidBossMap(bossId,mapId)) throw new Error('Unknown boss or map');
  return {bossId,mapId};
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: CORS_HEADERS});
    const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    if (path === '/health' && request.method === 'GET') return reply({ok: true, app: 'mvp-boss-timer-api'});
    if (path !== '/api/timers') return error('Not found', 404);
    if (!env.DB) return error('D1 database binding DB is missing', 503);

    try {
      if (request.method === 'GET') {
        const result = await env.DB.prepare(`
          SELECT boss_id AS bossId, map_id AS mapId, tomb_at AS tombAt,
                 spawn_at AS spawnAt, editor, updated_at AS updatedAt
          FROM boss_timers
        `).all();
        return reply({rows: result.results || [], serverNow: new Date().toISOString()});
      }
      if (request.method === 'PUT') {
        const input=await parseBody(request);
        const {bossId,mapId}=getData(input);
        if (typeof input.tombAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(input.tombAt)) return error('Invalid Tomb ISO datetime');
        const deadMs=Date.parse(input.tombAt);
        if (!Number.isFinite(deadMs)) return error('Invalid Tomb datetime');
        const age=Date.now()-deadMs;
        if (age < -5*60*1000 || age > 14*24*60*60*1000) return error('Tomb datetime must be within the last 14 days');
        if (typeof input.editor !== 'string' || input.editor.length>24) return error('Editor name too long');
        const editor=input.editor.trim();
        const tombAt=new Date(deadMs).toISOString(), spawnAt=new Date(deadMs+TWO_HOURS_MS).toISOString(), updatedAt=new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO boss_timers (boss_id, map_id, tomb_at, spawn_at, editor, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(boss_id, map_id) DO UPDATE SET
            tomb_at=excluded.tomb_at, spawn_at=excluded.spawn_at,
            editor=excluded.editor, updated_at=excluded.updated_at
        `).bind(bossId,mapId,tombAt,spawnAt,editor,updatedAt).run();
        return reply({ok:true,row:{bossId,mapId,tombAt,spawnAt,editor,updatedAt}});
      }
      if (request.method === 'DELETE') {
        const input=await parseBody(request);
        const {bossId,mapId}=getData(input);
        await env.DB.prepare('DELETE FROM boss_timers WHERE boss_id = ? AND map_id = ?').bind(bossId,mapId).run();
        return reply({ok:true});
      }
      return error('Method not allowed', 405);
    } catch (e) {
      if (e instanceof SyntaxError || e.message === 'Request too large' || e.message === 'Expected application/json' || e.message === 'Invalid JSON object' || e.message === 'Unknown boss or map') {
        return error(e.message,400);
      }
      console.error('Worker failure', e);
      return error('Server error while accessing D1',500);
    }
  }
};
