import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=${process.env.DB_SSL || 'verify-full'}`;

// Create PostgreSQL connection pool using connection string (best for Neon SNI routing)
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Handle idle client errors gracefully to prevent unhandled 'error' event crashes
pool.on('error', (err) => {
  console.error('⚠️ Unexpected error on idle Neon PostgreSQL client:', err.message);
});

// Initialize database tables and sync columns
export async function initDatabase(retries = 3, delayMs = 3000): Promise<void> {
  let client;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Connecting to Neon PostgreSQL database (attempt ${attempt}/${retries})...`);
      client = await pool.connect();

      // Test connection
      const res = await client.query('SELECT NOW() as current_time, current_database() as db_name');
      console.log(`✅ Connected to Neon DB (${res.rows[0].db_name}) at ${res.rows[0].current_time}`);
      break;
    } catch (err) {
      if (client) {
        client.release();
        client = undefined;
      }
      console.error(`❌ Connection attempt ${attempt} failed:`, (err as Error).message);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delayMs / 1000}s (waiting for Neon compute to wake up)...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw err;
      }
    }
  }

  if (!client) {
    throw new Error('Database connection failed: client is unavailable.');
  }

  try {
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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id VARCHAR(36);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS userid VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      UPDATE users SET id = gen_random_uuid()::text WHERE id IS NULL;
    `);

    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('📋 Existing users table columns:', colRes.rows.map((r: { column_name: string }) => r.column_name).join(', '));
    console.log('✅ Users table schema verified & synced successfully.');

    // Create brand table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS brand (
        autoid  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        syskey  UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        name    VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log('✅ Brand table schema verified & synced successfully.');

    // Create perfume table if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS perfume (
        autoid            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        syskey            UUID           NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        code              VARCHAR(50)    NOT NULL UNIQUE,
        brand_syskey      UUID           NOT NULL REFERENCES brand (syskey),
        name              VARCHAR(150)   NOT NULL,
        type              VARCHAR(10)    NOT NULL DEFAULT 'EDP',
        size_ml           INT            NOT NULL,
        qty               INT            NOT NULL DEFAULT 0,
        gender            VARCHAR(10)    NOT NULL DEFAULT 'Unisex',
        original_price    NUMERIC(12,2)  NOT NULL DEFAULT 0,
        sell_price        NUMERIC(12,2)  NOT NULL DEFAULT 0,
        discount_percent  NUMERIC(5,2)   NOT NULL DEFAULT 0,
        status            VARCHAR(10)    NOT NULL DEFAULT 'Active',
        createdby         VARCHAR(50),
        createddate       TIMESTAMP      NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC') + interval '6 hours 30 minutes'),
        modifiedby        VARCHAR(50),
        modifieddate      TIMESTAMP,

        CONSTRAINT ck_perfume_type     CHECK (type IN ('EDP','EDT','Parfum','Cologne')),
        CONSTRAINT ck_perfume_gender   CHECK (gender IN ('Male','Female','Unisex')),
        CONSTRAINT ck_perfume_status   CHECK (status IN ('Active','Inactive')),
        CONSTRAINT ck_perfume_qty      CHECK (qty >= 0),
        CONSTRAINT ck_perfume_size     CHECK (size_ml > 0),
        CONSTRAINT ck_perfume_discount CHECK (discount_percent BETWEEN 0 AND 100)
      );
    `);
    console.log('✅ Perfume table schema verified & synced successfully.');
  } catch (error) {
    console.error('❌ Database connection/initialization error:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}
