import { Request, Response, NextFunction } from 'express';
import { Controller, Get, Post, Inject } from '../decorators';
import { BrandService } from '../services/brand.service';
import { Container } from 'typedi';
import { verify } from 'node:crypto';
import { verifyToken } from '../middlewares';

@Controller('/brands')
export class BrandController {
  @Inject(() => BrandService)
  private brandSvc!: BrandService;

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await this.brandSvc.getAllBrands();
      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  @Post('/', verifyToken)
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await this.brandSvc.createBrand(req.body);
      res.status(201).json({
        success: true,
        message: 'Brand created successfully',
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = Container.get(BrandController);

