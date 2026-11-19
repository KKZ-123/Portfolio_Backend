export type PerfumeType = 'EDP' | 'EDT' | 'Parfum' | 'Cologne';
export type PerfumeGender = 'Male' | 'Female' | 'Unisex';
export type PerfumeStatus = 'Active' | 'Inactive';

export interface Perfume {
  autoid: number;
  syskey: string;
  code: string;
  brand_syskey: string;
  brand_name?: string;
  name: string;
  type: PerfumeType;
  size_ml: number;
  qty: number;
  gender: PerfumeGender;
  original_price: number;
  sell_price: number;
  discount_percent: number;
  status: PerfumeStatus;
  createdby?: string | null;
  createddate: Date | string;
  modifiedby?: string | null;
  modifieddate?: Date | string | null;
}

export interface CreatePerfumeDto {
  code: string;
  brand_syskey: string;
  name: string;
  type?: PerfumeType;
  size_ml: number;
  qty?: number;
  gender?: PerfumeGender;
  original_price?: number;
  sell_price?: number;
  discount_percent?: number;
  status?: PerfumeStatus;
  createdby?: string;
}

