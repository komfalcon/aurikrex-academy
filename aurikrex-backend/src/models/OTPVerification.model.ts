import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

export interface OTPDocument {
  _id?: ObjectId;
  email: string;
  otpHash: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

const OTP_EXPIRY_MINUTES = 10;

export class OTPVerificationModel {
  private static collectionName = 'otpVerifications';

  private static getCollection(): Collection<OTPDocument> {
    return getDB().collection<OTPDocument>(this.collectionName);
  }

  /**
   * Store a new OTP for email verification
   * Replaces any existing OTP for the same email
   */
  static async store(email: string, otpHash: string): Promise<OTPDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const otpData: OTPDocument = {
        email,
        otpHash,
        createdAt: now,
        expiresAt,
        used: false,
      };

      // Replace existing OTP for this email or insert new one
      await collection.updateOne(
        { email },
        { $set: otpData },
        { upsert: true }
      );

      log.info('OTP stored for verification', { email, expiresAt: expiresAt.toISOString() });
      return otpData;
    } catch (error) {
      log.error('Error storing OTP', {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw new Error('Failed to store verification code');
    }
  }

  /**
   * Find OTP by email
   */
  static async findByEmail(email: string): Promise<OTPDocument | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ email });
    } catch (error) {
      log.error('Error finding OTP', {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw error;
    }
  }

  /**
   * Mark OTP as used (invalidate it)
   */
  static async markAsUsed(email: string): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.deleteOne({ email });
      log.info('OTP invalidated after use', { email });
    } catch (error) {
      log.error('Error marking OTP as used', {
        error: error instanceof Error ? error.message : String(error),
        email,
      });
      throw error;
    }
  }

  /**
   * Delete expired OTPs for cleanup
   */
  static async deleteExpired(): Promise<number> {
    try {
      const collection = this.getCollection();
      const result = await collection.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount;
    } catch (error) {
      log.error('Error deleting expired OTPs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
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
        collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
      log.info('OTP verification indexes created successfully');
    } catch (error) {
      log.error('Error creating OTP indexes', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
