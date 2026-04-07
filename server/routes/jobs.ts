import { Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidJobPayload } from '../http/validate';
import { AppError } from '../http/error';

export function createJobsRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get('/jobs', (_req, res) => {
    res.json({ data: service.listJobs() });
  });

  router.post('/jobs', (req, res) => {
    assertValidJobPayload(req.body);
    const created = service.createJob(req.body);
    res.status(201).json({ data: created });
  });

  router.put('/jobs/:id', (req, res) => {
    assertValidJobPayload(req.body);
    if (req.body.id !== req.params.id) {
      throw new AppError('VALIDATION_ERROR', 400, 'Path id and body id must match', {
        pathId: req.params.id,
        bodyId: req.body.id,
      });
    }
    const updated = service.updateJob(req.params.id, req.body);
    res.json({ data: updated });
  });

  router.delete('/jobs/:id', (req, res) => {
    service.deleteJob(req.params.id);
    res.status(204).send();
  });

  return router;
}
