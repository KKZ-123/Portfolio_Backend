import { pool } from '../config/db';
import { User, UserAuthRow } from '../types/user.types';
import crypto from 'crypto';
import { Service } from 'typedi';

interface UserRow {
  id: string | number;
  name?: string | null;
  email: string;
  userid?: string | null;
  password?: string | null;
  role?: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

@Service()
export class UserRepository {
  private mapRowToUser = (row: UserRow): User => {
    return {
      id: row.id !== undefined && row.id !== null ? String(row.id) : undefined,
      userid: String(row.userid || row.id || ''),
      name: row.name || 'Unnamed',
      email: row.email,
      role: row.role || 'user',
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  };

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC NULLS LAST';
    const result = await pool.query<UserRow>(query);
    return result.rows.map((row) => this.mapRowToUser(row));
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id::text = $1 OR userid = $1 OR LOWER(email) = LOWER($1)';
    const result = await pool.query<UserRow>(query, [id]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async findByUserId(userid: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE LOWER(userid) = LOWER($1)';
    const result = await pool.query<UserRow>(query, [userid]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query<UserRow>(query, [email]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async create(userData: {
    userid?: string;
    password?: string;
    name: string;
    email: string;
    role?: string;
  }): Promise<User> {
    const id = crypto.randomUUID();
    const userid = userData.userid || userData.email.split('@')[0] || id;
    const password = userData.password || '123456';
    const role = userData.role || 'user';

    const query = `
      INSERT INTO users (id, userid, password, name, email, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [id, userid, password, userData.name, userData.email, role];
    const result = await pool.query<UserRow>(query, values);
    return this.mapRowToUser(result.rows[0]!);
  }

  async update(id: string, userData: {
    userid?: string;
    password?: string;
    name?: string;
    email?: string;
    role?: string;
  }): Promise<User | null> {
    const fields: string[] = [];
    const values: (string | undefined)[] = [];
    let index = 1;

    if (userData.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(userData.name);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(userData.email);
    }
    if (userData.role !== undefined) {
      fields.push(`role = $${index++}`);
      values.push(userData.role);
    }
    if (userData.userid !== undefined) {
      fields.push(`userid = $${index++}`);
      values.push(userData.userid);
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${index++}`);
      values.push(userData.password);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id::text = $${index} OR userid = $${index} OR LOWER(email) = LOWER($${index})
      RETURNING *
    `;

    const result = await pool.query<UserRow>(query, values);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id::text = $1 OR userid = $1 OR LOWER(email) = LOWER($1)';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async findByCredentials(userid: string, password: string): Promise<UserAuthRow | null> {
    const query = `
      SELECT name, email, userid, password, role
      FROM users
      WHERE userid = $1 AND password = $2
      LIMIT 1
    `;
    const result = await pool.query<UserAuthRow>(query, [userid, password]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return result.rows[0];
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
