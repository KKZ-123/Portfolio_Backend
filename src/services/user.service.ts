import { UserRepository, userRepository } from '../repositories/user.repository';
import { CreateUserDto, LoginUserDto, UpdateUserDto, User, UserAuthResponse, RetokenDto, RetokenResponse } from '../types/user.types';
import { AppError } from '../utils/appError';
import { generateTokens, generateAccessToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import jwt from 'jsonwebtoken';
import { Service, Inject } from 'typedi';

@Service()
export class UserService {
  @Inject(() => UserRepository)
  private userRepo!: UserRepository;

  async getAllUsers(): Promise<User[]> {
    return this.userRepo.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new AppError(`User with id '${id}' not found`, 404);
    }
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    if (!dto.name || !dto.name.trim()) {
      throw new AppError('Name is required', 400);
    }
    if (!dto.email || !dto.email.trim()) {
      throw new AppError('Email is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new AppError('Invalid email format', 400);
    }

    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError('A user with this email already exists', 409);
    }

    const userid = dto.userid ? dto.userid.trim().toLowerCase() : dto.email.split('@')[0]?.toLowerCase();
    if (userid) {
      const existingByUserId = await this.userRepo.findByUserId(userid);
      if (existingByUserId) {
        throw new AppError('A user with this userid already exists', 409);
      }
    }

    return this.userRepo.create({
      userid,
      password: dto.password ? dto.password.trim() : '123456',
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      role: dto.role || 'user',
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    if (!dto.password || typeof dto.password !== 'string' || !dto.password.trim()) {
      throw new AppError('Password is required', 400);
    }

    // Ensure user exists
    await this.getUserById(id);

    const updated = await this.userRepo.update(id, {
      password: dto.password.trim(),
    });

    if (!updated) {
      throw new AppError('Failed to update password', 500);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Ensure user exists
    await this.getUserById(id);
    await this.userRepo.delete(id);
  }

  async authenticateUser(dto: LoginUserDto): Promise<UserAuthResponse> {
    if (!dto.userid || !dto.userid.trim()) {
      throw new AppError('userid is required', 400);
    }
    if (!dto.password || !dto.password.trim()) {
      throw new AppError('password is required', 400);
    }

    const user = await this.userRepo.findByCredentials(dto.userid.trim(), dto.password.trim());
    if (!user) {
      throw new AppError('Invalid userid or password', 401);
    }

    const { access_token, refresh_token } = generateTokens({
      userid: user.userid,
      email: user.email,
      role: user.role,
    });

    // Remove password from returned data for security
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      access_token,
      refresh_token,
    };
  }

  async retoken(dto: RetokenDto): Promise<RetokenResponse> {
    const { refresh_token, userid: inputUserId } = dto;
    if (!refresh_token || !refresh_token.trim()) {
      throw new AppError('refresh_token is required', 400);
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyRefreshToken(refresh_token.trim());
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token has expired. Please log in again.', 401);
      }
      throw new AppError('Invalid refresh token. Authentication failed.', 401);
    }

    const tokenUserId = decoded.userid;
    if (inputUserId && inputUserId.trim().toLowerCase() !== tokenUserId.toLowerCase()) {
      throw new AppError('Provided userid does not match refresh token', 400);
    }

    // Lookup user from repository to keep profile synchronized
    const user = await this.userRepo.findByUserId(tokenUserId);

    const payload: TokenPayload = {
      userid: user?.userid || tokenUserId,
      email: user?.email || decoded.email || '',
      role: user?.role || decoded.role || 'user',
    };

    const newAccessToken = generateAccessToken(payload);

    return {
      userid: payload.userid,
      access_token: newAccessToken,
    };
  }
}

// Export singleton instance
export const userService = new UserService();
