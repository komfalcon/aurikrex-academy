/**
 * Assignment Controller
 * 
 * Handles assignment-related HTTP requests for Aurikrex Academy.
 * Provides endpoints for creating, analyzing, and managing assignments.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';
import { AssignmentModel, AssignmentAnalysis } from '../models/Assignment.model.js';
import { SolutionModel, SolutionVerification } from '../models/Solution.model.js';
import { FalkeAIActivityModel } from '../models/FalkeAIActivity.model.js';
import { aiService } from '../services/AIService.js';

// Helper to extract string from params
const getParamId = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

/**
 * POST /api/assignments
 * Create a new assignment
 */
export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, assignmentType, textContent, fileUrl, fileName, fileType, deadline } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const assignment = await AssignmentModel.create({
      studentId: userId,
      title: title || 'Untitled Assignment',
      description,
      assignmentType,
      textContent,
      fileUrl,
      fileName,
      fileType,
      deadline: deadline ? new Date(deadline) : undefined
    });

    // Track activity
    await FalkeAIActivityModel.trackActivity({
      userId,
      activityType: 'assignment_upload',
      assignmentId: assignment._id?.toString(),
      timeSpent: 0,
      resultType: 'success'
    });

    log.info('✅ Assignment created via API', { assignmentId: assignment._id, userId });
    res.status(201).json({ status: 'success', data: assignment });
  } catch (error) {
    log.error('❌ Error creating assignment', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to create assignment' });
  }
};

/**
 * POST /api/assignments/:id/analyze
 * Analyze an assignment using FalkeAI
 */
export const analyzeAssignment = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    // Get the assignment
    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      res.status(404).json({ status: 'error', message: 'Assignment not found' });
      return;
    }

    // Verify ownership
    if (assignment.studentId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to analyze this assignment' });
      return;
    }

    // Build the prompt for FalkeAI
    const content = assignment.textContent || `File: ${assignment.fileName}`;
    const analysisPrompt = `You are FalkeAI, an educational AI tutor. Analyze this assignment and provide helpful guidance WITHOUT giving away the answers.

Assignment Title: ${assignment.title}
Assignment Content: ${content}

Please provide a JSON response with the following structure (respond with ONLY the JSON, no markdown):
{
  "type": "problem|essay|code|math|creative",
  "title": "A clear title for this assignment",
  "description": "Brief description of what this assignment is asking",
  "hints": {
    "conceptsInvolved": ["List of key concepts needed"],
    "approachSuggestion": "A helpful approach suggestion without giving the answer",
    "commonMistakes": ["Common mistakes to avoid"],
    "stepByStep": [
      { "stepNumber": 1, "guidance": "First step guidance", "keyThink": "What to think about" }
    ],
    "resources": ["Relevant topics to study"]
  },
  "estimatedDifficulty": "easy|medium|hard",
  "estimatedTime": 30,
  "rubric": [
    { "criteria": "Understanding of concepts", "points": 25 },
    { "criteria": "Correct application", "points": 50 },
    { "criteria": "Clarity of explanation", "points": 25 }
  ]
}`;

    // Call FalkeAI for analysis
    const aiResponse = await aiService.sendChatMessage({
      message: analysisPrompt,
      context: {
        page: 'Assignment',
        userId,
        username: 'Student'
      }
    });

    // Parse the AI response
    let analysis: AssignmentAnalysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback analysis if parsing fails
      analysis = {
        type: 'problem',
        title: assignment.title,
        description: 'Unable to fully analyze this assignment. Please review the content.',
        hints: {
          conceptsInvolved: ['General problem-solving'],
          approachSuggestion: 'Break down the problem into smaller parts and tackle each one.',
          commonMistakes: ['Not reading the full question', 'Rushing to the answer'],
          stepByStep: [
            { stepNumber: 1, guidance: 'Read the problem carefully', keyThink: 'What is being asked?' },
            { stepNumber: 2, guidance: 'Identify key information', keyThink: 'What data do I have?' },
            { stepNumber: 3, guidance: 'Plan your approach', keyThink: 'What method should I use?' }
          ],
          resources: ['Review relevant course materials']
        },
        estimatedDifficulty: 'medium',
        estimatedTime: 30
      };
    }

    // Update the assignment with analysis
    const updatedAssignment = await AssignmentModel.updateAnalysis(id, analysis);

    // Track activity
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    await FalkeAIActivityModel.trackActivity({
      userId,
      activityType: 'assignment_analysis',
      assignmentId: id,
      timeSpent,
      resultType: 'success',
      metadata: { analysisType: analysis.type }
    });

    log.info('✅ Assignment analyzed', { assignmentId: id, type: analysis.type });
    res.status(200).json({ status: 'success', data: updatedAssignment });
  } catch (error) {
    log.error('❌ Error analyzing assignment', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to analyze assignment' });
  }
};

