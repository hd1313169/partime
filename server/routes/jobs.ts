import { NextFunction, Request, Response, Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidJobPayload } from '../http/validate';
import { AppError } from '../http/error';

function runAsync(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export function createJobsRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get(
    '/jobs',
    runAsync(async (_req, res) => {
      res.json({ data: await service.listJobs() });
    }),
  );

  router.post(
    '/jobs',
    runAsync(async (req, res) => {
      assertValidJobPayload(req.body);
      const created = await service.createJob(req.body);
      res.status(201).json({ data: created });
    }),
  );

  router.put(
    '/jobs/:id',
    runAsync(async (req, res) => {
      assertValidJobPayload(req.body);
      if (req.body.id !== req.params.id) {
        throw new AppError('VALIDATION_ERROR', 400, 'Path id and body id must match', {
          pathId: req.params.id,
          bodyId: req.body.id,
        });
      }
      const updated = await service.updateJob(req.params.id, req.body);
      res.json({ data: updated });
    }),
  );

  router.delete(
    '/jobs/:id',
    runAsync(async (req, res) => {
      await service.deleteJob(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
