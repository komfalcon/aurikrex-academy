import { ValidationError } from './errors';

/**
 * Type for validation rules
 */
export type ValidationRule<T> = {
  validate: (value: T | undefined) => boolean;
  message: string;
};

/**
 * Type for validation schema
 */
export type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule<T[K]>[];
};

/**
 * Common validation rules
 */
export const rules = {
  required: (fieldName: string): ValidationRule<any> => ({
    validate: (value: any) => value !== undefined && value !== null && value !== '',
    message: `${fieldName} is required`
  }),

  minLength: (fieldName: string, min: number): ValidationRule<string> => ({
    validate: (value: string | undefined) => !value || value.length >= min,
    message: `${fieldName} must be at least ${min} characters long`
  }),

  maxLength: (fieldName: string, max: number): ValidationRule<string> => ({
    validate: (value: string | undefined) => !value || value.length <= max,
    message: `${fieldName} must be no more than ${max} characters long`
  }),

  email: (fieldName: string): ValidationRule<string> => ({
    validate: (value: string | undefined) => 
      !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
    message: `${fieldName} must be a valid email address`
  }),

  url: (fieldName: string): ValidationRule<string> => ({
    validate: (value: string | undefined) =>
      !value || /^https?:\/\/.+\..+$/i.test(value),
    message: `${fieldName} must be a valid URL`
  }),

  enum: <T extends string>(fieldName: string, allowedValues: T[]): ValidationRule<T> => ({
    validate: (value: T | undefined) => !value || allowedValues.includes(value),
    message: `${fieldName} must be one of: ${allowedValues.join(', ')}`
  }),

  number: (fieldName: string): ValidationRule<any> => ({
    validate: (value: any) => !value || !isNaN(Number(value)),
    message: `${fieldName} must be a number`
  }),

  min: (fieldName: string, min: number): ValidationRule<number> => ({
    validate: (value: number | undefined) => !value || value >= min,
    message: `${fieldName} must be at least ${min}`
  }),

  max: (fieldName: string, max: number): ValidationRule<number> => ({
    validate: (value: number | undefined) => !value || value <= max,
    message: `${fieldName} must be no more than ${max}`
  }),

  array: (fieldName: string): ValidationRule<any> => ({
    validate: (value: any) => !value || Array.isArray(value),
    message: `${fieldName} must be an array`
  }),

  arrayMinLength: (fieldName: string, min: number): ValidationRule<any[]> => ({
    validate: (value: any[] | undefined) => !value || value.length >= min,
    message: `${fieldName} must contain at least ${min} items`
  }),

  arrayMaxLength: (fieldName: string, max: number): ValidationRule<any[]> => ({
    validate: (value: any[] | undefined) => !value || value.length <= max,
    message: `${fieldName} must contain no more than ${max} items`
  })
};

/**
 * Validates an object against a schema
 */
export function validateSchema<T extends object>(
  data: T,
  schema: ValidationSchema<T>
): void {
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key as keyof T];
    
    for (const rule of rules as ValidationRule<any>[]) {
      try {
        if (!rule.validate(value)) {
          errors.push(rule.message);
        }
      } catch (error) {
        errors.push(`Validation error for ${key}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', {
      errors,
      invalidFields: Object.keys(schema).filter(key => 
        !schema[key as keyof T].every(rule => {
          try {
            return rule.validate(data[key as keyof T]);
          } catch {
            return false;
          }
        })
      )
    });
  }
}