/**
 * GET /api/assignments
 * Get all assignments for the current user
 */
export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { status, limit, skip, sortBy, sortOrder } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const result = await AssignmentModel.findByStudentId(userId, {
      status: status as any,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder === 'asc' ? 1 : -1
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    log.error('❌ Error getting assignments', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get assignments' });
  }
};

/**
 * GET /api/assignments/:id
 * Get a single assignment by ID
 */
export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      res.status(404).json({ status: 'error', message: 'Assignment not found' });
      return;
    }

    // Verify ownership
    if (assignment.studentId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to view this assignment' });
      return;
    }

    // Get solutions for this assignment
    const solutions = await SolutionModel.findByAssignmentId(id, userId);

    res.status(200).json({ 
      status: 'success', 
      data: { 
        assignment, 
        solutions 
      } 
    });
  } catch (error) {
    log.error('❌ Error getting assignment', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get assignment' });
  }
};

/**
 * GET /api/assignments/stats
 * Get assignment statistics for the current user
 */
export const getAssignmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const stats = await AssignmentModel.getStats(userId);
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    log.error('❌ Error getting assignment stats', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get assignment stats' });
  }
};

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const assignment = await AssignmentModel.findById(id);
    if (!assignment) {
      res.status(404).json({ status: 'error', message: 'Assignment not found' });
      return;
    }

    // Verify ownership
    if (assignment.studentId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to delete this assignment' });
      return;
    }

    await AssignmentModel.delete(id);
    res.status(200).json({ status: 'success', message: 'Assignment deleted' });
  } catch (error) {
    log.error('❌ Error deleting assignment', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to delete assignment' });
  }
};

/**
 * POST /api/solutions
 * Submit a solution for an assignment
 */
export const submitSolution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId, solutionType, textContent, fileUrl, fileName, fileType } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    // Verify assignment exists and belongs to user
    const assignment = await AssignmentModel.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ status: 'error', message: 'Assignment not found' });
      return;
    }

    if (assignment.studentId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to submit solution for this assignment' });
      return;
    }

    // Create solution
    const solution = await SolutionModel.create({
      assignmentId,
      studentId: userId,
      solutionType,
      textContent,
      fileUrl,
      fileName,
      fileType
    });

    // Add solution to assignment
    await AssignmentModel.addSolution(assignmentId, solution._id!);

    // Track activity
    await FalkeAIActivityModel.trackActivity({
      userId,
      activityType: 'solution_upload',
      assignmentId,
      timeSpent: 0,
      resultType: 'success'
    });

    log.info('✅ Solution submitted', { solutionId: solution._id, assignmentId });
    res.status(201).json({ status: 'success', data: solution });
  } catch (error) {
    log.error('❌ Error submitting solution', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to submit solution' });
  }
};

/**
 * POST /api/solutions/:id/verify
 * Verify a solution using FalkeAI
 */
