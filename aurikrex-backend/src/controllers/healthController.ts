import { Request, Response } from 'express';
import os from 'os';
import { log } from '../utils/logger';

export const systemInfo = async (_req: Request, res: Response): Promise<void> => {
  try {
    const info = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem()
        },
        cpu: {
          cores: os.cpus().length,
          model: os.cpus()[0].model,
          loadAvg: os.loadavg()
        }
      },
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        version: process.env.npm_package_version
      }
    };

    res.status(200).json(info);
  } catch (error) {
    log.error('Error getting system info', { error });
    res.status(500).json({
      status: 'error',
      message: 'Could not retrieve system information'
    });
  }
};