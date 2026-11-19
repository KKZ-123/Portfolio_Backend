import { BrandRepository } from '../repositories/brand.repository';
import { Brand, CreateBrandDto } from '../types/brand.types';
import { AppError } from '../utils/appError';
import { Service, Inject } from 'typedi';

@Service()
export class BrandService {
  @Inject(() => BrandRepository)
  private brandRepo!: BrandRepository;

  async getAllBrands(): Promise<Brand[]> {
    return this.brandRepo.findAll();
  }

  async createBrand(dto: CreateBrandDto): Promise<Brand> {
    if (!dto || typeof dto.name !== 'string' || !dto.name.trim()) {
      throw new AppError('Brand name is required', 400);
    }

    const trimmedName = dto.name.trim();
    if (trimmedName.length > 100) {
      throw new AppError('Brand name must not exceed 100 characters', 400);
    }

    const existingBrand = await this.brandRepo.findByName(trimmedName);
    if (existingBrand) {
      throw new AppError('A brand with this name already exists', 409);
    }

    try {
      return await this.brandRepo.create({ name: trimmedName });
    } catch (error: any) {
      // Handle PostgreSQL unique_violation for concurrent requests
      if (error?.code === '23505') {
        throw new AppError('A brand with this name already exists', 409);
      }
      throw error;
    }
  }
}

export const brandService = new BrandService();

