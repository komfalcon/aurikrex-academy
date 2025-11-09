import { Router, Request, Response } from "express";
import { db } from "../config/firebase";

const router = Router();

interface FirebaseTestDocument {
  message: string;
  timestamp: number;
  environment: string;
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const testRef = db.collection("test");
    
    // Add a test document
    const testDoc: FirebaseTestDocument = {
      message: "Firebase connection works!",
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || "development"
    };
    
    const docRef = await testRef.add(testDoc);
    
    // Clean up the test document to avoid cluttering the database
    await docRef.delete();
    
    res.status(200).json({
      success: true,
      message: "✅ Firebase connected successfully!",
      documentId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Firebase test route error:", error);
    
    res.status(500).json({
      success: false,
      message: "Firebase connection failed",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    });
  }
});

export default router;