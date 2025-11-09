import { Request } from 'express';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ExtendedRequest extends Request {
  context: {
    requestId: string;
    startTime: number;
    path: string;
    method: string;
    ip: string;
    userId?: string;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'no-data' | 'disconnected';
    auth: 'connected' | 'error' | 'disconnected';
    storage: 'connected' | 'error' | 'disconnected';
  };
  message: string;
  error?: {
    message: string;
    code?: string;
  };
}