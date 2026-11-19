import { Request, Response, NextFunction } from 'express';
import { Controller, Get, Post, Inject } from '../decorators';
import { PerfumeService } from '../services/perfume.service';
import { Container } from 'typedi';
import { verifyToken } from '../middlewares';

@Controller('/perfumes')
export class PerfumeController {
  @Inject(() => PerfumeService)
  private perfumeSvc!: PerfumeService;

  @Get('/')
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const perfumes = await this.perfumeSvc.getAllPerfumes();
      res.status(200).json({
        success: true,
        data: perfumes,
      });
    } catch (error) {
      next(error);
    }
  }

  @Get('/:syskey')
  async getBySyskey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { syskey } = req.params;
      const perfume = await this.perfumeSvc.getPerfumeBySyskey(syskey as string);
      res.status(200).json({
        success: true,
        data: perfume,
      });
    } catch (error) {
      next(error);
    }
  }

  @Post('/', verifyToken)
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user?.userid || req.body?.createdby;
      const perfume = await this.perfumeSvc.createPerfume(req.body, createdBy);
      res.status(201).json({
        success: true,
        message: 'Perfume created successfully',
        data: perfume,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const perfumeController = Container.get(PerfumeController);

