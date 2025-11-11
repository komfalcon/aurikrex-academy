import { Collection, ObjectId, Filter, UpdateFilter, FindOptions } from 'mongodb';
import { getDB } from '../config/mongodb';
import { log } from '../utils/logger';
import bcrypt from 'bcryptjs';

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  password: string; // Hashed password
  displayName?: string;
  role: 'student' | 'instructor' | 'admin';
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
  emailVerified: boolean;
  photoURL?: string;
  preferences: {
    [key: string]: any;
  };
  progress: {
    completedLessons: number;
    totalTimeSpent: number;
  };
}

export class UserModel {
  private static collectionName = 'users';

  private static getCollection(): Collection<UserDocument> {
    return getDB().collection<UserDocument>(this.collectionName);
  }

  /**
   * Create a new user
   */
  static async create(userData: {
    email: string;
    password: string;
    displayName?: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<UserDocument> {
    try {
      const collection = this.getCollection();

      // Check if user already exists
      const existingUser = await collection.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const now = new Date();
      const user: UserDocument = {
        email: userData.email,
        password: hashedPassword,
        displayName: userData.displayName || userData.email.split('@')[0],
        role: userData.role || 'student',
        disabled: false,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
        emailVerified: false,
        preferences: {},
        progress: {
          completedLessons: 0,
          totalTimeSpent: 0
        }
      };

      const result = await collection.insertOne(user);
      log.info('✅ User created successfully', { 
        userId: result.insertedId,
        email: userData.email 
      });

      return { ...user, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating user', { 
        error: error instanceof Error ? error.message : String(error),
        email: userData.email 
      });
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(userId: string | ObjectId): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;
      
      const user = await collection.findOne({ _id });
      
      if (user) {
        log.info('✅ User found by ID', { userId: _id.toString() });
      }
      
      return user;
    } catch (error) {
      log.error('❌ Error finding user by ID', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const user = await collection.findOne({ email });
      
      if (user) {
        log.info('✅ User found by email', { email });
      }
      
      return user;
    } catch (error) {
      log.error('❌ Error finding user by email', { 
        error: error instanceof Error ? error.message : String(error),
        email 
      });
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(
    userId: string | ObjectId,
    updateData: Partial<UserDocument>
  ): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const update: UpdateFilter<UserDocument> = {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id },
        update,
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ User updated successfully', { userId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating user', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(userId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ User deleted successfully', { userId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting user', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * List users with pagination
   */
  static async list(options: {
    page?: number;
    limit?: number;
    filter?: Filter<UserDocument>;
  } = {}): Promise<{ users: UserDocument[]; total: number; page: number; limit: number }> {
    try {
      const collection = this.getCollection();
      const page = options.page || 1;
      const limit = options.limit || 100;
      const skip = (page - 1) * limit;

      const filter = options.filter || {};

      const [users, total] = await Promise.all([
        collection.find(filter).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Users listed successfully', { 
        page, 
        limit, 
        total,
        returned: users.length 
      });

      return { users, total, page, limit };
    } catch (error) {
      log.error('❌ Error listing users', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Verify password
   */
  static async verifyPassword(email: string, password: string): Promise<UserDocument | null> {
    try {
      const user = await this.findByEmail(email);
      
      if (!user) {
        log.warn('⚠️ User not found during password verification', { email });
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        log.info('✅ Password verified successfully', { email });
        
        // Update last login
        await this.update(user._id!, { lastLogin: new Date() });
        
        return user;
      }
      
      log.warn('⚠️ Invalid password attempt', { email });
      return null;
    } catch (error) {
      log.error('❌ Error verifying password', { 
        error: error instanceof Error ? error.message : String(error),
        email 
      });
      throw error;
    }
  }

  /**
   * Update user progress
   */
  static async updateProgress(
    userId: string | ObjectId,
    progressData: Partial<UserDocument['progress']>
  ): Promise<UserDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const result = await collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            'progress': progressData,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ User progress updated', { userId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating user progress', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Create indexes for optimal performance
   */
  static async createIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      
      await Promise.all([
        collection.createIndex({ email: 1 }, { unique: true }),
        collection.createIndex({ role: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ disabled: 1 })
      ]);

      log.info('✅ User indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating user indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
