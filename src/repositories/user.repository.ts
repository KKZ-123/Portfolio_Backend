import { pool } from '../config/db';
import { User } from '../types/user.types';
import crypto from 'crypto';

interface UserRow {
  id: string | number;
  name?: string | null;
  email: string;
  role?: 'admin' | 'user' | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

export class UserRepository {
  private mapRowToUser = (row: UserRow): User => {
    return {
      id: String(row.id),
      name: row.name || 'Unnamed',
      email: row.email,
      role: row.role === 'admin' ? 'admin' : 'user',
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
    const query = 'SELECT * FROM users WHERE id::text = $1';
    const result = await pool.query<UserRow>(query, [id]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query<UserRow>(query, [email]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = crypto.randomUUID();
    const query = `
      INSERT INTO users (id, name, email, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const values = [id, userData.name, userData.email, userData.role];
    const result = await pool.query<UserRow>(query, values);
    return this.mapRowToUser(result.rows[0]!);
  }

  async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
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

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id::text = $${index}
      RETURNING *
    `;

    const result = await pool.query<UserRow>(query, values);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id::text = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
