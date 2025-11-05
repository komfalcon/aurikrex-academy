import cors from 'cors';
import { Request, Response } from 'express';
export declare const corsErrorHandler: (err: Error, req: Request, res: Response) => void;
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
