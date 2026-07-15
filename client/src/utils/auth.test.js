import { describe, expect, it } from 'vitest';
import { isTokenExpired } from './auth';

const createUnsignedToken = (payload, scheme = 'JWT') => {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64url');

  return `${scheme} ${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
};

describe('isTokenExpired', () => {
  it('treats a malformed token as expired', () => {
    expect(isTokenExpired('not-a-jwt')).toBe(true);
  });

  it('accepts the JWT scheme used by the backend', () => {
    const token = createUnsignedToken({
      exp: Math.floor(Date.now() / 1000) + 60,
    });

    expect(isTokenExpired(token)).toBe(false);
  });

  it('treats a token inside the ten-second buffer as expired', () => {
    const token = createUnsignedToken({
      exp: Math.floor(Date.now() / 1000) + 5,
    });

    expect(isTokenExpired(token)).toBe(true);
  });

  it('preserves the documented behavior for a token without exp', () => {
    expect(isTokenExpired(createUnsignedToken({ sub: 'demo-user' }))).toBe(false);
  });
});
