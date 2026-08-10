const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyplaceholder';

// Middleware: Authenticate user requests via JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// Helper: Log Admin/User Activity
async function logActivity(userId, action, details) {
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (error) {
    console.error('[Activity Log] Error recording log:', error.message);
  }
}

// Helper to fetch from Microsoft Graph with comprehensive request and response logging
async function fetchMicrosoftGraph(url, accessToken, method = 'GET', options = {}) {
  // Parse query parameters
  const urlObj = new URL(url);
  const queryParams = urlObj.search || 'None';
  
  // Extract search text if any
  let searchText = 'None';
  if (urlObj.pathname.includes('search')) {
    const searchMatch = urlObj.pathname.match(/search\(q='(.*)'\)/);
    if (searchMatch) {
      searchText = searchMatch[1];
    } else {
      const q = urlObj.searchParams.get('q');
      if (q) searchText = q;
    }
  }

  // Extract drive ID or item ID if present in the URL path
  let driveId = 'None';
  let itemId = 'None';
  let formId = 'None';

  const pathParts = urlObj.pathname.split('/');
  const itemsIndex = pathParts.indexOf('items');
  if (itemsIndex !== -1 && pathParts[itemsIndex + 1]) {
    itemId = pathParts[itemsIndex + 1];
    formId = itemId;
  }

  const drivesIndex = pathParts.indexOf('drives');
  if (drivesIndex !== -1 && pathParts[drivesIndex + 1]) {
    driveId = pathParts[drivesIndex + 1];
  } else if (urlObj.pathname.includes('/me/drive')) {
    driveId = 'me/drive';
  }

  // Decode authorization scopes from access token JWT
  let scopes = 'None';
  try {
    const decoded = jwt.decode(accessToken);
    if (decoded && decoded.scp) {
      scopes = decoded.scp;
    }
  } catch (err) {
    // Ignore decoding failure
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const responseStatus = response.status;
  
  // Clone response to parse JSON safely for logging
  const clone = response.clone();
  let responseData = null;
  try {
    responseData = await clone.json();
  } catch (err) {
    // Response not JSON or empty
  }

  let itemsReturnedCount = 0;
  let returnedItemIds = [];
  let returnedItemNames = [];

  if (responseData) {
    if (Array.isArray(responseData.value)) {
      itemsReturnedCount = responseData.value.length;
      returnedItemIds = responseData.value.map(item => item.id || 'N/A');
      returnedItemNames = responseData.value.map(item => item.name || 'N/A');
    } else if (responseData.id) {
      itemsReturnedCount = 1;
      returnedItemIds = [responseData.id];
      returnedItemNames = [responseData.name || responseData.displayName || responseData.userPrincipalName || 'N/A'];
    }
  }

  console.log('========== MICROSOFT GRAPH ==========');
  console.log(`Request URL: ${url}`);
  console.log(`HTTP Method: ${method}`);
  console.log(`Query parameters: ${queryParams}`);
  console.log(`Drive ID (if any): ${driveId}`);
  console.log(`Item ID (if any): ${itemId}`);
  console.log(`Form ID (if any): ${formId}`);
  console.log(`Search text: ${searchText}`);
  console.log(`Authorization scope: ${scopes}`);
  console.log(`Status: ${responseStatus}`);
  console.log(`Number of items returned: ${itemsReturnedCount}`);
  console.log(`IDs of returned items: ${JSON.stringify(returnedItemIds)}`);
  console.log(`Names of returned items: ${JSON.stringify(returnedItemNames)}`);
  console.log(`Response JSON: ${JSON.stringify(responseData, null, 2)}`);
  console.log('====================================');

  // Check itemNotFound error
  const isItemNotFound = (responseStatus === 404) || 
                         (responseData && responseData.error && responseData.error.code === 'itemNotFound');
  
  if (isItemNotFound) {
    let itemSource = 'Unknown';
    if (url.includes('/workbook/tables/') && (url.includes('/columns') || url.includes('/rows'))) {
      itemSource = 'previous API response';
    } else if (url.includes('/workbook/tables')) {
      itemSource = 'stored database data';
    } else if (url.includes('/items/')) {
      itemSource = 'stored database data';
    }

    console.log(`[Microsoft Graph Error: itemNotFound]`);
    console.log(`Which endpoint caused it: ${url}`);
    console.log(`Which item ID was requested: ${itemId}`);
    console.log(`Which drive ID was used: ${driveId}`);
    console.log(`Whether the item ID came from the previous API response or from stored database data: ${itemSource}`);
  }

  return response;
}

// Helper to refresh Microsoft OAuth Access Token if expired
async function getValidMicrosoftAccessToken(userId) {
  const [integrations] = await pool.query(
    'SELECT * FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
    [`user-${userId}`]
  );
  if (integrations.length === 0) {
    throw new Error('User Microsoft Account is not connected.');
  }

  const integration = integrations[0];
  const now = Date.now();

  // If token is still valid (with a 1-minute buffer), return it
  if (integration.token_expiry && (Number(integration.token_expiry) - 60000) > now) {
    return integration.access_token;
  }

  // If expired and we have a refresh token, refresh it!
  if (!integration.refresh_token) {
    throw new Error('OAuth token expired and no refresh token available. Reconnection required.');
  }

  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  try {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || 'Unable to refresh Microsoft access token.');
    }

    const nextExpiry = Date.now() + (data.expires_in * 1000);

    // Save refreshed token to database
    await pool.query(
      'UPDATE project_integrations SET access_token = ?, token_expiry = ? WHERE id = ?',
      [data.access_token, nextExpiry, integration.id]
    );

    return data.access_token;
  } catch (err) {
    throw new Error('Failed to refresh Microsoft OAuth credentials: ' + err.message);
  }
}

// ─── Integration Mode Cache ────────────────────────────────────────────────────
// Maps userId (number) → 'excel' | 'native_forms'
// Persists for the process lifetime; cleared on reconnect or disconnect.
const integrationModeCache = new Map();

