const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool, initDb } = require('./db');
const { sendWelcomeEmail } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyplaceholder';

app.use(cors());
app.use(express.json());

// Initialize Database on server start
initDb().then(() => {
  console.log('[Server] Database initialized successfully.');
});

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

// Authentication Middlewares
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer <token>"

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

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin credentials required.' });
  }
  next();
}

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// 1. Request Access (Save to database)
app.post('/api/request-access', async (req, res) => {
  const { fullName, institution, department, designation, email, phone, purpose, description } = req.body;

  // Validation
  if (!fullName || !institution || !department || !email || !purpose || !description) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: Full Name, Institution, Department, Email, Purpose, and Description.'
    });
  }

  // Simple Email Regex check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please submit a valid email address.' });
  }

  try {
    // Check if request already exists for this email
    const [existing] = await pool.query('SELECT id FROM access_requests WHERE email = ? AND status = "Pending"', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A pending request already exists for this email address.'
      });
    }

    await pool.query(
      `INSERT INTO access_requests 
       (full_name, institution, department, designation, email, phone, purpose, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [fullName, institution, department, designation || null, email, phone || null, purpose, description]
    );

    console.log(`[API] Access request registered in DB for ${email}`);
    return res.status(201).json({
      success: true,
      message: 'Access request successfully submitted. The administration team will review your application.'
    });
  } catch (error) {
    console.error('[API Error] Request Access failed:', error.message);
    return res.status(500).json({ success: false, message: 'Database error processing request.' });
  }
});

// 2. Sign In (Authenticate user & generate JWT)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const user = users[0];
    
    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is currently inactive.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Generate Token with mustChangePassword claim for secure client validation
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name, mustChangePassword: !!user.must_change_password },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Record login log
    await logActivity(user.id, 'Login', `User ${user.email} successfully logged in.`);

    return res.json({
      success: true,
      mustChangePassword: !!user.must_change_password,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[API Error] Login failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during sign in.' });
  }
});

// 3. Force Password Change (requires authentication token, even if temporary)
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
  }

  try {
    // Fetch user password hash
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const user = users[0];

    // Validate current password
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'The current password you entered is incorrect.' });
    }

    // Hash new password and update database
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?',
      [hash, userId]
    );

    // Record activity log
    await logActivity(userId, 'Force Password Change', `User ${user.email} successfully updated password.`);

    // Generate fresh JWT token with updated mustChangePassword status (set to FALSE)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name, mustChangePassword: false },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      message: 'Password successfully changed.',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[API Error] Change password failed:', error.message);
    return res.status(500).json({ success: false, message: 'Error processing password revision.' });
  }
});

// ==========================================
// PRIVATE ADMIN API ENDPOINTS (Protected)
// ==========================================

// Get Admin Dashboard Metrics
app.get('/api/admin/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [pendingCount] = await pool.query('SELECT COUNT(*) as count FROM access_requests WHERE status = "Pending"');
    const [approvedCount] = await pool.query('SELECT COUNT(*) as count FROM access_requests WHERE status = "Approved"');
    const [rejectedCount] = await pool.query('SELECT COUNT(*) as count FROM access_requests WHERE status = "Rejected"');
    
    const [usersCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [recentLogs] = await pool.query(
      `SELECT l.*, u.full_name as admin_name 
       FROM activity_logs l 
       LEFT JOIN users u ON l.user_id = u.id 
       ORDER BY l.created_at DESC LIMIT 6`
    );
    const [recentUsers] = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );

    return res.json({
      success: true,
      metrics: {
        pendingRequests: pendingCount[0].count,
        approvedRequests: approvedCount[0].count,
        rejectedRequests: rejectedCount[0].count,
        totalUsers: usersCount[0].count
      },
      recentActivity: recentLogs,
      recentUsers: recentUsers
    });
  } catch (error) {
    console.error('[API Error] Get metrics failed:', error.message);
    return res.status(500).json({ success: false, message: 'Database error fetching metrics.' });
  }
});

// Get Access Requests List
app.get('/api/admin/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [requests] = await pool.query('SELECT * FROM access_requests ORDER BY created_at DESC');
    return res.json({ success: true, requests });
  } catch (error) {
    console.error('[API Error] Get requests failed:', error.message);
    return res.status(500).json({ success: false, message: 'Database error fetching requests.' });
  }
});

// Get Users List
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, full_name, email, role, status, created_at, last_login FROM users ORDER BY created_at DESC');
    return res.json({ success: true, users });
  } catch (error) {
    console.error('[API Error] Get users failed:', error.message);
    return res.status(500).json({ success: false, message: 'Database error fetching users.' });
  }
});

// Get Activity Logs List
app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT l.*, u.full_name as user_name 
       FROM activity_logs l 
       LEFT JOIN users u ON l.user_id = u.id 
       ORDER BY l.created_at DESC`
    );
    return res.json({ success: true, logs });
  } catch (error) {
    console.error('[API Error] Get activity logs failed:', error.message);
    return res.status(500).json({ success: false, message: 'Database error fetching logs.' });
  }
});

