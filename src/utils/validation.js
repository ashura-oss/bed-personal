import { AppError } from './_errors.js';

export const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('VALIDATION_ERROR', `${fieldName} must be a positive integer`);
  }

  return parsed;
};

export const requireText = (value, fieldName, maxLength = 60) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', `${fieldName} is required`);
  }

  const trimmed = value.trim();

  if (trimmed.length > maxLength) {
    throw new AppError('VALIDATION_ERROR', `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return trimmed;
};
