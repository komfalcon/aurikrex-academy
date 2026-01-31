import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

export interface BookCategoryDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  bookCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Default categories for the book system
export const DEFAULT_BOOK_CATEGORIES = [
  { name: 'textbook', icon: '📖', color: '#667eea', description: 'Academic textbooks and course materials' },
  { name: 'reference', icon: '📚', color: '#764ba2', description: 'Reference materials and guides' },
  { name: 'notes', icon: '📝', color: '#f093fb', description: 'Study notes and summaries' },
  { name: 'slides', icon: '🎯', color: '#4facfe', description: 'Presentation slides and lectures' },
  { name: 'research', icon: '🔬', color: '#43e97b', description: 'Research papers and articles' },
  { name: 'material', icon: '📄', color: '#fa709a', description: 'Additional learning materials' },
  { name: 'other', icon: '📋', color: '#30cfd0', description: 'Other educational content' },
];

export class BookCategoryModel {
  private static collectionName = 'book_categories';

  private static getCollection(): Collection<BookCategoryDocument> {
    return getDB().collection<BookCategoryDocument>(this.collectionName);
  }

  /**
   * Create a new category
   */
  static async create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<BookCategoryDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      // Check if category already exists
      const existing = await collection.findOne({ name: data.name.toLowerCase() });
      if (existing) {
        throw new Error('Category already exists');
      }

      const category: BookCategoryDocument = {
        name: data.name.toLowerCase(),
        description: data.description,
        icon: data.icon,
        color: data.color,
        bookCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(category);
      
      log.info('✅ Book category created successfully', { 
        categoryId: result.insertedId,
        name: data.name
      });

      return { ...category, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating book category', { 
        error: error instanceof Error ? error.message : String(error),
        name: data.name
      });
      throw error;
    }
  }

  /**
   * Find category by ID
   */
  static async findById(categoryId: string | ObjectId): Promise<BookCategoryDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof categoryId === 'string' ? new ObjectId(categoryId) : categoryId;
      return await collection.findOne({ _id });
    } catch (error) {
      log.error('❌ Error finding category by ID', { 
        error: error instanceof Error ? error.message : String(error),
        categoryId 
      });
      throw error;
    }
  }

  /**
   * Find category by name
   */
  static async findByName(name: string): Promise<BookCategoryDocument | null> {
    try {
      const collection = this.getCollection();
      return await collection.findOne({ name: name.toLowerCase() });
    } catch (error) {
      log.error('❌ Error finding category by name', { 
        error: error instanceof Error ? error.message : String(error),
        name 
      });
      throw error;
    }
  }

  /**
   * Get all categories
   */
  static async getAll(): Promise<BookCategoryDocument[]> {
    try {
      const collection = this.getCollection();
      const categories = await collection.find().sort({ name: 1 }).toArray();
      
      log.info('✅ Categories retrieved', { count: categories.length });
      return categories;
    } catch (error) {
      log.error('❌ Error getting all categories', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get all categories with formatted response
   */
  static async getAllFormatted(): Promise<Array<{
    name: string;
    icon: string;
    color: string;
    description?: string;
    bookCount: number;
  }>> {
    try {
      const categories = await this.getAll();
      
      // If no categories in DB, return defaults
      if (categories.length === 0) {
        return DEFAULT_BOOK_CATEGORIES.map(cat => ({
          ...cat,
          bookCount: 0
        }));
      }
      
      return categories.map(cat => ({
        name: cat.name,
        icon: cat.icon || '📚',
        color: cat.color || '#667eea',
        description: cat.description,
        bookCount: cat.bookCount
      }));
    } catch (error) {
      log.error('❌ Error getting formatted categories', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Return defaults on error
      return DEFAULT_BOOK_CATEGORIES.map(cat => ({
        ...cat,
        bookCount: 0
      }));
    }
  }

  /**
   * Update category
   */
  static async update(
    categoryId: string | ObjectId,
    updateData: Partial<Pick<BookCategoryDocument, 'description' | 'icon' | 'color'>>
  ): Promise<BookCategoryDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof categoryId === 'string' ? new ObjectId(categoryId) : categoryId;

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: { ...updateData, updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Category updated successfully', { categoryId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating category', { 
        error: error instanceof Error ? error.message : String(error),
        categoryId 
      });
      throw error;
    }
  }

  /**
   * Increment book count for a category
   */
  static async incrementBookCount(categoryName: string): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.updateOne(
        { name: categoryName.toLowerCase() },
        { $inc: { bookCount: 1 }, $set: { updatedAt: new Date() } }
      );
    } catch (error) {
      log.error('❌ Error incrementing book count', { 
        error: error instanceof Error ? error.message : String(error),
        categoryName 
      });
    }
  }

  /**
   * Decrement book count for a category
   */
  static async decrementBookCount(categoryName: string): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.updateOne(
        { name: categoryName.toLowerCase() },
        { $inc: { bookCount: -1 }, $set: { updatedAt: new Date() } }
      );
    } catch (error) {
      log.error('❌ Error decrementing book count', { 
        error: error instanceof Error ? error.message : String(error),
        categoryName 
      });
    }
  }

  /**
   * Delete category
   */
  static async delete(categoryId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof categoryId === 'string' ? new ObjectId(categoryId) : categoryId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Category deleted successfully', { categoryId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting category', { 
        error: error instanceof Error ? error.message : String(error),
        categoryId 
      });
      throw error;
    }
  }

  /**
   * Initialize default categories
   */
  static async initializeDefaults(): Promise<void> {
    try {
      const collection = this.getCollection();
      const existingCount = await collection.countDocuments();
      
      if (existingCount === 0) {
        const now = new Date();
        const defaultDocs = DEFAULT_BOOK_CATEGORIES.map(cat => ({
          ...cat,
          bookCount: 0,
          createdAt: now,
          updatedAt: now,
        }));
        
        await collection.insertMany(defaultDocs);
        log.info('✅ Default book categories initialized', { count: defaultDocs.length });
      }
    } catch (error) {
      log.error('❌ Error initializing default categories', { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create indexes for optimal performance
   */
  static async createIndexes(): Promise<void> {
    try {
      const collection = this.getCollection();
      
      await Promise.all([
        collection.createIndex({ name: 1 }, { unique: true }),
      ]);

      log.info('✅ BookCategory indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating BookCategory indexes', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
