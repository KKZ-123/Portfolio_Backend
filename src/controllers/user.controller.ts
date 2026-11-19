import { Request, Response, NextFunction } from 'express';
import { Controller, Get, Post, Put, Delete, Inject } from '../decorators';
import { UserService } from '../services/user.service';
import { Container } from 'typedi';
import { loginRateLimiter } from '../middlewares/rateLimiter';
import { verifyToken } from '../middlewares';
import { AppError } from '../utils/appError';

@Controller('/users')
export class UserController {
  @Inject(() => UserService)
  private userSvc!: UserService;

  @Get('/', verifyToken)
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userSvc.getAllUsers();
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  @Get('/:id')
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userSvc.getUserById(id as string);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  @Post('/')
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userSvc.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  @Put('/', verifyToken)
  @Put('/:id', verifyToken)
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id || req.body.id || req.body.userid || req.user?.userid) as string;
      if (!id) {
        throw new AppError('User identifier is required', 400);
      }

      const { password } = req.body;
      if (!password || typeof password !== 'string' || !password.trim()) {
        throw new AppError('Password is required', 400);
      }

      const updatedUser = await this.userSvc.updateUser(id, { password: password.trim() });
      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  @Delete('/:id')
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.userSvc.deleteUser(id as string);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  @Post('/login', loginRateLimiter)
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userid, password } = req.body;
      const result = await this.userSvc.authenticateUser({ userid: userid.toLowerCase(), password });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  @Post('/retoken')
  async retoken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userid, access_token, refresh_token } = req.body;
      const result = await this.userSvc.retoken({ userid, access_token, refresh_token });
      res.status(200).json({
        success: true,
        message: 'Token reissued successfully',
        userid: result.userid,
        access_token: result.access_token
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance from TypeDI Container
export const userController = Container.get(UserController);
