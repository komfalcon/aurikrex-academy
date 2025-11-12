import { config } from 'dotenv';
import { log } from './logger.js';

// Define environment variables with their validation rules
const envVars = {
  // Node environment
  NODE_ENV: {
    required: true,
    validate: (value: string) => ['development', 'production', 'test'].includes(value),
    message: "NODE_ENV must be 'development', 'production', or 'test'"
  },

  // Server configuration
  PORT: {
    required: true,
    validate: (value: string) => !isNaN(Number(value)) && Number(value) > 0,
    message: 'PORT must be a positive number'
  },
  HOST: {
    required: false,
    default: 'localhost',
    validate: (value: string) => typeof value === 'string' && value.length > 0,
    message: 'HOST must be a non-empty string'
  },

  // MongoDB configuration
  MONGO_URI: {
    required: true,
    validate: (value: string) => value.startsWith('mongodb') && value.includes('@'),
    message: 'MONGO_URI must be a valid MongoDB connection string'
  },
  MONGO_DB_NAME: {
    required: false,
    default: 'aurikrex-academy',
    validate: (value: string) => typeof value === 'string' && value.length > 0,
    message: 'MONGO_DB_NAME must be a non-empty string'
  },

  // Firebase configuration (Optional - for storage only)
  FIREBASE_PROJECT_ID: {
    required: false,
    validate: (value: string) => typeof value === 'string' && value.length > 0,
    message: 'FIREBASE_PROJECT_ID must be a non-empty string'
  },
  FIREBASE_PRIVATE_KEY: {
    required: false,
    validate: (value: string) => value.includes('PRIVATE KEY'),
    message: 'FIREBASE_PRIVATE_KEY appears to be invalid'
  },
  FIREBASE_CLIENT_EMAIL: {
    required: false,
    validate: (value: string) => value.includes('@') && value.includes('.'),
    message: 'FIREBASE_CLIENT_EMAIL must be a valid email address'
  },
  FIREBASE_STORAGE_BUCKET: {
    required: false,
    validate: (value: string) => value.includes('.appspot.com'),
    message: 'FIREBASE_STORAGE_BUCKET must be a valid Firebase storage bucket'
  },

  // Security settings
  ALLOWED_ORIGINS: {
    required: false,
    default: 'https://aurikrex-backend.onrender.com',
    validate: (value: string) => value.split(',').every(origin => 
      origin === '*' || origin.startsWith('http://') || origin.startsWith('https://')
    ),
    message: 'ALLOWED_ORIGINS must be a comma-separated list of valid URLs or "*"'
  },
  JWT_SECRET: {
    required: false,
    default: 'your-super-secret-jwt-key-change-this-in-production',
    validate: (value: string) => typeof value === 'string' && value.length >= 32,
    message: 'JWT_SECRET must be at least 32 characters long'
  },
  ACCESS_TOKEN_EXPIRY: {
    required: false,
    default: '1h',
    validate: (value: string) => /^\d+[hdwmy]$/.test(value),
    message: 'ACCESS_TOKEN_EXPIRY must be in format: <number>[h|d|w|m|y]'
  },
  REFRESH_TOKEN_EXPIRY: {
    required: false,
    default: '7d',
    validate: (value: string) => /^\d+[hdwmy]$/.test(value),
    message: 'REFRESH_TOKEN_EXPIRY must be in format: <number>[h|d|w|m|y]'
  },

  // Rate limiting
  RATE_LIMIT_WINDOW: {
    required: false,
    default: '900000', // 15 minutes
    validate: (value: string) => !isNaN(Number(value)) && Number(value) > 0,
    message: 'RATE_LIMIT_WINDOW must be a positive number'
  },
  RATE_LIMIT_MAX: {
    required: false,
    default: '100',
    validate: (value: string) => !isNaN(Number(value)) && Number(value) > 0,
    message: 'RATE_LIMIT_MAX must be a positive number'
  },

  // AI Service Configuration
  OPENAI_API_KEY: {
    required: true,
    validate: (value: string) => value.startsWith('sk-'),
    message: 'OPENAI_API_KEY must be a valid OpenAI API key starting with sk-'
  },
  GEMINI_API_KEY: {
    required: false,
    validate: (value: string) => value.length > 0,
    message: 'GEMINI_API_KEY must be a non-empty string'
  },
  CLAUDE_API_KEY: {
    required: false,
    validate: (value: string) => value.length > 0,
    message: 'CLAUDE_API_KEY must be a non-empty string when provided'
  },

  // Optional Redis for caching
  REDIS_URL: {
    required: false,
    default: 'redis://localhost:6379',
    validate: (value: string) => value.startsWith('redis://'),
    message: 'REDIS_URL must be a valid Redis URL starting with redis://'
  }
} as const;

type EnvVarConfig = {
  required: boolean;
  validate: (value: string) => boolean;
  message: string;
  default?: string;
};

type EnvVars = typeof envVars;

/**
 * Validates all environment variables based on defined rules
 */
export function validateEnv(): Record<keyof EnvVars, string> {
  // Load environment variables
  config();

  const errors: string[] = [];
  const validatedEnv: Partial<Record<keyof EnvVars, string>> = {};

  // Validate each environment variable
  for (const [key, config] of Object.entries<EnvVarConfig>(envVars)) {
    const value = process.env[key] || config.default;

    // Check if required
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key}`);
      continue;
    }

    // Skip validation if not required and no value provided
    if (!config.required && !value) {
      continue;
    }

    // Validate value
    if (value && !config.validate(value)) {
      errors.push(`Invalid environment variable ${key}: ${config.message}`);
      continue;
    }

    validatedEnv[key as keyof EnvVars] = value;
  }

  // Log validation results
  if (errors.length > 0) {
    log.error('Environment validation failed', { errors });
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  log.info('Environment validation successful');

  // Type assertion since we've validated all required variables
  return validatedEnv as Record<keyof EnvVars, string>;
}

export default validateEnv;