// Approve Request
app.post('/api/admin/requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.params.id;

  try {
    // 1. Fetch request details
    const [requests] = await pool.query('SELECT * FROM access_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Access request not found.' });
    }

    const request = requests[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request has already been reviewed.' });
    }

    // 2. Generate secure temp password (Temp_XXXXXX)
    const tempPassword = 'Temp_' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const hash = await bcrypt.hash(tempPassword, 10);

    // 3. Insert user profile
    const [userInsert] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status) 
       VALUES (?, ?, ?, 'Teacher', 'Active')`,
      [request.full_name, request.email, hash]
    );

    // 4. Update request status
    await pool.query(
      `UPDATE access_requests 
       SET status = 'Approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? 
       WHERE id = ?`,
      [req.user.id, requestId]
    );

    // 5. Record activity log
    await logActivity(
      req.user.id,
      'Approve Access Request',
      `Approved request ID: ${requestId} for ${request.email}. Temp password: ${tempPassword}`
    );

    // 6. Send welcome email (handles mockup logs automatically if SMTP holds empty placeholders)
    await sendWelcomeEmail(request.email, request.full_name, tempPassword);

    return res.json({
      success: true,
      message: `Request approved successfully. Account created and welcome email dispatched to ${request.email}.`
    });

  } catch (error) {
    console.error('[API Error] Approve request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Error approving request.' });
  }
});

// Reject Request
app.post('/api/admin/requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const requestId = req.params.id;
  const { reason } = req.body;

  try {
    const [requests] = await pool.query('SELECT * FROM access_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Access request not found.' });
    }

    const request = requests[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request has already been reviewed.' });
    }

    // Update request status
    await pool.query(
      `UPDATE access_requests 
       SET status = 'Rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? 
       WHERE id = ?`,
      [req.user.id, requestId]
    );

    // Record activity log
    const logDetails = `Rejected request ID: ${requestId} for ${request.email}.` + (reason ? ` Reason: ${reason}` : '');
    await logActivity(req.user.id, 'Reject Access Request', logDetails);

    return res.json({
      success: true,
      message: `Request for ${request.email} rejected successfully.`
    });

  } catch (error) {
    console.error('[API Error] Reject request failed:', error.message);
    return res.status(500).json({ success: false, message: 'Error rejecting request.' });
  }
});

// Helper to refresh Google OAuth Access Token if expired
async function getValidAccessToken(userId) {
  console.log('[Google Sync] Checking stored OAuth tokens...');
  const [integrations] = await pool.query(
    'SELECT * FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
    [`user-${userId}`]
  );
  if (integrations.length === 0) {
    console.error('[Google Sync Error] ✗ No access token found');
    throw new Error('User Google Account is not connected.');
  }

  console.log('[Google Sync] ✓ Access token found');
  const integration = integrations[0];
  console.log(`[Google Sync] Token expiry: ${integration.token_expiry}`);
  console.log(`[Google Sync] Whether refresh token exists: ${!!integration.refresh_token}`);

  const now = Date.now();

  // If token is still valid (with a 1-minute buffer), return it
  if (integration.token_expiry && (Number(integration.token_expiry) - 60000) > now) {
    return integration.access_token;
  }

  // If expired and we have a refresh token, refresh it!
  if (!integration.refresh_token) {
    console.error('[Google Sync Error] ✗ OAuth token expired and no refresh token available');
    throw new Error('OAuth token expired and no refresh token available. Reconnection required.');
  }

  console.log('[Google Sync] Refreshing Google access token...');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();
    if (!response.ok || !data.access_token) {
      console.error('[Google Sync Error] ✗ Token refresh failed. Google error:', data);
      throw new Error(data.error_description || 'Unable to refresh Google access token.');
    }

    console.log('[Google Sync] ✓ Token refreshed');
    const nextExpiry = Date.now() + (data.expires_in * 1000);

    // Save refreshed token to database
    await pool.query(
      'UPDATE project_integrations SET access_token = ?, token_expiry = ? WHERE id = ?',
      [data.access_token, nextExpiry, integration.id]
    );

    return data.access_token;
  } catch (err) {
    console.error('[Google Sync Error] Error refreshing token:', err.message);
    throw new Error('Failed to refresh Google OAuth session credentials: ' + err.message);
  }
}

// ==========================================
// GOOGLE OAUTH & FORMS INTEGRATION ENDPOINTS
// ==========================================

// 1. Kickstart OAuth Redirect (Public browser entry point)
app.get('/api/integrations/google/auth', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).send('Missing userId query parameter.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).send('Google OAuth client configuration is missing in server environment .env variables.');
  }

  const scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/forms.body.readonly',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state: `user-${userId}`,
    access_type: 'offline',
    prompt: 'consent'
  }).toString();

  return res.redirect(authUrl);
});

// 2. OAuth Callback
app.get('/api/integrations/google/callback', async (req, res) => {
  const { code, state: stateVal, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code || !stateVal) {
    console.error('[Google OAuth] Authorization denied or failed:', error);
    return res.redirect(`${frontendUrl}/workspace/projects?error=google_auth_failed`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL
      })
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) {
      console.error('[Google OAuth] Code exchange failed:', tokens);
      return res.redirect(`${frontendUrl}/workspace/projects?error=google_token_exchange_failed`);
    }

    const expiryTime = Date.now() + (tokens.expires_in * 1000);

    // Query User Email Address from userinfo API
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });
    const profile = await userinfoResponse.json();
    const userEmail = profile.email || 'connected-account@google.com';

    // Insert or update integration row for the user (stateVal is "user-X")
    await pool.query(
      `INSERT INTO project_integrations 
        (project_id, integration_type, email, access_token, refresh_token, token_expiry) 
       VALUES (?, 'google_forms', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         email = VALUES(email),
         access_token = VALUES(access_token),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         token_expiry = VALUES(token_expiry)`,
      [stateVal, userEmail, tokens.access_token, tokens.refresh_token || null, expiryTime]
    );

    // Redirect to frontend projects list
    return res.redirect(`${frontendUrl}/workspace/projects?connected=google`);

  } catch (err) {
    console.error('[Google OAuth] Callback runtime error:', err.message);
    return res.redirect(`${frontendUrl}/workspace/projects?error=google_callback_failed`);
  }
});

// 3. Status Query (Checks user-level account connection and project-level form details)
app.get('/api/integrations/google/status/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    // A. Check user-level connection
    const [userRows] = await pool.query(
      'SELECT email FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
      [`user-${userId}`]
    );

    if (userRows.length === 0) {
      return res.json({ connected: false });
    }

    // B. Get project-level form configurations
    const [projRows] = await pool.query(
      'SELECT connected_form_id, connected_form_title, primary_key_column, last_sync_time FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
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
    console.error('[API Error] Get google integration status failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving status.' });
  }
});

// 4. Detach Form from Project
app.post('/api/integrations/google/disconnect/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    // Detach form configuration parameters but keep record assets intact
    await pool.query(
      `UPDATE project_integrations 
       SET connected_form_id = NULL, connected_form_title = NULL 
       WHERE project_id = ? AND integration_type = 'google_forms'`,
      [projectId]
    );

    return res.json({
      success: true,
      message: 'Successfully detached Google Form from this project.'
    });

  } catch (error) {
    console.error('[API Error] Detach form failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error detaching form.' });
  }
});

// 5. Get User Google Connection Status
app.get('/api/integrations/google/user-status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT email FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
      [`user-${userId}`]
    );

    if (rows.length === 0) {
      return res.json({ connected: false });
    }

    return res.json({ connected: true, email: rows[0].email });
  } catch (error) {
    console.error('[API Error] Fetch user connection status failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving status.' });
  }
});

// 6. Disconnect User Google Integration
app.post('/api/integrations/google/disconnect-user', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query(
      'DELETE FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
      [`user-${userId}`]
    );

    return res.json({
      success: true,
      message: 'Successfully disconnected Google Forms account.'
    });
  } catch (error) {
    console.error('[API Error] Disconnect user connection failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error disconnecting integration.' });
  }
});
// 5. Retrieve Google Forms list in Drive
app.get('/api/integrations/google/forms/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const accessToken = await getValidAccessToken(req.user.id);

    // Call Google Drive API files query
    const driveUrl = 'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
      q: "mimeType='application/vnd.google-apps.form' and trashed=false",
      fields: 'files(id,name,modifiedTime)',
      pageSize: 50
    }).toString();

    const driveResponse = await fetch(driveUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await driveResponse.json();
    if (!driveResponse.ok) {
      console.error('[Google Drive API] Error listing files:', data);
      return res.status(driveResponse.status).json({
        success: false,
        message: data.error?.message || 'Unable to fetch forms list from Google Drive.'
      });
    }

    const forms = (data.files || []).map(file => ({
      id: file.id,
      title: file.name,
      modifiedTime: file.modifiedTime,
      webViewLink: `https://docs.google.com/forms/d/${file.id}/edit`
    }));

    return res.json({ success: true, forms });

  } catch (error) {
    console.error('[API Error] Fetch Google Forms list failed:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching Google Forms.' });
  }
});

