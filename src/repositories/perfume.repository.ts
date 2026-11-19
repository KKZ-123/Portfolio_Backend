import { pool } from '../config/db';
import { Perfume, CreatePerfumeDto, PerfumeType, PerfumeGender, PerfumeStatus } from '../types/perfume.types';
import { Service } from 'typedi';

interface PerfumeRow {
  autoid: number;
  syskey: string;
  code: string;
  brand_syskey: string;
  brand_name?: string | null;
  name: string;
  type: string;
  size_ml: number;
  qty: number;
  gender: string;
  original_price: string | number;
  sell_price: string | number;
  discount_percent: string | number;
  status: string;
  createdby?: string | null;
  createddate: Date | string;
  modifiedby?: string | null;
  modifieddate?: Date | string | null;
}

@Service()
export class PerfumeRepository {
  private mapRowToPerfume = (row: PerfumeRow): Perfume => {
    return {
      autoid: Number(row.autoid),
      syskey: String(row.syskey),
      code: row.code,
      brand_syskey: String(row.brand_syskey),
      brand_name: row.brand_name || undefined,
      name: row.name,
      type: row.type as PerfumeType,
      size_ml: Number(row.size_ml),
      qty: Number(row.qty),
      gender: row.gender as PerfumeGender,
      original_price: Number(row.original_price),
      sell_price: Number(row.sell_price),
      discount_percent: Number(row.discount_percent),
      status: row.status as PerfumeStatus,
      createdby: row.createdby || null,
      createddate: row.createddate,
      modifiedby: row.modifiedby || null,
      modifieddate: row.modifieddate || null,
    };
  };

  async findAll(): Promise<Perfume[]> {
    const query = `
      SELECT p.*, b.name AS brand_name
      FROM perfume p
      LEFT JOIN brand b ON b.syskey = p.brand_syskey
      ORDER BY p.autoid DESC
    `;
    const result = await pool.query<PerfumeRow>(query);
    return result.rows.map((row) => this.mapRowToPerfume(row));
  }

  async findByCode(code: string): Promise<Perfume | null> {
    const query = `
      SELECT p.*, b.name AS brand_name
      FROM perfume p
      LEFT JOIN brand b ON b.syskey = p.brand_syskey
      WHERE LOWER(TRIM(p.code)) = LOWER(TRIM($1))
      LIMIT 1
    `;
    const result = await pool.query<PerfumeRow>(query, [code]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToPerfume(result.rows[0]);
  }

  async findBySyskey(syskey: string): Promise<Perfume | null> {
    const query = `
      SELECT p.*, b.name AS brand_name
      FROM perfume p
      LEFT JOIN brand b ON b.syskey = p.brand_syskey
      WHERE p.syskey = $1
      LIMIT 1
    `;
    const result = await pool.query<PerfumeRow>(query, [syskey]);
    if (result.rows.length === 0 || !result.rows[0]) return null;
    return this.mapRowToPerfume(result.rows[0]);
  }

  async create(data: CreatePerfumeDto, createdby?: string): Promise<Perfume> {
    const query = `
      INSERT INTO perfume (
        code,
        brand_syskey,
        name,
        type,
        size_ml,
        qty,
        gender,
        original_price,
        sell_price,
        discount_percent,
        status,
        createdby
      )
      VALUES (
        $1, $2, $3,
        COALESCE($4, 'EDP'),
        $5,
        COALESCE($6, 0),
        COALESCE($7, 'Unisex'),
        COALESCE($8, 0),
        COALESCE($9, 0),
        COALESCE($10, 0),
        $11,
        $12
      )
      RETURNING *
    `;

    const values = [
      data.code.trim(),
      data.brand_syskey,
      data.name.trim(),
      data.type || 'EDP',
      data.size_ml,
      data.qty !== undefined ? data.qty : 0,
      data.gender || 'Unisex',
      data.original_price !== undefined ? data.original_price : 0,
      data.sell_price !== undefined ? data.sell_price : 0,
      data.discount_percent !== undefined ? data.discount_percent : 0,
      1,
      createdby || data.createdby || null,
    ];

    const result = await pool.query<PerfumeRow>(query, values);
    return this.mapRowToPerfume(result.rows[0]!);
  }
}

export const perfumeRepository = new PerfumeRepository();

