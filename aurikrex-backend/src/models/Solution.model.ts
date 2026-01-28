import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { log } from '../utils/logger.js';

// Solution verification from FalkeAI
export interface SolutionVerification {
  isCorrect: boolean;
  accuracy: number; // 0-100
  
  // Strengths and weaknesses
  strengths: string[];
  weaknesses: string[];
  
  // Detailed error analysis
  errors: {
    type: string;
    location: string;
    issue: string;
    correction: string;
    explanation: string;
  }[];
  
  // Correct solution (revealed after attempt)
  correctSolution: {
    code?: string;
    explanation: string;
    alternativeApproaches?: string[];
  };
  
  // Rating and feedback
  rating: number; // 0-100
  feedback: string;
  nextSteps: string[];
  
  // Concepts analysis
  conceptsMastered: string[];
  conceptsToReview: string[];
}

// Main solution document interface
export interface SolutionDocument {
  _id?: ObjectId;
  assignmentId: ObjectId;
  studentId: string;
  
  // Solution content
  solutionType: 'file' | 'text';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  textContent?: string;
  
  // FalkeAI Verification
  verification?: SolutionVerification;
  
  // Metadata
  submittedAt: Date;
  gradedAt?: Date;
  attempt: number; // 1st, 2nd, 3rd attempt
}

export class SolutionModel {
  private static collectionName = 'solutions';

  private static getCollection(): Collection<SolutionDocument> {
    return getDB().collection<SolutionDocument>(this.collectionName);
  }

