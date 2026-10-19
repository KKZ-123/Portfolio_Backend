import { UserRepository, userRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User } from '../types/user.types';
import { AppError } from '../utils/appError';

export class UserService {
  constructor(private userRepo: UserRepository = userRepository) {}

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

    return this.userRepo.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      role: dto.role || 'user',
    });
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    // Ensure user exists
    await this.getUserById(id);

    if (dto.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email)) {
        throw new AppError('Invalid email format', 400);
      }

      const existingUser = await this.userRepo.findByEmail(dto.email);
      if (existingUser && existingUser.id !== id) {
        throw new AppError('A user with this email already exists', 409);
      }
    }

    const updated = await this.userRepo.update(id, {
      ...(dto.name && { name: dto.name.trim() }),
      ...(dto.email && { email: dto.email.trim().toLowerCase() }),
      ...(dto.role && { role: dto.role }),
    });

    if (!updated) {
      throw new AppError('Failed to update user', 500);
    }

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Ensure user exists
    await this.getUserById(id);
    await this.userRepo.delete(id);
  }
}

// Export singleton instance
export const userService = new UserService();