// Detect whether this Microsoft account supports the native Forms API or requires
// the Excel workbook path.  Returns 'native_forms' or 'excel'.  Never throws —
// always defaults to 'excel' on any network failure or unexpected response.
async function detectAndCacheIntegrationMode(userId, accessToken) {
  if (integrationModeCache.has(userId)) {
    const cached = integrationModeCache.get(userId);
    console.log(`[Mode Detection] Cache hit for user ${userId}: ${cached}`);
    return cached;
  }

  let mode = 'excel';
  let reason = 'default fallback';

  try {
    const formsCheckResponse = await fetch('https://graph.microsoft.com/beta/me/forms', {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    const formsStatus = formsCheckResponse.status;
    let formsBody = {};
    try { formsBody = await formsCheckResponse.json(); } catch (_) {}

    console.log(`[Mode Detection] GET /beta/me/forms → HTTP ${formsStatus}`);

    if (formsStatus === 200) {
      mode = 'native_forms';
      reason = 'GET /beta/me/forms returned HTTP 200 — Microsoft 365 Work/School account confirmed';
    } else if (formsStatus === 400 && formsBody?.error?.message?.includes('MSA accounts')) {
      mode = 'excel';
      reason = `Microsoft confirmed Personal MSA: "${formsBody.error.message}"`;
    } else {
      mode = 'excel';
      reason = `GET /beta/me/forms returned HTTP ${formsStatus} (${formsBody?.error?.code || 'unknown'}) — defaulting to Excel for safety`;
    }
  } catch (err) {
    mode = 'excel';
    reason = `Forms API probe network error (${err.message}) — defaulting to Excel`;
  }

  console.log(`[Mode Detection] Resolved: user=${userId} mode=${mode} reason=${reason}`);
  integrationModeCache.set(userId, mode);
  return mode;
}
// ────────────────────────────────────────────────────────────────────────────────

// 1. Redirect to Microsoft Login flow
router.get('/auth', async (req, res) => {
  const { projectId, userId } = req.query;
  const stateVal = userId ? `user-${userId}` : (projectId ? projectId : 'unknown');

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = process.env.MICROSOFT_CALLBACK_URL;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !redirectUri) {
    return res.status(500).send('Microsoft OAuth configuration is missing in server environment variables.');
  }

  const scopes = [
    'openid',
    'email',
    'profile',
    'offline_access',
    'Files.Read',
    'Sites.Read.All'
  ].join(' ');

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state: stateVal,
    response_mode: 'query',
    prompt: 'select_account'
  }).toString();

  return res.redirect(authUrl);
});

// 2. OAuth Callback
router.get('/callback', async (req, res) => {
  const { code, state: stateVal, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (error || !code || !stateVal) {
    console.error('[Microsoft OAuth] Authorization denied or failed:', error);
    return res.redirect(`${frontendUrl}/workspace/projects?error=microsoft_auth_failed`);
  }

  try {
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.MICROSOFT_CALLBACK_URL
      })
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[Microsoft OAuth] Code exchange failed:', tokens);
      return res.redirect(`${frontendUrl}/workspace/projects?error=microsoft_token_exchange_failed`);
    }

    const expiryTime = Date.now() + (tokens.expires_in * 1000);

    // Query User Email Address from Microsoft Graph me endpoint
    let profile = {};
    try {
      const meResponse = await fetchMicrosoftGraph('https://graph.microsoft.com/v1.0/me', tokens.access_token);
      profile = await meResponse.json();
    } catch (e) {
      console.error('[Microsoft OAuth] Graph me query failed:', e.message);
    }

    // Query User Drive details from Microsoft Graph me/drive endpoint
    let drive = {};
    try {
      const driveResponse = await fetchMicrosoftGraph('https://graph.microsoft.com/v1.0/me/drive', tokens.access_token);
      drive = await driveResponse.json();
    } catch (e) {
      console.error('[Microsoft OAuth] Graph me/drive query failed:', e.message);
    }

    // Decode ID Token
    let idToken = {};
    try {
      if (tokens.id_token) {
        idToken = jwt.decode(tokens.id_token) || {};
      }
    } catch (e) {
      console.error('[Microsoft OAuth] ID token decoding failed:', e.message);
    }

    // Stage 7: Token Inspection
    try {
      const decodedToken = jwt.decode(tokens.access_token);
      console.log('========== TOKEN INSPECTION ==========');
      if (decodedToken) {
        console.log(`scp: ${decodedToken.scp || 'None'}`);
        console.log(`aud: ${decodedToken.aud || 'None'}`);
        console.log(`iss: ${decodedToken.iss || 'None'}`);
        console.log(`tid: ${decodedToken.tid || 'None'}`);
        console.log(`preferred_username: ${decodedToken.preferred_username || 'None'}`);
      } else {
        console.log('Failed to decode access token (may be an opaque or encrypted token).');
      }
      console.log(`scopes from token response: ${tokens.scope || 'None'}`);
      if (tokens.id_token) {
        console.log(`ID Token claims: ${JSON.stringify(idToken)}`);
      }
      console.log('======================================');
    } catch (tokenErr) {
      console.error('Error during token inspection:', tokenErr.message);
    }

    // Temporarily log profile for debugging
    console.log('========== MICROSOFT ACCOUNT ==========');
    console.log(`displayName: ${profile.displayName || idToken.name || 'None'}`);
    console.log(`mail: ${profile.mail || idToken.email || 'None'}`);
    console.log(`userPrincipalName: ${profile.userPrincipalName || idToken.preferred_username || 'None'}`);
    console.log(`id: ${profile.id || idToken.oid || idToken.sub || 'None'}`);
    console.log(`preferred_username: ${profile.preferred_username || idToken.preferred_username || 'None'}`);
    console.log('=====================================');

    // Account Resolution Rules: drive owner email, then drive creator/modifier, then mail/userPrincipalName, then ID Token claims
    let userEmail = 'connected-account@microsoft.com';
    if (drive.owner && drive.owner.user && drive.owner.user.email) {
      userEmail = drive.owner.user.email;
    } else if (drive.createdBy && drive.createdBy.user && drive.createdBy.user.email) {
      userEmail = drive.createdBy.user.email;
    } else if (drive.lastModifiedBy && drive.lastModifiedBy.user && drive.lastModifiedBy.user.email) {
      userEmail = drive.lastModifiedBy.user.email;
    } else if (profile.mail && profile.mail.trim()) {
      userEmail = profile.mail.trim();
    } else if (profile.userPrincipalName && profile.userPrincipalName.trim()) {
      userEmail = profile.userPrincipalName.trim();
    } else if (idToken.email && idToken.email.trim()) {
      userEmail = idToken.email.trim();
    } else if (idToken.preferred_username && idToken.preferred_username.trim()) {
      userEmail = idToken.preferred_username.trim();
    }

    console.log('========== MICROSOFT EMAIL RESOLUTION TRACE ==========');
    console.log(`OAuth callback email: ${userEmail}`);
    console.log(`ID Token email: ${idToken.email || 'None'}`);
    console.log(`profile.mail: ${profile.mail || 'None'}`);
    console.log(`profile.userPrincipalName: ${profile.userPrincipalName || 'None'}`);
    console.log(`profile.preferred_username: ${profile.preferred_username || idToken.preferred_username || 'None'}`);
    console.log(`profile.email: ${profile.email || 'None'}`);
    console.log(`drive.owner.user.email: ${drive.owner?.user?.email || 'None'}`);
    console.log(`drive.createdBy.user.email: ${drive.createdBy?.user?.email || 'None'}`);
    console.log(`drive.lastModifiedBy.user.email: ${drive.lastModifiedBy?.user?.email || 'None'}`);
    console.log(`Database email: ${userEmail}`);
    console.log('======================================================');

    // Immediately before saving log details for debugging
    console.log('========== DATABASE ==========');
    console.log(`Email Stored: ${userEmail}`);
    console.log(`Display Name Stored: ${profile.displayName || idToken.name || 'Microsoft User'}`);
    console.log(`Microsoft ID Stored: ${profile.id || idToken.oid || idToken.sub || 'None'}`);
    console.log('================================');

    // Insert or update integration row for the user
    await pool.query(
      `INSERT INTO project_integrations 
        (project_id, integration_type, email, access_token, refresh_token, token_expiry) 
       VALUES (?, 'microsoft_forms', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         email = VALUES(email),
         access_token = VALUES(access_token),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         token_expiry = VALUES(token_expiry)`,
      [stateVal, userEmail, tokens.access_token, tokens.refresh_token || null, expiryTime]
    );

    // Clear cached integration mode so it is re-detected after reconnect
    if (stateVal.startsWith('user-')) {
      const reconnectUserId = parseInt(stateVal.replace('user-', ''), 10);
      if (!isNaN(reconnectUserId)) integrationModeCache.delete(reconnectUserId);
    }

    return res.redirect(`${frontendUrl}/workspace/projects?connected=microsoft`);

  } catch (err) {
    console.error('[Microsoft OAuth] Callback runtime error:', err.message);
    return res.redirect(`${frontendUrl}/workspace/projects?error=microsoft_callback_failed`);
  }
});

