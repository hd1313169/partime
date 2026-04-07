import { Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidLogPayload } from '../http/validate';
import { AppError } from '../http/error';

export function createLogsRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get('/logs', (_req, res) => {
    res.json({ data: service.listLogs() });
  });

  router.post('/logs', (req, res) => {
    assertValidLogPayload(req.body);
    const created = service.createLog(req.body);
    res.status(201).json({ data: created });
  });

  router.put('/logs/:id', (req, res) => {
    assertValidLogPayload(req.body);
    if (req.body.id !== req.params.id) {
      throw new AppError('VALIDATION_ERROR', 400, 'Path id and body id must match', {
        pathId: req.params.id,
        bodyId: req.body.id,
      });
    }
    const updated = service.updateLog(req.params.id, req.body);
    res.json({ data: updated });
  });

  router.delete('/logs/:id', (req, res) => {
    service.deleteLog(req.params.id);
    res.status(204).send();
  });

  return router;
}