export const verifySolution = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const id = getParamId(req.params.id);
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    // Get the solution
    const solution = await SolutionModel.findById(id);
    if (!solution) {
      res.status(404).json({ status: 'error', message: 'Solution not found' });
      return;
    }

    // Verify ownership
    if (solution.studentId !== userId) {
      res.status(403).json({ status: 'error', message: 'Not authorized to verify this solution' });
      return;
    }

    // Get the assignment
    const assignment = await AssignmentModel.findById(solution.assignmentId);
    if (!assignment) {
      res.status(404).json({ status: 'error', message: 'Assignment not found' });
      return;
    }

    // Build the verification prompt
    const solutionContent = solution.textContent || `File: ${solution.fileName}`;
    const assignmentContent = assignment.textContent || assignment.analysis?.description || assignment.title;
    
    const verificationPrompt = `You are FalkeAI, an educational AI tutor. Verify this student's solution and provide detailed feedback.

ASSIGNMENT:
${assignmentContent}

STUDENT'S SOLUTION:
${solutionContent}

Please provide a JSON response with the following structure (respond with ONLY the JSON, no markdown):
{
  "isCorrect": true/false,
  "accuracy": 0-100,
  "strengths": ["List of things done well"],
  "weaknesses": ["Areas needing improvement"],
  "errors": [
    {
      "type": "Logic error|Syntax error|Conceptual error|Calculation error",
      "location": "Where the error is",
      "issue": "What is wrong",
      "correction": "How to fix it",
      "explanation": "Why this matters"
    }
  ],
  "correctSolution": {
    "explanation": "Detailed correct solution with explanation",
    "alternativeApproaches": ["Other valid approaches"]
  },
  "rating": 0-100,
  "feedback": "Personalized encouraging feedback",
  "nextSteps": ["Specific steps to improve"],
  "conceptsMastered": ["Concepts demonstrated well"],
  "conceptsToReview": ["Concepts needing more work"]
}`;

    // Call FalkeAI for verification
    const aiResponse = await aiService.sendChatMessage({
      message: verificationPrompt,
      context: {
        page: 'Assignment',
        userId,
        username: 'Student'
      }
    });

    // Parse the AI response
    let verification: SolutionVerification;
    try {
      const jsonMatch = aiResponse.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verification = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback verification if parsing fails
      verification = {
        isCorrect: false,
        accuracy: 50,
        strengths: ['Attempted the problem'],
        weaknesses: ['Unable to fully analyze the solution'],
        errors: [],
        correctSolution: {
          explanation: 'Please review the solution with your instructor.',
          alternativeApproaches: []
        },
        rating: 50,
        feedback: 'Thank you for submitting your solution. Please review it with course materials.',
        nextSteps: ['Review the relevant concepts', 'Try similar practice problems'],
        conceptsMastered: [],
        conceptsToReview: []
      };
    }

    // Update the solution with verification
    const updatedSolution = await SolutionModel.updateVerification(id, verification);

    // Update assignment status if needed
    if (verification.isCorrect && verification.accuracy >= 80) {
      await AssignmentModel.updateStatus(solution.assignmentId, 'graded');
    }

    // Track activity
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    await FalkeAIActivityModel.trackActivity({
      userId,
      activityType: 'solution_verification',
      assignmentId: solution.assignmentId.toString(),
      timeSpent,
      resultType: verification.isCorrect ? 'success' : 'needs_improvement',
      resultScore: verification.accuracy,
      metadata: {
        conceptsMastered: verification.conceptsMastered,
        conceptsStruggling: verification.conceptsToReview
      }
    });

    log.info('✅ Solution verified', { 
      solutionId: id, 
      isCorrect: verification.isCorrect,
      accuracy: verification.accuracy 
    });
    res.status(200).json({ status: 'success', data: updatedSolution });
  } catch (error) {
    log.error('❌ Error verifying solution', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to verify solution' });
  }
};

/**
 * GET /api/solutions/:userId
 * Get all solutions for a user
 */
export const getSolutions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { limit, skip } = req.query;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const result = await SolutionModel.findByStudentId(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    log.error('❌ Error getting solutions', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get solutions' });
  }
};

/**
 * GET /api/solutions/stats
 * Get solution statistics for the current user
 */
export const getSolutionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'User not authenticated' });
      return;
    }

    const stats = await SolutionModel.getStats(userId);
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    log.error('❌ Error getting solution stats', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ status: 'error', message: 'Failed to get solution stats' });
  }
};