// 3. Status Query (User-level and project-level configurations)
router.get('/status/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const [userRows] = await pool.query(
      'SELECT email FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [`user-${userId}`]
    );

    if (userRows.length === 0) {
      return res.json({ connected: false });
    }

    const [projRows] = await pool.query(
      'SELECT connected_form_id, connected_form_title, primary_key_column, last_sync_time FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [projectId]
    );

    const projectIntegration = projRows[0] || {};
    return res.json({
      connected: true,
      email: userRows[0].email,
      lastSyncTime: projectIntegration.last_sync_time,
      connectedFormId: projectIntegration.connected_form_id,
      connectedFormTitle: projectIntegration.connected_form_title,
      primaryKeyColumn: projectIntegration.primary_key_column
    });

  } catch (error) {
    console.error('[API Error] Get microsoft status failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving status.' });
  }
});

// 4. Detach Form from Project
router.post('/disconnect/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    await pool.query(
      `UPDATE project_integrations 
       SET connected_form_id = NULL, connected_form_title = NULL 
       WHERE project_id = ? AND integration_type = 'microsoft_forms'`,
      [projectId]
    );

    return res.json({
      success: true,
      message: 'Successfully detached Microsoft Form from this project.'
    });

  } catch (error) {
    console.error('[API Error] Detach microsoft form failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error detaching form.' });
  }
});

// 5. Get User Connection Status
router.get('/user-status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT email FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [`user-${userId}`]
    );

    if (rows.length === 0) {
      return res.json({ connected: false });
    }

    const integrationRow = rows[0];
    const email = integrationRow.email;
    const responseObject = { connected: true, email };

    console.log("========== USER STATUS ==========");
    console.log("Database row:", integrationRow);
    console.log("Database email:", integrationRow.email);
    console.log("Response email:", email);
    console.log("Returning JSON:", responseObject);
    console.log("=================================");

    return res.json(responseObject);
  } catch (error) {
    console.error('[API Error] Fetch microsoft user connection status failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving status.' });
  }
});

// 6. Disconnect User Connection
router.post('/disconnect-user', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query(
      'DELETE FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [`user-${userId}`]
    );

    // Clear cached integration mode so it is re-detected on the next connection
    integrationModeCache.delete(userId);

    return res.json({
      success: true,
      message: 'Successfully disconnected Microsoft Forms account.'
    });
  } catch (error) {
    console.error('[API Error] Disconnect microsoft user connection failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error disconnecting integration.' });
  }
});

