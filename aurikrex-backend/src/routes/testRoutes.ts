import { Router, Request, Response } from "express";
import { getDB } from "../config/mongodb.js";

const router = Router();

interface MongoTestDocument {
  message: string;
  timestamp: number;
  environment: string;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const db = getDB();
    const testCollection = db.collection("test");
    
    // Add a test document
    const testDoc: MongoTestDocument = {
      message: "MongoDB connection works!",
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || "development"
    };
    
    const result = await testCollection.insertOne(testDoc);
    
    // Clean up the test document to avoid cluttering the database
    await testCollection.deleteOne({ _id: result.insertedId });
    
    res.status(200).json({
      success: true,
      message: "✅ MongoDB connected successfully!",
      documentId: result.insertedId.toString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("MongoDB test route error:", error);
    
    res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;