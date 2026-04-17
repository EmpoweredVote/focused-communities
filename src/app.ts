import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { communitiesRouter } from './routes/communities.js';
import { stancesRouter } from './routes/stances.js';
import { threadsRouter } from './routes/threads.js';
import { postsRouter } from './routes/posts.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', communitiesRouter);
  app.use('/api', stancesRouter);
  app.use('/api', threadsRouter);
  app.use('/api', postsRouter);
  app.use('/api', usersRouter);

  // Global error handler — must be last
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[error]', err.message);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  return app;
}