// 6. Connect specific Google Form to Project
app.post('/api/integrations/google/forms/connect/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { formId, formTitle } = req.body;

  if (!formId) {
    return res.status(400).json({ success: false, message: 'Missing formId parameter.' });
  }

  try {
    await pool.query(
      `INSERT INTO project_integrations 
        (project_id, integration_type, email, access_token, refresh_token, token_expiry, connected_form_id, connected_form_title, last_sync_time) 
       VALUES (?, 'google_forms', '', '', '', 0, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE 
         connected_form_id = VALUES(connected_form_id), 
         connected_form_title = VALUES(connected_form_title), 
         last_sync_time = VALUES(last_sync_time)`,
      [projectId, formId, formTitle || 'Untitled Form']
    );

    return res.json({
      success: true,
      message: `Form "${formTitle || 'Untitled'}" successfully attached to this project.`
    });

  } catch (error) {
    console.error('[API Error] Connect Google Form failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error attaching form.' });
  }
});

// 7. Get Google Form Schema Questions
app.get('/api/integrations/google/forms/:projectId/schema', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const accessToken = await getValidAccessToken(req.user.id);
    const [integrations] = await pool.query(
      'SELECT connected_form_id FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
      [projectId]
    );

    if (integrations.length === 0 || !integrations[0].connected_form_id) {
      return res.status(400).json({ success: false, message: 'No Google Form is connected to this project.' });
    }

    const formId = integrations[0].connected_form_id;
    const formResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const formData = await formResponse.json();
    if (!formResponse.ok) {
      console.error('[Google Forms API] Error fetching schema:', formData);
      return res.status(formResponse.status).json({
        success: false,
        message: formData.error?.message || 'Unable to retrieve form schema from Google.'
      });
    }

    // Extract questions dynamically
    const questions = [];
    if (formData.items) {
      for (const item of formData.items) {
        if (item.questionItem && item.questionItem.question) {
          questions.push({
            key: item.questionItem.question.questionId,
            name: item.title || 'Untitled Question'
          });
        }
      }
    }

    return res.json({ success: true, questions });

  } catch (error) {
    console.error('[API Error] Fetch Google Form schema failed:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching Form schema.' });
  }
});

// 8. Set Primary Key for Project
app.post('/api/integrations/google/forms/:projectId/primary-key', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { primaryKeyColumn } = req.body;

  if (!primaryKeyColumn) {
    return res.status(400).json({ success: false, message: 'Missing primaryKeyColumn parameter.' });
  }

  try {
    await pool.query(
      `UPDATE project_integrations 
       SET primary_key_column = ? 
       WHERE project_id = ? AND integration_type = 'google_forms'`,
      [primaryKeyColumn, projectId]
    );

    return res.json({
      success: true,
      message: 'Primary key configuration successfully configured.'
    });

  } catch (error) {
    console.error('[API Error] Configure primary key failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error saving primary key config.' });
  }
});

