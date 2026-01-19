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
    default: '0.0.0.0',
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

  // Security settings
  ALLOWED_ORIGINS: {
    required: false,
    default: 'https://aurikrex.tech,https://www.aurikrex.tech',
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

  REDIS_URL: {
    required: false,
    default: '',
    validate: (value: string) => !value || value.startsWith('redis://') || value.startsWith('rediss://'),
    message: 'REDIS_URL must be a valid Redis URL starting with redis:// or rediss:// (empty to disable caching)'
  },
  
  // Backend URL for redirects and callbacks
  BACKEND_URL: {
    required: false,
    default: 'http://localhost:5000',
    validate: (value: string) => value.startsWith('http://') || value.startsWith('https://'),
    message: 'BACKEND_URL must be a valid URL'
  },
  
  // Frontend URL for redirects
  FRONTEND_URL: {
    required: false,
    default: 'https://aurikrex.tech',
    validate: (value: string) => value.startsWith('http://') || value.startsWith('https://'),
    message: 'FRONTEND_URL must be a valid URL'
  },
  
  // Google OAuth
  GOOGLE_CLIENT_ID: {
    required: false,
    default: '',
    validate: (value: string) => !value || value.length > 0,
    message: 'GOOGLE_CLIENT_ID must be a non-empty string when provided'
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    default: '',
    validate: (value: string) => !value || value.length > 0,
    message: 'GOOGLE_CLIENT_SECRET must be a non-empty string when provided'
  },
  GOOGLE_CALLBACK_URL: {
    required: false,
    default: '',
    validate: (value: string) => !value || value.startsWith('http://') || value.startsWith('https://'),
    message: 'GOOGLE_CALLBACK_URL must be a valid URL when provided'
  },
  
  // Gmail SMTP configuration (for email sending)
  GMAIL_HOST: {
    required: false,
    default: 'smtp.gmail.com',
    validate: (value: string) => value.length > 0,
    message: 'GMAIL_HOST must be a non-empty string'
  },
  GMAIL_PORT: {
    required: false,
    default: '465',
    validate: (value: string) => !isNaN(Number(value)) && Number(value) > 0,
    message: 'GMAIL_PORT must be a positive number'
  },
  GMAIL_SECURE: {
    required: false,
    default: 'true',
    validate: (value: string) => ['true', 'false'].includes(value),
    message: 'GMAIL_SECURE must be "true" or "false"'
  },
  GMAIL_EMAIL: {
    required: false,
    default: '',
    validate: (value: string) => !value || value.includes('@'),
    message: 'GMAIL_EMAIL must be a valid email address when provided'
  },
  GMAIL_APP_PASSWORD: {
    required: false,
    default: '',
    validate: (_value: string) => true, // Optional - empty or any value is valid
    message: 'GMAIL_APP_PASSWORD is optional'
  },

  // FalkeAI Configuration (required for AI features)
  FALKEAI_API_BASE_URL: {
    required: true,
    validate: (value: string) => value.startsWith('http://') || value.startsWith('https://'),
    message: 'FALKEAI_API_BASE_URL is required and must be a valid URL'
  },
  FALKEAI_API_KEY: {
    required: true,
    validate: (value: string) => value.length > 0,
    message: 'FALKEAI_API_KEY is required and must be a non-empty string'
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
