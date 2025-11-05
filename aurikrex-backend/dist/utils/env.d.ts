declare const envVars: {
    readonly NODE_ENV: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "NODE_ENV must be 'development', 'production', or 'test'";
    };
    readonly PORT: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "PORT must be a positive number";
    };
    readonly HOST: {
        readonly required: false;
        readonly default: "localhost";
        readonly validate: (value: string) => boolean;
        readonly message: "HOST must be a non-empty string";
    };
    readonly FIREBASE_PROJECT_ID: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "FIREBASE_PROJECT_ID must be a non-empty string";
    };
    readonly FIREBASE_PRIVATE_KEY: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "FIREBASE_PRIVATE_KEY appears to be invalid";
    };
    readonly FIREBASE_CLIENT_EMAIL: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "FIREBASE_CLIENT_EMAIL must be a valid email address";
    };
    readonly ALLOWED_ORIGINS: {
        readonly required: false;
        readonly default: "http://localhost:3000";
        readonly validate: (value: string) => boolean;
        readonly message: "ALLOWED_ORIGINS must be a comma-separated list of valid URLs or \"*\"";
    };
    readonly JWT_SECRET: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "JWT_SECRET must be at least 32 characters long";
    };
    readonly JWT_EXPIRY: {
        readonly required: false;
        readonly default: "1d";
        readonly validate: (value: string) => boolean;
        readonly message: "JWT_EXPIRY must be in format: <number>[h|d|w|m|y]";
    };
    readonly RATE_LIMIT_WINDOW: {
        readonly required: false;
        readonly default: "900000";
        readonly validate: (value: string) => boolean;
        readonly message: "RATE_LIMIT_WINDOW must be a positive number";
    };
    readonly RATE_LIMIT_MAX: {
        readonly required: false;
        readonly default: "100";
        readonly validate: (value: string) => boolean;
        readonly message: "RATE_LIMIT_MAX must be a positive number";
    };
    readonly OPENAI_API_KEY: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "OPENAI_API_KEY must be a valid OpenAI API key starting with sk-";
    };
    readonly GEMINI_API_KEY: {
        readonly required: true;
        readonly validate: (value: string) => boolean;
        readonly message: "GEMINI_API_KEY must be a non-empty string";
    };
    readonly CLAUDE_API_KEY: {
        readonly required: false;
        readonly validate: (value: string) => boolean;
        readonly message: "CLAUDE_API_KEY must be a non-empty string when provided";
    };
    readonly REDIS_URL: {
        readonly required: false;
        readonly default: "redis://localhost:6379";
        readonly validate: (value: string) => boolean;
        readonly message: "REDIS_URL must be a valid Redis URL starting with redis://";
    };
};
type EnvVars = typeof envVars;
/**
 * Validates all environment variables based on defined rules
 */
export declare function validateEnv(): Record<keyof EnvVars, string>;
export default validateEnv;
