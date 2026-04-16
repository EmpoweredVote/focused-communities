import type { AccountUser } from '../middleware/auth.js';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AccountUser;
    }
  }
}
