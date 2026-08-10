/**
 * run_diagnose.js — one-shot diagnostic runner
 * Reads a real user from the InfoTally DB, mints an app JWT, calls /diagnose, prints raw JSON.
 * Does NOT modify any routes, schemas, or business logic.
 */
'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');
const jwt   = require('jsonwebtoken');
const http  = require('http');

const JWT_SECRET = process.env.JWT_SECRET || 'shouldbea256bitor512bitcryptographically';
const PORT       = process.env.PORT       || 5000;
const ENDPOINT   = `/api/integrations/microsoft/diagnose`;

async function main() {
  // ── 1. Find a user that has a microsoft_forms integration stored ────────────
  const pool = await mysql.createPool({
    host    : process.env.DB_HOST     || '127.0.0.1',
    port    : process.env.DB_PORT     || 3306,
    database: process.env.DB_NAME     || 'InfoTally',
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit   : 1
  });

  const [[row]] = await pool.query(`
    SELECT u.id, u.email, u.full_name
    FROM   users u
    WHERE  EXISTS (
             SELECT 1 FROM project_integrations pi
             WHERE  pi.project_id      = CONCAT('user-', u.id)
             AND    pi.integration_type = 'microsoft_forms'
             AND    pi.access_token    != ''
           )
    LIMIT 1
  `);

  if (!row) {
    console.error('[diagnose] No user with a stored Microsoft token found. Please connect a Microsoft account first.');
    await pool.end();
    process.exit(1);
  }

  console.log(`[diagnose] Using user id=${row.id} email=${row.email}`);

  // ── 2. Mint an InfoTally JWT for that user ──────────────────────────────────
  const token = jwt.sign(
    { id: row.id, email: row.email, fullName: row.full_name },
    JWT_SECRET,
    { expiresIn: '5m' }
  );

  await pool.end();

  // ── 3. Call GET /api/integrations/microsoft/diagnose ───────────────────────
  const raw = await new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port    : PORT,
      path    : ENDPOINT,
      method  : 'GET',
      headers : { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end',  ()    => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });

  // ── 4. Print everything ────────────────────────────────────────────────────
  console.log('\n========== HTTP STATUS ==========');
  console.log(raw.status);

  console.log('\n========== RAW RESPONSE BODY ==========');
  try {
    const parsed = JSON.parse(raw.body);
    console.log(JSON.stringify(parsed, null, 2));
  } catch {
    console.log(raw.body);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
