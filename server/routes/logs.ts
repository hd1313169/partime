import { NextFunction, Request, Response, Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidLogPayload } from '../http/validate';
import { AppError } from '../http/error';

function runAsync(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export function createLogsRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get(
    '/logs',
    runAsync(async (_req, res) => {
      res.json({ data: await service.listLogs() });
    }),
  );

  router.post(
    '/logs',
    runAsync(async (req, res) => {
      assertValidLogPayload(req.body);
      const created = await service.createLog(req.body);
      res.status(201).json({ data: created });
    }),
  );

  router.put(
    '/logs/:id',
    runAsync(async (req, res) => {
      assertValidLogPayload(req.body);
      if (req.body.id !== req.params.id) {
        throw new AppError('VALIDATION_ERROR', 400, 'Path id and body id must match', {
          pathId: req.params.id,
          bodyId: req.body.id,
        });
      }
      const updated = await service.updateLog(req.params.id, req.body);
      res.json({ data: updated });
    }),
  );

  router.delete(
    '/logs/:id',
    runAsync(async (req, res) => {
      await service.deleteLog(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
