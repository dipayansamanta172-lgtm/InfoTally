const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'InfoTally',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDb() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('[Database] Connected to MySQL successfully.');

    // 1. Create access_requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        institution VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        purpose TEXT NOT NULL,
        description TEXT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        reviewed_by INT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: access_requests');

    // 2. Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Teacher') DEFAULT 'Teacher',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        must_change_password BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: users');

    // Run schema column check for existing databases
    const dbName = process.env.DB_NAME || 'InfoTally';
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password'
    `, [dbName]);
    
    if (columns.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE');
      console.log('[Database] Altered users table: Added must_change_password column.');
    }

    // 3. Create activity_logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: activity_logs');

    // 4. Create project_integrations table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_integrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NULL,
        token_expiry BIGINT NULL,
        connected_form_id VARCHAR(255) NULL,
        connected_form_title VARCHAR(255) NULL,
        primary_key_column VARCHAR(255) NULL,
        last_sync_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_project_type (project_id, integration_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: project_integrations');

    // Run schema column check for existing project_integrations table
    const [integrationColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'project_integrations' AND COLUMN_NAME = 'primary_key_column'
    `, [dbName]);
    
    if (integrationColumns.length === 0) {
      await connection.query('ALTER TABLE project_integrations ADD COLUMN primary_key_column VARCHAR(255) NULL');
      console.log('[Database] Altered project_integrations table: Added primary_key_column column.');
    }

    // Create project_columns table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_columns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        column_key VARCHAR(255) NOT NULL,
        column_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_proj_col (project_id, column_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: project_columns');

    // Create project_records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        record_key VARCHAR(255) NOT NULL,
        source_type VARCHAR(50) NOT NULL,
        source_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_proj_record (project_id, record_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: project_records');

    // Create record_values table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS record_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        record_id INT NOT NULL,
        column_key VARCHAR(255) NOT NULL,
        column_value TEXT NULL,
        FOREIGN KEY (record_id) REFERENCES project_records(id) ON DELETE CASCADE,
        UNIQUE KEY unique_record_val (record_id, column_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('[Database] Checked/Created table: record_values');

    // 5. Seed initial Admin if not exists
    const [admins] = await connection.query('SELECT * FROM users WHERE role = "Admin"');
    if (admins.length === 0) {
      const adminName = process.env.ADMIN_NAME;
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (adminName && adminEmail && adminPassword) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await connection.query(`
          INSERT INTO users (full_name, email, password_hash, role, status, must_change_password)
          VALUES (?, ?, ?, 'Admin', 'Active', FALSE)
        `, [adminName, adminEmail, hash]);
        console.log(`[Database] Initial administrator created successfully. Name: ${adminName}, Email: ${adminEmail}`);
      } else {
        console.log('[Database] No Admin user exists, and ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD are not fully configured in .env.');
      }
    }

  } catch (error) {
    console.error('[Database] Connection or Initialization Error:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  initDb
};
