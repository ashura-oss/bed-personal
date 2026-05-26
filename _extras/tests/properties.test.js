// ⚠️ DO NOT MODIFY THIS FILE — it contains property-based tests for the project infrastructure.

import fc from 'fast-check';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ERROR_CODES, AppError, errorHandler } from '../../src/utils/_errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Property-based tests for correctness properties defined in the design document.
 * Uses fast-check for property-based testing with Jest as the test runner.
 */

// Feature: student-assignment-template, Property 1: Structured error responses
// Validates: Requirements 8.1
describe('Property 1: Structured error responses', () => {
  it('errorHandler returns { error: { code, message, status } } for any AppError', () => {
    const errorCodeKeys = Object.keys(ERROR_CODES);

    fc.assert(
      fc.property(
        fc.constantFrom(...errorCodeKeys),
        fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        (code, details) => {
          const err = new AppError(code, details);

          // Mock Express res object
          let capturedStatus = null;
          let capturedBody = null;
          const res = {
            status(s) {
              capturedStatus = s;
              return this;
            },
            json(body) {
              capturedBody = body;
              return this;
            },
          };
          const req = {};
          const next = () => { };

          errorHandler(err, req, res, next);

          // Verify response shape
          expect(capturedBody).toBeDefined();
          expect(capturedBody).toHaveProperty('error');
          expect(capturedBody.error).toHaveProperty('code');
          expect(capturedBody.error).toHaveProperty('message');
          expect(capturedBody.error).toHaveProperty('status');

          // Verify value constraints
          expect(typeof capturedBody.error.code).toBe('string');
          expect(capturedBody.error.code.length).toBeGreaterThan(0);
          expect(typeof capturedBody.error.message).toBe('string');
          expect(capturedBody.error.message.length).toBeGreaterThan(0);
          expect(typeof capturedBody.error.status).toBe('number');
          expect(capturedBody.error.status).toBeGreaterThanOrEqual(100);
          expect(capturedBody.error.status).toBeLessThanOrEqual(599);

          // Verify status on res matches body
          expect(capturedStatus).toBe(capturedBody.error.status);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: student-assignment-template, Property 2: Error code map completeness
// Validates: Requirements 8.6
describe('Property 2: Error code map completeness', () => {
  it('every ERROR_CODES entry has a valid HTTP status (100-599) and non-empty message', () => {
    const entries = Object.entries(ERROR_CODES);

    // Ensure the map is not empty
    expect(entries.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...entries),
        ([key, value]) => {
          // Each entry must have a status field that is a number 100-599
          expect(typeof value.status).toBe('number');
          expect(value.status).toBeGreaterThanOrEqual(100);
          expect(value.status).toBeLessThanOrEqual(599);
          expect(Number.isInteger(value.status)).toBe(true);

          // Each entry must have a message field that is a non-empty string
          expect(typeof value.message).toBe('string');
          expect(value.message.length).toBeGreaterThan(0);

          // The key itself should be a non-empty string
          expect(typeof key).toBe('string');
          expect(key.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: student-assignment-template, Property 7: MVC separation
// Validates: Requirements 10.4
describe('Property 7: MVC separation — models have no HTTP concerns', () => {
  let modelFiles = [];

  beforeAll(async () => {
    const modelsDir = path.resolve(__dirname, '..', '..', 'src', 'models');
    const entries = await fs.readdir(modelsDir);
    const jsFiles = entries.filter((f) => f.endsWith('.js'));

    modelFiles = await Promise.all(
      jsFiles.map(async (filename) => {
        const filePath = path.join(modelsDir, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return { filename, content };
      })
    );
  });

  it('no model file imports express or HTTP-related modules', () => {
    if (modelFiles.length === 0) {
      return;
    }

    // HTTP-related patterns: importing express, referencing req/res as parameters
    const httpImportPatterns = [
      /import\s+.*from\s+['"]express['"]/,
      /import\s+.*from\s+['"]http['"]/,
      /import\s+.*from\s+['"]https['"]/,
      /require\s*\(\s*['"]express['"]\s*\)/,
      /require\s*\(\s*['"]http['"]\s*\)/,
      /require\s*\(\s*['"]https['"]\s*\)/,
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...modelFiles),
        (file) => {
          for (const pattern of httpImportPatterns) {
            expect(file.content).not.toMatch(pattern);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('no model file references req or res parameters', () => {
    if (modelFiles.length === 0) {
      return;
    }

    // Patterns that indicate HTTP handler signatures: (req, res), (req, res, next)
    const httpParamPatterns = [
      /=\s*(?:async\s*)?\([^)]*\breq\b/,
      /=\s*(?:async\s*)?\([^)]*\bres\b/,
      /\(\s*\breq\b\s*,\s*\bres\b/,
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...modelFiles),
        (file) => {
          for (const pattern of httpParamPatterns) {
            expect(file.content).not.toMatch(pattern);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});



// Properties 9 and 10 were intentionally removed.
// This template no longer ships starter MVC files to assert against.




