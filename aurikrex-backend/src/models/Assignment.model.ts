import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

// Assignment types
export type AssignmentType = 'problem' | 'essay' | 'code' | 'math' | 'creative';
export type AssignmentStatus = 'pending' | 'analyzed' | 'attempted' | 'submitted' | 'graded';
export type Difficulty = 'easy' | 'medium' | 'hard';

// AI-Generated hints interface
export interface AssignmentHints {
  conceptsInvolved: string[];
  approachSuggestion: string;
  commonMistakes: string[];
  stepByStep: {
    stepNumber: number;
    guidance: string;
    keyThink: string;
  }[];
  resources: string[];
}

// Assignment analysis from FalkeAI
export interface AssignmentAnalysis {
  type: AssignmentType;
  title: string;
  description: string;
  hints: AssignmentHints;
  estimatedDifficulty: Difficulty;
  estimatedTime: number; // in minutes
  rubric?: {
    criteria: string;
    points: number;
  }[];
}

// Main assignment document interface
export interface AssignmentDocument {
  _id?: ObjectId;
  studentId: string;
  title: string;
  description: string;
  assignmentType: 'upload' | 'text';
  
  // Original content
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  textContent?: string;
  
  // FalkeAI Analysis
  analysis?: AssignmentAnalysis;
  
  // Status
  status: AssignmentStatus;
  
  // Solutions linked
  solutionIds: ObjectId[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  lastAttemptAt?: Date;
}

export class AssignmentModel {
  private static collectionName = 'assignments';

  private static getCollection(): Collection<AssignmentDocument> {
    return getDB().collection<AssignmentDocument>(this.collectionName);
  }

  /**
   * Create a new assignment
   */
  static async create(data: {
    studentId: string;
    title: string;
    description?: string;
    assignmentType: 'upload' | 'text';
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    textContent?: string;
    deadline?: Date;
  }): Promise<AssignmentDocument> {
    try {
      const collection = this.getCollection();
      const now = new Date();

      const assignment: AssignmentDocument = {
        studentId: data.studentId,
        title: data.title,
        description: data.description || '',
        assignmentType: data.assignmentType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        textContent: data.textContent,
        status: 'pending',
        solutionIds: [],
        createdAt: now,
        updatedAt: now,
        deadline: data.deadline,
      };

      const result = await collection.insertOne(assignment);
      log.info('✅ Assignment created', { 
        assignmentId: result.insertedId,
        studentId: data.studentId,
        type: data.assignmentType
      });

      return { ...assignment, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating assignment', {
        error: error instanceof Error ? error.message : String(error),
        studentId: data.studentId
      });
      throw error;
    }
  }

  /**
   * Find assignment by ID
   */
  static async findById(assignmentId: string | ObjectId): Promise<AssignmentDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof assignmentId === 'string' ? new ObjectId(assignmentId) : assignmentId;
      
      const assignment = await collection.findOne({ _id });
      
      if (assignment) {
        log.info('✅ Assignment found', { assignmentId: _id.toString() });
      }
      
      return assignment;
    } catch (error) {
      log.error('❌ Error finding assignment', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Get all assignments for a student
   */
  static async findByStudentId(
    studentId: string,
    options: {
      status?: AssignmentStatus;
      limit?: number;
      skip?: number;
      sortBy?: 'createdAt' | 'updatedAt' | 'deadline';
      sortOrder?: 1 | -1;
    } = {}
  ): Promise<{ assignments: AssignmentDocument[]; total: number }> {
    try {
      const collection = this.getCollection();
      const filter: any = { studentId };
      
      if (options.status) {
        filter.status = options.status;
      }

      const sortField = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || -1;
      const limit = options.limit || 50;
      const skip = options.skip || 0;

      const [assignments, total] = await Promise.all([
        collection
          .find(filter)
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter)
      ]);

      log.info('✅ Assignments retrieved', { 
        studentId, 
        count: assignments.length,
        total 
      });

      return { assignments, total };
    } catch (error) {
      log.error('❌ Error getting student assignments', {
        error: error instanceof Error ? error.message : String(error),
        studentId
      });
      throw error;
    }
  }

  /**
   * Update assignment with AI analysis
   */
  static async updateAnalysis(
    assignmentId: string | ObjectId,
    analysis: AssignmentAnalysis
  ): Promise<AssignmentDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof assignmentId === 'string' ? new ObjectId(assignmentId) : assignmentId;

      const result = await collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            analysis,
            status: 'analyzed',
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Assignment analysis updated', { assignmentId: _id.toString() });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating assignment analysis', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  static async updateStatus(
    assignmentId: string | ObjectId,
    status: AssignmentStatus
  ): Promise<AssignmentDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof assignmentId === 'string' ? new ObjectId(assignmentId) : assignmentId;

      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (status === 'attempted') {
        updateData.lastAttemptAt = new Date();
      }

      const result = await collection.findOneAndUpdate(
        { _id },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Assignment status updated', { 
          assignmentId: _id.toString(),
          status
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating assignment status', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Add solution reference to assignment
   */
  static async addSolution(
    assignmentId: string | ObjectId,
    solutionId: ObjectId
  ): Promise<AssignmentDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof assignmentId === 'string' ? new ObjectId(assignmentId) : assignmentId;

      const result = await collection.findOneAndUpdate(
        { _id },
        {
          $push: { solutionIds: solutionId },
          $set: { 
            status: 'attempted',
            lastAttemptAt: new Date(),
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Solution added to assignment', { 
          assignmentId: _id.toString(),
          solutionId: solutionId.toString()
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error adding solution to assignment', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Delete assignment
   */
  static async delete(assignmentId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof assignmentId === 'string' ? new ObjectId(assignmentId) : assignmentId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Assignment deleted', { assignmentId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting assignment', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Get assignment stats for a student
   */
  static async getStats(studentId: string): Promise<{
    total: number;
    pending: number;
    analyzed: number;
    attempted: number;
    submitted: number;
    graded: number;
  }> {
    try {
      const collection = this.getCollection();
      
      const pipeline = [
        { $match: { studentId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      
      const stats = {
        total: 0,
        pending: 0,
        analyzed: 0,
        attempted: 0,
        submitted: 0,
        graded: 0
      };

      for (const r of results) {
        const status = r._id as AssignmentStatus;
        if (status in stats) {
          stats[status] = r.count;
        }
        stats.total += r.count;
      }

      log.info('✅ Assignment stats retrieved', { studentId, stats });
      return stats;
    } catch (error) {
      log.error('❌ Error getting assignment stats', {
        error: error instanceof Error ? error.message : String(error),
        studentId
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
        collection.createIndex({ studentId: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ studentId: 1, status: 1 }),
        collection.createIndex({ deadline: 1 }),
      ]);

      log.info('✅ Assignment indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating assignment indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