// 9. Synchronize Google Form Responses dynamically into standard database tables
app.post('/api/integrations/google/forms/:projectId/sync', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { strategy } = req.body; // 'replace' | 'keep'
  let formId = 'Unknown';

  if (!strategy) {
    return res.status(400).json({ success: false, message: 'Missing strategy configuration.' });
  }

  try {
    console.log('[Google Sync] ========== GOOGLE SYNC START ==========');
    console.log(`[Google Sync] Project ID: ${projectId}`);
    console.log(`[Google Sync] User ID: ${req.user.id}`);
    console.log(`[Google Sync] Timestamp: ${new Date().toISOString()}`);

    // Check connection status & retrieve details
    console.log('[Google Sync] Fetching attached Google Form...');
    const [integrations] = await pool.query(
      'SELECT email, connected_form_id, connected_form_title, primary_key_column FROM project_integrations WHERE project_id = ? AND integration_type = "google_forms"',
      [projectId]
    );

    if (integrations.length === 0 || !integrations[0].connected_form_id) {
      console.error('[Google Sync Error] ✗ No attached Google Form connected to this project.');
      console.log('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
      console.log('Reason: No Google Form connected to this project.');
      return res.status(400).json({ success: false, message: 'No Google Form is connected to this project.' });
    }

    const integration = integrations[0];
    formId = integration.connected_form_id;
    const formTitle = integration.connected_form_title || 'Google Form';
    const primaryKeyCol = integration.primary_key_column;

    console.log(`[Google Sync] Google Account: ${integration.email || 'user-level connection'}`);
    console.log(`[Google Sync] Project Google Form ID: ${formId}`);
    console.log(`[Google Sync] Project Google Form Name: ${formTitle}`);

    if (!primaryKeyCol) {
      console.error('[Google Sync Error] ✗ Primary key is not set.');
      console.log('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
      console.log('Reason: Primary key is not set.');
      return res.status(400).json({ success: false, message: 'Primary key is not set. Please configure a unique identifier first.' });
    }

    const accessToken = await getValidAccessToken(req.user.id);

    // Dynamic Scope Verification via Google TokenInfo API
    console.log('[Google Sync] Verifying OAuth scopes with Google TokenInfo API...');
    const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
    const tokenInfo = await tokenInfoRes.json();

    const requestedScopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/forms.body.readonly',
      'https://www.googleapis.com/auth/forms.responses.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    const requiredScopes = [
      'https://www.googleapis.com/auth/forms.responses.readonly'
    ];

    const grantedScopeString = tokenInfo.scope || '';
    const grantedScopes = grantedScopeString.split(' ');

    console.log(`[Google Sync] Requested OAuth Scopes: ${requestedScopes.join(' ')}`);
    console.log(`[Google Sync] Granted OAuth Scopes: ${grantedScopeString}`);
    console.log(`[Google Sync] Required Response Fetch Scopes: ${requiredScopes.join(' ')}`);

    const missingScopes = requiredScopes.filter(s => !grantedScopes.includes(s));

    if (missingScopes.length > 0) {
      console.error(`[Google Sync Error] ✗ Missing required scope(s): ${missingScopes.join(', ')}`);
      console.log('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
      console.log(`Reason: Missing required scope(s): ${missingScopes.join(', ')}. Please disconnect and reconnect your Google account.`);
      return res.status(403).json({
        success: false,
        message: `Insufficient scopes. Missing: ${missingScopes.join(', ')}. Please reconnect your Google account.`
      });
    }

    console.log('[Google Sync] ✓ All required scopes are granted.');

    // 1. Fetch Form Schema to map questionId -> question text
    console.log('[Google Sync] Calling Google Forms API...');
    const schemaResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`[Google Sync] HTTP Status: ${schemaResponse.status}`);
    
    const schemaData = await schemaResponse.json();
    if (!schemaResponse.ok) {
      console.error('[Google Sync Error] Google API Error:', schemaData);
      console.log('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
      console.log('Reason: Unable to fetch form schema.');
      return res.status(400).json({ success: false, message: 'Unable to fetch form schema.' });
    }

    const questionMap = {}; // questionId -> question title text
    const questionsList = [];
    if (schemaData.items) {
      console.log(`[Google Sync] Form Title: ${schemaData.info?.title || formTitle}`);
      console.log(`[Google Sync] Questions Found: ${schemaData.items.length}`);
      
      const qIds = [];
      const qTypes = [];

      for (const item of schemaData.items) {
        if (item.questionItem && item.questionItem.question) {
          const qId = item.questionItem.question.questionId;
          const qTitle = item.title || 'Untitled Question';
          const qType = item.questionItem.question.textQuestion ? 'text' : 'choice'; // simplified
          questionMap[qId] = qTitle;
          questionsList.push({ key: qId, name: qTitle });
          qIds.push(qId);
          qTypes.push(qType);

          // Inserts columns dynamically to database
          console.log(`[Google Sync] Executing INSERT on project_columns for question ID: ${qId}`);
          const [colRes] = await pool.query(
            `INSERT INTO project_columns (project_id, column_key, column_name) 
             VALUES (?, ?, ?) 
             ON DUPLICATE KEY UPDATE column_name = VALUES(column_name)`,
            [projectId, qId, qTitle]
          );
          console.log(`[Google Sync] Rows affected: ${colRes.affectedRows}`);
        }
      }
      console.log(`[Google Sync] Question IDs: ${qIds.join(', ')}`);
      console.log(`[Google Sync] Question Types: ${qTypes.join(', ')}`);
    }

    // 2. Fetch Form Responses
    console.log('[Google Sync] Fetching Google Form responses...');
    const responsesResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log(`[Google Sync] HTTP Status: ${responsesResponse.status}`);
    
    const responsesData = await responsesResponse.json();
    if (!responsesResponse.ok) {
      console.error('[Google Sync Error] Google API Error:', responsesData);
      console.log('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
      console.log('Reason: Unable to fetch form responses from Google.');
      return res.status(400).json({ success: false, message: 'Unable to fetch form responses from Google.' });
    }

    const responses = responsesData.responses || [];
    console.log(`[Google Sync] Responses Retrieved: ${responses.length}`);

    let importedCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;

    const uniqueKeysFound = [];
    const duplicateKeys = [];

    // Extract unique keys and count duplicates for logging
    console.log(`[Google Sync] Primary Key Column: ${primaryKeyCol}`);
    for (const resp of responses) {
      const answers = resp.answers || {};
      const primaryKeyAnswer = answers[primaryKeyCol];
      let recordKey = '';

      if (primaryKeyAnswer && primaryKeyAnswer.textAnswers && primaryKeyAnswer.textAnswers.answers) {
        recordKey = primaryKeyAnswer.textAnswers.answers[0].value || '';
      }

      if (!recordKey.trim()) {
        recordKey = `empty_pk_${resp.responseId}`;
      }

      if (uniqueKeysFound.includes(recordKey)) {
        duplicateKeys.push(recordKey);
      } else {
        uniqueKeysFound.push(recordKey);
      }
    }

    console.log(`[Google Sync] Unique Keys Found: ${uniqueKeysFound.join(', ') || 'None'}`);
    console.log(`[Google Sync] Duplicate Keys: ${duplicateKeys.join(', ') || 'None'}`);

    // 3. Process Responses
    for (const resp of responses) {
      const answers = resp.answers || {};
      
      // Determine unique primary key value for this response
      const primaryKeyAnswer = answers[primaryKeyCol];
      let recordKey = '';

      if (primaryKeyAnswer && primaryKeyAnswer.textAnswers && primaryKeyAnswer.textAnswers.answers) {
        recordKey = primaryKeyAnswer.textAnswers.answers[0].value || '';
      }

      // If empty primary key, fallback to response ID to avoid dropping it completely
      if (!recordKey.trim()) {
        recordKey = `empty_pk_${resp.responseId}`;
      }

      // Check if record already exists
      const [existing] = await pool.query(
        'SELECT id FROM project_records WHERE project_id = ? AND record_key = ?',
        [projectId, recordKey]
      );

      if (existing.length === 0) {
        // A. Insert new record
        console.log(`[Google Sync] Executing INSERT on project_records for key: ${recordKey}`);
        const [insertRes] = await pool.query(
          `INSERT INTO project_records (project_id, record_key, source_type, source_name) 
           VALUES (?, ?, 'google_form', ?)`,
          [projectId, recordKey, formTitle]
        );
        console.log(`[Google Sync] Rows affected: ${insertRes.affectedRows}`);
        const recordId = insertRes.insertId;

        // Save dynamic values
        for (const q of questionsList) {
          const ansObj = answers[q.key];
          let val = '';
          if (ansObj && ansObj.textAnswers && ansObj.textAnswers.answers) {
            val = ansObj.textAnswers.answers.map(a => a.value).join(', ') || '';
          }
          console.log(`[Google Sync] Executing INSERT on record_values for recordId: ${recordId}, question key: ${q.key}`);
          const [valRes] = await pool.query(
            'INSERT INTO record_values (record_id, column_key, column_value) VALUES (?, ?, ?)',
            [recordId, q.key, val]
          );
          console.log(`[Google Sync] Rows affected: ${valRes.affectedRows}`);
        }
        importedCount++;
      } else {
        // B. Handle duplicate based on sync strategy
        const recordId = existing[0].id;

        if (strategy === 'replace') {
          // Update last sync source and time
          console.log(`[Google Sync] Executing UPDATE on project_records for record ID: ${recordId}`);
          const [updRes] = await pool.query(
            `UPDATE project_records 
             SET source_name = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [formTitle, recordId]
          );
          console.log(`[Google Sync] Rows affected: ${updRes.affectedRows}`);

          // Update values
          for (const q of questionsList) {
            const ansObj = answers[q.key];
            let val = '';
            if (ansObj && ansObj.textAnswers && ansObj.textAnswers.answers) {
              val = ansObj.textAnswers.answers.map(a => a.value).join(', ') || '';
            }
            console.log(`[Google Sync] Executing INSERT/UPDATE on record_values for recordId: ${recordId}, question key: ${q.key}`);
            const [valUpdRes] = await pool.query(
              `INSERT INTO record_values (record_id, column_key, column_value) 
               VALUES (?, ?, ?) 
               ON DUPLICATE KEY UPDATE column_value = VALUES(column_value)`,
              [recordId, q.key, val]
            );
            console.log(`[Google Sync] Rows affected: ${valUpdRes.affectedRows}`);
          }
          updatedCount++;
        } else {
          ignoredCount++;
        }
      }
    }

    // Update integration last sync timestamp
    console.log(`[Google Sync] Executing UPDATE on project_integrations last sync time`);
    const [integUpd] = await pool.query(
      `UPDATE project_integrations 
       SET last_sync_time = CURRENT_TIMESTAMP 
       WHERE project_id = ? AND integration_type = 'google_forms'`,
      [projectId]
    );
    console.log(`[Google Sync] Rows affected: ${integUpd.affectedRows}`);

    console.log('[Google Sync] ========== GOOGLE SYNC SUCCESS ==========');
    return res.json({
      success: true,
      summary: {
        total: responses.length,
        imported: importedCount,
        updated: updatedCount,
        ignored: ignoredCount
      }
    });

  } catch (error) {
    console.error('[Google Sync Error] ========== GOOGLE SYNC FAILED ==========');
    console.error(`[Google Sync Error] File: server.js`);
    console.error(`[Google Sync Error] Function: formsSyncEndpoint`);
    console.error(`[Google Sync Error] Project ID: ${projectId}`);
    console.error(`[Google Sync Error] User ID: ${req.user ? req.user.id : 'Unknown'}`);
    console.error(`[Google Sync Error] Google Form ID: ${formId}`);
    console.error(`[Google Sync Error] Stack Trace: ${error.stack}`);
    console.error(error);
    console.error(error.stack);
    return res.status(500).json({ success: false, message: error.message || 'Error processing sync.' });
  }
});

// 10. Fetch All Extracted Project Records & Dynamic Columns
app.get('/api/integrations/google/forms/:projectId/records', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    // 1. Fetch all project columns
    const [columns] = await pool.query(
      'SELECT column_key, column_name FROM project_columns WHERE project_id = ?',
      [projectId]
    );

    // 2. Fetch all project records
    const [records] = await pool.query(
      'SELECT id, record_key, source_type, source_name, created_at, updated_at FROM project_records WHERE project_id = ?',
      [projectId]
    );

    // 3. For each record, fetch dynamic values
    const structuredRecords = [];
    for (const rec of records) {
      const [values] = await pool.query(
        'SELECT column_key, column_value FROM record_values WHERE record_id = ?',
        [rec.id]
      );

      const valMap = {};
      for (const val of values) {
        valMap[val.column_key] = val.column_value;
      }

      structuredRecords.push({
        id: rec.id,
        recordKey: rec.record_key,
        sourceType: rec.source_type,
        sourceName: rec.source_name,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
        values: valMap
      });
    }

    return res.json({
      success: true,
      columns: columns.map(c => ({ key: c.column_key, name: c.column_name })),
      records: structuredRecords
    });

  } catch (error) {
    console.error('[API Error] Fetch project records failed:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving project records.' });
  }
});

// Helper: Fetch project data and verify user permissions for export
async function getProjectDataForExport(projectId, userId) {
  // 1. Verify user exists and is active in database
  const [userRows] = await pool.query('SELECT role, email FROM users WHERE id = ?', [userId]);
  if (userRows.length === 0) {
    throw { status: 403, message: 'Access denied. User not found in database.' };
  }
  const dbUser = userRows[0];

  // 2. Check if project columns or integrations exist in the database (proves project exists)
  const [columnCheck] = await pool.query('SELECT 1 FROM project_columns WHERE project_id = ? LIMIT 1', [projectId]);
  const [integrationCheck] = await pool.query('SELECT email, connected_form_title FROM project_integrations WHERE project_id = ? LIMIT 1', [projectId]);

  if (columnCheck.length === 0 && integrationCheck.length === 0) {
    throw { status: 404, message: 'Project not found or contains no synchronized data.' };
  }

  // 3. User permission check: Admins and Teachers are allowed.
  if (dbUser.role !== 'Admin' && dbUser.role !== 'Teacher') {
    throw { status: 403, message: 'Access denied. Insufficient permissions.' };
  }

  // 4. Resolve project name securely from database, fallback to projectId
  const projectName = (integrationCheck[0] && integrationCheck[0].connected_form_title) || projectId;

  // 5. Fetch all project columns in original insertion order
  const [columns] = await pool.query(
    'SELECT column_key, column_name FROM project_columns WHERE project_id = ?',
    [projectId]
  );

  // 6. Fetch all project records
  const [records] = await pool.query(
    'SELECT id, record_key, source_type, source_name, created_at, updated_at FROM project_records WHERE project_id = ?',
    [projectId]
  );

  // 7. Fetch record values
  const structuredRecords = [];
  for (const rec of records) {
    const [values] = await pool.query(
      'SELECT column_key, column_value FROM record_values WHERE record_id = ?',
      [rec.id]
    );

    const valMap = {};
    for (const val of values) {
      valMap[val.column_key] = val.column_value;
    }

    structuredRecords.push({
      id: rec.id,
      recordKey: rec.record_key,
      sourceType: rec.source_type,
      sourceName: rec.source_name,
      createdAt: rec.created_at,
      updatedAt: rec.updated_at,
      values: valMap
    });
  }

  return {
    projectName,
    columns: columns.map(c => ({ key: c.column_key, name: c.column_name })),
    records: structuredRecords
  };
}

// GET /api/projects/:projectId/export/excel
app.get('/api/projects/:projectId/export/excel', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const data = await getProjectDataForExport(projectId, userId);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'InfoTally';
    workbook.lastModifiedBy = 'InfoTally';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet('Exported Data', {
      views: [{ state: 'frozen', ySplit: 6 }] // Freeze the first 6 rows (metadata + header)
    });

    // 1. Title & Metadata
    worksheet.getCell('A1').value = 'InfoTally Data Export';
    worksheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true };

    worksheet.getCell('A2').value = `Project Name: ${data.projectName}`;
    worksheet.getCell('A2').font = { name: 'Arial', size: 11, bold: true };

    worksheet.getCell('A3').value = `Export Date: ${new Date().toLocaleString()}`;
    worksheet.getCell('A3').font = { name: 'Arial', size: 11 };

    worksheet.getCell('A4').value = `Total Records: ${data.records.length}`;
    worksheet.getCell('A4').font = { name: 'Arial', size: 11 };

    // Row 5 is spacing

    // 2. Table Headers (Row 6)
    const headerRowIndex = 6;
    const headers = ['Record Key', 'Source Type', 'Source Name', ...data.columns.map(c => c.name)];
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.values = headers;
    headerRow.font = { name: 'Arial', size: 11, bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F0FA' } // Light blue header fill
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

    // 3. Populate Rows
    data.records.forEach((rec, index) => {
      const rowIndex = headerRowIndex + 1 + index;
      const rowValues = [
        rec.recordKey,
        rec.sourceType,
        rec.sourceName
      ];
      data.columns.forEach(col => {
        rowValues.push(rec.values[col.key] || '');
      });

      const row = worksheet.getRow(rowIndex);
      row.values = rowValues;
      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle' };
    });

    // 4. Auto-size column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellVal = cell.value ? String(cell.value) : '';
        if (cellVal.length > maxLength) {
          maxLength = cellVal.length;
        }
      });
      column.width = Math.max(maxLength + 3, 12);
    });

    // Explicit gridlines
    worksheet.views[0].showGridLines = true;

    // Send Stream
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(data.projectName)}_export.xlsx"`);

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error('[Export Error] Excel export failed:', error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Server error exporting Excel.' });
  }
});

// GET /api/projects/:projectId/export/pdf
app.get('/api/projects/:projectId/export/pdf', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  try {
    const data = await getProjectDataForExport(projectId, userId);

    const PDFDocument = require('pdfkit');

    // ─── 1. DYNAMIC COLUMN WIDTH ESTIMATION ──────────────────────────────────────────
    // Create a temporary document just to measure strings accurately
    const tempDoc = new PDFDocument({ layout: 'portrait', size: 'LETTER' });
    
    // We will measure base columns
    tempDoc.font('Helvetica-Bold').fontSize(9);
    const baseColKeys = ['recordKey', 'sourceType', 'sourceName'];
    const baseColNames = ['Record Key', 'Source Type', 'Source Name'];
    const baseColWidths = {};

    baseColKeys.forEach((key, idx) => {
      const headerName = baseColNames[idx];
      let headerW = tempDoc.font('Helvetica-Bold').fontSize(9).widthOfString(headerName) + 12;
      let maxValW = 0;
      data.records.forEach(rec => {
        let valStr = '';
        if (key === 'recordKey') valStr = rec.recordKey;
        else if (key === 'sourceType') valStr = rec.sourceType;
        else if (key === 'sourceName') valStr = rec.sourceName;
        const valW = tempDoc.font('Helvetica').fontSize(8).widthOfString(String(valStr)) + 12;
        if (valW > maxValW) maxValW = valW;
      });
      baseColWidths[key] = Math.min(Math.max(headerW, maxValW), 140); // cap base columns to 140pt
    });

    const dataColWidths = {};
    data.columns.forEach(col => {
      let headerW = tempDoc.font('Helvetica-Bold').fontSize(9).widthOfString(col.name) + 12;
      let maxValW = 0;
      data.records.forEach(rec => {
        const valW = tempDoc.font('Helvetica').fontSize(8).widthOfString(String(rec.values[col.key] || '')) + 12;
        if (valW > maxValW) maxValW = valW;
      });
      dataColWidths[col.key] = Math.min(Math.max(headerW, maxValW), 160); // cap custom columns to 160pt
    });

    tempDoc.end(); // destroy temporary measurer

    // ─── 2. REPEATING COLUMNS EXTRACTION ──────────────────────────────────────────────
    // Record Key is always repeated.
    const repeatingCols = [
      { key: 'recordKey', name: 'Record Key', width: baseColWidths['recordKey'] }
    ];

    // Find first column containing "name" (case-insensitive) to repeat if present
    const nameCol = data.columns.find(c => c.name.toLowerCase().includes('name'));
    if (nameCol) {
      repeatingCols.push({ key: nameCol.key, name: nameCol.name, width: dataColWidths[nameCol.key] });
    }

    const repeatingWidth = repeatingCols.reduce((sum, c) => sum + c.width, 0);

    // ─── 3. ORIENTATION & PAGE CONFIGURATION ──────────────────────────────────────────
    // Estimate total un-split table width
    const totalTableWidth = 
      baseColWidths['recordKey'] + 
      baseColWidths['sourceType'] + 
      baseColWidths['sourceName'] + 
      data.columns.reduce((sum, c) => sum + dataColWidths[c.key], 0);

    // Set page parameters based on width
    const portraitContentWidth = 532; // 612 - 80
    const landscapeContentWidth = 712; // 792 - 80

    let isLandscape = totalTableWidth > portraitContentWidth;
    let contentWidth = isLandscape ? landscapeContentWidth : portraitContentWidth;
    let orientation = isLandscape ? 'landscape' : 'portrait';

    // ─── 4. HORIZONTAL COLUMN SPLITTING (CHUNKING) ────────────────────────────────────
    // Distribute remaining columns across table sections.
    // Non-repeating columns are:
    // - Base columns: 'sourceType' and 'sourceName' (if they are not repeating)
    // - Custom columns: all except any column already in repeatingCols
    const remainingCols = [];
    if (!repeatingCols.find(c => c.key === 'sourceType')) {
      remainingCols.push({ key: 'sourceType', name: 'Source Type', width: baseColWidths['sourceType'] });
    }
    if (!repeatingCols.find(c => c.key === 'sourceName')) {
      remainingCols.push({ key: 'sourceName', name: 'Source Name', width: baseColWidths['sourceName'] });
    }
    data.columns.forEach(col => {
      if (!repeatingCols.find(c => c.key === col.key)) {
        remainingCols.push({ key: col.key, name: col.name, width: dataColWidths[col.key] });
      }
    });

    const chunks = [];
    let currentChunk = [...repeatingCols];
    let currentChunkWidth = repeatingWidth;

    remainingCols.forEach(col => {
      // If a single column is too wide for the layout on its own, clamp its width
      const colWidthToUse = Math.min(col.width, contentWidth - repeatingWidth);
      const colObj = { ...col, width: colWidthToUse };

      if (currentChunkWidth + colWidthToUse <= contentWidth || currentChunk.length === repeatingCols.length) {
        currentChunk.push(colObj);
        currentChunkWidth += colWidthToUse;
      } else {
        chunks.push(currentChunk);
        currentChunk = [...repeatingCols, colObj];
        currentChunkWidth = repeatingWidth + colWidthToUse;
      }
    });
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // ─── 5. START DOCUMENT GENERATION ───────────────────────────────────────────────
    const doc = new PDFDocument({
      layout: orientation,
      size: 'LETTER',
      margin: 40,
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(data.projectName)}_export.pdf"`);
    doc.pipe(res);

    const margin = 40;
    const pageHeight = doc.page.height;

    // Helper: Draw Main Document Header (Only on page 1 of first section)
    const renderMainHeader = () => {
      doc.font('Helvetica-Bold').fontSize(18).text('InfoTally Project Data Report', margin, margin);
      doc.font('Helvetica').fontSize(11).text(`Project Name: ${data.projectName}`, margin, margin + 25);
      doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, margin + 40);
      doc.text(`Total Records: ${data.records.length}`, margin, margin + 55);
      doc.moveDown(2);
    };

    // Helper: Draw Section Continued Header
    const renderContinuedHeader = (chunkIdx) => {
      doc.font('Helvetica-Bold').fontSize(10).text(`InfoTally Report: ${data.projectName} (Section ${chunkIdx + 1}/${chunks.length})`, margin, margin);
      doc.font('Helvetica').fontSize(8).text(`Export Date: ${new Date().toLocaleString()}`, margin + 400, margin);
      doc.moveDown(1);
    };

    // Helper: Draw Table Header Row for a specific chunk
    const renderTableHeader = (y, chunkCols) => {
      const sectionWidth = chunkCols.reduce((sum, c) => sum + c.width, 0);
      
      doc.fillColor('#E6F0FA');
      doc.rect(margin, y, sectionWidth, 20).fill();

      doc.fillColor('#000000');
      doc.font('Helvetica-Bold').fontSize(9);

      let x = margin;
      chunkCols.forEach(col => {
        doc.text(col.name, x + 4, y + 5, { width: col.width - 8, lineBreak: false, ellipsis: true });
        x += col.width;
      });

      doc.moveTo(margin, y + 20).lineTo(margin + sectionWidth, y + 20).strokeColor('#CCCCCC').lineWidth(1).stroke();
    };

    // Helper: Calculate Row Height
    const getRowHeight = (rec, chunkCols) => {
      doc.font('Helvetica').fontSize(8);
      let maxHeight = 18; // minimum row height
      chunkCols.forEach(col => {
        let val = '';
        if (col.key === 'recordKey') val = rec.recordKey;
        else if (col.key === 'sourceType') val = rec.sourceType;
        else if (col.key === 'sourceName') val = rec.sourceName;
        else val = rec.values[col.key] || '';

        const textHeight = doc.heightOfString(String(val), { width: col.width - 8 });
        const cellHeight = textHeight + 8; // padding top/bottom
        if (cellHeight > maxHeight) maxHeight = cellHeight;
      });
      return maxHeight;
    };

    // ─── 6. RENDER EACH COLUMN CHUNK ────────────────────────────────────────────────
    chunks.forEach((chunkCols, chunkIdx) => {
      // If we are starting a subsequent column chunk, add a new page
      if (chunkIdx > 0) {
        doc.addPage({ layout: orientation });
      }

      // Draw Header for this page
      let isFirstPageOfSection = true;
      if (chunkIdx === 0) {
        renderMainHeader();
        isFirstPageOfSection = false; // Page 1 already has main header
      } else {
        renderContinuedHeader(chunkIdx);
      }

      let currentY = doc.y + 10;
      renderTableHeader(currentY, chunkCols);
      currentY += 20;

      // Draw records
      data.records.forEach((rec, recIdx) => {
        const rowHeight = getRowHeight(rec, chunkCols);

        // Check vertical overflow
        if (currentY + rowHeight > pageHeight - margin - 30) {
          doc.addPage({ layout: orientation });
          renderContinuedHeader(chunkIdx);
          currentY = doc.y + 10;
          renderTableHeader(currentY, chunkCols);
          currentY += 20;
        }

        // Zebra striping alternating row background shading
        if (recIdx % 2 === 1) {
          const sectionWidth = chunkCols.reduce((sum, c) => sum + c.width, 0);
          doc.fillColor('#F9FAFB');
          doc.rect(margin, currentY, sectionWidth, rowHeight).fill();
          doc.fillColor('#000000');
        }

        // Draw Row Cells
        doc.font('Helvetica').fontSize(8);
        let x = margin;
        chunkCols.forEach(col => {
          let val = '';
          if (col.key === 'recordKey') val = rec.recordKey;
          else if (col.key === 'sourceType') val = rec.sourceType;
          else if (col.key === 'sourceName') val = rec.sourceName;
          else val = rec.values[col.key] || '';

          // Text wrap: allows multiple lines inside cell boundaries
          doc.text(String(val), x + 4, currentY + 4, { width: col.width - 8 });
          
          // Draw cell vertical right border
          doc.moveTo(x + col.width, currentY)
             .lineTo(x + col.width, currentY + rowHeight)
             .strokeColor('#EAEAEA')
             .lineWidth(0.5)
             .stroke();

          x += col.width;
        });

        // Draw cell left border (on first column)
        doc.moveTo(margin, currentY)
           .lineTo(margin, currentY + rowHeight)
           .strokeColor('#EAEAEA')
           .lineWidth(0.5)
           .stroke();

        // Draw horizontal row bottom border line
        const sectionWidth = chunkCols.reduce((sum, c) => sum + c.width, 0);
        doc.moveTo(margin, currentY + rowHeight)
           .lineTo(margin + sectionWidth, currentY + rowHeight)
           .strokeColor('#EAEAEA')
           .lineWidth(0.5)
           .stroke();

        currentY += rowHeight;
      });
    });

    // ─── 7. ADD PAGE NUMBERS (POST-PROCESSING) ─────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      const currentWidth = doc.page.width - margin * 2;

      doc.font('Helvetica').fontSize(8).fillColor('#666666');
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        margin,
        doc.page.height - margin + 15,
        { align: 'right', width: currentWidth }
      );
    }

    doc.end();
  } catch (error) {
    console.error('[Export Error] PDF export failed:', error.message);
    const status = error.status || 500;
    return res.status(status).json({ success: false, message: error.message || 'Server error exporting PDF.' });
  }
});


// Mount Microsoft Forms routes
const microsoftRoutes = require('./microsoftRoutes');
app.use('/api/integrations/microsoft', microsoftRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: 'connected' });
});

app.listen(PORT, () => {
  console.log(`[Server] InfoTally backend running on http://localhost:${PORT}`);
});
