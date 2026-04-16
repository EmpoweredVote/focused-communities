import { describe, it, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireConnected } from '../tierGuards.js';
import type { AccountUser } from '../auth.js';

// Build minimal mock Express req/res/next objects
function makeMocks(user?: AccountUser) {
  const req = { user } as Request;

  let nextCalled = false;
  let responseData: { statusCode: number; body: unknown } | null = null;

  const res = {
    status(code: number) {
      return {
        json(body: unknown) {
          responseData = { statusCode: code, body };
          return res;
        },
      };
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getResponse: () => responseData,
    wasNextCalled: () => nextCalled,
  };
}

const baseUser: AccountUser = {
  id: 'test-uuid',
  tier: 'connected',
  account_standing: 'active',
  completed_onboarding: true,
  display_name: 'TestUser',
};

describe('requireConnected', () => {
  it('returns 403 with reason tier when req.user is undefined', () => {
    const { req, res, next, getResponse, wasNextCalled } = makeMocks(undefined);
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(false);
    expect(getResponse()?.statusCode).toBe(403);
    expect((getResponse()?.body as Record<string, string>).reason).toBe('tier');
  });

  it('returns 403 with reason tier for inform tier user', () => {
    const { req, res, next, getResponse, wasNextCalled } = makeMocks({
      ...baseUser,
      tier: 'inform',
    });
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(false);
    expect(getResponse()?.statusCode).toBe(403);
    expect((getResponse()?.body as Record<string, string>).reason).toBe('tier');
  });

  it('calls next for connected tier with active standing', () => {
    const { req, res, next, wasNextCalled } = makeMocks({
      ...baseUser,
      tier: 'connected',
      account_standing: 'active',
    });
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(true);
  });

  it('calls next for empowered tier with active standing', () => {
    const { req, res, next, wasNextCalled } = makeMocks({
      ...baseUser,
      tier: 'empowered',
      account_standing: 'active',
    });
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(true);
  });

  it('returns 403 with reason suspended for suspended account', () => {
    const { req, res, next, getResponse, wasNextCalled } = makeMocks({
      ...baseUser,
      tier: 'connected',
      account_standing: 'suspended',
    });
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(false);
    expect(getResponse()?.statusCode).toBe(403);
    expect((getResponse()?.body as Record<string, string>).reason).toBe('suspended');
  });

  it('calls next for connected_no_compass (completed_onboarding: false) — calibration is NOT a write gate', () => {
    const { req, res, next, wasNextCalled } = makeMocks({
      ...baseUser,
      tier: 'connected',
      account_standing: 'active',
      completed_onboarding: false,
    });
    requireConnected(req, res, next);
    expect(wasNextCalled()).toBe(true);
  });
});