// 7. Retrieve Microsoft excel workbooks list in OneDrive
router.get('/forms/:projectId', authenticateToken, async (req, res) => {
  try {
    const accessToken = await getValidMicrosoftAccessToken(req.user.id);

    // Stage 3: Drive Verification
    const driveResponse = await fetchMicrosoftGraph("https://graph.microsoft.com/v1.0/me/drive", accessToken);
    if (!driveResponse.ok) {
      console.log("No accessible OneDrive available");
      return res.status(400).json({
        success: false,
        message: "No accessible OneDrive available"
      });
    }

    // Detect account type (MSA personal → excel, M365 work/school → native_forms)
    const integrationMode = await detectAndCacheIntegrationMode(req.user.id, accessToken);
    console.log(`[Forms Discovery] Integration mode: ${integrationMode}`);

    // ── Microsoft 365 path: use Forms API directly ─────────────────────────────
    if (integrationMode === 'native_forms') {
      try {
        const nativeListResponse = await fetchMicrosoftGraph('https://graph.microsoft.com/beta/me/forms', accessToken);
        if (nativeListResponse.ok) {
          const nativeListData = await nativeListResponse.json();
          if (Array.isArray(nativeListData.value) && nativeListData.value.length > 0) {
            const forms = nativeListData.value.map(form => ({
              id: form.id,
              title: form.title || 'Untitled Microsoft Form',
              modifiedTime: form.lastModifiedDateTime || new Date().toISOString(),
              webViewLink: form.webUrl || ''
            }));
            return res.json({ success: true, forms, source: 'native_forms' });
          }
          // Forms API returned 200 but no forms found yet — fall through to Excel
          console.log('[Forms Discovery] native_forms: Forms API returned 0 forms, falling through to Excel search.');
        } else {
          // API call failed despite mode being native_forms — fall through gracefully
          console.warn('[Forms Discovery] native_forms: Forms API call failed, falling through to Excel search.');
        }
      } catch (nativeErr) {
        console.warn('[Forms Discovery] native_forms: exception, falling through to Excel search:', nativeErr.message);
      }
    }

    // ── Excel path (Personal MSA or native fallback) ───────────────────────────
    // Call Graph API to list all drive items recursively via children traversal (since search(q='') is invalid)
    let allItems = [];
    try {
      const childrenResponse = await fetchMicrosoftGraph("https://graph.microsoft.com/v1.0/me/drive/root/children", accessToken);
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        allItems = childrenData.value || [];
      }
    } catch (e) {
      console.error('[Workbook Discovery] Root children fetch failed:', e.message);
    }

    let allFiles = [];
    let foldersToProcess = [];

    // Separate folders and files
    for (const item of allItems) {
      if (item.folder) {
        foldersToProcess.push(item);
      } else {
        allFiles.push(item);
      }
    }

    // Process folders up to 2 levels deep to discover Excel files
    let depth = 0;
    while (foldersToProcess.length > 0 && depth < 2) {
      const nextFolders = [];
      for (const folder of foldersToProcess) {
        try {
          const folderChildrenResp = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${folder.id}/children`, accessToken);
          if (folderChildrenResp.ok) {
            const folderChildrenData = await folderChildrenResp.json();
            const children = folderChildrenData.value || [];
            for (const child of children) {
              if (child.folder) {
                nextFolders.push(child);
              } else {
                allFiles.push(child);
              }
            }
          }
        } catch (err) {
          console.warn(`[Workbook Discovery] Failed to list children for folder ${folder.name}:`, err.message);
        }
      }
      foldersToProcess = nextFolders;
      depth++;
    }

    // Filter Excel workbooks by extension or MIME type
    const excelFiles = allFiles.filter(item => {
      const isXlsx = item.name && item.name.toLowerCase().endsWith('.xlsx');
      const isExcelMime = item.file && item.file.mimeType && (
        item.file.mimeType.toLowerCase() === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        item.file.mimeType.toLowerCase() === 'application/vnd.ms-excel'
      );
      return isXlsx || isExcelMime;
    });

    if (excelFiles.length > 0) {
      // Log every workbook candidate found
      console.log('========== MICROSOFT WORKBOOK CANDIDATES ==========');
      excelFiles.forEach(file => {
        console.log(`File name: ${file.name}`);
        console.log(`File ID: ${file.id}`);
        console.log(`MIME type: ${file.file?.mimeType || 'Unknown'}`);
        console.log(`Parent folder: ${file.parentReference?.name || file.parentReference?.id || 'Root'}`);
        console.log(`Web URL: ${file.webUrl || 'None'}`);
        console.log('--------------------------------------------------');
      });
      console.log('==================================================');

      const forms = excelFiles.map(file => ({
        id: file.id,
        title: file.name.replace('.xlsx', ''),
        modifiedTime: file.lastModifiedDateTime,
        webViewLink: file.webUrl
      }));

      return res.json({ success: true, forms, source: 'excel' });
    }

    // No Excel workbooks found in OneDrive.
    return res.json({ success: true, forms: [] });

  } catch (error) {
    console.error('[API Error] Fetch Microsoft Forms list failed:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching Microsoft Forms.' });
  }
});

// 8. Connect specific Excel Form to Project
router.post('/forms/connect/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { formId, formTitle } = req.body;

  if (!formId) {
    return res.status(400).json({ success: false, message: 'Missing formId parameter.' });
  }

  try {
    await pool.query(
      `INSERT INTO project_integrations 
        (project_id, integration_type, email, access_token, refresh_token, token_expiry, connected_form_id, connected_form_title, last_sync_time) 
       VALUES (?, 'microsoft_forms', '', '', '', 0, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE 
         connected_form_id = VALUES(connected_form_id), 
         connected_form_title = VALUES(connected_form_title), 
         last_sync_time = VALUES(last_sync_time)`,
      [projectId, formId, formTitle || 'Untitled Excel Form']
    );

    return res.json({
      success: true,
      message: `Form "${formTitle || 'Untitled'}" successfully attached to this project.`
    });

  } catch (error) {
    console.error('[API Error] Connect Microsoft Form failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error attaching form.' });
  }
});

// 9. Get Microsoft Excel Table Columns (Schema Questions)
router.get('/forms/:projectId/schema', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const accessToken = await getValidMicrosoftAccessToken(req.user.id);
    const [integrations] = await pool.query(
      'SELECT connected_form_id FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [projectId]
    );

    if (integrations.length === 0 || !integrations[0].connected_form_id) {
      return res.status(400).json({ success: false, message: 'No Microsoft Excel Form is connected to this project.' });
    }

    const formId = integrations[0].connected_form_id;

    // Detect account mode: only probe native Forms API for M365 accounts
    const integrationMode = await detectAndCacheIntegrationMode(req.user.id, accessToken);
    console.log(`[Schema] Integration mode: ${integrationMode}`);

    if (integrationMode === 'native_forms') {
      // A. Attempt native Forms questions fetch (Microsoft 365 only)
      let nativeQuestionsSupported = false;
      let questions = [];
      try {
        const nativeQuestionsResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/beta/me/forms/${formId}/questions`, accessToken);
        if (nativeQuestionsResponse.ok) {
          const qData = await nativeQuestionsResponse.json();
          if (qData.value) {
            questions = qData.value.map(q => ({
              key: q.title || q.id,
              name: q.title || q.id
            }));
            nativeQuestionsSupported = true;
          }
        }
      } catch (e) {
        // Fail silently — fall through to Excel workbook columns
      }

      if (nativeQuestionsSupported) {
        return res.json({ success: true, questions });
      }
    }

    // A. List tables in the Excel workbook
    const tablesResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${formId}/workbook/tables`, accessToken);
    const tablesData = await tablesResponse.json();
    if (!tablesResponse.ok || !tablesData.value || tablesData.value.length === 0) {
      return res.status(400).json({ success: false, message: 'No tables found in this Excel sheet. Make sure it contains responses.' });
    }
    const tableName = tablesData.value[0].name || 'Table1';

    // B. Fetch Table columns
    const columnsResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${formId}/workbook/tables/${tableName}/columns`, accessToken);
    const columnsData = await columnsResponse.json();
    if (!columnsResponse.ok) {
      return res.status(400).json({ success: false, message: 'Unable to retrieve columns.' });
    }

    questions = (columnsData.value || []).map(col => ({
      key: col.name,
      name: col.name
    }));

    return res.json({ success: true, questions });

  } catch (error) {
    console.error('[API Error] Fetch Microsoft Form schema failed:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching Excel schema.' });
  }
});

