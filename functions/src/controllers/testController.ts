import express from "express";
type Request = express.Request;
type Response = express.Response;

export const testController = async (_req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: "Aurikrex backend is working perfectly! 🚀",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
};


