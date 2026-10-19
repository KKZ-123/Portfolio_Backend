import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

// Create PostgreSQL connection pool using connection string (best for Neon SNI routing)
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Initialize database tables and sync columns
export async function initDatabase(): Promise<void> {
  let client;
  try {
    console.log('🔌 Connecting to Neon PostgreSQL database...');
    client = await pool.connect();

    // Test connection
    const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Connected to Neon DB (${res.rows[0].db_name}) at ${res.rows[0].current_time}`);

    // Create users table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist even if table was previously created with a different schema
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
    `);

    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('📋 Existing users table columns:', colRes.rows.map((r: { column_name: string }) => r.column_name).join(', '));
    console.log('✅ Users table schema verified & synced successfully.');
  } catch (error) {
    console.error('❌ Database connection/initialization error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