// 10. Set Primary Key for Project
router.post('/forms/:projectId/primary-key', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { primaryKeyColumn } = req.body;

  if (!primaryKeyColumn) {
    return res.status(400).json({ success: false, message: 'Missing primaryKeyColumn parameter.' });
  }

  try {
    await pool.query(
      `UPDATE project_integrations 
       SET primary_key_column = ? 
       WHERE project_id = ? AND integration_type = 'microsoft_forms'`,
      [primaryKeyColumn, projectId]
    );

    return res.json({
      success: true,
      message: 'Primary key configuration successfully configured.'
    });

  } catch (error) {
    console.error('[API Error] Configure microsoft primary key failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saving primary key config.' });
  }
});

// 11. Synchronize Responses dynamically
router.post('/forms/:projectId/sync', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { strategy } = req.body; // 'replace' | 'keep'
  let formId = 'Unknown';
  let syncStage = 'Initialization';

  if (!strategy) {
    return res.status(400).json({ success: false, message: 'Missing strategy configuration.' });
  }

  try {
    console.log('========== MICROSOFT SYNC START ==========');
    console.log(`User: ${req.user.id}`);
    console.log(`Project: ${projectId}`);

    syncStage = 'Access Token Retrieval';
    const [userRows] = await pool.query(
      'SELECT email FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [`user-${req.user.id}`]
    );
    const emailAccount = userRows.length > 0 ? userRows[0].email : 'Unknown email';

    const [integrations] = await pool.query(
      'SELECT connected_form_id, connected_form_title, primary_key_column FROM project_integrations WHERE project_id = ? AND integration_type = "microsoft_forms"',
      [projectId]
    );

    if (integrations.length === 0 || !integrations[0].connected_form_id) {
      throw { status: 400, message: 'No Microsoft Excel Form connected to this project.' };
    }

    const integration = integrations[0];
    formId = integration.connected_form_id;
    const formTitle = integration.connected_form_title || 'Excel Form';
    const primaryKeyCol = integration.primary_key_column;

    if (!primaryKeyCol) {
      throw { status: 400, message: 'Primary key column is not set.' };
    }

    console.log(`OAuth Status: Token lookup started`);
    const accessToken = await getValidMicrosoftAccessToken(req.user.id);
    console.log(`OAuth Status: Valid access token obtained`);

    // Detect account mode before choosing sync path
    const integrationMode = await detectAndCacheIntegrationMode(req.user.id, accessToken);
    console.log(`[Microsoft Sync] Integration mode: ${integrationMode}`);

    // Scope check locally via decoding JWT
    let grantedScopes = [];
    try {
      const decoded = jwt.decode(accessToken);
      if (decoded && decoded.scp) {
        grantedScopes = decoded.scp.split(' ');
      }
    } catch (e) {
      console.warn('[Microsoft Sync] Could not decode scopes from token.');
    }
    const requiredScopes = ['Files.Read', 'Sites.Read.All'];
    const missingScopes = requiredScopes.filter(s => !grantedScopes.includes(s));
    if (grantedScopes.length > 0 && missingScopes.length > 0) {
      throw { status: 403, message: `Insufficient scopes. Missing: ${missingScopes.join(', ')}` };
    }

    console.log(`Microsoft Graph Status: Authenticated`);
    console.log(`Workbook ID: ${formId}`);
    console.log(`Form ID: ${formId}`);

    // A. Attempt native Forms questions and responses sync (Microsoft 365 only)
    let nativeResponsesSupported = false;
    let nativeQuestions = [];
    let nativeResponses = [];

    if (integrationMode === 'native_forms') {
      try {
        console.log('[Microsoft Forms] Attempting native Forms discovery...');
        const nativeQuestionsResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/beta/me/forms/${formId}/questions`, accessToken);
        const nativeResponsesResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/beta/me/forms/${formId}/responses`, accessToken);
        if (nativeQuestionsResponse.ok && nativeResponsesResponse.ok) {
          const qData = await nativeQuestionsResponse.json();
          const rData = await nativeResponsesResponse.json();
          if (qData.value && rData.value) {
            nativeQuestions = qData.value;
            nativeResponses = rData.value;
            nativeResponsesSupported = true;
            console.log('[Microsoft Forms] Native Forms supported: YES');
          } else {
            console.log('[Microsoft Forms] Native Forms supported: NO');
            console.log('[Microsoft Forms] Reason for fallback: Empty questions or responses value');
            console.log('[Microsoft Forms] Calling existing Excel implementation...');
          }
        } else {
          console.log('[Microsoft Forms] Native Forms supported: NO');
          console.log(`[Microsoft Forms] Reason for fallback: Questions HTTP ${nativeQuestionsResponse.status}, Responses HTTP ${nativeResponsesResponse.status}`);
          console.log('[Microsoft Forms] Calling existing Excel implementation...');
        }
      } catch (e) {
        console.log('[Microsoft Forms] Native Forms supported: NO');
        console.log(`[Microsoft Forms] Reason for fallback: ${e.message}`);
        console.log('[Microsoft Forms] Calling existing Excel implementation...');
      }
    } else {
      console.log('[Microsoft Sync] Mode is excel — skipping native Forms probe, using Excel workbook sync.');
    }

    if (nativeResponsesSupported) {
      syncStage = 'Native Forms Sync';
      const questionsList = [];
      for (const q of nativeQuestions) {
        const colName = q.title || q.id;
        questionsList.push({ key: colName, name: colName });
        await pool.query(
          `INSERT INTO project_columns (project_id, column_key, column_name) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE column_name = VALUES(column_name)`,
          [projectId, colName, colName]
        );
      }

      let importedCount = 0;
      let updatedCount = 0;
      let ignoredCount = 0;

      for (const resp of nativeResponses) {
        const answers = {};
        if (Array.isArray(resp.answers)) {
          resp.answers.forEach(ans => {
            const q = nativeQuestions.find(nq => nq.id === ans.questionId);
            const colName = q ? (q.title || q.id) : ans.questionId;
            answers[colName] = ans.answer1 || '';
          });
        }
        
        let recordKey = answers[primaryKeyCol] || `resp_${resp.id}`;
        if (!recordKey.trim()) {
          recordKey = `resp_${resp.id}`;
        }

        const [existing] = await pool.query(
          'SELECT id FROM project_records WHERE project_id = ? AND record_key = ?',
          [projectId, recordKey]
        );

        if (existing.length === 0) {
          const [insertRes] = await pool.query(
            `INSERT INTO project_records (project_id, record_key, source_type, source_name) 
             VALUES (?, ?, 'microsoft_form', ?)`,
            [projectId, recordKey, formTitle]
          );
          const recordId = insertRes.insertId;
          for (const q of questionsList) {
            const val = answers[q.key] || '';
            await pool.query(
              'INSERT INTO record_values (record_id, column_key, column_value) VALUES (?, ?, ?)',
              [recordId, q.key, val]
            );
          }
          importedCount++;
        } else {
          const recordId = existing[0].id;
          if (strategy === 'replace') {
            await pool.query(
              `UPDATE project_records SET source_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              [formTitle, recordId]
            );
            for (const q of questionsList) {
              const val = answers[q.key] || '';
              await pool.query(
                `INSERT INTO record_values (record_id, column_key, column_value) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE column_value = VALUES(column_value)`,
                [recordId, q.key, val]
              );
            }
            updatedCount++;
          } else {
            ignoredCount++;
          }
        }
      }

      await pool.query(
        `UPDATE project_integrations 
         SET last_sync_time = CURRENT_TIMESTAMP 
         WHERE project_id = ? AND integration_type = 'microsoft_forms'`,
        [projectId]
      );

      console.log('Database Inserts (Native): ' + importedCount);
      console.log('Database Updates (Native): ' + updatedCount);
      console.log('Completed (Native)');
      console.log('========== MICROSOFT SYNC SUCCESS (NATIVE) ==========');

      return res.json({
        success: true,
        summary: {
          total: nativeResponses.length,
          imported: importedCount,
          updated: updatedCount,
          ignored: ignoredCount
        }
      });
    }

    // A. Fetch Tables
    syncStage = 'Excel Tables Discovery';
    const tablesResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${formId}/workbook/tables`, accessToken);
    const tablesData = await tablesResponse.json();
    if (!tablesResponse.ok || !tablesData.value || tablesData.value.length === 0) {
      throw { status: tablesResponse.status || 400, message: 'No tables discovered in target Excel workbook.' };
    }
    const tableName = tablesData.value[0].name || 'Table1';

    // B. Fetch Columns for schema mapping
    syncStage = 'Excel Columns Fetch';
    const columnsResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${formId}/workbook/tables/${tableName}/columns`, accessToken);
    const columnsData = await columnsResponse.json();
    if (!columnsResponse.ok) {
      throw { status: columnsResponse.status || 400, message: 'Unable to retrieve columns.' };
    }
    const columns = columnsData.value || [];
    console.log(`Questions Found: ${columns.length}`);

    // Map and insert dynamic columns
    const questionsList = [];
    for (const col of columns) {
      questionsList.push({ key: col.name, name: col.name });
      console.log(`Executing INSERT on project_columns for key: ${col.name}`);
      await pool.query(
        `INSERT INTO project_columns (project_id, column_key, column_name) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE column_name = VALUES(column_name)`,
        [projectId, col.name, col.name]
      );
    }

    // C. Fetch Rows
    syncStage = 'Excel Rows Fetch';
    const rowsResponse = await fetchMicrosoftGraph(`https://graph.microsoft.com/v1.0/me/drive/items/${formId}/workbook/tables/${tableName}/rows`, accessToken);
    const rowsData = await rowsResponse.json();
    if (!rowsResponse.ok) {
      throw { status: rowsResponse.status || 400, message: 'Unable to retrieve rows from Excel.' };
    }
    const rows = rowsData.value || [];
    console.log(`Responses Found: ${rows.length}`);
    console.log(`Primary Key: ${primaryKeyCol}`);

    let importedCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;
    let duplicateCount = 0;

    const uniqueKeys = [];
    // Count duplicates for reporting
    for (const row of rows) {
      const rowValues = row.values[0] || [];
      const answers = {};
      columns.forEach((col, idx) => {
        answers[col.name] = rowValues[idx] !== undefined && rowValues[idx] !== null ? String(rowValues[idx]) : '';
      });
      const recordKey = answers[primaryKeyCol] || `empty_pk_${row.index}`;
      if (uniqueKeys.includes(recordKey)) {
        duplicateCount++;
      } else {
        uniqueKeys.push(recordKey);
      }
    }
    console.log(`Duplicates: ${duplicateCount}`);

    // D. Process database entries
    syncStage = 'Database Write';
    for (const row of rows) {
      const rowValues = row.values[0] || [];
      const answers = {};
      columns.forEach((col, idx) => {
        answers[col.name] = rowValues[idx] !== undefined && rowValues[idx] !== null ? String(rowValues[idx]) : '';
      });

      let recordKey = answers[primaryKeyCol] || '';
      if (!recordKey.trim()) {
        recordKey = `empty_pk_${row.index}`;
      }

      // Check existing
      const [existing] = await pool.query(
        'SELECT id FROM project_records WHERE project_id = ? AND record_key = ?',
        [projectId, recordKey]
      );

      if (existing.length === 0) {
        console.log(`Executing INSERT on project_records for key: ${recordKey}`);
        const [insertRes] = await pool.query(
          `INSERT INTO project_records (project_id, record_key, source_type, source_name) 
           VALUES (?, ?, 'microsoft_form', ?)`,
          [projectId, recordKey, formTitle]
        );
        const recordId = insertRes.insertId;

        for (const q of questionsList) {
          const val = answers[q.key] || '';
          await pool.query(
            'INSERT INTO record_values (record_id, column_key, column_value) VALUES (?, ?, ?)',
            [recordId, q.key, val]
          );
        }
        importedCount++;
      } else {
        const recordId = existing[0].id;
        if (strategy === 'replace') {
          console.log(`Executing UPDATE on project_records for key: ${recordKey}`);
          await pool.query(
            `UPDATE project_records 
             SET source_name = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [formTitle, recordId]
          );

          for (const q of questionsList) {
            const val = answers[q.key] || '';
            await pool.query(
              `INSERT INTO record_values (record_id, column_key, column_value) 
               VALUES (?, ?, ?) 
               ON DUPLICATE KEY UPDATE column_value = VALUES(column_value)`,
              [recordId, q.key, val]
            );
          }
          updatedCount++;
        } else {
          ignoredCount++;
        }
      }
    }

    // Update last sync time
    await pool.query(
      `UPDATE project_integrations 
       SET last_sync_time = CURRENT_TIMESTAMP 
       WHERE project_id = ? AND integration_type = 'microsoft_forms'`,
      [projectId]
    );

    console.log('Database Inserts: ' + importedCount);
    console.log('Database Updates: ' + updatedCount);
    console.log('Completed');
    console.log('========== MICROSOFT SYNC SUCCESS ==========');

    return res.json({
      success: true,
      summary: {
        total: rows.length,
        imported: importedCount,
        updated: updatedCount,
        ignored: ignoredCount
      }
    });

  } catch (error) {
    console.error('========== MICROSOFT SYNC FAILED ==========');
    console.error(`HTTP Status: ${error.status || 500}`);
    console.error(`Microsoft Graph Error: ${error.message || error}`);
    console.error(`Stack Trace: ${error.stack || 'No Stack Trace Available'}`);
    console.error(`Stage where failure occurred: ${syncStage}`);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Error processing sync.' });
  }
});

// 12. Fetch All Extracted Project Records & Columns for Microsoft Forms
router.get('/forms/:projectId/records', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const [columns] = await pool.query(
      'SELECT column_key, column_name FROM project_columns WHERE project_id = ?',
      [projectId]
    );

    const [records] = await pool.query(
      `SELECT id, record_key, source_type, source_name, updated_at 
       FROM project_records 
       WHERE project_id = ? AND source_type = 'microsoft_form'`,
      [projectId]
    );

    const formattedRecords = [];
    for (const rec of records) {
      const [vals] = await pool.query(
        'SELECT column_key, column_value FROM record_values WHERE record_id = ?',
        [rec.id]
      );

      const recordValues = {};
      vals.forEach(v => {
        recordValues[v.column_key] = v.column_value;
      });

      formattedRecords.push({
        id: rec.id,
        recordKey: rec.record_key,
        sourceType: rec.source_type,
        sourceName: rec.source_name,
        updatedAt: rec.updated_at,
        values: recordValues
      });
    }

    return res.json({
      success: true,
      columns: columns.map(c => ({ key: c.column_key, name: c.column_name })),
      records: formattedRecords
    });

  } catch (error) {
    console.error('[API Error] Fetch Microsoft records failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching records.' });
  }
});

// DIAGNOSTIC ENDPOINT — read-only, no writes, no DB changes, no existing code touched
// Stages: 1=account type  2=Forms API support  3=endpoint enumeration  4=conclusion
router.get('/diagnose', authenticateToken, async (req, res) => {
  const report = {
    stage1_account: {},
    stage2_forms_api_support: {},
    stage3_endpoints: [],
    stage4_conclusion: {}
  };

  let accessToken;
  try {
    accessToken = await getValidMicrosoftAccessToken(req.user.id);
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Could not retrieve access token: ' + e.message });
  }

  // ─── STAGE 1: Account type ───────────────────────────────────────────────────
  console.log('\n========== MICROSOFT DIAGNOSE – STAGE 1: ACCOUNT TYPE ==========');

  const probe = async (url) => {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    let body = {};
    try { body = await r.json(); } catch (_) {}
    return { status: r.status, ok: r.ok, body };
  };

  // /me — identity
  const me = await probe('https://graph.microsoft.com/v1.0/me');
  console.log(`GET /me  →  HTTP ${me.status}`);
  console.log('Response JSON:', JSON.stringify(me.body, null, 2));

  const upn = me.body.userPrincipalName || '';
  const isPersonal = upn.toLowerCase().endsWith('#ext#@') ||
                     upn.toLowerCase().includes('outlook.com') ||
                     upn.toLowerCase().includes('hotmail.com') ||
                     upn.toLowerCase().includes('live.com');
  const accountType = isPersonal ? 'Personal Microsoft Account (MSA)' : 'Work / School Account (Entra ID / AAD)';

  // Decode token for tenant
  let tenantId = 'Unknown';
  try {
    const dec = jwt.decode(accessToken);
    if (dec && dec.tid) tenantId = dec.tid;
  } catch (_) {}

  report.stage1_account = {
    upn,
    displayName: me.body.displayName || 'N/A',
    accountType,
    tenantId,
    meHttpStatus: me.status
  };

  console.log('Account type:', accountType);
  console.log('Tenant ID:', tenantId);
  console.log('================================================================\n');

  // ─── STAGE 2: Does this account support Forms? ───────────────────────────────
  console.log('========== MICROSOFT DIAGNOSE – STAGE 2: FORMS API SUPPORT ==========');

  const endpointsToProbe = [
    { label: 'Beta /me/forms (personal Forms list)',           url: 'https://graph.microsoft.com/beta/me/forms' },
    { label: 'Beta /me/forms?$top=1 (paged)',                 url: 'https://graph.microsoft.com/beta/me/forms?$top=1' },
    { label: 'Beta /me/insights/used (activity insights)',    url: 'https://graph.microsoft.com/beta/me/insights/used?$top=1' },
    { label: 'v1.0 /me/drive (OneDrive root)',                url: 'https://graph.microsoft.com/v1.0/me/drive' },
    { label: 'v1.0 /me/drive/root/children (OneDrive files)', url: 'https://graph.microsoft.com/v1.0/me/drive/root/children?$top=5' },
  ];

  for (const ep of endpointsToProbe) {
    const r = await probe(ep.url);
    const entry = {
      label: ep.label,
      url: ep.url,
      httpStatus: r.status,
      ok: r.ok,
      responseJSON: r.body,
      verdict: ''
    };

    if (r.status === 200) {
      entry.verdict = 'SUPPORTED';
    } else if (r.status === 403) {
      entry.verdict = 'PERMISSION DENIED — scope/consent missing';
    } else if (r.status === 404) {
      entry.verdict = 'ENDPOINT NOT FOUND — unsupported for this account type';
    } else if (r.status === 400) {
      entry.verdict = 'BAD REQUEST — ' + (r.body.error?.message || 'unknown');
    } else if (r.status === 501) {
      entry.verdict = 'NOT IMPLEMENTED — API does not exist for this account type';
    } else {
      entry.verdict = `UNEXPECTED HTTP ${r.status} — ` + (r.body.error?.message || r.body.error?.code || 'unknown');
    }

    console.log(`\n[${ep.label}]`);
    console.log(`  Endpoint tried : ${ep.url}`);
    console.log(`  HTTP Status    : ${r.status}`);
    console.log(`  Verdict        : ${entry.verdict}`);
    console.log(`  Response JSON  : ${JSON.stringify(r.body, null, 2)}`);

    report.stage3_endpoints.push(entry);
  }

  // ─── STAGE 3: Forms support decision ─────────────────────────────────────────
  console.log('\n========== MICROSOFT DIAGNOSE – STAGE 3: FORMS SUPPORT DECISION ==========');

  const formsProbe = report.stage3_endpoints.find(e => e.url.includes('/me/forms'));
  const formsSupported = formsProbe && formsProbe.ok;
  const formsStatus    = formsProbe ? formsProbe.httpStatus : 'N/A';
  const formsError     = formsProbe ? (formsProbe.responseJSON.error?.code || formsProbe.responseJSON.error?.message || 'none') : 'N/A';

  report.stage2_forms_api_support = {
    endpointTried: 'https://graph.microsoft.com/beta/me/forms',
    httpStatus: formsStatus,
    errorCode: formsError,
    supported: formsSupported
  };

  console.log('Forms endpoint HTTP:', formsStatus);
  console.log('Forms supported    :', formsSupported);
  if (!formsSupported) {
    console.log('Failure reason     :', formsError);
  }

  // ─── STAGE 4: Conclusion ──────────────────────────────────────────────────────
  console.log('\n========== MICROSOFT DIAGNOSE – STAGE 4: CONCLUSION ==========');

  let conclusion;
  let failureReason;
  let recommendation;

  if (formsSupported) {
    conclusion = 'Microsoft Forms API IS accessible for this account.';
    failureReason = 'None — direct Forms discovery is possible.';
    recommendation = 'Implement a second discovery path using GET /beta/me/forms.';
  } else if (formsStatus === 403) {
    conclusion = 'Microsoft Forms API EXISTS but this app lacks permission.';
    failureReason = 'Missing OAuth scope — the Azure app registration does not have the Forms permission consented.';
    recommendation = 'Add the Microsoft Forms API permission in the Azure portal and re-consent. No backend code change will fix this.';
  } else if (formsStatus === 404 || formsStatus === 400 || formsStatus === 501) {
    conclusion = 'Microsoft Forms API is NOT supported for this account type.';
    failureReason = isPersonal
      ? 'Personal Microsoft Accounts (Outlook/Live/Hotmail) do not have access to Microsoft Forms via Graph API. ' +
        'The /beta/me/forms endpoint is only available for Microsoft 365 Work or School accounts (Entra ID / AAD). ' +
        'No backend change, scope addition, or code improvement can make this endpoint work for a personal MSA.'
      : 'The Forms endpoint returned an unexpected error for this account.';
    recommendation = isPersonal
      ? 'For personal accounts, Excel workbook synchronization is the ONLY supported path. ' +
        'The existing Excel workflow already handles this correctly. No further changes required.'
      : 'Check the Azure app registration and ensure the account has Microsoft 365 Forms licencing.';
  } else {
    conclusion = `Unexpected result — HTTP ${formsStatus}.`;
    failureReason = formsError;
    recommendation = 'Review the raw response JSON above for details.';
  }

  // Determine which integration mode this account will actually use
  const detectedMode = formsSupported ? 'native_forms' : 'excel';
  const formsErrorMsg = formsProbe ? (formsProbe.responseJSON?.error?.message || '') : '';
  const isMsaConfirmed = !formsSupported && formsStatus === 400 && formsErrorMsg.includes('MSA accounts');
  const modeReason = formsSupported
    ? 'GET /beta/me/forms returned HTTP 200 — Microsoft 365 Work/School account confirmed'
    : isMsaConfirmed
      ? `Microsoft confirmed Personal MSA: "${formsErrorMsg}"`
      : `GET /beta/me/forms returned HTTP ${formsStatus} (${formsError}) — defaulting to Excel for safety`;

  report.stage4_conclusion = {
    formsApiSupported: formsSupported,
    accountType,
    detectedMode,
    selectedIntegrationMode: detectedMode === 'native_forms'
      ? 'Microsoft Forms API (Work/School — Entra ID / AAD)'
      : 'Excel Workbook Sync (Personal MSA — Outlook/Live/Hotmail)',
    modeSelectionReason: modeReason,
    graphEndpointUsed: 'https://graph.microsoft.com/beta/me/forms',
    graphHttpStatus: formsStatus,
    msaConfirmedByMicrosoft: isMsaConfirmed,
    fallbackOccurred: !formsSupported && !isMsaConfirmed,
    conclusion,
    failureReason,
    recommendation,
    existingExcelWorkflowModified: false,
    noCodeChangedByThisEndpoint: true
  };


  console.log('Conclusion  :', conclusion);
  console.log('Failure     :', failureReason);
  console.log('Recommend   :', recommendation);
  console.log('================================================================\n');

  return res.json({ success: true, report });
});

module.exports = router;
