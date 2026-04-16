import type { Request, Response, NextFunction } from 'express';

/**
 * Requires the request to be authenticated as a connected or empowered account
 * with active standing.
 *
 * IMPORTANT: Does NOT check completed_onboarding. connected_no_compass users
 * (completed_onboarding: false) MUST pass this guard — calibration is not a write gate.
 */
export function requireConnected(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    res.status(403).json({ error: 'Connected account required', reason: 'tier' });
    return;
  }

  if (user.tier !== 'connected' && user.tier !== 'empowered') {
    res.status(403).json({ error: 'Connected account required', reason: 'tier' });
    return;
  }

  if (user.account_standing !== 'active') {
    res.status(403).json({ error: 'Account suspended', reason: 'suspended' });
    return;
  }

  next();
}
