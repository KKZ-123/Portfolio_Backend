import { pool } from '../config/db';
import { Brand, CreateBrandDto } from '../types/brand.types';
import { Service } from 'typedi';

interface BrandRow {
  autoid: number;
  syskey: string;
  name: string;
}

@Service()
export class BrandRepository {
  private mapRowToBrand = (row: BrandRow): Brand => {
    return {
      autoid: Number(row.autoid),
      syskey: String(row.syskey),
      name: row.name,
    };
  };

  async findAll(): Promise<Brand[]> {
    const query = 'SELECT autoid, syskey, name FROM brand ORDER BY autoid ASC';
    const result = await pool.query<BrandRow>(query);
    return result.rows.map((row) => this.mapRowToBrand(row));
  }

  async findByName(name: string): Promise<Brand | null> {
    const query = 'SELECT autoid, syskey, name FROM brand WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1';
    const result = await pool.query<BrandRow>(query, [name]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToBrand(result.rows[0]);
  }

  async findBySyskey(syskey: string): Promise<Brand | null> {
    const query = 'SELECT autoid, syskey, name FROM brand WHERE syskey = $1 LIMIT 1';
    const result = await pool.query<BrandRow>(query, [syskey]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToBrand(result.rows[0]);
  }

  async create(data: CreateBrandDto): Promise<Brand> {
    const query = `
      INSERT INTO brand (name)
      VALUES ($1)
      RETURNING autoid, syskey, name
    `;
    const result = await pool.query<BrandRow>(query, [data.name]);
    return this.mapRowToBrand(result.rows[0]!);
  }
}

export const brandRepository = new BrandRepository();

