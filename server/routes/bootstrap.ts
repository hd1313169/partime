import { NextFunction, Request, Response, Router } from 'express';
import { createSalaryService } from '../services/salary-service';

function runAsync(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export function createBootstrapRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get(
    '/bootstrap',
    runAsync(async (_req, res) => {
      res.json({ data: await service.getBootstrapData() });
    }),
  );

  return router;
}
