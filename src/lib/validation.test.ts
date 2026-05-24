import { describe, it, expect } from 'vitest';
import { isEmail, isPhone, required, minLen, validEmail, validPhone, positiveNumber, inRange, combine } from './validation';

describe('isEmail', () => {
  it('accepts valid emails', () => {
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('foo.bar+tag@example.com')).toBe(true);
  });
  it('rejects invalid', () => {
    expect(isEmail('no-at-sign')).toBe(false);
    expect(isEmail('two@@signs.com')).toBe(false);
    expect(isEmail('missing@dot')).toBe(false);
    expect(isEmail('')).toBe(false);
  });
});

describe('isPhone', () => {
  it('accepts digits, spaces, +, -, (, )', () => {
    expect(isPhone('+60 123-456 789')).toBe(true);
    expect(isPhone('(012) 345-6789')).toBe(true);
  });
  it('rejects letters', () => {
    expect(isPhone('abc-1234567')).toBe(false);
  });
});

describe('required', () => {
  it('flags empty/null', () => {
    expect(required('')).not.toBeNull();
    expect(required('   ')).not.toBeNull();
    expect(required(null)).not.toBeNull();
    expect(required(undefined)).not.toBeNull();
  });
  it('passes non-empty', () => {
    expect(required('hello')).toBeNull();
    expect(required(0)).toBeNull();
  });
});

describe('minLen', () => {
  it('checks length', () => {
    expect(minLen('abc', 5)).not.toBeNull();
    expect(minLen('abcdef', 5)).toBeNull();
  });
});

describe('validEmail', () => {
  it('returns error for invalid', () => {
    expect(validEmail('')).not.toBeNull();
    expect(validEmail('bad')).not.toBeNull();
  });
  it('returns null for valid', () => {
    expect(validEmail('a@b.co')).toBeNull();
  });
});

describe('validPhone', () => {
  it('empty string is OK (optional)', () => {
    expect(validPhone('')).toBeNull();
  });
});

describe('positiveNumber', () => {
  it('flags negative', () => {
    expect(positiveNumber(-1)).not.toBeNull();
  });
  it('accepts zero and positive', () => {
    expect(positiveNumber(0)).toBeNull();
    expect(positiveNumber(99)).toBeNull();
  });
  it('flags NaN', () => {
    expect(positiveNumber('abc')).not.toBeNull();
  });
});

describe('inRange', () => {
  it('checks bounds', () => {
    expect(inRange(5, 1, 10)).toBeNull();
    expect(inRange(0, 1, 10)).not.toBeNull();
    expect(inRange(11, 1, 10)).not.toBeNull();
  });
});

describe('combine', () => {
  it('returns first error', () => {
    expect(combine(null, 'second', 'third')).toBe('second');
  });
  it('returns null if all pass', () => {
    expect(combine(null, null)).toBeNull();
  });
});
