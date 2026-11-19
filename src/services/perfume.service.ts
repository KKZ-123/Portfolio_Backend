import { PerfumeRepository } from '../repositories/perfume.repository';
import { BrandRepository } from '../repositories/brand.repository';
import {
  Perfume,
  CreatePerfumeDto,
  PerfumeType,
  PerfumeGender,
  PerfumeStatus,
} from '../types/perfume.types';
import { AppError } from '../utils/appError';
import { Service, Inject } from 'typedi';

const VALID_TYPES: PerfumeType[] = ['EDP', 'EDT', 'Parfum', 'Cologne'];
const VALID_GENDERS: PerfumeGender[] = ['Male', 'Female', 'Unisex'];
const VALID_STATUSES: PerfumeStatus[] = ['Active', 'Inactive'];

@Service()
export class PerfumeService {
  @Inject(() => PerfumeRepository)
  private perfumeRepo!: PerfumeRepository;

  @Inject(() => BrandRepository)
  private brandRepo!: BrandRepository;

  async getAllPerfumes(): Promise<Perfume[]> {
    return this.perfumeRepo.findAll();
  }

  async getPerfumeBySyskey(syskey: string): Promise<Perfume> {
    if (!syskey || typeof syskey !== 'string' || !syskey.trim()) {
      throw new AppError('Perfume syskey is required', 400);
    }

    const perfume = await this.perfumeRepo.findBySyskey(syskey.trim());
    if (!perfume) {
      throw new AppError('Perfume not found', 404);
    }
    return perfume;
  }

  async createPerfume(dto: CreatePerfumeDto, createdBy?: string): Promise<Perfume> {
    if (!dto || typeof dto !== 'object') {
      throw new AppError('Request body is required', 400);
    }

    // 1. Validate Code
    if (!dto.code || typeof dto.code !== 'string' || !dto.code.trim()) {
      throw new AppError('Perfume code is required', 400);
    }
    const trimmedCode = dto.code.trim();
    if (trimmedCode.length > 50) {
      throw new AppError('Perfume code must not exceed 50 characters', 400);
    }

    // 2. Validate Name
    if (!dto.name || typeof dto.name !== 'string' || !dto.name.trim()) {
      throw new AppError('Perfume name is required', 400);
    }
    const trimmedName = dto.name.trim();
    if (trimmedName.length > 150) {
      throw new AppError('Perfume name must not exceed 150 characters', 400);
    }

    // 3. Validate Brand Syskey
    if (!dto.brand_syskey || typeof dto.brand_syskey !== 'string' || !dto.brand_syskey.trim()) {
      throw new AppError('brand_syskey is required', 400);
    }
    const trimmedBrandSyskey = dto.brand_syskey.trim();
    const brand = await this.brandRepo.findBySyskey(trimmedBrandSyskey);
    if (!brand) {
      throw new AppError(`Brand not found with syskey: ${trimmedBrandSyskey}`, 404);
    }

    // 4. Validate Size (ml)
    if (dto.size_ml === undefined || dto.size_ml === null || typeof dto.size_ml !== 'number' || isNaN(dto.size_ml)) {
      throw new AppError('size_ml is required and must be a number', 400);
    }
    if (dto.size_ml <= 0 || !Number.isInteger(dto.size_ml)) {
      throw new AppError('size_ml must be a positive integer greater than 0', 400);
    }

    // 5. Validate Type (optional, default EDP)
    let type: PerfumeType = 'EDP';
    if (dto.type !== undefined && dto.type !== null) {
      if (!VALID_TYPES.includes(dto.type)) {
        throw new AppError(`type must be one of: ${VALID_TYPES.join(', ')}`, 400);
      }
      type = dto.type;
    }

    // 6. Validate Quantity (optional, default 0)
    let qty = 0;
    if (dto.qty !== undefined && dto.qty !== null) {
      if (typeof dto.qty !== 'number' || isNaN(dto.qty) || dto.qty < 0 || !Number.isInteger(dto.qty)) {
        throw new AppError('qty must be a non-negative integer (>= 0)', 400);
      }
      qty = dto.qty;
    }

    // 7. Validate Gender (optional, default Unisex)
    let gender: PerfumeGender = 'Unisex';
    if (dto.gender !== undefined && dto.gender !== null) {
      if (!VALID_GENDERS.includes(dto.gender)) {
        throw new AppError(`gender must be one of: ${VALID_GENDERS.join(', ')}`, 400);
      }
      gender = dto.gender;
    }

    // 8. Validate Original Price (optional, default 0)
    let originalPrice = 0;
    if (dto.original_price !== undefined && dto.original_price !== null) {
      if (typeof dto.original_price !== 'number' || isNaN(dto.original_price) || dto.original_price < 0) {
        throw new AppError('original_price must be a non-negative number (>= 0)', 400);
      }
      originalPrice = dto.original_price;
    }

    // 9. Validate Sell Price (optional, default 0)
    let sellPrice = 0;
    if (dto.sell_price !== undefined && dto.sell_price !== null) {
      if (typeof dto.sell_price !== 'number' || isNaN(dto.sell_price) || dto.sell_price < 0) {
        throw new AppError('sell_price must be a non-negative number (>= 0)', 400);
      }
      sellPrice = dto.sell_price;
    }

    // 10. Validate Discount Percent (optional, default 0)
    let discountPercent = 0;
    if (dto.discount_percent !== undefined && dto.discount_percent !== null) {
      if (
        typeof dto.discount_percent !== 'number' ||
        isNaN(dto.discount_percent) ||
        dto.discount_percent < 0 ||
        dto.discount_percent > 100
      ) {
        throw new AppError('discount_percent must be a number between 0 and 100', 400);
      }
      discountPercent = dto.discount_percent;
    }

    // 11. Validate Status (optional, default Active)
    let status: PerfumeStatus = 'Active';
    if (dto.status !== undefined && dto.status !== null) {
      if (!VALID_STATUSES.includes(dto.status)) {
        throw new AppError(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
      }
      status = dto.status;
    }

    // 12. Check Code Uniqueness
    const existing = await this.perfumeRepo.findByCode(trimmedCode);
    if (existing) {
      throw new AppError(`A perfume with code '${trimmedCode}' already exists`, 409);
    }

    try {
      const created = await this.perfumeRepo.create(
        {
          code: trimmedCode,
          brand_syskey: trimmedBrandSyskey,
          name: trimmedName,
          type,
          size_ml: dto.size_ml,
          qty,
          gender,
          original_price: originalPrice,
          sell_price: sellPrice,
          discount_percent: discountPercent,
          status,
          createdby: createdBy || dto.createdby,
        },
        createdBy || dto.createdby
      );

      // Return created perfume with brand name populated
      return {
        ...created,
        brand_name: brand.name,
      };
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new AppError(`A perfume with code '${trimmedCode}' already exists`, 409);
      }
      if (error?.code === '23503') {
        throw new AppError(`Referenced brand does not exist: ${trimmedBrandSyskey}`, 404);
      }
      if (error?.code === '23514') {
        throw new AppError(`Validation failed on database constraints: ${error.message}`, 400);
      }
      throw error;
    }
  }
}

export const perfumeService = new PerfumeService();

