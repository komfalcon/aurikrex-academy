import { ValidationError } from './errors.js';
/**
 * Common validation rules
 */
export const rules = {
    required: (fieldName) => ({
        validate: (value) => value !== undefined && value !== null && value !== '',
        message: `${fieldName} is required`
    }),
    minLength: (fieldName, min) => ({
        validate: (value) => !value || value.length >= min,
        message: `${fieldName} must be at least ${min} characters long`
    }),
    maxLength: (fieldName, max) => ({
        validate: (value) => !value || value.length <= max,
        message: `${fieldName} must be no more than ${max} characters long`
    }),
    email: (fieldName) => ({
        validate: (value) => !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
        message: `${fieldName} must be a valid email address`
    }),
    url: (fieldName) => ({
        validate: (value) => !value || /^https?:\/\/.+\..+$/i.test(value),
        message: `${fieldName} must be a valid URL`
    }),
    enum: (fieldName, allowedValues) => ({
        validate: (value) => !value || allowedValues.includes(value),
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`
    }),
    number: (fieldName) => ({
        validate: (value) => !value || !isNaN(Number(value)),
        message: `${fieldName} must be a number`
    }),
    min: (fieldName, min) => ({
        validate: (value) => !value || value >= min,
        message: `${fieldName} must be at least ${min}`
    }),
    max: (fieldName, max) => ({
        validate: (value) => !value || value <= max,
        message: `${fieldName} must be no more than ${max}`
    }),
    array: (fieldName) => ({
        validate: (value) => !value || Array.isArray(value),
        message: `${fieldName} must be an array`
    }),
    arrayMinLength: (fieldName, min) => ({
        validate: (value) => !value || value.length >= min,
        message: `${fieldName} must contain at least ${min} items`
    }),
    arrayMaxLength: (fieldName, max) => ({
        validate: (value) => !value || value.length <= max,
        message: `${fieldName} must contain no more than ${max} items`
    })
};
/**
 * Validates an object against a schema
 */
export function validateSchema(data, schema) {
    const errors = [];
    for (const [key, rules] of Object.entries(schema)) {
        const value = data[key];
        for (const rule of rules) {
            try {
                if (!rule.validate(value)) {
                    errors.push(rule.message);
                }
            }
            catch (error) {
                errors.push(`Validation error for ${key}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    if (errors.length > 0) {
        throw new ValidationError('Validation failed', {
            errors,
            invalidFields: Object.keys(schema).filter(key => !schema[key].every(rule => {
                try {
                    return rule.validate(data[key]);
                }
                catch {
                    return false;
                }
            }))
        });
    }
}
//# sourceMappingURL=validation.js.map