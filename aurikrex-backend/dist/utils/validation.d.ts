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
export declare const rules: {
    required: (fieldName: string) => ValidationRule<any>;
    minLength: (fieldName: string, min: number) => ValidationRule<string>;
    maxLength: (fieldName: string, max: number) => ValidationRule<string>;
    email: (fieldName: string) => ValidationRule<string>;
    url: (fieldName: string) => ValidationRule<string>;
    enum: <T extends string>(fieldName: string, allowedValues: T[]) => ValidationRule<T>;
    number: (fieldName: string) => ValidationRule<any>;
    min: (fieldName: string, min: number) => ValidationRule<number>;
    max: (fieldName: string, max: number) => ValidationRule<number>;
    array: (fieldName: string) => ValidationRule<any>;
    arrayMinLength: (fieldName: string, min: number) => ValidationRule<any[]>;
    arrayMaxLength: (fieldName: string, max: number) => ValidationRule<any[]>;
};
/**
 * Validates an object against a schema
 */
export declare function validateSchema<T extends object>(data: T, schema: ValidationSchema<T>): void;