  /**
   * Create a new solution
   */
  static async create(data: {
    assignmentId: string | ObjectId;
    studentId: string;
    solutionType: 'file' | 'text';
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    textContent?: string;
  }): Promise<SolutionDocument> {
    try {
      const collection = this.getCollection();
      const assignmentId = typeof data.assignmentId === 'string' 
        ? new ObjectId(data.assignmentId) 
        : data.assignmentId;

      // Get attempt number
      const previousAttempts = await collection.countDocuments({
        assignmentId,
        studentId: data.studentId
      });

      const solution: SolutionDocument = {
        assignmentId,
        studentId: data.studentId,
        solutionType: data.solutionType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        textContent: data.textContent,
        submittedAt: new Date(),
        attempt: previousAttempts + 1
      };

      const result = await collection.insertOne(solution);
      log.info('✅ Solution created', { 
        solutionId: result.insertedId,
        assignmentId: assignmentId.toString(),
        studentId: data.studentId,
        attempt: solution.attempt
      });

      return { ...solution, _id: result.insertedId };
    } catch (error) {
      log.error('❌ Error creating solution', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId: data.assignmentId,
        studentId: data.studentId
      });
      throw error;
    }
  }

  /**
   * Find solution by ID
   */
  static async findById(solutionId: string | ObjectId): Promise<SolutionDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof solutionId === 'string' ? new ObjectId(solutionId) : solutionId;
      
      const solution = await collection.findOne({ _id });
      
      if (solution) {
        log.info('✅ Solution found', { solutionId: _id.toString() });
      }
      
      return solution;
    } catch (error) {
      log.error('❌ Error finding solution', {
        error: error instanceof Error ? error.message : String(error),
        solutionId
      });
      throw error;
    }
  }

  /**
   * Get all solutions for an assignment
   */
  static async findByAssignmentId(
    assignmentId: string | ObjectId,
    studentId?: string
  ): Promise<SolutionDocument[]> {
    try {
      const collection = this.getCollection();
      const _assignmentId = typeof assignmentId === 'string' 
        ? new ObjectId(assignmentId) 
        : assignmentId;
      
      const filter: any = { assignmentId: _assignmentId };
      if (studentId) {
        filter.studentId = studentId;
      }

      const solutions = await collection
        .find(filter)
        .sort({ attempt: 1 })
        .toArray();

      log.info('✅ Solutions retrieved for assignment', { 
        assignmentId: _assignmentId.toString(),
        count: solutions.length
      });

      return solutions;
    } catch (error) {
      log.error('❌ Error getting assignment solutions', {
        error: error instanceof Error ? error.message : String(error),
        assignmentId
      });
      throw error;
    }
  }

  /**
   * Get all solutions for a student
   */
  static async findByStudentId(
    studentId: string,
    options: {
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<{ solutions: SolutionDocument[]; total: number }> {
    try {
      const collection = this.getCollection();
      const limit = options.limit || 50;
      const skip = options.skip || 0;

      const [solutions, total] = await Promise.all([
        collection
          .find({ studentId })
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({ studentId })
      ]);

      log.info('✅ Solutions retrieved for student', { 
        studentId, 
        count: solutions.length,
        total
      });

      return { solutions, total };
    } catch (error) {
      log.error('❌ Error getting student solutions', {
        error: error instanceof Error ? error.message : String(error),
        studentId
      });
      throw error;
    }
  }

  /**
   * Update solution with verification results
   */
  static async updateVerification(
    solutionId: string | ObjectId,
    verification: SolutionVerification
  ): Promise<SolutionDocument | null> {
    try {
      const collection = this.getCollection();
      const _id = typeof solutionId === 'string' ? new ObjectId(solutionId) : solutionId;

      const result = await collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            verification,
            gradedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        log.info('✅ Solution verification updated', { 
          solutionId: _id.toString(),
          isCorrect: verification.isCorrect,
          accuracy: verification.accuracy
        });
      }

      return result || null;
    } catch (error) {
      log.error('❌ Error updating solution verification', {
        error: error instanceof Error ? error.message : String(error),
        solutionId
      });
      throw error;
    }
  }

  /**
   * Get solution stats for a student
   */
  static async getStats(studentId: string): Promise<{
    totalSolutions: number;
    averageAccuracy: number;
    totalCorrect: number;
    averageAttempts: number;
    conceptsMastered: string[];
    conceptsToReview: string[];
  }> {
    try {
      const collection = this.getCollection();
      
      const solutions = await collection
        .find({ studentId, verification: { $exists: true } })
        .toArray();

      if (solutions.length === 0) {
        return {
          totalSolutions: 0,
          averageAccuracy: 0,
          totalCorrect: 0,
          averageAttempts: 0,
          conceptsMastered: [],
          conceptsToReview: []
        };
      }

      let totalAccuracy = 0;
      let totalCorrect = 0;
      let totalAttempts = 0;
      const conceptsMasteredSet = new Set<string>();
      const conceptsToReviewSet = new Set<string>();

      for (const solution of solutions) {
        if (solution.verification) {
          totalAccuracy += solution.verification.accuracy;
          if (solution.verification.isCorrect) totalCorrect++;
          totalAttempts += solution.attempt;
          
          solution.verification.conceptsMastered?.forEach(c => conceptsMasteredSet.add(c));
          solution.verification.conceptsToReview?.forEach(c => conceptsToReviewSet.add(c));
        }
      }

      const stats = {
        totalSolutions: solutions.length,
        averageAccuracy: Math.round(totalAccuracy / solutions.length),
        totalCorrect,
        averageAttempts: Math.round((totalAttempts / solutions.length) * 10) / 10,
        conceptsMastered: Array.from(conceptsMasteredSet),
        conceptsToReview: Array.from(conceptsToReviewSet)
      };

      log.info('✅ Solution stats retrieved', { studentId, stats });
      return stats;
    } catch (error) {
      log.error('❌ Error getting solution stats', {
        error: error instanceof Error ? error.message : String(error),
        studentId
      });
      throw error;
    }
  }

  /**
   * Delete solution
   */
  static async delete(solutionId: string | ObjectId): Promise<boolean> {
    try {
      const collection = this.getCollection();
      const _id = typeof solutionId === 'string' ? new ObjectId(solutionId) : solutionId;

      const result = await collection.deleteOne({ _id });
      
      if (result.deletedCount > 0) {
        log.info('✅ Solution deleted', { solutionId: _id.toString() });
        return true;
      }
      
      return false;
    } catch (error) {
      log.error('❌ Error deleting solution', {
        error: error instanceof Error ? error.message : String(error),
        solutionId
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
        collection.createIndex({ assignmentId: 1 }),
        collection.createIndex({ studentId: 1 }),
        collection.createIndex({ submittedAt: -1 }),
        collection.createIndex({ assignmentId: 1, studentId: 1 }),
        collection.createIndex({ studentId: 1, submittedAt: -1 }),
      ]);

      log.info('✅ Solution indexes created successfully');
    } catch (error) {
      log.error('❌ Error creating solution indexes', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
